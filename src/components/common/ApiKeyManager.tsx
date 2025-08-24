import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Link,
  FormControl,
  FormHelperText,
} from '@mui/material';
import { CheckCircle, Warning, Key } from '@mui/icons-material';
import { apiKeyStorage } from '../../utils/apiKeyStorage';
import { useAuth } from '../../hooks/useAuth';

// For accessing static methods
class ApiKeyStorage {
  static validateApiKey(apiKey: string): boolean {
    // Google API keys typically start with 'AIza' and are 39 characters long
    const googleApiKeyPattern = /^AIza[A-Za-z0-9_-]{35}$/;
    return googleApiKeyPattern.test(apiKey);
  }
}

interface ApiKeyManagerProps {
  onKeyChange?: (hasKey: boolean) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeyChange }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { reinitialize } = useAuth();

  const checkApiKeyStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const hasKey = await apiKeyStorage.hasApiKey();
      setHasApiKey(hasKey);
      onKeyChange?.(hasKey);
    } catch (error) {
      console.error('Error checking API key status:', error);
      setError('Failed to check API key status');
    } finally {
      setIsLoading(false);
    }
  }, [onKeyChange]);

  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    if (!ApiKeyStorage.validateApiKey(apiKey)) {
      setError('Invalid Google API key format. Keys should start with "AIza" and be 39 characters long.');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setSuccess('');

      await apiKeyStorage.storeApiKey(apiKey);
      setHasApiKey(true);
      setShowForm(false);
      setApiKey('');
      setSuccess('API key saved securely!');
      onKeyChange?.(true);
      
      // Re-initialize authentication now that API key is available
      await reinitialize();
    } catch (error) {
      console.error('Error saving API key:', error);
      setError('Failed to save API key. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveApiKey = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setSuccess('');

      await apiKeyStorage.removeApiKey();
      setHasApiKey(false);
      setSuccess('API key removed successfully.');
      onKeyChange?.(false);
    } catch (error) {
      console.error('Error removing API key:', error);
      setError('Failed to remove API key. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setApiKey('');
    setError('');
    setSuccess('');
  };

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Checking API key status...
        </Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Key color={hasApiKey ? 'success' : 'warning'} />
            <Typography variant="h6" component="h3">
              Google API Configuration
            </Typography>
          </Box>
          <Chip
            icon={hasApiKey ? <CheckCircle /> : <Warning />}
            label={hasApiKey ? 'Configured' : 'Not Set'}
            color={hasApiKey ? 'success' : 'warning'}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        {/* Status and Actions */}
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Status: {hasApiKey ? 'API key is securely stored' : 'API key required for Google Drive features'}
            </Typography>
          </Box>
          {hasApiKey && !showForm && (
            <Box sx={{ ml: 3 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowForm(true)}
                disabled={isProcessing}
                sx={{ minWidth: 100 }}
              >
                Change Key
              </Button>
            </Box>
          )}
        </Box>

        {/* Warning Message for Missing API Key */}
        {!hasApiKey && !showForm && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            action={
              <Button
                variant="contained"
                color="warning"
                size="small"
                onClick={() => setShowForm(true)}
                sx={{ minWidth: 100, color: 'white' }}
              >
                Setup Key
              </Button>
            }
          >
            <Typography variant="body2">
              To use Google Drive features, you need to provide your own Google API key. 
              This ensures your data remains secure and your usage is within your own quota.
            </Typography>
          </Alert>
        )}

        {/* API Key Form */}
        {showForm && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2 
          }}>
            <Typography variant="subtitle1" gutterBottom>
              {hasApiKey ? 'Update' : 'Add'} Google API Key
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google API key..."
                variant="outlined"
                size="small"
                disabled={isProcessing}
                error={!!error && error.includes('Invalid')}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                  },
                }}
              />
              <FormHelperText>
                Your API key will be encrypted and stored securely in your browser.
              </FormHelperText>
            </FormControl>

            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                onClick={handleSaveApiKey}
                disabled={isProcessing || !apiKey.trim()}
                size="small"
              >
                {isProcessing ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={isProcessing}
                size="small"
              >
                Cancel
              </Button>
              {hasApiKey && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleRemoveApiKey}
                  disabled={isProcessing}
                  size="small"
                >
                  Remove Key
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Success/Error Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {/* Help Link */}
        {!hasApiKey && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'grey.200' }}>
            <Typography variant="body2" color="text.secondary">
              Need help getting an API key?{' '}
              <Link
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Google Cloud Console
              </Link>
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};