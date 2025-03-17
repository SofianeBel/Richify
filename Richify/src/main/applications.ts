import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Application {
  id: string;
  name: string;
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