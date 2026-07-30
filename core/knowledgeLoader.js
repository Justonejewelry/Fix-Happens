/**
 * Load knowledge packs from knowledge/*.json
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_DIR = path.join(__dirname, '..', 'knowledge');

function listPacks(knowledgeDir = DEFAULT_DIR) {
  if (!fs.existsSync(knowledgeDir)) return [];
  return fs
    .readdirSync(knowledgeDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

function loadKnowledgePack(packName, knowledgeDir = DEFAULT_DIR) {
  if (!packName || typeof packName !== 'string') {
    throw new Error('packName is required');
  }
  // prevent path traversal
  const safe = packName.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(knowledgeDir, `${safe}.json`);
  if (!filePath.startsWith(path.resolve(knowledgeDir))) {
    throw new Error('Invalid knowledge pack path');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Knowledge pack not found: ${safe}`);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    id: raw.id || safe,
    title: raw.title || safe,
    version: raw.version || 1,
    tips: Array.isArray(raw.tips) ? raw.tips : [],
    relatedCauses: Array.isArray(raw.relatedCauses) ? raw.relatedCauses : []
  };
}

function loadAll(knowledgeDir = DEFAULT_DIR) {
  const out = [];
  const errors = [];
  for (const name of listPacks(knowledgeDir)) {
    try {
      out.push(loadKnowledgePack(name, knowledgeDir));
    } catch (e) {
      errors.push({ pack: name, error: e.message });
    }
  }
  return { packs: out, errors };
}

module.exports = {
  listPacks,
  loadKnowledgePack,
  loadAll,
  DEFAULT_DIR
};
