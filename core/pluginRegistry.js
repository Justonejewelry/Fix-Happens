class PluginRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(plugin) {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id) {
    this.plugins.delete(id);
  }

  get(id) {
    return this.plugins.get(id);
  }

  list() {
    return Array.from(this.plugins.values());
  }
}

module.exports = PluginRegistry;
