import './TextEditor.scss';

import React, { useRef, useEffect } from 'react';
import { colorList, widthList } from "../constants.js";
import { hslTextGradientStops, getCursorColor } from "./drawer/figures.js";

const TextEditor = ({
  textEditorContainer,
  handleTextEditorBlur,
}) => {
  const textAreaRef = useRef(null);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        textArea.blur();
      }
    };

    textArea.addEventListener('keydown', handleKeyDown);
    return () => {
      textArea.removeEventListener('keydown', handleKeyDown);
    };
  }, [textEditorContainer]);

  useEffect(() => {
    if (!textEditorContainer) { return }

    const textArea = textAreaRef.current;
    if (!textArea) { return }

    if (textEditorContainer.isActive) {
      if (textEditorContainer.text.length > 0) {
        textArea.innerText = textEditorContainer.text;

        selectTextArea(textArea);
        handleInput();
      }

      textArea.focus();
    } else {
      textArea.blur();
    }
  }, [textEditorContainer]);

  const onBlur = () => {
    const textArea = textAreaRef.current;
    if (!textArea) { return }

    const text = textArea.innerText || '';

    handleTextEditorBlur(text);
  };

  const handleInput = () => {
    const textArea = textAreaRef.current;
    if (!textArea) { return }

    if (colorList[textEditorContainer.colorIndex].name !== 'color_rainbow') {
      return;
    }

    const height = textArea.offsetHeight;

    const [_distance, hslStops] = hslTextGradientStops([0, 0], [0, height], textEditorContainer.rainbowColorDeg) // Vertical Gradient

    textArea.style.background = `linear-gradient(180deg, ${hslStops.join(", ")})`;
    textArea.style.webkitBackgroundClip = "text";
    textArea.style.webkitTextFillColor = "transparent";
  }

  const selectTextArea = (textArea) => {
    const sel = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(textArea);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  const top = textEditorContainer.startAt[1];
  const left = textEditorContainer.startAt[0];
  const color = getCursorColor(textEditorContainer.colorIndex, textEditorContainer.rainbowColorDeg);
  const fontSize = widthList[textEditorContainer.widthIndex].font_size;
  const scale = textEditorContainer.scale;

  return (
    <div
      id="contentEditable"
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck="false"
      ref={textAreaRef}
      onBlur={onBlur}
      onInput={handleInput}
      style={{
        top: top,
        left: left,
        color: color,
        fontSize: fontSize,
        transform: `scale(${scale})`,
      }}
    />
  );
};

export default TextEditor;
