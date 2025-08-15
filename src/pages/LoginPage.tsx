import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn, isLoading, error } = useAuth();

  const handleSignIn = async () => {
    await signIn();
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Logo/Header */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 1,
              }}
            >
              🍳 Recettier
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Store recipes. Build lists. Cook faster.
            </Typography>
          </Box>

          {/* Welcome Message */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Welcome to your kitchen companion
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in with Google to start organizing your recipes and meal planning.
            </Typography>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Sign In Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleSignIn}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Google />
              )
            }
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {/* Features Preview */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6" gutterBottom>
              What you can do:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                textAlign: 'left',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
                <Typography variant="body2">
                  Store and organize your favorite recipes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
                <Typography variant="body2">
                  Build smart shopping lists from recipes
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
                <Typography variant="body2">
                  Manage ingredients and meal planning
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
                <Typography variant="body2">
                  Store everything securely in your Google Drive
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Privacy Note */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 4, display: 'block' }}
          >
            Your data is stored in your own Google Drive and only accessible by you.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;