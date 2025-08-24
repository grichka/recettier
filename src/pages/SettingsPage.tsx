import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  Divider,
  Alert,
  Button
} from '@mui/material';
import { Settings, Security, CloudSync, ArrowBack } from '@mui/icons-material';
import { ApiKeyManager } from '../components/common/ApiKeyManager';
import ThemeToggle from '../components/common/ThemeToggle';
import { useAuth } from '../hooks/useAuth';

interface SettingsPageProps {
  onNavigateBack?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigateBack }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pt: isAuthenticated ? 0 : 2 // Add padding when not authenticated
    }}>
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
        {/* Page Header */}
        <Box display="flex" alignItems="center" justifyContent="between" mb={4} width="100%">
          <Box display="flex" alignItems="center" gap={2}>
            <Settings fontSize="large" color="primary" />
            <Typography variant="h4" component="h1">
              Settings
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            {!isAuthenticated && onNavigateBack && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onNavigateBack}
                sx={{ minWidth: 140 }}
              >
                Back to Login
              </Button>
            )}
          </Box>
        </Box>

        {/* Overview Alert */}
        <Alert 
          severity="info" 
          sx={{ mb: 4, borderRadius: 3 }}
          icon={<Security sx={{ mr: 1 }} />}
        >
          <Typography variant="body2">
            Your settings are stored locally in your browser. Google API keys are encrypted for security.
          </Typography>
        </Alert>

        <Box display="flex" flexDirection="column" gap={3}>
          
          {/* Google Integration Section */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: '12px 12px 0 0' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CloudSync />
                  <Typography variant="h6">
                    Google Drive Integration
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Configure your Google API key to enable cloud storage features
                </Typography>
              </Box>
              
              <Box sx={{ p: 3 }}>
                <ApiKeyManager onKeyChange={setHasApiKey} />
                
                {hasApiKey && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ✅ Google Drive integration is ready! You can now save and sync your recipes to Google Drive.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={2}>
                <Settings />
                Appearance
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customize the look and feel of your application
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">
                    Dark Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Toggle between light and dark themes
                  </Typography>
                </Box>
                <Box sx={{ ml: 2 }}>
                  <ThemeToggle variant="switch" showLabel={false} />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Privacy & Security Section */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={2}>
                <Security />
                Privacy & Security
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Information about how your data is handled
              </Typography>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                    }}
                  />
                  <Typography variant="body2">
                    All data is stored locally in your browser
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                    }}
                  />
                  <Typography variant="body2">
                    API keys are encrypted using Web Crypto API
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                    }}
                  />
                  <Typography variant="body2">
                    No data is transmitted to external servers
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                    }}
                  />
                  <Typography variant="body2">
                    Google API access uses your own credentials
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

        </Box>
      </Box>
      </Container>
    </Box>
  );
};

export default SettingsPage;