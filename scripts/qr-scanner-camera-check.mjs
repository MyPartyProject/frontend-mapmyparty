import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Run the actual initialization code with a phone that rejects a second stream.
const source = await readFile(new URL('../src/components/QRScanner.jsx', import.meta.url), 'utf8');
const initBody = source.split('const init = async () => {')[1].split('\n    init();')[0];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

for (const enumerationFails of [false, true]) {
  let starts = 0;
  let starting = true;
  let cameras = [];
  let error = '';
  const run = new AsyncFunction(
    'navigator', 'Html5Qrcode', 'startWithCamera', 'html5QrCodeRef',
    'setCameras', 'setActiveCameraIdx', 'setIsStarting', 'setCameraError',
    `let mounted = true; const rearOnly = true; const init = async () => {${initBody}\n await init();`,
  );
  await run(
    { mediaDevices: {
      getSupportedConstraints: () => ({ facingMode: true }),
      enumerateDevices: async () => {
        if (enumerationFails) throw new Error('Device list unavailable');
        return [
          { kind: 'videoinput', deviceId: 'rear', label: 'Back camera' },
          { kind: 'videoinput', deviceId: 'front', label: 'Front camera' },
          { kind: 'audioinput', deviceId: 'mic', label: 'Microphone' },
        ];
      },
    } },
    { getCameras: async () => { throw new Error('NotReadableError: second stream'); } },
    async config => {
      assert.deepEqual(config, { facingMode: { exact: 'environment' } });
      starts++;
    },
    { current: { getRunningTrackSettings: () => ({ facingMode: 'environment', deviceId: 'rear' }) } },
    value => { cameras = value; }, () => {},
    value => { starting = value; }, value => { error = value; },
  );
  assert.equal(starts, 1);
  assert.equal(starting, false);
  assert.equal(error, '');
  assert.deepEqual(cameras, enumerationFails ? [] : [{ id: 'rear', label: 'Back camera' }]);
}
console.log('Rear camera starts once; optional device lookup cannot block scanning.');
