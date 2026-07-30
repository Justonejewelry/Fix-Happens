/**
 * Electron preload — safe bridge to shared core engines.
 * Exposes only explicit APIs to the renderer (contextIsolation).
 */
const { contextBridge } = require('electron');
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
