# EPIC: Touch auto-tool (touchscreen → auto draw mode)

Parallel feature to the **stylus auto-tool** (`docs/epics/stylus-auto-tool.md`). When the user
touches a touchscreen, DrawPen auto-enters draw mode with a configured tool; moving the **mouse**
reverts to pointer mode after the (shared) grace delay. Windows-first; the architecture leaves the
no-op backend for macOS/Linux untouched.

> This feature is intentionally a thin delta on top of the stylus subsystem. ~90% of the plumbing
> (Raw Input window, `force_tool` IPC, mouse-revert coordinator, touch drawing in the canvas)
> already exists. Read the stylus EPIC first.

## What already works (do not rebuild)

- **Raw Input window** in `src/main/stylus/windowsStylusWatcher.js` — message-only window + WndProc,
  `RIDEV_INPUTSINK` so input arrives with no focus. Non-blocking: other apps still receive the input.
- **Touch drawing in the canvas** — `DrawDesk.js` already draws on `event.pointerType === 'touch'`
  and maps a palm to the eraser (`palmMinContactLength`/`palmMinContactArea`). The overlay has
  `touch-action: none`. **No renderer drawing changes are needed.**
- **`force_tool` IPC** — `onPenActivity` already sends `mainWindow.webContents.send('force_tool', tool)`.
- **Mouse-revert coordinator** — `onMouseActivity` + `stylusRevertTimer` + `autoStylusActive`.

## Design decisions (locked)

1. **Disambiguation (the only new hard part).** Pen *and* touch both arrive as `RIM_TYPEHID`, so
   `dwType` is no longer sufficient. Classify by **source device**: read `hDevice` from the
   `RAWINPUTHEADER` (offset 8, pointer-sized) and call
   `GetRawInputDeviceInfoW(hDevice, RIDI_DEVICEINFO, &RID_DEVICE_INFO, &cbSize)`, reading
   `RID_DEVICE_INFO_HID.usUsage` (x64 struct offset **22**: cbSize@0, dwType@4, then the HID union
  at @8 → dwVendorId@8, dwProductId@12, dwVersionNumber@16, usUsagePage@20, usUsage@22):
   - `0x04` (Touch Screen) → **touch**
   - `0x02` (Pen) / `0x01` (generic Digitizer, e.g. XPPen) → **pen** (preserves current behavior)
   Cache the classification in a `Map<hDevice, 'pen'|'touch'>` — one syscall per *device*, not per event.
2. **Register touch screen only** (`0x0D / 0x04`). Do **not** register touch pad (`0x0D / 0x05`) — that
   is the laptop trackpad; finger-on-trackpad must not trigger draw mode. Total registered classes: 4
   (digitizer `0x01`, pen `0x02`, touch `0x04`, mouse `0x01/0x02`).
3. **Shared revert delay.** Touch reuses the existing `stylus_revert_grace_ms` (the user said the revert
   "behavior is shared with the stylus"). The setting is relabeled generically ("Mouse recovery delay",
   already worded that way). No new delay setting.
4. **One new persisted setting:** `touch_tool` (string, default `'none'`). No touch-eraser setting —
   touch has no eraser end and palm→eraser is already handled in the renderer.
5. **Revert trigger is mouse only** (parallel to pen): a finger lift does **not** revert; continuous
   touch reports keep the auto session alive via the existing hysteresis. Only mouse movement reverts.
6. **Watcher starts** when `stylus_tool !== 'none'` **OR** `touch_tool !== 'none'`.

### Known limitation (document, do not fix in v1)

A *combined* pen+touch digitizer that reports everything under generic usage `0x0D/0x01` will have its
touch classified as pen. Separate touch monitors / Surface-class panels report `0x0D/0x04` and work
correctly. Robust separation would require parsing the HID report (HidP), out of scope for v1.

## Shared contract (the seam between work packages)

The watcher gains a third handler. **`createStylusWatcher` / `createWindowsStylusWatcher` signature:**

```js
createStylusWatcher({
  onPenActivity({ contact }),   // existing — pen/digitizer device
  onTouchActivity({ contact }), // NEW — touch-screen device (contact currently always false)
  onMouseActivity(),            // existing — genuine mouse, the revert signal
})
```

`onTouchActivity` mirrors `onPenActivity`: throttled ~60/s, cancels a pending mouse-revert, defers via
`setImmediate`. The null backend is unchanged (still `{ isSupported:false, start(){}, stop(){} }`).

---

## Work packages

### WP-A — Watcher: touch classification (`src/main/stylus/windowsStylusWatcher.js`)

- Add FFI: `GetRawInputDeviceInfoW(intptr_t hDevice, uint32 cmd, void* data, uint32* size)` and the
  `RIDI_DEVICEINFO = 0x2000000b` constant. Define `RID_DEVICE_INFO` big enough to hold the HID union
  (cbSize, dwType, then the largest member; reading `usUsagePage`/`usUsage` at the HID-member offsets is
  sufficient — allocate a 32-byte buffer and read `usUsage` for the HID branch).
- Add touch usage constants `HID_USAGE_DIGITIZER_TOUCH_SCREEN = 0x04`; bump `RAWINPUT_DEVICE_COUNT` to 4
  and add the touch entry to `buildRawInputDevices` (page `0x0D`, usage `0x04`).
- In `wndProc`, for `dwType === RIM_TYPEHID`: read `hDevice = headerBuf.readBigUInt64LE(8)`, look it up in
  a `deviceKind` Map; on miss, call `GetRawInputDeviceInfoW(..., RIDI_DEVICEINFO, ...)`, read `usUsage`,
  classify (`0x04`→`'touch'`, else `'pen'`), and cache. Route to `emitTouch()` or `emitPen()`.
- Add `emitTouch()` mirroring `emitPen()` (own throttle timestamp `lastTouchEmit`; share the
  mouse-hysteresis cancellation logic — touch activity must also win over a pending mouse revert, so set
  `lastPenActivityTime = now` semantics; consider renaming that to `lastAutoActivityTime` for clarity).
- Wire `onTouchActivity` from `handlers`. Update the file header comment (it currently says touch is
  deliberately *not* registered — update to reflect the new touch-screen registration + device-info
  classification). Keep all logging behind the existing `isDevelopment` `log()`.

### WP-B — Main coordinator + settings plumbing (`src/main/index.js`)

- **Constants (top, ~line 31):** add `TOUCH_TOOL_VALUES` (same list as `STYLUS_TOOL_VALUES`).
- **Schema (~line 187):** add `touch_tool: { type: 'string', default: 'none' }`.
- **`get_configuration` (~line 733) and `get_settings` (~line 840):** add `touch_tool: store.get('touch_tool')`.
- **`set_touch_tool` handler (mirror `set_stylus_tool`, ~line 1025):** validate against `TOUCH_TOOL_VALUES`
  (fallback `'none'`), `store.set`, then `reconfigureStylusWatcher()`.
- **Coordinator (~line 1151):** add `onTouchActivity({ contact })` mirroring `onPenActivity` but reading
  `touch_tool` instead of `stylus_tool`. Both use the same `autoStylusActive`/`penContact` session state
  and the same `force_tool` send. (Touch sets `penContact = contact` too, so the shared revert guard works.)
- **`reconfigureStylusWatcher` (~line 1194):** gate on `store.get('stylus_tool') !== 'none' || store.get('touch_tool') !== 'none'`,
  and pass `onTouchActivity` into `createStylusWatcher({ onPenActivity, onTouchActivity, onMouseActivity })`.

### WP-C — Renderer settings UI (`constants.js`, `settings_page/preload.js`, `Settings.js`)

- **`app_page/components/constants.js`:** add `TOUCH_TOOL_OPTIONS` (identical to `STYLUS_TOOL_OPTIONS`).
- **`settings_page/preload.js`:** add `setTouchTool: (value) => ipcRenderer.invoke('set_touch_tool', value)`.
- **`settings_page/components/Settings.js`:** in the existing **Stylus** tab, add a "Tool on touch"
  dropdown below the stylus controls (or rename the tab "Stylus & Touch"). State
  `touchTool`/`setTouchTool` seeded from `config.touch_tool || 'none'`; `selectTouchTool` calls
  `window.electronAPI.setTouchTool(value)`. Map over `TOUCH_TOOL_OPTIONS`. Match the existing markup/SCSS
  classes exactly. Description e.g. "Touch the screen to auto-activate this tool; move the mouse to switch back."

## Verification (manual — no test suite)

1. `$env:NODE_ENV='development'; npx electron-forge start`.
2. Settings → Stylus → set **Tool on touch = Pen**; leave Tool on stylus = None.
3. Iconize DrawPen, touch the touchscreen → overlay appears in draw mode with Pen; dragging the finger draws.
4. Move the **mouse** → after the grace delay, reverts to pointer mode.
5. Regression: set Tool on stylus = Pen, Tool on touch = None → pen still triggers, finger touch does **not**.
6. Dev log shows touch events classified as `touch` (device usage `0x04`) and pen as `pen`.
