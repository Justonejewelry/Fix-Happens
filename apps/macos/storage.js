/**
 * Lightweight localStorage persistence for the Case Workspace.
 * Survives reloads until SQLite is wired through Electron.
 */
(function (global) {
  const KEY_EVIDENCE = 'fixhappens.evidence.v1';
  const KEY_SOLID = 'fixhappens.solid.v1';
  const KEY_CASE = 'fixhappens.activeCase.v1';

  const defaults = [
    'Wi-Fi shows connected, no internet access',
    'no route to host',
    'VPN was used earlier today'
  ];

  function loadEvidence() {
    try {
      const raw = localStorage.getItem(KEY_EVIDENCE);
      if (!raw) return defaults.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : defaults.slice();
    } catch (_) {
      return defaults.slice();
    }
  }

  function saveEvidence(list) {
    try {
      localStorage.setItem(KEY_EVIDENCE, JSON.stringify(list));
    } catch (_) {}
  }

  function loadSolid() {
    try {
      return localStorage.getItem(KEY_SOLID) === '1';
    } catch (_) {
      return false;
    }
  }

  function saveSolid(on) {
    try {
      localStorage.setItem(KEY_SOLID, on ? '1' : '0');
    } catch (_) {}
  }

  function loadActiveCase() {
    try {
      return localStorage.getItem(KEY_CASE) || '1042';
    } catch (_) {
      return '1042';
    }
  }

  function saveActiveCase(id) {
    try {
      localStorage.setItem(KEY_CASE, String(id));
    } catch (_) {}
  }

  global.FixHappensStorage = {
    loadEvidence,
    saveEvidence,
    loadSolid,
    saveSolid,
    loadActiveCase,
    saveActiveCase
  };
})(window);
