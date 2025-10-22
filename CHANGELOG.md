# Change Log


// Провертіть клавіши на Linux / Windows
// Проверіть второй запуск додатку


### Feateres:
- Додаток тепер автоматіческі створює іконки в Windows
- Додаток може додавати Auto-launch
- Додав Settings Page (можливість вмикати/вимикати/змінювати HotKeys, Auto-launch)

### Bug Fixes:
- Fix app stuck on Tray mode key activation
- Убрал Акселератори трея для Linux
- Fix second App launch issue

### Improvments:
- Стартовать Draw Screen на старте пріложенія
- Упростіл Меню Трея
- Предотвратіл стіраніе данних прі закритіі додатка






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
