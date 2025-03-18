import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Paper,
  Divider,
  Chip,
  Link
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

// Déclarer l'interface window pour TypeScript
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, ...args: any[]) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, listener: (...args: any[]) => void) => void;
        removeListener: (channel: string, listener: (...args: any[]) => void) => void;
      };
    };
  }
}

interface ErrorDisplayProps {
  open: boolean;
  error: string | null;
  onClose: () => void;
  onSettings: () => void;
}

export default function ErrorDisplay({
  open,
  error,
  onClose,
  onSettings
}: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const [errorType, setErrorType] = useState<'discord' | 'app' | 'network' | 'other'>('other');
  const [solution, setSolution] = useState('');
  const [severity, setSeverity] = useState<'error' | 'warning' | 'info'>('error');

  // Analyser l'erreur pour déterminer le type et proposer des solutions
  useEffect(() => {
    if (!error) return;

    // Déterminer le type d'erreur
    if (error.toLowerCase().includes('discord')) {
      setErrorType('discord');
      
      if (error.toLowerCase().includes('client id') || error.toLowerCase().includes('clientid')) {
        setSolution('Vous devez configurer votre Client ID Discord dans les paramètres.');
        setSeverity('warning');
      } else if (error.toLowerCase().includes('connect') || error.toLowerCase().includes('connexion')) {
        setSolution('Impossible de se connecter à Discord. Vérifiez que Discord est en cours d\'exécution sur votre ordinateur.');
        setSeverity('error');
      } else {
        setSolution('Une erreur liée à Discord s\'est produite. Essayez de redémarrer Discord et l\'application.');
        setSeverity('error');
      }
    } else if (error.toLowerCase().includes('network') || error.toLowerCase().includes('réseau') || error.toLowerCase().includes('connexion')) {
      setErrorType('network');
      setSolution('Problème de connexion réseau. Vérifiez votre connexion Internet.');
      setSeverity('warning');
    } else if (error.toLowerCase().includes('app') || error.toLowerCase().includes('application')) {
      setErrorType('app');
      setSolution('Erreur de l\'application. Essayez de redémarrer Richify.');
      setSeverity('error');
    } else {
      setErrorType('other');
      setSolution('Une erreur inattendue s\'est produite. Essayez de redémarrer l\'application.');
      setSeverity('error');
    }
  }, [error]);

  const getErrorTitle = () => {
    switch (errorType) {
      case 'discord':
        return 'Erreur de connexion Discord';
      case 'network':
        return 'Erreur de réseau';
      case 'app':
        return 'Erreur de l\'application';
      default:
        return 'Erreur inattendue';
    }
  };

  const getErrorIcon = () => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" sx={{ fontSize: 40 }} />;
      case 'warning':
        return <WarningIcon color="warning" sx={{ fontSize: 40 }} />;
      case 'info':
        return <InfoIcon color="info" sx={{ fontSize: 40 }} />;
      default:
        return <ErrorIcon color="error" sx={{ fontSize: 40 }} />;
    }
  };

  const handleOpenDiscordDeveloperPortal = () => {
    if (window.electron) {
      window.electron.ipcRenderer.send('OPEN_EXTERNAL_LINK', 'https://discord.com/developers/applications');
    } else {
      // Fallback pour les tests ou si l'API electron n'est pas disponible
      window.open('https://discord.com/developers/applications', '_blank');
    }
  };

  const getSolutionActions = () => {
    const actions = [];

    // Ajouter des actions spécifiques selon le type d'erreur
    if (errorType === 'discord' && error?.toLowerCase().includes('client id')) {
      actions.push(
        <Button 
          key="settings" 
          onClick={() => {
            onClose();
            onSettings();
          }} 
          startIcon={<SettingsIcon />}
        >
          Configurer le Client ID
        </Button>
      );
    }

    if (errorType === 'discord') {
      actions.push(
        <Button 
          key="discord" 
          onClick={handleOpenDiscordDeveloperPortal} 
          startIcon={<OpenInNewIcon />}
        >
          Portail développeur Discord
        </Button>
      );
    }

    // Toujours ajouter l'action pour rafraîchir
    actions.push(
      <Button 
        key="refresh" 
        onClick={() => window.location.reload()} 
        startIcon={<RefreshIcon />}
      >
        Rafraîchir l'application
      </Button>
    );

    return actions;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 5,
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {getErrorIcon()}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {getErrorTitle()}
          </Typography>
          <Chip 
            label={severity.toUpperCase()} 
            color={severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'info'} 
            size="small" 
          />
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity={severity} sx={{ mb: 2 }}>
          <AlertTitle>Description de l'erreur</AlertTitle>
          {solution}
        </Alert>

        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Solutions recommandées :
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            {errorType === 'discord' && (
              <>
                <li>Vérifiez que Discord est installé et en cours d'exécution.</li>
                <li>Assurez-vous que votre Client ID Discord est correctement configuré.</li>
                <li>Redémarrez Discord, puis redémarrez Richify.</li>
              </>
            )}
            {errorType === 'network' && (
              <>
                <li>Vérifiez votre connexion Internet.</li>
                <li>Vérifiez que votre pare-feu n'empêche pas la connexion.</li>
                <li>Essayez de redémarrer votre routeur si le problème persiste.</li>
              </>
            )}
            {errorType === 'app' && (
              <>
                <li>Fermez et redémarrez l'application.</li>
                <li>Vérifiez que votre système respecte les exigences minimales.</li>
                <li>Essayez de mettre à jour vers la dernière version de l'application.</li>
              </>
            )}
            <li>Si le problème persiste, consultez la documentation ou contactez le support.</li>
          </Box>
        </Paper>

        <Box>
          <Button
            variant="text"
            onClick={() => setExpanded(!expanded)}
            endIcon={
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            }
          >
            Détails techniques
          </Button>
          
          <Collapse in={expanded}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mt: 1,
                overflowX: 'auto',
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: (theme) => theme.palette.mode === 'dark' ? '#e6e6e6' : '#333333',
              }}
            >
              {error || 'Aucun détail disponible.'}
            </Paper>
          </Collapse>
        </Box>
      </DialogContent>

      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2, flexWrap: 'wrap', gap: 1 }}>
        {getSolutionActions()}
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
} 