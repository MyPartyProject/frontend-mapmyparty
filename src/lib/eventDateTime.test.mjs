import test from 'node:test';
import assert from 'node:assert/strict';
import { formatEventTime } from './eventDateTime.js';

test('event time preserves local hours and minutes, including midnight and noon', () => {
  assert.equal(formatEventTime(new Date(2026, 9, 13, 0, 0).toISOString()), '12:00 AM');
  assert.equal(formatEventTime(new Date(2026, 9, 13, 12, 0).toISOString()), '12:00 PM');
  assert.equal(formatEventTime(new Date(2026, 9, 13, 19, 35).toISOString()), '7:35 PM');
});

test('offset timestamps use the same device-local time as the event page', () => {
  const timestamp = '2026-10-13T19:35:00+05:30';
  assert.equal(formatEventTime(timestamp), new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  }));
  assert.equal(formatEventTime(timestamp), formatEventTime('2026-10-13T14:05:00Z'));
});

test('missing and invalid event times allow the checkout TBA fallback', () => {
  for (const value of [undefined, null, '', 'invalid-date']) {
    assert.equal(formatEventTime(value), '');
  }
});
