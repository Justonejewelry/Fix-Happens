/**
 * Shared diagnostic / hypothesis scoring engine.
 * Loads core/causes.json when available; falls back to embedded defaults.
 */

const path = require('path');
const fs = require('fs');

let CAUSES = null;
let BOOSTS = [];

function loadCauses() {
  if (CAUSES) return CAUSES;
  try {
    const p = path.join(__dirname, 'causes.json');
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    CAUSES = raw.causes || {};
    BOOSTS = raw.boosts || [];
  } catch (_) {
    CAUSES = {
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
    BOOSTS = [
      { when: ['no route to host'], cause: 'DHCP Failure', add: 20 },
      { when: ['vpn'], cause: 'VPN Route Corruption', add: 25 },
      { when: ['no ip', 'no ipv4'], cause: 'DHCP Failure', add: 25 }
    ];
  }
  return CAUSES;
}

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

function score(evidence = []) {
  const text = normalizeEvidence(evidence);
  const causes = loadCauses();

  const results = Object.entries(causes).map(([cause, def]) => {
    let confidence = def.base || 0;
    for (const keyword of def.keywords || []) {
      if (text.includes(keyword)) confidence += 18;
    }
    for (const b of BOOSTS) {
      if (b.cause === cause && (b.when || []).some(w => text.includes(w))) {
        confidence += b.add || 0;
      }
    }
    confidence = Math.max(0, Math.min(100, confidence));
    return { cause, confidence, nextTest: def.nextTest || '', category: def.category || 'general' };
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
  loadCauses,
  get BASE_CAUSES() {
    return loadCauses();
  }
};
