// No-op stylus watcher for platforms without a native backend yet (darwin/linux).
//
// IMPORTANT: this file must never import `koffi` or any platform-specific
// native code. It is the fallback returned by the selector on non-Windows
// platforms, so it has to be safe to load everywhere.
//
// Implements the §3.1 detector contract: { isSupported, start(), stop() }.

export function createNullStylusWatcher() {
  return {
    isSupported: false,
    start() {},
    stop() {},
  };
}

export default createNullStylusWatcher;
