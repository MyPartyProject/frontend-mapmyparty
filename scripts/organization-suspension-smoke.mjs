// Local fixture-only browser checks. Start Vite before running this script.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:5187';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const directory = await mkdtemp(join(tmpdir(), 'mmp-suspension-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${directory}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let closing = false;
const pending = new Map();
const roles = ['ORGANIZER', 'USER'];
let suspended = true;
const requests = [];
const writes = [];
const errors = [];
const imageBytes = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const event = { id: 'event-fixture', title: 'Suspension Preview', description: '<p>Live music and community.</p>', category: 'Music', subCategory: 'Live music', type: 'EXCLUSIVE', startDate: '2099-10-26T12:00:00Z', endDate: '2099-10-26T18:00:00Z', eventStatus: 'UPCOMING', publicUrl: 'https://example.test/events/preview/music', organizer: { name: 'Preview Organizer', email: 'business@example.test', contact: '9999999999', address: 'Mumbai' }, venues: [{ name: 'Preview Venue', city: 'Mumbai', fullAddress: 'Mumbai, India' }], artists: [{ name: 'Preview Artist' }], tickets: [{ name: 'General', price: 500 }], sponsors: [], images: [], TC: ['Bring valid ID'], advisory: [], questions: [] };
event.flyerImage = `data:image/png;base64,${imageBytes}`;
event.flyerMimeType = 'image/png';
event.images = [{ id: 'gallery-fixture', url: event.flyerImage, mimeType: 'image/png' }];
try {
  let port;
  for (let i = 0; i < 100; i++) { try { port = (await readFile(join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); } }
  assert.ok(port, 'Chrome started');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let serial = 0;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = async ({ data }) => {
    if (closing) return;
    const message = JSON.parse(data);
    if (message.id) { const item = pending.get(message.id); pending.delete(message.id); if (message.error) item?.reject(new Error(message.error.message)); else item?.resolve(message.result); return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params;
    const path = new URL(request.url).pathname;
    requests.push(path);
    if (request.method === 'POST' || request.method === 'PATCH') writes.push({ path, method: request.method, body: JSON.parse(request.postData || '{}') });
    let payload = {};
    if (path.endsWith('/auth/me')) payload = { user: { id: 'fixture-owner', name: 'Fixture Organizer', email: 'owner@example.test', role: roles[0] }, role: roles[0], roles, organizer: { id: 'org', name: 'Fixture Organizer' }, hasOrganizerProfile: true, hasBankDetails: true, onboarding: { completed: true } };
    else if (path.endsWith('/organizer/me/access-status')) payload = { isSuspended: suspended, suspensionReason: suspended ? 'Account review required' : null };
    else if (path.endsWith('/support/tickets/me')) payload = { items: [], total: 0 };
    else if (path.endsWith('/public/events/preview/music')) payload = { ...event, bookingAvailable: false };
    else if (path.endsWith('/tickets')) payload = [{ id: 'ticket', name: 'General', price: 500, availableQty: 25, remainingQty: 25 }];
    else if (/\/(venues|artists|gallery|sponsors)$/.test(path)) payload = [];
    await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' }], body: Buffer.from(JSON.stringify({ success: true, data: payload })).toString('base64') });
  };
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }); assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100); } throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0, 1000)')}`); };
  const visit = async path => { await send('Page.navigate', { url: base + path }); };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['light', 'dark']) {
      await visit('/organizer/dashboard');
      await until('document.body.innerText.includes("Organization suspended")');
      await evaluate(`localStorage.setItem('mapmyparty-theme', '${theme}')`);
      await visit('/organizer/payouts');
      await until('location.pathname === "/organizer/support" && document.body.innerText.includes("Account review required")');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'support fits viewport');
      assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).filter(a => a.getAttribute("href") === "/organizer/payouts").length'), 0);
      const pageShot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(directory, `support-page-${width}-${theme}.png`), Buffer.from(pageShot.data, 'base64'));
      await evaluate('Array.from(document.querySelectorAll("button")).find(button => button.textContent.trim() === "Create ticket").click()');
      await until('Boolean(document.querySelector("[role=dialog]"))');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(directory, `support-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
      await visit('/events/preview/music');
      await until('document.body.innerText.includes("Bookings unavailable")');
      assert.equal(await evaluate('Array.from(document.querySelectorAll("button")).filter(button => button.textContent.includes("Bookings unavailable")).every(button => button.disabled)'), true);
    }
  }
  assert.equal(requests.some(path => path.includes('/organizer/me/profile') || path.includes('/organizer/me/payouts')), false, 'restricted pages never fetch protected records');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await visit('/organizer/support');
  await until('document.body.innerText.includes("Organization suspended")');
  suspended = false;
  await evaluate('window.dispatchEvent(new Event("focus"))');
  await until('!document.body.innerText.includes("Organization suspended") && document.body.innerText.includes("Organizer Support")');
  suspended = true;
  await evaluate('window.dispatchEvent(new Event("organization:suspended"))');
  await until('document.body.innerText.includes("Organization suspended")');
  assert.deepEqual(errors, []);
  assert.equal(writes.filter(write => !write.path.includes('/auth/')).length, 0, 'no external writes');
  console.log(`PASS support-only redirects, support form, reinstatement, stale-page restriction, public sales disabled, desktop/mobile and light/dark. Screenshots: ${directory}`);
} finally {
  closing = true;
  for (const item of pending.values()) item.resolve({});
  pending.clear();
  socket?.close();
  chrome.kill();
}
