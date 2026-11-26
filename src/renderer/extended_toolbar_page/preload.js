console.log('[DRAWPEN]: Extended toolbar page preloading...');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  invokeCloseApp: () => ipcRenderer.invoke('close_app'),
  invokeDrawMode: () => ipcRenderer.invoke('toggle_draw_or_pointer_window'),
  onClickThroughSession: (callback) => ipcRenderer.on('set_click_through_session', (_event, enabled) => callback(enabled)),
});
