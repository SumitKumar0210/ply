import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './assets/css/style.css';
import App from './App.jsx'
import "@fontsource/open-sans";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { store } from './app/store.js';
import { Provider } from 'react-redux';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { initializeAppDetails } from './components/appUtils.js';


initializeAppDetails();
createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <CssBaseline />
        <App />
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  </Provider>
)
