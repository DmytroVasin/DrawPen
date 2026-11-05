const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const source = fs.readFileSync(require('node:path').join(__dirname, '../src/main/index.js'), 'utf8')
const functionSource = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`))
const createWindows = functionSource('createMainWindow', 'showAboutWindow')
const releaseFocus = functionSource('releaseFocusBack', 'storeToolbarPositionFromExtendedWindow')
const showMain = functionSource('showMainWindow', 'updateMainWindowPosition')

for (const [isMac, isDevelopment] of [[true, true], [true, false], [false, true], [false, false]]) {
  const windows = []
  let active = false
  let hidden = 0
  let restored = 0
  let shown = 0
  class BrowserWindow {
    constructor(options) {
      this.options = options
      this.webContents = { on() {}, once() {}, setVisualZoomLevelLimits() {} }
      windows.push(this)
    }
    loadURL() {}
    setVisibleOnAllWorkspaces(...args) { this.workspaces = args }
    setAlwaysOnTop(...args) { this.onTop = args }
    on() {}
  }
  const display = { id: 1, workArea: { x: -500, y: 30, width: 500, height: 400 } }
  const context = vm.createContext({
    BrowserWindow, isMac, isDevelopment,
    getLockedMonitor: () => display, getActiveMonitor: () => display,
    getUnderCursorMonitor: () => display, getExtendedToolbarWindowSize: () => ({ width: 100, height: 50 }),
    store: { get: () => 1, set() {} }, rawLog() {},
    APP_WINDOW_PRELOAD_WEBPACK_ENTRY: '', APP_WINDOW_WEBPACK_ENTRY: '',
    EXTENDED_TOOLBAR_WINDOW_PRELOAD_WEBPACK_ENTRY: '', EXTENDED_TOOLBAR_WINDOW_WEBPACK_ENTRY: '',
    settingsWindow: null, aboutWindow: null,
    app: { isActive: () => active, hide: () => hidden++, isHidden: () => true, show: () => restored++ },
    getUnderToolbarMonitor: () => display, updateMainWindowPosition() {}, showWindow: () => shown++,
  })
  vm.runInContext(`${createWindows}\n${releaseFocus}\n${showMain}\ncreateMainWindow(); createExtendedToolbarWindow()`, context)
  for (const window of windows) {
    assert.equal(window.options.type, isMac ? 'panel' : undefined)
    assert.equal(window.workspaces[0], true)
    assert.equal(window.workspaces[1].visibleOnFullScreen, true)
    assert.deepEqual(window.onTop, [true])
  }
  assert.equal(windows.length, 2)
  assert.equal(windows[0].options.x, display.workArea.x)
  assert.equal(windows[0].options.height, isDevelopment ? 500 : display.workArea.height)
  vm.runInContext('showMainWindow()', context)
  assert.equal(restored, isMac ? 1 : 0)
  assert.equal(shown, 1)
  vm.runInContext('releaseFocusBack()', context)
  assert.equal(hidden, 0)
  active = true
  vm.runInContext('releaseFocusBack()', context)
  assert.equal(hidden, isMac ? 1 : 0)
  let focused = 0
  context.settingsWindow = { focus: () => focused++ }
  context.aboutWindow = { focus: () => focused++ }
  vm.runInContext('releaseFocusBack()', context)
  context.settingsWindow = null
  vm.runInContext('releaseFocusBack()', context)
  assert.equal(focused, isMac ? 2 : 0)
  assert.equal(hidden, isMac ? 1 : 0)
}
