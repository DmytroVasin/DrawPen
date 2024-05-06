import './ToolBar.css';

import React from 'react';
import {
  colorList,
  widthList,
} from '../constants.js'

const ToolBar = ({
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleReset,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
}) => {
  // console.log('ToolBar render');
  const onChangeTool = (event) => {
    handleChangeTool(event.target.name)
  }

  const onChangeColor = () => {
    const newColorIndex = (activeColorIndex + 1) % colorList.length

    handleChangeColor(newColorIndex)
  }

  const onChangeWidth = () => {
    const newWidthIndex = (activeWidthIndex + 1) % widthList.length

    handleChangeWidth(newWidthIndex)
  }

  return (
    <div id='toolbar'>
      <button onClick={handleReset}>Clear</button>
      <button
        id="colorPicker"
        onClick={onChangeColor}
        style={{ backgroundColor: colorList[activeColorIndex].color }}
      />
      <button
        id="brushWidth"
        onClick={onChangeWidth}
        style={{ width: `${widthList[activeWidthIndex].width * 4}px` }}
      />
      <button
        id="tool-flashlight"
        name='flashlight'
        className={`tool ${activeTool === 'flashlight' && 'active'}`}
        onClick={onChangeTool}
      >
        flashlight
      </button>
      <button
        id="tool-pen"
        name='pen'
        className={`tool ${activeTool === 'pen' && 'active'}`}
        onClick={onChangeTool}
      >
        pen
      </button>
      <button
        id="tool-line"
        name='line'
        className={`tool ${activeTool === 'line' && 'active'}`}
        onClick={onChangeTool}
      >
        line
      </button>
      <button
        id="tool-arrow"
        name='arrow'
        className={`tool ${activeTool === 'arrow' && 'active'}`}
        onClick={onChangeTool}
      >
        arrow
      </button>
      <button
        id="tool-oval"
        name='oval'
        className={`tool ${activeTool === 'oval' && 'active'}`}
        onClick={onChangeTool}
      >
        oval
      </button>
      <button
        id="tool-rectangle"
        name='rectangle'
        className={`tool ${activeTool === 'rectangle' && 'active'}`}
        onClick={onChangeTool}
      >
        rectangle
      </button>
      <button
        id="tool-laser"
        name='laser'
        className={`tool ${activeTool === 'laser' && 'active'}`}
        onClick={onChangeTool}
      >
        laser
      </button>
    </div>
  );
};

export default ToolBar;
