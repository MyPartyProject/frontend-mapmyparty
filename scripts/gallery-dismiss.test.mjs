import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/pages/EventDetailNew.jsx', import.meta.url), 'utf8');
const names = ['handleGalleryTouchStart', 'handleGalleryTouchMove', 'handleGalleryTouchEnd'];
const declarations = names.map(name => {
  const match = source.match(new RegExp(`  const ${name} = \\(event\\) => \\{[\\s\\S]*?\\n  \\};`));
  assert.ok(match, `${name} exists`);
  return match[0];
}).join('\n');

function viewer() {
  const ref = { current: null };
  let closes = 0;
  const handlers = new Function('galleryTouchRef', 'setSelectedImage',
    `${declarations}; return [${names.join(',')}];`)(ref, () => closes++);
  return { ref, start: handlers[0], move: handlers[1], end: handlers[2], closes: () => closes };
}
const point = (x, y) => ({ clientX: x, clientY: y });
const event = (touches, changedTouches = touches, button = false) => ({
  touches, changedTouches, target: { closest: () => button },
});

test('downward swipe closes, while upward, short, and horizontal gestures do not', () => {
  for (const [x, y, expected] of [[10, 100, 1], [0, -120, 0], [0, 40, 0], [120, 20, 0], [90, 100, 0]]) {
    const v = viewer();
    v.start(event([point(0, 0)]));
    v.move(event([point(x, y)]));
    v.end(event([], [point(x, y)]));
    assert.equal(v.closes(), expected, `gesture ${x},${y}`);
  }
});

test('horizontal navigation cannot turn into dismissal; drags suppress background clicks', () => {
  const v = viewer();
  v.start(event([point(0, 0)]));
  v.move(event([point(60, 5)]));
  v.end(event([], [point(60, 200)]));
  assert.equal(v.closes(), 0);
  assert.equal(v.ref.current.moved, true);
  v.start(event([point(0, 0)]));
  v.end(event([], [point(0, 0)]));
  assert.equal(v.ref.current.moved, false, 'a fresh background tap can close');
});

test('pinches, cancelled touches, and gestures starting on buttons do not dismiss', () => {
  for (const kind of ['pinch', 'cancel', 'button']) {
    const v = viewer();
    v.start(event([point(0, 0)], [], kind === 'button'));
    if (kind === 'pinch') v.move(event([point(0, 20), point(40, 20)]));
    if (kind === 'cancel') v.ref.current = { cancelled: true, moved: true };
    v.end(event([], [point(0, 150)]));
    assert.equal(v.closes(), 0, kind);
  }
});
