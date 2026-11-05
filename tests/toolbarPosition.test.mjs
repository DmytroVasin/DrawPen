import test from 'node:test';
import assert from 'node:assert/strict';
import { isToolbarReversed, getVisibleToolbarPosition, getPointerToolbarOffset } from '../src/shared/toolbarPosition.js';

const viewport = { width: 1440, height: 900 };
const margin = 10;

test('horizontal toolbar opens toward the space beside its icon', () => {
  assert.equal(isToolbarReversed({ x: 10, y: 400 }, viewport, 'horizontal'), false);
  assert.equal(isToolbarReversed({ x: 1350, y: 400 }, viewport, 'horizontal'), true);
  assert.equal(isToolbarReversed({ x: 900, y: 10 }, viewport, 'horizontal'), true);
});

test('vertical toolbar opens upward near the bottom', () => {
  assert.equal(isToolbarReversed({ x: 1350, y: 10 }, viewport, 'vertical'), false);
  assert.equal(isToolbarReversed({ x: 10, y: 818 }, viewport, 'vertical'), true);
});

for (const orientation of ['horizontal', 'vertical']) {
  for (const isReversed of [false, true]) {
    test(`${orientation}: repeated expansion and collapse keep the icon at the ${isReversed ? 'far' : 'near'} edge`, () => {
      const anchor = Object.freeze(orientation === 'horizontal'
        ? { x: isReversed ? 1350 : 10, y: 300 }
        : { x: 600, y: isReversed ? 818 : 10 });
      const sizes = orientation === 'horizontal'
        ? [{ width: 154, height: 72 }, { width: 460, height: 72 }]
        : [{ width: 80, height: 146 }, { width: 80, height: 452 }];
      for (let cycle = 0; cycle < 5; cycle++) {
        for (const size of [...sizes, ...sizes.toReversed()]) {
          assert.deepEqual(getVisibleToolbarPosition(anchor, viewport, size, orientation, isReversed, margin), anchor);
        }
      }
    });
  }
}

test('a constrained viewport temporarily fits the panel without losing its saved position', () => {
  const small = { width: 500, height: 500 };
  const anchor = Object.freeze({ x: 240, y: 100 });
  const isReversed = isToolbarReversed(anchor, small, 'horizontal');
  assert.deepEqual(getVisibleToolbarPosition(anchor, small, { width: 460, height: 72 }, 'horizontal', isReversed, margin), { x: 390, y: 100 });
  assert.deepEqual(getVisibleToolbarPosition(anchor, small, { width: 154, height: 72 }, 'horizontal', isReversed, margin), anchor);
});

test('floating window offsets reserve arrows on either side of a stationary icon', () => {
  assert.deepEqual(getPointerToolbarOffset('horizontal', margin), { x: 27, y: 10 });
  assert.deepEqual(getPointerToolbarOffset('vertical', margin), { x: 10, y: 27 });
  // Left-hand monitor, including its menu-bar/work-area offset.
  const display = { x: -1440, y: 25 };
  const offset = getPointerToolbarOffset('horizontal', margin);
  const bounds = { x: -117, y: 315 };
  const anchor = { x: bounds.x - display.x + offset.x, y: bounds.y - display.y + offset.y };
  assert.deepEqual(anchor, { x: 1350, y: 300 });
  assert.equal(isToolbarReversed(anchor, viewport, 'horizontal'), true);
  assert.deepEqual({ x: display.x + anchor.x - offset.x, y: display.y + anchor.y - offset.y }, bounds);
});
