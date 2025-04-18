import React from 'react';
import { CssVarsProvider, useColorScheme } from '@mui/joy/styles';
import { Button, Typography, IconButton, Sheet } from '@mui/joy';
import { extendTheme } from '@mui/joy/styles';
import Calendar from './components/Calendar';

// Theme toggle component that uses Joy UI's useColorScheme hook
const ThemeToggle = () => {
  const { mode, setMode } = useColorScheme();

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  return (
    // <IconButton
    //   variant="outlined"
    //   onClick={toggleMode}
    //   aria-label="Toggle theme"
    // >
    //   {mode === 'light' ? '🌙' : '☀️'}
    // </IconButton>
    <></>
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
          padding: 3,
          transition: 'background-color 0.3s, color 0.3s',
          maxWidth: '100%',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <Typography level="h1">Welcome to Joy UI</Typography>
          <ThemeToggle />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Calendar />
        </div>
      </Sheet>
    </CssVarsProvider>
  );
};

export default App;
