import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../src/pages/CreateEvent.jsx', import.meta.url), 'utf8');
const handler = source.slice(source.indexOf('  const handleGalleryImagesChange ='), source.indexOf('  const removeGalleryImage ='));
const file = name => ({ name, type: 'image/jpeg' });
const image = name => ({ url: `https://example.test/${name}`, publicId: `gallery/${name}` });

function setup(existing = []) {
  const state = { galleryImages: [...existing], draftGalleryUploads: [], galleryImageStorageKeys: {}, uploadingGallery: false, imagesChanged: false };
  const requests = [];
  const errors = [];
  const successes = [];
  const context = {
    ...state,
    console: { error() {} },
    toast: { error: message => errors.push(message), success: message => successes.push(message) },
    uploadDraftImage: (file, folder) => new Promise((resolve, reject) => requests.push({ file, folder, resolve, reject })),
  };
  for (const key of Object.keys(state)) {
    context[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => {
      state[key] = typeof value === 'function' ? value(state[key]) : value;
      context[key] = state[key];
    };
  }
  vm.createContext(context);
  vm.runInContext(`${handler}\nthis.upload = handleGalleryImagesChange;`, context);
  const select = files => {
    const event = { target: { files, value: 'selected' } };
    return { event, done: context.upload(event) };
  };
  return { state, requests, errors, successes, select };
}

const progress = setup(['existing']);
const batch = progress.select([file('one'), file('two')]);
assert.equal(progress.state.uploadingGallery, true);
assert.deepEqual([...progress.state.galleryImages], ['existing']);
assert.equal(progress.requests.length, 1);
progress.requests[0].resolve(image('one'));
await new Promise(resolve => setImmediate(resolve));
assert.equal(progress.requests[0].folder, 'gallery');
assert.deepEqual([...progress.state.galleryImages], ['existing', image('one').url]);
assert.equal(progress.state.draftGalleryUploads[0].publicId, image('one').publicId);
assert.equal(progress.state.galleryImageStorageKeys[image('one').url], image('one').publicId);
assert.equal(progress.state.imagesChanged, true);
assert.equal(progress.state.uploadingGallery, true, 'First image appears while second upload is pending');
assert.equal(progress.requests.length, 2);
assert.equal(progress.successes.length, 0);
progress.requests[1].resolve(image('two'));
await batch.done;
assert.deepEqual([...progress.state.galleryImages], ['existing', image('one').url, image('two').url]);
assert.equal(progress.state.draftGalleryUploads.length, 2);
assert.equal(progress.state.galleryImageStorageKeys[image('two').url], image('two').publicId);
assert.equal(progress.state.uploadingGallery, false);
assert.equal(batch.event.target.value, '');
assert.equal(progress.successes.length, 1);

const failure = setup();
const failedBatch = failure.select([file('one'), file('two'), file('three')]);
failure.requests[0].resolve(image('one'));
await new Promise(resolve => setImmediate(resolve));
failure.requests[1].reject(new Error('Upload failed'));
await failedBatch.done;
assert.deepEqual([...failure.state.galleryImages], [image('one').url]);
assert.equal(failure.state.draftGalleryUploads[0].publicId, image('one').publicId);
assert.equal(failure.state.galleryImageStorageKeys[image('one').url], image('one').publicId);
assert.equal(failure.requests.length, 2, 'Batch still stops on failure');
assert.equal(failure.errors[0], 'Upload failed');
assert.equal(failure.state.uploadingGallery, false);
assert.equal(failedBatch.event.target.value, '');

const limit = setup(Array.from({ length: 10 }, (_, i) => `existing-${i}`));
await limit.select([file('extra')]).done;
assert.equal(limit.requests.length, 0);
assert.match(limit.errors[0], /Maximum 10/);
const invalid = setup();
await invalid.select([{ name: 'notes.txt', type: 'text/plain' }]).done;
assert.equal(invalid.requests.length, 0);
assert.match(invalid.errors[0], /Only images/);

console.log('PASS incremental gallery uploads, persistence metadata, partial failure recovery, input reset, and validation');
