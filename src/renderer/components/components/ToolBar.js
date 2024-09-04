import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.scss";
import { colorList, widthList } from "../constants.js";

const STICKY_DISTANCE = 25;

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
  const [position, setPosition] = useState({ x: 0, y: 0 });
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
    const toolbar = toolbarRef.current
    const toolbarWidth = toolbar.offsetWidth;
    const toolbarHeight = toolbar.offsetHeight;

    if (newX < STICKY_DISTANCE) {
      newX = 0;
    } else if (newX > windowWidth - toolbarWidth - STICKY_DISTANCE) {
      newX = windowWidth - toolbarWidth;
    }

    if (newY < STICKY_DISTANCE) {
      newY = 0;
    } else if (newY > windowHeight - toolbarHeight - STICKY_DISTANCE) {
      newY = windowHeight - toolbarHeight;
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

  const getIconByToolName = (toolName) => {
    switch (toolName) {
      case "rectangle":
        return <Icons.FaSquare />;
      case "oval":
        return <Icons.FaCircle />;
      case "line":
        return <Icons.AiOutlineLine />;
      default:
        return <Icons.FaSquare />;
    }
  };

  const renderGroupIcon = () => {
    return getIconByToolName(lastActiveFigure);
  };

  const switchView = (name) => {
    setSlide(name);
  };

  return (
    <aside ref={toolbarRef} className={`toolbar ${slide}`} style={{ left: position.x, top: position.y }}>
      <div className="toolbar__buttons">
        <button onClick={handleCloseToolBar}>
          <Icons.MdOutlineCancel size={15} />
        </button>
      </div>
      <div className="toolbar__draglines">
        <div className="draglines" onMouseDown={onMouseDown}>
          <div />
          <div />
          <div />
        </div>
      </div>
      <div className="toolbar__container">
        <div className="toolbar__body">
          <ul className="toolbar__items">
            <li className={activeTool === "arrow" && "active"}>
              <button onClick={() => handleChangeTool("arrow")}>
                <Icons.FaArrowRight />
              </button>
            </li>
            <li className={activeTool === "pen" && "active"}>
              <button onClick={() => handleChangeTool("pen")}>
                <Icons.FaPaintBrush />
              </button>
            </li>
            <li className={["rectangle", "oval", "line"].includes(activeTool) && "active"}>
              <button onClick={() => switchView("tool-slide")}>
                {renderGroupIcon()}
              </button>
            </li>
            <li className={activeTool === "flashlight" && "active"}>
              <button  onClick={() => handleChangeTool("flashlight")}>
                <Icons.IoFlashlight />
              </button>
            </li>
            <li className={activeTool === "laser" && "active"}>
              <button onClick={() => handleChangeTool("laser")}>
                <Icons.GiLaserBurst />
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
                <div style={{ width: `${widthList[activeWidthIndex].width / 3}px` }} />
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
            <li className={activeTool === "rectangle" && "active"}>
              <button onClick={() => handleToolChange("rectangle")}>
                <Icons.FaSquare />
              </button>
            </li>
            <li className={activeTool === "oval" && "active"}>
              <button onClick={() => handleToolChange("oval")}>
                <Icons.FaCircle />
              </button>
            </li>
            <li className={activeTool === "line" && "active"}>
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
                  <div style={{ width: `${width.width / 3}px` }} />
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