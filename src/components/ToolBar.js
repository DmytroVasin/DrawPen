import React, { useState } from "react";
import "./ToolBar.css";
import { colorList, widthList } from "../constants.js";
import { FaPaintBrush, FaSquare, FaCircle, FaArrowRight } from "react-icons/fa";
import { AiOutlineLine } from "react-icons/ai";
import { IoFlashlight } from "react-icons/io5";
import { GiLaserBurst } from "react-icons/gi";
import { MdOutlineCancel } from "react-icons/md";

const DragLines = ({ className = "" }) => {
  return (
    <div className={`draglines ${className}`}>
      <div />
      <div />
      <div />
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
    <aside id="toolbar">
      <div className="toolbar__header">
        <div className="toolbar__header-buttons">
          <button>
            <MdOutlineCancel />
          </button>
        </div>
        <DragLines />
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
          <button
            onClick={onChangeWidth}
            style={{
              border: "2px solid #000",
              borderRadius: "50%",
              width: 28,
              height: 28,
            }}
          >
            <div
              style={{
                width: widthList[activeWidthIndex].width / 3,
                height: 18,
                backgroundColor: "black",
                transform: "rotate(45deg)",
                borderRadius: "5px",
                position: "relative",
              }}
            ></div>
          </button>
        </li>
      </ul>
      <div className="toolbar__bottom">
        <DragLines className="rotated" />
      </div>
    </aside>
  );
};

export default ToolBar;
