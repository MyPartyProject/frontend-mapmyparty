import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidGstFormat } from '../src/utils/gst.js';

test('optional GST accepts the Indian format and rejects malformed input', () => {
  for (const value of ['', undefined, '22AAAAA0000A1Z5', ' 22aaaaa0000a1z5 ']) {
    assert.equal(isValidGstFormat(value), true);
  }
  for (const value of ['123', '22AAAAA0000A1Z', '22AAAAA0000A1Z55', 'AA22AAA0000A1Z5', '22AAAAA0000A0Z5', '22AAAAA0000A1X5']) {
    assert.equal(isValidGstFormat(value), false);
  }
});
