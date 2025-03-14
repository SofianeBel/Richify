import { Client } from 'discord-rpc';
import { ipcMain } from 'electron';

const clientId = '1349771102842392606';

class DiscordRPCManager {
  private client: typeof Client;
  private isConnected: boolean = false;
  private startTimestamp: number;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.client = new Client({ transport: 'ipc' });
    this.startTimestamp = Date.now();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      console.log('Discord RPC connecté!');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('disconnected', () => {
      console.log('Discord RPC déconnecté');
      this.isConnected = false;
      this.attemptReconnect();
    });

    ipcMain.on('UPDATE_PRESENCE', async (event, presenceData) => {
      try {
        if (!this.isConnected) {
          await this.connect();
        }
        await this.updatePresence(presenceData);
        event.reply('PRESENCE_UPDATED', { success: true });
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la présence:', error);
        event.reply('PRESENCE_UPDATED', { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
        this.attemptReconnect();
      }
    });

    ipcMain.on('DISCONNECT_RPC', async (event) => {
      try {
        await this.disconnect();
        event.reply('RPC_DISCONNECTED', { success: true });
      } catch (error) {
        event.reply('RPC_DISCONNECTED', { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    });
  }

  private async connect() {
    try {
      if (this.isConnected) {
        return;
      }

      await this.client.login({ clientId });
      console.log('Connecté à Discord RPC');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Erreur de connexion à Discord RPC:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      await this.client.destroy();
      this.isConnected = false;
      console.log('Déconnecté de Discord RPC');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(async () => {
      try {
        this.reconnectAttempts++;
        console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        await this.connect();
      } catch (error) {
        console.error('Échec de la tentative de reconnexion:', error);
        this.attemptReconnect();
      }
    }, 5000 * Math.min(this.reconnectAttempts + 1, 5)); // Délai croissant avec un maximum de 25 secondes
  }

  private async updatePresence(presenceData: any) {
    try {
      if (!this.isConnected) {
        throw new Error('Non connecté à Discord');
      }

      await this.client.setActivity({
        details: presenceData.details || 'En ligne',
        state: presenceData.state,
        startTimestamp: this.startTimestamp,
        largeImageKey: presenceData.largeImageKey,
        largeImageText: presenceData.largeImageText,
        smallImageKey: presenceData.smallImageKey,
        smallImageText: presenceData.smallImageText,
        instance: false,
      });
      console.log('Présence mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la présence:', error);
      throw error;
    }
  }
}

export default new DiscordRPCManager(); 