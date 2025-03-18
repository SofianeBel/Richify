import { app, BrowserWindow, ipcMain, dialog, shell, Menu } from 'electron';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import DiscordManager, { setupDiscordIPC } from './discord';
import { getRunningApplications, getRunningApplicationsWithIcons, getApplicationIcon } from './applications';
import { uploadImageToImgur } from './services/image-upload';
import path from 'path';

const execAsync = promisify(exec);

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main
// │ │ │   └── index.js
// │ │ └── preload
// │ │     └── index.js
// │
process.env.DIST = join(__dirname, '../..');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : join(process.env.DIST, '../public');

let mainWindow: BrowserWindow;
let discordManager: DiscordManager | null = null;
const isMac = process.platform === 'darwin';

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  const iconPath = process.env.VITE_PUBLIC 
    ? join(process.env.VITE_PUBLIC, 'icon.ico') 
    : join(__dirname, '../../public/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    },
    autoHideMenuBar: false,
    show: false, // Don't show the window until it's ready
    backgroundColor: '#36393F', // Discord dark theme color
    icon: iconPath
  });

  // Créer le menu de l'application
  const template = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'Fichier',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit', label: 'Quitter' }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        ...(isMac ? [
          { role: 'delete', label: 'Supprimer' },
          { role: 'selectAll', label: 'Tout sélectionner' },
          { type: 'separator' },
        ] : [
          { role: 'delete', label: 'Supprimer' },
          { type: 'separator' },
          { role: 'selectAll', label: 'Tout sélectionner' }
        ])
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { role: 'forceReload', label: 'Forcer l\'actualisation' },
        { role: 'toggleDevTools', label: 'Outils de développement' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Taille réelle' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Consulter la documentation',
          click: async () => {
            await shell.openExternal('https://github.com/electron/electron/tree/main/docs#readme');
          }
        },
        {
          label: 'Signaler un problème',
          click: async () => {
            await shell.openExternal('https://github.com/electron/electron/issues');
          }
        },
        {
          label: 'À propos',
          click: () => {
            showAboutDialog();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);

  // Charger l'application
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = process.env.DIST 
      ? join(process.env.DIST, 'index.html')
      : join(__dirname, '../../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  // Montrer la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load: ${errorDescription} (${errorCode})`);
    const errorPath = process.env.DIST 
      ? join(process.env.DIST, 'error.html')
      : join(__dirname, '../../dist/error.html');
    mainWindow.webContents.loadFile(errorPath);
  });

  // Écouter les erreurs non gérées
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    dialog.showErrorBox(
      'Erreur critique',
      `L'application a rencontré une erreur critique et doit être redémarrée. (${details.reason})`
    );
    app.relaunch();
    app.exit(0);
  });

  // Gérer les liens externes pour qu'ils s'ouvrent dans le navigateur par défaut
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showAboutDialog() {
  const appVersion = app.getVersion();
  const electronVersion = process.versions.electron;
  const nodeVersion = process.versions.node;
  const chromiumVersion = process.versions.chrome;

  dialog.showMessageBox(mainWindow, {
    title: 'À propos de Richify',
    message: 'Richify',
    detail: `Version: ${appVersion}\nElectron: ${electronVersion}\nNode: ${nodeVersion}\nChromium: ${chromiumVersion}\n\nApplication permettant de personnaliser la Rich Presence Discord pour n'importe quelle application.`,
    buttons: ['Fermer'],
    type: 'info'
  });
}

app.whenReady().then(() => {
  createWindow();

  // Configurer les gestionnaires IPC
  setupIpcHandlers();
}).catch((error) => {
  console.error('Error during app initialization:', error);
  dialog.showErrorBox(
    'Erreur d\'initialisation',
    `Une erreur est survenue lors de l'initialisation de l'application: ${error.message || 'Erreur inconnue'}`
  );
  app.exit(1);
});

function setupIpcHandlers() {
  // Gestionnaire pour récupérer les applications en cours d'exécution
  ipcMain.handle('GET_RUNNING_APPS', async () => {
    try {
      const apps = await getRunningApplications();
      return { success: true, data: apps };
    } catch (error) {
      console.error('Error getting running applications:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Gestionnaire pour récupérer les applications avec leurs icônes
  ipcMain.handle('GET_RUNNING_APPS_WITH_ICONS', async () => {
    try {
      const apps = await getRunningApplicationsWithIcons();
      return { success: true, data: apps };
    } catch (error) {
      console.error('Error getting running applications with icons:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Gestionnaire pour récupérer l'icône d'une application spécifique
  ipcMain.handle('GET_APP_ICON', async (_, appId: string) => {
    try {
      const iconUrl = await getApplicationIcon(appId);
      return { success: true, data: iconUrl };
    } catch (error) {
      console.error('Error getting application icon:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Gestionnaire pour initialiser Discord
  ipcMain.handle('INITIALIZE_DISCORD', async (_event, clientId: string) => {
    try {
      if (!discordManager) {
        discordManager = new DiscordManager(mainWindow);
        await discordManager.initialize(clientId);
        
        // Configurer les gestionnaires d'événements Discord
        setupDiscordIPC(ipcMain, discordManager);
      }
      return { success: true };
    } catch (error) {
      console.error('Error initializing Discord:', error);
      mainWindow.webContents.send('DISCORD_ERROR', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Gestionnaire pour la déconnexion de Discord
  ipcMain.on('DISCONNECT_RPC', () => {
    if (discordManager) {
      discordManager.disconnect();
      discordManager = null;
      mainWindow.webContents.send('DISCORD_DISCONNECTED');
    }
  });

  // Gestionnaire pour ouvrir les liens externes
  ipcMain.on('OPEN_EXTERNAL_LINK', (_event, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
  });

  // Gestionnaire pour afficher le menu contextuel
  ipcMain.on('SHOW_APP_MENU', () => {
    Menu.getApplicationMenu()?.popup();
  });

  // Gestionnaire pour montrer la fenêtre "À propos"
  ipcMain.on('SHOW_ABOUT', () => {
    showAboutDialog();
  });

  // Gestionnaire pour vérifier les mises à jour
  ipcMain.handle('CHECK_FOR_UPDATES', async () => {
    // Cette fonction pourrait être implémentée ultérieurement avec electron-updater
    return { updateAvailable: false };
  });

  // Gestionnaire pour obtenir la version de l'application
  ipcMain.handle('GET_APP_VERSION', () => {
    return {
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node,
      chromiumVersion: process.versions.chrome
    };
  });

  // Ajout d'un handler pour vérifier si Discord est lancé sur le système
  ipcMain.handle('CHECK_DISCORD_RUNNING', async () => {
    try {
      // Tentative de détection de Discord en fonction du système d'exploitation
      let isRunning = false;
      
      if (process.platform === 'win32') {
        // Windows - recherche du processus Discord
        const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq Discord.exe" /FO CSV /NH');
        isRunning = stdout.toLowerCase().includes('discord.exe');
        
        // Vérifier aussi Discord PTB et Canary si la version standard n'est pas trouvée
        if (!isRunning) {
          const { stdout: stdoutPTB } = await execAsync('tasklist /FI "IMAGENAME eq DiscordPTB.exe" /FO CSV /NH');
          const { stdout: stdoutCanary } = await execAsync('tasklist /FI "IMAGENAME eq DiscordCanary.exe" /FO CSV /NH');
          isRunning = stdoutPTB.toLowerCase().includes('discordptb.exe') || 
                      stdoutCanary.toLowerCase().includes('discordcanary.exe');
        }
      } else if (process.platform === 'darwin') {
        // macOS - recherche du processus Discord
        const { stdout } = await execAsync('ps -ax | grep -i [d]iscord');
        isRunning = stdout.length > 0;
      } else if (process.platform === 'linux') {
        // Linux - recherche du processus Discord
        const { stdout } = await execAsync('ps -A | grep -i [d]iscord');
        isRunning = stdout.length > 0;
      }
      
      return { 
        success: true, 
        isRunning,
        platform: process.platform
      };
    } catch (error) {
      console.error('Error checking if Discord is running:', error);
      return { 
        success: false, 
        isRunning: false,
        error: (error as Error).message 
      };
    }
  });

  // Gestionnaire pour l'upload d'images
  ipcMain.handle('UPLOAD_IMAGE', async (_event, imageData: string) => {
    try {
      console.log('Demande d\'upload d\'image reçue...');
      const result = await uploadImageToImgur(imageData);
      if (result.success) {
        console.log('Image uploadée avec succès');
        return { 
          success: true, 
          url: result.url 
        };
      } else {
        console.error('Échec de l\'upload d\'image:', result.error);
        return { 
          success: false, 
          error: result.error || 'Échec de l\'upload d\'image' 
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload d\'image:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  });
}

// Gestion des autres instances de l'application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Si quelqu'un essaie d'ouvrir une autre instance, on affiche notre fenêtre principale
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (discordManager) {
      discordManager.disconnect();
    }
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestion des erreurs non gérées
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  dialog.showErrorBox(
    'Erreur non gérée',
    `Une erreur non gérée est survenue: ${error.message}\n\nL'application va être fermée.`
  );
  
  // Assurez-vous de déconnecter Discord proprement
  if (discordManager) {
    discordManager.disconnect();
  }
  
  app.exit(1);
}); 