import React from 'react';
import { createRoot } from 'react-dom/client';
import Application from './components/Application';

console.log('[DRAWPEN]: Main page loading...');

const root = createRoot(document.getElementById('root'));

window.electronAPI.invokeGetSettings().then((settings) => {
  console.log('[DRAWPEN]: Main page settings: ', settings);

  root.render(
    <Application {...settings} />
  );
})
