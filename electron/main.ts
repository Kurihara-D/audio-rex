import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// システムオーディオデバイスの取得
async function getSystemAudioDevices() {
  try {
    const { stdout } = await execAsync('SwitchAudioSource -a');
    const { stdout: currentDevice } = await execAsync('SwitchAudioSource -c');
    
    // デバイス名の重複を防ぐために、Set を使用して一意のデバイスリストを作成
    const uniqueDevices = new Set(stdout.split('\n').filter(line => line.trim()));
    
    const devices = Array.from(uniqueDevices).map(deviceName => ({
      name: deviceName.trim(),
      selected: deviceName.trim() === currentDevice.trim()
    }));
    
    return devices;
  } catch (error) {
    console.error('オーディオデバイス取得エラー:', error);
    return [];
  }
}

// システムオーディオデバイスの切り替え
async function setSystemAudioDevice(deviceName: string) {
  try {
    await execAsync(`SwitchAudioSource -s "${deviceName}"`);
    return true;
  } catch (error) {
    console.error('オーディオデバイス切り替えエラー:', error);
    return false;
  }
}

// IPCハンドラーの設定
function setupIpcHandlers() {
  ipcMain.handle('get-system-audio-devices', getSystemAudioDevices);
  ipcMain.handle('set-system-audio-device', (_, deviceName) => setSystemAudioDevice(deviceName));
}

async function createWindow() {
  console.log('Creating window...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Is Development:', isDev);
  console.log('Current directory:', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('Resource Path:', process.resourcesPath);

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#121212',
  });

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();
  });

  // 開発環境ではローカルサーバー、本番環境ではビルドされたファイルを読み込む
  try {
    if (isDev) {
      console.log('Development mode: Loading from localhost:3000');
      await mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
    } else {
      // 本番環境での読み込みパスを順番に試行
      const possiblePaths = [
        path.join(process.resourcesPath, 'dist', 'index.html'),
        path.join(__dirname, '..', 'dist', 'index.html'),
        path.join(__dirname, 'dist', 'index.html'),
        path.join(app.getAppPath(), 'dist', 'index.html')
      ];

      console.log('Production mode: Attempting to load file...');
      console.log('Possible paths:', possiblePaths);

      let loaded = false;
      for (const indexPath of possiblePaths) {
        try {
          console.log('Trying path:', indexPath);
          if (fs.existsSync(indexPath)) {
            console.log('Found index.html at:', indexPath);
            await mainWindow.loadFile(indexPath);
            console.log('Successfully loaded from:', indexPath);
            loaded = true;
            break;
          }
        } catch (e) {
          console.log('Failed to load from:', indexPath, e);
        }
      }

      if (!loaded) {
        throw new Error(`Could not find index.html in any of the possible locations: ${possiblePaths.join(', ')}`);
      }
    }
  } catch (err: any) {
    console.error('Error loading application:', err);
    // エラーをダイアログで表示
    const errorWindow = new BrowserWindow({
      width: 800,
      height: 600,
      show: true
    });
    errorWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <body>
          <h1>Error Loading Application</h1>
          <pre>${err.stack || err.message || 'Unknown error'}</pre>
        </body>
      </html>
    `);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
    setupIpcHandlers();
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});