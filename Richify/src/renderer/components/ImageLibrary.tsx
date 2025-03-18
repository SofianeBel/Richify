import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardMedia,
  CardActionArea,
  CardActions,
  TextField,
  Box,
  Button,
  Typography,
  IconButton,
  Alert,
  Divider,
  InputAdornment,
  Tooltip,
  Chip,
  Paper,
  Snackbar
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Upload as UploadIcon, 
  Link as LinkIcon, 
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudDownload as CloudDownloadIcon 
} from '@mui/icons-material';

interface Image {
  key: string;
  url: string;
  name: string;
  category: string;
  isDefault?: boolean;
}

interface ImageLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageKey: string) => void;
  type: 'large' | 'small';
}

// Simule une base de données d'images
const defaultImages: Image[] = [
  { key: 'discord', url: './assets/images/discord.png', name: 'Discord', category: 'Apps', isDefault: true },
  { key: 'game', url: './assets/images/game.png', name: 'Game', category: 'Games', isDefault: true },
  { key: 'music', url: './assets/images/music.png', name: 'Music', category: 'Media', isDefault: true },
  // Ajoutez plus d'images par défaut ici
];

export default function ImageLibrary({ open, onClose, onSelect, type }: ImageLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState<Image[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlName, setImageUrlName] = useState('');
  const [urlError, setUrlError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Charger les images depuis le localStorage au chargement du composant
  useEffect(() => {
    const loadImages = () => {
      try {
        const savedImages = localStorage.getItem('richify_images');
        let customImages: Image[] = [];
        
        if (savedImages) {
          customImages = JSON.parse(savedImages);
        }
        
        setImages([...defaultImages, ...customImages]);
      } catch (error) {
        console.error('Error loading images from localStorage:', error);
        setImages(defaultImages);
      }
    };
    
    loadImages();
  }, []);

  // Sauvegarder les images personnalisées dans le localStorage
  const saveImages = useCallback((updatedImages: Image[]) => {
    try {
      // Filtrer pour ne sauvegarder que les images personnalisées
      const customImages = updatedImages.filter(img => !img.isDefault);
      localStorage.setItem('richify_images', JSON.stringify(customImages));
    } catch (error) {
      console.error('Error saving images to localStorage:', error);
    }
  }, []);

  // Filtrer les images en fonction de la recherche et de la catégorie
  const categories = ['all', ...Array.from(new Set(images.map(img => img.category)))];

  const filteredImages = images.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || img.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Gestionnaire de téléchargement d'image
  const processImageFile = async (file: File) => {
    try {
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        setSnackbarMessage('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WEBP.');
        setSnackbarOpen(true);
        return;
      }
      
      // Générer un nom de fichier unique
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      const uniqueKey = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Convertir l'image en data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage: Image = {
          key: uniqueKey,
          url: reader.result as string,
          name: fileName,
          category: 'Custom'
        };
        
        const updatedImages = [...images, newImage];
        setImages(updatedImages);
        saveImages(updatedImages);
        
        setSnackbarMessage('Image ajoutée avec succès !');
        setSnackbarOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image file:', error);
      setSnackbarMessage('Erreur lors du traitement de l\'image.');
      setSnackbarOpen(true);
    }
  };

  // Gestionnaire pour le téléchargement d'image via l'input file
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  // Gestionnaires pour le drag & drop
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processImageFile(file);
    }
  };

  // Validation et ajout d'image par URL
  const isValidImageUrl = (url: string): boolean => {
    // Validation d'URL (plus flexible)
    return url.startsWith('http') || url.startsWith('data:image/');
  };

  const handleUrlImageAdd = () => {
    if (!imageUrl) {
      setUrlError('Veuillez entrer une URL');
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      setUrlError("L'URL ne semble pas être une image valide");
      return;
    }

    // Créer une nouvelle image à partir de l'URL
    const newImage: Image = {
      key: `url-${Date.now()}`,
      url: imageUrl,
      name: imageUrlName || `URL Image ${images.filter(img => img.category === 'URL').length + 1}`,
      category: 'URL'
    };

    const updatedImages = [...images, newImage];
    setImages(updatedImages);
    saveImages(updatedImages);
    
    // Réinitialiser les champs
    setImageUrl('');
    setImageUrlName('');
    setUrlError('');
    
    setSnackbarMessage('Image URL ajoutée avec succès !');
    setSnackbarOpen(true);
  };

  // Supprimer une image
  const handleDeleteImage = (imageKey: string) => {
    const updatedImages = images.filter(img => img.key !== imageKey);
    setImages(updatedImages);
    saveImages(updatedImages);
    
    setSnackbarMessage('Image supprimée avec succès !');
    setSnackbarOpen(true);
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

        <Box display="flex" gap={1} mb={2} sx={{ flexWrap: 'wrap' }}>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'contained' : 'outlined'}
              onClick={() => setSelectedCategory(category)}
              size="small"
              sx={{ mb: 1 }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </Box>

        {/* Zone de drag & drop */}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            borderStyle: dragActive ? 'dashed' : 'solid',
            borderWidth: dragActive ? 2 : 1,
            borderColor: dragActive ? 'primary.main' : 'divider',
            bgcolor: dragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.2s ease-in-out',
            textAlign: 'center',
            cursor: 'pointer'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          component="div"
        >
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            justifyContent="center"
            height="100px"
          >
            <CloudDownloadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography>
              Glissez-déposez une image ici
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ou
            </Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={<UploadIcon />}
              size="small"
              sx={{ mt: 1 }}
            >
              Parcourir
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Box>
        </Paper>
          
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 2 }}>
            <Typography variant="caption">OU UTILISER UNE URL</Typography>
          </Divider>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="URL de l'image"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setUrlError('');
                }}
                placeholder="https://example.com/image.png"
                variant="outlined"
                size="small"
                error={!!urlError}
                helperText={urlError || "Entrez l'URL directe d'une image"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nom (optionnel)"
                value={imageUrlName}
                onChange={(e) => setImageUrlName(e.target.value)}
                variant="outlined"
                size="small"
                placeholder="Mon image"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleUrlImageAdd}
              >
                Ajouter l'image URL
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          {filteredImages.length > 0 ? (
            filteredImages.map((image) => (
              <Grid item xs={6} sm={4} md={3} key={image.key}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      boxShadow: 3
                    }
                  }}
                >
                  <CardActionArea 
                    onClick={() => onSelect(image.url)}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <CardMedia
                      component="img"
                      height="120"
                      image={image.url}
                      alt={image.name}
                      sx={{ objectFit: 'contain', padding: 1 }}
                    />
                    <Box sx={{ p: 1, flexGrow: 1, width: '100%' }}>
                      <Typography
                        variant="caption"
                        align="center"
                        sx={{ display: 'block', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {image.name}
                      </Typography>
                      <Chip 
                        label={image.category} 
                        size="small" 
                        sx={{ mt: 0.5, fontSize: '0.6rem' }} 
                        color={
                          image.category === 'Custom' ? 'primary' :
                          image.category === 'URL' ? 'secondary' : 'default'
                        }
                      />
                    </Box>
                  </CardActionArea>
                  {!image.isDefault && (
                    <CardActions sx={{ p: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Supprimer l'image">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteImage(image.key)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Alert severity="info">
                Aucune image ne correspond à votre recherche. Essayez de modifier vos critères de recherche ou ajoutez une nouvelle image.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Dialog>
  );
} 