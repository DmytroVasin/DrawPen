import { app, Tray, Menu, BrowserWindow, screen, globalShortcut } from 'electron';
import path from 'path';

let tray
let mainWindow
let aboutWindow

let isActive = true
let activeIcon = path.resolve('assets/empty_16.png')
let disabledIcon = path.resolve('assets/fill_16.png')


function toggleWindow() {
  if (isActive) {
    tray.setImage(disabledIcon)
    mainWindow.hide()
  } else {
    tray.setImage(activeIcon)
    mainWindow.show()
  }

  isActive = !isActive
  updateContextMenu() // Need to rerender the context menu
}

function updateContextMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isActive ? 'Deactivate' : 'Activate',
      accelerator: 'Space',
      click: () => {
        toggleWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'About',
      click: () => {
        if (aboutWindow) {
          aboutWindow.focus();
        } else {
          // Create the window if it doesn't exist
          aboutWindow = new BrowserWindow({
            width: 250,
            height: 250,
            resizable: false,
            minimizable: false,
            autoHideMenuBar: true,
            webPreferences: {
              nodeIntegration: true
            }
          });

          aboutWindow.loadFile('./src/about.html')

          // Prevent the window from being minimized to the dock
          aboutWindow.on('minimize', (event) => {
            event.preventDefault();
            // aboutWindow.restore();
          });

          // Clear the reference when the window is closed
          aboutWindow.on('closed', () => {
            aboutWindow = null;
          });
        }
      }
    },
    { label: 'Quit', click: () => app.quit() }
  ]);

  tray.setContextMenu(contextMenu);
}

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  console.log('width', width)
  console.log('height', height)

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    // width: width,
    // height: height,
    transparent: true,
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

  // Keep the window on top
  mainWindow.setAlwaysOnTop(true) // , "screen-saver"
  mainWindow.setVisibleOnAllWorkspaces(true)

  // Load the index.html of the app window.
  mainWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow()

  // app.on('activate', () => {
  //   if (BrowserWindow.getAllWindows().length === 0) {
  //     createWindow()
  //   }
  // })

  tray = new Tray(activeIcon);
  updateContextMenu();

  // Register a global shortcut for the 'Space' key
  globalShortcut.register('Space', () => {
    toggleWindow()
  });
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts when quitting the app
  globalShortcut.unregisterAll();
});

app.dock.hide()
