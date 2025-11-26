import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// This file is the entry point that connects the React application (App.jsx) 
// to the HTML page (public/index.html).

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
