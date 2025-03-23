import React from 'react';
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import { Button, Typography, IconButton, Sheet } from '@mui/joy';
import { extendTheme } from '@mui/joy/styles';

// Theme toggle component that uses Joy UI's useColorScheme hook
const ThemeToggle = () => {
  const { mode, setMode } = useColorScheme();
  
  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    <IconButton 
      variant="outlined" 
      onClick={toggleMode} 
      aria-label="Toggle theme"
    >
      {mode === 'light' ? '🌙' : '☀️'}
    </IconButton>
  );
};

// Custom theme options - using the correct structure for Joy UI
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#f0f7ff',
          100: '#c2e0ff',
          200: '#99ccf3',
          300: '#66b2ff',
          400: '#3399ff',
          500: '#007fff',
          600: '#0072e5',
          700: '#0059B2',
          800: '#004c99',
          900: '#003a75',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          50: '#c2e0ff',
          100: '#99ccf3',
          200: '#66b2ff',
          300: '#3399ff',
          400: '#007fff',
          500: '#0072e5',
          600: '#0059B2',
          700: '#004c99',
          800: '#003a75',
          900: '#00264d',
        },
        background: {
          surface: '#121212',
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <CssVarsProvider theme={theme} defaultMode="light">
      <Sheet 
        sx={{ 
          minHeight: '100vh',
          padding: 3,
          transition: 'background-color 0.3s, color 0.3s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Typography level="h1">Welcome to Joy UI</Typography>
          <ThemeToggle />
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <Typography level="body-lg" sx={{ mb: 2 }}>
            This is a demo of Joy UI with theme switching capabilities.
          </Typography>
          
          <Button color="primary" variant="solid">
            Primary Button
          </Button>
          
          <Button color="neutral" variant="outlined" sx={{ ml: 2 }}>
            Secondary Button
          </Button>
        </div>
      </Sheet>
    </CssVarsProvider>
  );
};

export default App;