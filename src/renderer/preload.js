console.log('[DRAWPEN]: Main page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  invokeHideApp: () => ipcRenderer.invoke('hide_app'),

  // Main -> Renderer
  onResetScreen: (callback) => ipcRenderer.on('reset_screen', callback),
  onToggleToolbar: (callback) => ipcRenderer.on('toggle_toolbar', callback),
  onToggleWhiteboard: (callback) => ipcRenderer.on('toggle_whiteboard', callback),
  onCallUndo: (callback) => ipcRenderer.on('call_undo', callback),
});
