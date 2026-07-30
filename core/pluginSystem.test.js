/**
 * Plugin + knowledge + case contract tests.
 * Run: node core/pluginSystem.test.js
 */
const assert = require('assert');
const path = require('path');
const { loadPlugins } = require('./pluginLoader');
const registry = require('./pluginRegistry');
const { runAll } = require('./pluginExecutor');
const { loadAll, loadKnowledgePack } = require('./knowledgeLoader');
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

const EXPECTED_PLUGINS = [
  'example-network',
  'printer-diagnostics',
  'power-sleep',
  'storage-disk',
  'display-graphics',
  'usb-peripheral'
];

test('loads all high-value plugins', () => {
  registry.clear();
  const pluginsDir = path.join(__dirname, '..', 'plugins');
  const { loaded, errors } = loadPlugins(pluginsDir, { platform: 'darwin' });
  assert.ok(loaded.length >= 6, `expected >=6 plugins, got ${loaded.length}`);
  for (const id of EXPECTED_PLUGINS) {
    assert.ok(
      loaded.some((p) => p.id === id),
      `missing plugin: ${id}`
    );
  }
  const fatal = errors.filter((e) => EXPECTED_PLUGINS.includes(e.id));
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

test('printer plugin responds to offline printer symptom', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'Printer offline and not accepting jobs',
    evidence: ['lpstat shows paused', 'USB cable connected'],
    platform: 'macos'
  });
  const printer = results.find((r) => r.pluginId === 'printer-diagnostics');
  assert.ok(printer, 'printer-diagnostics did not run');
  assert.ok(printer.hypotheses.length >= 1);
  assert.ok(printer.nextTests.length >= 1);
});

test('power-sleep plugin responds to wake failure', () => {
  registry.clear();
  loadPlugins(path.join(__dirname, '..', 'plugins'), { platform: 'darwin' });
  const results = runAll({
    symptom: 'MacBook will not wake from sleep',
    evidence: ['black screen after lid open', 'pmset shows assertions'],
    platform: 'macos'
  });
  const power = results.find((r) => r.pluginId === 'power-sleep');
  assert.ok(power, 'power-sleep did not run');
  assert.ok(power.hypotheses.length >= 1);
});

test('knowledge packs load', () => {
  const { packs, errors } = loadAll();
  assert.ok(packs.length >= 1, 'expected knowledge packs');
  assert.strictEqual(errors.length, 0, JSON.stringify(errors));
  const net = loadKnowledgePack('network');
  assert.ok(net.tips.length >= 1);
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
