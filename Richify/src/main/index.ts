import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import DiscordManager, { setupDiscordIPC } from './discord';
import { getRunningApplications } from './applications';

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

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

async function getRunningApplications() {
  try {
    // Sur Windows, on utilise PowerShell pour obtenir les fenêtres visibles
    const command = 'powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Csv"';
    
    const { stdout } = await execAsync(command);
    const applications = new Set<{ id: string, name: string }>();

    const lines = stdout.split('\n').slice(1); // Skip header
    lines.forEach(line => {
      // Format: "Id","ProcessName","MainWindowTitle"
      const match = line.match(/"(\d+)","([^"]+)","([^"]*)"/);
      if (match) {
        const [_, pid, name, title] = match;
        // On ne garde que les applications avec un titre de fenêtre
        if (name && pid && title.trim()) {
          // On utilise le titre de la fenêtre si disponible, sinon le nom du processus
          const displayName = title.trim() || name;
          applications.add({ id: pid, name: displayName });
        }
      }
    });

    return Array.from(applications)
      .filter(app => {
        const name = app.name.toLowerCase();
        // Filtrer les applications système courantes
        return !name.includes('system') &&
               !name.includes('runtime') &&
               !name.includes('service') &&
               !name.includes('powershell') &&
               !name.includes('cmd') &&
               !name.includes('explorer');
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error getting running applications:', error);
    return [];
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js')
    }
  });

  mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
}

app.whenReady().then(() => {
  createWindow();

  // Configurer les gestionnaires IPC
  setupIpcHandlers();
});

function setupIpcHandlers() {
  // Gestionnaire pour récupérer les applications en cours d'exécution
  ipcMain.handle('GET_RUNNING_APPS', async () => {
    try {
      const apps = await getRunningApplications();
      return { success: true, data: apps };
    } catch (error) {
      console.error('Error getting running applications:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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