import { Client } from 'discord-rpc';
import { BrowserWindow, IpcMainEvent, IpcMain } from 'electron';

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

// Variable globale pour suivre si les handlers IPC ont déjà été enregistrés
let ipcHandlersRegistered = false;

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
  private disconnectRequested: boolean = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.startTime = Date.now();
  }

  async initialize(clientId: string): Promise<void> {
    if (this.connected && this.clientId === clientId) {
      console.log('Discord déjà initialisé avec le même Client ID');
      return;
    }

    // Reset l'état
    this.disconnectRequested = false;

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

    // Si une déconnexion a été demandée, ne pas tenter de se reconnecter
    if (this.disconnectRequested) {
      console.log('Reconnexion annulée car une déconnexion a été demandée');
      return;
    }

    this.connectionAttempts++;
    console.log(`Tentative de connexion à Discord (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);

    try {
      await this.client.login({ clientId: this.clientId });
      this.connected = true;
      this.connectionAttempts = 0;
      console.log('Connecté à Discord avec succès');

      // Gérer les événements
      this.client.on('ready', () => {
        console.log('Discord RPC ready');
        this.mainWindow?.webContents.send('DISCORD_CONNECTED');
      });

      this.client.on('disconnected', () => {
        if (this.disconnectRequested) {
          console.log('Déconnexion planifiée de Discord');
        } else {
          console.log('Discord RPC disconnected unexpectedly');
          this.connected = false;
          this.mainWindow?.webContents.send('DISCORD_DISCONNECTED');
          
          // Essayer de se reconnecter automatiquement
          this.attemptReconnect();
        }
      });
    } catch (error) {
      if (this.connectionAttempts < this.maxConnectionAttempts && !this.disconnectRequested) {
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
    
    // Si une déconnexion a été demandée, ne pas tenter de se reconnecter
    if (this.disconnectRequested) {
      console.log('Reconnexion annulée car une déconnexion a été demandée');
      return;
    }
    
    this.reconnectTimeout = setTimeout(async () => {
      if (!this.connected && this.clientId && !this.disconnectRequested) {
        console.log('Tentative de reconnexion à Discord...');
        try {
          this.client = new Client({ transport: 'ipc' });
          await this.connect();
          
          // Si on a réussi à se reconnecter et qu'on avait une présence active,
          // on la restaure
          if (this.connected && this.currentPresence) {
            console.log('Reconnexion réussie, restauration de la présence');
            await this.updatePresence(this.currentPresence);
          }
        } catch (error) {
          console.error('Échec de la tentative de reconnexion:', error);
          // Planifier une nouvelle tentative après un délai
          this.attemptReconnect();
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
      console.log('Présence Discord mise à jour avec succès:', presence);
      
      // Informer le renderer que la présence a été mise à jour
      this.mainWindow?.webContents.send('PRESENCE_UPDATED', presence);
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
    // Marquer que la déconnexion est intentionnelle
    this.disconnectRequested = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.client) {
      try {
        console.log('Déconnexion de Discord...');
        await this.client.clearActivity();
        await this.client.destroy();
        this.connected = false;
        this.client = null;
        this.currentActivity = null;
        console.log('Déconnecté de Discord avec succès');
      } catch (error) {
        console.error('Erreur lors de la déconnexion de Discord:', error);
        // Ne pas renvoyer l'erreur ici pour éviter de bloquer la fermeture
      }
    }
    
    // Réinitialiser l'état de déconnexion
    this.disconnectRequested = false;
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
export function setupDiscordIPC(ipcMain: IpcMain, discordManager: DiscordManager): void {
  // Éviter d'enregistrer les gestionnaires plusieurs fois
  if (ipcHandlersRegistered) {
    console.log('Les gestionnaires IPC de Discord ont déjà été enregistrés, ignoré.');
    return;
  }
  
  console.log('Enregistrement des gestionnaires IPC de Discord...');

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
  
  // Marquer les gestionnaires comme enregistrés
  ipcHandlersRegistered = true;
  console.log('Gestionnaires IPC de Discord enregistrés avec succès');
}

export default DiscordManager; 