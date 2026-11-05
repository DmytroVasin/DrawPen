import { toolbarViewportMargin } from "../constants.js";

const STICKY_DISTANCE = 15;

const TOOLBAR_MODE_SWITCHER_WIDTH = 80;  // ToolBar.scss: 50px icon + two 14px drag handles + two 1px borders.
const TOOLBAR_MODE_SWITCHER_HEIGHT = 72; // ToolBar.scss: 50px icon + 20px vertical padding + two 1px borders.

const snapCoordinate = (value, minPosition, maxPosition) => {
  if (value < minPosition + STICKY_DISTANCE) return minPosition;
  if (value > maxPosition - STICKY_DISTANCE) return Math.max(minPosition, maxPosition);

  return Math.trunc(value);
};

export const snapToEdge = (x, y, viewport) => {
  const margin = toolbarViewportMargin;
  const maxToolbarX = viewport.width - margin - TOOLBAR_MODE_SWITCHER_WIDTH;
  const maxToolbarY = viewport.height - margin - TOOLBAR_MODE_SWITCHER_HEIGHT;

  return {
    x: snapCoordinate(x, margin, maxToolbarX),
    y: snapCoordinate(y, margin, maxToolbarY),
  };
};

const clamp = (value, min, max) => {
  const clamped = Math.min(
    Math.max(value, min),
    Math.max(min, max),
  );

  return Math.trunc(clamped);
};

export const fitPositionToViewport = (position, tail, isReversed, viewport) => {
  const margin = toolbarViewportMargin;
  const maxToolbarX = viewport.width - margin - TOOLBAR_MODE_SWITCHER_WIDTH;
  const maxToolbarY = viewport.height - margin - TOOLBAR_MODE_SWITCHER_HEIGHT;

  const minX = margin + (isReversed ? tail.width : 0);
  const minY = margin + (isReversed ? tail.height : 0);
  const maxX = maxToolbarX - (isReversed ? 0 : tail.width);
  const maxY = maxToolbarY - (isReversed ? 0 : tail.height);

  // If the whole panel is larger than the viewport, keep the main button visible.
  return {
    x: minX <= maxX ? clamp(position.x, minX, maxX) : clamp(position.x, margin, maxToolbarX),
    y: minY <= maxY ? clamp(position.y, minY, maxY) : clamp(position.y, margin, maxToolbarY),
  };
};

export const getReversedOnDrag = ({
  position,
  isReversed,
  orientation,
  tail,
}, viewport) => {
  let coordinate
  let toolbarLength
  let tailLength
  let viewportLength

  if (orientation === 'horizontal') {
    coordinate     = position['x'];
    toolbarLength  = TOOLBAR_MODE_SWITCHER_WIDTH;
    tailLength     = tail.width;
    viewportLength = viewport.width;
  } else {
    coordinate     = position['y'];
    toolbarLength  = TOOLBAR_MODE_SWITCHER_HEIGHT;
    tailLength     = tail.height;
    viewportLength = viewport.height;
  }

  const spaceBefore = coordinate - toolbarViewportMargin;
  const spaceAfter = viewportLength - coordinate - toolbarLength - toolbarViewportMargin;

  if (spaceBefore < tailLength && spaceAfter < tailLength) return false; // Neither side fits the tail: use the default right/down direction.
  if (spaceAfter < tailLength) return true; // Not enough space on the right/bottom: open left/up.
  if (spaceBefore < tailLength) return false; // Not enough space on the left/top: open right/down.

  return isReversed; // Both sides fit: keep the current direction.
};

const humanizedKey = (key) => {
  const keyMap = {
    Meta: "⌘",
    Control: "⌃",
    Alt: "⌥",
    Shift: "⇧",
  };

  return keyMap[key] || key;
};

export const humanizedShortcut = (shortcut) => {
  if (!shortcut) return null
  if (shortcut === '[NULL]') return null

  return shortcut.split("+").map(humanizedKey).join("");
};
