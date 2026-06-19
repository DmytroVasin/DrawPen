// Platform-selecting stylus watcher factory.
//
// Public contract (§3.1 of docs/epics/stylus-auto-tool.md):
//   createStylusWatcher(handlers) -> watcher
//     handlers.onPenActivity({ contact: boolean })  // pen hover/move/down (digitizer-signed)
//     handlers.onMouseActivity()                     // genuine mouse move (un-signed)
//   watcher.isSupported : boolean
//   watcher.start() : void   // installs hook (idempotent)
//   watcher.stop()  : void   // uninstalls hook (idempotent)
//
// The selector picks the Windows koffi backend on win32, else a no-op backend.
// `koffi` (a CommonJS native dep) must NEVER be evaluated on non-Windows, so
// the Windows backend is required *lazily* inside the win32 branch.

import { createNullStylusWatcher } from './nullStylusWatcher';

export function createStylusWatcher(handlers = {}) {
  if (process.platform === 'win32') {
    // Lazy require so koffi is only ever loaded on Windows. Using require()
    // (rather than a static import) keeps the module — and its native binding —
    // out of the module graph on darwin/linux entirely.
    //
    // eslint-disable-next-line global-require
    const { createWindowsStylusWatcher } = require('./windowsStylusWatcher');
    return createWindowsStylusWatcher(handlers);
  }

  return createNullStylusWatcher();
}

export default createStylusWatcher;
