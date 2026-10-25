import React, { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import {
  IoRefreshCircleOutline,
  IoCloseCircleOutline,
  IoGlobeOutline,
} from "react-icons/io5";
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

const ShortcutRow = ({ title, description, hint, shortcut, onCheck, onChange, onReset, onRemove, onError }) => {
  const KEY_NULL = '[NULL]';
  const isMac = window.electronAPI.isMac;

  const [isRecording, setIsRecording] = useState(false);
  const [currentKeys, setCurrentKeys] = useState([]);
  const inputRef = useRef(null);

  const canReset  = shortcut.init !== shortcut.accelerator;
  const canRemove = shortcut.accelerator !== KEY_NULL;

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
      Backslash: '\\',
      Semicolon: ';',
      Quote: "'",
      Backquote: '`',
      Comma: ',',
      Period: '.',
      Slash: '/',
    };
    if (punctuation[code]) return punctuation[code];

    return null;
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
    const electronKey = keys.join('+')

    const validateResult = await onCheck(electronKey)

    if (validateResult.success) {
      onChange(electronKey)
    } else {
      onError(validateResult.message)
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

    const modifiers = [];

    if (isMac) {
      if (event.metaKey) modifiers.push('Meta');
      if (event.ctrlKey) modifiers.push('Control');
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

  const handleReset = async () => {
    const validateResult = await onCheck(shortcut.init)

    if (validateResult.success) {
      onReset()
    } else {
      onError(validateResult.message)
    }
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

  const idleContent = (!shortcut.accelerator || shortcut.accelerator === KEY_NULL)
    ? <div className="placeholder">Record shortcut</div>
    : <HotkeyPill accelerator={shortcut.accelerator.split('+')} />;

  return (
    <div className="settings-item">
      {
        hint && <div className="settings-item-hint"><IoGlobeOutline className="icon" title={hint} /></div>
      }

      <div className="settings-item-info">
        <div className="settings-item-title">{title}</div>
        <div className="settings-item-description">{description}</div>
      </div>

      <div className="settings-item-control">
        { canReset && <IoRefreshCircleOutline className="icon" title="Reset to default" onClick={handleReset} /> }
        { canRemove && <IoCloseCircleOutline className="icon" title="Remove shortcut" onClick={onRemove} /> }

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
      </div>
    </div>
  );
};

export default ShortcutRow;
