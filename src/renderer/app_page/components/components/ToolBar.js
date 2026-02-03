import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import { brushList, shapeList, colorList, widthList } from "../constants.js";

const STICKY_DISTANCE = 15;
const ZONE_BORDER = 5; // Equals to "--border-size"

const ToolBar = ({
  position,
  setPosition,
  lastActiveBrush,
  lastActiveFigure,
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleCloseToolBar,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
  Icons,
}) => {

  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const allIcons = {
    pen: <Icons.FaPaintBrush />,
    fadepen: <Icons.FaMagicPaintBrush />,
    arrow: <Icons.FaArrowRight />,
    rectangle: <Icons.FaRegSquare />,
    oval: <Icons.FaRegCircle />,
    line: <Icons.AiOutlineLine />,
  };

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef()
  const [slide, setSlide] = useState("");

  const onMouseDown = useCallback((e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }, [position]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;

    let newX = e.clientX - offset.x;
    let newY = e.clientY - offset.y;

    const toolbarWidth = toolbarRef.current.offsetWidth;
    const toolbarHeight = toolbarRef.current.offsetHeight;

    const leftEdge = STICKY_DISTANCE + ZONE_BORDER;
    const topEdge = STICKY_DISTANCE + ZONE_BORDER;
    const rightEdge = windowWidth - ZONE_BORDER - STICKY_DISTANCE;
    const bottomEdge = windowHeight - ZONE_BORDER - STICKY_DISTANCE;

    const minX = ZONE_BORDER;
    const minY = ZONE_BORDER;
    const maxX = windowWidth - ZONE_BORDER - toolbarWidth;
    const maxY = windowHeight - ZONE_BORDER - toolbarHeight;

    if (newX < leftEdge) {
      newX = minX;
    } else if (newX + toolbarWidth > rightEdge) {
      newX = maxX;
    }

    if (newY < topEdge) {
      newY = minY;
    } else if (newY + toolbarHeight > bottomEdge) {
      newY = maxY;
    }

    setPosition({ x: newX, y: newY });
  }, [dragging, offset]);

  const onMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const onKeyDown = useCallback((e) => {
    switch (e.key) {
      case "Escape":
        setSlide("");
        break;
    }
  }, [setSlide]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onMouseMove, onMouseUp, onKeyDown]);

  useEffect(() => {
    setSlide("");
  }, [activeTool, activeColorIndex, activeWidthIndex]);

  const pickTool = (tool) => {
    handleChangeTool(tool);
    setSlide("")
  };

  const onChangeColor = (index) => {
    handleChangeColor(index);
    setSlide("")
  };

  const onChangeWidth = (index) => {
    handleChangeWidth(index);
    setSlide("")
  };

  const renderFigureTitle = () => {
    switch (lastActiveFigure) {
      case "arrow":
        return "Arrow";
      case "rectangle":
        return "Rectangle";
      case "oval":
        return "Oval";
      case "line":
        return "Line";
      default:
        return "Shape";
    }
  };

  const renderBrushTitle = () => {
    switch (lastActiveBrush) {
      case "pen":
        return "Pen";
      case "fadepen":
        return "Fade Pen";
      default:
        return "Brush";
    }
  };

  const pickFigureOrSwitchView = () => {
    if (shapeList.includes(activeTool)) {
      setSlide("tool-slide");
    } else {
      pickTool(lastActiveFigure);
    }
  };

  const pickBrushOrSwitchView = () => {
    if (brushList.includes(activeTool)) {
      setSlide("brush-slide");
    } else {
      pickTool(lastActiveBrush);
    }
  };

  return (
    <aside id="toolbar" ref={toolbarRef} className={`${slide}`} style={{ left: position.x, top: position.y }}>
      <div className="toolbar__buttons">
        <button onClick={handleCloseToolBar} title="Close">
          <Icons.MdOutlineCancel size={16} />
        </button>
      </div>

      <div className="toolbar__container">
        <div className="toolbar__body">
          <ul className="toolbar__items">
            <li className={brushList.includes(activeTool) ? "active more_figures" : undefined}>
              <button onClick={() => pickBrushOrSwitchView()} title={renderBrushTitle()}>
                {allIcons[lastActiveBrush]}
              </button>
            </li>
            <li className={shapeList.includes(activeTool) ? "active more_figures" : undefined}>
              <button onClick={() => pickFigureOrSwitchView()} title={renderFigureTitle()}>
                {allIcons[lastActiveFigure]}
              </button>
            </li>
            <li className={activeTool === "text" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("text")} title="Text">
                <Icons.FaFont />
              </button>
            </li>
            <li className={activeTool === "highlighter" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("highlighter")} title="Highlighter">
                <Icons.FaHighlighter />
              </button>
            </li>
            <li className={activeTool === "laser" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("laser")} title="Laser">
                <Icons.GiLaserburn />
              </button>
            </li>
            <li className={activeTool === "eraser" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("eraser")} title="Eraser">
                <Icons.FaEraser />
              </button>
            </li>
            <li className="cross-line"></li>
            <li>
              <button
                className={`toolbar__color-picker ${colorList[activeColorIndex].name} color_tool_${activeTool}`}
                onClick={() => setSlide("color-slide")}
                title="Change Color"
                disabled={["laser", "eraser"].includes(activeTool)}
              />
            </li>
            <li>
              <button className="toolbar__width-button" onClick={() => setSlide("width-slide")} title="Change Brush Size">
                <div className={`${widthList[activeWidthIndex].name}`} />
              </button>
            </li>
          </ul>
        </div>

        <div className="side-view-body brush-group">
          <ul className="toolbar__items">
            <li className={activeTool === "pen" ? "active" : undefined}>
              <button onClick={() => pickTool("pen")} tabIndex={-1} title="Pen">
                <Icons.FaPaintBrush />
              </button>
            </li>
            <li className={activeTool === "fadepen" ? "active" : undefined}>
              <button onClick={() => pickTool("fadepen")} tabIndex={-1} title="Fade Pen">
                <Icons.FaMagicPaintBrush />
              </button>
            </li>
          </ul>
        </div>

        <div className="side-view-body tool-group">
          <ul className="toolbar__items">
            <li className={activeTool === "arrow" ? "active" : undefined}>
              <button onClick={() => pickTool("arrow")} tabIndex={-1} title="Arrow">
                <Icons.FaArrowRight />
              </button>
            </li>
            <li className={activeTool === "rectangle" ? "active" : undefined}>
              <button onClick={() => pickTool("rectangle")} tabIndex={-1} title="Rectangle">
                <Icons.FaRegSquare />
              </button>
            </li>
            <li className={activeTool === "oval" ? "active" : undefined}>
              <button onClick={() => pickTool("oval")} tabIndex={-1} title="Oval">
                <Icons.FaRegCircle />
              </button>
            </li>
            <li className={activeTool === "line" ? "active" : undefined}>
              <button onClick={() => pickTool("line")} tabIndex={-1} title="Line">
                <Icons.AiOutlineLine />
              </button>
            </li>
          </ul>
        </div>

        <div className="side-view-body color-group">
          <ul className="toolbar__items">
            {colorList.map((color, index) => (
              <li key={index}>
                <button
                  className={`toolbar__color-picker ${color.name}`}
                  onClick={() => onChangeColor(index)}
                  tabIndex={-1}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="side-view-body width-group">
          <ul className="toolbar__items">
            {widthList.map((width, index) => (
              <li key={index}>
                <button
                  className="toolbar__width-button"
                  onClick={() => onChangeWidth(index)}
                  tabIndex={-1}
                >
                  <div className={width.name} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="toolbar__draglines" onMouseDown={onMouseDown}>
        <div className="draglines">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    </aside>
  );
};

export default ToolBar;
