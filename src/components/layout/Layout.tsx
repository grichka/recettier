import React from 'react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  onNavigate?: (path: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation onMenuItemClick={onNavigate} />
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;