import { useEffect, useState, useCallback, useRef } from "react";
import "./ToolBar.css";
import { colorList, widthList } from "../constants.js";
import { FaPaintBrush, FaSquare, FaCircle, FaArrowRight } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { IoFlashlight } from "react-icons/io5";
import { GiLaserBurst } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";

const STICKY_DISTANCE = 25;

const ToolBar = ({
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleReset,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
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
        return <FaSquare />;
      case "oval":
        return <FaCircle />;
      case "line":
        return <AiOutlineLine />;
      default:
        return <FaSquare />;
    }
  };

  const renderGroupIcon = () => {
    const currentTool = lastActiveFigure;
    return getIconByToolName(currentTool);
  };

  const switchView = (name) => {
    setSlide(name);
  };

  return (
    <aside ref={toolbarRef} className={`toolbar ${slide}`} style={{ left: position.x, top: position.y }}>
      <div className="toolbar__buttons">
        <button>
          <MdOutlineCancel size={15} />
        </button>
      </div>
      <div className="toolbar__header">
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
                <FaArrowRight />
              </button>
            </li>
            <li className={activeTool === "pen" && "active"}>
              <button onClick={() => handleChangeTool("pen")}>
                <FaPaintBrush />
              </button>
            </li>
            <li className={["rectangle", "oval", "line"].includes(activeTool) && "active"}>
              <button onClick={() => switchView("tool-slide")}>
                {renderGroupIcon()}
              </button>
            </li>
            <li className={activeTool === "flashlight" && "active"}>
              <button  onClick={() => handleChangeTool("flashlight")}>
                <IoFlashlight />
              </button>
            </li>
            <li className={activeTool === "laser" && "active"}>
              <button onClick={() => handleChangeTool("laser")}>
                <GiLaserBurst />
              </button>
            </li>
            <hr />
            <li>
              <button
                id="colorPicker"
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
        <div id="colorGroup" className="side-view-body">
          <ul className="toolbar__items">
            {colorList.map((color, index) => (
              <li key={index}>
                <button
                  id="colorPicker"
                  onClick={() => onChangeColor(index)}
                  style={{ backgroundColor: color.color }}
                />
              </li>
            ))}
          </ul>
        </div>             
        <div id="toolGroup" className="side-view-body">
          <ul className="toolbar__items">
            <li className={activeTool === "rectangle" && "active"}>
              <button onClick={() => handleToolChange("rectangle")}>
                <FaSquare />
              </button>
            </li>
            <li className={activeTool === "oval" && "active"}>
              <button onClick={() => handleToolChange("oval")}>
                <FaCircle />
              </button>
            </li>
            <li className={activeTool === "line" && "active"}>
              <button onClick={() => handleToolChange("line")}>
                <AiOutlineLine />
              </button>
            </li>
          </ul>
        </div>
        <div id="widthGroup" className="side-view-body">
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
      <div className="toolbar__bottom">
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
