import { Client } from 'discord-rpc';
import { BrowserWindow, IpcMainEvent } from 'electron';

interface PresenceData {
  details?: string;
  state?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  startTimestamp?: boolean;
  applicationId?: string;
  applicationName?: string;
}

class DiscordManager {
  private client: Client | null = null;
  private clientId: string = '';
  private mainWindow: BrowserWindow | null = null;
  private connected: boolean = false;
  private currentActivity: any = null;
  private startTime: number;
  private currentPresence: PresenceData | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.startTime = Date.now();
  }

  async initialize(clientId: string): Promise<void> {
    if (this.connected && this.clientId === clientId) {
      return;
    }

    // Déconnecter le client existant si nécessaire
    await this.disconnect();

    this.clientId = clientId;
    this.client = new Client({ transport: 'ipc' });

    try {
      // Connexion à Discord
      await this.client.login({ clientId });
      this.connected = true;
      console.log('Connected to Discord');

      // Gérer les événements
      this.client.on('ready', () => {
        console.log('Discord RPC ready');
        this.mainWindow?.webContents.send('DISCORD_CONNECTED');
      });

      this.client.on('disconnected', () => {
        console.log('Discord RPC disconnected');
        this.connected = false;
        this.mainWindow?.webContents.send('DISCORD_DISCONNECTED');
      });
    } catch (error) {
      console.error('Failed to connect to Discord:', error);
      this.mainWindow?.webContents.send('DISCORD_ERROR', error);
      throw error;
    }
  }

  async updatePresence(data: PresenceData): Promise<void> {
    if (!this.client || !this.connected) {
      throw new Error('Discord client not connected');
    }

    try {
      this.currentPresence = data;

      const presence: any = {
        details: data.details || 'No details',
        state: data.state || 'No state',
      };

      // Ajouter le timestamp si activé
      if (data.startTimestamp) {
        presence.startTimestamp = this.startTime;
      }

      // Ajouter les images si spécifiées
      if (data.largeImageKey) {
        presence.largeImageKey = data.largeImageKey;
        if (data.largeImageText) {
          presence.largeImageText = data.largeImageText;
        }
      }

      if (data.smallImageKey) {
        presence.smallImageKey = data.smallImageKey;
        if (data.smallImageText) {
          presence.smallImageText = data.smallImageText;
        }
      }

      // Ajouter les boutons si spécifiés
      const buttons = [];
      if (data.button1Label && data.button1Url) {
        buttons.push({
          label: data.button1Label,
          url: data.button1Url
        });
      }
      if (data.button2Label && data.button2Url) {
        buttons.push({
          label: data.button2Label,
          url: data.button2Url
        });
      }
      if (buttons.length > 0) {
        presence.buttons = buttons;
      }

      await this.client.setActivity(presence);
      this.currentActivity = presence;
      console.log('Updated Discord presence:', presence);
    } catch (error) {
      console.error('Failed to update presence:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.clearActivity();
        await this.client.destroy();
        this.connected = false;
        this.client = null;
        this.currentActivity = null;
        console.log('Disconnected from Discord');
      } catch (error) {
        console.error('Error disconnecting from Discord:', error);
        throw error;
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getCurrentActivity() {
    return this.currentActivity;
  }

  getCurrentPresence(): PresenceData | null {
    return this.currentPresence;
  }
}

// Gestionnaire d'événements pour l'IPC
export function setupDiscordIPC(ipcMain: Electron.IpcMain, discordManager: DiscordManager): void {
  ipcMain.on('UPDATE_PRESENCE', async (_event: IpcMainEvent, data: PresenceData) => {
    try {
      await discordManager.updatePresence(data);
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  });
}

export default DiscordManager; 