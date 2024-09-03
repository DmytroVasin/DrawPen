import React from 'react';
import { createRoot } from 'react-dom/client';
import Application from './components/Application';

console.log('[DRAWPEN] : Renderer execution started');

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Application />
  </React.StrictMode>
);
