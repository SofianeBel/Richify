import { Client } from 'discord-rpc';
import { BrowserWindow } from 'electron';

class DiscordManager {
  private client: Client | null = null;
  private clientId: string = '';
  private mainWindow: BrowserWindow | null = null;
  private connected: boolean = false;
  private currentActivity: any = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
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

  async updatePresence(details: string, state: string, largeImageKey?: string, largeImageText?: string): Promise<void> {
    if (!this.client || !this.connected) {
      throw new Error('Discord client not connected');
    }

    try {
      const activity = {
        details,
        state,
        largeImageKey: largeImageKey || 'default',
        largeImageText: largeImageText || details,
        startTimestamp: Date.now(),
        instance: false,
      };

      await this.client.setActivity(activity);
      this.currentActivity = activity;
      console.log('Presence updated:', activity);
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
}

export default DiscordManager; 