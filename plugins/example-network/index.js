/**
 * Example Network Diagnostics plugin.
 * Pure function: returns suggestions only (no shell execution).
 */

function diagnose(context) {
  const text = [context.symptom || '', ...(context.evidence || [])]
    .join('\n')
    .toLowerCase();

  const hypotheses = [];
  const tips = [];
  const nextTests = [];

  if (/no route|no ip|dhcp|no internet|wifi|wi-fi/.test(text)) {
    hypotheses.push({ cause: 'DHCP Failure', confidenceBoost: 10 });
    nextTests.push('ipconfig getifaddr en0');
    tips.push('Confirm link status before assuming DHCP failure.');
  }
  if (/dns|resolve|nxdomain/.test(text)) {
    hypotheses.push({ cause: 'DNS Failure', confidenceBoost: 12 });
    nextTests.push('nslookup apple.com');
  }
  if (/vpn|utun|tunnel/.test(text)) {
    hypotheses.push({ cause: 'VPN Route Corruption', confidenceBoost: 15 });
    nextTests.push('route -n get default');
    tips.push('VPN clients often steal the default route.');
  }

  return { hypotheses, tips, nextTests };
}

module.exports = {
  id: 'example-network',
  name: 'Example Network Diagnostics',
  version: '1.0.0',
  description: 'Suggests network hypotheses and tests from evidence keywords',
  diagnose
};
