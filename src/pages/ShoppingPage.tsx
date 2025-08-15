import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ShoppingPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shopping Lists
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your shopping lists will appear here. This feature is coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default ShoppingPage;