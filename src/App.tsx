import React, { useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './utils/theme';
import Layout from './components/layout/Layout';
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
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
