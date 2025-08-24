import React from 'react';
import {
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Box,
  Typography,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  Brightness6,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  variant?: 'menu' | 'switch' | 'button';
  onClose?: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showLabel = true, 
  variant = 'menu',
  onClose 
}) => {
  const { mode, toggleTheme } = useTheme();

  const handleToggle = () => {
    toggleTheme();
    if (onClose) {
      onClose();
    }
  };

  if (variant === 'switch') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
        <LightMode sx={{ color: mode === 'light' ? 'primary.main' : 'text.secondary' }} />
        <Switch
          checked={mode === 'dark'}
          onChange={handleToggle}
          color="primary"
          size="small"
        />
        <DarkMode sx={{ color: mode === 'dark' ? 'primary.main' : 'text.secondary' }} />
        {showLabel && (
          <Typography variant="body2" sx={{ ml: 1 }}>
            {mode === 'dark' ? 'Dark' : 'Light'} Mode
          </Typography>
        )}
      </Box>
    );
  }

  if (variant === 'button') {
    return (
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          cursor: 'pointer',
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
        {showLabel && (
          <Typography variant="body2">
            Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
          </Typography>
        )}
      </Box>
    );
  }

  // Default menu variant
  return (
    <MenuItem onClick={handleToggle}>
      <ListItemIcon>
        {mode === 'dark' ? (
          <LightMode fontSize="small" />
        ) : (
          <DarkMode fontSize="small" />
        )}
      </ListItemIcon>
      <ListItemText>
        {mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
      </ListItemText>
      <Box sx={{ ml: 1 }}>
        <Brightness6 
          fontSize="small" 
          sx={{ color: 'text.secondary' }} 
        />
      </Box>
    </MenuItem>
  );
};

export default ThemeToggle;