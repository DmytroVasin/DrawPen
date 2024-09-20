import { app, Tray, Menu, BrowserWindow, screen, globalShortcut, shell, ipcMain } from 'electron';
import Store from 'electron-store';
// import { updateElectronApp } from 'update-electron-app';
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
    default: 10
  },
  tool_bar_y: {
    type: 'number',
    default: 10
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
};

// app.getPath('userData') + '/config.json'
const store = new Store({
  schema
});

console.log('My current store: ', store.store)

let tray
let mainWindow
let aboutWindow

let foregroundMode = true
let showWhiteboard = store.get('show_whiteboard')
let showToolbar = store.get('show_tool_bar')

let activeIcon = path.resolve('assets/activeIcon.png')
let disabledIcon = path.resolve('assets/disabledIcon.png')

const KEY_ACTIVATE = 'Shift+S' // TODO: Better to replace with Fn?
const KEY_SHOW_HIDE_APP = 'Shift+A'
const KEY_SHOW_HIDE_TOOLBAR = 'Shift+T'
const KEY_SHOW_HIDE_WHITEBOARD = 'Shift+W'
const KEY_UNDO = 'CmdOrCtrl+Z'

function updateContextMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Hold to Activate...',
      accelerator: KEY_ACTIVATE,
    },
    { type: 'separator' },
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
      label: 'Check for Updates',
      click: () => {
        // "update-electron-app": "^3.0.0",
        // updateElectronApp()
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createMainWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  console.log('width', width)
  console.log('height', height)

  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: 500,
    height: 500,
    // width: width,
    // height: height,
    transparent: true,
    hasShadow: false,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      preload: APP_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: false,
    }
  })

  mainWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);

  mainWindow.setAlwaysOnTop(true);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('closed', function () {
    mainWindow = null;
  })

  registerGlobalShortcats()

  mainWindow.on('focus', () => {
    registerShortcats()
  })

  // NOTE: hide?
  mainWindow.on('blur', () => {
    unregisterShortcats()
  })
}

function createAboutWindow() {
  aboutWindow = new BrowserWindow({
    width: 250,
    height: 250,
    resizable: false,
    minimizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      preload: ABOUT_WINDOW_PRELOAD_WEBPACK_ENTRY,
    }
  })

  aboutWindow.loadURL(ABOUT_WINDOW_WEBPACK_ENTRY)

  // Prevent the window from being minimized to the dock
  aboutWindow.on('minimize', (event) => {
    event.preventDefault()
  })

  // Clear the reference when the window is closed
  aboutWindow.on('closed', () => {
    aboutWindow = null
  })

  // Open URL in user's browser.
  aboutWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);

    return { action: "deny" }; // Prevent the app from opening the URL.
  })
}

app.on('ready', () => {
  app.dock.hide()

  createMainWindow()

  tray = new Tray(activeIcon)
  updateContextMenu()
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

function registerGlobalShortcats() {
  globalShortcut.register(KEY_ACTIVATE, () => {
    showDrawWindow()
  })
}

function registerShortcats() {
  globalShortcut.register(KEY_SHOW_HIDE_APP, () => {
    toggleWindow()
  })

  globalShortcut.register(KEY_SHOW_HIDE_TOOLBAR, () => {
    toggleToolbar()
  })

  globalShortcut.register(KEY_SHOW_HIDE_WHITEBOARD, () => {
    toggleWhiteboard()
  })

  globalShortcut.register(KEY_UNDO, () => {
    callUndo()
  })
}
function unregisterShortcats() {
  globalShortcut.unregister(KEY_SHOW_HIDE_APP)
  globalShortcut.unregister(KEY_SHOW_HIDE_TOOLBAR)
  globalShortcut.unregister(KEY_SHOW_HIDE_WHITEBOARD)
  globalShortcut.unregister(KEY_UNDO)
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

ipcMain.handle('set_settings', (event, newSettings) => {
  console.log('New store: ', newSettings)
  store.set(newSettings)

  return null
});

ipcMain.handle('hide_app', () => {
  hideDrawWindow()
  resetScreen()

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
  mainWindow.show()

  tray.setImage(activeIcon)
  foregroundMode = true
  updateContextMenu() // Need to rerender the context menu
}

function hideDrawWindow() {
  mainWindow.hide()

  tray.setImage(disabledIcon)
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
