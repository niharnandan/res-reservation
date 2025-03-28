import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssVarsProvider } from '@mui/joy/styles';
import App from './App'; // Your main component

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <CssVarsProvider>
    <App />
  </CssVarsProvider>
);
