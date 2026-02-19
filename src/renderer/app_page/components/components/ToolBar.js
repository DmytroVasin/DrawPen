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
    pen: <Icons.Brush />,
    fadepen: <Icons.MagicBrush />,
    arrow: <Icons.Arrow />,
    flat_arrow: <Icons.FlatArrow />,
    rectangle: <Icons.Rectangle />,
    oval: <Icons.Oval />,
    line: <Icons.Line />,
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
      case "flat_arrow":
        return "Flat Arrow";
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

  const isColorControlDisabled = ["laser", "eraser"].includes(activeTool);

  return (
    <aside id="toolbar" ref={toolbarRef} className={`${slide}`} style={{ left: position.x, top: position.y }}>
      <div className="toolbar__buttons">
        <button onClick={handleCloseToolBar} title="Close">
          <Icons.Close size={16} />
        </button>
        <div className="toolbar__buttons_dragger" onMouseDown={onMouseDown}></div>
      </div>

      <div className="toolbar__container">
        <div className="toolbar__body">
          <ul className="toolbar__items">
            <li className={brushList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickBrushOrSwitchView()}>
              <button title={renderBrushTitle()}>
                {allIcons[lastActiveBrush]}
              </button>
            </li>
            <li className={shapeList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickFigureOrSwitchView()}>
              <button title={renderFigureTitle()}>
                {allIcons[lastActiveFigure]}
              </button>
            </li>
            <li className={activeTool === "text" ? "active" : undefined} onClick={() => handleChangeTool("text")}>
              <button title="Text">
                <Icons.Text />
              </button>
            </li>
            <li className={activeTool === "highlighter" ? "active" : undefined} onClick={() => handleChangeTool("highlighter")}>
              <button title="Highlighter">
                <Icons.Highlighter />
              </button>
            </li>
            <li className={activeTool === "laser" ? "active" : undefined} onClick={() => handleChangeTool("laser")}>
              <button title="Laser">
                <Icons.Laser />
              </button>
            </li>
            <li className={activeTool === "eraser" ? "active" : undefined} onClick={() => handleChangeTool("eraser")}>
              <button title="Eraser">
                <Icons.Eraser />
              </button>
            </li>
            <li className="cross-line"></li>
            <li onClick={() => !isColorControlDisabled && setSlide("color-slide")}>
              <button
                className={`toolbar__color-picker ${colorList[activeColorIndex].name} color_tool_${activeTool}`}
                title="Change Color"
              />
            </li>
            <li onClick={() => setSlide("width-slide")}>
              <button className="toolbar__width-button" title="Change Brush Size">
                <div className={`${widthList[activeWidthIndex].name}`} />
              </button>
            </li>
          </ul>
        </div>

        <div className="side-view-body brush-group">
          <ul className="toolbar__items">
            <li className={activeTool === "pen" ? "active" : undefined} onClick={() => pickTool("pen")}>
              <button tabIndex={-1} title="Pen">
                <Icons.Brush />
              </button>
            </li>
            <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
              <button tabIndex={-1} title="Fade Pen">
                <Icons.MagicBrush />
              </button>
            </li>
          </ul>
        </div>

        <div className="side-view-body tool-group">
          <ul className="toolbar__items">
            <li className={activeTool === "arrow" ? "active" : undefined} onClick={() => pickTool("arrow")}>
              <button tabIndex={-1} title="Arrow">
                <Icons.Arrow />
              </button>
            </li>
            <li className={activeTool === "flat_arrow" ? "active" : undefined} onClick={() => pickTool("flat_arrow")}>
              <button tabIndex={-1} title="Flat Arrow">
                <Icons.FlatArrow />
              </button>
            </li>
            <li className={activeTool === "rectangle" ? "active" : undefined} onClick={() => pickTool("rectangle")}>
              <button tabIndex={-1} title="Rectangle">
                <Icons.Rectangle />
              </button>
            </li>
            <li className={activeTool === "oval" ? "active" : undefined} onClick={() => pickTool("oval")}>
              <button tabIndex={-1} title="Oval">
                <Icons.Oval />
              </button>
            </li>
            <li className={activeTool === "line" ? "active" : undefined} onClick={() => pickTool("line")}>
              <button tabIndex={-1} title="Line">
                <Icons.Line />
              </button>
            </li>
          </ul>
        </div>

        <div className="side-view-body color-group">
          <ul className="toolbar__items">
            {colorList.map((color, index) => (
              <li
                key={index}
                className={activeColorIndex === index ? "active" : undefined}
                onClick={() => onChangeColor(index)}
              >
                <button
                  className={`toolbar__color-picker ${color.name}`}
                  tabIndex={-1}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="side-view-body width-group">
          <ul className="toolbar__items">
            {widthList.map((width, index) => (
              <li
                key={index}
                className={activeWidthIndex === index ? "active" : undefined}
                onClick={() => onChangeWidth(index)}
              >
                <button
                  className="toolbar__width-button"
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
