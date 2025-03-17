import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Paper,
  useTheme
} from '@mui/material';
import {
  Info as InfoIcon,
  Settings as SettingsIcon,
  Games as GamesIcon,
  Check as CheckIcon
} from '@mui/icons-material';

interface TutorialProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    label: 'Bienvenue sur Richify',
    description: 'Richify vous permet de personnaliser votre Rich Presence Discord pour n\'importe quelle application.',
    icon: <InfoIcon />,
    content: (
      <>
        <Typography paragraph>
          Avec Richify, vous pouvez :
        </Typography>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Sélectionner n'importe quelle application en cours d'exécution</li>
          <li>Personnaliser le statut affiché sur Discord</li>
          <li>Ajouter des images et des descriptions personnalisées</li>
        </ul>
      </>
    )
  },
  {
    label: 'Sélection de l\'application',
    description: 'Choisissez l\'application que vous souhaitez afficher dans votre statut Discord.',
    icon: <GamesIcon />,
    content: (
      <>
        <Typography paragraph>
          Pour commencer :
        </Typography>
        <ol style={{ paddingLeft: '20px' }}>
          <li>Lancez l'application que vous souhaitez afficher</li>
          <li>Sélectionnez-la dans le menu déroulant</li>
          <li>Activez le Rich Presence avec le bouton</li>
        </ol>
      </>
    )
  },
  {
    label: 'Personnalisation',
    description: 'Personnalisez les informations affichées sur votre profil Discord.',
    icon: <SettingsIcon />,
    content: (
      <>
        <Typography paragraph>
          Vous pouvez personnaliser :
        </Typography>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Le détail principal (ex: "En train de jouer")</li>
          <li>L'état secondaire (ex: "Dans le menu principal")</li>
          <li>Les images grandes et petites</li>
          <li>Les textes au survol des images</li>
        </ul>
        <Typography paragraph>
          N'oubliez pas de cliquer sur "Mettre à jour la présence" pour appliquer vos changements !
        </Typography>
      </>
    )
  },
  {
    label: 'C\'est parti !',
    description: 'Vous êtes prêt à utiliser Richify.',
    icon: <CheckIcon />,
    content: (
      <Typography>
        Vous pouvez maintenant personnaliser votre Rich Presence Discord comme vous le souhaitez.
        Si vous avez besoin d'aide, vous pouvez toujours retrouver ce tutoriel dans le menu d'aide.
      </Typography>
    )
  }
];

export default function Tutorial({ open, onClose }: TutorialProps) {
  const [activeStep, setActiveStep] = React.useState(0);
  const theme = useTheme();

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          {tutorialSteps[activeStep].icon}
          {tutorialSteps[activeStep].label}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {tutorialSteps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                optional={
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                }
              >
                {step.label}
              </StepLabel>
              <StepContent>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.default',
                    borderRadius: 1,
                    mb: 2
                  }}
                >
                  {step.content}
                </Paper>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Fermer
        </Button>
        <div style={{ flex: '1 0 0' }} />
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Précédent
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === tutorialSteps.length - 1 ? handleClose : handleNext}
        >
          {activeStep === tutorialSteps.length - 1 ? 'Terminer' : 'Suivant'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 