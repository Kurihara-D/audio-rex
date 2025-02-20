import { contextBridge, ipcRenderer } from 'electron';

// APIをウィンドウオブジェクトに安全に公開
contextBridge.exposeInMainWorld('electronAPI', {
  // システムオーディオデバイスの操作
  getSystemAudioDevices: () => ipcRenderer.invoke('get-system-audio-devices'),
  setSystemAudioDevice: (deviceName: string) => ipcRenderer.invoke('set-system-audio-device', deviceName),
});

// TypeScriptの型定義
declare global {
  interface Window {
    electronAPI: {
      getSystemAudioDevices: () => Promise<Array<{ name: string; selected: boolean }>>;
      setSystemAudioDevice: (deviceName: string) => Promise<void>;
    };
  }
}