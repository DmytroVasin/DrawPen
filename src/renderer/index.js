import React from 'react';
import { createRoot } from 'react-dom/client';
import Application from './components/Application';

console.log('[DRAWPEN]: Main page loading...');

const root = createRoot(document.getElementById('root'));
root.render(
  <Application />
);
