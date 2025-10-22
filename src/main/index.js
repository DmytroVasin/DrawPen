import { app, Tray, Menu, BrowserWindow, screen, globalShortcut, shell, ipcMain, nativeTheme } from 'electron';
import { updateElectronApp } from 'update-electron-app';
import Store from 'electron-store';
import path from 'path';

const isDevelopment = process.env.NODE_ENV === 'development'
const isMac = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const isWin = process.platform === 'win32'

const KEY_SHOW_HIDE_APP        = 'CmdOrCtrl+Shift+A'
const KEY_SHOW_HIDE_TOOLBAR    = 'CmdOrCtrl+T'
const KEY_SHOW_HIDE_WHITEBOARD = 'CmdOrCtrl+E'
const KEY_CLEAR_DESK           = 'CmdOrCtrl+K'
const KEY_SETTINGS             = 'CmdOrCtrl+,'
const KEY_Q                    = 'CmdOrCtrl+Q'
const KEY_NULL                 = '[NULL]'

let lastShortcutTime = 0;
const throttleDelay = 250;

const schema = {
  show_whiteboard: {
    type: 'boolean',
    default: false
  },
  show_tool_bar: {
    type: 'boolean',
    default: true
  },
  tool_bar_x: {
    type: 'number',
    default: 5
  },
  tool_bar_y: {
    type: 'number',
    default: 5
  },
  tool_bar_active_tool: {
    type: 'string',
    default: 'pen'
  },
  tool_bar_active_color_index: {
    type: 'number',
    default: 1
  },
  tool_bar_active_weight_index: {
    type: 'number',
    default: 1
  },
  tool_bar_default_figure: {
    type: 'string',
    default: 'arrow'
  },
  active_monitor_id: {
    type: 'number',
  },
  launch_on_login: {
    type: 'boolean',
    default: false
  },
  key_binding_show_hide_app: {
    type: 'string',
    default: KEY_SHOW_HIDE_APP
  },
  key_binding_show_hide_toolbar: {
    type: 'string',
    default: KEY_SHOW_HIDE_TOOLBAR
  },
  key_binding_show_hide_whiteboard: {
    type: 'string',
    default: KEY_SHOW_HIDE_WHITEBOARD
  },
  key_binding_clear_desk: {
    type: 'string',
    default: KEY_CLEAR_DESK
  },
};

// app.getPath('userData') + '/config.json'
const store = new Store({
  schema
});

console.log('Current store: ', store.store)

let tray
let mainWindow
let aboutWindow
let settingsWindow

let foregroundMode = true

const iconSrc = {
  DEFAULT: path.resolve(__dirname, '../renderer/assets/trayIcon.png'),
  DEFAULT_WHITE: path.resolve(__dirname, '../renderer/assets/trayIconWhite.png'),
  darwin: path.resolve(__dirname, '../renderer/assets/trayIconTemplate@2x.png'),
  linux: path.resolve(__dirname, '../renderer/assets/trayIconWhite.png'),
}

function getTrayIconPath() {
   if (isMac) return iconSrc.darwin
   if (isLinux)  return iconSrc.linux
   if (isWin)  return nativeTheme.shouldUseDarkColors ? iconSrc.DEFAULT_WHITE : iconSrc.DEFAULT

   return iconSrc.DEFAULT
}

function updateContextMenu() {
  if (!tray) return;

  const show_tool_bar   = store.get('show_tool_bar')
  const show_whiteboard = store.get('show_whiteboard')

  const key_show_hide_app        = store.get('key_binding_show_hide_app')
  const key_show_hide_toolbar    = store.get('key_binding_show_hide_toolbar')
  const key_show_hide_whiteboard = store.get('key_binding_show_hide_whiteboard')
  const key_clear_desk           = store.get('key_binding_clear_desk')

  const accelForTray = (accel) => {
    if (!accel) return undefined;
    if (accel === KEY_NULL) return undefined;

    if (isLinux) return undefined; // Disable tray menu accelerators on Linux

    return accel
  };

  const withAccelHint = (label, accel) => {
    if (!accel) return label;
    if (accel === KEY_NULL) return label;

    if (isLinux) {
      return `${label} (${normalizeAcceleratorForUI(accel)})`;
    }

    return label;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: withAccelHint((foregroundMode ? 'Hide DrawPen' : 'Show DrawPen'), key_show_hide_app),
      accelerator: accelForTray(key_show_hide_app),
      click: toggleDrawWindow
    },
    {
      label: withAccelHint((show_tool_bar ? 'Hide Toolbar' : 'Show Toolbar'), key_show_hide_toolbar),
      accelerator: accelForTray(key_show_hide_toolbar),
      click: toggleToolbar
    },
    {
      label: withAccelHint((show_whiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'), key_show_hide_whiteboard),
      accelerator: accelForTray(key_show_hide_whiteboard),
      click: toggleWhiteboard
    },
    {
      label: withAccelHint('Clear desk', key_clear_desk),
      accelerator: accelForTray(key_clear_desk),
      click: resetScreen
    },
    { type: 'separator' },
    {
      label: 'Reset to original',
      click: resetApp
    },
    {
      label: withAccelHint('Settings', KEY_SETTINGS),
      accelerator: accelForTray(KEY_SETTINGS),
      click: showSettingsWindow
    },
    { type: 'separator' },
    {
      label: 'About DrawPen',
      click: showAboutWindow
    },
    {
      label: withAccelHint('Quit', KEY_Q),
      accelerator: accelForTray(KEY_Q),
      click: quitApp
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function registerTrayIconUpdate() {
  nativeTheme.on('updated', () => {
    if (!tray) return;

    tray.setImage(getTrayIconPath())
  })
}

function getActiveMonitor() {
  const activeMonitorId = store.get('active_monitor_id')

  const matchedMonitor = screen.getAllDisplays().find(display => display.id === activeMonitorId)
  if (matchedMonitor) {
    return matchedMonitor
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  store.set('active_monitor_id', primaryDisplay.id)

  return primaryDisplay
}

function createMainWindow() {
  const mainDisplay = getActiveMonitor()

  let { width, height } = mainDisplay.workAreaSize
  let isResizable = false
  let hasDevTools = false

  if (isDevelopment) {
    width = 500
    height = 500
    isResizable = true
    hasDevTools = true
  }

  mainWindow = new BrowserWindow({
    show: false,
    x: 0,
    y: 0,
    width: width,
    height: height,
    transparent: true,
    backgroundColor: '#00000000', // 8-symbol ARGB
    resizable: isResizable,
    hasShadow: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: APP_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  })

  mainWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('close', function () {
    rawLog('Main window: on close')

    foregroundMode = false
    updateContextMenu()
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', () => {
    if (foregroundMode) {
      showWindowOnActiveScreen();
    }
  })

  mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
}

function showAboutWindow() {
  withThrottle(() => {
    hideDrawWindow()

    if (aboutWindow) {
      aboutWindow.focus();
      return;
    }

    createAboutWindow();
  });
}

function createAboutWindow() {
  let hasDevTools = false

  if (isDevelopment) {
    hasDevTools = true
  }

  aboutWindow = new BrowserWindow({
    show: false,
    width: 250,
    height: 250,
    resizable: false,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: ABOUT_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  })
  aboutWindow.center();

  aboutWindow.loadURL(ABOUT_WINDOW_WEBPACK_ENTRY)

  aboutWindow.on('minimize', (event) => {
    event.preventDefault()
  })

  aboutWindow.on('closed', () => {
    aboutWindow = null
  })

  aboutWindow.webContents.on('did-finish-load', () => {
    aboutWindow.show()
  })

  aboutWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);

    return { action: "deny" };
  })

  aboutWindow.webContents.setVisualZoomLevelLimits(1, 1);
  aboutWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
}

function showSettingsWindow() {
  withThrottle(() => {
    hideDrawWindow()

    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }

    createSettingsWindow();
  });
}

function createSettingsWindow() {
  rawLog('Creating settings window...')

  let hasDevTools = false

  if (isDevelopment) {
    hasDevTools = true
  }

  settingsWindow = new BrowserWindow({
    show: false,
    width: 600,
    height: 500,
    resizable: false,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: SETTINGS_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  })
  settingsWindow.center();

  settingsWindow.loadURL(SETTINGS_WINDOW_WEBPACK_ENTRY)

  settingsWindow.on('minimize', (event) => {
    event.preventDefault()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  settingsWindow.webContents.on('did-finish-load', () => {
    settingsWindow.show()
  })

  settingsWindow.webContents.setVisualZoomLevelLimits(1, 1);
  settingsWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.control || input.meta) && ['+', '=', '-', '0', 'numadd', 'numsub'].includes(input.key.toLowerCase())) {
      event.preventDefault();
    }
  });
}

// Must be before "app.whenReady()"
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0); // return is forbidden in this context
}

app.on('second-instance', () => {
  showDrawWindow();
});

app.commandLine.appendSwitch('disable-pinch');
app.whenReady().then(() => {
  hideDock()
  createMainWindow()

  tray = new Tray(getTrayIconPath())
  updateContextMenu()
  registerTrayIconUpdate()

  registerGlobalShortcuts()

  updateApp()
})

app.on('will-quit', () => {
  rawLog('Will quit app... (Unregister all shortcuts)')

  unRegisterGlobalShortcuts()
});

app.on('window-all-closed', () => {
  rawLog('All windows closed.')

  // Empty handler to prevent app from quitting
})

function hideDock() {
  if (isMac) {
    app.dock.hide();
  }
}

function updateApp() {
  if (isLinux) return

  updateElectronApp()
}

ipcMain.handle('get_app_version', () => {
  return app.getVersion();
});

ipcMain.handle('get_settings', () => {
  return {
    show_whiteboard: store.get('show_whiteboard'),
    show_tool_bar: store.get('show_tool_bar'),
    tool_bar_x: store.get('tool_bar_x'),
    tool_bar_y: store.get('tool_bar_y'),
    tool_bar_active_tool: store.get('tool_bar_active_tool'),
    tool_bar_active_color_index: store.get('tool_bar_active_color_index'),
    tool_bar_active_weight_index: store.get('tool_bar_active_weight_index'),
    tool_bar_default_figure: store.get('tool_bar_default_figure'),
    active_monitor_id: store.get('active_monitor_id'),

    key_binding_show_hide_toolbar:    normalizeAcceleratorForUI(store.get('key_binding_show_hide_toolbar')),
    key_binding_show_hide_whiteboard: normalizeAcceleratorForUI(store.get('key_binding_show_hide_whiteboard')),
    key_binding_clear_desk:           normalizeAcceleratorForUI(store.get('key_binding_clear_desk')),
    key_binding_open_settings:        normalizeAcceleratorForUI(KEY_SETTINGS),
  };
});

ipcMain.handle('set_settings', (_event, newSettings) => {
  const needUpdateMenu = shouldUpdateMenu(newSettings) // Roundtrip request updates store value

  store.set({ ...store.store, ...newSettings })
  rawLog('Updated store (set settings): ', store.store)

  if (needUpdateMenu) {
    rawLog('Update Menu (settings changed)...')
    updateContextMenu()
  }

  return null
});

ipcMain.handle('hide_app', () => {
  hideDrawWindow()

  return null
});

ipcMain.handle('open_settings', () => {
  showSettingsWindow()

  return null
});

ipcMain.handle('reset_to_originals', () => {
  resetApp();

  return null
});

ipcMain.handle('get_configuration', () => {
  rawLog('Getting configuration...')

  return {
    launch_on_login:                          store.get('launch_on_login'),

    key_binding_show_hide_app:                normalizeAcceleratorForUI(store.get('key_binding_show_hide_app')),
    key_binding_show_hide_app_default:        normalizeAcceleratorForUI(schema.key_binding_show_hide_app.default),

    key_binding_show_hide_toolbar:            normalizeAcceleratorForUI(store.get('key_binding_show_hide_toolbar')),
    key_binding_show_hide_toolbar_default:    normalizeAcceleratorForUI(schema.key_binding_show_hide_toolbar.default),

    key_binding_show_hide_whiteboard:         normalizeAcceleratorForUI(store.get('key_binding_show_hide_whiteboard')),
    key_binding_show_hide_whiteboard_default: normalizeAcceleratorForUI(schema.key_binding_show_hide_whiteboard.default),

    key_binding_clear_desk:                   normalizeAcceleratorForUI(store.get('key_binding_clear_desk')),
    key_binding_clear_desk_default:           normalizeAcceleratorForUI(schema.key_binding_clear_desk.default),
  };
});

ipcMain.handle('can_register_shortcut', async (_event, value) => {
  rawLog('Checking shortcut registration:', value)

  const accelerator = deNormalizeAcceleratorFromUI(value)

  const shortcutsInUse = [
    store.get('key_binding_show_hide_app'),
    store.get('key_binding_show_hide_toolbar'),
    store.get('key_binding_show_hide_whiteboard'),
    store.get('key_binding_clear_desk'),
  ].filter(s => s && s !== KEY_NULL)

  if (shortcutsInUse.includes(accelerator)) {
    return false;
  }

  if (globalShortcut.isRegistered(accelerator)) {
    return false;
  }

  try {
    const success = globalShortcut.register(accelerator, () => {});
    if (success) {
      globalShortcut.unregister(accelerator);
    }

    return success;
  } catch {
    return false;
  }
});

ipcMain.handle('set_shortcut', (_event, key, value) => {
  rawLog('Setting shortcut:', key, value)
  const accelerator = deNormalizeAcceleratorFromUI(value)

  unRegisterGlobalShortcuts()

  if (accelerator) {
    store.set(key, accelerator)
  } else {
    store.delete(key)
  }

  registerGlobalShortcuts();
  updateContextMenu()

  if (mainWindow) {
    mainWindow.reload()
  }

  rawLog('Updated store (shortcut): ', store.store)
  return null
});

ipcMain.handle('set_launch_on_login', (_event, value) => {
  rawLog('Setting launch on login:', value)

  app.setLoginItemSettings({ openAtLogin: value });

  store.set('launch_on_login', value)

  rawLog('Updated store: ', store.store)
  return null;
});

function registerGlobalShortcuts() {
  rawLog('REGISTER global shortcuts...')

  const keyApp = store.get('key_binding_show_hide_app')
  safeRegisterGlobalShortcut(keyApp, toggleDrawWindow)
}

function unRegisterGlobalShortcuts() {
  rawLog('UNREGISTER global shortcuts...')

  globalShortcut.unregisterAll();
}

function withThrottle(callback) {
  rawLog('withThrottle called...')

  const now = Date.now();
  if (now < lastShortcutTime + throttleDelay) return;
  lastShortcutTime = now;

  callback();
}

function toggleDrawWindow() {
  withThrottle(() => {
    rawLog('Toggling draw window...')

    if (foregroundMode) {
      hideDrawWindow()
    } else {
      showDrawWindow()
    }
  });
}

function showDrawWindow() {
  rawLog('Showing draw window...')

  if (!mainWindow) {
    rawLog('Main window not found, creating...')
    createMainWindow()
  }

  showWindowOnActiveScreen()

  foregroundMode = true
  updateContextMenu()
}

function hideDrawWindow() {
  if (!mainWindow) return
  if (!mainWindow.isVisible()) return

  rawLog('Hiding draw window...')

  mainWindow.hide()
  foregroundMode = false
  updateContextMenu()
}

function toggleToolbar() {
  withThrottle(() => {
    rawLog('Toggling toolbar...')

    if (mainWindow) {
      mainWindow.webContents.send('toggle_toolbar')
      // Roundtrip request updates store value
    } else {
      store.set('show_tool_bar', !store.get('show_tool_bar'));
      updateContextMenu()
    }
  });
}

function toggleWhiteboard() {
  withThrottle(() => {
    rawLog('Toggling whiteboard...')

    if (mainWindow) {
      mainWindow.webContents.send('toggle_whiteboard')
      // Roundtrip request updates store value
    } else {
      store.set('show_whiteboard', !store.get('show_whiteboard'));
      updateContextMenu()
    }
  });
}

function resetApp() {
  withThrottle(() => {
    rawLog('Resetting app to original settings...')

    unRegisterGlobalShortcuts()

    store.clear()

    registerGlobalShortcuts()

    if (app.getLoginItemSettings().openAtLogin) {
      app.setLoginItemSettings({ openAtLogin: false });
    }

    showDrawWindow()

    if (settingsWindow) {
      settingsWindow.reload()
    }
  })
}

function resetScreen() {
  withThrottle(() => {
    rawLog('Resetting screen...')

    if (mainWindow) {
      mainWindow.webContents.send('reset_screen');
    }
  });
}

function quitApp() {
  withThrottle(() => {
    rawLog('Quitting app...')

    app.quit();
  });
}

function showWindowOnActiveScreen() {
  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

  if (store.get('active_monitor_id') === currentDisplay.id) {
    mainWindow.show()
    return
  }

  mainWindow.setBounds(currentDisplay.workArea)

  if (isDevelopment) {
    mainWindow.setBounds({
      width: 500,
      height: 500
    })
  }

  store.set('active_monitor_id', currentDisplay.id)
  store.reset('tool_bar_x')
  store.reset('tool_bar_y')
  mainWindow.reload()
}

function normalizeAcceleratorForUI(value) {
  if (!value) return value;

  const target = (isMac) ? 'Meta' : 'Control';
  return value.replace('CmdOrCtrl', target);
}

function deNormalizeAcceleratorFromUI(value) {
  if (!value) return value;

  const target = (isMac) ? 'Meta' : 'Control';
  return value.replace(target, 'CmdOrCtrl');
}

function shouldUpdateMenu(newSettings) {
  function valueChanged(key) {
    return (key in store.store) &&
           (key in newSettings) &&
           store.store[key] !== newSettings[key]
  }

  if (valueChanged('show_whiteboard') || valueChanged('show_tool_bar')) {
    return true;
  }

  return false;
}

function safeRegisterGlobalShortcut(accelerator, callback) {
  if (!accelerator || accelerator === KEY_NULL) {
    return
  }

  try {
    if (globalShortcut.isRegistered(accelerator)) {
      rawLog('Global shortcut already registered:', accelerator);
      return
    }

    const success = globalShortcut.register(accelerator, callback);
    if (!success) {
      rawLog('Failed to register global shortcut:', accelerator);
    }
  } catch (error) {
    rawLog('Error registering global shortcut:', accelerator, error);
  }
}

function rawLog(message, ...args) {
  if (!isDevelopment) { return }

  console.log(message, ...args);
}
