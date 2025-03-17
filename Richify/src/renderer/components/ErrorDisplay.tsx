import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import {
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';

interface ErrorDisplayProps {
  open: boolean;
  onClose: () => void;
  error: string;
  onRetry?: () => void;
}

interface ErrorSolution {
  title: string;
  description: string;
  icon: JSX.Element;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const getErrorSolutions = (error: string, onRetry?: () => void): ErrorSolution[] => {
  // Solutions communes
  const commonSolutions: ErrorSolution[] = [
    {
      title: 'Vérifier Discord',
      description: 'Assurez-vous que Discord est en cours d\'exécution et que vous êtes connecté.',
      icon: <CheckIcon color="info" />,
      action: {
        label: 'Ouvrir Discord',
        onClick: () => {
          // Ouvrir Discord via le protocole
          window.open('discord://');
        }
      }
    },
    {
      title: 'Rafraîchir l\'application',
      description: 'Actualisez la liste des applications et la connexion Discord.',
      icon: <RefreshIcon color="info" />,
      action: onRetry ? {
        label: 'Rafraîchir',
        onClick: onRetry
      } : undefined
    }
  ];

  // Solutions spécifiques selon l'erreur
  if (error.toLowerCase().includes('discord')) {
    return [
      {
        title: 'Discord non détecté',
        description: 'Discord doit être en cours d\'exécution pour utiliser Rich Presence.',
        icon: <ErrorIcon color="error" />,
      },
      ...commonSolutions
    ];
  }

  if (error.toLowerCase().includes('connection')) {
    return [
      {
        title: 'Problème de connexion',
        description: 'Vérifiez votre connexion Internet et réessayez.',
        icon: <ErrorIcon color="error" />,
      },
      ...commonSolutions
    ];
  }

  // Solutions par défaut
  return [
    {
      title: 'Erreur inattendue',
      description: 'Une erreur inattendue s\'est produite. Voici quelques solutions possibles.',
      icon: <ErrorIcon color="error" />,
    },
    ...commonSolutions,
    {
      title: 'Besoin d\'aide ?',
      description: 'Si le problème persiste, consultez notre documentation ou contactez le support.',
      icon: <HelpIcon color="info" />,
      action: {
        label: 'Documentation',
        onClick: () => {
          window.open('https://github.com/votre-repo/richify/wiki', '_blank');
        }
      }
    }
  ];
};

export default function ErrorDisplay({ open, onClose, error, onRetry }: ErrorDisplayProps) {
  const theme = useTheme();
  const solutions = getErrorSolutions(error, onRetry);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ErrorIcon color="error" />
          Une erreur est survenue
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Détails de l'erreur</AlertTitle>
          {error}
        </Alert>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Solutions possibles :
          </Typography>
          <List>
            {solutions.map((solution, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {solution.icon}
                </ListItemIcon>
                <ListItemText
                  primary={solution.title}
                  secondary={solution.description}
                />
                {solution.action && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={solution.action.onClick}
                    sx={{ ml: 2 }}
                  >
                    {solution.action.label}
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fermer
        </Button>
        {onRetry && (
          <Button
            variant="contained"
            color="primary"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
          >
            Réessayer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 