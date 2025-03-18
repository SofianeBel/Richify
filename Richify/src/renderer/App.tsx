import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Tooltip,
  Button,
  CircularProgress,
  Fab
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Help as HelpIcon,
  Apps as AppsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { ThemeProvider, useThemeMode } from './theme/ThemeProvider';
import ErrorDisplay from './components/ErrorDisplay';
import Tutorial from './components/Tutorial';
import Settings from './components/Settings';
import PresenceCustomization from './components/PresenceCustomization';
import PresencePreview from './components/PresencePreview';
import ImageLibrary from './components/ImageLibrary';
import ProfileManager from './components/ProfileManager';

// Interface pour les données reçues de l'IPC
interface IpcApplication {
  id: string;
  name: string;
}

// Interface pour les applications
interface Application {
  name: string;
  processId: number;
  windowTitle: string;
  iconUrl?: string;
}

function AppContent() {
  const { mode, toggleTheme } = useThemeMode();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState<'large' | 'small' | null>(null);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [presenceConfig, setPresenceConfig] = useState({
    details: '',
    state: '',
    largeImageKey: '',
    largeImageText: '',
    smallImageKey: '',
    smallImageText: '',
    button1Label: '',
    button1Url: '',
    button2Label: '',
    button2Url: '',
    startTimestamp: true
  });

  const initializeDiscord = async () => {
    try {
      const clientId = localStorage.getItem('discordClientId');
      if (!clientId) {
        setError('Client ID Discord non configuré. Veuillez le configurer dans les paramètres.');
        setShowSettings(true);
        return;
      }

      const response = await window.electron.ipcRenderer.invoke('INITIALIZE_DISCORD', clientId);
      if (!response.success) {
        throw new Error(response.error || 'Échec de la connexion à Discord');
      }
      setDiscordConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion à Discord');
    }
  };

  const handleAppSelect = async (app: Application) => {
    try {
      if (!discordConnected) {
        await initializeDiscord();
      }

      setSelectedApp(app === selectedApp ? null : app);
      
      if (app !== selectedApp) {
        // Envoyer les informations de l'application à Discord
        window.electron.ipcRenderer.send('SELECT_APPLICATION', app);
      } else {
        // Déconnecter Discord si aucune application n'est sélectionnée
        window.electron.ipcRenderer.send('DISCONNECT_RPC');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de Discord');
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      // Utiliser la nouvelle méthode pour récupérer les applications avec icônes
      const response = await window.electron.ipcRenderer.invoke('GET_RUNNING_APPS_WITH_ICONS');
      if (response.success && Array.isArray(response.data)) {
        // Convertir les données dans le format attendu
        const apps: Application[] = response.data.map((app: any) => ({
          name: app.name,
          processId: parseInt(app.id),
          windowTitle: app.name,
          iconUrl: app.iconUrl
        }));
        setApplications(apps);
      } else {
        setError('Erreur lors de la récupération des applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePresence = (presenceData: any) => {
    if (selectedApp) {
      // Si l'application a une icône, l'utiliser pour largeImageKey s'il n'y en a pas déjà une définie
      let updatedPresenceData = { ...presenceData };
      
      if (selectedApp.iconUrl && !presenceData.largeImageKey) {
        updatedPresenceData = {
          ...updatedPresenceData,
          largeImageKey: selectedApp.iconUrl
        };
      }
      
      window.electron.ipcRenderer.send('UPDATE_PRESENCE', {
        ...updatedPresenceData,
        applicationId: selectedApp.processId,
        applicationName: selectedApp.name
      });
    }
  };

  const handleImageSelect = (imageKey: string) => {
    if (showImageLibrary === 'large') {
      setPresenceConfig(prev => ({ ...prev, largeImageKey: imageKey }));
    } else if (showImageLibrary === 'small') {
      setPresenceConfig(prev => ({ ...prev, smallImageKey: imageKey }));
    }
    setShowImageLibrary(null);
  };

  const handleProfileSelect = (profile: any) => {
    setPresenceConfig(profile.config);
    setShowProfileManager(false);
  };

  useEffect(() => {
    fetchApplications();
    // Vérifier si c'est la première utilisation
    const isFirstUse = !localStorage.getItem('hasSeenTutorial');
    if (isFirstUse) {
      setShowTutorial(true);
      localStorage.setItem('hasSeenTutorial', 'true');
    }

    // Écouter les événements Discord
    const handleDiscordConnected = () => setDiscordConnected(true);
    const handleDiscordDisconnected = () => setDiscordConnected(false);
    const handleDiscordError = (error: any) => {
      setError(`Erreur Discord: ${error.message || 'Erreur inconnue'}`);
      setDiscordConnected(false);
    };

    window.electron.ipcRenderer.on('DISCORD_CONNECTED', handleDiscordConnected);
    window.electron.ipcRenderer.on('DISCORD_DISCONNECTED', handleDiscordDisconnected);
    window.electron.ipcRenderer.on('DISCORD_ERROR', handleDiscordError);

    return () => {
      window.electron.ipcRenderer.removeListener('DISCORD_CONNECTED', handleDiscordConnected);
      window.electron.ipcRenderer.removeListener('DISCORD_DISCONNECTED', handleDiscordDisconnected);
      window.electron.ipcRenderer.removeListener('DISCORD_ERROR', handleDiscordError);
    };
  }, []);

  return (
    <>
      <CssBaseline />
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <AppsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Richify
          </Typography>
          <Tooltip title="Aide">
            <IconButton color="inherit" onClick={() => setShowTutorial(true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Paramètres">
            <IconButton color="inherit" onClick={() => setShowSettings(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 10,
          pb: 4,
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="div">
                      Applications en cours d'exécution
                    </Typography>
                    <Button
                      startIcon={<RefreshIcon />}
                      onClick={fetchApplications}
                      disabled={loading}
                    >
                      Actualiser
                    </Button>
                  </Box>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List>
                      {applications.map((app) => (
                        <ListItemButton
                          key={app.processId}
                          selected={selectedApp?.processId === app.processId}
                          onClick={() => handleAppSelect(app)}
                        >
                          <ListItemIcon>
                            <AppsIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={app.windowTitle || app.name}
                            secondary={`PID: ${app.processId}`}
                          />
                          <ListItemSecondaryAction>
                            <Switch
                              edge="end"
                              checked={selectedApp?.processId === app.processId}
                              onChange={() => handleAppSelect(app)}
                            />
                          </ListItemSecondaryAction>
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>

              {selectedApp && (
                <PresenceCustomization
                  selectedApp={selectedApp}
                  config={presenceConfig}
                  onConfigChange={setPresenceConfig}
                  onOpenImageLibrary={setShowImageLibrary}
                />
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Box sx={{ position: 'sticky', top: 90 }}>
                <PresencePreview {...presenceConfig} />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
                  <Tooltip title="Sauvegarder comme profil">
                    <Fab
                      color="primary"
                      size="small"
                      onClick={() => setShowProfileManager(true)}
                      disabled={!selectedApp}
                    >
                      <SaveIcon />
                    </Fab>
                  </Tooltip>
                  
                  <Tooltip title="Lancer Rich Presence">
                    <Fab
                      color="secondary"
                      size="medium"
                      onClick={() => handleUpdatePresence(presenceConfig)}
                      disabled={!selectedApp || !discordConnected}
                    >
                      <PlayArrowIcon />
                    </Fab>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <ErrorDisplay
        open={!!error}
        onClose={() => setError(null)}
        error={error || ''}
        onRetry={fetchApplications}
      />

      <Tutorial
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <Settings
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <ImageLibrary
        open={!!showImageLibrary}
        onClose={() => setShowImageLibrary(null)}
        onSelect={handleImageSelect}
        type={showImageLibrary || 'large'}
      />

      <ProfileManager
        open={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        onSelectProfile={handleProfileSelect}
        currentConfig={presenceConfig}
        currentApplication={selectedApp ? selectedApp : undefined}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}