/**
 * Remediation runner unit tests (no live network mutation).
 * Run: node core/remediationRunner.test.js
 */
const assert = require('assert');
const {
  listPlans,
  getPlan,
  runPlan,
  suggestFixesForCause,
  isValidService,
  isValidIface,
  PLANS
} = require('./remediationRunner');

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

test('catalog has core fix plans', () => {
  const plans = listPlans();
  assert.ok(plans.length >= 8, `expected >= 8 plans, got ${plans.length}`);
  const ids = plans.map((p) => p.id);
  for (const id of [
    'flush-dns-cache',
    'renew-dhcp',
    'set-dns-cloudflare',
    'wifi-power-cycle',
    'disable-web-proxy',
    'cancel-all-print-jobs',
    'network-quality'
  ]) {
    assert.ok(ids.includes(id), `missing plan ${id}`);
  }
});

test('disabled by default', async () => {
  const r = await runPlan('flush-dns-cache', {}, { enabled: false });
  assert.strictEqual(r.ok, false);
  assert.ok(/disabled/i.test(r.error));
});

test('unknown plan fails', async () => {
  const r = await runPlan('rm-rf-root', {}, { enabled: true });
  assert.strictEqual(r.ok, false);
  assert.ok(/unknown/i.test(r.error));
});

test('invalid iface rejected', async () => {
  const r = await runPlan(
    'renew-dhcp',
    { iface: 'en0; rm -rf /' },
    { enabled: true }
  );
  assert.strictEqual(r.ok, false);
  assert.ok(/invalid interface/i.test(r.error));
});

test('invalid service rejected', async () => {
  const r = await runPlan(
    'set-dns-cloudflare',
    { service: 'Wi-Fi; curl evil' },
    { enabled: true }
  );
  assert.strictEqual(r.ok, false);
  assert.ok(/invalid network service/i.test(r.error));
});

test('service and iface allowlists', () => {
  assert.ok(isValidService('Wi-Fi'));
  assert.ok(!isValidService('Wi-Fi;id'));
  assert.ok(isValidIface('en0'));
  assert.ok(!isValidIface('en0;id'));
});

test('suggestFixesForCause maps DNS and DHCP', () => {
  const dns = suggestFixesForCause('Stale / Misconfigured DNS');
  assert.ok(dns.some((f) => f.planId === 'flush-dns-cache'));
  const dhcp = suggestFixesForCause('DHCP Failure');
  assert.ok(dhcp.some((f) => f.planId === 'renew-dhcp'));
});

test('wifi-power-cycle builds two steps', () => {
  const plan = getPlan('wifi-power-cycle');
  const steps = plan.buildSteps({ service: 'Wi-Fi' });
  assert.strictEqual(steps.length, 2);
  assert.strictEqual(steps[0].args[2], 'off');
  assert.strictEqual(steps[1].args[2], 'on');
});

test('all plans expose buildSteps', () => {
  for (const id of Object.keys(PLANS)) {
    assert.strictEqual(typeof PLANS[id].buildSteps, 'function');
  }
});

console.log('remediationRunner tests finished');
