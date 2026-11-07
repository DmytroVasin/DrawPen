import React, { useEffect, useRef, useState } from 'react';
import { IoCheckmark } from 'react-icons/io5';
import { defaultColorPickerColors } from '../../app_page/components/constants.js';
import './ColorPicker.scss';

const DEFAULT_COLOR_PICKER_SHADE_INDEX = 3;

const COLOR_PICKER_COLORS = [
  ['#F8F9FA', '#E9ECEF', '#CED4DA', '#868E96', '#343A40', '#212529'],
  ['#F8FAFC', '#CBD5E1', '#94A3B8', '#475569', '#1E293B', '#0F172A'],
  ['#F8F1EE', '#EADDD7', '#D2BAB0', '#A18072', '#846358', '#5F463D'],
  ['#FFF0F6', '#FCC2D7', '#F783AC', '#E64980', '#C2255C', '#A61E4D'],
  ['#F3F0FF', '#D0BFFF', '#9775FA', '#7950F2', '#6741D9', '#5F3DC4'],
  ['#E3FAFC', '#99E9F2', '#3BC9DB', '#15AABF', '#0C8599', '#0B7285'],
  ['#F5EBE0', '#D5BDAF', '#B08968', '#7F5539', '#5E3023', '#3F1F17'],
  ['#FFF5F5', '#FFC9C9', '#FF8787', '#FA5252', '#E03131', '#C92A2A'],
  ['#F8F0FC', '#EEBEFA', '#DA77F2', '#BE4BDB', '#9C36B5', '#862E9C'],
  ['#EEF2FF', '#C7D2FE', '#818CF8', '#4F46E5', '#3730A3', '#312E81'],
  ['#E6FCF5', '#96F2D7', '#38D9A9', '#12B886', '#099268', '#087F5B'],
  ['#F4FCE3', '#D8F5A2', '#A9E34B', '#82C91E', '#66A80F', '#5C940D'],
  ['#FFF1F2', '#FECDD3', '#FB7185', '#F43F5E', '#BE123C', '#881337'],
  ['#FAF5FF', '#E9D5FF', '#C084FC', '#A855F7', '#7E22CE', '#581C87'],
  ['#E7F5FF', '#A5D8FF', '#4DABF7', '#228BE6', '#1971C2', '#1864AB'],
  ['#EBFBEE', '#B2F2BB', '#69DB7C', '#40C057', '#2F9E44', '#2B8A3E'],
  ['#FFF9DB', '#FFEC99', '#FFD43B', '#FAB005', '#F08C00', '#E67700'],
  ['#FFF4E6', '#FFD8A8', '#FFA94D', '#FD7E14', '#E8590C', '#D9480F'],
];

const ColorSwatch = ({ color, isActive, onClick }) => (
  <div
    className={`color-picker-swatch ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    <div
      className="color-picker-swatch-color"
      style={{ backgroundColor: color }}
    />
  </div>
);

const ColorPicker = ({ initialColor, onCancel, onSave }) => {
  const pickerRef = useRef(null);
  const [draftColor, setDraftColor] = useState(initialColor);

  const inputValue = draftColor.slice(1);
  const isInputValid = /^[0-9A-F]{6}$/.test(inputValue);
  const canSave = isInputValid && draftColor !== initialColor;
  const activeShades = COLOR_PICKER_COLORS.find((shades) => shades.includes(draftColor));
  const activeShadeIndex = activeShades?.indexOf(draftColor);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        onCancel();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const changeInput = (event) => {
    const nextInput = event.target.value.toUpperCase();

    setDraftColor(`#${nextInput}`);
  };

  const saveColor = () => {
    if (!canSave) return;

    onSave(draftColor);
  };

  return (
    <div
      ref={pickerRef}
      className="color-picker-popover"
    >
      <div className="color-picker-section">
        <div className="color-picker-section-title">Defaults</div>

        <div className="color-picker-defaults">
          {defaultColorPickerColors.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              isActive={color === draftColor}
              onClick={() => setDraftColor(color)}
            />
          ))}
        </div>
      </div>

      <div className="color-picker-section">
        <div className="color-picker-section-title">Colors</div>

        <div className="color-picker-grid">
          {COLOR_PICKER_COLORS.map((shades) => {
            const displayedColor = shades[activeShadeIndex ?? DEFAULT_COLOR_PICKER_SHADE_INDEX];
            const isActive = activeShades === shades;

            return (
              <ColorSwatch
                key={shades[0]}
                color={displayedColor}
                isActive={isActive}
                onClick={() => setDraftColor(displayedColor)}
              />
            );
          })}
        </div>
      </div>

      <div className="color-picker-section">
        <div className="color-picker-section-title">Shades</div>

        {activeShades ? (
          <div className="color-picker-shades">
            {activeShades.map((shade, index) => (
              <ColorSwatch
                key={shade}
                color={shade}
                isActive={activeShadeIndex === index}
                onClick={() => setDraftColor(shade)}
              />
            ))}
          </div>
        ) : (
          <div className="color-picker-empty-shades">
            No shades available...
          </div>
        )}
      </div>

      <div className="color-picker-section">
        <div className="color-picker-section-title">Hex code</div>

        <div className="color-picker-input-row">
          <div className="color-picker-input-wrapper">
            <span>#</span>
            <input
              value={inputValue}
              maxLength={6}
              spellCheck="false"
              onChange={changeInput}
            />
          </div>

          <div
            className={`color-picker-save ${canSave ? '' : 'disabled'}`}
            onClick={saveColor}
          >
            <IoCheckmark />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
