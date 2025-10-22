import React, { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import {
  MdKeyboardCommandKey,
  MdOutlineKeyboardControlKey,
  MdOutlineKeyboardOptionKey,
} from "react-icons/md";
import { ImShift } from "react-icons/im";

const HotkeyPill = ({ accelerator }) => {
  const humanizedKey = (key) => {
    const keyMap = {
      'Meta': <MdKeyboardCommandKey />,
      'Control': <MdOutlineKeyboardControlKey />,
      'Alt': <MdOutlineKeyboardOptionKey />,
      'Shift': <ImShift />,
    };

    return keyMap[key] || key;
  };

  return (
    <span className="hotkey-pill">
      {
        accelerator.map(key => (
          <span key={key} className="key">{humanizedKey(key)}</span>
        ))
      }
    </span>
  );
};

const ShortcutRecorder = ({ accelerator, onCheck, onChange }) => {
  const isMac = window.electronAPI.isMac;

  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState([]);
  const inputRef = useRef(null);

  const codeToKey = (code) => {
    if (code.startsWith('Key') && code.length === 4) {
      return code.slice(3).toUpperCase(); // 'KeyA' -> 'A'
    }

    if (code.startsWith('Digit') && code.length === 6) {
      return code.slice(5); // 'Digit1' -> '1'
    }

    const punctuation = {
      Minus: '-',
      Equal: '=',
      BracketLeft: '[',
      BracketRight: ']',
      Semicolon: ';',
      Quote: "'",
      Backquote: '`',
      Period: '.',
      Slash: '/',
    };
    if (punctuation[code]) return punctuation[code];

    return null;
  };

  const validateShortcut = (keys) => {
    if (!keys) return true;

    const modifiers = ['Meta', 'Control', 'Alt', 'Shift'];
    const hasModifier = keys.some(part => modifiers.includes(part));
    const hasNonModifier = keys.some(part => !modifiers.includes(part));

    if (!hasModifier) {
      return false;
    }

    if (!hasNonModifier) {
      return false;
    }

    const systemShortcuts = [
      // Render Window
      'Meta+C',
      'Control+C',
      'Meta+V',
      'Control+V',
      'Meta+Z',
      'Meta+Shift+Z',
      'Control+Z',
      'Control+Shift+Z',
      // Settings
      'Meta+,',
      'Control+,',
      // App Quit
      'Meta+Q',
      'Control+Q',
      // Main Window
      'Meta+W', // Close window
      'Control+W',
    ];

    if (systemShortcuts.includes(keys.join('+'))) {
      return false;
    }

    return true;
  };

  const startRecording = () => {
    if (isRecording) return;

    setIsRecording(true);
    setCurrentKeys([]);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const stopRecording = async (keys) => {
    if (validateShortcut(keys)) {
      const electronKey = keys.join('+')

      if (await onCheck(electronKey)) {
        onChange(electronKey)
      }
    }

    setIsRecording(false);
    setCurrentKeys([]);
  };
  const debouncedStopRecording = useRef(
    debounce((keys) => stopRecording(keys), 200)
  ).current;

  const handleKeyDown = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.repeat) return;
    if (event.key === 'Dead') return;

    const modifiers = [];

    if (isMac) {
      if (event.metaKey) modifiers.push('Meta');
      if (event.ctrlKey && !event.metaKey) modifiers.push('Control');
    } else {
      if (event.ctrlKey) modifiers.push('Control');
    }

    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');

    const mainKey = codeToKey(event.code);
    if (mainKey) modifiers.push(mainKey);

    setCurrentKeys(modifiers);
  };

  const handleKeyUp = (event) => {
    event.preventDefault();
    event.stopPropagation();

    debouncedStopRecording(currentKeys);
  };

  const handleBlur = () => {
    debouncedStopRecording(currentKeys);
  };

  useEffect(() => {
    if (!isRecording) return;

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    document.addEventListener('keyup', handleKeyUp, { capture: true });
    document.addEventListener('blur', handleBlur, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      document.removeEventListener('keyup', handleKeyUp, { capture: true });
      document.removeEventListener('blur', handleBlur, { capture: true });

      debouncedStopRecording.cancel();
    };
  }, [isRecording, currentKeys]);

  const recordingContent = (currentKeys.length > 0)
    ? <HotkeyPill accelerator={currentKeys} />
    : <div className="placeholder">Recording...</div>;

  const idleContent = (!accelerator || accelerator === '[NULL]')
    ? <div className="placeholder">Record shortcut</div>
    : <HotkeyPill accelerator={accelerator.split('+')} />;

  return (
    <div className="shortcut-recorder">
      {
        isRecording && (
          <input
            ref={inputRef}
            type="text"
            onChange={() => {}}
            onBlur={handleBlur}
            className="shortcut-input"
            readOnly
            autoFocus
          />
        )
      }

      <div onClick={startRecording} className={`record-block${isRecording ? ' recording' : ''}`}>
        {isRecording ? recordingContent : idleContent}
      </div>
    </div>
  );
};

export default ShortcutRecorder;
