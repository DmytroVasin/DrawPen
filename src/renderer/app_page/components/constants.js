import ntc from "ntcjs";

export const timeStep = 100;
// export const laserTime = 2000; // schema.laser_time.default
export const laserTimeMin = 300;
export const laserTimeMax = 5000;
// export const fadeDisappearAfter = 1500; // schema.fade_disappear_after_ms.default
export const fadeDisappearAfterMin = 300;
export const fadeDisappearAfterMax = 15000;
// export const fadeOutDurationTime = 1000; // schema.fade_out_duration_time_ms.default
export const fadeOutDurationTimeMsMin = 300;
export const fadeOutDurationTimeMsMax = 5000;
export const fadeOutDestroyAfterMs = 300;
export const shortcutHintHoldDelayMs = 500;
export const updateStoreDelay = 300;
export const toolbarViewportMargin = 10; // Equals to "--border-size"*2

export const eraserTime = 100;
export const rainbowScaleFactor = 0.03;
export const minObjectDistance = 5; // Minimum length of drawn object
export const figureMinScale = 0.2;
export const pastCooldownMs = 300;
export const escDoubleTapMs = 300;
export const SNAP_ANGLE = Math.PI / 12; // 45°
export const highlighterAlpha = 0.35;
export const eraserAlpha = 0.5;
export const minWhiteboardWidth = 350;
export const minWhiteboardHeight = 350;

export const zoomLevels = [1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];
export const initialZoomIndex = 3;

export const palmMinContactLength = 35; // Min touch contact length to detect a palm/fist
export const palmMinContactArea = 2000;

export const drawingToolList = ['brush', 'pen', 'fadepen'];
export const penVariantList = ['pen', 'fadepen'];

export const shapeList = ['arrow', 'flat_arrow', 'rectangle', 'diamond', 'oval', 'line', 'stamp'];
export const arrowVariantList = ['arrow', 'flat_arrow'];

export const outlinedFigureBgColor = '#FFFFFF';
export const outlinedFigureDarkBgColor = '#1E1E1E';
export const outlinedFigureEdgeColor = '#808080';
export const outlinedFigureInnerBorderWidthList = [2, 2, 3, 4, 5];

export const minArrowLength = 30;
export const arrowSetup = [
  { max_scale_length: 100, d2_y: 4,  d3_y: 18, d2_x: 17, d3_x: 20 },
  { max_scale_length: 150, d2_y: 7,  d3_y: 30, d2_x: 28, d3_x: 33 },
  { max_scale_length: 200, d2_y: 10, d3_y: 42, d2_x: 39, d3_x: 46 },
  { max_scale_length: 250, d2_y: 13, d3_y: 54, d2_x: 50, d3_x: 59 },
  { max_scale_length: 300, d2_y: 16, d3_y: 66, d2_x: 61, d3_x: 72 },
];

export const dotRadius = 5;
export const dotStrokeWidth = 1;
export const dotHoverRadius = 10;
export const sideHoverTolerance = 5;
export const dotBorderColor = '#6CC3E2';
export const dotHoverColor = dotBorderColor + '99';
export const activeSelectionBoxLineWidth = 1;
export const dotTextMargin = 5;

export const isLightColor = (color) => {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);

  return ((red * 299) + (green * 587) + (blue * 114)) / 1000 > 200;
};

export const defaultColorPickerColors = [ // must match Electron Store tool_bar_color_palette defaults
  '#529BE0',
  '#E05252',
  '#52E06C',
  '#E0A552',
  '#FFFFFF',
  '#1E1E1E',
];

export const toolbarColorIds = [
  'color_1',
  'color_2',
  'color_3',
  'color_4',
  'color_5',
  'color_6',
];

export const createApplicationColorList = (colorPalette) => {
  const rainbowColor = {
    id: 'color_0',
    color: '#000000',
    title: 'Rainbow',
    isLightColor: false,
    isRainbow: true,
  };

  return [
    rainbowColor,
    ...toolbarColorIds.map((colorId) => {
      const color = colorPalette[colorId];

      return {
        id: colorId,
        color: color,
        title: ntc.name(color)[1],
        isLightColor: isLightColor(color),
        isRainbow: false,
      };
    }),
  ];
};

// - font_y_offset_compensation: Hack to make HTML similar to Canvas
//   Data taken from Retina display

export const lineHeightMultiplier = 1.25;
export const widthList = [
  { pen_fixed_width: 2,  pen_pressure_width: 2,  figure_width: 2,  stamp_radius: 20, highlighter_width: 10, laser_width: [2,   6],  icon_size: 14, name: 'thin',       title: 'Thin',       font_size: 20, font_y_offset_compensation: 4,   font_y_offset_compensation_retina: 3.5, close_point_distance: 1 },
  { pen_fixed_width: 4,  pen_pressure_width: 5,  figure_width: 4,  stamp_radius: 25, highlighter_width: 18, laser_width: [3,   8],  icon_size: 16, name: 'light',      title: 'Light',      font_size: 28, font_y_offset_compensation: 5,   font_y_offset_compensation_retina: 5,   close_point_distance: 2 },
  { pen_fixed_width: 6,  pen_pressure_width: 8,  figure_width: 6,  stamp_radius: 30, highlighter_width: 26, laser_width: [4,   10], icon_size: 18, name: 'medium',     title: 'Medium',     font_size: 42, font_y_offset_compensation: 6.5, font_y_offset_compensation_retina: 7.5, close_point_distance: 3 },
  { pen_fixed_width: 8,  pen_pressure_width: 11, figure_width: 8,  stamp_radius: 35, highlighter_width: 34, laser_width: [5,   12], icon_size: 20, name: 'bold',       title: 'Bold',       font_size: 56, font_y_offset_compensation: 9.5, font_y_offset_compensation_retina: 9.5, close_point_distance: 4 },
  { pen_fixed_width: 10, pen_pressure_width: 14, figure_width: 10, stamp_radius: 40, highlighter_width: 42, laser_width: [6,   16], icon_size: 22, name: 'extra-bold', title: 'Extra Bold', font_size: 70, font_y_offset_compensation: 12,  font_y_offset_compensation_retina: 12,  close_point_distance: 5 },
]

export const erasedFigureColor = '#D3D3D3'; // lightgray
export const eraserTailColor = '#69696969'; // dimgray with opacity
