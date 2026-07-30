/**
 * Run registered plugins against a diagnostic context.
 * Plugins return soft suggestions; they do not mutate the case store.
 * Optional recommendedScans / recommendedFixes are plan IDs for allowlisted runners.
 */

const registry = require('./pluginRegistry');

/**
 * @typedef {Object} DiagnoseContext
 * @property {string} symptom
 * @property {string[]} evidence
 * @property {string} [platform]
 * @property {string} [device]
 */

function mapPlans(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s && typeof s.planId === 'string')
    .map((s) => ({
      planId: String(s.planId),
      params: s.params && typeof s.params === 'object' ? s.params : {},
      label: s.label ? String(s.label) : undefined
    }));
}

/**
 * @param {DiagnoseContext} context
 * @returns {Array<object>}
 */
function runAll(context) {
  const results = [];
  const safeContext = {
    symptom: String(context?.symptom || ''),
    evidence: Array.isArray(context?.evidence)
      ? context.evidence.map(String)
      : [],
    platform: context?.platform || 'unknown',
    device: context?.device || ''
  };

  for (const meta of registry.list()) {
    const plugin = registry.get(meta.id);
    if (!plugin) continue;
    try {
      const out = plugin.diagnose(safeContext) || {};
      results.push({
        pluginId: plugin.id,
        hypotheses: Array.isArray(out.hypotheses) ? out.hypotheses : [],
        tips: Array.isArray(out.tips) ? out.tips : [],
        nextTests: Array.isArray(out.nextTests) ? out.nextTests : [],
        recommendedScans: mapPlans(out.recommendedScans),
        recommendedFixes: mapPlans(out.recommendedFixes)
      });
    } catch (e) {
      results.push({
        pluginId: plugin.id,
        hypotheses: [],
        tips: [],
        nextTests: [],
        recommendedScans: [],
        recommendedFixes: [],
        error: e.message || String(e)
      });
    }
  }
  return results;
}

module.exports = { runAll };
