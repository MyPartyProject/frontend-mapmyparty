import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Exercise the real request wrapper without a browser or live API.
const source = (await readFile(new URL('../src/services/eventService.js', import.meta.url), 'utf8'))
  .split('// -------- S3 Storage Upload Helpers')[0]
  .replace(/import .* from .*;\r?\n/g, '');
const calls = [];
const changes = [];
let invalidations = 0;
const replies = [];
globalThis.window = new EventTarget();
window.addEventListener('event-publication-saved', event => changes.push(event.detail));
globalThis.publicationSmoke = {
  buildUrl: path => path,
  invalidateOrganizerEventsCache: () => { invalidations++; },
  request: async (url, options) => {
    calls.push({ url, options });
    const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return reply;
  },
};
const moduleSource = 'const { buildUrl, request, invalidateOrganizerEventsCache } = globalThis.publicationSmoke;\n' + source;
const { rememberEventRevision, eventDraftFetch, requestEventPublication } = await import(`data:text/javascript;base64,${Buffer.from(moduleSource).toString('base64')}`);
rememberEventRevision({ id: 'event-1', publication: { version: 3, approvalRequired: false }, tickets: [{ id: 'ticket-1' }] });
replies.push({ data: { id: 'ticket-1', eventId: 'event-1', publication: { version: 5, status: 'APPLIED', approvalRequired: false, requiresApplySavedChanges: false } } });
await eventDraftFetch('/api/ticket/update-ticket/ticket-1', { method: 'PUT', body: '{}' });
assert.equal(calls[0].options.headers['x-event-revision'], '3');
assert.equal(changes[0].eventId, 'event-1');
assert.equal(changes[0].publication.status, 'APPLIED');
assert.equal(invalidations, 1);
replies.push(new Error('Capacity is below sales'));
await assert.rejects(eventDraftFetch('/api/ticket/update-ticket/ticket-1', { method: 'PUT', body: '{}' }), /Earlier successful saves remain live/);
assert.equal(calls[1].options.headers['x-event-revision'], '5');
assert.equal(changes.length, 1);
rememberEventRevision({ id: 'event-1', publication: { version: 8, approvalRequired: false, requiresApplySavedChanges: true } });
replies.push({ data: { id: 'event-1', publication: { version: 9, status: 'APPLIED', approvalRequired: false, requiresApplySavedChanges: false } } });
await requestEventPublication('event-1');
assert.equal(JSON.parse(calls[2].options.body).expectedVersion, 8);
assert.equal(changes[1].publication.requiresApplySavedChanges, false);
delete globalThis.publicationSmoke;
delete globalThis.window;
console.log('Publication client smoke passed: version tracking, item routing, live status, failed saves and saved-batch application.');
