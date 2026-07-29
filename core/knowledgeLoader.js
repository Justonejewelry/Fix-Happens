const fs = require('fs');
const path = require('path');

function loadKnowledgePack(packName) {
  const filePath = path.join(__dirname, '..', 'knowledge', `${packName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Knowledge pack not found: ${packName}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

module.exports = { loadKnowledgePack };
