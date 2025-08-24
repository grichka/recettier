import React, { useState, useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
    switch (currentPage) {
      case '/':
        return <DashboardPage />;
      case '/recipes':
        return <RecipesPage />;
      case '/shopping':
        return <ShoppingPage />;
      case '/ingredients':
        return <IngredientsPage />;
      case '/settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
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
