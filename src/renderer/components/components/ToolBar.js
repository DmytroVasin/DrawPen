import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import { colorList, widthList } from "../constants.js";

const STICKY_DISTANCE = 15;
const ZONE_BORDER = 10; // Equals to "#zone_borders" border

const ToolBar = ({
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleCloseToolBar,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
  Icons
}) => {
  const [position, setPosition] = useState({ x: ZONE_BORDER, y: ZONE_BORDER });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef()
  const [slide, setSlide] = useState("");
  const [lastActiveFigure, setLastActiveFigure] = useState("rectangle");

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

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
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

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleToolChange = (tool) => {
    handleChangeTool(tool);
    if (["rectangle", "oval", "line"].includes(tool)) {
      setLastActiveFigure(tool);
    }
    switchView("");
  };

  const onChangeColor = (index) => {
    handleChangeColor(index);
    switchView("")
  };

  const onChangeWidth = (index) => {
    handleChangeWidth(index);
    switchView("")
  };

  const renderGroupIcon = () => {
    switch (lastActiveFigure) {
      case "rectangle":
        return <Icons.FaRegSquare />;
      case "oval":
        return <Icons.FaRegCircle />;
      case "line":
        return <Icons.AiOutlineLine />;
      default:
        null
    }
  };

  const switchView = (name) => {
    setSlide(name);
  };

  return (
    <aside ref={toolbarRef} className={`toolbar ${slide}`} style={{ left: position.x, top: position.y }}>
      <div className="toolbar__buttons">
        <button onClick={handleCloseToolBar}>
          <Icons.MdOutlineCancel size={16} />
        </button>
      </div>
      <div className="toolbar__draglines" onMouseDown={onMouseDown}>
        <div className="draglines">
          <div />
          <div />
          <div />
        </div>
      </div>
      <div className="toolbar__container">
        <div className="toolbar__body">
          <ul className="toolbar__items">
            <li className={activeTool === "arrow" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("arrow")}>
                <Icons.FaArrowRight />
              </button>
            </li>
            <li className={activeTool === "pen" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("pen")}>
                <Icons.FaPaintBrush />
              </button>
            </li>
            <li className={["rectangle", "oval", "line"].includes(activeTool) ? "active" : undefined}>
              <button onClick={() => switchView("tool-slide")}>
                {renderGroupIcon()}
              </button>
            </li>
            <li className={activeTool === "laser" ? "active" : undefined}>
              <button onClick={() => handleChangeTool("laser")}>
                <Icons.GiLaserburn />
              </button>
            </li>
            <li className="cross-line"></li>
            <li>
              <button
                className="toolbar__color-picker"
                onClick={() => switchView("color-slide")}
                style={{ backgroundColor: colorList[activeColorIndex].color }}
              />
            </li>
            <li>
              <button className="toolbar__width-button" onClick={() => switchView("width-slide")}>
                <div className={`${widthList[activeWidthIndex].name}`} />
              </button>
            </li>
          </ul>
        </div>
        <div className="side-view-body color-group">
          <ul className="toolbar__items">
            {colorList.map((color, index) => (
              <li key={index}>
                <button
                  className="toolbar__color-picker"
                  onClick={() => onChangeColor(index)}
                  style={{ backgroundColor: color.color }}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="side-view-body tool-group">
          <ul className="toolbar__items">
            <li className={activeTool === "rectangle" ? "active" : undefined}>
              <button onClick={() => handleToolChange("rectangle")}>
                <Icons.FaRegSquare />
              </button>
            </li>
            <li className={activeTool === "oval" ? "active" : undefined}>
              <button onClick={() => handleToolChange("oval")}>
                <Icons.FaRegCircle />
              </button>
            </li>
            <li className={activeTool === "line" ? "active" : undefined}>
              <button onClick={() => handleToolChange("line")}>
                <Icons.AiOutlineLine />
              </button>
            </li>
          </ul>
        </div>
        <div className="side-view-body width-group">
          <ul className="toolbar__items">
            {widthList.map((width, index) => (
              <li key={index}>
                <button className="toolbar__width-button" onClick={() => onChangeWidth(index)}>
                  <div className={width.name} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="toolbar__draglines">
        <div className="draglines rotated" onMouseDown={onMouseDown}>
          <div />
          <div />
          <div />
        </div>
      </div>
    </aside>
  );
};

export default ToolBar;
