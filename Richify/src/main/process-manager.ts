import { ipcMain } from 'electron';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

interface ProcessInfo {
  id: string;
  name: string;
  path: string;
  icon?: string;
}

class ProcessManager {
  private cachedProcesses: ProcessInfo[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 secondes
  private selectedApp: ProcessInfo | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    ipcMain.handle('GET_RUNNING_APPS', async () => {
      try {
        const apps = await this.getRunningApps();
        return { success: true, data: apps };
      } catch (error) {
        console.error('Erreur lors de la récupération des applications:', error);
        return { success: false, error: 'Impossible de récupérer la liste des applications' };
      }
    });

    ipcMain.on('SELECT_APPLICATION', (_, appId: string) => {
      const apps = this.cachedProcesses || [];
      this.selectedApp = apps.find(app => app.id === appId) || null;
      console.log('Application sélectionnée:', this.selectedApp?.name);
    });

    ipcMain.handle('GET_APP_ICON', async (_, appPath: string) => {
      try {
        return await this.getAppIcon(appPath);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'icône:', error);
        return 'default-icon';
      }
    });
  }

  private async getRunningApps(): Promise<ProcessInfo[]> {
    // Vérifier si le cache est valide
    const now = Date.now();
    if (this.cachedProcesses && (now - this.lastCacheTime) < this.CACHE_DURATION) {
      return this.cachedProcesses;
    }

    const processes = await this.getProcessList();
    const apps = processes.map((process, index) => ({
      id: `${this.getAppName(process)}-${index}`,
      name: this.getAppName(process),
      path: process,
      icon: this.getAppIcon(process)
    }));

    // Mettre en cache les résultats
    this.cachedProcesses = apps;
    this.lastCacheTime = now;

    return apps;
  }

  private async getProcessList(): Promise<string[]> {
    // Pour Windows, nous utilisons tasklist avec des options optimisées
    const { exec } = require('child_process');
    return new Promise((resolve, reject) => {
      exec('tasklist /v /fo csv /nh', (error: any, stdout: string) => {
        if (error) {
          reject(error);
          return;
        }

        const processes = stdout
          .split('\n')
          .filter(line => line.trim()) // Ignorer les lignes vides
          .map(line => {
            const [name, pid, sessionName, sessionNum, memUsage, status, username, cpuTime, windowTitle] = 
              line.split(',').map(s => s.replace(/"/g, ''));
            return { name, pid, windowTitle };
          })
          .filter(proc => proc.windowTitle && !proc.windowTitle.includes('N/A'))
          .map(proc => proc.windowTitle);

        resolve(processes);
      });
    });
  }

  private getAppName(appPath: string): string {
    return path.basename(appPath, path.extname(appPath));
  }

  private getAppIcon(appPath: string): string {
    try {
      // Pour Windows, nous pouvons extraire l'icône de l'exécutable
      const iconPath = path.join(os.tmpdir(), `${this.getAppName(appPath)}.ico`);
      
      if (!fs.existsSync(iconPath)) {
        // TODO: Implémenter l'extraction d'icône
        // Pour l'instant, on retourne une icône par défaut
        return 'default-icon';
      }

      return iconPath;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'icône:', error);
      return 'default-icon';
    }
  }
}

export default ProcessManager; 