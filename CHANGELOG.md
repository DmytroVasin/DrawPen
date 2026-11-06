# Change Log

## [0.0.61] - 2026-11-07
### Features:
- Added a Stamp figure
- Added New Arrow appearance with contrasting outlines and a minimum length
- Added left/up toolbar expansion near screen edges
- Added 'CMD/CTRL+D' to duplicate selected figures
- Added 'CMD/CTRL+X' to cut selected figures
- Added '[' and ']' shortcuts for increase/decrease stroke width and text size
- Added straight-line drawing while holding Shift for Pen and Fade Pen

### Improvements:
- Improved keyboard layout support for canvas and configurable shortcuts
- Improved shortcut recording for special keys and CMD+CTRL combinations
- Improved Rainbow gradients for straight strokes

### Bug Fixes:
- Fixed shortcut conflicts when restoring defaults

## [0.0.60] - 2026-10-18
### Features:
- Added a separate Pen tool with fixed stroke width (removed the "Fixed Stroke Width" setting)
- Added Horizontal and Vertical toolbar orientations in Application Settings
- Added Extra Bold thickness

### Improvements:
- Adjusted Cute Cursor position
- Kept figure toolbar submenus open when changing colors, widths, and styles

### Bug Fixes:
- Fixed Settings layout for long screenshot directory paths

## [0.0.59] - 2026-10-11
### Features:
- Added Zoom Mode (Beta) via the Tray and CMD/CTRL+SHIFT+M

### Improvements:
- Added a flash effect when capturing screenshots
- Added Screenshot and Zoom shortcut hints to the Linux Tray menu

### Bug Fixes:
- Prevented assigning Screenshot and Zoom shortcuts to other actions

## [0.0.58] - 2026-09-26
### Features:
- Added a contextual toolbar for selected figures
- Added a Diamond figure.
- Added resizing by edges (for shapes and text)
- Added dynamic width for text (+ auto-size restoration)
- Added Solid, Dashed, and Dotted stroke styles
- Added Sharp and Rounded edge styles
- Added a "Fixed Stroke Width" setting for Pen and Fade Pen

### Improvements:
- Improved figure hit testing and erasing accuracy (Change formulas)
- Replaced the whiteboard panel toggle with a Settings icon
- Cleared the active figure selection when DrawPen is hidden

### Bug Fixes:
- Fixed toast layout for long file paths.
- Fixed Rainbow color rendering for scaled text.
- Upgraded Electron from 40.4.0 to 44.4.3 to resolve issue [#105](https://github.com/DmytroVasin/DrawPen/issues/105).

## [0.0.57] - 2026-08-25
### Features:
- Add toolbar shortcut hints on CMD/CTRL hold
- Add "Auto-Fade" and "Dot" modes for "Cute Cursor"
- Add configurable screenshot directory (Default changes to "Pictures" folder)

### Improvements:
- Preserve toolbar position when switching between Draw and Pointer modes and when quitting
- Change initial Text tool position

### Bug Fixes:
- Fix shadow rendering for erased arrows

## [0.0.56] - 2026-08-09
### Bug Fixes:
- Restore the system tray icon and context menu on Linux by downgrading Electron from 43.3.0 to 40.4.0

## [0.0.55] - 2026-08-07
### Improvements:
- Add opt-in debug logging for packaged app via `DRAWPEN_DEBUG=1`

### Bug Fixes:
- Update Electron from 43.2.0 to 43.3.0

## [0.0.54] - 2026-07-27
### Features:
- Add configurable toolbar color palette

### Improvements:
- Update Color Swap controls in Settings

### Bug Fixes:
- Prevent drawing shortcuts from activating during hard refresh
- Fix Cute Cursor position after hard refresh
- Fix default color preview in Toolbar

## [0.0.53] - 2026-06-28
### Features:
- Add clear drawings on hide setting

### Improvements:
- Fix auto-update restart flow

## [0.0.52] - 2026-06-07
### Features:
- Add configurable pen stroke smoothing
- Add whiteboard snap resize presets

### Improvements:
- Add cycling snap sizes for whiteboard resize controls

### Bug Fixes:
- Fix color swap shortcut on non-English keyboard layouts

## [0.0.51] - 2026-05-24
### Features:
- Add configurable whiteboard layout and appearance controls

## [0.0.50] - 2026-05-05
### Bug Fixes:
- Add active display reset on monitor hotplug

## [0.0.49] - 2026-05-02
### Bug Fixes:
- Fix macOS focus handoff when leaving draw mode
- Track last pen/arrow picked variant

## [0.0.48] - 2026-04-26
### Features:
- Update toolbar shortcut hints

## [0.0.47] - 2026-04-19
### Features:
- Added Whiteboard Themes and Sizes

## [0.0.46] - 2026-04-11
### Features:
- Added palm touch detection for temporary eraser activation (Touch devices only)

## [0.0.45] - 2026-03-12
### Features:
- Added "Hide Extended Toolbar" option

### Improvements:
- Improved always-on-top behavior

## [0.0.44] - 2026-03-07
### Features:
- Added Pointer Mode (compact floating control that lets users switch into Draw Mode)
- App starts in Pointer Mode
- Added a collapsible toolbar layout for a more compact drawing UI.

## [0.0.43] - 2026-02-20
### Features:
- Added Clear Desk tool to the toolbar.
- Added Flat Arrow.
- Added toolbar hotkeys.
- Added dot handle UX with hover glow.

### Bug Fixes:
- Fixed resize jump offset for dot handles.

### Improvements:
- Improved toolbar interactions and styling.
- Refined old arrow geometry (scaling and smooth rendering).

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
