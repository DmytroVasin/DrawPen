import './CuteCursor.css';

import React from 'react';

import {
  colorList,
  widthList,
} from '../constants.js'

const CuteCursor = ({
  mouseCoordinates,
  activeColorIndex,
  activeWidthIndex,
  activeTool,
  Icons
}) => {
  const getIconByToolName = (toolName) => {
    const iconColor = colorList[activeColorIndex].color;
    const iconSize = widthList[activeWidthIndex].cute_icon_size;
    const strokeWidth = '20';
    const strokeColor = '#FFF';
    const strokeWidthLaser = '10';

    const iconProps = {
      fill: iconColor,
      size: iconSize,
      style: { stroke: strokeColor, strokeWidth: strokeWidth },
    };

    switch (toolName) {
      case "laser":
        return <Icons.GiLaserburn size={iconSize} style={{ stroke: strokeColor, strokeWidth: strokeWidthLaser }} />
      case "flashlight":
        return <Icons.IoFlashlight size={iconSize} style={{ stroke: strokeColor, strokeWidth: strokeWidth }} />
      case "pen":
        return <Icons.FaPaintBrush {...iconProps} />
      case "arrow":
        return <Icons.FaArrowRight {...iconProps} />
      case "rectangle":
        return <Icons.FaRegSquare {...iconProps} />;
      case "oval":
        return <Icons.FaRegCircle {...iconProps} />;
      case "line":
        return <Icons.AiOutlineLine {...iconProps} />;
      default:
        null
    }
  };

  return (
    <div id='cursor' style={{ left: mouseCoordinates.x, top: mouseCoordinates.y }}>
      {getIconByToolName(activeTool)}
    </div>
  );
};

export default CuteCursor;
