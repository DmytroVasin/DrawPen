import React, { useLayoutEffect, useState } from "react";

function LineWidth({ width, onChangeWidth }) {
  const [lineWidth, setLineWidth] = useState(width);

  useLayoutEffect(() => {
    setLineWidth(width);
  }, [width]);

  return (
    <button
      onClick={onChangeWidth}
      style={{
        border: "3px solid #000",
        borderRadius: "50%",
        width: 28,
        height: 28,
      }}
    >
      <div
        style={{
          width: lineWidth / 3,
          height: 18,
          backgroundColor: "black",
          transform: "rotate(45deg)",
          borderRadius: "5px",
          position: "relative",
        }}
      ></div>
    </button>
  );
}

export default LineWidth;
//
