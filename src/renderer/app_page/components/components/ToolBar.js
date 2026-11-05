import React, { useEffect, useLayoutEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import {
  drawingToolList,
  shapeList,
  widthList,
  shortcutHintHoldDelayMs,
  updateStoreDelay,
} from "../constants.js";
import {
  snapToEdge,
  fitPositionToViewport,
  getReversedOnDrag,
  humanizedShortcut,
} from "../utils/toolbar.js";

const ToolBar = ({
  orientation,
  position,
  setPosition,
  toolbarSlide,
  setToolbarSlide,
  isCollapsed,
  setIsCollapsed,
  isReversed,
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
  handleChangeReversed,
  handleClearDesk,
  handleEnablePointerMode,
  handlePositionCommit,
  Icons,
  colorList,
}) => {
  const toolConfig = {
    brush:       { title: "Brush",       alias: "B", mainPanel: "1", subPanel: "1" },
    pen:         { title: "Pen",         alias: "P", mainPanel: "1", subPanel: "2" },
    fadepen:     { title: "Fade Pen",    alias: "P", mainPanel: "1", subPanel: "3" },
    arrow:       { title: "Arrow",       alias: "A", mainPanel: "2", subPanel: "1" },
    flat_arrow:  { title: "Flat Arrow",  alias: "A", mainPanel: "2", subPanel: "2" },
    rectangle:   { title: "Rectangle",   alias: "R", mainPanel: "2", subPanel: "3" },
    diamond:     { title: "Diamond",     alias: "D", mainPanel: "2", subPanel: "4" },
    oval:        { title: "Oval",        alias: "O", mainPanel: "2", subPanel: "5" },
    line:        { title: "Line",                    mainPanel: "2", subPanel: "6" },
    stamp:       { title: "Stamp",       alias: "S", mainPanel: "2", subPanel: "7" },
    text:        { title: "Text",        alias: "T", mainPanel: "3" },
    highlighter: { title: "Highlighter", alias: "H", mainPanel: "4" },
    laser:       { title: "Laser",       alias: "L", mainPanel: "5" },
    eraser:      { title: "Eraser",      alias: "E", mainPanel: "6" },
    color:       { title: "Color",                   mainPanel: "7", disabledFor: ["laser", "eraser"] },
    brushSize:   { title: "Brush Size",              mainPanel: "8" },
    clearDesk:   { title: "Clear Desk",              mainPanel: humanizedShortcut(clearDeskShortcut) },
  };

  const allIcons = {
    brush: <Icons.Brush />,
    pen: <Icons.Pen />,
    fadepen: <Icons.MagicPen />,
    arrow: <Icons.Arrow />,
    flat_arrow: <Icons.FlatArrow />,
    rectangle: <Icons.Rectangle />,
    diamond: <Icons.Diamond />,
    oval: <Icons.Oval />,
    line: <Icons.Line />,
    stamp: <Icons.Stamp />,
    text: <Icons.Text />,
    highlighter: <Icons.Highlighter />,
    laser: <Icons.Laser />,
    eraser: <Icons.Eraser />,
  };

  const activeColor = colorList[activeColorIndex];
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const [shortcutHintRevealCount, setShortcutHintRevealCount] = useState(0);

  const tailRef = useRef(null);
  const dragRef = useRef(null);
  const shortcutHintTimerRef = useRef(null);
  const positionCommitTimeoutRef = useRef(null);

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
    shortcutHintTimerRef.current = setTimeout(() => {
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

  const measureTail = useCallback(() => {
    const tail = tailRef.current;

    return {
      width: orientation === "horizontal" ? tail.offsetWidth : 0,
      height: orientation === "vertical" ? tail.offsetHeight : 0,
    };
  }, [orientation]);

  const fitToolbarToViewport = useCallback(() => {
    if (dragRef.current) return;
    if (!tailRef.current) return;

    const tailSize = measureTail();

    setPosition((previous) => {
      return fitPositionToViewport(previous, tailSize, isReversed, viewport);
    });
  }, [measureTail, isReversed, setPosition, viewport.width, viewport.height]);

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    if (dragRef.current) return;

    clearTimeout(positionCommitTimeoutRef.current);

    dragRef.current = {
      pointerId: event.pointerId,
      offset: {
        x: event.clientX - position.x,
        y: event.clientY - position.y
      },
      position: position,
      isReversed: isReversed,
    };
  };

  const onPointerMove = useCallback((event) => {
    if (!dragRef.current) return;
    if (!tailRef.current) return;

    const drag = dragRef.current;

    if (drag.pointerId !== event.pointerId) return;

    const newX = event.clientX - drag.offset.x;
    const newY = event.clientY - drag.offset.y;
    const nextPosition = snapToEdge(newX, newY, viewport);
    const tailSize = measureTail();

    // Only a manual drag can change direction, using the currently visible panel size.
    const nextIsReversed = getReversedOnDrag({
      position: nextPosition,
      isReversed: drag.isReversed,
      orientation: orientation,
      tail: tailSize,
    }, viewport);

    if (nextIsReversed !== drag.isReversed) {
      handleChangeReversed(nextIsReversed);
    }

    drag.position = nextPosition;
    drag.isReversed = nextIsReversed;

    setPosition(nextPosition);
  }, [measureTail, orientation, handleChangeReversed, setPosition, viewport.width, viewport.height]);

  const onPointerUp = useCallback((event) => {
    if (!dragRef.current) return;

    const drag = dragRef.current;

    if (drag.pointerId !== event.pointerId) return;

    dragRef.current = null;

    clearTimeout(positionCommitTimeoutRef.current);
    positionCommitTimeoutRef.current = null;

    handlePositionCommit(drag.position);
  }, [handlePositionCommit]);

  useLayoutEffect(() => {
    fitToolbarToViewport();
  }, [position.x, position.y, fitToolbarToViewport]);

  useEffect(() => {
    if (dragRef.current) return;

    positionCommitTimeoutRef.current = setTimeout(() => {
      handlePositionCommit(position);
    }, updateStoreDelay);

    return () => {
      clearTimeout(positionCommitTimeoutRef.current);
    };
  }, [position.x, position.y, handlePositionCommit]);

  useLayoutEffect(() => {
    if (!tailRef.current) return;

    const tailElement = tailRef.current;

    let frameId = null;

    const scheduleFit = () => {
      if (frameId) {
        return;
      }

      frameId = requestAnimationFrame(() => {
        frameId = null;
        fitToolbarToViewport();
      });
    };

    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(tailElement);
    // window.addEventListener("resize", scheduleFit);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }

      resizeObserver.disconnect();
      // window.removeEventListener("resize", scheduleFit);
    };
  }, [fitToolbarToViewport]);

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
    if (drawingToolList.includes(activeTool)) {
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
      className={`
        toolbar--${orientation}
        ${toolbarSlide}
        ${isReversed ? "toolbar--reversed" : ""}
        ${isCollapsed ? "toolbar--collapsed" : ""}
        ${areShortcutHintsVisible ? "toolbar--shortcut-hints-visible" : ""}
      `}
      style={{ left: position.x, top: position.y }}
    >
      <div className="toolbar__close">
        <button tabIndex={-1} onClick={handleCloseToolBar}>
          <Icons.Close size={16} />
        </button>
      </div>

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

      <div className="toolbar__tail" ref={tailRef}>

        <div className="toolbar__container">
          <div className="toolbar__panels-track">
            <div className="toolbar__panel toolbar__panel--full">
              <div className="toolbar__body">
                <ul className="toolbar__items">
                  <li className={drawingToolList.includes(activeTool) ? "active more_figures" : undefined} onClick={() => pickBrushOrSwitchView()}>
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
                  <li className={activeTool === "brush" ? "active" : undefined} onClick={() => pickTool("brush")}>
                    <button tabIndex={-1} title={renderToolTitle("brush", "subPanel")}>
                      <Icons.Brush />
                    </button>
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("brush", "subPanel")}</div>
                  </li>
                  <li className={activeTool === "pen" ? "active" : undefined} onClick={() => pickTool("pen")}>
                    <button tabIndex={-1} title={renderToolTitle("pen", "subPanel")}>
                      <Icons.Pen />
                    </button>
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("pen", "subPanel")}</div>
                  </li>
                  <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
                    <button tabIndex={-1} title={renderToolTitle("fadepen", "subPanel")}>
                      <Icons.MagicPen />
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
                  <li className={activeTool === "diamond" ? "active" : undefined} onClick={() => pickTool("diamond")}>
                    <button tabIndex={-1} title={renderToolTitle("diamond", "subPanel")}>
                      <Icons.Diamond />
                    </button>
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("diamond", "subPanel")}</div>
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
                  <li className={activeTool === "stamp" ? "active" : undefined} onClick={() => pickTool("stamp")}>
                    <button tabIndex={-1} title={renderToolTitle("stamp", "subPanel")}>
                      <Icons.Stamp />
                    </button>
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("stamp", "subPanel")}</div>
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
          <Icons.AngleLeft />
        </div>

      </div>
    </aside>
  );
};

export default ToolBar;
