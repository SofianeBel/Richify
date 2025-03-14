import React, { useState, useEffect } from 'react';
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
  SelectChangeEvent
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const { ipcRenderer } = window.require('electron');

const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function LoadingScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress size={60} />
        <Typography variant="h6" className="text-blue-400">
          Chargement des applications...
        </Typography>
        <Typography variant="body2" className="text-gray-400">
          Cela peut prendre quelques secondes
        </Typography>
      </Box>
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
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
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [applications, setApplications] = useState<Array<{ id: string, name: string }>>([]);
  const [selectedApp, setSelectedApp] = useState('');
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

  const loadApplications = async () => {
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
    if (presence.enabled) {
      ipcRenderer.send('UPDATE_PRESENCE', presence);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (isLoading) {
    return <LoadingScreen onRetry={loadApplications} />;
  }

  if (hasError) {
    return <ErrorScreen onRetry={loadApplications} />;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Typography variant="h3" className="mb-8 text-center text-blue-400">
            Richify
          </Typography>
          
          <Card className="bg-gray-800">
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
                  >
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
    </ThemeProvider>
  );
}

export default App; 