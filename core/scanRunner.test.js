/**
 * Scan runner unit tests (no live network required for validation tests).
 * Run: node core/scanRunner.test.js
 */
const assert = require('assert');
const {
  listPlans,
  getPlan,
  runPlan,
  isValidHost,
  isValidPort
} = require('./scanRunner');

function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log('ok —', name))
    .catch((e) => {
      console.error('FAIL —', name);
      console.error(e);
      process.exitCode = 1;
    });
}

async function main() {
  await test('lists allowlisted plans', () => {
    const plans = listPlans();
    assert.ok(plans.length >= 6);
    assert.ok(plans.some((p) => p.id === 'arp-table'));
    assert.ok(plans.some((p) => p.id === 'ping-host'));
  });

  await test('host validation', () => {
    assert.strictEqual(isValidHost('192.168.1.1'), true);
    assert.strictEqual(isValidHost('example.com'), true);
    assert.strictEqual(isValidHost('1.1.1.1'), true);
    assert.strictEqual(isValidHost('bad;rm -rf'), false);
    assert.strictEqual(isValidHost('host`id`'), false);
    assert.strictEqual(isValidHost(''), false);
  });

  await test('port validation', () => {
    assert.strictEqual(isValidPort(80), true);
    assert.strictEqual(isValidPort('443'), true);
    assert.strictEqual(isValidPort(0), false);
    assert.strictEqual(isValidPort(70000), false);
  });

  await test('refuses when privileged disabled', async () => {
    const r = await runPlan('arp-table', {}, { enabled: false });
    assert.strictEqual(r.ok, false);
    assert.ok(/disabled/i.test(r.error));
  });

  await test('unknown plan fails', async () => {
    const r = await runPlan('rm-rf-root', {}, { enabled: true });
    assert.strictEqual(r.ok, false);
    assert.ok(/unknown/i.test(r.error));
  });

  await test('invalid host on ping-host fails', async () => {
    const r = await runPlan(
      'ping-host',
      { host: 'evil; id' },
      { enabled: true }
    );
    assert.strictEqual(r.ok, false);
    assert.ok(/invalid host/i.test(r.error));
  });

  await test('getPlan returns catalog entry', () => {
    const p = getPlan('local-interfaces');
    assert.ok(p);
    assert.strictEqual(p.id, 'local-interfaces');
  });

  // Live execution only if tools exist (optional)
  await test('optional live ifconfig when enabled', async () => {
    const r = await runPlan('local-interfaces', {}, { enabled: true });
    // May fail on non-mac CI without ifconfig — accept either shape
    assert.ok(typeof r.ok === 'boolean');
    assert.strictEqual(r.planId, 'local-interfaces');
    if (r.ok) {
      assert.ok(r.stdout || r.stderr);
      assert.ok(r.command.includes('ifconfig'));
    }
  });

  console.log('scanRunner tests finished');
}

main();
