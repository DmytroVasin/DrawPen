console.log('[DRAWPEN]: Main page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  invokeCloseApp: () => ipcRenderer.invoke('close_app'),
  invokePointerMode: () => ipcRenderer.invoke('toggle_draw_or_pointer_window'),
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
  onUpdateToolbarPosition: (callback) => ipcRenderer.on('update_toolbar_position', callback),
  onShowNotification: (callback) => ipcRenderer.on('show_notification', callback),
});
