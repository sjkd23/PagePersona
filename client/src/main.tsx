/**
 * Application entry point
 *
 * This module initializes the React application with StrictMode enabled
 * for development-time checks and renders the main App component into
 * the DOM root element.
 *
 * @module main
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
