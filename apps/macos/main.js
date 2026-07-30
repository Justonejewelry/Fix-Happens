const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let db = null;
let knowledge = null;
let caseContract = null;
let pluginExecutor = null;
let pluginRegistry = null;
let scanRunner = null;
let remediationRunner = null;

try {
  db = require('./db');
} catch (e) {
  console.error('db load failed', e);
}

try {
  knowledge = require(path.join(__dirname, '..', '..', 'core', 'knowledgeLoader.js'));
} catch (e) {
  console.error('knowledgeLoader failed', e);
}

try {
  caseContract = require(path.join(__dirname, '..', '..', 'core', 'caseContract.js'));
} catch (e) {
  console.error('caseContract failed', e);
}

try {
  scanRunner = require(path.join(__dirname, '..', '..', 'core', 'scanRunner.js'));
} catch (e) {
  console.error('scanRunner failed', e);
}

try {
  remediationRunner = require(path.join(__dirname, '..', '..', 'core', 'remediationRunner.js'));
} catch (e) {
  console.error('remediationRunner failed', e);
}

try {
  const { loadPlugins } = require(path.join(__dirname, '..', '..', 'core', 'pluginLoader.js'));
  pluginExecutor = require(path.join(__dirname, '..', '..', 'core', 'pluginExecutor.js'));
  pluginRegistry = require(path.join(__dirname, '..', '..', 'core', 'pluginRegistry.js'));
  const pluginsDir = path.join(__dirname, '..', '..', 'plugins');
  const result = loadPlugins(pluginsDir, { platform: process.platform, register: true });
  if (result.errors && result.errors.length) {
    console.warn('plugin load errors', result.errors);
  }
  console.log('plugins loaded', result.loaded.map((p) => p.id));
} catch (e) {
  console.error('plugin system failed', e);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f1020',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

function isPrivilegedEnabled() {
  if (!db) return false;
  try {
    const meta = db.getMeta() || {};
    return !!meta.privilegedScans;
  } catch (_) {
    return false;
  }
}

function attachEvidence(caseId, result, kind) {
  if (!result || !caseId || !db) return result;
  if (!(result.stdout || result.stderr || result.error || result.command)) return result;
  try {
    const body = [
      `$ ${result.command || result.planId || kind}`,
      result.stdout || '',
      result.stderr ? '[stderr]\n' + result.stderr : '',
      result.error ? '[error] ' + result.error : '',
      result.durationMs != null ? `(${result.durationMs}ms)` : ''
    ]
      .filter(Boolean)
      .join('\n')
      .trim();
    db.addEvidence(caseId, kind === 'fix' ? 'Remediation' : 'Command Output', body.slice(0, 12000));
    result.attachedEvidence = true;
  } catch (e) {
    result.attachError = e.message;
  }
  return result;
}

function wireIpc() {
  if (db) {
    ipcMain.handle('db:listOpenCases', () => db.listOpenCases());
    ipcMain.handle('db:getCase', (_e, id) => db.getCase(id));
    ipcMain.handle('db:createCase', (_e, payload) => db.createCase(payload || {}));
    ipcMain.handle('db:closeCase', (_e, id, resolution) => db.closeCase(id, resolution));
    ipcMain.handle('db:addEvidence', (_e, caseId, type, value) =>
      db.addEvidence(caseId, type, value)
    );
    ipcMain.handle('db:saveHypotheses', (_e, caseId, ranked) =>
      db.saveHypotheses(caseId, ranked)
    );
    ipcMain.handle('db:getMeta', () => db.getMeta());
    ipcMain.handle('db:updateMeta', (_e, patch) => db.updateMeta(patch || {}));
    ipcMain.handle('db:searchCases', (_e, q) => db.searchCases(q));
  }

  ipcMain.handle('knowledge:list', () => {
    if (!knowledge) return { packs: [], errors: [{ error: 'knowledgeLoader unavailable' }] };
    try {
      return knowledge.loadAll();
    } catch (e) {
      return { packs: [], errors: [{ error: e.message }] };
    }
  });

  ipcMain.handle('knowledge:get', (_e, name) => {
    if (!knowledge) throw new Error('knowledgeLoader unavailable');
    return knowledge.loadKnowledgePack(name);
  });

  ipcMain.handle('knowledge:relevant', (_e, context) => {
    if (!knowledge || typeof knowledge.getRelevantTips !== 'function') return [];
    try {
      return knowledge.getRelevantTips(context || {});
    } catch (e) {
      return [];
    }
  });

  ipcMain.handle('plugins:list', () => {
    if (!pluginRegistry) return [];
    return pluginRegistry.list();
  });

  ipcMain.handle('plugins:run', (_e, context) => {
    if (!pluginExecutor) return [];
    try {
      return pluginExecutor.runAll(context || {});
    } catch (e) {
      return [
        {
          pluginId: '*',
          error: e.message,
          hypotheses: [],
          tips: [],
          nextTests: [],
          recommendedScans: [],
          recommendedFixes: []
        }
      ];
    }
  });

  // --- Privileged scan runner ---
  ipcMain.handle('scan:listPlans', () => {
    if (!scanRunner) return [];
    return scanRunner.listPlans();
  });

  ipcMain.handle('scan:status', () => {
    return {
      available: !!scanRunner,
      enabled: isPrivilegedEnabled(),
      platform: process.platform
    };
  });

  ipcMain.handle('scan:setEnabled', (_e, enabled) => {
    if (!db) throw new Error('DB unavailable');
    const meta = db.updateMeta({ privilegedScans: !!enabled });
    return { enabled: !!meta.privilegedScans };
  });

  ipcMain.handle('scan:run', async (_e, payload) => {
    if (!scanRunner) {
      return { ok: false, error: 'scanRunner unavailable' };
    }
    const planId = payload && payload.planId;
    const params = (payload && payload.params) || {};
    const caseId = payload && payload.caseId;
    const enabled = isPrivilegedEnabled();
    const result = await scanRunner.runPlan(planId, params, { enabled });
    return attachEvidence(caseId, result, 'scan');
  });

  // --- Remediation / auto-fix runner ---
  ipcMain.handle('fix:listPlans', () => {
    if (!remediationRunner) return [];
    return remediationRunner.listPlans();
  });

  ipcMain.handle('fix:status', () => {
    return {
      available: !!remediationRunner,
      enabled: isPrivilegedEnabled(),
      platform: process.platform
    };
  });

  ipcMain.handle('fix:suggest', (_e, cause) => {
    if (!remediationRunner) return [];
    return remediationRunner.suggestFixesForCause(cause || '');
  });

  ipcMain.handle('fix:run', async (_e, payload) => {
    if (!remediationRunner) {
      return { ok: false, error: 'remediationRunner unavailable' };
    }
    const planId = payload && payload.planId;
    const params = (payload && payload.params) || {};
    const caseId = payload && payload.caseId;
    const enabled = isPrivilegedEnabled();
    const result = await remediationRunner.runPlan(planId, params, { enabled });
    return attachEvidence(caseId, result, 'fix');
  });

  ipcMain.handle('case:export', (_e, caseId) => {
    if (!db || !caseContract) {
      throw new Error('Export unavailable');
    }
    const full = db.getCase(caseId);
    if (!full) throw new Error('Case not found: ' + caseId);
    return caseContract.toArtifact(full);
  });
}

app.whenReady().then(() => {
  wireIpc();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
