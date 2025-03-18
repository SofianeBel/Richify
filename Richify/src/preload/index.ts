import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script starting...');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => {
        console.log('Sending message:', channel, args);
        // whitelist channels
        const validChannels = [
          'SELECT_APPLICATION', 
          'UPDATE_PRESENCE', 
          'DISCONNECT_RPC',
          'OPEN_EXTERNAL_LINK',
          'SHOW_APP_MENU',
          'SHOW_ABOUT',
          'UPDATE_SETTINGS'
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, ...args);
        }
      },
      on: (channel: string, func: (...args: any[]) => void) => {
        console.log('Registering listener:', channel);
        // whitelist channels
        const validChannels = [
          'PRESENCE_UPDATED',
          'RPC_DISCONNECTED',
          'DISCORD_CONNECTED',
          'DISCORD_DISCONNECTED',
          'DISCORD_ERROR',
          'APP_UPDATE_AVAILABLE',
          'APP_UPDATE_DOWNLOADED'
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.on(channel, (event, ...args) => {
            console.log('Received message:', channel, args);
            func(...args);
          });
        }
      },
      removeListener: (channel: string, func: (...args: any[]) => void) => {
        console.log('Removing listener:', channel);
        const validChannels = [
          'PRESENCE_UPDATED',
          'RPC_DISCONNECTED',
          'DISCORD_CONNECTED',
          'DISCORD_DISCONNECTED',
          'DISCORD_ERROR',
          'APP_UPDATE_AVAILABLE',
          'APP_UPDATE_DOWNLOADED'
        ];
        if (validChannels.includes(channel)) {
          ipcRenderer.removeListener(channel, func);
        }
      },
      invoke: (channel: string, ...args: any[]) => {
        console.log('Invoking:', channel, args);
        // whitelist channels
        const validChannels = [
          'GET_RUNNING_APPS', 
          'INITIALIZE_DISCORD', 
          'GET_RUNNING_APPS_WITH_ICONS', 
          'GET_APP_ICON',
          'GET_DISCORD_STATUS',
          'GET_APP_VERSION',
          'CHECK_FOR_UPDATES'
        ];
        if (validChannels.includes(channel)) {
          return ipcRenderer.invoke(channel, ...args);
        }
        return Promise.reject(new Error(`Channel ${channel} is not allowed`));
      }
    }
  }
);

console.log('Preload script finished'); 