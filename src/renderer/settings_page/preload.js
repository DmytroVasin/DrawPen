console.log('[DRAWPEN]: Settings page preloading...');

const { contextBridge, ipcRenderer } = require('electron');
const { platform } = process;

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  getConfiguration: () => ipcRenderer.invoke('get_configuration'),
  setShortcut: (key, value) => ipcRenderer.invoke('set_shortcut', key, value),
  canRegisterShortcut: (accelerator) => ipcRenderer.invoke('can_register_shortcut', accelerator),
  setLaunchOnLogin: (value) => ipcRenderer.invoke('set_launch_on_login', value),
  resetToOriginals: () => ipcRenderer.invoke('reset_to_originals'),
  setShowDrawingBorder: (value) => ipcRenderer.invoke('set_show_drawing_border', value),
  setShowCuteCursor: (value) => ipcRenderer.invoke('set_show_cute_cursor', value),
  setAppIconColor: (value) => ipcRenderer.invoke('set_app_icon_color', value),
  setSwapColors: (value) => ipcRenderer.invoke('set_swap_colors', value),

  isMac: platform === 'darwin',
});
