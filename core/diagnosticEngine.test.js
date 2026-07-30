/**
 * Minimal Node test runner for diagnostic engine (no Jest required).
 * Run: node core/diagnosticEngine.test.js
 */
const assert = require('assert');
const { score, recommendNextTest } = require('./diagnosticEngine');

function test(name, fn) {
  try {
    fn();
    console.log('ok —', name);
  } catch (e) {
    console.error('FAIL —', name);
    console.error(e);
    process.exitCode = 1;
  }
}

test('scores DHCP high on no route to host', () => {
  const ranked = score(['no route to host', 'no ip assigned']);
  assert.ok(ranked.length > 0);
  assert.strictEqual(ranked[0].cause, 'DHCP Failure');
  assert.ok(ranked[0].confidence >= 70);
});

test('vpn evidence boosts VPN Route Corruption', () => {
  const ranked = score(['vpn tunnel dropped', 'no route']);
  const vpn = ranked.find(r => r.cause === 'VPN Route Corruption');
  assert.ok(vpn);
  assert.ok(vpn.confidence >= 40);
});

test('recommendNextTest returns top nextTest', () => {
  const ranked = score(['dns cannot resolve']);
  const next = recommendNextTest(ranked);
  assert.ok(typeof next === 'string' && next.length > 0);
});

test('printer offline surfaces Printer Offline cause', () => {
  const ranked = score(['printer offline after sleep']);
  const p = ranked.find(r => r.cause === 'Printer Offline');
  assert.ok(p, 'expected Printer Offline in results');
});

console.log('diagnosticEngine tests finished');
