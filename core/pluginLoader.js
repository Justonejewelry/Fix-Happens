/**
 * Discover and load plugins from a directory.
 * Each plugin folder must contain manifest.json + entryPoint module.
 */

const fs = require('fs');
const path = require('path');
const { validateManifest } = require('./pluginManifestValidator');
const registry = require('./pluginRegistry');

/**
 * @param {string} pluginDirectory absolute path to plugins/
 * @param {{ register?: boolean, platform?: string }} [options]
 * @returns {{ loaded: object[], errors: Array<{id:string,error:string}> }}
 */
function loadPlugins(pluginDirectory, options = {}) {
  const shouldRegister = options.register !== false;
  const platform = options.platform || process.platform;
  const loaded = [];
  const errors = [];

  if (!pluginDirectory || !fs.existsSync(pluginDirectory)) {
    return { loaded, errors: [{ id: '*', error: `plugin directory missing: ${pluginDirectory}` }] };
  }

  let entries;
  try {
    entries = fs.readdirSync(pluginDirectory);
  } catch (e) {
    return { loaded, errors: [{ id: '*', error: e.message }] };
  }

  for (const entry of entries) {
    const dir = path.join(pluginDirectory, entry);
    let st;
    try {
      st = fs.statSync(dir);
    } catch (_) {
      continue;
    }
    if (!st.isDirectory()) continue;

    try {
      const manifestPath = path.join(dir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        errors.push({ id: entry, error: 'manifest.json missing' });
        continue;
      }
      const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const { ok, errors: mErr, manifest } = validateManifest(raw);
      if (!ok) {
        errors.push({ id: entry, error: mErr.join('; ') });
        continue;
      }

      // Platform filter (darwin maps to macos)
      const plat =
        platform === 'darwin' ? 'macos' : platform === 'win32' ? 'windows' : platform;
      if (
        Array.isArray(manifest.supportedPlatforms) &&
        manifest.supportedPlatforms.length &&
        !manifest.supportedPlatforms.includes(plat) &&
        !manifest.supportedPlatforms.includes('all')
      ) {
        // skip silently for unsupported platform
        continue;
      }

      const entryFile = path.join(dir, manifest.entryPoint);
      if (!fs.existsSync(entryFile)) {
        errors.push({ id: manifest.id, error: `entryPoint not found: ${manifest.entryPoint}` });
        continue;
      }

      // Clear require cache in dev so reloads work
      delete require.cache[require.resolve(entryFile)];
      const mod = require(entryFile);
      const diagnose = typeof mod === 'function' ? mod : mod.diagnose;
      if (typeof diagnose !== 'function') {
        errors.push({ id: manifest.id, error: 'module must export diagnose function' });
        continue;
      }

      const plugin = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        permissions: manifest.permissions,
        capabilities: manifest.capabilities,
        diagnose
      };

      if (shouldRegister) registry.register(plugin);
      loaded.push(plugin);
    } catch (e) {
      errors.push({ id: entry, error: e.message || String(e) });
    }
  }

  return { loaded, errors };
}

module.exports = { loadPlugins };
