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
  toolbarOptions,
  visibleTools,
  clearDeskShortcut,
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
  const getNumericShortcut = (tools, tool) => {
    const index = tools.indexOf(tool);

    if (index === -1) {
      return;
    }

    return String(index + 1);
  };

  const getMainShortcut = (tool) => {
    if (drawingToolList.includes(tool)) {
      if (!visibleTools.brushes.includes(tool)) return;

      return getNumericShortcut(visibleTools.toolbarItems, "brushes");
    }

    if (shapeList.includes(tool)) {
      if (!visibleTools.shapes.includes(tool)) return;

      return getNumericShortcut(visibleTools.toolbarItems, "shapes");
    }

    return getNumericShortcut(visibleTools.toolbarItems, tool);
  };

  const toolConfig = {
    brush:       { title: "Brush",       alias: "B", mainPanel: getMainShortcut("brush"),       subPanel: getNumericShortcut(visibleTools.brushes, "brush") },
    pen:         { title: "Pen",         alias: "P", mainPanel: getMainShortcut("pen"),         subPanel: getNumericShortcut(visibleTools.brushes, "pen") },
    fadepen:     { title: "Fade Pen",    alias: "P", mainPanel: getMainShortcut("fadepen"),     subPanel: getNumericShortcut(visibleTools.brushes, "fadepen") },
    arrow:       { title: "Arrow",       alias: "A", mainPanel: getMainShortcut("arrow"),       subPanel: getNumericShortcut(visibleTools.shapes, "arrow") },
    flat_arrow:  { title: "Flat Arrow",  alias: "A", mainPanel: getMainShortcut("flat_arrow"),  subPanel: getNumericShortcut(visibleTools.shapes, "flat_arrow") },
    rectangle:   { title: "Rectangle",   alias: "R", mainPanel: getMainShortcut("rectangle"),   subPanel: getNumericShortcut(visibleTools.shapes, "rectangle") },
    diamond:     { title: "Diamond",     alias: "D", mainPanel: getMainShortcut("diamond"),     subPanel: getNumericShortcut(visibleTools.shapes, "diamond") },
    oval:        { title: "Oval",        alias: "O", mainPanel: getMainShortcut("oval"),        subPanel: getNumericShortcut(visibleTools.shapes, "oval") },
    line:        { title: "Line",                    mainPanel: getMainShortcut("line"),        subPanel: getNumericShortcut(visibleTools.shapes, "line") },
    stamp:       { title: "Stamp",       alias: "S", mainPanel: getMainShortcut("stamp"),       subPanel: getNumericShortcut(visibleTools.shapes, "stamp") },
    text:        { title: "Text",        alias: "T", mainPanel: getMainShortcut("text") },
    highlighter: { title: "Highlighter", alias: "H", mainPanel: getMainShortcut("highlighter") },
    laser:       { title: "Laser",       alias: "L", mainPanel: getMainShortcut("laser") },
    eraser:      { title: "Eraser",      alias: "E", mainPanel: getMainShortcut("eraser") },
    color:       { title: "Color",                   mainPanel: getMainShortcut("color"), disabledFor: ["laser", "eraser"] },
    brushSize:   { title: "Brush Size",              mainPanel: getMainShortcut("brushSize") },
    clear_desk:  { title: "Clear Desk",              mainPanel: humanizedShortcut(clearDeskShortcut) },
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
    if (visibleTools.shapes.length > 1 && visibleTools.shapes.includes(activeTool)) {
      setToolbarSlide("tool-slide");
      return;
    }

    pickTool(visibleTools.selectedShape);
  };

  const pickBrushOrSwitchView = () => {
    if (visibleTools.brushes.length > 1 && visibleTools.brushes.includes(activeTool)) {
      setToolbarSlide("brush-slide");
      return;
    }

    pickTool(visibleTools.selectedBrush);
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
      style={{
        left: position.x,
        top: position.y,
        '--toolbar-items-amount': visibleTools.toolbarItems.length + Number(toolbarOptions.tool_bar_show_clear_desk),
        '--toolbar-has-clear-desk': Number(toolbarOptions.tool_bar_show_clear_desk),
        '--toolbar-min-items-amount': colorList.length,
      }}
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
              <div className="toolbar__body toolbar__body--main">
                <ul className="toolbar__items toolbar__items--tools">
                  {
                    visibleTools.brushes.length > 0 && (
                      <li className={`${visibleTools.brushes.includes(activeTool) ? "active" : ""} ${visibleTools.brushes.length > 1 ? "more_figures" : ""}`} onClick={pickBrushOrSwitchView}>
                        <button tabIndex={-1} title={renderToolTitle(visibleTools.selectedBrush, "mainPanel")}>
                          {allIcons[visibleTools.selectedBrush]}
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint(visibleTools.selectedBrush, "mainPanel")}</div>
                      </li>
                    )
                  }

                  {
                    visibleTools.shapes.length > 0 && (
                      <li className={`${visibleTools.shapes.includes(activeTool) ? "active" : ""} ${visibleTools.shapes.length > 1 ? "more_figures" : ""}`} onClick={pickFigureOrSwitchView}>
                        <button tabIndex={-1} title={renderToolTitle(visibleTools.selectedShape, "mainPanel")}>
                          {allIcons[visibleTools.selectedShape]}
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint(visibleTools.selectedShape, "mainPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_text && (
                      <li className={activeTool === "text" ? "active" : undefined} onClick={() => pickTool("text")}>
                        <button tabIndex={-1} title={renderToolTitle("text", "mainPanel")}>
                          <Icons.Text />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("text", "mainPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_highlighter && (
                      <li className={activeTool === "highlighter" ? "active" : undefined} onClick={() => pickTool("highlighter")}>
                        <button tabIndex={-1} title={renderToolTitle("highlighter", "mainPanel")}>
                          <Icons.Highlighter />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("highlighter", "mainPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_laser && (
                      <li className={activeTool === "laser" ? "active" : undefined} onClick={() => pickTool("laser")}>
                        <button tabIndex={-1} title={renderToolTitle("laser", "mainPanel")}>
                          <Icons.Laser />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("laser", "mainPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_eraser && (
                      <li className={activeTool === "eraser" ? "active" : undefined} onClick={() => pickTool("eraser")}>
                        <button tabIndex={-1} title={renderToolTitle("eraser", "mainPanel")}>
                          <Icons.Eraser />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("eraser", "mainPanel")}</div>
                      </li>
                    )
                  }
                </ul>

                <ul className="toolbar__items">
                  <li className="cross-line" />

                  <li onClick={() => !isColorControlDisabled && setToolbarSlide("color-slide")}>
                    <button tabIndex={-1} className={`toolbar__color-picker ${activeColor.isRainbow ? 'color-rainbow' : ''} color_tool_${activeTool}`} style={{ backgroundColor: activeColor.color }} title={isColorControlDisabled ? toolConfig.color.title : renderToolTitle("color", "mainPanel")} />
                    {!isColorControlDisabled && <div className="toolbar__shortcut-hint">{renderToolShortcutHint("color", "mainPanel")}</div>}
                  </li>

                  <li onClick={() => setToolbarSlide("width-slide")}>
                    <button tabIndex={-1} className={`toolbar__width-picker ${widthList[activeWidthIndex].name}`} title={renderToolTitle("brushSize", "mainPanel")}>
                      <div />
                    </button>
                    <div className="toolbar__shortcut-hint">{renderToolShortcutHint("brushSize", "mainPanel")}</div>
                  </li>

                  {
                    toolbarOptions.tool_bar_show_clear_desk && (
                      <>
                        <li className="cross-line"></li>

                        <li onClick={handleClearDesk}>
                          <button tabIndex={-1} title={renderToolTitle("clear_desk", "mainPanel")}>
                            <Icons.Trash />
                          </button>

                          {
                            toolConfig.clear_desk.mainPanel && (
                              <div className="toolbar__shortcut-hint">{renderToolShortcutHint("clear_desk", "mainPanel")}</div>
                            )
                          }
                        </li>
                      </>
                    )
                  }
                </ul>
              </div>

              <div className="side-view-body brush-group">
                <ul className="toolbar__items">
                  {
                    toolbarOptions.tool_bar_show_brush && (
                      <li className={activeTool === "brush" ? "active" : undefined} onClick={() => pickTool("brush")}>
                        <button tabIndex={-1} title={renderToolTitle("brush", "subPanel")}>
                          <Icons.Brush />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("brush", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_pen && (
                      <li className={activeTool === "pen" ? "active" : undefined} onClick={() => pickTool("pen")}>
                        <button tabIndex={-1} title={renderToolTitle("pen", "subPanel")}>
                          <Icons.Pen />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("pen", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_fadepen && (
                      <li className={activeTool === "fadepen" ? "active" : undefined} onClick={() => pickTool("fadepen")}>
                        <button tabIndex={-1} title={renderToolTitle("fadepen", "subPanel")}>
                          <Icons.MagicPen />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("fadepen", "subPanel")}</div>
                      </li>
                    )
                  }
                </ul>
              </div>

              <div className="side-view-body tool-group">
                <ul className="toolbar__items">
                  {
                    toolbarOptions.tool_bar_show_arrow && (
                      <li className={activeTool === "arrow" ? "active" : undefined} onClick={() => pickTool("arrow")}>
                        <button tabIndex={-1} title={renderToolTitle("arrow", "subPanel")}>
                          <Icons.Arrow />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("arrow", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_flat_arrow && (
                      <li className={activeTool === "flat_arrow" ? "active" : undefined} onClick={() => pickTool("flat_arrow")}>
                        <button tabIndex={-1} title={renderToolTitle("flat_arrow", "subPanel")}>
                          <Icons.FlatArrow />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("flat_arrow", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_rectangle && (
                      <li className={activeTool === "rectangle" ? "active" : undefined} onClick={() => pickTool("rectangle")}>
                        <button tabIndex={-1} title={renderToolTitle("rectangle", "subPanel")}>
                          <Icons.Rectangle />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("rectangle", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_diamond && (
                      <li className={activeTool === "diamond" ? "active" : undefined} onClick={() => pickTool("diamond")}>
                        <button tabIndex={-1} title={renderToolTitle("diamond", "subPanel")}>
                          <Icons.Diamond />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("diamond", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_oval && (
                      <li className={activeTool === "oval" ? "active" : undefined} onClick={() => pickTool("oval")}>
                        <button tabIndex={-1} title={renderToolTitle("oval", "subPanel")}>
                          <Icons.Oval />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("oval", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_line && (
                      <li className={activeTool === "line" ? "active" : undefined} onClick={() => pickTool("line")}>
                        <button tabIndex={-1} title={renderToolTitle("line", "subPanel")}>
                          <Icons.Line />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("line", "subPanel")}</div>
                      </li>
                    )
                  }

                  {
                    toolbarOptions.tool_bar_show_stamp && (
                      <li className={activeTool === "stamp" ? "active" : undefined} onClick={() => pickTool("stamp")}>
                        <button tabIndex={-1} title={renderToolTitle("stamp", "subPanel")}>
                          <Icons.Stamp />
                        </button>
                        <div className="toolbar__shortcut-hint">{renderToolShortcutHint("stamp", "subPanel")}</div>
                      </li>
                    )
                  }
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
