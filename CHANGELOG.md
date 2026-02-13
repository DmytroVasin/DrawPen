# Change Log

## [0.0.41] - 2026-02-13
- Added `drawpen-x11` package for Linux users with Wayland
- Removed Opt-in workaround FORCE_X11 infavor of using `drawpen-x11` package for Linux users with Wayland

## [0.0.40] - 2026-02-12
- Update Electron to 40.4.0
- Update Icons for Linux (512px)
- Added Opt-in workaround: when FORCE_X11 is set, force X11 backend

## [0.0.40] - 2026-02-05
### Features:
- Added Auto-fade system (Fade/Persist mode).
- Added settings to control the delay before fading starts.
- Added settings to adjust the fade-out duration.
- Fade pause: press SPACE to temporarily pause the fade timer and keep annotations visible longer.
- Improved Rainbow Highlighter: the Highlighter tool now supports a full rainbow gradient.

### Bug Fixes:
- Fixed rendering of erased segments when using the Rainbow Highlighter.

### Improvements:
- Moved the App Icon Color selector to the Application section in Settings.
- Laser Duration now displays values in seconds in Settings for better clarity.

## [0.0.39] - 2026-01-29
### Features:
- Updated Settings panel
- New option: Start hidden on launch
- New option: Set laser duration

## [0.0.38] - 2026-01-25
### Features:
- Enable Eraser on Stylus eraser press or Mouse wheel
- Added new Hot Key - 'e' for Eraser
- Add processing of "Shift + NUM" for Shape/Color/Width change

### Bug Fixes:
- Improved arrow detection

## [0.0.37] - 2026-01-14
### Bug Fixes:
- Fix bug with Canvas initial dimensions

## [0.0.36] - 2026-01-02
### Features:
- Settings to Lock drawing monitor
- Changed Mouse Events to Pointer Events (Touch stylus support)
- Activate app via left click on Win/Linux

## [0.0.35] - 2025-12-25
### Features:
- Added Capture Screen tool (Beta)
- Enable smoothing for Pen tool (based on pen width)

### Bug Fixes:
- Disable touch gestures on canvas to fix stylus drag

## [0.0.34] - 2025-12-14
### Features:
- Added color switching via X key
- Added option to disable Cute Cursor

### Bug Fixes:
- Fixed settings switching without requiring a reload

## [0.0.33] - 2025-12-05
- Added White color
- Added Thin thickness
- Disabled smoothing for Pen tool

## [0.0.32] - 2025-11-19
- Ability to pick Icon color (For Windows Tray)
- Show/Hide Drawing Border
- Start as hidden on boot launch (Windows, macOS)

## [0.0.31] - 2025-11-15
- Fix transparency rendering artifacts

## [0.0.30] - 2025-11-11
- Double tap on ESC should hide an app

## [0.0.29] - 2025-11-02
### Features:
- App now automatically creates icons (Windows)
- Added Auto-launch support (macOS, Windows)
- Added Settings Page (ability to enable/disable/change HotKeys and Auto-launch)

### Bug Fixes:
- Fixed app freeze when activating via Tray shortcut
- Removed Tray accelerators for Linux
- Fixed issue with second app launch

### Improvements:
- Launch Draw Screen on application startup
- Simplified Tray Menu
- Prevented data loss on application hide/show

## [0.0.28] - 2025-10-22
- Add fallback for transparent background in the main window

## [0.0.27] - 2025-10-11
### Features:
- Press Shift Detection (Works with Line, Arrow, Rectangle, Circle)
- Speed Up Figure movements on Shift press
- Ability to drag the active figure

### Bug Fixes:
- Fix eraser bug that misses the last edge of the rectangle

## [0.0.26] - 2025-10-06
- Update Electron due to productivity issue

## [0.0.25] - 2025-10-04
### Features:
- Tool: Highlighter
- Tool: Eraser
- UNDO Improved (CTRL+Z) / REDO Added (CTRL+SHIFT+Z)
- Implemented CTRL+C / CTRL+V

### Bug Fixes:
- Figure selection / hover when using the Laser Tool
- Zoom In/Out on the About page
- Font size compensation for non-Retina displays
- Fix bug with Active Monitor selection

## [0.0.24] - 2025-09-21
- Add ability to make Redo via CTRL+SHIFT+Z
- Disable DevTools for Package build

## [0.0.23] - 2025-06-13
- Added white logo for Linux

## [0.0.22] - 2025-05-25
### Features:
- Add Text Editor

### Bug Fixes:
- Keep ripple above all elements
- Fix issue when onMove we put Cursor over toolbar
- Fix Oval pick detection
- Fix Mouse detection (crosshair) above Oval Resize buttons
- Fix TabIndex (When Tab ruins markup)

### Improvments:
- Remove "Undo" from global events
- Clear Desk moved to "CRTL+K"
- Move figures by Arrow keys
- Add escape to unselect active figure
- Add "CRTL+Z" to undo last action
- Add "Delete/Backspace" to delete selected figure

### Infrastructure:
- Update Electron (Remove deprecation warnings)

## [0.0.21] - 2025-05-02
- Remove small dot after laser ripple effect

## [0.0.20] - 2025-04-29
- Cancel subview selection by pressing the ESC key

## [0.0.19] - 2025-04-23
- App gives focus back to prev. window (MacOs only)

## [0.0.18] - 2025-04-20
- Crispy drawings, support for High DPI displays

## [0.0.17] - 2025-04-17
- Removed Ripple effect on click from Pen and Shapes (keep it only on Laser)
- Fix bug with close point detection in "filter close points"

## [0.0.16] - 2025-04-10
- Added Ripple effect on click

## [0.0.15] - 2025-04-02
- Chnaged hotkeys From CMD+1/2/3 to 1/2/3 to activate Pen/Shapes/Laser
- Added hotkeys 4/5 to switch Color and Thickness
- Fixed bug with app crash on Clear Desk / Undo action

## [0.0.14] - 2025-03-16
- Added hotkeys CMD+1/2/3 to activate Pen/Shapes/Laser

## [0.0.13] - 2024-11-22
- AutoUpdater Setup / Check

## [0.0.1] - 2024-09-01
- Initial release.
