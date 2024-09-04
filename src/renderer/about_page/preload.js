console.log('[DRAWPEN]: About Page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

// Expose a limited API to the renderer process
contextBridge.exposeInMainWorld('electron', {
    getVersion: () => ipcRenderer.invoke('get-app-version')
});
