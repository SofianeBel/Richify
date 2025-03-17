import { Box, Card, CardContent, Typography, Avatar, Button, styled } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const PreviewCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#36393f' : '#ffffff',
  maxWidth: 300,
  margin: '0 auto'
}));

const DiscordUsername = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  fontWeight: 'bold'
}));

const PresenceText = styled(Typography)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#dcddde' : '#2e3338'
}));

const DiscordButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#4f545c' : '#e3e5e8',
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#4f545c',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#686d73' : '#d4d7dc'
  },
  textTransform: 'none',
  margin: theme.spacing(0.5)
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
  return (
    <PreviewCard>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            alt="Discord Avatar"
            src="/discord-avatar-placeholder.png"
            sx={{ width: 32, height: 32, mr: 1 }}
          />
          <DiscordUsername variant="subtitle1">
            Nom d'utilisateur
          </DiscordUsername>
        </Box>

        <Box display="flex" mb={2}>
          {largeImageKey && (
            <Box position="relative" mr={2}>
              <Avatar
                alt={largeImageText || 'Large Image'}
                src={`/assets/images/${largeImageKey}.png`}
                sx={{ width: 60, height: 60 }}
              />
              {smallImageKey && (
                <Avatar
                  alt={smallImageText || 'Small Image'}
                  src={`/assets/images/${smallImageKey}.png`}
                  sx={{
                    width: 20,
                    height: 20,
                    position: 'absolute',
                    bottom: -2,
                    right: -2
                  }}
                />
              )}
            </Box>
          )}

          <Box>
            {details && (
              <PresenceText variant="body2" gutterBottom>
                {details}
              </PresenceText>
            )}
            {state && (
              <PresenceText variant="body2" gutterBottom>
                {state}
              </PresenceText>
            )}
            {startTimestamp && (
              <PresenceText variant="caption" color="textSecondary">
                {formatDistanceToNow(startTime, { addSuffix: true, locale: fr })}
              </PresenceText>
            )}
          </Box>
        </Box>

        {(button1Label || button2Label) && (
          <Box display="flex" flexDirection="column">
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
      </CardContent>
    </PreviewCard>
  );
} 