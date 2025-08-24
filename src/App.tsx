import React, { useState, useEffect } from 'react';
import { CssBaseline, CircularProgress, Typography, Box } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeProvider';
import { useAuth } from './hooks/useAuth';
import { initializeSecurity } from './utils/security';
import Layout from './components/layout/Layout';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingPage from './pages/ShoppingPage';
import IngredientsPage from './pages/IngredientsPage';
import SettingsPage from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('/');

  const handleNavigate = (path: string) => {
    setCurrentPage(path);
  };

  const renderPage = () => {
    // Allow access to settings even when not authenticated
    if (currentPage === '/settings') {
      return <SettingsPage onNavigateBack={!isAuthenticated ? () => setCurrentPage('/') : undefined} />;
    }
    
    switch (currentPage) {
      case '/':
        return <DashboardPage />;
      case '/recipes':
        return <RecipesPage />;
      case '/shopping':
        return <ShoppingPage />;
      case '/ingredients':
        return <IngredientsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1" color="text.secondary">
          Restoring your session...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated && currentPage !== '/settings') {
    return <LoginPage onNavigateToSettings={() => setCurrentPage('/settings')} />;
  }

  // If not authenticated but on settings page, show settings without layout
  if (!isAuthenticated && currentPage === '/settings') {
    return <SettingsPage onNavigateBack={() => setCurrentPage('/')} />;
  }

  return (
    <Layout onNavigate={handleNavigate}>
      {renderPage()}
      <PWAInstallPrompt />
    </Layout>
  );
};

function App() {
  // Initialize security measures on app startup
  useEffect(() => {
    initializeSecurity();
  }, []);

  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
