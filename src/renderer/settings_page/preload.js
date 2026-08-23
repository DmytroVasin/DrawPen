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
  setClearDrawingsOnHide: (value) => ipcRenderer.invoke('set_clear_drawings_on_hide', value),
  resetToOriginals: () => ipcRenderer.invoke('reset_to_originals'),
  setShowDrawingBorder: (value) => ipcRenderer.invoke('set_show_drawing_border', value),
  setCuteCursorMode: (value) => ipcRenderer.invoke('set_cute_cursor_mode', value),
  setPenSmoothing: (value) => ipcRenderer.invoke('set_pen_smoothing', value),
  setLaserTimeMs: (value) => ipcRenderer.invoke('set_laser_time', value),
  setAppIconColor: (value) => ipcRenderer.invoke('set_app_icon_color', value),
  setSwapColors: (value) => ipcRenderer.invoke('set_swap_colors', value),
  setToolbarColor: (colorId, value) => ipcRenderer.invoke('set_toolbar_color', colorId, value),
  setDrawingMonitor: (value) => ipcRenderer.invoke('set_drawing_monitor', value),
  setDisableToolbarInPointerMode: (value) => ipcRenderer.invoke('set_disable_toolbar_in_pointer_mode', value),
  setFadeDisappearAfterMs: (value) => ipcRenderer.invoke('set_fade_disappear_after_ms', value),
  setFadeOutDurationTimeMs: (value) => ipcRenderer.invoke('set_fade_out_duration_time_ms', value),
  chooseScreenshotDirectory: () => ipcRenderer.invoke('choose_screenshot_directory'),
  resetScreenshotDirectory: () => ipcRenderer.invoke('reset_screenshot_directory'),
  openScreenshotDirectory: () => ipcRenderer.invoke('open_screenshot_directory'),

  isMac: platform === 'darwin',
});
