// Windows stylus watcher: Raw Input (WM_INPUT) from the HID digitizer.
//
// Why not WH_MOUSE_LL? Graphics tablets (XPPen/Huion) and many pen digitizers
// deliver pen input through the Windows pointer/Ink pipeline (HID usage page
// 0x0D), which is NOT promoted to the legacy mouse-message queue that a
// low-level mouse hook taps — so the hook sees nothing for those pens. Raw Input
// classifies by *device*, not by a promoted-mouse signature, so it sees the pen
// directly regardless of the tablet's "Windows Ink" setting.
//
// Design: a hidden message-only window receives WM_INPUT for the registered
// device classes — the pen digitizer (usage page 0x0D, usages 0x01/0x02), the
// touch screen (usage page 0x0D, usage 0x04), and the mouse (usage page 0x01,
// usage 0x02), all with RIDEV_INPUTSINK so input arrives even when DrawPen has
// no focus/visible window. The window's WndProc (a koffi-registered callback)
// classifies each WM_INPUT by the RAWINPUTHEADER device type: RIM_TYPEMOUSE ->
// mouse, RIM_TYPEHID -> pen *or* touch. Because pen and touch both arrive as
// RIM_TYPEHID, the HID branch is further disambiguated by the source device:
// GetRawInputDeviceInfoW(hDevice, RIDI_DEVICEINFO) yields the device's
// RID_DEVICE_INFO_HID.usUsage (0x04 = touch screen, else pen), cached per
// hDevice so it costs one syscall per device, not per event. Electron's main
// thread already pumps the Win32 message loop, so the WndProc fires there.
//
// koffi is a CommonJS native module; this file is only ever required on win32
// (see ./index.js), so loading koffi here is safe.
import koffi from 'koffi';

const isDevelopment = process.env.NODE_ENV === 'development';

// ---- Tuning constants --------------------------------------------------------
const PEN_THROTTLE_MS = 16; // throttle pen events to ~60/s
const TOUCH_THROTTLE_MS = 16; // throttle touch events to ~60/s
const MOUSE_HYSTERESIS_MS = 120; // min sustained mouse movement before emitting onMouseActivity throttle

// ---- Win32 constants ---------------------------------------------------------
const WM_INPUT = 0x00ff;

const RID_HEADER = 0x10000005; // GetRawInputData: fetch only the RAWINPUTHEADER
const RAWINPUTHEADER_SIZE = 24; // x64: DWORD dwType; DWORD dwSize; HANDLE hDevice; WPARAM wParam;
const RAWINPUTDEVICE_SIZE = 16; // USHORT usUsagePage; USHORT usUsage; DWORD dwFlags; HWND hwndTarget;

const RIDI_DEVICEINFO = 0x2000000b; // GetRawInputDeviceInfoW: fetch the RID_DEVICE_INFO
// RID_DEVICE_INFO (x64): DWORD cbSize; DWORD dwType; then the union. The HID
// branch RID_DEVICE_INFO_HID { DWORD dwVendorId(8); DWORD dwProductId(12); DWORD
// dwVersionNumber(16); USHORT usUsagePage(20); USHORT usUsage(22); } starts at
// offset 8 — so usUsagePage is at offset 20 and usUsage at offset 22. A 32-byte
// buffer comfortably holds it.
const RID_DEVICE_INFO_SIZE = 32;
const RID_DEVICE_INFO_HID_USAGE_PAGE_OFFSET = 20;
const RID_DEVICE_INFO_HID_USAGE_OFFSET = 22;

const RIM_TYPEMOUSE = 0;
const RIM_TYPEHID = 2;

const RIDEV_REMOVE = 0x00000001;
const RIDEV_INPUTSINK = 0x00000100;

// HID usage pages / usages we care about. We register BOTH digitizer top-level
// usages that pens use — 0x01 (Digitizer) and 0x02 (Pen) — because tablets vary:
// e.g. an XPPen Deco Pro reports its pen on 0x0D/0x01, a direct pen display on
// 0x0D/0x02. We also register 0x04 (Touch Screen) so finger touch can trigger
// the touch auto-tool; since pen and touch both arrive as RIM_TYPEHID, the
// WndProc disambiguates them via GetRawInputDeviceInfoW (see classifyDevice).
// We deliberately do NOT register 0x05 (Touch Pad) — that is the laptop
// trackpad, and finger-on-trackpad must never trigger draw mode.
const HID_USAGE_PAGE_GENERIC = 0x01;
const HID_USAGE_GENERIC_MOUSE = 0x02;
const HID_USAGE_PAGE_DIGITIZER = 0x0d;
const HID_USAGE_DIGITIZER = 0x01;
const HID_USAGE_DIGITIZER_PEN = 0x02;
const HID_USAGE_DIGITIZER_TOUCH_SCREEN = 0x04;
const RAWINPUT_DEVICE_COUNT = 4;

// Message-only window parent: (HWND)-3, as an unsigned pointer-sized value.
const HWND_MESSAGE = 0xfffffffffffffffdn;

const CLASS_NAME = 'DrawPenStylusRawInputWnd';

// Cache of source-device classification (hDevice as BigInt -> 'pen' | 'touch').
// Pen and touch both arrive as RIM_TYPEHID, so we classify by device once and
// reuse the result for every subsequent event from that device.
const deviceKind = new Map();

function log(...args) {
  if (isDevelopment) {
    console.log('[DRAWPEN:STYLUS]', ...args);
  }
}

export function createWindowsStylusWatcher(handlers = {}) {
  const onPenActivity = typeof handlers.onPenActivity === 'function' ? handlers.onPenActivity : () => {};
  const onTouchActivity = typeof handlers.onTouchActivity === 'function' ? handlers.onTouchActivity : () => {};
  const onMouseActivity = typeof handlers.onMouseActivity === 'function' ? handlers.onMouseActivity : () => {};

  // FFI state (resolved once; reused across start/stop cycles).
  let user32 = null;
  let kernel32 = null;
  let RegisterClassExW = null;
  let UnregisterClassW = null;
  let CreateWindowExW = null;
  let DestroyWindow = null;
  let DefWindowProcW = null;
  let RegisterRawInputDevices = null;
  let GetRawInputData = null;
  let GetRawInputDeviceInfoW = null;
  let GetModuleHandleW = null;
  let WndProcPtr = null; // koffi pointer type for the WndProc prototype
  let WNDCLASSEXW = null; // koffi struct type

  // Runtime state.
  let supported = false;
  let initFailed = false;
  let hInstance = 0n;
  let classAtom = 0; // 0 = not registered
  let hwnd = 0n; // 0 = no window
  let registeredCallback = null; // koffi-registered WndProc (MUST stay referenced)
  let rawInputRegistered = false;

  // Reusable scratch buffers for the WndProc (avoid per-event allocation).
  let headerBuf = null;
  let headerSizeBuf = null;
  let deviceInfoBuf = null;
  let deviceInfoSizeBuf = null;

  // Classification / debounce state.
  let lastPenEmit = 0;
  let lastTouchEmit = 0;
  let mousePendingTimer = null;
  let lastAutoActivityTime = 0; // last pen OR touch activity (wins over a pending mouse revert)

  function loadFFI() {
    if (RegisterClassExW) return true; // already loaded
    if (initFailed) return false;

    try {
      user32 = koffi.load('user32.dll');
      kernel32 = koffi.load('kernel32.dll');

      // LRESULT CALLBACK WndProc(HWND, UINT, WPARAM, LPARAM)
      const WndProcProto = koffi.proto('__stdcall WndProcProto', 'intptr_t', [
        'uintptr_t', // hwnd
        'uint32', // msg
        'uintptr_t', // wParam
        'intptr_t', // lParam (HRAWINPUT for WM_INPUT)
      ]);
      WndProcPtr = koffi.pointer(WndProcProto);

      // typedef struct { UINT cbSize; UINT style; WNDPROC lpfnWndProc;
      //   int cbClsExtra; int cbWndExtra; HINSTANCE hInstance; HICON hIcon;
      //   HCURSOR hCursor; HBRUSH hbrBackground; LPCWSTR lpszMenuName;
      //   LPCWSTR lpszClassName; HICON hIconSm; } WNDCLASSEXW;
      WNDCLASSEXW = koffi.struct('WNDCLASSEXW', {
        cbSize: 'uint32',
        style: 'uint32',
        lpfnWndProc: WndProcPtr,
        cbClsExtra: 'int',
        cbWndExtra: 'int',
        hInstance: 'uintptr_t',
        hIcon: 'uintptr_t',
        hCursor: 'uintptr_t',
        hbrBackground: 'uintptr_t',
        lpszMenuName: 'str16',
        lpszClassName: 'str16',
        hIconSm: 'uintptr_t',
      });

      RegisterClassExW = user32.func('uint16 __stdcall RegisterClassExW(WNDCLASSEXW *)');
      UnregisterClassW = user32.func('int __stdcall UnregisterClassW(str16, uintptr_t)');
      CreateWindowExW = user32.func(
        'uintptr_t __stdcall CreateWindowExW(uint32, str16, str16, uint32, int, int, int, int, uintptr_t, uintptr_t, uintptr_t, uintptr_t)'
      );
      DestroyWindow = user32.func('int __stdcall DestroyWindow(uintptr_t)');
      DefWindowProcW = user32.func('intptr_t __stdcall DefWindowProcW(uintptr_t, uint32, uintptr_t, intptr_t)');
      RegisterRawInputDevices = user32.func('int __stdcall RegisterRawInputDevices(void *, uint32, uint32)');
      GetRawInputData = user32.func('uint32 __stdcall GetRawInputData(intptr_t, uint32, void *, uint32 *, uint32)');
      GetRawInputDeviceInfoW = user32.func('uint32 __stdcall GetRawInputDeviceInfoW(intptr_t, uint32, void *, uint32 *)');
      GetModuleHandleW = kernel32.func('uintptr_t __stdcall GetModuleHandleW(uintptr_t)');

      headerBuf = Buffer.alloc(RAWINPUTHEADER_SIZE);
      headerSizeBuf = Buffer.alloc(4);
      deviceInfoBuf = Buffer.alloc(RID_DEVICE_INFO_SIZE);
      deviceInfoSizeBuf = Buffer.alloc(4);

      supported = true;
      return true;
    } catch (err) {
      initFailed = true;
      supported = false;
      log('Failed to load FFI / Win32 symbols; stylus watcher disabled:', err && err.message);
      return false;
    }
  }

  // Emit a pen-activity event, throttled to ~60/s. Any pen activity cancels a
  // pending mouse emit (the user is using the pen, not the mouse).
  function emitPen() {
    const now = Date.now();
    lastAutoActivityTime = now;

    if (mousePendingTimer) {
      clearTimeout(mousePendingTimer);
      mousePendingTimer = null;
    }

    if (now - lastPenEmit < PEN_THROTTLE_MS) return;
    lastPenEmit = now;

    // Defer off the WndProc so we never block the message loop. We cannot detect
    // tip contact cheaply from the header alone, so contact is reported false;
    // continuous pen reports keep the session alive via the hysteresis above.
    setImmediate(() => {
      try {
        onPenActivity({ contact: false });
      } catch (err) {
        log('onPenActivity handler threw:', err && err.message);
      }
    });
  }

  // Emit a touch-activity event, throttled to ~60/s. Mirrors emitPen: any touch
  // activity also cancels a pending mouse emit (the user is touching, not on the
  // mouse), and feeds the same lastAutoActivityTime that wins the mouse race.
  function emitTouch() {
    const now = Date.now();
    lastAutoActivityTime = now;

    if (mousePendingTimer) {
      clearTimeout(mousePendingTimer);
      mousePendingTimer = null;
    }

    if (now - lastTouchEmit < TOUCH_THROTTLE_MS) return;
    lastTouchEmit = now;

    // Defer off the WndProc so we never block the message loop. We cannot detect
    // a finger lift cheaply from the header alone, so contact is reported false;
    // continuous touch reports keep the session alive via the hysteresis above.
    setImmediate(() => {
      try {
        onTouchActivity({ contact: false });
      } catch (err) {
        log('onTouchActivity handler threw:', err && err.message);
      }
    });
  }

  // Classify a RIM_TYPEHID source device as 'pen' or 'touch'. Pen and touch both
  // arrive as RIM_TYPEHID, so we look up the device's HID top-level usage via
  // GetRawInputDeviceInfoW(RIDI_DEVICEINFO): usUsage 0x04 = touch screen, else
  // pen. Cached per hDevice (one syscall per device, not per event). On failure
  // we default to 'pen' WITHOUT caching, so a later event can retry.
  function classifyDevice(hDevice) {
    const cached = deviceKind.get(hDevice);
    if (cached) return cached;

    try {
      // RIDI_DEVICEINFO uses cbSize (offset 0) as the in/out buffer size; the
      // *pcbSize argument must also be pre-set to the buffer size in bytes.
      deviceInfoBuf.writeUInt32LE(RID_DEVICE_INFO_SIZE, 0);
      deviceInfoSizeBuf.writeUInt32LE(RID_DEVICE_INFO_SIZE, 0);
      // intptr_t accepts the value koffi hands us (Number or BigInt).
      const res = GetRawInputDeviceInfoW(hDevice, RIDI_DEVICEINFO, deviceInfoBuf, deviceInfoSizeBuf);
      if (res === 0xffffffff || res === 0) {
        return 'pen'; // failure — default to pen, do NOT cache so we can retry
      }
      const usUsagePage = deviceInfoBuf.readUInt16LE(RID_DEVICE_INFO_HID_USAGE_PAGE_OFFSET);
      const usUsage = deviceInfoBuf.readUInt16LE(RID_DEVICE_INFO_HID_USAGE_OFFSET);
      const kind =
        usUsagePage === HID_USAGE_PAGE_DIGITIZER && usUsage === HID_USAGE_DIGITIZER_TOUCH_SCREEN
          ? 'touch'
          : 'pen';
      deviceKind.set(hDevice, kind);
      log('Classified HID device', hDevice.toString(), 'usagePage', usUsagePage, 'usUsage', usUsage, '->', kind);
      return kind;
    } catch (err) {
      log('GetRawInputDeviceInfoW threw; defaulting to pen:', err && err.message);
      return 'pen'; // do NOT cache on error
    }
  }

  // Arm a hysteresis timer on mouse input. Only emit onMouseActivity if no pen
  // activity intervened during the window (the user is genuinely on the mouse).
  function noteMouseMove() {
    if (mousePendingTimer) return;
    const armedAt = Date.now();
    mousePendingTimer = setTimeout(() => {
      mousePendingTimer = null;
      if (lastAutoActivityTime >= armedAt) return; // pen/touch won — suppress
      try {
        onMouseActivity();
      } catch (err) {
        log('onMouseActivity handler threw:', err && err.message);
      }
    }, MOUSE_HYSTERESIS_MS);
  }

  // The window procedure. Kept cheap; always ends in DefWindowProcW.
  function wndProc(hWnd, msg, wParam, lParam) {
    try {
      if (msg === WM_INPUT) {
        headerSizeBuf.writeUInt32LE(RAWINPUTHEADER_SIZE, 0);
        const res = GetRawInputData(lParam, RID_HEADER, headerBuf, headerSizeBuf, RAWINPUTHEADER_SIZE);

        if (res !== 0xffffffff && res > 0) {
          const dwType = headerBuf.readUInt32LE(0);

          if (dwType === RIM_TYPEHID) {
            // Pen and touch both arrive as RIM_TYPEHID; disambiguate by source
            // device. hDevice sits in the RAWINPUTHEADER at offset 8 (after
            // dwType + dwSize DWORDs), pointer-sized.
            const hDevice = headerBuf.readBigUInt64LE(8);
            if (classifyDevice(hDevice) === 'touch') {
              emitTouch();
            } else {
              emitPen();
            }
          } else if (dwType === RIM_TYPEMOUSE) {
            noteMouseMove();
          }
        }
      }
    } catch (err) {
      log('wndProc threw (continuing):', err && err.message);
    }
    return DefWindowProcW(hWnd, msg, wParam, lParam);
  }

  // Build the RAWINPUTDEVICE array (digitizer + pen + touch + mouse) targeting our window.
  function buildRawInputDevices(targetHwnd, flags) {
    // koffi returns HWND as a Number when it fits in a safe integer; writeBigUInt64LE
    // requires a BigInt, so coerce.
    const target = BigInt(targetHwnd);
    const entries = [
      [HID_USAGE_PAGE_DIGITIZER, HID_USAGE_DIGITIZER],            // pen reported as a generic digitizer (e.g. XPPen Deco)
      [HID_USAGE_PAGE_DIGITIZER, HID_USAGE_DIGITIZER_PEN],        // pen reported as a pen (e.g. direct pen displays)
      [HID_USAGE_PAGE_DIGITIZER, HID_USAGE_DIGITIZER_TOUCH_SCREEN], // touch screen (classified per-device in the WndProc)
      [HID_USAGE_PAGE_GENERIC, HID_USAGE_GENERIC_MOUSE],          // genuine mouse (for the revert signal)
    ];
    const buf = Buffer.alloc(RAWINPUTDEVICE_SIZE * entries.length);
    entries.forEach(([page, usage], i) => {
      const off = i * RAWINPUTDEVICE_SIZE;
      buf.writeUInt16LE(page, off);
      buf.writeUInt16LE(usage, off + 2);
      buf.writeUInt32LE(flags, off + 4);
      buf.writeBigUInt64LE(target, off + 8);
    });
    return buf;
  }

  function start() {
    if (hwnd) return; // idempotent: already running
    if (!loadFFI()) return; // FFI unavailable -> no-op (app still boots)

    try {
      hInstance = GetModuleHandleW(0n);

      // Register the window class (once; reused across start/stop if atom kept).
      if (!classAtom) {
        registeredCallback = koffi.register(wndProc, WndProcPtr);
        const wndClass = {
          cbSize: koffi.sizeof(WNDCLASSEXW),
          style: 0,
          lpfnWndProc: registeredCallback,
          cbClsExtra: 0,
          cbWndExtra: 0,
          hInstance,
          hIcon: 0n,
          hCursor: 0n,
          hbrBackground: 0n,
          lpszMenuName: null,
          lpszClassName: CLASS_NAME,
          hIconSm: 0n,
        };
        classAtom = RegisterClassExW(wndClass);
        if (!classAtom) {
          log('RegisterClassExW failed; stylus watcher disabled');
          cleanupCallback();
          return;
        }
      }

      // Message-only window (HWND_MESSAGE parent).
      hwnd = CreateWindowExW(0, CLASS_NAME, null, 0, 0, 0, 0, 0, HWND_MESSAGE, 0n, hInstance, 0n);
      if (!hwnd) {
        log('CreateWindowExW failed; stylus watcher disabled');
        return;
      }

      const devices = buildRawInputDevices(hwnd, RIDEV_INPUTSINK);
      const ok = RegisterRawInputDevices(devices, RAWINPUT_DEVICE_COUNT, RAWINPUTDEVICE_SIZE);
      if (!ok) {
        log('RegisterRawInputDevices failed; stylus watcher disabled');
        stop();
        return;
      }
      rawInputRegistered = true;

      log('Raw Input watcher started (digitizer pen + touch screen + mouse, INPUTSINK)');
    } catch (err) {
      log('Failed to start Raw Input watcher; stylus watcher disabled:', err && err.message);
      stop();
    }
  }

  function cleanupCallback() {
    if (registeredCallback) {
      try {
        koffi.unregister(registeredCallback);
      } catch (_) {
        /* ignore */
      }
      registeredCallback = null;
    }
  }

  function stop() {
    if (mousePendingTimer) {
      clearTimeout(mousePendingTimer);
      mousePendingTimer = null;
    }

    try {
      if (rawInputRegistered && hwnd) {
        // Unregister raw input (hwndTarget must be NULL when removing).
        const devices = buildRawInputDevices(0n, RIDEV_REMOVE);
        RegisterRawInputDevices(devices, RAWINPUT_DEVICE_COUNT, RAWINPUTDEVICE_SIZE);
      }
    } catch (err) {
      log('Unregister raw input threw:', err && err.message);
    }
    rawInputRegistered = false;

    try {
      if (hwnd) DestroyWindow(hwnd);
    } catch (err) {
      log('DestroyWindow threw:', err && err.message);
    }
    hwnd = 0n;

    try {
      if (classAtom) {
        UnregisterClassW(CLASS_NAME, hInstance);
        classAtom = 0;
      }
    } catch (err) {
      log('UnregisterClassW threw:', err && err.message);
    }

    // Drop the WndProc callback only after the class/window are gone.
    cleanupCallback();

    log('Raw Input watcher stopped');
  }

  // Probe FFI availability up front so `isSupported` is meaningful before start().
  loadFFI();

  return {
    get isSupported() {
      return supported;
    },
    start,
    stop,
  };
}

export default createWindowsStylusWatcher;
