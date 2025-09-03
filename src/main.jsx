import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './assets/css/style.css';
import App from './App.jsx'
import "@fontsource/open-sans"; 
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <BrowserRouter>
        <CssBaseline />
        <App />
    </BrowserRouter>
  </ThemeProvider>
)
