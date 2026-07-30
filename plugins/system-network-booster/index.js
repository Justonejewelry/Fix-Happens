/**
 * System & Network Booster plugin.
 * Pure diagnose(): hypotheses, tips, nextTests, recommendedScans, recommendedFixes.
 * Execution is only via core/scanRunner.js and core/remediationRunner.js when enabled.
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];
  const recommendedScans = [];
  const recommendedFixes = [];

  const boostContext =
    /boost|slow|sluggish|latency|performance|optimize|speed up|network health|dns|proxy|stale|cache|wifi drop|intermittent|no internet|can't connect|cannot connect/.test(
      text
    );

  // --- DNS / resolution hygiene ---
  if (
    /dns|resolve|nxdomain|cannot resolve|name resolution|stale cache|wrong dns|flush dns/.test(
      text
    ) ||
    boostContext
  ) {
    if (/dns|resolve|nxdomain|stale cache|flush dns|wrong dns/.test(text) || boostContext) {
      hypotheses.push({ cause: 'Stale / Misconfigured DNS', confidenceBoost: 16 });
      nextTests.push('networksetup -getdnsservers Wi-Fi');
      nextTests.push('dscacheutil -q host -a name apple.com');
      tips.push(
        'Stale DNS cache or hard-coded bad resolvers cause intermittent "connected but no names". Flush cache, then verify servers; prefer DHCP DNS or known public resolvers (1.1.1.1 / 8.8.8.8).'
      );
      recommendedScans.push({ planId: 'dns-lookup', params: { host: 'apple.com' }, label: 'DNS lookup apple.com' });
      recommendedScans.push({ planId: 'wifi-info', label: 'Wi-Fi info' });
      recommendedFixes.push({ planId: 'flush-dns-cache', label: 'Flush DNS cache' });
      recommendedFixes.push({
        planId: 'show-dns',
        params: { service: 'Wi-Fi' },
        label: 'Show DNS servers'
      });
      if (/wrong dns|bad dns|slow dns|1\.1\.1|8\.8\.8|boost|slow|latency/.test(text)) {
        recommendedFixes.push({
          planId: 'set-dns-cloudflare',
          params: { service: 'Wi-Fi' },
          label: 'Set DNS → Cloudflare'
        });
      }
    }
  }

  // --- DHCP / lease ---
  if (/dhcp|no ip|no ipv4|self.?assigned|169\.254|lease|renew ip|no address/.test(text)) {
    hypotheses.push({ cause: 'DHCP Failure', confidenceBoost: 20 });
    nextTests.push('ipconfig getifaddr en0');
    nextTests.push('ipconfig getpacket en0');
    tips.push(
      'Self-assigned 169.254.x.x means DHCP failed. Renew the lease on the active interface, then power-cycle Wi-Fi if the lease still fails.'
    );
    recommendedScans.push({ planId: 'local-interfaces', label: 'List interfaces' });
    recommendedScans.push({ planId: 'route-default', label: 'Default route' });
    recommendedFixes.push({
      planId: 'renew-dhcp',
      params: { iface: 'en0' },
      label: 'Renew DHCP (en0)'
    });
    recommendedFixes.push({
      planId: 'wifi-power-cycle',
      params: { service: 'Wi-Fi' },
      label: 'Wi-Fi power cycle'
    });
  }

  // --- Proxy / VPN residue ---
  if (/proxy|http proxy|https proxy|pac |wpdas|corporate proxy|vpn left|split tunnel/.test(text)) {
    hypotheses.push({ cause: 'Proxy / VPN Residue', confidenceBoost: 18 });
    nextTests.push('networksetup -getwebproxy Wi-Fi');
    nextTests.push('networksetup -getsecurewebproxy Wi-Fi');
    tips.push(
      'A leftover HTTP/HTTPS proxy after VPN disconnect blocks most apps. Disable web proxies on the active service, then retest.'
    );
    recommendedFixes.push({
      planId: 'disable-web-proxy',
      params: { service: 'Wi-Fi' },
      label: 'Disable HTTP proxy'
    });
    recommendedFixes.push({
      planId: 'disable-secure-proxy',
      params: { service: 'Wi-Fi' },
      label: 'Disable HTTPS proxy'
    });
    recommendedFixes.push({
      planId: 'set-dns-dhcp',
      params: { service: 'Wi-Fi' },
      label: 'Restore DNS → DHCP'
    });
  }

  // --- Wi-Fi instability ---
  if (
    /wifi drop|wi-?fi drop|intermittent|reconnect|airport|rssi|weak signal|keeps disconnecting/.test(
      text
    )
  ) {
    hypotheses.push({ cause: 'Wi-Fi Link Instability', confidenceBoost: 17 });
    nextTests.push('networksetup -getairportnetwork en0');
    nextTests.push(
      '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I'
    );
    tips.push(
      'Power-cycle Wi-Fi, then compare RSSI and noise. If drops continue, survey channels and move closer to the AP before chasing Layer-3 fixes.'
    );
    recommendedScans.push({ planId: 'airport-scan', label: 'Wi-Fi survey' });
    recommendedScans.push({ planId: 'wifi-info', label: 'Wi-Fi info' });
    recommendedFixes.push({
      planId: 'wifi-power-cycle',
      params: { service: 'Wi-Fi' },
      label: 'Wi-Fi power cycle'
    });
  }

  // --- Slow / boost / performance ---
  if (/slow|sluggish|latency|boost|optimize|speed up|performance|throughput|network quality/.test(text)) {
    hypotheses.push({ cause: 'Network Performance Degradation', confidenceBoost: 15 });
    nextTests.push('ping -c 10 1.1.1.1');
    nextTests.push('networkQuality -s');
    tips.push(
      'Booster sequence: (1) measure with networkQuality / ping, (2) flush DNS, (3) ensure no proxy, (4) try Cloudflare DNS if ISP resolvers are slow, (5) Wi-Fi power cycle last.'
    );
    recommendedScans.push({
      planId: 'ping-host',
      params: { host: '1.1.1.1' },
      label: 'Ping 1.1.1.1'
    });
    recommendedScans.push({ planId: 'route-default', label: 'Default route' });
    recommendedFixes.push({ planId: 'network-quality', label: 'Network quality test' });
    recommendedFixes.push({ planId: 'flush-dns-cache', label: 'Flush DNS cache' });
    recommendedFixes.push({
      planId: 'set-dns-cloudflare',
      params: { service: 'Wi-Fi' },
      label: 'Set DNS → Cloudflare'
    });
    recommendedFixes.push({
      planId: 'disable-web-proxy',
      params: { service: 'Wi-Fi' },
      label: 'Disable HTTP proxy'
    });
  }

  // --- System cache pressure (read-only hint) ---
  if (/disk full|no space|cache|purge|storage full|slow mac|low disk/.test(text)) {
    hypotheses.push({ cause: 'User Cache Pressure', confidenceBoost: 12 });
    nextTests.push('df -h');
    nextTests.push('du -sh ~/Library/Caches');
    tips.push(
      'Large ~/Library/Caches can slow apps. Measure first (read-only). Delete only known-safe caches after confirming free space on the volume.'
    );
    recommendedFixes.push({
      planId: 'purge-user-caches-hint',
      label: 'Measure user caches'
    });
  }

  // --- Print queue stuck (boost adjacent) ---
  if (/print queue|jobs stuck|spool|cancel all/.test(text)) {
    hypotheses.push({ cause: 'Printer Offline', confidenceBoost: 14 });
    tips.push('Clearing the local CUPS queue unblocks stuck jobs before chasing drivers.');
    recommendedFixes.push({ planId: 'cancel-all-print-jobs', label: 'Cancel all print jobs' });
  }

  // --- Generic boost entry ---
  if (boostContext && hypotheses.length === 0) {
    hypotheses.push({ cause: 'Network Performance Degradation', confidenceBoost: 10 });
    nextTests.push('ifconfig');
    nextTests.push('ping -c 5 1.1.1.1');
    tips.push(
      'Baseline boost: interfaces → default route → DNS servers → ping → optional networkQuality → apply DNS flush / Cloudflare / Wi-Fi cycle as needed.'
    );
    recommendedScans.push({ planId: 'local-interfaces', label: 'List interfaces' });
    recommendedScans.push({ planId: 'route-default', label: 'Default route' });
    recommendedFixes.push({ planId: 'flush-dns-cache', label: 'Flush DNS cache' });
    recommendedFixes.push({ planId: 'network-quality', label: 'Network quality test' });
  }

  // Deduplicate
  const dedupe = (arr, keyFn) => {
    const seen = new Set();
    const out = [];
    for (const item of arr) {
      const k = keyFn(item);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(item);
    }
    return out;
  };

  return {
    hypotheses,
    tips: dedupe(tips, (t) => t),
    nextTests: dedupe(nextTests, (t) => t),
    recommendedScans: dedupe(
      recommendedScans,
      (s) => s.planId + ':' + JSON.stringify(s.params || {})
    ),
    recommendedFixes: dedupe(
      recommendedFixes,
      (s) => s.planId + ':' + JSON.stringify(s.params || {})
    )
  };
}

module.exports = {
  id: 'system-network-booster',
  name: 'System & Network Booster',
  version: '1.0.0',
  description:
    'Network health, DNS/proxy hygiene, Wi-Fi stability, and performance boost with allowlisted auto-fix recommendations',
  diagnose
};
