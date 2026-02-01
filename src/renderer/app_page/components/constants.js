export const timeStep = 100;
export const laserTime = 2000;
export const laserTimeMin = 300;
export const laserTimeMax = 5000;
export const fadeDisappearAfter = 5000;
export const fadeDisappearAfterMin = 1000;
export const fadeDisappearAfterMax = 30000;
export const fadeOutDurationTime = 4000;
export const fadeDestroyAfterMs = fadeOutDurationTime + 6000;

export const eraserTime = 100;
export const rainbowScaleFactor = 0.03;
export const minObjectDistance = 5; // Minimum length of drawn object
export const dotMargin = 5; // Margin from figure to dot
export const figureMinScale = 0.2;
export const pastCooldownMs = 300;
export const escDoubleTapMs = 300;
export const SNAP_ANGLE = Math.PI / 12; // 45°
export const highlighterAlpha = 0.4;

export const shapeList = ['arrow', 'rectangle', 'oval', 'line'];

export const colorList = [
  { color: '#000000', highlighterColor: '#00000070', name: 'color_rainbow' },
  { color: '#529BE0', highlighterColor: '#529BE070', name: 'color_blue' },
  { color: '#E05252', highlighterColor: '#E0525270', name: 'color_red' },
  { color: '#52E06C', highlighterColor: '#52E06C70', name: 'color_green' },
  { color: '#E0A552', highlighterColor: '#E0A55270', name: 'color_orange' },
  { color: '#FFFFFF', highlighterColor: '#FFFFFF70', name: 'color_white' },
  { color: '#1E1E1E', highlighterColor: '#1E1E1E70', name: 'color_black' },
];

// - font_y_offset_compensation: Hack to make HTML similar to Canvas
//   Data taken from Retina display
// - font_line_height_compensation: Hack to compensate for line height
//   const lineHeightMultiplier = 1.25;
//   const offsetY = ((fontSize * lineHeightMultiplier) - fontSize) / 2;

export const widthList = [
  { pen_width: 4,  highlighter_width: 8,  rainbow_pen_width: 3,  laser_width: [2,   5],  figure_size: 4,  icon_size: 14, name: 'thin',   font_size: 20, font_y_offset_compensation: 4,   font_y_offset_compensation_retina: 4,   font_line_height_compensation: 2,    close_point_distance: 1 },
  { pen_width: 8,  highlighter_width: 16, rainbow_pen_width: 4,  laser_width: [3,   8],  figure_size: 6,  icon_size: 16, name: 'light',  font_size: 28, font_y_offset_compensation: 5,   font_y_offset_compensation_retina: 5,   font_line_height_compensation: 3,    close_point_distance: 2 },
  { pen_width: 12, highlighter_width: 24, rainbow_pen_width: 8,  laser_width: [4.5, 12], figure_size: 8,  icon_size: 18, name: 'medium', font_size: 42, font_y_offset_compensation: 6.5, font_y_offset_compensation_retina: 7.5, font_line_height_compensation: 5.25, close_point_distance: 3 },
  { pen_width: 16, highlighter_width: 32, rainbow_pen_width: 12, laser_width: [6,   16], figure_size: 10, icon_size: 20, name: 'bold',   font_size: 56, font_y_offset_compensation: 9.5, font_y_offset_compensation_retina: 9.5, font_line_height_compensation: 7,    close_point_distance: 4 },
]

export const erasedFigureColor = '#D3D3D3'; // lightgray
export const erasedFigureColorWithOpacity = erasedFigureColor + '80' // 50% opacity in HEX
export const eraserTailColor = '#69696969'; // dimgray with opacity
