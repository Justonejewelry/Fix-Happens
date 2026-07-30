/**
 * Lightweight localStorage persistence for the Case Workspace.
 * Survives reloads until SQLite is wired through Electron.
 */
(function (global) {
  const KEY_EVIDENCE = 'fixhappens.evidence.v1';
  const KEY_SOLID = 'fixhappens.solid.v1';
  const KEY_CASE = 'fixhappens.activeCase.v1';
  const KEY_CASES = 'fixhappens.cases.v1';

  const defaultEvidence = [
    'Wi-Fi shows connected, no internet access',
    'no route to host',
    'VPN was used earlier today'
  ];

  const defaultCases = {
    '1042': {
      symptom: 'Wi-Fi connected but no internet',
      meta: 'Seed case · Asset: MacBook Pro 16\" · Platform: macOS',
      device: 'MacBook Pro',
      status: 'Diagnosing',
      pills: ['No route to host', 'No IP assigned', 'VPN inactive'],
      closed: false
    },
    '1038': {
      symptom: 'Printer offline after sleep',
      meta: 'Seed case · Asset: Office LaserJet · Platform: macOS',
      device: 'LaserJet',
      status: 'Investigating',
      pills: ['USB sleep', 'Driver timeout'],
      closed: false
    },
    '1031': {
      symptom: 'VPN drops every 10 min',
      meta: 'Seed case · Asset: MacBook Air · Platform: macOS',
      device: 'MacBook Air',
      status: 'Testing',
      pills: ['IKEv2', 'Keepalive'],
      closed: false
    }
  };

  function loadEvidence() {
    try {
      const raw = localStorage.getItem(KEY_EVIDENCE);
      if (!raw) return defaultEvidence.slice();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length ? parsed : defaultEvidence.slice();
    } catch (_) {
      return defaultEvidence.slice();
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

  function loadCases() {
    try {
      const raw = localStorage.getItem(KEY_CASES);
      if (!raw) return JSON.parse(JSON.stringify(defaultCases));
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : JSON.parse(JSON.stringify(defaultCases));
    } catch (_) {
      return JSON.parse(JSON.stringify(defaultCases));
    }
  }

  function saveCases(map) {
    try {
      localStorage.setItem(KEY_CASES, JSON.stringify(map));
    } catch (_) {}
  }

  global.FixHappensStorage = {
    loadEvidence,
    saveEvidence,
    loadSolid,
    saveSolid,
    loadActiveCase,
    saveActiveCase,
    loadCases,
    saveCases
  };
})(window);
