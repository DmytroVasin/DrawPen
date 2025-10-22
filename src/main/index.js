import { app, Tray, Menu, BrowserWindow, screen, globalShortcut, shell, ipcMain, nativeTheme } from 'electron';
import { updateElectronApp } from 'update-electron-app';
import Store from 'electron-store';
import path, { normalize } from 'path';

const KEY_SHOW_HIDE_APP = 'CmdOrCtrl+Shift+A'
const KEY_SHOW_HIDE_TOOLBAR = 'CmdOrCtrl+T'
const KEY_SHOW_HIDE_WHITEBOARD = 'CmdOrCtrl+W'
const KEY_CLEAR_DESK = 'CmdOrCtrl+K'
const KEY_SETTINGS = 'CmdOrCtrl+,'
const KEY_Q = 'CmdOrCtrl+Q'
const KEY_NULL = '[NULL]'

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
    // default: KEY_SHOW_HIDE_WHITEBOARD
  },
  key_binding_clear_desk: {
    type: 'string',
    // default: KEY_CLEAR_DESK
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

let foregroundMode = false

if (process.env.NODE_ENV === 'development') {
  foregroundMode = true
}

let showWhiteboard = store.get('show_whiteboard')
let showToolbar = store.get('show_tool_bar')

const iconSrc = {
  DEFAULT: path.resolve(__dirname, '../renderer/assets/trayIcon.png'),
  DEFAULT_WHITE: path.resolve(__dirname, '../renderer/assets/trayIconWhite.png'),
  darwin: path.resolve(__dirname, '../renderer/assets/trayIconTemplate@2x.png'),
  linux: path.resolve(__dirname, '../renderer/assets/trayIconWhite.png'),
}

function getTrayIconPath() {
   if (process.platform === 'darwin') return iconSrc.darwin
   if (process.platform === 'linux')  return iconSrc.linux
   if (process.platform === 'win32')  return nativeTheme.shouldUseDarkColors ? iconSrc.DEFAULT_WHITE : iconSrc.DEFAULT

   return iconSrc.DEFAULT
}

function updateContextMenu() {
  const key_show_hide_app        = store.get('key_binding_show_hide_app')
  const key_show_hide_toolbar    = store.get('key_binding_show_hide_toolbar')
  const key_show_hide_whiteboard = store.get('key_binding_show_hide_whiteboard')
  const key_clear_desk           = store.get('key_binding_clear_desk')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: foregroundMode ? 'Hide DrawPen' : 'Show DrawPen',
      accelerator: key_show_hide_app,
      click: () => {
        toggleWindow();
      }
    },
    {
      label: showToolbar ? 'Hide Toolbar' : 'Show Toolbar',
      accelerator: key_show_hide_toolbar,
      click: () => {
        toggleToolbar()
      }
    },
    {
      label: showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard',
      accelerator: key_show_hide_whiteboard,
      click: () => {
        toggleWhiteboard()
      }
    },
    { type: 'separator' },
    {
      label: 'Clear desk',
      accelerator: key_clear_desk,
      click: () => {
        resetScreen()
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      accelerator: KEY_SETTINGS,
      click: () => {
        createSettingsWindow()
      }
    },
    { type: 'separator' },
    {
      label: 'Reset to original',
      click: () => {
        resetApp();
      }
    },
    { type: 'separator' },
    {
      label: 'About DrawPen',
      click: () => {
        createAboutWindow();
      }
    },
    {
      label: 'Quit',
      accelerator: KEY_Q,
      click: () => {
        app.quit()
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function registerTrayIconUpdate() {
  nativeTheme.on('updated', () => {
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

  if (process.env.NODE_ENV === 'development') {
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
    webPreferences: {
      devTools: hasDevTools,
      nodeIntegration: false,
      preload: APP_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  })

  mainWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('closed', function () {
    console.log('Main window lost focus, hiding...222')
    mainWindow = null;

    hideDrawWindow();
  })

  mainWindow.on('focus', () => {
    registerShortcuts('local');
  })

  // NOTE: the same as hide
  mainWindow.on('blur', () => {
    console.log('Main window lost focus, hiding...')
    unRegisterShortcuts('local');
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

function createAboutWindow() {
  hideDrawWindow()

  if (aboutWindow) {
    aboutWindow.focus();
    return;
  }

  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y } = currentDisplay.workArea;
  let hasDevTools = false

  if (process.env.NODE_ENV === 'development') {
    hasDevTools = true
  }

  aboutWindow = new BrowserWindow({
    show: false,
    x: x,
    y: y,
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

  // Prevent the window from being minimized to the dock
  aboutWindow.on('minimize', (event) => {
    event.preventDefault()
  })

  // Clear the reference when the window is closed
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

function createSettingsWindow() {
  hideDrawWindow()

  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y } = currentDisplay.workArea;
  let hasDevTools = false

  if (process.env.NODE_ENV === 'development') {
    hasDevTools = true
  }

  settingsWindow = new BrowserWindow({
    show: false,
    x: x,
    y: y,
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

  // Prevent the window from being minimized to the dock
  settingsWindow.on('minimize', (event) => {
    event.preventDefault()
  })

  // Clear the reference when the window is closed
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

app.commandLine.appendSwitch('disable-pinch');
app.on('ready', () => {
  hideDock()
  createMainWindow()

  tray = new Tray(getTrayIconPath())
  updateContextMenu()
  registerTrayIconUpdate()

  registerShortcuts('global');

  updateElectronApp()
})

app.on('will-quit', () => {
  unRegisterShortcuts('all');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function hideDock() {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
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
  };
});

ipcMain.handle('set_settings', (_event, newSettings) => {
  const mergedSettings = { ...store.store, ...newSettings }

  console.log('New store: ', mergedSettings)
  store.set(mergedSettings)

  return null
});

ipcMain.handle('hide_app', () => {
  hideDrawWindow()

  return null
});

ipcMain.handle('reset_to_originals', () => {
  console.log('ACTION: reset_to_originals');

  resetApp();
  return null
});

ipcMain.handle('get_configuration', () => {
  console.log('ACTION: get_configuration');
  return {
    launch_on_login:                          store.get('launch_on_login'),

    key_binding_show_hide_app:                normalizeAccelerator(store.get('key_binding_show_hide_app')),
    key_binding_show_hide_app_default:        normalizeAccelerator(schema.key_binding_show_hide_app.default),

    key_binding_show_hide_toolbar:            normalizeAccelerator(store.get('key_binding_show_hide_toolbar')),
    key_binding_show_hide_toolbar_default:    normalizeAccelerator(schema.key_binding_show_hide_toolbar.default),

    key_binding_show_hide_whiteboard:         normalizeAccelerator(store.get('key_binding_show_hide_whiteboard')),
    key_binding_show_hide_whiteboard_default: normalizeAccelerator(schema.key_binding_show_hide_whiteboard.default),

    key_binding_clear_desk:                   normalizeAccelerator(store.get('key_binding_clear_desk')),
    key_binding_clear_desk_default:           normalizeAccelerator(schema.key_binding_clear_desk.default),
  };
});

ipcMain.handle('can_register_shortcut', async (_event, value) => {
  console.log('ACTION: can_register_shortcut', value);

  const accelerator = deNormalizeAccelerator(value)

  const shortcutsInUse = [
    store.get('key_binding_show_hide_app'),
    store.get('key_binding_show_hide_toolbar'),
    store.get('key_binding_show_hide_whiteboard'),
    store.get('key_binding_clear_desk'),
  ].filter(s => s && s !== KEY_NULL)

  if (shortcutsInUse.includes(accelerator)) {
    console.log('Conflict inside app:', accelerator);
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
  console.log('ACTION: set_shortcut', key, value);
  const accelerator = deNormalizeAccelerator(value)

  unRegisterShortcuts('global');

  if (accelerator) {
    store.set(key, accelerator)
  } else {
    store.delete(key)
  }

  registerShortcuts('global');
  updateContextMenu()

  console.log('Updated store: ', store.store)
  return null
});

ipcMain.handle('set_launch_on_login', (_event, value) => {
  console.log('ACTION: set_launch_on_login');
  app.setLoginItemSettings({ openAtLogin: value });

  store.set('launch_on_login', value)

  console.log('Updated store: ', store.store)
  return null;
});

function registerShortcuts(mode) { // global, local, all
  const keyApp        = store.get('key_binding_show_hide_app');
  const keyToolbar    = store.get('key_binding_show_hide_toolbar');
  const keyWhiteboard = store.get('key_binding_show_hide_whiteboard');
  const keyClearDesk  = store.get('key_binding_clear_desk');

  if (mode === 'global' || mode === 'all') {
    if (keyApp && keyApp !== KEY_NULL) {
      globalShortcut.register(keyApp, toggleWindow);
    }
  }

  if (mode === 'local' || mode === 'all') {
    if (keyToolbar && keyToolbar !== KEY_NULL) {
      globalShortcut.register(keyToolbar, toggleToolbar);
    }

    if (keyWhiteboard && keyWhiteboard !== KEY_NULL) {
      globalShortcut.register(keyWhiteboard, toggleWhiteboard);
    }

    if (keyClearDesk && keyClearDesk !== KEY_NULL) {
      globalShortcut.register(keyClearDesk, resetScreen);
    }

    if (KEY_SETTINGS) {
      globalShortcut.register(KEY_SETTINGS, () => createSettingsWindow());
    }

    if (KEY_Q) {
      globalShortcut.register(KEY_Q, () => app.quit());
    }
  }
}

function unRegisterShortcuts(mode) { // global, local, all
  const shortcuts = [];

  const globalShortcuts = [store.get('key_binding_show_hide_app')];
  const localShortcuts = [
    store.get('key_binding_show_hide_toolbar'),
    store.get('key_binding_show_hide_whiteboard'),
    store.get('key_binding_clear_desk'),
    KEY_SETTINGS,
    KEY_Q,
  ];

  if (mode === 'global' || mode === 'all') {
    shortcuts.push(...globalShortcuts);
  }

  if (mode === 'local' || mode === 'all') {
    shortcuts.push(...localShortcuts);
  }

  shortcuts
    .filter(s => s && s !== KEY_NULL)
    .forEach(accelerator => globalShortcut.unregister(accelerator));
}

function resetScreen() {
  mainWindow.webContents.send('reset_screen');
}

function toggleWindow() {
  if (foregroundMode) {
    hideDrawWindow()
  } else {
    showDrawWindow()
  }
}

function showDrawWindow() {
  console.log('showDrawWindow....')

  if (!mainWindow) {
    console.log('showDrawWindow.... CREATE WINDWO')
    createMainWindow()
  }

  showWindowOnActiveScreen()

  foregroundMode = true
  updateContextMenu() // Need to rerender the context menu
}

function hideDrawWindow() {
  console.log('Hiding draw window...')

  if (mainWindow) {
    resetScreen()

    mainWindow.hide()
  }

  foregroundMode = false
  updateContextMenu() // Need to rerender the context menu
}

function toggleToolbar() {
  if (!foregroundMode) {
    showDrawWindow()
  }

  showToolbar = !showToolbar

  mainWindow.webContents.send('toggle_toolbar')
  updateContextMenu() // Need to rerender the context menu
}

function toggleWhiteboard() {
  if (!foregroundMode) {
    showDrawWindow()
  }

  showWhiteboard = !showWhiteboard

  mainWindow.webContents.send('toggle_whiteboard')
  updateContextMenu() // Need to rerender the context menu
}

function showWindowOnActiveScreen() {
  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

  if (store.get('active_monitor_id') === currentDisplay.id) {
    mainWindow.show()
    return
  }

  mainWindow.setBounds(currentDisplay.workArea)

  if (process.env.NODE_ENV === 'development') {
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

function normalizeAccelerator(value) {
  if (!value) return value;

  const target = process.platform === 'darwin' ? 'Meta' : 'Control';
  return value.replace('CmdOrCtrl', target);
}

function deNormalizeAccelerator(value) {
  if (!value) return value;

  const source = process.platform === 'darwin' ? 'Meta' : 'Control';
  return value.replace(source, 'CmdOrCtrl');
}

function resetApp() {
  unRegisterShortcuts('all');

  store.clear()

  registerShortcuts('all');

  if (app.getLoginItemSettings().openAtLogin) {
    app.setLoginItemSettings({ openAtLogin: false });
  }

  if (mainWindow) {
    mainWindow.reload()
  }

  if (settingsWindow) {
    settingsWindow.reload()
  }
}
