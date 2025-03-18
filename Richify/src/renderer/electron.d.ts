interface IpcRenderer {
  invoke(channel: string, ...args: any[]): Promise<any>;
  send(channel: string, ...args: any[]): void;
  on(channel: string, callback: (...args: any[]) => void): void;
  removeListener(channel: string, callback: (...args: any[]) => void): void;
}

interface Electron {
  ipcRenderer: IpcRenderer;
}

declare global {
  interface Window {
    electron: Electron;
  }
} 