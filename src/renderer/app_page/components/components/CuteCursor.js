import React from "react";
import "./CuteCursor.scss";
import { colorList, widthList } from "../constants.js"

const CuteCursor = ({
  mouseCoordinates,
  activeColorIndex,
  activeWidthIndex,
  activeTool,
  Icons
}) => {
  const renderIconByToolName = (toolName) => {
    const iconColor = colorList[activeColorIndex].color;
    const iconSize = widthList[activeWidthIndex].icon_size;

    let iconProps = {
      size: iconSize,
      fill: iconColor,
      stroke: '#FFF',
      strokeWidth: "20"
    };

    if (colorList[activeColorIndex].name === "color_white") {
      iconProps.stroke = '#777';
    }

    if (colorList[activeColorIndex].name === "color_rainbow") {
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
        return <Icons.FaEraser {...monochromeIconProps} />
      case "laser":
        return <Icons.GiLaserburn {...monochromeIconProps} />
      case "pen":
        return <Icons.FaPaintBrush {...iconProps} />
      case "fadepen":
        return <Icons.FaMagicPaintBrush {...iconProps} />
      case "arrow":
        return <Icons.FaArrowRight {...iconProps} />
      case "rectangle":
        return <Icons.FaRegSquare {...iconProps} />;
      case "oval":
        return <Icons.FaRegCircle {...iconProps} />;
      case "line":
        return <Icons.AiOutlineLine {...iconProps} />;
      case "text":
        return <Icons.FaFont {...iconProps} />;
      case "highlighter":
        return <Icons.FaHighlighter {...iconProps} />
      default:
        null
    }
  };

  let xPosition = mouseCoordinates.x + 15;
  let yPosition = mouseCoordinates.y - 25;

  return (
    <div id="cute_cursor" style={{ transform: `translate3d(${xPosition}px, ${yPosition}px, 0)` }}>
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
