# Fullscreen overlay manual QA

Use a packaged macOS build and a native fullscreen Safari window, then repeat with Keynote. Exercise both toolbar controls and global shortcuts.

- Activate drawing from pointer mode and from hidden mode. Confirm the current fullscreen Space stays visible, the canvas and toolbar appear above the app, drawing works, and text can be entered and edited.
- Switch to pointer mode; confirm the toolbar remains usable and clicks reach the underlying app outside it. Repeat draw, pointer and hide/show transitions, including after opening and closing Settings and About.
- Move between fullscreen and desktop Spaces while drawing and in pointer mode. Confirm the overlay follows the current Space without pulling the user away from it.
- Capture a screenshot and use zoom; confirm their content and alignment match the visible canvas.
- Test automatic and fixed monitor selection with displays at negative and positive offsets, and disconnect the selected display. Confirm toolbar positions and drawing still align after reconnecting or falling back.
- Check fullscreen and normal desktop windows on Windows and Linux for unchanged drawing, pointer, toolbar, shortcut and hide/show behavior.

The canvas still uses the display work area, so it does not cover areas reserved for the macOS menu bar and Dock even when a fullscreen app occupies the whole screen. Drawing remains limited to one selected display at a time.
