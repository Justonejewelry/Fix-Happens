function executePlugin(plugin, context = {}) {
  if (!plugin || typeof plugin.run !== 'function') {
    throw new Error('Plugin does not expose a run function');
  }

  try {
    return plugin.run(context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

module.exports = { executePlugin };
