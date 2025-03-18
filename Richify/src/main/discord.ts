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

interface ErrorResponse {
  code?: number;
  message: string;
  details?: string;
}

class DiscordManager {
  private client: Client | null = null;
  private clientId: string = '';
  private mainWindow: BrowserWindow | null = null;
  private connected: boolean = false;
  private currentActivity: any = null;
  private startTime: number;
  private currentPresence: PresenceData | null = null;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;

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
    this.connectionAttempts = 0;

    try {
      // Connexion à Discord
      await this.connect();
    } catch (error) {
      const errorResponse = this.formatError(error, 'Failed to connect to Discord');
      console.error('Failed to connect to Discord:', errorResponse);
      this.mainWindow?.webContents.send('DISCORD_ERROR', errorResponse);
      throw error;
    }
  }

  private async connect(): Promise<void> {
    if (!this.client || !this.clientId) {
      throw new Error('Client or Client ID not initialized');
    }

    this.connectionAttempts++;

    try {
      await this.client.login({ clientId: this.clientId });
      this.connected = true;
      this.connectionAttempts = 0;
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
        
        // Essayer de se reconnecter automatiquement
        this.attemptReconnect();
      });
    } catch (error) {
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        console.log(`Connection attempt ${this.connectionAttempts} failed, retrying in 5 seconds...`);
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Réessayer de se connecter
        return this.connect();
      } else {
        this.connected = false;
        const errorResponse = this.formatError(error, 'Failed to connect after multiple attempts');
        this.mainWindow?.webContents.send('DISCORD_ERROR', errorResponse);
        throw new Error(`Failed to connect after ${this.maxConnectionAttempts} attempts: ${errorResponse.message}`);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(async () => {
      if (!this.connected && this.clientId) {
        console.log('Attempting to reconnect to Discord...');
        try {
          this.client = new Client({ transport: 'ipc' });
          await this.connect();
          
          // Si on a réussi à se reconnecter et qu'on avait une présence active,
          // on la restaure
          if (this.connected && this.currentPresence) {
            await this.updatePresence(this.currentPresence);
          }
        } catch (error) {
          console.error('Failed to reconnect:', error);
        }
      }
    }, 10000); // Attendre 10 secondes avant de tenter de se reconnecter
  }

  async updatePresence(data: PresenceData): Promise<void> {
    if (!this.client || !this.connected) {
      const error = new Error('Discord client not connected');
      this.mainWindow?.webContents.send('DISCORD_ERROR', this.formatError(error));
      throw error;
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
        // Vérifier si c'est une URL d'image directe (data URL ou http)
        if (data.largeImageKey.startsWith('data:image/') || data.largeImageKey.startsWith('http')) {
          presence.largeImageKey = data.largeImageKey;
        } else {
          // Utiliser comme clé d'asset Discord
          presence.largeImageKey = data.largeImageKey;
        }
        
        if (data.largeImageText) {
          presence.largeImageText = data.largeImageText;
        }
      }

      if (data.smallImageKey) {
        // Vérifier si c'est une URL d'image directe (data URL ou http)
        if (data.smallImageKey.startsWith('data:image/') || data.smallImageKey.startsWith('http')) {
          presence.smallImageKey = data.smallImageKey;
        } else {
          // Utiliser comme clé d'asset Discord
          presence.smallImageKey = data.smallImageKey;
        }
        
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
      const errorResponse = this.formatError(error, 'Failed to update presence');
      console.error('Failed to update presence:', errorResponse);
      this.mainWindow?.webContents.send('DISCORD_ERROR', errorResponse);
      
      // Si l'erreur est liée à une déconnexion, essayer de se reconnecter
      if (this.isDisconnectionError(error)) {
        this.connected = false;
        this.mainWindow?.webContents.send('DISCORD_DISCONNECTED');
        this.attemptReconnect();
      }
      
      throw error;
    }
  }

  private isDisconnectionError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message || String(error);
    return (
      errorMessage.includes('connection') ||
      errorMessage.includes('disconnected') ||
      errorMessage.includes('not connected')
    );
  }

  private formatError(error: any, defaultMessage: string = 'Une erreur est survenue'): ErrorResponse {
    if (!error) {
      return { message: defaultMessage };
    }
    
    let errorCode: number | undefined;
    let errorMessage: string = defaultMessage;
    let errorDetails: string | undefined;
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      errorMessage = error.message || defaultMessage;
      errorDetails = error.stack;
    } else if (typeof error === 'object') {
      errorCode = error.code;
      errorMessage = error.message || defaultMessage;
      errorDetails = error.details || error.stack;
    }
    
    return {
      code: errorCode,
      message: errorMessage,
      details: errorDetails
    };
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
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
        // Ne pas renvoyer l'erreur ici pour éviter de bloquer la fermeture
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
  
  ipcMain.handle('GET_DISCORD_STATUS', () => {
    return {
      connected: discordManager.isConnected(),
      presence: discordManager.getCurrentPresence()
    };
  });
}

export default DiscordManager; 