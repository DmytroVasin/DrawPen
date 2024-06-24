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
  const [slide, setSlide] = useState(null);
  const [lastActiveFigure, setLastActiveFigure] = useState();

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
    switchView(null);
  };

  const onChangeColor = (index) => {
    handleChangeColor(index);
    switchView(null)
  };

  const onChangeWidth = (index) => {
    handleChangeWidth(index);
    switchView(null)
  };

  const renderGroupIcon = () => {
    switch (activeTool) {
      case "rectangle":
        return <FaSquare />;
      case "oval":
        return <FaCircle />;
      case "line":
        return <AiOutlineLine />;
      default:
        switch (lastActiveFigure) {
          case "rectangle":
            return <FaSquare />;
          case "oval":
            return <FaCircle />;
          case "line":
            return <AiOutlineLine />;
          default:
            return <FaSquare />;
        }
    }
  };

  const switchView = (name) => {
    setSlide(name);
  };

  return (
    <aside id="toolbar" ref={toolbarRef} className={slide ? `slide-${slide}` : ""} style={{ left: position.x, top: position.y }}>
      <div className="window__buttons">
        <button>
          <MdOutlineCancel size={15} />
        </button>
      </div>
      <div className="toolbar__container">
      <div className="toolbar__header">
        <div className="draglines" onMouseDown={onMouseDown}>
          <div />
          <div />
          <div />
        </div>
      </div>
      <div id="mainview">
      <ul className="toolbar__items">
        <li className={activeTool === "arrow" ? "active" : ""}>
          <button name="arrow" onClick={() => handleChangeTool("arrow")}>
            <FaArrowRight />
          </button>
        </li>
        <li className={activeTool === "pen" ? "active" : ""}>
          <button name="pen" onClick={() => handleChangeTool("pen")}>
            <FaPaintBrush />
          </button>
        </li>
        <li className={["rectangle", "oval", "line"].includes(activeTool) ? "active" : ""}>
          <button
            name={activeTool}
            onClick={() => switchView("tool")}
          >
            {renderGroupIcon()}
          </button>
        </li>
        <li className={activeTool === "flashlight" ? "active" : ""}>
          <button name="flashlight" onClick={() => handleChangeTool("flashlight")}>
            <IoFlashlight />
          </button>
        </li>
        <li className={activeTool === "laser" ? "active" : ""}>
          <button name="laser" onClick={() => handleChangeTool("laser")}>
            <GiLaserBurst />
          </button>
        </li>
        <hr />
        <li>
          <button
            id="colorPicker"
            onClick={() => switchView("color")}
            style={{ backgroundColor: colorList[activeColorIndex].color }}
          />
        </li>
        <li>
          <button className="toolbar__width-button" onClick={() => switchView("width")}>
            <div
              style={{
                width: `${widthList[activeWidthIndex].width / 3}px`,
              }}
            />
          </button>
        </li>
      </ul>
      </div>
      <div className="toolbar__bottom">
        <div className="draglines rotated" onMouseDown={onMouseDown}>
          <div />
          <div />
          <div />
        </div>
      </div>

      <div id="colorGroup">
            <ul className={`toolbar__items`}>
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
              
          <div id="toolGroup">
            <ul
              className={`toolbar__items`}
            >
              <li className={activeTool === "rectangle" ? "active" : ""}>
                <button
                  name="rectangle"
                  onClick={() => handleToolChange("rectangle")}
                >
                  <FaSquare />
                </button>
              </li>
              <li className={activeTool === "oval" ? "active" : ""}>
                <button name="oval" onClick={() => handleToolChange("oval")}>
                  <FaCircle />
                </button>
              </li>
              <li className={activeTool === "line" ? "active" : ""}>
                <button name="line" onClick={() => handleToolChange("line")}>
                  <AiOutlineLine />
                </button>
              </li>
            </ul>
          </div>
              
          <div id="widthGroup">
            <ul
              className={`toolbar__items`}
            >
              {widthList.map((width, index) => (
                <li key={index}>
                  <button className="toolbar__width-button" onClick={() => onChangeWidth(index)}>
                    <div
                      style={{
                        width: `${width.width / 3}px`,
                      }}
                    />
                  </button>
                </li>
              ))}
            </ul>
        </div>
      </div>
    </aside>
  );
};

export default ToolBar;
