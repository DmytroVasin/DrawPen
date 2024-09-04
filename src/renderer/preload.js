console.log('[DRAWPEN]: Main page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

// Expose a limited API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  invokeCloseToolBar: () => ipcRenderer.invoke('close_toolbar'),
  onResetScreen: (callback) => ipcRenderer.on('reset_screen', callback)
});
