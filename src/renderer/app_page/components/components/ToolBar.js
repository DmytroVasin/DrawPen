import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import { brushList, shapeList, shortcutHintHoldDelayMs, widthList } from "../constants.js";

const STICKY_DISTANCE = 15;
const ZONE_BORDER = 10; // Equals to "--border-size"*2

const humanizedKey = (key) => {
  const keyMap = {
    Meta: "⌘",
    Control: "⌃",
    Alt: "⌥",
    Shift: "⇧",
  };

  return keyMap[key] || key;
};

const humanizedShortcut = (shortcut) => {
  if (!shortcut) return null
  if (shortcut === '[NULL]') return null

  return shortcut.split("+").map(humanizedKey).join("");
};

const ToolBar = ({
  position,
  setPosition,
  toolbarSlide,
  setToolbarSlide,
  isCollapsed,
  setIsCollapsed,
  shortcutHintsDisabled,
  clearDeskShortcut,
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
  handlePositionCommit,
  Icons,
  colorList,
}) => {
  const toolConfig = {
    pen:         { title: "Pen",         alias: "P", mainPanel: "1", subPanel: "1" },
    fadepen:     { title: "Fade Pen",    alias: "P", mainPanel: "1", subPanel: "2" },
    arrow:       { title: "Arrow",       alias: "A", mainPanel: "2", subPanel: "1" },
    flat_arrow:  { title: "Flat Arrow",  alias: "A", mainPanel: "2", subPanel: "2" },
    rectangle:   { title: "Rectangle",   alias: "R", mainPanel: "2", subPanel: "3" },
    oval:        { title: "Oval",        alias: "O", mainPanel: "2", subPanel: "4" },
    line:        { title: "Line",                    mainPanel: "2", subPanel: "5" },
    text:        { title: "Text",        alias: "T", mainPanel: "3" },
    highlighter: { title: "Highlighter", alias: "H", mainPanel: "4" },
    laser:       { title: "Laser",       alias: "L", mainPanel: "5" },
    eraser:      { title: "Eraser",      alias: "E", mainPanel: "6" },
    color:       { title: "Color",                   mainPanel: "7", disabledFor: ["laser", "eraser"] },
    brushSize:   { title: "Brush Size",              mainPanel: "8" },
    clearDesk:   { title: "Clear Desk",              mainPanel: humanizedShortcut(clearDeskShortcut) },
  };

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

  const activeColor = colorList[activeColorIndex];

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const [shortcutHintRevealCount, setShortcutHintRevealCount] = useState(0);

  const toolbarRef = useRef();
  const shortcutHintTimerRef = useRef(null);

  const clearShortcutHintTimer = useCallback(() => {
    if (!shortcutHintTimerRef.current) return;

    clearTimeout(shortcutHintTimerRef.current);
    shortcutHintTimerRef.current = null;
  }, []);

  const hideShortcutHints = useCallback(() => {
    clearShortcutHintTimer();
    setShowShortcutHints(false);
  }, [clearShortcutHintTimer]);

  const handleShortcutHintKeyDown = useCallback((event) => {
    const eventRepeat = event.repeat;

    if (event.key !== "Meta" && event.key !== "Control") {
      hideShortcutHints();
      return;
    }

    if (eventRepeat) return;

    const hasOtherModifier = event.altKey || event.shiftKey || (event.ctrlKey && event.metaKey);

    if (hasOtherModifier || shortcutHintsDisabled || isCollapsed) {
      hideShortcutHints();
      return;
    }

    clearShortcutHintTimer();
    shortcutHintTimerRef.current = window.setTimeout(() => {
      shortcutHintTimerRef.current = null;
      setShortcutHintRevealCount((count) => count + 1);
      setShowShortcutHints(true);
    }, shortcutHintHoldDelayMs);
  }, [clearShortcutHintTimer, hideShortcutHints, isCollapsed, shortcutHintsDisabled]);

  const handleShortcutHintKeyUp = useCallback((event) => {
    if (event.metaKey) return;
    if (event.ctrlKey) return;

    hideShortcutHints();
  }, [hideShortcutHints]);

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
    if (!dragging) return;

    handlePositionCommit(position);
    setDragging(false);
  }, [dragging, position, handlePositionCommit]);

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

  useEffect(() => {
    window.addEventListener("keydown", handleShortcutHintKeyDown);
    window.addEventListener("keyup", handleShortcutHintKeyUp);
    window.addEventListener("blur", hideShortcutHints);
    document.addEventListener("visibilitychange", hideShortcutHints);

    return () => {
      window.removeEventListener("keydown", handleShortcutHintKeyDown);
      window.removeEventListener("keyup", handleShortcutHintKeyUp);
      window.removeEventListener("blur", hideShortcutHints);
      document.removeEventListener("visibilitychange", hideShortcutHints);
      clearShortcutHintTimer();
    };
  }, [clearShortcutHintTimer, handleShortcutHintKeyDown, handleShortcutHintKeyUp, hideShortcutHints]);

  useEffect(() => {
    if (!shortcutHintsDisabled && !isCollapsed) return;

    hideShortcutHints();
  }, [hideShortcutHints, isCollapsed, shortcutHintsDisabled]);

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

  const renderToolTitle = (tool, shortcutType) => {
    const config = toolConfig[tool];

    return renderShortcutTitle(config.title, config.alias, config[shortcutType]);
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

  const renderToolShortcutHint = (tool, shortcutType) => {
    const config = toolConfig[tool];
    const shortcut = config[shortcutType];

    if (!config.alias) return shortcut;
    if (shortcutHintRevealCount % 2 === 0) return config.alias;

    return shortcut;
  };

  const isColorControlDisabled = toolConfig.color.disabledFor.includes(activeTool);
  const areShortcutHintsVisible = showShortcutHints && !shortcutHintsDisabled && !isCollapsed;

  return (
    <aside
      id="toolbar"
      ref={toolbarRef}
      className={`${toolbarSlide}${isCollapsed ? " toolbar--collapsed" : ""}${areShortcutHintsVisible ? " toolbar--shortcut-hints-visible" : ""}`}
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
                  <button tabIndex={-1} title={renderToolTitle(lastActiveBrush, "mainPanel")}>
                    {allIcons[lastActiveBrush]}
                  </button>
                  <div className="toolbar__shortcut-hint">
                    {renderToolShortcutHint(lastActiveBrush, "mainPanel")}
                  </div>
                </li>
                <li className={shapeList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickFigureOrSwitchView()}>
                  <button tabIndex={-1} title={renderToolTitle(lastActiveFigure, "mainPanel")}>
                    {allIcons[lastActiveFigure]}
                  </button>
                  <div className="toolbar__shortcut-hint">
                    {renderToolShortcutHint(lastActiveFigure, "mainPanel")}
                  </div>
                </li>
                <li className={activeTool === "text" ? "active" : undefined} onClick={() => handleChangeTool("text")}>
                  <button tabIndex={-1} title={renderToolTitle("text", "mainPanel")}>
                    <Icons.Text />
                  </button>
                  <div className="toolbar__shortcut-hint">{renderToolShortcutHint("text", "mainPanel")}</div>
                </li>
                <li className={activeTool === "highlighter" ? "active" : undefined} onClick={() => handleChangeTool("highlighter")}>
                  <button tabIndex={-1} title={renderToolTitle("highlighter", "mainPanel")}>
                    <Icons.Highlighter />
                  </button>
                  <div className="toolbar__shortcut-hint">{renderToolShortcutHint("highlighter", "mainPanel")}</div>
                </li>
                <li className={activeTool === "laser" ? "active" : undefined} onClick={() => handleChangeTool("laser")}>
                  <button tabIndex={-1} title={renderToolTitle("laser", "mainPanel")}>
                    <Icons.Laser />
                  </button>
                  <div className="toolbar__shortcut-hint">{renderToolShortcutHint("laser", "mainPanel")}</div>
                </li>
                <li className={activeTool === "eraser" ? "active" : undefined} onClick={() => handleChangeTool("eraser")}>
                  <button tabIndex={-1} title={renderToolTitle("eraser", "mainPanel")}>
                    <Icons.Eraser />
                  </button>
                  <div className="toolbar__shortcut-hint">{renderToolShortcutHint("eraser", "mainPanel")}</div>
                </li>
                <li className="cross-line"></li>
                <li onClick={() => !isColorControlDisabled && setToolbarSlide("color-slide")}>
                  <button tabIndex={-1} className={`toolbar__color-picker ${activeColor.isRainbow ? 'color-rainbow' : ''} color_tool_${activeTool}`} style={{ backgroundColor: activeColor.color }} title={isColorControlDisabled ? renderToolTitle("color") : renderToolTitle("color", "mainPanel")} />
                  {!isColorControlDisabled && <div className="toolbar__shortcut-hint">{renderToolShortcutHint("color", "mainPanel")}</div>}
                </li>
                <li onClick={() => setToolbarSlide("width-slide")}>
                  <button tabIndex={-1} className={`toolbar__width-picker ${widthList[activeWidthIndex].name}`} title={renderToolTitle("brushSize", "mainPanel")}>
                    <div />
                  </button>
                  <div className="toolbar__shortcut-hint">{renderToolShortcutHint("brushSize", "mainPanel")}</div>
                </li>
                <li className="cross-line"></li>
                <li onClick={handleClearDesk}>
                  <button tabIndex={-1} title={renderToolTitle("clearDesk", "mainPanel")}>
                    <Icons.Trash />
                  </button>
                  {toolConfig.clearDesk.mainPanel && (
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("clearDesk", "mainPanel")}</div>
                  )}
                </li>
              </ul>
            </div>

          <div className="side-view-body brush-group">
            <ul className="toolbar__items">
              <li className={activeTool === "pen" ? "active" : undefined} onClick={() => pickTool("pen")}>
                <button tabIndex={-1} title={renderToolTitle("pen", "subPanel")}>
                  <Icons.Brush />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("pen", "subPanel")}</div>
              </li>
              <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
                <button tabIndex={-1} title={renderToolTitle("fadepen", "subPanel")}>
                  <Icons.MagicBrush />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("fadepen", "subPanel")}</div>
              </li>
            </ul>
          </div>

          <div className="side-view-body tool-group">
            <ul className="toolbar__items">
              <li className={activeTool === "arrow" ? "active" : undefined} onClick={() => pickTool("arrow")}>
                <button tabIndex={-1} title={renderToolTitle("arrow", "subPanel")}>
                  <Icons.Arrow />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("arrow", "subPanel")}</div>
              </li>
              <li className={activeTool === "flat_arrow" ? "active" : undefined} onClick={() => pickTool("flat_arrow")}>
                <button tabIndex={-1} title={renderToolTitle("flat_arrow", "subPanel")}>
                  <Icons.FlatArrow />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("flat_arrow", "subPanel")}</div>
              </li>
              <li className={activeTool === "rectangle" ? "active" : undefined} onClick={() => pickTool("rectangle")}>
                <button tabIndex={-1} title={renderToolTitle("rectangle", "subPanel")}>
                  <Icons.Rectangle />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("rectangle", "subPanel")}</div>
              </li>
              <li className={activeTool === "oval" ? "active" : undefined} onClick={() => pickTool("oval")}>
                <button tabIndex={-1} title={renderToolTitle("oval", "subPanel")}>
                  <Icons.Oval />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("oval", "subPanel")}</div>
              </li>
              <li className={activeTool === "line" ? "active" : undefined} onClick={() => pickTool("line")}>
                <button tabIndex={-1} title={renderToolTitle("line", "subPanel")}>
                  <Icons.Line />
                </button>
                <div className="toolbar__shortcut-hint">{renderToolShortcutHint("line", "subPanel")}</div>
              </li>
            </ul>
          </div>

          <div className="side-view-body color-group">
            <ul className="toolbar__items">
              {
                colorList.map((color, index) => {
                  const shortcut = String(index + 1);

                  return (
                    <li
                      key={index}
                      className={activeColorIndex === index ? "active" : undefined}
                      onClick={() => onChangeColor(index)}
                    >
                      <button tabIndex={-1} className={`toolbar__color-picker ${color.isRainbow ? 'color-rainbow' : ''}`} style={{ backgroundColor: color.color }} title={renderShortcutTitle(color.title, shortcut)} />
                      <div className="toolbar__shortcut-hint">{shortcut}</div>
                    </li>
                  );
                })
              }
            </ul>
          </div>

          <div className="side-view-body width-group">
            <ul className="toolbar__items">
              {
                widthList.map((width, index) => {
                  const shortcut = String(index + 1);

                  return (
                    <li
                      key={index}
                      className={activeWidthIndex === index ? "active" : undefined}
                      onClick={() => onChangeWidth(index)}
                    >
                      <button tabIndex={-1} className={`toolbar__width-picker ${width.name}`} title={renderShortcutTitle(width.title, shortcut)}>
                        <div />
                      </button>
                      <div className="toolbar__shortcut-hint">{shortcut}</div>
                    </li>
                  );
                })
              }
            </ul>
          </div>
          </div>

          <div className="toolbar__panel toolbar__panel--mini">
            <div className="toolbar__body">
              <ul className="toolbar__items">
                <li className="active" onClick={handleToggleCollapsed}>
                  <button tabIndex={-1} title={renderToolTitle(activeTool, "mainPanel")}>
                    {allIcons[activeTool]}
                  </button>
                </li>

                <div className="toolbar__color-hint-wrapper" onClick={handleToggleCollapsed}>
                  <div className={`toolbar__color-hint color_tool_${activeTool} ${activeColor.isRainbow ? 'color-rainbow' : ''} ${widthList[activeWidthIndex].name}`} style={{ backgroundColor: activeColor.color }}></div>
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
