import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Application settings will appear here. This feature is coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default SettingsPage;