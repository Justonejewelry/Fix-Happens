/**
 * Network Scan & Mapping plugin.
 * Pure function: returns suggestions only (no shell execution).
 *
 * Helps field techs map LAN topology, discover hosts, check path/ports,
 * and interpret scan-style evidence (ARP, traceroute, nmap notes, mDNS).
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  const isScanContext =
    /scan|map|discover|topology|subnet|arp|nmap|traceroute|tracepath|ping sweep|host list|port |ports |mdns|bonjour|vlan|wireless survey|site survey|neighbors/.test(
      text
    ) ||
    /who is on|what is on|find device|find host|network map|lan map/.test(text);

  // --- Host discovery / ARP ---
  if (
    /arp|neighbor|no hosts|empty arp|incomplete|incomplete entry|who is on|discover host|host list|ping sweep/.test(
      text
    )
  ) {
    hypotheses.push({ cause: 'Incomplete Host Discovery', confidenceBoost: 18 });
    nextTests.push('arp -a');
    nextTests.push('ping -c 2 <gateway-ip>');
    tips.push(
      'A sparse ARP table often means the local subnet is quiet or ICMP is filtered — try directed pings before concluding devices are offline.'
    );
  }

  // --- Subnet / topology unknown ---
  if (
    /subnet|topology|network map|lan map|what subnet|which vlan|address space|cidr|netmask|gateway unknown/.test(
      text
    )
  ) {
    hypotheses.push({ cause: 'Unknown Subnet Topology', confidenceBoost: 16 });
    nextTests.push('ifconfig');
    nextTests.push('route -n get default');
    nextTests.push('networksetup -getinfo Wi-Fi');
    tips.push(
      'Start from the local interface: IP, mask, and default gateway define the first hop of any map.'
    );
  }

  // --- Path / traceroute / latency ---
  if (
    /traceroute|tracepath|hop|latency|high rtt|packet loss|path|asymmetric|ttl|blackhole|unreachable host/.test(
      text
    )
  ) {
    hypotheses.push({ cause: 'Path / Routing Anomaly', confidenceBoost: 17 });
    nextTests.push('traceroute -n <target>');
    nextTests.push('ping -c 10 <target>');
    tips.push(
      'Compare traceroute to the gateway vs the target; a clean first hop with later drops points past the local LAN.'
    );
  }

  // --- Port / service reachability ---
  if (
    /port |ports |closed port|filtered|nmap|service down|tcp |udp |connect refused|connection timed out|443|22 |80 |3389|445 /.test(
      text
    )
  ) {
    hypotheses.push({ cause: 'Port / Service Unreachable', confidenceBoost: 15 });
    nextTests.push('nc -vz <host> <port>');
    nextTests.push('curl -I --max-time 5 http://<host>');
    tips.push(
      'Distinguish host-down (no ARP/ping) from port-filtered (host up, service closed). Note both in evidence.'
    );
  }

  // --- mDNS / Bonjour / local discovery ---
  if (/mdns|bonjour|dns-sd|airplay|airprint|local\.|_tcp|_udp|zero.?conf/.test(text)) {
    hypotheses.push({ cause: 'mDNS / Local Discovery Failure', confidenceBoost: 14 });
    nextTests.push('dns-sd -B _services._dns-sd._udp');
    nextTests.push('dns-sd -B _ipp._tcp');
    tips.push(
      'mDNS fails across VLANs or when client isolation / AP multicast filtering is on — map L2 domains before blaming the device.'
    );
  }

  // --- VLAN / L2 isolation ---
  if (/vlan|trunk|access port|isolated|client isolation|guest network|wrong vlan|layer 2|l2 /.test(text)) {
    hypotheses.push({ cause: 'VLAN / L2 Isolation', confidenceBoost: 16 });
    nextTests.push('arp -a');
    nextTests.push('ping -c 2 <same-subnet-host>');
    tips.push(
      'If ARP never completes for a same-subnet IP, suspect VLAN mismatch or AP client isolation before Layer-3 tools.'
    );
  }

  // --- Wireless survey / RF mapping ---
  if (
    /wireless survey|site survey|ssid|rssi|signal|channel|roam|band|5 ghz|2\.4|interference|wifi map|access point/.test(
      text
    )
  ) {
    hypotheses.push({ cause: 'Wireless Coverage / RF Issue', confidenceBoost: 15 });
    nextTests.push('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s');
    nextTests.push('networksetup -getairportnetwork en0');
    tips.push(
      'Capture SSID, BSSID, channel, and RSSI at the failure location — a map without RF context is incomplete for Wi-Fi cases.'
    );
  }

  // --- Duplicate IP / conflict ---
  if (/duplicate ip|ip conflict|address conflict|gratuitous arp|two devices same/.test(text)) {
    hypotheses.push({ cause: 'Duplicate IP Address', confidenceBoost: 20 });
    nextTests.push('arp -a');
    nextTests.push('ping -c 3 <suspect-ip>');
    tips.push(
      'Conflicting MACs for one IP in ARP (or flapping) almost always means two devices share an address — fix DHCP reservation or static config.'
    );
  }

  // --- Generic scan/map entry point ---
  if (isScanContext && hypotheses.length === 0) {
    hypotheses.push({ cause: 'Incomplete Host Discovery', confidenceBoost: 10 });
    nextTests.push('arp -a');
    nextTests.push('ifconfig');
    nextTests.push('route -n get default');
    tips.push(
      'Baseline map: local IP/mask → default gateway → ARP neighbors → traceroute to key targets.'
    );
  }

  // Deduplicate nextTests while preserving order
  const seen = new Set();
  const uniqueTests = [];
  for (const t of nextTests) {
    if (!seen.has(t)) {
      seen.add(t);
      uniqueTests.push(t);
    }
  }

  return { hypotheses, tips, nextTests: uniqueTests };
}

module.exports = {
  id: 'network-scan-map',
  name: 'Network Scan & Mapping',
  version: '1.0.0',
  description:
    'Suggests host discovery, topology, path, port, mDNS, VLAN, and wireless survey steps from scan/map evidence',
  diagnose
};
