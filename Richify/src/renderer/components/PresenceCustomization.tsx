import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Grid,
  Typography,
  Button,
  Box,
  Switch,
  FormControlLabel
} from '@mui/material';

interface PresenceData {
  details?: string;
  state?: string;
  largeImageKey?: string;
  largeImageText?: string;
  smallImageKey?: string;
  smallImageText?: string;
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  startTimestamp?: boolean;
}

interface PresenceCustomizationProps {
  selectedApp: {
    name: string;
    processId: number;
    windowTitle: string;
  } | null;
  onUpdatePresence: (data: PresenceData) => void;
}

export default function PresenceCustomization({ selectedApp, onUpdatePresence }: PresenceCustomizationProps) {
  const [presenceData, setPresenceData] = useState<PresenceData>({
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

  // Réinitialiser les champs quand l'application sélectionnée change
  useEffect(() => {
    if (selectedApp) {
      setPresenceData({
        details: selectedApp.windowTitle,
        state: `Utilise ${selectedApp.name}`,
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
    } else {
      setPresenceData({
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
    }
  }, [selectedApp]);

  const handleChange = (field: keyof PresenceData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'startTimestamp' ? event.target.checked : event.target.value;
    setPresenceData((prev) => {
      const newData = { ...prev, [field]: value };
      onUpdatePresence(newData);
      return newData;
    });
  };

  const handleApply = () => {
    onUpdatePresence(presenceData);
  };

  if (!selectedApp) {
    return null;
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Personnalisation de la Rich Presence
        </Typography>
        
        <Grid container spacing={2}>
          {/* Textes principaux */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Titre principal"
              value={presenceData.details}
              onChange={handleChange('details')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="État"
              value={presenceData.state}
              onChange={handleChange('state')}
              margin="normal"
            />
          </Grid>

          {/* Images */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Grande Image
            </Typography>
            <TextField
              fullWidth
              label="Clé de l'image"
              value={presenceData.largeImageKey}
              onChange={handleChange('largeImageKey')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Texte au survol"
              value={presenceData.largeImageText}
              onChange={handleChange('largeImageText')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Petite Image
            </Typography>
            <TextField
              fullWidth
              label="Clé de l'image"
              value={presenceData.smallImageKey}
              onChange={handleChange('smallImageKey')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Texte au survol"
              value={presenceData.smallImageText}
              onChange={handleChange('smallImageText')}
              margin="normal"
            />
          </Grid>

          {/* Boutons */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Bouton 1
            </Typography>
            <TextField
              fullWidth
              label="Texte du bouton"
              value={presenceData.button1Label}
              onChange={handleChange('button1Label')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="URL"
              value={presenceData.button1Url}
              onChange={handleChange('button1Url')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Bouton 2
            </Typography>
            <TextField
              fullWidth
              label="Texte du bouton"
              value={presenceData.button2Label}
              onChange={handleChange('button2Url')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="URL"
              value={presenceData.button2Url}
              onChange={handleChange('button2Url')}
              margin="normal"
            />
          </Grid>

          {/* Options supplémentaires */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={presenceData.startTimestamp}
                  onChange={handleChange('startTimestamp')}
                />
              }
              label="Afficher le temps écoulé"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApply}
          >
            Appliquer
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 