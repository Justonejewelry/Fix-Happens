/**
 * Durable case store for Electron — schema-aligned JSON file in userData.
 * Mirrors database/schema.sql entities (cases, evidence, hypotheses, repair).
 */
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const FILE = () => path.join(app.getPath('userData'), 'fixhappens-db.json');

function emptyDb() {
  return {
    version: 1,
    assets: [],
    cases: [],
    evidence: [],
    hypotheses: [],
    repair_history: [],
    meta: { activeCaseId: null, solid: false }
  };
}

function read() {
  try {
    const p = FILE();
    if (!fs.existsSync(p)) {
      const seed = seedDb();
      write(seed);
      return seed;
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {
    return seedDb();
  }
}

function write(db) {
  const p = FILE();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(db, null, 2), 'utf8');
}

function seedDb() {
  const now = new Date().toISOString();
  return {
    version: 1,
    assets: [
      { id: 1, name: 'MacBook Pro', platform: 'macOS', notes: '', created_at: now }
    ],
    cases: [
      {
        id: 1042,
        asset_id: 1,
        symptom: 'Wi-Fi connected but no internet',
        status: 'Investigating',
        device: 'MacBook Pro',
        closed: false,
        pills: ['No route to host', 'No IP assigned'],
        verification: {
          evidence_recorded: true,
          hypotheses_scored: true,
          next_test_executed: false,
          repair_verified: false
        },
        created_at: now
      }
    ],
    evidence: [
      { id: 1, case_id: 1042, evidence_type: 'Observation', value: 'Wi-Fi shows connected, no internet access', created_at: now },
      { id: 2, case_id: 1042, evidence_type: 'Command Output', value: 'no route to host', created_at: now },
      { id: 3, case_id: 1042, evidence_type: 'User Statement', value: 'VPN was used earlier today', created_at: now }
    ],
    hypotheses: [],
    repair_history: [],
    meta: { activeCaseId: 1042, solid: false }
  };
}

function nextId(rows) {
  return rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 1000) + 1;
}

function listOpenCases() {
  const db = read();
  return db.cases.filter(c => !c.closed);
}

function getCase(id) {
  const db = read();
  const c = db.cases.find(x => String(x.id) === String(id));
  if (!c) return null;
  return {
    ...c,
    evidence: db.evidence.filter(e => String(e.case_id) === String(id)),
    hypotheses: db.hypotheses.filter(h => String(h.case_id) === String(id))
  };
}

function createCase({ symptom, device = 'Field device', status = 'New' }) {
  const db = read();
  const id = nextId(db.cases);
  const now = new Date().toISOString();
  const row = {
    id,
    asset_id: null,
    symptom,
    status,
    device,
    closed: false,
    pills: [],
    verification: {
      evidence_recorded: false,
      hypotheses_scored: false,
      next_test_executed: false,
      repair_verified: false
    },
    created_at: now
  };
  db.cases.push(row);
  db.meta.activeCaseId = id;
  write(db);
  return row;
}

function closeCase(id, resolution = '') {
  const db = read();
  const c = db.cases.find(x => String(x.id) === String(id));
  if (!c) return null;
  c.closed = true;
  c.status = 'Resolved';
  c.verification = c.verification || {};
  c.verification.repair_verified = true;
  if (resolution) {
    db.repair_history.push({
      id: nextId(db.repair_history),
      case_id: c.id,
      resolution,
      verified: 1,
      created_at: new Date().toISOString()
    });
  }
  write(db);
  return c;
}

function addEvidence(caseId, evidence_type, value) {
  const db = read();
  const row = {
    id: nextId(db.evidence),
    case_id: Number(caseId),
    evidence_type: evidence_type || 'Note',
    value,
    created_at: new Date().toISOString()
  };
  db.evidence.push(row);
  const c = db.cases.find(x => String(x.id) === String(caseId));
  if (c) {
    c.verification = c.verification || {};
    c.verification.evidence_recorded = true;
    if (c.status === 'New') c.status = 'Investigating';
  }
  write(db);
  return row;
}

function saveHypotheses(caseId, ranked) {
  const db = read();
  db.hypotheses = db.hypotheses.filter(h => String(h.case_id) !== String(caseId));
  const now = new Date().toISOString();
  for (const r of ranked || []) {
    db.hypotheses.push({
      id: nextId(db.hypotheses),
      case_id: Number(caseId),
      cause: r.cause,
      confidence: r.confidence,
      created_at: now
    });
  }
  const c = db.cases.find(x => String(x.id) === String(caseId));
  if (c && ranked && ranked.length) {
    c.verification = c.verification || {};
    c.verification.hypotheses_scored = true;
    if (['New', 'Investigating'].includes(c.status)) c.status = 'Testing';
  }
  write(db);
  return ranked;
}

function updateMeta(patch) {
  const db = read();
  db.meta = { ...db.meta, ...patch };
  write(db);
  return db.meta;
}

function getMeta() {
  return read().meta;
}

function searchCases(q) {
  const db = read();
  const s = String(q || '').toLowerCase();
  if (!s) return db.cases.filter(c => !c.closed);
  return db.cases.filter(c => {
    if (c.closed) return false;
    return (
      String(c.symptom).toLowerCase().includes(s) ||
      String(c.device || '').toLowerCase().includes(s) ||
      String(c.status || '').toLowerCase().includes(s) ||
      String(c.id).includes(s)
    );
  });
}

module.exports = {
  listOpenCases,
  getCase,
  createCase,
  closeCase,
  addEvidence,
  saveHypotheses,
  updateMeta,
  getMeta,
  searchCases,
  read
};
