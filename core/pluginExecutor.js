/**
 * Run registered plugins against a diagnostic context.
 * Plugins return soft suggestions; they do not mutate the case store.
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
 * @returns {Array<{pluginId:string, hypotheses?:object[], tips?:string[], nextTests?:string[], error?:string}>}
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
        nextTests: Array.isArray(out.nextTests) ? out.nextTests : []
      });
    } catch (e) {
      results.push({
        pluginId: plugin.id,
        hypotheses: [],
        tips: [],
        nextTests: [],
        error: e.message || String(e)
      });
    }
  }
  return results;
}

module.exports = { runAll };
