/**
 * Run registered plugins against a diagnostic context.
 * Plugins return soft suggestions; they do not mutate the case store.
 * Optional recommendedScans are plan IDs for the allowlisted scan runner.
 */

const registry = require('./pluginRegistry');

/**
 * @typedef {Object} DiagnoseContext
 * @property {string} symptom
 * @property {string[]} evidence
 * @property {string} [platform]
 * @property {string} [device]
 */

/**
 * @param {DiagnoseContext} context
 * @returns {Array<{pluginId:string, hypotheses?:object[], tips?:string[], nextTests?:string[], recommendedScans?:object[], error?:string}>}
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
      const recommendedScans = Array.isArray(out.recommendedScans)
        ? out.recommendedScans
            .filter((s) => s && typeof s.planId === 'string')
            .map((s) => ({
              planId: String(s.planId),
              params: s.params && typeof s.params === 'object' ? s.params : {},
              label: s.label ? String(s.label) : undefined
            }))
        : [];
      results.push({
        pluginId: plugin.id,
        hypotheses: Array.isArray(out.hypotheses) ? out.hypotheses : [],
        tips: Array.isArray(out.tips) ? out.tips : [],
        nextTests: Array.isArray(out.nextTests) ? out.nextTests : [],
        recommendedScans
      });
    } catch (e) {
      results.push({
        pluginId: plugin.id,
        hypotheses: [],
        tips: [],
        nextTests: [],
        recommendedScans: [],
        error: e.message || String(e)
      });
    }
  }
  return results;
}

module.exports = { runAll };
