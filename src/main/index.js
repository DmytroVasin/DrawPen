import { app, Tray, Menu, BrowserWindow, screen, globalShortcut, shell, ipcMain } from 'electron';
import { installExtension, REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';
import { updateElectronApp } from 'update-electron-app';
import Store from 'electron-store';
import path from 'path';

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
};

// app.getPath('userData') + '/config.json'
const store = new Store({
  schema
});

console.log('Current store: ', store.store)

let tray
let mainWindow
let aboutWindow

let foregroundMode = false

if (process.env.NODE_ENV === 'development') {
  foregroundMode = true
}

let showWhiteboard = store.get('show_whiteboard')
let showToolbar = store.get('show_tool_bar')

const iconSrc = {
  DEFAULT: path.resolve(__dirname, '../renderer/assets/trayIcon.png'),
  darwin: path.resolve(__dirname, '../renderer/assets/trayIconTemplate@2x.png'),
}

const trayIcon = iconSrc[process.platform] || iconSrc.DEFAULT

const KEY_SHOW_HIDE_APP = 'CmdOrCtrl+Shift+A'
const KEY_SHOW_HIDE_TOOLBAR = 'CmdOrCtrl+T'
const KEY_SHOW_HIDE_WHITEBOARD = 'CmdOrCtrl+W'
const KEY_CLEAR_DESK = 'CmdOrCtrl+C'
const KEY_UNDO = 'CmdOrCtrl+Z'
const KEY_Q = 'CmdOrCtrl+Q'

function updateContextMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: foregroundMode ? 'Hide DrawPen' : 'Show DrawPen',
      accelerator: KEY_SHOW_HIDE_APP,
      click: () => {
        toggleWindow();
      }
    },
    {
      label: showToolbar ? 'Hide Toolbar' : 'Show Toolbar',
      accelerator: KEY_SHOW_HIDE_TOOLBAR,
      click: () => {
        toggleToolbar()
      }
    },
    {
      label: showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard',
      accelerator: KEY_SHOW_HIDE_WHITEBOARD,
      click: () => {
        toggleWhiteboard()
      }
    },
    { type: 'separator' },
    {
      label: 'Clear desk',
      accelerator: KEY_CLEAR_DESK,
      click: () => {
        resetScreen()
      }
    },
    {
      label: 'Undo',
      accelerator: KEY_UNDO,
      click: () => {
        callUndo()
      }
    },
    { type: 'separator' },
    {
      label: 'Reset to original',
      click: () => {
        store.clear()
        mainWindow.reload()
      }
    },
    { type: 'separator' },
    {
      label: 'About DrawPen',
      click: () => {
        if (aboutWindow) {
          aboutWindow.focus();
        } else {
          createAboutWindow()
        }
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

function getActiveMonitor() {
  const activeMonitorId = store.get('active_monitor_id')

  screen.getAllDisplays().forEach((display) => {
    if (display.id === activeMonitorId) {
      return display
    }
  })

  const primaryDisplay = screen.getPrimaryDisplay()
  store.set('active_monitor_id', primaryDisplay.id)

  return primaryDisplay
}

function createMainWindow() {
  const mainDisplay = getActiveMonitor()

  let { width, height } = mainDisplay.workAreaSize
  let isResizable = false

  if (process.env.NODE_ENV === 'development') {
    width = 500
    height = 500
    isResizable = true
  }

  mainWindow = new BrowserWindow({
    show: false,
    x: 0,
    y: 0,
    width: width,
    height: height,
    transparent: true,
    resizable: isResizable,
    focusable: !(process.platform === "win32"),
    skipTaskbar: true,
    hasShadow: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      preload: APP_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  })

  mainWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('closed', function () {
    mainWindow = null;
  })

  mainWindow.on('focus', () => {
    registerShortcats()
  })

  // NOTE: the same as hide
  mainWindow.on('blur', () => {
    unregisterShortcats()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    if (foregroundMode) {
      showWindowOnActiveScreen();
    }
  })
}

function createAboutWindow() {
  const currentDisplay = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y } = currentDisplay.workArea;

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
}

app.on('ready', () => {
  hideDock()
  createMainWindow()

  tray = new Tray(trayIcon)
  updateContextMenu()

  registerGlobalShortcats()

  updateElectronApp()

  if (process.env.NODE_ENV === 'development') {
    installExtension([REACT_DEVELOPER_TOOLS])
  }
})

app.on('will-quit', () => {
  unregisterShortcats();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

function hideDock() {
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
}

function registerGlobalShortcats() {
  globalShortcut.register(KEY_SHOW_HIDE_APP, () => {
    toggleWindow()
  })
}

function registerShortcats() {
  globalShortcut.register(KEY_SHOW_HIDE_TOOLBAR, () => {
    toggleToolbar()
  })

  globalShortcut.register(KEY_SHOW_HIDE_WHITEBOARD, () => {
    toggleWhiteboard()
  })

  globalShortcut.register(KEY_CLEAR_DESK, () => {
    resetScreen()
  })

  globalShortcut.register(KEY_UNDO, () => {
    callUndo()
  })

  globalShortcut.register(KEY_Q, () => {
    app.quit()
  })
}

function unregisterShortcats() {
  globalShortcut.unregister(KEY_SHOW_HIDE_TOOLBAR)
  globalShortcut.unregister(KEY_SHOW_HIDE_WHITEBOARD)
  globalShortcut.unregister(KEY_CLEAR_DESK)
  globalShortcut.unregister(KEY_UNDO)
  globalShortcut.unregister(KEY_Q)
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
  };
});

ipcMain.handle('set_settings', (_event, newSettings) => {
  console.log('New store: ', newSettings)
  store.set(newSettings)

  return null
});

ipcMain.handle('hide_app', () => {
  hideDrawWindow()

  return null
});

function resetScreen() {
  mainWindow.webContents.send('reset_screen');
}

function callUndo() {
  mainWindow.webContents.send('call_undo');
}

function toggleWindow() {
  if (foregroundMode) {
    hideDrawWindow()
  } else {
    showDrawWindow()
  }
}

function showDrawWindow() {
  showWindowOnActiveScreen()

  foregroundMode = true
  updateContextMenu() // Need to rerender the context menu
}

function hideDrawWindow() {
  resetScreen()

  mainWindow.hide();
  if (process.platform == "darwin") {
    app.hide()
    aboutWindow && aboutWindow.close()
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
