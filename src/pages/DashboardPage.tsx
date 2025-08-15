import React from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import {
  Restaurant,
  ShoppingCart,
  Inventory,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const statsCards = [
    {
      title: 'Total Recipes',
      value: '0',
      icon: <Restaurant fontSize="large" />,
      color: '#2E7D32',
    },
    {
      title: 'Shopping Lists',
      value: '0',
      icon: <ShoppingCart fontSize="large" />,
      color: '#FF6F00',
    },
    {
      title: 'Ingredients',
      value: '0',
      icon: <Inventory fontSize="large" />,
      color: '#1976D2',
    },
    {
      title: 'Meals Planned',
      value: '0',
      icon: <TrendingUp fontSize="large" />,
      color: '#7B1FA2',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Section */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
            color: 'white',
            borderRadius: 3,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome back, {user?.name?.split(' ')[0] || 'Chef'}! 👨‍🍳
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Your culinary journey starts here. Store recipes, build lists, cook faster.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Chip
              label="🚀 Getting Started"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 500,
              }}
            />
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 3,
            mb: 4,
          }}
        >
          {statsCards.map((card, index) => (
            <Card
              key={index}
              sx={{
                borderRadius: 3,
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s ease-in-out',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: `${card.color}15`,
                      color: card.color,
                      p: 2,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                </Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Getting Started Section */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
          }}
        >
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                🎯 Quick Actions
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start building your recipe collection and meal planning workflow.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    border: '2px dashed #e0e0e0',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                      borderColor: '#2E7D32',
                    },
                  }}
                >
                  <Restaurant sx={{ fontSize: 40, color: '#2E7D32', mb: 1 }} />
                  <Typography variant="h6">Add Your First Recipe</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start your collection
                  </Typography>
                </Paper>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    border: '2px dashed #e0e0e0',
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f0f0f0',
                      borderColor: '#FF6F00',
                    },
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 40, color: '#FF6F00', mb: 1 }} />
                  <Typography variant="h6">Create Shopping List</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plan your shopping
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                📱 Features
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#4CAF50',
                      mr: 2,
                    }}
                  />
                  <Typography variant="body2">Recipe Management</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#4CAF50',
                      mr: 2,
                    }}
                  />
                  <Typography variant="body2">Ingredient Registry</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#4CAF50',
                      mr: 2,
                    }}
                  />
                  <Typography variant="body2">Smart Shopping Lists</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#FFC107',
                      mr: 2,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Meal Planning (Coming Soon)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default DashboardPage;