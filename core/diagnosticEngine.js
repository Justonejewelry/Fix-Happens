/**
 * Shared diagnostic / hypothesis scoring engine.
 * Consumes evidence strings (or objects) and returns ranked probable causes
 * with confidence scores and suggested next tests.
 * Designed to be usable from both Electron (Node) and future shared services.
 */

const BASE_CAUSES = {
  'DHCP Failure': {
    base: 40,
    keywords: ['no ip', 'no ipv4', 'dhcp', 'no address', 'lease', 'en0', 'no route to host'],
    nextTest: 'ipconfig getifaddr en0'
  },
  'DNS Failure': {
    base: 25,
    keywords: ['dns', 'resolve', 'nxdomain', 'cannot resolve', 'name resolution'],
    nextTest: 'nslookup apple.com'
  },
  'VPN Route Corruption': {
    base: 15,
    keywords: ['vpn', 'utun', 'route corruption', 'tunnel', 'no route'],
    nextTest: 'route -n get default'
  },
  'Network Preference Corruption': {
    base: 30,
    keywords: ['preference', 'networksetup', 'plist', 'configd', 'preferences'],
    nextTest: 'networksetup -getinfo Wi-Fi'
  },
  'Interface Down': {
    base: 20,
    keywords: ['interface down', 'en0 down', 'link down', 'media: none'],
    nextTest: 'ifconfig en0'
  },
  'Firewall Block': {
    base: 10,
    keywords: ['firewall', 'pf', 'blocked', 'deny'],
    nextTest: 'sudo pfctl -s rules'
  }
};

function normalizeEvidence(evidence = []) {
  return evidence
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item.value === 'string') return item.value;
      return String(item);
    })
    .join('\n')
    .toLowerCase();
}

function score(evidence = [], options = {}) {
  const text = normalizeEvidence(evidence);
  const causes = { ...BASE_CAUSES };

  const results = Object.entries(causes).map(([cause, def]) => {
    let confidence = def.base;

    for (const keyword of def.keywords) {
      if (text.includes(keyword)) {
        confidence += 18;
      }
    }

    // Strong signals
    if (text.includes('no route to host') && cause === 'DHCP Failure') confidence += 20;
    if (text.includes('vpn') && cause === 'VPN Route Corruption') confidence += 25;
    if ((text.includes('no ip') || text.includes('no ipv4')) && cause === 'DHCP Failure') confidence += 25;

    confidence = Math.max(0, Math.min(100, confidence));

    return {
      cause,
      confidence,
      nextTest: def.nextTest
    };
  });

  return results
    .filter(r => r.confidence > 5)
    .sort((a, b) => b.confidence - a.confidence);
}

function recommendNextTest(rankedHypotheses = []) {
  if (!rankedHypotheses.length) return null;
  return rankedHypotheses[0].nextTest || null;
}

module.exports = {
  score,
  recommendNextTest,
  BASE_CAUSES
};
