import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Typography,
  Divider,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { useThemeMode } from '../theme/ThemeProvider';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  const { mode, toggleTheme } = useThemeMode();
  const [clientId, setClientId] = React.useState(localStorage.getItem('discordClientId') || '');
  const [autoStart, setAutoStart] = React.useState(localStorage.getItem('autoStart') === 'true');
  const [refreshInterval, setRefreshInterval] = React.useState(
    localStorage.getItem('refreshInterval') || '30'
  );
  const [showNotifications, setShowNotifications] = React.useState(
    localStorage.getItem('showNotifications') !== 'false'
  );

  const handleSave = () => {
    // Sauvegarder les paramètres
    localStorage.setItem('discordClientId', clientId);
    localStorage.setItem('autoStart', String(autoStart));
    localStorage.setItem('refreshInterval', refreshInterval);
    localStorage.setItem('showNotifications', String(showNotifications));

    // Envoyer les paramètres à l'application principale
    window.electron.ipcRenderer.send('UPDATE_SETTINGS', {
      clientId,
      autoStart,
      refreshInterval: parseInt(refreshInterval),
      showNotifications
    });

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h5">Paramètres</Typography>
      </DialogTitle>
      <DialogContent>
        <List>
          <ListItem>
            <ListItemText
              primary="Mode sombre"
              secondary="Changer l'apparence de l'application"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={mode === 'dark'}
                onChange={toggleTheme}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Démarrage automatique"
              secondary="Lancer l'application au démarrage de Windows"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Notifications"
              secondary="Afficher les notifications système"
            />
            <ListItemSecondaryAction>
              <Switch
                edge="end"
                checked={showNotifications}
                onChange={(e) => setShowNotifications(e.target.checked)}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Configuration Discord
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Vous pouvez trouver votre Client ID dans le portail développeur Discord.
          </Alert>
          <TextField
            fullWidth
            label="Client ID Discord"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            margin="normal"
            helperText="Nécessaire pour la fonctionnalité Rich Presence"
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>Intervalle de rafraîchissement</InputLabel>
            <Select
              value={refreshInterval}
              label="Intervalle de rafraîchissement"
              onChange={(e) => setRefreshInterval(e.target.value)}
            >
              <MenuItem value="15">15 secondes</MenuItem>
              <MenuItem value="30">30 secondes</MenuItem>
              <MenuItem value="60">1 minute</MenuItem>
              <MenuItem value="300">5 minutes</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Annuler
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
} 