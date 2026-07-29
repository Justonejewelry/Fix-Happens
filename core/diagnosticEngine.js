function score(evidence = []) {
  const scores = {
    'DHCP Failure': 50,
    'VPN Route Corruption': 20,
    'DNS Failure': 20,
    'Network Preference Corruption': 30
  };

  const text = evidence.join('\n').toLowerCase();

  if (text.includes('no route to host')) {
    scores['DHCP Failure'] += 25;
    scores['DNS Failure'] = 0;
  }

  if (text.includes('no ip') || text.includes('no ipv4')) {
    scores['DHCP Failure'] += 35;
    scores['Network Preference Corruption'] += 10;
  }

  if (text.includes('vpn')) {
    scores['VPN Route Corruption'] += 40;
  }

  return Object.entries(scores)
    .map(([cause, confidence]) => ({
      cause,
      confidence: Math.max(0, Math.min(100, confidence))
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

module.exports = { score };
