/**
 * Load and match knowledge packs from knowledge/*.json
 *
 * Pack shape (normalized):
 *   id, title, version, category, tips[], relatedCauses[], keywords[], scenarios[]
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

function normalizePack(raw, fallbackId) {
  const tips = Array.isArray(raw.tips) ? raw.tips.map(String) : [];
  // Legacy scenario-only packs (e.g. old networking.json)
  if (!tips.length && raw && typeof raw === 'object') {
    for (const val of Object.values(raw)) {
      if (val && Array.isArray(val.repairs)) {
        tips.push(...val.repairs.map(String));
      }
      if (val && Array.isArray(val.tests)) {
        // keep as scenario data only
      }
    }
  }

  return {
    id: String(raw.id || fallbackId),
    title: String(raw.title || fallbackId),
    version: Number(raw.version) || 1,
    category: String(raw.category || 'general'),
    tips,
    relatedCauses: Array.isArray(raw.relatedCauses)
      ? raw.relatedCauses.map(String)
      : [],
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map(String) : [],
    scenarios: Array.isArray(raw.scenarios) ? raw.scenarios : []
  };
}

function loadKnowledgePack(packName, knowledgeDir = DEFAULT_DIR) {
  if (!packName || typeof packName !== 'string') {
    throw new Error('packName is required');
  }
  const safe = packName.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(knowledgeDir, `${safe}.json`);
  if (!filePath.startsWith(path.resolve(knowledgeDir))) {
    throw new Error('Invalid knowledge pack path');
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`Knowledge pack not found: ${safe}`);
  }
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return normalizePack(raw, safe);
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

/**
 * Rank knowledge tips that are relevant to a diagnostic context.
 * @param {{ symptom?: string, evidence?: string[], causes?: string[] }} context
 * @param {{ limit?: number, knowledgeDir?: string }} [options]
 * @returns {Array<{ packId: string, packTitle: string, tip: string, score: number }>}
 */
function getRelevantTips(context = {}, options = {}) {
  const limit = options.limit ?? 6;
  const knowledgeDir = options.knowledgeDir || DEFAULT_DIR;
  const { packs } = loadAll(knowledgeDir);

  const text = [
    context.symptom || '',
    ...(Array.isArray(context.evidence) ? context.evidence : []),
    ...(Array.isArray(context.causes) ? context.causes : [])
  ]
    .join('\n')
    .toLowerCase();

  const scored = [];

  for (const pack of packs) {
    let packScore = 0;

    for (const kw of pack.keywords || []) {
      if (kw && text.includes(String(kw).toLowerCase())) packScore += 3;
    }
    for (const cause of pack.relatedCauses || []) {
      if (cause && text.includes(String(cause).toLowerCase())) packScore += 5;
    }
    // Title / category soft match
    if (pack.category && text.includes(pack.category.toLowerCase())) packScore += 2;

    if (packScore <= 0) continue;

    for (const tip of pack.tips || []) {
      scored.push({
        packId: pack.id,
        packTitle: pack.title,
        tip: String(tip),
        score: packScore
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  // Deduplicate identical tip text, keep highest score
  const seen = new Set();
  const unique = [];
  for (const item of scored) {
    const key = item.tip.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
    if (unique.length >= limit) break;
  }
  return unique;
}

module.exports = {
  listPacks,
  loadKnowledgePack,
  loadAll,
  getRelevantTips,
  normalizePack,
  DEFAULT_DIR
};
