import React, { useState } from "react";
import "./ToolBar.css";
import { colorList, widthList } from "../constants.js";
import { LineWidth } from "../assets/imports";
import { FaPaintBrush, FaSquare, FaCircle, FaArrowRight } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { IoFlashlight } from "react-icons/io5";
import { GiLaserBurst } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";

const DragLines = ({ onMouseDown }) => {
  return (
    <div className="draglines" onMouseDown={onMouseDown}>
      <hr />
      <hr />
      <hr />
    </div>
  );
};

const ToolBar = ({
  activeTool,
  activeColorIndex,
  activeWidthIndex,
  handleChangeColor,
  handleChangeWidth,
  handleChangeTool,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const onMouseMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const onMouseUp = () => {
    setDragging(false);
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, offset]);

  const onChangeTool = (event) => {
    handleChangeTool(event.target.name);
  };

  const onChangeColor = () => {
    const newColorIndex = (activeColorIndex + 1) % colorList.length;
    handleChangeColor(newColorIndex);
  };

  const onChangeWidth = () => {
    const newWidthIndex = (activeWidthIndex + 1) % widthList.length;
    handleChangeWidth(newWidthIndex);
  };

  return (
    <aside
      id="toolbar"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div className="toolbar__header">
        <div className="toolbar__header-buttons">
          <button>
            <MdOutlineCancel />
          </button>
        </div>
        <DragLines onMouseDown={onMouseDown} />
      </div>
      <ul className="toolbar__items">
        <li className={activeTool === "arrow" ? "active" : ""}>
          <button name="arrow" onClick={onChangeTool}>
            <FaArrowRight />
          </button>
        </li>
        <li className={activeTool === "rectangle" ? "active" : ""}>
          <button name="rectangle" onClick={onChangeTool}>
            <FaSquare />
          </button>
        </li>
        <li className={activeTool === "pen" ? "active" : ""}>
          <button name="pen" onClick={onChangeTool}>
            <FaPaintBrush />
          </button>
        </li>
        <li className={activeTool === "oval" ? "active" : ""}>
          <button name="oval" onClick={onChangeTool}>
            <FaCircle />
          </button>
        </li>
        <li className={activeTool === "line" ? "active" : ""}>
          <button name="line" onClick={onChangeTool}>
            <AiOutlineLine />
          </button>
        </li>
        <li className={activeTool === "flashlight" ? "active" : ""}>
          <button name="flashlight" onClick={onChangeTool}>
            <IoFlashlight />
          </button>
        </li>
        <li className={activeTool === "laser" ? "active" : ""}>
          <button name="laser" onClick={onChangeTool}>
            <GiLaserBurst />
          </button>
        </li>
        <hr />
        <li>
          <button
            id="colorPicker"
            onClick={onChangeColor}
            style={{ backgroundColor: colorList[activeColorIndex].color }}
          />
        </li>
        <li>
          <LineWidth
            width={widthList[activeWidthIndex].width}
            onChangeWidth={onChangeWidth}
          />
        </li>
      </ul>
      <div className="toolbar__bottom">
        <DragLines onMouseDown={onMouseDown} />
      </div>
    </aside>
  );
};

export default ToolBar;
