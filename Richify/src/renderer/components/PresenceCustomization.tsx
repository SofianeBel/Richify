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
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

interface PresenceConfig {
  details: string;
  state: string;
  largeImageKey: string;
  largeImageText: string;
  smallImageKey: string;
  smallImageText: string;
  button1Label: string;
  button1Url: string;
  button2Label: string;
  button2Url: string;
  startTimestamp: boolean;
}

interface PresenceCustomizationProps {
  selectedApp: {
    name: string;
    processId: number;
    windowTitle: string;
  };
  config: PresenceConfig;
  onConfigChange: (config: PresenceConfig) => void;
  onOpenImageLibrary: (type: 'large' | 'small') => void;
}

export default function PresenceCustomization({
  selectedApp,
  config,
  onConfigChange,
  onOpenImageLibrary
}: PresenceCustomizationProps) {
  const handleChange = (field: keyof PresenceConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'startTimestamp' ? event.target.checked : event.target.value;
    onConfigChange({ ...config, [field]: value });
  };

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
              value={config.details}
              onChange={handleChange('details')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="État"
              value={config.state}
              onChange={handleChange('state')}
              margin="normal"
            />
          </Grid>

          {/* Images */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Grande Image
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                label="Clé de l'image"
                value={config.largeImageKey}
                onChange={handleChange('largeImageKey')}
                margin="normal"
              />
              <IconButton
                onClick={() => onOpenImageLibrary('large')}
                sx={{ mt: 2 }}
              >
                <ImageIcon />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              label="Texte au survol"
              value={config.largeImageText}
              onChange={handleChange('largeImageText')}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Petite Image
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                label="Clé de l'image"
                value={config.smallImageKey}
                onChange={handleChange('smallImageKey')}
                margin="normal"
              />
              <IconButton
                onClick={() => onOpenImageLibrary('small')}
                sx={{ mt: 2 }}
              >
                <ImageIcon />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              label="Texte au survol"
              value={config.smallImageText}
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
              value={config.button1Label}
              onChange={handleChange('button1Label')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="URL"
              value={config.button1Url}
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
              value={config.button2Label}
              onChange={handleChange('button2Label')}
              margin="normal"
            />
            <TextField
              fullWidth
              label="URL"
              value={config.button2Url}
              onChange={handleChange('button2Url')}
              margin="normal"
            />
          </Grid>

          {/* Options supplémentaires */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.startTimestamp}
                  onChange={handleChange('startTimestamp')}
                />
              }
              label="Afficher le temps écoulé"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
} 