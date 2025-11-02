import React from 'react';
import { createRoot } from 'react-dom/client';
import Settings from './components/Settings';

console.log('[DRAWPEN]: Settings page loading...');

const root = createRoot(document.getElementById('root'));

window.electronAPI.getConfiguration().then((config) => {
  console.log('[DRAWPEN]: Settings page config: ', config);

  root.render(
    <Settings {...config} />
  );
})
