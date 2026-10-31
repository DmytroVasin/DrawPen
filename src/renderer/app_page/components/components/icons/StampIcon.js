import React from "react";

const StampIcon = ({ size, ...props }) => {
  const computedSize = size ?? "1em";

  return (
    <svg
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 512 512"
      width={computedSize}
      height={computedSize}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* ===== Circle ring and arrow ===== */}
      <path d="M225.544711 457.518561A232 232 0 1 0 54.481439 286.455289L8.470996 332.465731L0 512L179.534269 503.529004ZM96 232A184 184 0 1 1 464 232A184 184 0 1 1 96 232Z" strokeLinejoin="round" />

      {/* ===== Center dot ===== */}
      <path d="M217.716365 232A62.283635 62.283635 0 1 0 342.283635 232A62.283635 62.283635 0 1 0 217.716365 232Z" />
    </svg>
  );
};

export default StampIcon;
