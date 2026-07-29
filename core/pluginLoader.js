const fs = require('fs');
const path = require('path');

function loadPlugins(pluginDirectory) {
  if (!fs.existsSync(pluginDirectory)) return [];

  return fs.readdirSync(pluginDirectory)
    .filter(entry => fs.statSync(path.join(pluginDirectory, entry)).isDirectory())
    .map(entry => ({
      id: entry,
      path: path.join(pluginDirectory, entry)
    }));
}

module.exports = { loadPlugins };
