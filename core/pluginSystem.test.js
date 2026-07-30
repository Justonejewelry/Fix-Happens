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

test('loads all high-value plugins', () => {
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
    'network-scan-map'
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
  assert.ok(
    scan.hypotheses.some((h) =>
      /Host Discovery|Subnet Topology|Path|Routing/i.test(h.cause)
    ),
    'expected discovery/topology/path hypothesis'
  );
});

test('network-scan-map responds to port / mDNS evidence', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Cannot reach printer service',
    evidence: ['port 631 filtered', 'mdns not browsing', 'bonjour fails'],
    platform: 'macos'
  });
  const scan = results.find((r) => r.pluginId === 'network-scan-map');
  assert.ok(scan);
  assert.ok(
    scan.hypotheses.some((h) => /Port|mDNS|Discovery/i.test(h.cause)),
    'expected port or mDNS hypothesis'
  );
});

test('knowledge packs load (7 domains)', () => {
  const { packs, errors } = loadAll();
  assert.ok(packs.length >= 7, `expected >= 7 packs, got ${packs.length}`);
  assert.strictEqual(errors.length, 0, JSON.stringify(errors));
  const net = loadKnowledgePack('network');
  assert.ok(net.tips.length >= 1);
  assert.ok(net.relatedCauses.length >= 1);
  assert.ok(Array.isArray(net.keywords));
  const scanPack = loadKnowledgePack('network-scan');
  assert.ok(scanPack.tips.length >= 1);
});

test('getRelevantTips matches network context', () => {
  const tips = getRelevantTips({
    symptom: 'Wi-Fi connected but no internet',
    evidence: ['no ip', 'vpn was on']
  });
  assert.ok(tips.length >= 1, 'expected relevant network tips');
  assert.ok(tips.every((t) => t.tip && t.packId));
});

test('getRelevantTips matches scan/map context', () => {
  const tips = getRelevantTips({
    symptom: 'Map the LAN',
    evidence: ['arp empty', 'traceroute', 'vlan']
  });
  assert.ok(tips.length >= 1, 'expected relevant scan tips');
  assert.ok(
    tips.some((t) => /scan|map|arp|vlan|topology/i.test(t.packTitle + t.tip))
  );
});

test('getRelevantTips matches printer context', () => {
  const tips = getRelevantTips({
    symptom: 'Printer offline',
    evidence: ['cups queue', 'lpstat']
  });
  assert.ok(tips.length >= 1, 'expected relevant print tips');
  assert.ok(tips.some((t) => /print|cups|queue/i.test(t.packTitle + t.tip)));
});

test('case artifact validates', () => {
  const a = toArtifact({
    id: 1042,
    symptom: 'Wi-Fi down',
    evidence: ['no ip', { evidence_type: 'Note', value: 'vpn' }]
  });
  assert.strictEqual(a.schema, 'fixhappens.case');
  assert.strictEqual(a.version, 1);
  const v = validateArtifact(a);
  assert.strictEqual(v.symptom, 'Wi-Fi down');
});

console.log('pluginSystem tests finished');
