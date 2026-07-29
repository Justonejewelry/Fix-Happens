const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      contextIsolation: true
    }
  });

  win.loadFile('apps/macos/index.html');
}

app.whenReady().then(createWindow);
