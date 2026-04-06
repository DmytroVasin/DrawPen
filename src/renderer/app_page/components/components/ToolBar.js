import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import { brushList, shapeList, colorList, widthList } from "../constants.js";

const STICKY_DISTANCE = 15;
const ZONE_BORDER = 10; // Equals to "--border-size"*2

const ToolBar = ({
  position,
  setPosition,
  toolbarSlide,
  setToolbarSlide,
  isCollapsed,
  setIsCollapsed,
  lastActiveBrush,
  lastActiveFigure,
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleCloseToolBar,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
  handleClearDesk,
  handleEnablePointerMode,
  Icons,
}) => {
  const allIcons = {
    pen: <Icons.Brush />,
    fadepen: <Icons.MagicBrush />,
    arrow: <Icons.Arrow />,
    flat_arrow: <Icons.FlatArrow />,
    rectangle: <Icons.Rectangle />,
    oval: <Icons.Oval />,
    line: <Icons.Line />,
    text: <Icons.Text />,
    highlighter: <Icons.Highlighter />,
    laser: <Icons.Laser />,
    eraser: <Icons.Eraser />,
  };

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef();

  const clampPosition = useCallback((x, y, withSticky = false) => {
    const toInt = (value) => Math.trunc(value);

    if (!toolbarRef.current) {
      return { x: toInt(x), y: toInt(y) };
    }

    const toolbarWidth = toolbarRef.current.offsetWidth;
    const toolbarHeight = toolbarRef.current.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const minX = ZONE_BORDER;
    const minY = ZONE_BORDER;
    const maxX = Math.max(ZONE_BORDER, windowWidth - ZONE_BORDER - toolbarWidth);
    const maxY = Math.max(ZONE_BORDER, windowHeight - ZONE_BORDER - toolbarHeight);

    if (!withSticky) {
      return {
        x: toInt(Math.min(Math.max(x, minX), maxX)),
        y: toInt(Math.min(Math.max(y, minY), maxY)),
      };
    }

    const leftEdge = STICKY_DISTANCE + ZONE_BORDER;
    const topEdge = STICKY_DISTANCE + ZONE_BORDER;
    const rightEdge = windowWidth - ZONE_BORDER - STICKY_DISTANCE;
    const bottomEdge = windowHeight - ZONE_BORDER - STICKY_DISTANCE;

    let nextX = x;
    let nextY = y;

    if (nextX < leftEdge) {
      nextX = minX;
    } else if (nextX + toolbarWidth > rightEdge) {
      nextX = maxX;
    }

    if (nextY < topEdge) {
      nextY = minY;
    } else if (nextY + toolbarHeight > bottomEdge) {
      nextY = maxY;
    }

    return { x: toInt(nextX), y: toInt(nextY) };
  }, []);

  const onPointerDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;

    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;

    setPosition(clampPosition(newX, newY, true));
  }, [dragging, offset, clampPosition, setPosition]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    setPosition((prev) => clampPosition(prev.x, prev.y));
  }, [position.x, position.y, clampPosition, setPosition]);

  useEffect(() => {
    const toolbarElement = toolbarRef.current;
    if (!toolbarElement) {
      return;
    }

    let frameId = null;

    const applyClamp = () => {
      setPosition((prev) => {
        const clamped = clampPosition(prev.x, prev.y);
        if (clamped.x === prev.x && clamped.y === prev.y) {
          return prev;
        }

        return clamped;
      });
    };

    const scheduleClamp = () => {
      if (frameId) {
        return;
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        applyClamp();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleClamp);
    resizeObserver.observe(toolbarElement);

    scheduleClamp();
    // window.addEventListener("resize", scheduleClamp);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      resizeObserver.disconnect();
      // window.removeEventListener("resize", scheduleClamp);
    };
  }, [clampPosition, setPosition]);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  const pickTool = (tool) => {
    handleChangeTool(tool);
    setToolbarSlide("main-slide")
  };

  const onChangeColor = (index) => {
    handleChangeColor(index);
    setToolbarSlide("main-slide")
  };

  const onChangeWidth = (index) => {
    handleChangeWidth(index);
    setToolbarSlide("main-slide")
  };

  const renderToolTitle = (tool) => {
    switch (tool) {
      case "pen":
        return "Pen";
      case "fadepen":
        return "Fade Pen";
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
      case "text":
        return "Text";
      case "highlighter":
        return "Highlighter";
      case "laser":
        return "Laser";
      case "eraser":
        return "Eraser";
      default:
        return "Tool";
    }
  };

  const pickFigureOrSwitchView = () => {
    if (shapeList.includes(activeTool)) {
      setToolbarSlide("tool-slide");
    } else {
      pickTool(lastActiveFigure);
    }
  };

  const pickBrushOrSwitchView = () => {
    if (brushList.includes(activeTool)) {
      setToolbarSlide("brush-slide");
    } else {
      pickTool(lastActiveBrush);
    }
  };

  const handleToggleCollapsed = () => {
    setIsCollapsed((prev) => !prev);
  };

  const isColorControlDisabled = ["laser", "eraser"].includes(activeTool);
  return (
    <aside
      id="toolbar"
      ref={toolbarRef}
      className={`${toolbarSlide}${isCollapsed ? " toolbar--collapsed" : ""}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="toolbar__mode-switcher">
        <div className="toolbar__draglines" onPointerDown={onPointerDown}>
          <div className="draglines">
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>

        <div className="toolbar__main-button">
          <button tabIndex={-1} title="Pointer Mode" onClick={handleEnablePointerMode}>
            <Icons.DrawModeEnabled />
          </button>
        </div>

        <div className="toolbar__draglines" onPointerDown={onPointerDown}>
          <div className="draglines">
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>

      <div className="toolbar__container">
        <div className="toolbar__panels-track">
          <div className="toolbar__panel toolbar__panel--full">
            <div className="toolbar__body">
              <ul className="toolbar__items">
                <li className={brushList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickBrushOrSwitchView()}>
                  <button tabIndex={-1} title={renderToolTitle(lastActiveBrush)}>
                    {allIcons[lastActiveBrush]}
                  </button>
                </li>
                <li className={shapeList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickFigureOrSwitchView()}>
                  <button tabIndex={-1} title={renderToolTitle(lastActiveFigure)}>
                    {allIcons[lastActiveFigure]}
                  </button>
                </li>
                <li className={activeTool === "text" ? "active" : undefined} onClick={() => handleChangeTool("text")}>
                  <button tabIndex={-1} title={renderToolTitle("text")}>
                    <Icons.Text />
                  </button>
                </li>
                <li className={activeTool === "highlighter" ? "active" : undefined} onClick={() => handleChangeTool("highlighter")}>
                  <button tabIndex={-1} title={renderToolTitle("highlighter")}>
                    <Icons.Highlighter />
                  </button>
                </li>
                <li className={activeTool === "laser" ? "active" : undefined} onClick={() => handleChangeTool("laser")}>
                  <button tabIndex={-1} title={renderToolTitle("laser")}>
                    <Icons.Laser />
                  </button>
                </li>
                <li className={activeTool === "eraser" ? "active" : undefined} onClick={() => handleChangeTool("eraser")}>
                  <button tabIndex={-1} title={renderToolTitle("eraser")}>
                    <Icons.Eraser />
                  </button>
                </li>
                <li className="cross-line"></li>
                <li onClick={() => !isColorControlDisabled && setToolbarSlide("color-slide")}>
                  <button tabIndex={-1} className={`toolbar__color-picker ${colorList[activeColorIndex].name} color_tool_${activeTool}`} title="Color" />
                </li>
                <li onClick={() => setToolbarSlide("width-slide")}>
                  <button tabIndex={-1} className={`toolbar__width-picker ${widthList[activeWidthIndex].name}`} title="Brush Size">
                    <div />
                  </button>
                </li>
                <li className="cross-line"></li>
                <li onClick={handleClearDesk}>
                  <button tabIndex={-1} title="Clear Desk">
                    <Icons.Trash />
                  </button>
                </li>
              </ul>
            </div>

          <div className="side-view-body brush-group">
            <ul className="toolbar__items">
              <li className={activeTool === "pen" ? "active" : undefined} onClick={() => pickTool("pen")}>
                <button tabIndex={-1} title={renderToolTitle("pen")}>
                  <Icons.Brush />
                </button>
              </li>
              <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
                <button tabIndex={-1} title={renderToolTitle("fadepen")}>
                  <Icons.MagicBrush />
                </button>
              </li>
            </ul>
          </div>

          <div className="side-view-body tool-group">
            <ul className="toolbar__items">
              <li className={activeTool === "arrow" ? "active" : undefined} onClick={() => pickTool("arrow")}>
                <button tabIndex={-1} title={renderToolTitle("arrow")}>
                  <Icons.Arrow />
                </button>
              </li>
              <li className={activeTool === "flat_arrow" ? "active" : undefined} onClick={() => pickTool("flat_arrow")}>
                <button tabIndex={-1} title={renderToolTitle("flat_arrow")}>
                  <Icons.FlatArrow />
                </button>
              </li>
              <li className={activeTool === "rectangle" ? "active" : undefined} onClick={() => pickTool("rectangle")}>
                <button tabIndex={-1} title={renderToolTitle("rectangle")}>
                  <Icons.Rectangle />
                </button>
              </li>
              <li className={activeTool === "oval" ? "active" : undefined} onClick={() => pickTool("oval")}>
                <button tabIndex={-1} title={renderToolTitle("oval")}>
                  <Icons.Oval />
                </button>
              </li>
              <li className={activeTool === "line" ? "active" : undefined} onClick={() => pickTool("line")}>
                <button tabIndex={-1} title={renderToolTitle("line")}>
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
                  <button tabIndex={-1} className={`toolbar__color-picker ${color.name}`} />
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
                  <button tabIndex={-1} className={`toolbar__width-picker ${width.name}`}>
                    <div />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          </div>

          <div className="toolbar__panel toolbar__panel--mini">
            <div className="toolbar__body">
              <ul className="toolbar__items">
                <li className="active" onClick={handleToggleCollapsed}>
                  <button tabIndex={-1} title={renderToolTitle(activeTool)}>
                    {allIcons[activeTool]}
                  </button>
                </li>

                <div className="toolbar__color-hint-wrapper" onClick={handleToggleCollapsed}>
                  <div className={`toolbar__color-hint color_tool_${activeTool} ${colorList[activeColorIndex].name} ${widthList[activeWidthIndex].name}`}></div>
                </div>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="toolbar__slider" onClick={handleToggleCollapsed}>
        {
          isCollapsed ? <Icons.AngleRight /> : <Icons.AngleLeft />
        }
      </div>

      <div className="toolbar__close">
        <button tabIndex={-1} onClick={handleCloseToolBar}>
          <Icons.Close size={16} />
        </button>
      </div>
    </aside>
  );
};

export default ToolBar;
