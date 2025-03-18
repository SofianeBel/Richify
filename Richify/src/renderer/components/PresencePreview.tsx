import { Box, Card, CardContent, Typography, Avatar, Button, styled, Chip, Badge as MuiBadge, Divider, useTheme } from '@mui/material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FiberManualRecord as StatusIcon } from '@mui/icons-material';
import { useEffect, useState } from 'react';

const PreviewCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#2f3136' : '#ffffff',
  maxWidth: 300,
  margin: '0 auto',
  borderRadius: '8px',
  overflow: 'visible',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 8px rgba(0, 0, 0, 0.5)' 
    : '0 4px 8px rgba(0, 0, 0, 0.1)'
}));

const DiscordUsername = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  fontWeight: 'bold',
  fontSize: '1rem',
  lineHeight: '1.2'
}));

const DiscordTag = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#b9bbbe' : '#747f8d',
  fontWeight: 'normal',
  fontSize: '0.9rem'
}));

const StatusText = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#dcddde' : '#2e3338',
  fontSize: '0.8rem',
  marginTop: '4px'
}));

const PresenceCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#36393f' : '#f2f3f5',
  borderRadius: '4px',
  padding: theme.spacing(1),
  marginTop: theme.spacing(1),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#3a3e43' : '#e9eaed',
  }
}));

const GameTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#060607',
  fontWeight: 'bold',
  fontSize: '0.8rem'
}));

const PresenceText = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#dcddde' : '#2e3338',
  fontSize: '0.8rem'
}));

const ElapsedTime = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#b9bbbe' : '#747f8d',
  fontSize: '0.75rem'
}));

const DiscordButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#4f545c' : '#e3e5e8',
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#4f545c',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#686d73' : '#d4d7dc'
  },
  textTransform: 'none',
  margin: theme.spacing(0.5),
  fontSize: '0.75rem',
  borderRadius: '3px'
}));

const BadgeContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  marginTop: theme.spacing(1)
}));

const BadgeChip = styled(Chip)(({ theme, color }) => ({
  height: '22px',
  fontSize: '0.7rem',
  borderRadius: '10px',
  backgroundColor: color === 'primary' ? '#5865f2' : 
               color === 'secondary' ? '#eb459e' :
               color === 'success' ? '#3ba55d' :
               color === 'info' ? '#4e5d94' : 
               '#747f8d',
  color: '#ffffff',
  '& .MuiChip-label': {
    padding: '0 8px'
  }
}));

interface PresencePreviewProps {
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
  startTime?: number;
}

export default function PresencePreview({
  details,
  state,
  largeImageKey,
  largeImageText,
  smallImageKey,
  smallImageText,
  button1Label,
  button1Url,
  button2Label,
  button2Url,
  startTimestamp,
  startTime = Date.now()
}: PresencePreviewProps) {
  const theme = useTheme();
  const [elapsedTime, setElapsedTime] = useState('0:00');
  
  // Mettre à jour le temps écoulé toutes les secondes si startTimestamp est activé
  useEffect(() => {
    if (!startTimestamp) return;
    
    const updateElapsedTime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const minutes = Math.floor((elapsed % 3600) / 60);
      const seconds = elapsed % 60;
      
      if (hours > 0) {
        setElapsedTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    updateElapsedTime();
    const intervalId = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(intervalId);
  }, [startTimestamp, startTime]);

  return (
    <PreviewCard elevation={3}>
      <CardContent sx={{ p: 2 }}>
        {/* Profil utilisateur */}
        <Box display="flex" alignItems="flex-start" mb={1.5}>
          <Box position="relative" mr={1.5}>
            <Avatar
              alt="Discord Avatar"
              src="./assets/images/discord-avatar.png"
              sx={{ 
                width: 40, 
                height: 40,
                border: theme.palette.mode === 'dark' ? '1px solid #4f545c' : 'none'
              }}
            />
            <StatusIcon 
              sx={{ 
                position: 'absolute', 
                color: '#3ba55d', 
                bottom: -2, 
                right: -2, 
                fontSize: 14,
                backgroundColor: theme.palette.mode === 'dark' ? '#2f3136' : '#ffffff',
                borderRadius: '50%',
                padding: '2px',
                boxSizing: 'content-box'
              }} 
            />
          </Box>
          <Box>
            <Box display="flex" alignItems="center">
              <DiscordUsername variant="subtitle1">
                ソフィアン
              </DiscordUsername>
              <DiscordTag variant="body2" ml={0.5}>
                #0001
              </DiscordTag>
            </Box>
            <StatusText>
              enjoy.
            </StatusText>
          </Box>
        </Box>

        {/* Section Joue à */}
        <PresenceCard>
          <Box display="flex">
            <Box position="relative" mr={1.5}>
              {largeImageKey ? (
                <Avatar
                  alt={largeImageText || 'Application'}
                  src={largeImageKey}
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '4px',
                    border: theme.palette.mode === 'dark' ? '1px solid #4f545c' : 'none' 
                  }}
                  variant="square"
                />
              ) : (
                <Avatar
                  alt="Application"
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: '4px', 
                    bgcolor: '#5865f2',
                    fontSize: '1.2rem',
                    border: theme.palette.mode === 'dark' ? '1px solid #4f545c' : 'none'
                  }}
                  variant="square"
                >
                  R
                </Avatar>
              )}
              
              {smallImageKey && (
                <Avatar
                  alt={smallImageText || 'Small Image'}
                  src={smallImageKey}
                  sx={{
                    width: 20,
                    height: 20,
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    border: '2px solid',
                    borderColor: theme.palette.mode === 'dark' ? '#36393f' : '#f2f3f5'
                  }}
                />
              )}
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <GameTitle noWrap>
                Joue à Richify
              </GameTitle>
              {details && (
                <PresenceText noWrap>
                  {details}
                </PresenceText>
              )}
              {state && (
                <PresenceText noWrap>
                  {state}
                </PresenceText>
              )}
              {startTimestamp && (
                <ElapsedTime>
                  {elapsedTime} écoulé
                </ElapsedTime>
              )}
            </Box>
          </Box>

          <BadgeContainer>
            <BadgeChip
              label="Amigo"
              size="small"
              color="primary"
            />
            <BadgeChip
              label="SOLDAT ELITE"
              size="small"
              color="secondary"
            />
            <BadgeChip
              label="V.I.P"
              size="small"
              color="success"
            />
            <BadgeChip
              label="PC"
              size="small"
              color="info"
            />
          </BadgeContainer>

          {(button1Label || button2Label) && (
            <Box display="flex" flexDirection="column" mt={1.5}>
              {button1Label && button1Url && (
                <DiscordButton size="small" fullWidth>
                  {button1Label}
                </DiscordButton>
              )}
              {button2Label && button2Url && (
                <DiscordButton size="small" fullWidth>
                  {button2Label}
                </DiscordButton>
              )}
            </Box>
          )}
        </PresenceCard>
      </CardContent>
    </PreviewCard>
  );
} 