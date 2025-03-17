import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  TextField, 
  Card, 
  CardContent, 
  Typography,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert as MuiAlert,
  CircularProgress,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  IconButton,
  useTheme,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import Particles from "@tsparticles/react";
import { Engine, Container } from "@tsparticles/engine";
import { loadFull } from "tsparticles";

// Vérification de sécurité pour l'accès à window.electron
if (!window.electron) {
  console.error('window.electron is not defined. Make sure the preload script is properly configured.');
}

const { ipcRenderer } = window.electron || { ipcRenderer: null };

const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function LoadingScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-900 text-white flex items-center justify-center"
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress size={60} />
        <Typography variant="h6" className="text-blue-400">
          Chargement des applications...
        </Typography>
        <Typography variant="body2" className="text-gray-400">
          Cela peut prendre quelques secondes
        </Typography>
      </Box>
    </motion.div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-900 text-white flex items-center justify-center"
    >
      <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
        <Typography variant="h6" className="text-red-400">
          Erreur lors du chargement des applications
        </Typography>
        <Typography variant="body2" className="text-gray-400">
          Impossible de récupérer la liste des applications
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={onRetry}
        >
          Réessayer
        </Button>
      </Box>
    </motion.div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [applications, setApplications] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [darkMode, setDarkMode] = useState(true);
  const [presence, setPresence] = useState({
    details: '',
    state: '',
    largeImageKey: '',
    largeImageText: '',
    smallImageKey: '',
    smallImageText: '',
    enabled: false
  });

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const theme = darkMode ? darkTheme : lightTheme;

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: Container | undefined) => {
    console.log(container);
  }, []);

  const particlesConfig = {
    fullScreen: {
      enable: false,
      zIndex: 0
    },
    background: {
      color: {
        value: darkMode ? "#121212" : "#f5f5f5",
      },
    },
    fpsLimit: 60,
    particles: {
      color: {
        value: darkMode ? "#ffffff" : "#000000",
      },
      links: {
        color: darkMode ? "#ffffff" : "#000000",
        distance: 150,
        enable: true,
        opacity: 0.2,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: true,
        speed: 2,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 100,
      },
      opacity: {
        value: 0.5,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 5 },
      },
    },
    detectRetina: true,
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse",
        },
        onClick: {
          enable: true,
          mode: "push",
        },
        resize: true,
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
        push: {
          quantity: 4,
        },
      },
    },
  };

  const loadApplications = async () => {
    if (!ipcRenderer) {
      console.error('ipcRenderer is not available');
      return;
    }

    try {
      const response = await ipcRenderer.invoke('GET_RUNNING_APPS');
      if (response.success && response.data) {
        setApplications(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!ipcRenderer) {
      console.error('ipcRenderer is not available');
      return;
    }

    const handlePresenceUpdate = (_: any, response: { success: boolean, error?: string }) => {
      if (response.success) {
        setNotification({
          open: true,
          message: 'Rich Presence mis à jour avec succès',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: `Erreur: ${response.error}`,
          severity: 'error'
        });
      }
    };

    ipcRenderer.on('PRESENCE_UPDATED', handlePresenceUpdate);
    ipcRenderer.on('RPC_DISCONNECTED', handlePresenceUpdate);

    loadApplications();

    return () => {
      ipcRenderer.removeListener('PRESENCE_UPDATED', handlePresenceUpdate);
      ipcRenderer.removeListener('RPC_DISCONNECTED', handlePresenceUpdate);
    };
  }, []);

  const handleAppSelect = (event: SelectChangeEvent<string>) => {
    if (!ipcRenderer) {
      console.error('ipcRenderer is not available');
      return;
    }

    const appId = event.target.value;
    setSelectedApp(appId);
    setPresence(prev => ({
      ...prev,
      enabled: true,
      largeImageKey: '',
      largeImageText: '',
      smallImageKey: '',
      smallImageText: ''
    }));
    ipcRenderer.send('SELECT_APPLICATION', appId);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!ipcRenderer) {
      console.error('ipcRenderer is not available');
      return;
    }

    const { name, value, checked } = e.target;
    setPresence(prev => ({
      ...prev,
      [name]: name === 'enabled' ? checked : value
    }));

    if (name === 'enabled' && !checked) {
      ipcRenderer.send('DISCONNECT_RPC');
    }
  };

  const handleSubmit = () => {
    if (!ipcRenderer) {
      console.error('ipcRenderer is not available');
      return;
    }

    if (presence.enabled) {
      ipcRenderer.send('UPDATE_PRESENCE', presence);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (isLoading) {
    return <LoadingScreen onRetry={loadApplications} />;
  }

  if (hasError) {
    return <ErrorScreen onRetry={loadApplications} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen relative">
        <div className="absolute inset-0">
          <Particles
            id="tsparticles"
            init={particlesInit}
            loaded={particlesLoaded}
            options={particlesConfig}
          />
        </div>
        
        <div className="relative z-10 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography variant="h3" className="text-center text-blue-400">
                  Richify
                </Typography>
              </motion.div>
              <IconButton onClick={toggleTheme} color="inherit">
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-opacity-90 backdrop-blur-sm">
                <CardContent>
                  <div className="space-y-6">
                    <FormControl fullWidth>
                      <InputLabel id="app-select-label">Application</InputLabel>
                      <Select
                        labelId="app-select-label"
                        value={selectedApp}
                        onChange={handleAppSelect}
                        label="Application"
                        disabled={isLoading}
                        displayEmpty
                      >
                        <MenuItem key="empty-select" value="" disabled>
                          <em>Sélectionnez une application</em>
                        </MenuItem>
                        {applications.map((app) => (
                          <MenuItem key={app.id} value={app.id}>
                            {app.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {isLoading && (
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <CircularProgress size={20} />
                          <Typography variant="body2" className="text-gray-400">
                            Chargement des applications...
                          </Typography>
                        </Box>
                      )}
                    </FormControl>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={presence.enabled}
                          onChange={handleChange}
                          name="enabled"
                          color="primary"
                          disabled={!selectedApp || isLoading}
                        />
                      }
                      label="Activer Rich Presence"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextField
                        label="Détails"
                        name="details"
                        value={presence.details}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={!selectedApp || isLoading}
                      />
                      <TextField
                        label="État"
                        name="state"
                        value={presence.state}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={!selectedApp || isLoading}
                      />
                      <TextField
                        label="Clé de la grande image"
                        name="largeImageKey"
                        value={presence.largeImageKey}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={!selectedApp || isLoading}
                      />
                      <TextField
                        label="Texte de la grande image"
                        name="largeImageText"
                        value={presence.largeImageText}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={!selectedApp || isLoading}
                      />
                      <TextField
                        label="Clé de la petite image"
                        name="smallImageKey"
                        value={presence.smallImageKey}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={!selectedApp || isLoading}
                      />
                      <TextField
                        label="Texte de la petite image"
                        name="smallImageText"
                        value={presence.smallImageText}
                        onChange={handleChange}
                        fullWidth
                        variant="outlined"
                        disabled={!selectedApp || isLoading}
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleSubmit}
                        disabled={!presence.enabled || !selectedApp || isLoading}
                      >
                        Mettre à jour la présence
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Snackbar 
            open={notification.open} 
            autoHideDuration={6000} 
            onClose={handleCloseNotification}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert 
              onClose={handleCloseNotification} 
              severity={notification.severity}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;