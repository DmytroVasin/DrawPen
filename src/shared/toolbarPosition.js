// The saved position is always the top-left of the DrawPen mode switcher.
export const toolbarIconSize = { width: 80, height: 72 };
export const pointerToolbarArrowSize = 17;

// Open toward the half of the viewport with more room.
export function isToolbarReversed(position, viewport, orientation) {
  return orientation === 'vertical'
    ? position.y + toolbarIconSize.height / 2 > viewport.height / 2
    : position.x + toolbarIconSize.width / 2 > viewport.width / 2;
}

export function getPointerToolbarOffset(orientation, margin) {
  return {
    x: margin + (orientation === 'horizontal' ? pointerToolbarArrowSize : 0),
    y: margin + (orientation === 'vertical' ? pointerToolbarArrowSize : 0),
  };
}

// Fit the visible toolbar without overwriting the user's saved icon anchor.
// If a small viewport forces it to move, collapsing restores that anchor.
export function getVisibleToolbarPosition(position, viewport, size, orientation, isReversed, margin) {
  const offsetX = isReversed && orientation === 'horizontal' ? size.width - toolbarIconSize.width : 0;
  const offsetY = isReversed && orientation === 'vertical' ? size.height - toolbarIconSize.height : 0;
  const left = position.x - offsetX;
  const top = position.y - offsetY;
  const maxLeft = viewport.width - margin - size.width;
  const maxTop = viewport.height - margin - size.height;
  return {
    x: Math.max(margin, Math.min(left, maxLeft)) + offsetX,
    y: Math.max(margin, Math.min(top, maxTop)) + offsetY,
  };
}
