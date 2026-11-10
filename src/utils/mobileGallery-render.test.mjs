import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('mobile gallery opens at the clicked image and hides controls for a single image', async t => {
  const previous = globalThis.window;
  globalThis.window = { matchMedia: () => ({ matches: false }) };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  const output = resolve('node_modules/.cache/mobile-gallery-render.mjs');
  const result = await build({
    entryPoints: ['src/components/event-detail/MobileGalleryViewer.jsx'], bundle: true, write: false,
    platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', alias: { '@': resolve('src') },
  });
  await mkdir(resolve('node_modules/.cache'), { recursive: true });
  await writeFile(output, result.outputFiles[0].text);
  try {
    const { default: Viewer } = await import(pathToFileURL(output));
    const render = images => renderToStaticMarkup(React.createElement(Viewer, { images, selectedImage: 'second.jpg', onSelect() {} }));
    const multiple = render(['first.jpg', 'second.jpg', 'third.jpg']);
    assert.match(multiple, /2 \/ 3/);
    assert.match(multiple, /aria-label="Previous image"/);
    assert.match(multiple, /aria-label="Next image"/);
    assert.match(multiple, /object-contain/);
    const single = render(['second.jpg']);
    assert.doesNotMatch(single, /aria-label="Next image"/);
    assert.doesNotMatch(single, /aria-label="Previous image"/);
  } finally { await unlink(output); }
});
