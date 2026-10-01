import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

for (const timezone of ['UTC', 'Asia/Kolkata']) {
  test(`editor schedule round-trips without shifting dates in ${timezone}`, () => {
    const moduleUrl = new URL('../src/lib/eventDateTime.js', import.meta.url).href;
    const source = `import { getLocalDateTimeInputs } from ${JSON.stringify(moduleUrl)};
      const values = ['2026-10-01T20:30:00.000Z', '2026-10-02T00:30:00.000Z'];
      console.log(JSON.stringify(values.map(value => {
        const inputs = getLocalDateTimeInputs(value);
        return { inputs, saved: new Date(inputs.date + 'T' + inputs.time + ':00').toISOString() };
      })));`;
    const result = JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', source],
      { env: { ...process.env, TZ: timezone }, encoding: 'utf8' }));
    assert.equal(result[0].saved, '2026-10-01T20:30:00.000Z');
    assert.equal(result[1].saved, '2026-10-02T00:30:00.000Z');
    assert.equal(result[0].inputs.date, timezone === 'UTC' ? '2026-10-01' : '2026-10-02');
    assert.equal(result[0].inputs.time, timezone === 'UTC' ? '20:30' : '02:00');
  });
}
