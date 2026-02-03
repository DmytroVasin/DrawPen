console.log('[DRAWPEN]: Settings page preloading...');

const { contextBridge, ipcRenderer } = require('electron');
const { platform } = process;

contextBridge.exposeInMainWorld('electronAPI', {
  // Renderer -> Main
  getConfiguration: () => ipcRenderer.invoke('get_configuration'),
  setShortcut: (key, value) => ipcRenderer.invoke('set_shortcut', key, value),
  canRegisterShortcut: (accelerator) => ipcRenderer.invoke('can_register_shortcut', accelerator),
  setLaunchOnLogin: (value) => ipcRenderer.invoke('set_launch_on_login', value),
  setStartsHidden: (value) => ipcRenderer.invoke('set_starts_hidden', value),
  resetToOriginals: () => ipcRenderer.invoke('reset_to_originals'),
  setShowDrawingBorder: (value) => ipcRenderer.invoke('set_show_drawing_border', value),
  setShowCuteCursor: (value) => ipcRenderer.invoke('set_show_cute_cursor', value),
  setLaserTimeMs: (value) => ipcRenderer.invoke('set_laser_time', value),
  setAppIconColor: (value) => ipcRenderer.invoke('set_app_icon_color', value),
  setSwapColors: (value) => ipcRenderer.invoke('set_swap_colors', value),
  setDrawingMonitor: (value) => ipcRenderer.invoke('set_drawing_monitor', value),
  setFadeDisappearAfterMs: (value) => ipcRenderer.invoke('set_fade_disappear_after_ms', value),
  setFadeOutDurationTimeMs: (value) => ipcRenderer.invoke('set_fade_out_duration_time_ms', value),

  isMac: platform === 'darwin',
});
