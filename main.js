const { app, Tray, Menu, nativeImage, BrowserWindow, screen, globalShortcut } = require('electron/main')
const path = require('node:path')

let tray
let mainWindow
let aboutWindow

let isActive = true
let activeIcon = path.join(__dirname, 'empty_16.png')
let disabledIcon = path.join(__dirname, 'fill_16.png')


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
            width: 200,
            height: 200,
            resizable: false,
            minimizable: false,
            webPreferences: {
              nodeIntegration: true
            }
          });

          aboutWindow.loadFile('about.html')

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
    width: width,
    height: height,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Keep the window on top
  mainWindow.setAlwaysOnTop(true) // , "screen-saver"
  mainWindow.setVisibleOnAllWorkspaces(true)

  mainWindow.loadFile('index.html')
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
