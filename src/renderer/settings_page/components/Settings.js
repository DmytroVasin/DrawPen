import React, { useState } from 'react';
import './Settings.scss';
import ShortcutRecorder from './ShortcutRecorder';
import {
  colorList,
  timeStep,
  laserTimeMin,
  laserTimeMax,
  fadeDisappearAfterMin,
  fadeDisappearAfterMax,
  fadeOutDurationTimeMsMin,
  fadeOutDurationTimeMsMax,
} from "../../app_page/components/constants.js";

import {
  IoRefreshCircleOutline,
  IoCloseCircleOutline,
  IoGlobeOutline,
  IoChevronDown,
  IoChevronForward,
  IoColorPaletteOutline,
  IoApps,
} from "react-icons/io5";
import { HiSwitchHorizontal } from "react-icons/hi";
import { FaRegKeyboard } from "react-icons/fa6";
import { FaPlus, FaMinus } from "react-icons/fa";


const ShortcutRow = ({ title, description, hint, shortcut, onCheck, onChange, onReset, onRemove }) => {
  const canReset  = !!shortcut.init && shortcut.init !== shortcut.accelerator;
  const canRemove = (shortcut.accelerator || shortcut.init) && shortcut.accelerator !== '[NULL]';

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
        { canReset && <IoRefreshCircleOutline className="icon" title="Reset to default" onClick={onReset} /> }
        { canRemove && <IoCloseCircleOutline className="icon" title="Remove shortcut" onClick={onRemove} /> }

        <ShortcutRecorder accelerator={shortcut.accelerator} onCheck={onCheck} onChange={onChange} />
      </div>
    </div>
  );
};

const Settings = (config) => {
  const [showDrawingBorder, setShowDrawingBorder] = useState(config.show_drawing_border);
  const [showCuteCursor, setShowCuteCursor] = useState(config.show_cute_cursor);
  const [appIconColor, setAppIconColor] = useState(config.app_icon_color);
  const [fadeDisappearAfterMs, setFadeDisappearAfterMs] = useState(config.fade_disappear_after_ms);
  const [fadeOutDurationTimeMs, setFadeOutDurationTimeMs] = useState(config.fade_out_duration_time_ms);
  const [laserTimeMs, setLaserTimeMs] = useState(config.laser_time);
  const [launchOnLogin, setLaunchOnLogin] = useState(config.launch_on_login);
  const [startsHidden, setStartsHidden] = useState(config.starts_hidden);

  const [showHideApp, setShowHideApp]               = useState({ accelerator: config.key_binding_show_hide_app,        init: config.key_binding_show_hide_app_default });
  const [showHideToolbar, setShowHideToolbar]       = useState({ accelerator: config.key_binding_show_hide_toolbar,    init: config.key_binding_show_hide_toolbar_default });
  const [showHideWhiteboard, setShowHideWhiteboard] = useState({ accelerator: config.key_binding_show_hide_whiteboard, init: config.key_binding_show_hide_whiteboard_default });
  const [clearDesk, setClearDesk]                   = useState({ accelerator: config.key_binding_clear_desk,           init: config.key_binding_clear_desk_default });

  const [mainColor, setMainColor]           = useState(config.swap_colors_indexes[0]);
  const [secondaryColor, setSecondaryColor] = useState(config.swap_colors_indexes[1]);
  const [drawingMonitor, setDrawingMonitor] = useState(config.drawing_monitor);

  const [activeTab, setActiveTab] = useState('shortcuts');

  const displays = config.displays || [];
  const appVersion = config.app_version;

  const resetToOriginals = () => {
    window.electronAPI.resetToOriginals();
  }

  const canRegisterShortcut = async (accelerator) => {
    return await window.electronAPI.canRegisterShortcut(accelerator);
  }

  const applyShortcut = (key, accelerator) => {
    window.electronAPI.setShortcut(key, accelerator);

    switch (key) {
      case 'key_binding_show_hide_app':
        setShowHideApp({ ...showHideApp, accelerator });
        break;
      case 'key_binding_show_hide_toolbar':
        setShowHideToolbar({ ...showHideToolbar, accelerator });
        break;
      case 'key_binding_show_hide_whiteboard':
        setShowHideWhiteboard({ ...showHideWhiteboard, accelerator });
        break;
      case 'key_binding_clear_desk':
        setClearDesk({ ...clearDesk, accelerator });
        break;
    }
  };

  const resetShortcut = (key) => {
    window.electronAPI.setShortcut(key, null);

    switch (key) {
      case 'key_binding_show_hide_app':
        setShowHideApp({ ...showHideApp, accelerator: showHideApp.init });
        break;
      case 'key_binding_show_hide_toolbar':
        setShowHideToolbar({ ...showHideToolbar, accelerator: showHideToolbar.init });
        break;
      case 'key_binding_show_hide_whiteboard':
        setShowHideWhiteboard({ ...showHideWhiteboard, accelerator: showHideWhiteboard.init });
        break;
      case 'key_binding_clear_desk':
        setClearDesk({ ...clearDesk, accelerator: clearDesk.init });
        break;
    }
  };

  const removeShortcut = (key) => {
    window.electronAPI.setShortcut(key, '[NULL]');

    switch (key) {
      case 'key_binding_show_hide_app':
        setShowHideApp({ ...showHideApp, accelerator: '[NULL]' });
        break;
      case 'key_binding_show_hide_toolbar':
        setShowHideToolbar({ ...showHideToolbar, accelerator: '[NULL]' });
        break;
      case 'key_binding_show_hide_whiteboard':
        setShowHideWhiteboard({ ...showHideWhiteboard, accelerator: '[NULL]' });
        break;
      case 'key_binding_clear_desk':
        setClearDesk({ ...clearDesk, accelerator: '[NULL]' });
        break;
    }
  };

  const toggleDrawingBorder = () => {
    const nextState = !showDrawingBorder;
    setShowDrawingBorder(nextState);

    window.electronAPI.setShowDrawingBorder(nextState);
  };

  const toggleCuteCursor = () => {
    const nextState = !showCuteCursor;
    setShowCuteCursor(nextState);

    window.electronAPI.setShowCuteCursor(nextState);
  };

  const toggleLaunch = () => {
    const nextState = !launchOnLogin;
    setLaunchOnLogin(nextState);

    window.electronAPI.setLaunchOnLogin(nextState);
  };

  const toggleStartsHidden = () => {
    const nextState = !startsHidden;
    setStartsHidden(nextState);

    window.electronAPI.setStartsHidden(nextState);
  };

  const selectAppIconColor = (event) => {
    const iconColor = event.target.value;
    setAppIconColor(iconColor);

    window.electronAPI.setAppIconColor(iconColor);
  }

  const applyLaserTime = (value) => {
    const newLaserTimeMs = Math.min(laserTimeMax, Math.max(laserTimeMin, Number(value)))

    if (newLaserTimeMs === laserTimeMs) return

    setLaserTimeMs(newLaserTimeMs)
    window.electronAPI.setLaserTimeMs(newLaserTimeMs)
  }

  const applyFadeDisappearAfter = (value) => {
    const ms = Math.min(fadeDisappearAfterMax, Math.max(fadeDisappearAfterMin, Number(value)))

    if (ms === fadeDisappearAfterMs) return

    setFadeDisappearAfterMs(ms)
    window.electronAPI.setFadeDisappearAfterMs(ms)
  }

  const applyFadeOutDurationTimeMs = (value) => {
    const ms = Math.min(fadeOutDurationTimeMsMax, Math.max(fadeOutDurationTimeMsMin, Number(value)))

    if (ms === fadeOutDurationTimeMs) return

    setFadeOutDurationTimeMs(ms)
    window.electronAPI.setFadeOutDurationTimeMs(ms)
  }

  const nextMainColor = () => {
    const nextColor = (mainColor + 1) % colorList.length;
    setMainColor(nextColor);

    window.electronAPI.setSwapColors([nextColor, secondaryColor]);
  }

  const nextSecondaryColor = () => {
    const nextColor = (secondaryColor + 1) % colorList.length;
    setSecondaryColor(nextColor);

    window.electronAPI.setSwapColors([mainColor, nextColor]);
  }

  const selectDrawingMonitor = (event) => {
    const value = event.target.value;
    let newMonitor = {
      mode: 'auto' ,
      display_id: null,
      label: null
    };

    const display = displays.find(display => display.id === value);
    if (display) {
      newMonitor = {
        mode: 'fixed',
        display_id: value,
        label: display.label
      };
    }

    setDrawingMonitor(newMonitor);
    window.electronAPI.setDrawingMonitor(newMonitor);
  }

  return (
    <div className="settings-page">
      <div className="settings-sidebar-wrapper">
        <div className="settings-sidebar">
          <div
            className={`settings-sidebar-item ${activeTab === 'shortcuts' ? 'active' : ''}`}
            onClick={() => setActiveTab('shortcuts')}
          >
            <FaRegKeyboard className="icon" />
            Keyboard Shortcuts
          </div>

          <div
            className={`settings-sidebar-item ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <IoColorPaletteOutline className="icon" />
            Appearance
          </div>

          <div
            className={`settings-sidebar-item ${activeTab === 'application' ? 'active' : ''}`}
            onClick={() => setActiveTab('application')}
          >
            <IoApps className="icon" />
            Application
          </div>

          <div className="settings-sidebar-version">
            DrawPen {appVersion}
          </div>
        </div>
      </div>

      <div className="settings-container-wrapper">
        {activeTab === 'shortcuts' && (
          <div className="settings-container">
            <div className="settings-header">
              <div className="settings-title">Shortcuts</div>
            </div>

            <div className="settings-content">
              <div className="settings-section">

                <ShortcutRow
                  title="Show/Hide App"
                  description="Toggles the main application window"
                  hint="Global shortcut"
                  shortcut={showHideApp}
                  onCheck={canRegisterShortcut}
                  onChange={(acc) => applyShortcut('key_binding_show_hide_app', acc)}
                  onReset={() => resetShortcut('key_binding_show_hide_app')}
                  onRemove={() => removeShortcut('key_binding_show_hide_app')}
                />

                <ShortcutRow
                  title="Show/Hide Toolbar"
                  description="Toggles the floating toolbar"
                  shortcut={showHideToolbar}
                  onCheck={canRegisterShortcut}
                  onChange={(acc) => applyShortcut('key_binding_show_hide_toolbar', acc)}
                  onReset={() => resetShortcut('key_binding_show_hide_toolbar')}
                  onRemove={() => removeShortcut('key_binding_show_hide_toolbar')}
                />

                <ShortcutRow
                  title="Show/Hide Whiteboard"
                  description="Toggles the whiteboard overlay"
                  shortcut={showHideWhiteboard}
                  onCheck={canRegisterShortcut}
                  onChange={(acc) => applyShortcut('key_binding_show_hide_whiteboard', acc)}
                  onReset={() => resetShortcut('key_binding_show_hide_whiteboard')}
                  onRemove={() => removeShortcut('key_binding_show_hide_whiteboard')}
                />

                <ShortcutRow
                  title="Clear Desk"
                  description="Clears all drawings from the whiteboard"
                  shortcut={clearDesk}
                  onCheck={canRegisterShortcut}
                  onChange={(acc) => applyShortcut('key_binding_clear_desk', acc)}
                  onReset={() => resetShortcut('key_binding_clear_desk')}
                  onRemove={() => removeShortcut('key_binding_clear_desk')}
                />

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Color Swap</div>
                    <div className="settings-item-description">Press X to switch colors</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="color-swatches">
                      <div
                        onClick={nextMainColor}
                        className={`color-plate ${colorList[mainColor].name}`}
                      ></div>

                      <HiSwitchHorizontal className="icon icon--disabled" title="Press X to switch colors" />

                      <div
                        onClick={nextSecondaryColor}
                        className={`color-plate ${colorList[secondaryColor].name}`}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="settings-container">
            <div className="settings-header">
              <div className="settings-title">Appearance</div>
            </div>

            <div className="settings-content">
              <div className="settings-section">

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Hide Drawing Border</div>
                  </div>

                  <div className="settings-item-control">
                    <div
                      className={`toggle ${showDrawingBorder ? '' : 'active'}`}
                      onClick={toggleDrawingBorder}
                    ></div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Hide Cute Cursor</div>
                  </div>

                  <div className="settings-item-control">
                    <div
                      className={`toggle ${showCuteCursor ? '' : 'active'}`}
                      onClick={toggleCuteCursor}
                    ></div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Fade start delay</div>
                    <div className="settings-item-description">Press SPACE to pause the timer</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="stepper-container">
                      <div className="stepper-button" onClick={() => applyFadeDisappearAfter(fadeDisappearAfterMs - timeStep)}>
                        <FaMinus className="stepper-button--icon" />
                      </div>
                      <div className="stepper-value">{fadeDisappearAfterMs / 1000}s</div>
                      <div className="stepper-button" onClick={() => applyFadeDisappearAfter(fadeDisappearAfterMs + timeStep)}>
                        <FaPlus className="stepper-button--icon" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-item--nested">
                  <div className="settings-item">
                    <div className="settings-item--forward">
                      <IoChevronForward className="icon" />
                    </div>

                    <div className="settings-item-info">
                      <div className="settings-item-title">Fade-out duration</div>
                      <div className="settings-item-description">Duration of the fade animation</div>
                    </div>

                    <div className="settings-item-control">
                      <div className="stepper-container">
                        <div className="stepper-button" onClick={() => applyFadeOutDurationTimeMs(fadeOutDurationTimeMs - timeStep)}>
                          <FaMinus className="stepper-button--icon" />
                        </div>
                        <div className="stepper-value">{fadeOutDurationTimeMs / 1000}s</div>
                        <div className="stepper-button" onClick={() => applyFadeOutDurationTimeMs(fadeOutDurationTimeMs + timeStep)}>
                          <FaPlus className="stepper-button--icon" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Laser Duration</div>
                    <div className="settings-item-description">Adjust how long the laser remains on screen</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="stepper-container">
                      <div className="stepper-button" onClick={() => applyLaserTime(laserTimeMs - timeStep)}>
                        <FaMinus className="stepper-button--icon" />
                      </div>
                      <div className="stepper-value">{laserTimeMs / 1000}s</div>
                      <div className="stepper-button" onClick={() => applyLaserTime(laserTimeMs + timeStep)}>
                        <FaPlus className="stepper-button--icon" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'application' && (
          <div className="settings-container">
            <div className="settings-header">
              <div className="settings-title">Application</div>
            </div>

            <div className="settings-content">
              <div className="settings-section">

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">App Icon Color</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="selectbar-container">
                      <select
                        className="selectbar"
                        value={appIconColor}
                        onChange={selectAppIconColor}
                      >
                        <option value="default">Default</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                      </select>

                      <div className="selectbar-arrow">
                        <IoChevronDown className="icon" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Lock drawing monitor</div>
                  </div>

                  <div className="settings-item-control">
                    <div className="selectbar-container">
                      <select
                        className="selectbar"
                        value={drawingMonitor.display_id || 'auto'}
                        onChange={selectDrawingMonitor}
                      >
                        <option value="auto">Auto</option>
                        {
                          displays.map(display => (
                            <option key={display.id} value={display.id}>{display.label}</option>
                          ))
                        }

                        {
                          drawingMonitor.mode === 'fixed' &&
                          !displays.find(display => display.id === drawingMonitor.display_id) &&
                            (
                              <option disabled value={drawingMonitor.display_id}>
                                {drawingMonitor.label} (disconnected)
                              </option>
                            )
                        }
                      </select>

                      <div className="selectbar-arrow">
                        <IoChevronDown className="icon" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Starts hidden on launch</div>
                  </div>

                  <div className="settings-item-control">
                    <div
                      className={`toggle ${startsHidden ? 'active' : ''}`}
                      onClick={toggleStartsHidden}
                    ></div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Launch on system startup</div>
                  </div>

                  <div className="settings-item-control">
                    <div
                      className={`toggle ${launchOnLogin ? 'active' : ''}`}
                      onClick={toggleLaunch}
                    ></div>
                  </div>
                </div>

                <div className="settings-item">
                  <div className="settings-item-info">
                    <div className="settings-item-title">Reset to defaults</div>
                  </div>

                  <div className="settings-item-control">
                    <button className="button" onClick={resetToOriginals}>Reset All</button>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
