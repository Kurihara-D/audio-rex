import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AudioDevice {
  name: string;
  id: number;
  isOutput: boolean;
}

interface AudioManager {
  getDeviceList(): Promise<Array<{ name: string; selected?: boolean }>>;
  setDevice(deviceName: string): Promise<boolean>;
}

interface NativeAudioModule {
  getDeviceList(): AudioDevice[];
  getCurrentDevice(): number;
  setDefaultDevice(deviceId: number): boolean;
}

// CoreAudioネイティブモジュールのパスを取得
function getNativeModulePath(): string {
  if (isDev) {
    return path.join(app.getAppPath(), 'native', 'build', 'Release', 'audio.node');
  } else {
    return path.join(process.resourcesPath, 'native', 'audio.node');
  }
}

// SwitchAudioSourceバイナリのパスを取得
function getSwitchAudioSourcePath(): string {
  if (isDev) {
    return path.join(app.getAppPath(), 'bin', 'SwitchAudioSource');
  } else {
    return path.join(process.resourcesPath, 'bin', 'SwitchAudioSource');
  }
}

// CoreAudioマネージャーの実装
class CoreAudioManager implements AudioManager {
  private nativeModule: NativeAudioModule;

  constructor() {
    try {
      this.nativeModule = require(getNativeModulePath());
    } catch (error) {
      console.error('CoreAudioモジュールのロードに失敗:', error);
      throw error;
    }
  }

  async getDeviceList(): Promise<Array<{ name: string; selected?: boolean }>> {
    try {
      const devices: AudioDevice[] = this.nativeModule.getDeviceList();
      const currentDevice: number = this.nativeModule.getCurrentDevice();
      
      return devices
        .filter((device: AudioDevice) => device.isOutput)
        .map((device: AudioDevice) => ({
          name: device.name,
          selected: device.id === currentDevice
        }));
    } catch (error) {
      console.error('デバイス一覧の取得に失敗:', error);
      throw error;
    }
  }

  async setDevice(deviceName: string): Promise<boolean> {
    try {
      const devices: AudioDevice[] = this.nativeModule.getDeviceList();
      const device = devices.find((d: AudioDevice) => d.name === deviceName && d.isOutput);
      if (!device) {
        return false;
      }
      return this.nativeModule.setDefaultDevice(device.id);
    } catch (error) {
      console.error('デバイスの設定に失敗:', error);
      return false;
    }
  }
}

// SwitchAudioSourceマネージャーの実装
class SwitchAudioManager implements AudioManager {
  async getDeviceList(): Promise<Array<{ name: string; selected?: boolean }>> {
    try {
      const switchAudioSource = getSwitchAudioSourcePath();
      const { stdout } = await execAsync(`"${switchAudioSource}" -a`);
      const { stdout: currentDevice } = await execAsync(`"${switchAudioSource}" -c`);
      
      const uniqueDevices = new Set(stdout.split('\n').filter(line => line.trim()));
      
      return Array.from(uniqueDevices).map(deviceName => ({
        name: deviceName.trim(),
        selected: deviceName.trim() === currentDevice.trim()
      }));
    } catch (error) {
      console.error('デバイス一覧の取得に失敗:', error);
      throw error;
    }
  }

  async setDevice(deviceName: string): Promise<boolean> {
    try {
      const switchAudioSource = getSwitchAudioSourcePath();
      await execAsync(`"${switchAudioSource}" -s "${deviceName}"`);
      return true;
    } catch (error) {
      console.error('デバイスの設定に失敗:', error);
      return false;
    }
  }
}

// オーディオマネージャーのインスタンスを作成
let audioManager: AudioManager;

function initializeAudioManager() {
  try {
    audioManager = new CoreAudioManager();
    console.log('CoreAudioマネージャーを初期化しました');
  } catch (error) {
    console.log('CoreAudioの初期化に失敗、SwitchAudioSourceにフォールバック:', error);
    audioManager = new SwitchAudioManager();
  }
}

// IPCハンドラーの設定
function setupIpcHandlers() {
  ipcMain.handle('get-system-audio-devices', async () => {
    try {
      return await audioManager.getDeviceList();
    } catch (error) {
      console.error('オーディオデバイス取得エラー:', error);
      return [];
    }
  });

  ipcMain.handle('set-system-audio-device', async (_, deviceName: string) => {
    try {
      return await audioManager.setDevice(deviceName);
    } catch (error) {
      console.error('オーディオデバイス切り替えエラー:', error);
      return false;
    }
  });
}

// Service Workerのクリーンアップ
async function clearServiceWorkers() {
  try {
    const defaultSession = session.defaultSession;
    await defaultSession.clearStorageData({
      storages: ['serviceworkers']
    });
  } catch (error) {
    console.error('Service Workerのクリーンアップに失敗:', error);
  }
}

async function createWindow() {
  // 起動時にService Workerをクリーンアップ
  await clearServiceWorkers();

  console.log('Creating window...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Is Development:', isDev);
  console.log('Current directory:', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('Resource Path:', process.resourcesPath);
  console.log('SwitchAudioSource Path:', getSwitchAudioSourcePath());
  console.log('Native Audio Module Path:', getNativeModulePath());
  console.log('Audio Manager Type:', audioManager instanceof CoreAudioManager ? 'CoreAudio' : 'SwitchAudioSource');

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
      preload: path.join(__dirname, 'preload.js'),
      // Service Worker用のパーティションを指定
      partition: 'persist:main'
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
  // オーディオマネージャーの初期化
  initializeAudioManager();
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