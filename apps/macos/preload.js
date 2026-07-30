/**
 * Electron preload — core engine + durable DB bridge.
 */
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

let engine = null;
try {
  engine = require(path.join(__dirname, '..', '..', 'core', 'diagnosticEngine.js'));
} catch (err) {
  console.warn('diagnosticEngine not loaded in preload:', err.message);
}

contextBridge.exposeInMainWorld('FixHappensCore', {
  score(evidence) {
    if (!engine || typeof engine.score !== 'function') return null;
    return engine.score(evidence);
  },
  recommendNextTest(ranked) {
    if (!engine || typeof engine.recommendNextTest !== 'function') return null;
    return engine.recommendNextTest(ranked);
  },
  hasEngine() {
    return !!engine;
  }
});

contextBridge.exposeInMainWorld('FixHappensDB', {
  listOpenCases: () => ipcRenderer.invoke('db:listOpenCases'),
  getCase: (id) => ipcRenderer.invoke('db:getCase', id),
  createCase: (payload) => ipcRenderer.invoke('db:createCase', payload),
  closeCase: (id, resolution) => ipcRenderer.invoke('db:closeCase', id, resolution),
  addEvidence: (caseId, type, value) =>
    ipcRenderer.invoke('db:addEvidence', caseId, type, value),
  saveHypotheses: (caseId, ranked) =>
    ipcRenderer.invoke('db:saveHypotheses', caseId, ranked),
  getMeta: () => ipcRenderer.invoke('db:getMeta'),
  updateMeta: (patch) => ipcRenderer.invoke('db:updateMeta', patch),
  searchCases: (q) => ipcRenderer.invoke('db:searchCases', q),
  available: true
});
