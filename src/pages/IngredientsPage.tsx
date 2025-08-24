import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const IngredientsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Ingredients
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your ingredient registry will appear here. This feature is coming soon!
        </Typography>
      </Box>
    </Container>
  );
};

export default IngredientsPage;