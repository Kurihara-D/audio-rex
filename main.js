const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-system-audio-source', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
    // Prefer a window source if available, to capture browser audio properly.
    const windowSource = sources.find(source => source.id.includes('window'));
    if (windowSource) {
      return windowSource.id;
    }
    if (sources.length > 0) {
      return sources[0].id;
    }
    throw new Error('No screens available');
  });
  
  ipcMain.handle('capture-blackhole-output', async () => {
    // Simulate capturing output from Blackhole device output
    return "Simulated Blackhole output";
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

