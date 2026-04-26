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

  const renderShortcutTitle = (title, ...shortcuts) => {
    const titleShortcuts = shortcuts.filter(Boolean);

    return titleShortcuts.length ? `${title} — ${titleShortcuts.join(" or ")}` : title;
  };

  const renderToolTitle = (tool, ...shortcuts) => {
    const toolTitles = {
      pen:         ["Pen",         "P"],
      fadepen:     ["Fade Pen",    "P"],
      arrow:       ["Arrow",       "A"],
      flat_arrow:  ["Flat Arrow",  "A"],
      rectangle:   ["Rectangle",   "R"],
      oval:        ["Oval",        "O"],
      line:        ["Line"],
      text:        ["Text",        "T"],
      highlighter: ["Highlighter", "H"],
      laser:       ["Laser",       "L"],
      eraser:      ["Eraser",      "E"],
    };

    const [title, ...toolShortcuts] = toolTitles[tool] || ["Tool"];

    return renderShortcutTitle(title, ...toolShortcuts, ...shortcuts);
  };

  const renderMainToolTitle = (tool) => {
    if (brushList.includes(tool)) return renderToolTitle(tool, "1");
    if (shapeList.includes(tool)) return renderToolTitle(tool, "2");
    if (tool === "text") return renderToolTitle(tool, "3");
    if (tool === "highlighter") return renderToolTitle(tool, "4");
    if (tool === "laser") return renderToolTitle(tool, "5");
    if (tool === "eraser") return renderToolTitle(tool, "6");

    return renderToolTitle(tool);
  };

  const renderColorTitle = (color, index) => {
    return renderShortcutTitle(color.title, String(index + 1));
  };

  const renderWidthTitle = (width, index) => {
    return renderShortcutTitle(width.title, String(index + 1));
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
                  <button tabIndex={-1} title={renderMainToolTitle(lastActiveBrush)}>
                    {allIcons[lastActiveBrush]}
                  </button>
                </li>
                <li className={shapeList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickFigureOrSwitchView()}>
                  <button tabIndex={-1} title={renderMainToolTitle(lastActiveFigure)}>
                    {allIcons[lastActiveFigure]}
                  </button>
                </li>
                <li className={activeTool === "text" ? "active" : undefined} onClick={() => handleChangeTool("text")}>
                  <button tabIndex={-1} title={renderMainToolTitle("text")}>
                    <Icons.Text />
                  </button>
                </li>
                <li className={activeTool === "highlighter" ? "active" : undefined} onClick={() => handleChangeTool("highlighter")}>
                  <button tabIndex={-1} title={renderMainToolTitle("highlighter")}>
                    <Icons.Highlighter />
                  </button>
                </li>
                <li className={activeTool === "laser" ? "active" : undefined} onClick={() => handleChangeTool("laser")}>
                  <button tabIndex={-1} title={renderMainToolTitle("laser")}>
                    <Icons.Laser />
                  </button>
                </li>
                <li className={activeTool === "eraser" ? "active" : undefined} onClick={() => handleChangeTool("eraser")}>
                  <button tabIndex={-1} title={renderMainToolTitle("eraser")}>
                    <Icons.Eraser />
                  </button>
                </li>
                <li className="cross-line"></li>
                <li onClick={() => !isColorControlDisabled && setToolbarSlide("color-slide")}>
                  <button tabIndex={-1} className={`toolbar__color-picker ${colorList[activeColorIndex].name} color_tool_${activeTool}`} title={isColorControlDisabled ? "Color" : renderShortcutTitle("Color", "7")} />
                </li>
                <li onClick={() => setToolbarSlide("width-slide")}>
                  <button tabIndex={-1} className={`toolbar__width-picker ${widthList[activeWidthIndex].name}`} title={renderShortcutTitle("Brush Size", "8")}>
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
                <button tabIndex={-1} title={renderToolTitle("pen", "1")}>
                  <Icons.Brush />
                </button>
              </li>
              <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
                <button tabIndex={-1} title={renderToolTitle("fadepen", "2")}>
                  <Icons.MagicBrush />
                </button>
              </li>
            </ul>
          </div>

          <div className="side-view-body tool-group">
            <ul className="toolbar__items">
              <li className={activeTool === "arrow" ? "active" : undefined} onClick={() => pickTool("arrow")}>
                <button tabIndex={-1} title={renderToolTitle("arrow", "1")}>
                  <Icons.Arrow />
                </button>
              </li>
              <li className={activeTool === "flat_arrow" ? "active" : undefined} onClick={() => pickTool("flat_arrow")}>
                <button tabIndex={-1} title={renderToolTitle("flat_arrow", "2")}>
                  <Icons.FlatArrow />
                </button>
              </li>
              <li className={activeTool === "rectangle" ? "active" : undefined} onClick={() => pickTool("rectangle")}>
                <button tabIndex={-1} title={renderToolTitle("rectangle", "3")}>
                  <Icons.Rectangle />
                </button>
              </li>
              <li className={activeTool === "oval" ? "active" : undefined} onClick={() => pickTool("oval")}>
                <button tabIndex={-1} title={renderToolTitle("oval", "4")}>
                  <Icons.Oval />
                </button>
              </li>
              <li className={activeTool === "line" ? "active" : undefined} onClick={() => pickTool("line")}>
                <button tabIndex={-1} title={renderToolTitle("line", "5")}>
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
                  <button tabIndex={-1} className={`toolbar__color-picker ${color.name}`} title={renderColorTitle(color, index)} />
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
                  <button tabIndex={-1} className={`toolbar__width-picker ${width.name}`} title={renderWidthTitle(width, index)}>
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
                  <button tabIndex={-1} title={renderMainToolTitle(activeTool)}>
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
