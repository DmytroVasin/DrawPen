console.log('[DRAWPEN]: Main page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  invokeHideApp: () => ipcRenderer.invoke('hide_app'),
  invokeOpenSettings: () => ipcRenderer.invoke('open_settings'),
  invokeMakeScreenshot: () => ipcRenderer.invoke('make_screenshot'),
  invokeOpenNotification: (info) => ipcRenderer.invoke('open_notification', info),
  invokeGetSettings: () => ipcRenderer.invoke('get_settings'),
  invokeSetSettings: (settings) => ipcRenderer.invoke('set_settings', settings),

  // Main -> Renderer
  onResetScreen: (callback) => ipcRenderer.on('reset_screen', callback),
  onToggleToolbar: (callback) => ipcRenderer.on('toggle_toolbar', callback),
  onToggleWhiteboard: (callback) => ipcRenderer.on('toggle_whiteboard', callback),
  onRefreshSettings: (callback) => ipcRenderer.on('refresh_settings', callback),
  onShowNotification: (callback) => ipcRenderer.on('show_notification', callback),
});
