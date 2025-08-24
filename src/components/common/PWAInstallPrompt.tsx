import React from 'react';
import {
  Button,
  Snackbar,
  Alert,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
import {
  GetApp as InstallIcon,
  Close as CloseIcon,
  Update as UpdateIcon,
} from '@mui/icons-material';
import { usePWA } from '../../utils/pwa';

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWA();
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = React.useState(false);

  React.useEffect(() => {
    // Show install prompt for installable apps
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  React.useEffect(() => {
    // Listen for app updates
    const handleUpdate = () => {
      setShowUpdateNotification(true);
    };

    window.addEventListener('pwa-update-available', handleUpdate);
    return () => window.removeEventListener('pwa-update-available', handleUpdate);
  }, []);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleClosePrompt = () => {
    setShowPrompt(false);
  };

  const handleCloseUpdate = () => {
    setShowUpdateNotification(false);
  };

  if (isInstalled) {
    return null; // Don't show install prompt if already installed
  }

  return (
    <>
      {/* Install Prompt */}
      <Snackbar
        open={showPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Alert
          severity="info"
          variant="filled"
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstall}
                startIcon={<InstallIcon />}
                sx={{ color: 'white' }}
              >
                Install
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClosePrompt}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{ alignItems: 'center' }}
        >
          <Box>
            <Typography variant="subtitle2" component="div">
              Install Recettier
            </Typography>
            <Typography variant="body2">
              Add to your home screen for quick access!
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Update Notification */}
      <Snackbar
        open={showUpdateNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Alert
          severity="success"
          variant="filled"
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleRefresh}
                startIcon={<UpdateIcon />}
                sx={{ color: 'white' }}
              >
                Update
              </Button>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseUpdate}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{ alignItems: 'center' }}
        >
          <Box>
            <Typography variant="subtitle2" component="div">
              New Update Available
            </Typography>
            <Typography variant="body2">
              Refresh to get the latest features!
            </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </>
  );
};

export default PWAInstallPrompt;