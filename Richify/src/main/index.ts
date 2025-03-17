import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import DiscordManager from './discord';

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

let win: BrowserWindow | null = null;
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
  win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
  });

  // Initialiser le gestionnaire Discord
  discordManager = new DiscordManager(win);

  // Enable DevTools in development
  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }

  // Log preload script path
  const preloadPath = join(__dirname, '../preload/index.js');
  console.log('Preload script path:', preloadPath);

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    console.log('Window loaded');
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  // Log any errors
  win.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('Preload error:', { preloadPath, error });
  });

  if (VITE_DEV_SERVER_URL) {
    console.log('Loading from dev server:', VITE_DEV_SERVER_URL);
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    const indexPath = join(process.env.DIST || '', 'index.html');
    console.log('Loading from file:', indexPath);
    win.loadFile(indexPath);
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  win = null;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// Handle IPC messages
ipcMain.handle('GET_RUNNING_APPS', async () => {
  try {
    const applications = await getRunningApplications();
    return {
      success: true,
      data: applications
    };
  } catch (error) {
    console.error('Error in GET_RUNNING_APPS:', error);
    return {
      success: false,
      error: 'Failed to get running applications'
    };
  }
});

ipcMain.handle('INITIALIZE_DISCORD', async (event, clientId: string) => {
  try {
    if (!discordManager) {
      throw new Error('Discord manager not initialized');
    }
    await discordManager.initialize(clientId);
    return { success: true };
  } catch (error) {
    console.error('Error initializing Discord:', error);
    return { success: false, error: 'Failed to initialize Discord' };
  }
});

ipcMain.on('SELECT_APPLICATION', async (event, app) => {
  try {
    if (!discordManager) {
      throw new Error('Discord manager not initialized');
    }

    // Mettre à jour la présence avec les informations de l'application
    await discordManager.updatePresence(
      app.name, // Détails
      `PID: ${app.processId}`, // État
      'app', // Clé de l'image
      app.windowTitle // Texte de l'image
    );

    event.reply('PRESENCE_UPDATED', { success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    event.reply('PRESENCE_UPDATED', { 
      success: false, 
      error: 'Failed to update Discord presence' 
    });
  }
});

ipcMain.on('UPDATE_PRESENCE', async (event, presence) => {
  try {
    if (!discordManager) {
      throw new Error('Discord manager not initialized');
    }

    await discordManager.updatePresence(
      presence.details,
      presence.state,
      presence.largeImageKey,
      presence.largeImageText
    );

    event.reply('PRESENCE_UPDATED', { success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    event.reply('PRESENCE_UPDATED', { 
      success: false, 
      error: 'Failed to update Discord presence' 
    });
  }
});

ipcMain.on('DISCONNECT_RPC', async (event) => {
  try {
    if (discordManager) {
      await discordManager.disconnect();
    }
    event.reply('RPC_DISCONNECTED', { success: true });
  } catch (error) {
    console.error('Error disconnecting RPC:', error);
    event.reply('RPC_DISCONNECTED', { 
      success: false, 
      error: 'Failed to disconnect Discord RPC' 
    });
  }
}); 