export const laserTime = 2000;
export const rainbowScaleFactor = 0.03;
export const minObjectDistance = 5; // Minimum length of drawn object
export const dotMargin = 5; // Margin from figure to dot
export const figureMinScale = 0.2;

export const shapeList = ['arrow', 'rectangle', 'oval', 'line'];

export const colorList = [
  { color: '#000000', name: 'color_rainbow' },
  { color: '#529be0', name: 'color_blue' },
  { color: '#e05252', name: 'color_red' },
  { color: '#52e06c', name: 'color_green' },
  { color: '#e0a552', name: 'color_orange' },
  { color: '#1e1e1e', name: 'color_black' },
];

// - font_y_offset_compensation: Hack to make HTML similar to Canvas
//   Data taken from Retina display
// - font_line_height_compensation: Hack to compensate for line height
//   const lineHeightMultiplier = 1.25;
//   const offsetY = ((fontSize * lineHeightMultiplier) - fontSize) / 2;

export const widthList = [
  { pen_width: 8,  rainbow_pen_width: 4,  laser_width: [3,   8],  figure_size: 6,  icon_size: 15, name: 'light',  font_size: 28, font_y_offset_compensation: 5,   font_line_height_compensation: 3.5 },
  { pen_width: 12, rainbow_pen_width: 8,  laser_width: [4.5, 12], figure_size: 8,  icon_size: 17, name: 'medium', font_size: 42, font_y_offset_compensation: 7.5, font_line_height_compensation: 5.25 },
  { pen_width: 16, rainbow_pen_width: 12, laser_width: [6,   16], figure_size: 10, icon_size: 20, name: 'bold',   font_size: 56, font_y_offset_compensation: 10,  font_line_height_compensation: 7 },
]
