/**
 * Plugin + knowledge + case contract tests.
 * Run: node core/pluginSystem.test.js
 */
const assert = require('assert');
const path = require('path');
const { loadPlugins } = require('./pluginLoader');
const registry = require('./pluginRegistry');
const { runAll } = require('./pluginExecutor');
const {
  loadAll,
  loadKnowledgePack,
  getRelevantTips
} = require('./knowledgeLoader');
const { toArtifact, validateArtifact } = require('./caseContract');

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

test('loads all high-value plugins including booster', () => {
  registry.clear();
  const pluginsDir = path.join(__dirname, '..', 'plugins');
  const { loaded, errors } = loadPlugins(pluginsDir, { platform: 'darwin' });
  const expected = [
    'example-network',
    'printer-diagnostics',
    'power-sleep',
    'storage-disk',
    'display-graphics',
    'usb-peripheral',
    'network-scan-map',
    'system-network-booster'
  ];
  assert.ok(
    loaded.length >= expected.length,
    `expected >= ${expected.length} plugins, got ${loaded.length}`
  );
  for (const id of expected) {
    assert.ok(loaded.some((p) => p.id === id), `missing plugin: ${id}`);
  }
  const fatal = errors.filter((e) => expected.includes(e.id));
  assert.strictEqual(fatal.length, 0, JSON.stringify(fatal));
});

test('plugin diagnose returns network suggestions', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Wi-Fi connected but no internet',
    evidence: ['no route to host', 'vpn was on'],
    platform: 'macos'
  });
  assert.ok(results.length >= 1);
  const net = results.find((r) => r.pluginId === 'example-network');
  assert.ok(net);
  assert.ok(net.hypotheses.length >= 1);
  assert.ok(net.nextTests.length >= 1);
});

test('printer plugin responds to offline evidence', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Cannot print',
    evidence: ['printer offline', 'cups queue paused'],
    platform: 'macos'
  });
  const print = results.find((r) => r.pluginId === 'printer-diagnostics');
  assert.ok(print, 'printer-diagnostics missing from results');
  assert.ok(print.hypotheses.length >= 1 || print.tips.length >= 1);
});

test('power-sleep plugin responds to sleep keywords', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'MacBook will not sleep',
    evidence: ['pmset assertions', 'clamshell'],
    platform: 'macos'
  });
  const power = results.find((r) => r.pluginId === 'power-sleep');
  assert.ok(power, 'power-sleep missing from results');
  assert.ok(power.hypotheses.length >= 1 || power.tips.length >= 1);
});

test('network-scan-map responds to ARP / topology evidence', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Need network map of office LAN',
    evidence: ['arp table almost empty', 'unknown subnet', 'traceroute times out'],
    platform: 'macos'
  });
  const scan = results.find((r) => r.pluginId === 'network-scan-map');
  assert.ok(scan, 'network-scan-map missing from results');
  assert.ok(scan.hypotheses.length >= 1, 'expected scan hypotheses');
  assert.ok(scan.nextTests.length >= 1, 'expected next tests');
});

test('network-scan-map recommends allowlisted scan plans', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Need network map of office LAN',
    evidence: ['arp table almost empty', 'unknown subnet'],
    platform: 'macos'
  });
  const scan = results.find((r) => r.pluginId === 'network-scan-map');
  assert.ok(scan);
  assert.ok(Array.isArray(scan.recommendedScans));
  assert.ok(scan.recommendedScans.length >= 1, 'expected recommendedScans');
});

test('system-network-booster recommends fixes for slow network', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Network is slow, need a boost',
    evidence: ['high latency', 'stale dns cache', 'proxy left on'],
    platform: 'macos'
  });
  const boost = results.find((r) => r.pluginId === 'system-network-booster');
  assert.ok(boost, 'system-network-booster missing');
  assert.ok(boost.hypotheses.length >= 1, 'expected hypotheses');
  assert.ok(Array.isArray(boost.recommendedFixes));
  assert.ok(boost.recommendedFixes.length >= 1, 'expected recommendedFixes');
  assert.ok(
    boost.recommendedFixes.every((f) => typeof f.planId === 'string'),
    'each fix needs planId'
  );
  const ids = boost.recommendedFixes.map((f) => f.planId);
  assert.ok(
    ids.includes('flush-dns-cache') ||
      ids.includes('set-dns-cloudflare') ||
      ids.includes('network-quality'),
    'expected DNS or quality fix plan'
  );
});

test('system-network-booster recommends DHCP renew on no-ip', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'No internet',
    evidence: ['no ip', 'self-assigned 169.254'],
    platform: 'macos'
  });
  const boost = results.find((r) => r.pluginId === 'system-network-booster');
  assert.ok(boost);
  assert.ok(
    boost.recommendedFixes.some((f) => f.planId === 'renew-dhcp'),
    'expected renew-dhcp'
  );
});

test('knowledge packs load', () => {
  const { packs, errors } = loadAll();
  assert.ok(packs.length >= 7, `expected >= 7 packs, got ${packs.length}`);
  assert.strictEqual(errors.length, 0, JSON.stringify(errors));
  const net = loadKnowledgePack('network');
  assert.ok(net.tips.length >= 1);
});

test('getRelevantTips matches network context', () => {
  const tips = getRelevantTips({
    symptom: 'Wi-Fi connected but no internet',
    evidence: ['no ip', 'vpn was on']
  });
  assert.ok(tips.length >= 1, 'expected relevant network tips');
});

test('case artifact validates', () => {
  const a = toArtifact({
    id: 1042,
    symptom: 'Wi-Fi down',
    evidence: ['no ip', { evidence_type: 'Note', value: 'vpn' }]
  });
  assert.strictEqual(a.schema, 'fixhappens.case');
  const v = validateArtifact(a);
  assert.strictEqual(v.symptom, 'Wi-Fi down');
});

console.log('pluginSystem tests finished');
