import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Box,
  Typography,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon
} from '@mui/icons-material';

interface Profile {
  id: string;
  name: string;
  applicationPattern: string;
  config: {
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
  };
}

interface ProfileManagerProps {
  open: boolean;
  onClose: () => void;
  onSelectProfile: (profile: Profile) => void;
  currentConfig?: Profile['config'];
  currentApplication?: { name: string; processId: number; windowTitle: string };
}

export default function ProfileManager({
  open,
  onClose,
  onSelectProfile,
  currentConfig,
  currentApplication
}: ProfileManagerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');

  // Charger les profils depuis le stockage local
  useEffect(() => {
    const savedProfiles = localStorage.getItem('richifyProfiles');
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
  }, []);

  // Sauvegarder les profils dans le stockage local
  const saveProfiles = (updatedProfiles: Profile[]) => {
    localStorage.setItem('richifyProfiles', JSON.stringify(updatedProfiles));
    setProfiles(updatedProfiles);
  };

  const handleSaveCurrentAsProfile = () => {
    if (!currentApplication || !currentConfig) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      name: newProfileName || currentApplication.name,
      applicationPattern: currentApplication.name,
      config: currentConfig
    };

    saveProfiles([...profiles, newProfile]);
    setNewProfileName('');
  };

  const handleDeleteProfile = (profileId: string) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    saveProfiles(updatedProfiles);
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
  };

  const handleSaveEdit = () => {
    if (!editingProfile) return;

    const updatedProfiles = profiles.map(p =>
      p.id === editingProfile.id ? editingProfile : p
    );
    saveProfiles(updatedProfiles);
    setEditingProfile(null);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gestionnaire de profils</DialogTitle>
      <DialogContent>
        {currentApplication && currentConfig && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Sauvegarder la configuration actuelle
            </Typography>
            <Box display="flex" gap={1}>
              <TextField
                size="small"
                fullWidth
                label="Nom du profil"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder={currentApplication.name}
              />
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveCurrentAsProfile}
              >
                Sauvegarder
              </Button>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Profils enregistrés
        </Typography>

        <List>
          {profiles.map((profile) => (
            <ListItem
              key={profile.id}
              onClick={() => onSelectProfile(profile)}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemText
                primary={profile.name}
                secondary={`Pattern: ${profile.applicationPattern}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProfile(profile);
                  }}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {editingProfile && (
          <Dialog open={true} onClose={() => setEditingProfile(null)}>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Nom du profil"
                value={editingProfile.name}
                onChange={(e) =>
                  setEditingProfile({ ...editingProfile, name: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Pattern d'application"
                value={editingProfile.applicationPattern}
                onChange={(e) =>
                  setEditingProfile({
                    ...editingProfile,
                    applicationPattern: e.target.value
                  })
                }
                margin="normal"
                helperText="Utilisé pour la détection automatique"
              />
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                startIcon={<SaveIcon />}
                sx={{ mt: 2 }}
              >
                Enregistrer les modifications
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
} 