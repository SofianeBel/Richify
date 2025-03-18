import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const execAsync = promisify(exec);

interface Application {
  id: string;
  name: string;
}

export interface ApplicationWithIcon extends Application {
  iconUrl?: string;
}

export async function getRunningApplications(): Promise<Application[]> {
  try {
    // Sur Windows, on utilise PowerShell pour obtenir les fenêtres visibles
    const command = 'powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne \'\'} | Select-Object Id,ProcessName,MainWindowTitle | ConvertTo-Csv"';
    
    const { stdout } = await execAsync(command);
    const applications = new Set<Application>();

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

/**
 * Extrait les icônes des applications en cours d'exécution
 * @param appId L'ID du processus
 * @returns Une promesse qui résout avec l'URL de l'icône ou undefined si échec
 */
export async function getApplicationIcon(appId: string): Promise<string | undefined> {
  try {
    // Dossier temporaire pour sauvegarder les icônes
    const iconDir = path.join(app.getPath('userData'), 'app-icons');
    if (!fs.existsSync(iconDir)) {
      fs.mkdirSync(iconDir, { recursive: true });
    }

    const iconPath = path.join(iconDir, `app-${appId}.png`);
    
    // PowerShell script pour extraire l'icône d'un processus et la sauvegarder
    const script = `
    Add-Type -AssemblyName System.Drawing
    $process = Get-Process -Id ${appId}
    try {
      $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($process.MainModule.FileName)
      if ($icon) {
        $bitmap = $icon.ToBitmap()
        $bitmap.Save("${iconPath.replace(/\\/g, '\\\\')}")
        $bitmap.Dispose()
        $icon.Dispose()
        Write-Output "SUCCESS:${iconPath.replace(/\\/g, '\\\\')}"
      } else {
        Write-Output "ERROR:No icon found"
      }
    } catch {
      Write-Output "ERROR:$($_.Exception.Message)"
    }
    `;

    const scriptPath = path.join(iconDir, `extract-icon-${appId}.ps1`);
    fs.writeFileSync(scriptPath, script);

    const { stdout } = await execAsync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`);
    
    // Nettoyer le fichier script
    fs.unlinkSync(scriptPath);

    if (stdout.includes('SUCCESS:') && fs.existsSync(iconPath)) {
      // Convertir l'icône en Data URL base64
      const iconData = fs.readFileSync(iconPath);
      const base64Data = iconData.toString('base64');
      return `data:image/png;base64,${base64Data}`;
    }

    return undefined;
  } catch (error) {
    console.error('Error extracting application icon:', error);
    return undefined;
  }
}

/**
 * Récupère les applications en cours d'exécution avec leurs icônes
 * @returns Une promesse qui résout avec un tableau d'applications avec icônes
 */
export async function getRunningApplicationsWithIcons(): Promise<ApplicationWithIcon[]> {
  const apps = await getRunningApplications();
  const appsWithIcons: ApplicationWithIcon[] = [];

  for (const app of apps) {
    try {
      const iconUrl = await getApplicationIcon(app.id);
      appsWithIcons.push({
        ...app,
        iconUrl
      });
    } catch (error) {
      appsWithIcons.push(app);
    }
  }

  return appsWithIcons;
} 