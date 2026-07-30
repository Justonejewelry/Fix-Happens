/**
 * Canonical Case Artifact contract (v1).
 * Used for export/import and cross-platform parity documentation.
 *
 * @typedef {Object} CaseArtifactV1
 * @property {'fixhappens.case'} schema
 * @property {1} version
 * @property {string|number} id
 * @property {string} symptom
 * @property {string} [device]
 * @property {string} status
 * @property {boolean} closed
 * @property {string[]} pills
 * @property {Array<{evidence_type:string,value:string,created_at?:string}>} evidence
 * @property {Array<{cause:string,confidence:number}>} hypotheses
 * @property {Object.<string,boolean>} verification
 * @property {string} [resolution]
 * @property {string} [exported_at]
 */

const SCHEMA = 'fixhappens.case';
const VERSION = 1;

/**
 * Build a portable case artifact from store-shaped data.
 * @param {object} partial
 * @returns {object}
 */
function toArtifact(partial = {}) {
  const evidence = Array.isArray(partial.evidence)
    ? partial.evidence.map((e) => {
        if (typeof e === 'string') {
          return { evidence_type: 'Note', value: e };
        }
        return {
          evidence_type: e.evidence_type || e.type || 'Note',
          value: e.value != null ? String(e.value) : '',
          created_at: e.created_at || undefined
        };
      })
    : [];

  return {
    schema: SCHEMA,
    version: VERSION,
    id: partial.id,
    symptom: String(partial.symptom || ''),
    device: partial.device || 'Field device',
    status: partial.status || 'New',
    closed: Boolean(partial.closed),
    pills: Array.isArray(partial.pills) ? partial.pills : [],
    evidence,
    hypotheses: Array.isArray(partial.hypotheses) ? partial.hypotheses : [],
    verification: partial.verification || {
      evidence_recorded: evidence.length > 0,
      hypotheses_scored: false,
      next_test_executed: false,
      repair_verified: false
    },
    resolution: partial.resolution || '',
    exported_at: new Date().toISOString()
  };
}

/**
 * Validate minimal shape. Throws Error on hard failures.
 * @param {object} artifact
 * @returns {object} normalized artifact
 */
function validateArtifact(artifact) {
  if (!artifact || typeof artifact !== 'object') {
    throw new Error('Case artifact must be an object');
  }
  if (artifact.schema && artifact.schema !== SCHEMA) {
    throw new Error(`Unsupported schema: ${artifact.schema}`);
  }
  if (artifact.version != null && Number(artifact.version) !== VERSION) {
    throw new Error(`Unsupported artifact version: ${artifact.version}`);
  }
  if (!artifact.symptom || !String(artifact.symptom).trim()) {
    throw new Error('Case artifact requires symptom');
  }
  return toArtifact(artifact);
}

module.exports = {
  SCHEMA,
  VERSION,
  toArtifact,
  validateArtifact
};
