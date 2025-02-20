export {};

declare global {
  interface Window {
    electronAPI: {
      getSystemAudioDevices: () => Promise<Array<{ name: string; selected: boolean }>>;
      setSystemAudioDevice: (deviceName: string) => Promise<void>;
    };
  }
}