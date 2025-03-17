import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  TextField,
  Box,
  Button,
  Typography,
  IconButton
} from '@mui/material';
import { Close as CloseIcon, Upload as UploadIcon } from '@mui/icons-material';

interface Image {
  key: string;
  url: string;
  name: string;
  category: string;
}

interface ImageLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageKey: string) => void;
  type: 'large' | 'small';
}

// Simule une base de données d'images
const defaultImages: Image[] = [
  { key: 'discord', url: './assets/images/discord.png', name: 'Discord', category: 'Apps' },
  { key: 'game', url: './assets/images/game.png', name: 'Game', category: 'Games' },
  { key: 'music', url: './assets/images/music.png', name: 'Music', category: 'Media' },
  // Ajoutez plus d'images par défaut ici
];

export default function ImageLibrary({ open, onClose, onSelect, type }: ImageLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState<Image[]>(defaultImages);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(images.map(img => img.category))];

  const filteredImages = images.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || img.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Ici, vous implémenteriez la logique pour télécharger l'image
        // et l'ajouter à votre bibliothèque d'images
        const newImage: Image = {
          key: file.name.toLowerCase().replace(/\s+/g, '-'),
          url: URL.createObjectURL(file),
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: 'Custom'
        };
        setImages(prev => [...prev, newImage]);
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Bibliothèque d'images - {type === 'large' ? 'Grande image' : 'Petite image'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box mb={2}>
          <TextField
            fullWidth
            label="Rechercher une image"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
          />
        </Box>

        <Box display="flex" gap={1} mb={2}>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory(category)}
              size="small"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              fullWidth
            >
              Ajouter une image
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Grid>

          {filteredImages.map((image) => (
            <Grid item xs={6} sm={4} md={3} key={image.key}>
              <Card>
                <CardActionArea onClick={() => onSelect(image.key)}>
                  <CardMedia
                    component="img"
                    height="120"
                    image={image.url}
                    alt={image.name}
                  />
                  <Typography
                    variant="caption"
                    align="center"
                    sx={{ p: 1, display: 'block' }}
                  >
                    {image.name}
                  </Typography>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
} 