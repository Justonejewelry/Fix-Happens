const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let db;
try {
  db = require('./db');
} catch (e) {
  console.error('db load failed', e);
  db = null;
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

function wireIpc() {
  if (!db) return;
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
