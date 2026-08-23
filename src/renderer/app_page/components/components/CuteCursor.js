import React from "react";
import "./CuteCursor.scss";
import {
  eraserTailColor,
  highlighterAlpha,
  shapeList,
  widthList,
  brushList,
} from "../constants.js";
import { getCursorColor } from "./drawer/figures.js";

const CuteCursor = ({
  mouseCoordinates,
  activeColorIndex,
  activeWidthIndex,
  activeTool,
  Icons,
  colorList,
  rainbowColorDeg,
  cuteCursorMode,
}) => {
  if (mouseCoordinates.x === 0 && mouseCoordinates.y === 0) {
    return null;
  }

  const getDotSize = () => {
    const widthInfo = widthList[activeWidthIndex];

    if (activeTool === 'highlighter') return widthInfo.highlighter_width;
    if (activeTool === 'laser') return widthInfo.laser_width[1];
    if (activeTool === 'eraser') return widthInfo.figure_size;
    if (shapeList.includes(activeTool)) return widthInfo.figure_size;
    if (brushList.includes(activeTool) && colorList[activeColorIndex].isRainbow) return widthInfo.rainbow_pen_width;

    return widthInfo.pen_width;
  };

  const getDotColor = () => {
    if (activeTool === 'laser') return '#EA3323CC';
    if (activeTool === 'eraser') return eraserTailColor;

    return getCursorColor(colorList, activeColorIndex, rainbowColorDeg);
  };

  const renderIconByToolName = (toolName) => {
    const iconColor = colorList[activeColorIndex].color;
    const iconSize = widthList[activeWidthIndex].icon_size;

    let iconProps = {
      size: iconSize,
      fill: iconColor,
      stroke: '#FFF',
      strokeWidth: "20"
    };

    if (colorList[activeColorIndex].isLightColor) {
      iconProps.stroke = '#777';
    }

    if (colorList[activeColorIndex].isRainbow) {
      iconProps = {
        size: iconSize,
        fill: "url(#svg-gradient)",
        stroke: '#777',
        strokeWidth: "10"
      };
    }

    const monochromeIconProps = {
      size: iconSize,
      fill: '#333',
      stroke: "#DDD",
      strokeWidth: "10",
    }

    switch (toolName) {
      case "eraser":
        return <Icons.Eraser {...monochromeIconProps} />
      case "laser":
        return <Icons.Laser {...monochromeIconProps} />
      case "pen":
        return <Icons.Brush {...iconProps} />
      case "fadepen":
        return <Icons.MagicBrush {...iconProps} />
      case "arrow":
        return <Icons.Arrow {...iconProps} />
      case "flat_arrow":
        return <Icons.FlatArrow {...iconProps} />
      case "rectangle":
        return <Icons.Rectangle {...iconProps} />;
      case "oval":
        return <Icons.Oval {...iconProps} />;
      case "line":
        return <Icons.Line {...iconProps} />;
      case "text":
        return <Icons.Text {...iconProps} />;
      case "highlighter":
        return <Icons.Highlighter {...iconProps} />
      default:
        return null
    }
  };

  let xPosition = mouseCoordinates.x + 15;
  let yPosition = mouseCoordinates.y - 25;

  const fadeClassName = cuteCursorMode === 'fade' ? 'fade' : '';

  if (cuteCursorMode === 'dot') {
    const dotSize = getDotSize();
    const dotColor = getDotColor();
    const dotOpacity = activeTool === 'highlighter' ? highlighterAlpha : 1;

    return (
      <div
        id="cute_cursor"
        className="dot"
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: dotColor,
          opacity: dotOpacity,
          transform: `translate3d(${mouseCoordinates.x}px, ${mouseCoordinates.y}px, 0)`,
        }}
      ></div>
    );
  }

  return (
    <div id="cute_cursor" className={fadeClassName} style={{ transform: `translate3d(${xPosition}px, ${yPosition}px, 0)` }}>
      <svg width="0" height="0">
        <linearGradient id="svg-gradient" gradientTransform="rotate(350)">
          <stop stopColor="red"    offset="0%" />
          <stop stopColor="orange" offset="20%" />
          <stop stopColor="yellow" offset="40%" />
          <stop stopColor="lime"   offset="60%" />
          <stop stopColor="aqua"   offset="70%" />
          <stop stopColor="blue"   offset="90%" />
        </linearGradient>
      </svg>
      { renderIconByToolName(activeTool) }
    </div>
  );
};

export default CuteCursor;
