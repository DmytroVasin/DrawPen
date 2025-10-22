console.log('[DRAWPEN]: Main page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  invokeHideApp: () => ipcRenderer.invoke('hide_app'),
  invokeOpenSettings: () => ipcRenderer.invoke('open_settings'),
  invokeGetSettings: () => ipcRenderer.invoke('get_settings'),
  invokeSetSettings: (settings) => ipcRenderer.invoke('set_settings', settings),

  // Main -> Renderer
  onResetScreen: (callback) => ipcRenderer.on('reset_screen', callback),
  onToggleToolbar: (callback) => ipcRenderer.on('toggle_toolbar', callback),
  onToggleWhiteboard: (callback) => ipcRenderer.on('toggle_whiteboard', callback),
});
