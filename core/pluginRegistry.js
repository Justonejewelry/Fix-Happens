/**
 * In-memory registry of loaded diagnostic plugins.
 */

const registry = new Map();

function register(plugin) {
  if (!plugin || !plugin.id) {
    throw new Error('plugin requires id');
  }
  if (typeof plugin.diagnose !== 'function') {
    throw new Error(`plugin ${plugin.id} must export diagnose(context)`);
  }
  registry.set(plugin.id, plugin);
  return plugin.id;
}

function unregister(id) {
  return registry.delete(id);
}

function get(id) {
  return registry.get(id) || null;
}

function list() {
  return [...registry.values()].map((p) => ({
    id: p.id,
    name: p.name || p.id,
    version: p.version || '0.0.0',
    description: p.description || ''
  }));
}

function clear() {
  registry.clear();
}

module.exports = {
  register,
  unregister,
  get,
  list,
  clear
};
