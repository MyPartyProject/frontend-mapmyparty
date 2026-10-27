// Local fixture-only browser checks. Start Vite before running this script.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const directory = await mkdtemp(join(tmpdir(), 'mmp-team-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${directory}`, '--no-first-run', '--no-default-browser-check', 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let socket;
let roles = ['SOCIAL_MEDIA_AGENT'];
const requests = [];
const writes = [];
const errors = [];
const imageBytes = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
const event = { id: 'event-fixture', title: 'Marketing Preview', description: '<p>Live music and community.</p>', category: 'Music', subCategory: 'Live music', type: 'EXCLUSIVE', startDate: '2099-10-26T12:00:00Z', endDate: '2099-10-26T18:00:00Z', eventStatus: 'UPCOMING', publicUrl: 'https://example.test/events/preview/music', organizer: { name: 'Preview Organizer', email: 'business@example.test', contact: '9999999999', address: 'Mumbai' }, venues: [{ name: 'Preview Venue', city: 'Mumbai', fullAddress: 'Mumbai, India' }], artists: [{ name: 'Preview Artist' }], tickets: [{ name: 'General', price: 500 }], sponsors: [], images: [], TC: ['Bring valid ID'], advisory: [], questions: [] };
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
  const pending = new Map();
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const item = pending.get(message.id); pending.delete(message.id); if (message.error) item?.reject(new Error(message.error.message)); else item?.resolve(message.result); return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params;
    const path = new URL(request.url).pathname;
    requests.push(path);
    if (request.method === 'POST' || request.method === 'PATCH') writes.push({ path, method: request.method, body: JSON.parse(request.postData || '{}') });
    if (path.endsWith('/download') && request.method !== 'OPTIONS') {
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/png' }, { name: 'Content-Disposition', value: 'attachment; filename="marketing-fixture.png"' }, { name: 'Access-Control-Expose-Headers', value: 'Content-Disposition' }, { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Credentials', value: 'true' }], body: imageBytes });
      return;
    }
    let payload = {};
    if (path.endsWith('/auth/me')) payload = { user: { id: 'team-fixture', name: 'Team Preview', email: 'team@example.test', role: roles[0] }, role: roles[0], roles };
    else if (path.endsWith('/team/events')) payload = { items: [event, { ...event, id: 'long-title', title: 'A longer event title for an upcoming music and arts celebration', flyerImage: null, eventStatus: 'UPCOMING' }], total: 2, page: 1 };
    else if (path.endsWith('/team/events/event-fixture')) payload = event;
    else if (path.endsWith('/team/roles')) payload = [{ name: 'SUPER_ADMIN', label: 'Promoter', count: 1 }, { name: 'ADMIN', label: 'Admin', assignable: true, count: 0 }, { name: 'MANAGER', label: 'Manager', deferred: true }, { name: 'CHECKER', label: 'Checker', deferred: true }, { name: 'SOCIAL_MEDIA_AGENT', label: 'Social Media Agent', assignable: true, count: 1 }];
    else if (path.endsWith('/team/members')) payload = { items: [{ id: 'member-fixture', name: 'Agent Example', email: 'agent@example.test', roles: ['SOCIAL_MEDIA_AGENT'] }], total: 1, page: 1 };
    await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' }], body: Buffer.from(JSON.stringify({ success: true, data: payload })).toString('base64') });
  };
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }); assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100); } throw new Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0, 1000)')}`); };
  const visit = async path => { await send('Page.navigate', { url: base + path }); };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.copiedText = value; } } });' });
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['light', 'dark']) {
      await visit('/team/events');
      await until('document.body.innerText.includes("Marketing Preview")');
      await evaluate(`localStorage.setItem('mapmyparty-theme', '${theme}')`);
      await visit('/team/events');
      await until('Boolean(document.querySelector("[data-marketing-card]"))');
      assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-marketing-card] h2")).fontSize'), '15px');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Event cards fit the viewport');
      const listShot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(directory, `marketing-list-${width}-${theme}.png`), Buffer.from(listShot.data, 'base64'));
      await visit('/team/events/event-fixture');
      await until('document.body.innerText.includes("business@example.test")');
      assert.equal(await evaluate(`document.documentElement.classList.contains('${theme}')`), true);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `${width} overflow`);
      await evaluate('Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.copiedText = value; } } }); true');
      await evaluate('Array.from(document.querySelectorAll("button")).find(el => el.textContent.includes("Copy marketing brief")).click()');
      await until('window.copiedText?.includes("business@example.test")');
      assert.equal(await evaluate('window.copiedText.includes("<p>")'), false);
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(directory, `marketing-${width}-${theme}.png`), Buffer.from(shot.data, 'base64'));
    }
  }
  assert.equal(requests.some(path => /\/promoter\//.test(path)), false, 'Agents must not load promoter APIs');
  await evaluate(`
    var originalObjectUrl = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
      blob.arrayBuffer().then(bytes => { window.downloadBytes = Array.from(new Uint8Array(bytes)); });
      return originalObjectUrl.call(URL, blob);
    };
    var originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      if (this.href.startsWith('blob:')) { window.downloadFilename = this.download; return; }
      return originalAnchorClick.call(this);
    }; true
  `);
  await evaluate('Array.from(document.querySelectorAll("button")).find(el => el.textContent === "Download").click()');
  await until('Boolean(window.downloadBytes && window.downloadFilename)');
  assert.deepEqual(await evaluate('window.downloadBytes'), Array.from(Buffer.from(imageBytes, 'base64')));
  assert.equal(await evaluate('window.downloadFilename'), 'marketing-fixture.png');
  await visit('/promoter/my-teams');
  await until('!location.pathname.includes("my-teams") || document.body.innerText.includes("do not have access")');
  roles = ['SUPER_ADMIN', 'ADMIN'];
  await visit('/promoter/my-teams');
  await until('document.body.innerText.includes("Agent Example")');
  const loginUrl = new URL('/team/login', base).href;
  for (const width of [1440, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const theme of ['light', 'dark']) {
      await evaluate(`localStorage.setItem('mapmyparty-theme', '${theme}')`);
      await visit('/promoter/my-teams');
      await until('Boolean(document.querySelector("input[readonly]"))');
      assert.equal(await evaluate('document.querySelector("input[readonly]").value'), loginUrl);
      assert.ok(await evaluate('document.querySelector("input[readonly]").getBoundingClientRect().width >= 180'), 'Login URL remains readable');
      await evaluate('document.querySelector("button[title$=URL]").click()');
      await until('window.copiedText === '+JSON.stringify(loginUrl));
      await evaluate('Array.from(document.querySelectorAll("button")).find(el => el.textContent === "Add member").click()');
      await until('Boolean(document.querySelector("[role=dialog] input[readonly]"))');
      const writesBeforeCopy = writes.length;
      assert.equal(await evaluate('document.querySelector("[role=dialog] input[readonly]").readOnly'), true);
      assert.ok(await evaluate('document.querySelector("[role=dialog] input[readonly]").getBoundingClientRect().width >= 180'), 'Dialog login URL remains readable');
      assert.equal(await evaluate('document.querySelector("[role=dialog] button[title$=URL]").type'), 'button');
      await evaluate('window.copiedText = null; document.querySelector("[role=dialog] button[title$=URL]").click()');
      await until('window.copiedText === '+JSON.stringify(loginUrl));
      assert.equal(writes.length, writesBeforeCopy, 'Copy must not save a member');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Login URL row fits mobile');
      await evaluate('document.querySelector("[role=dialog] .modal-close-button").click()');
      await until('!document.querySelector("[role=dialog]")');
    }
  }
  await evaluate('Array.from(document.querySelectorAll("button")).find(el => el.textContent === "Add member").click()');
  await until('Boolean(document.querySelector("input[name=password]"))');
  assert.equal(await evaluate('document.querySelector("input[name=password]").type'), 'password');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, 'Team dialog mobile overflow');
  await evaluate('document.querySelector("input[name=name]").value = "New Agent"; document.querySelector("input[name=email]").value = "new@example.com"; document.querySelector("input[name=password]").value = "Secure123!"; document.querySelector("[role=dialog] form").requestSubmit()');
  await until('!document.querySelector("[role=dialog]")');
  const creation = writes.find(write => write.path.endsWith('/team/members') && write.method === 'POST');
  assert.equal(creation.body.name, 'New Agent');
  assert.deepEqual(creation.body.roles, ['SOCIAL_MEDIA_AGENT']);
  await evaluate('Array.from(document.querySelectorAll("button")).find(el => el.textContent === "Manage roles").click()');
  await until('Boolean(document.querySelector("[role=dialog]"))');
  await evaluate('Array.from(document.querySelectorAll("[role=dialog] label")).find(el => el.textContent.trim() === "Admin").querySelector("input").click()');
  await evaluate('document.querySelector("[role=dialog] form").requestSubmit()');
  await until('!document.querySelector("[role=dialog]")');
  assert.deepEqual(writes.find(write => write.method === 'PATCH').body.roles.sort(), ['ADMIN', 'SOCIAL_MEDIA_AGENT']);
  const teamShot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(join(directory, 'my-teams-mobile.png'), Buffer.from(teamShot.data, 'base64'));
  await visit('/reset-password?type=social_media_agent');
  await until('document.body.innerText.includes("Go to Login")');
  assert.equal(await evaluate('Array.from(document.querySelectorAll("a")).find(el => el.textContent === "Go to Login").getAttribute("href")'), '/team/login');
  assert.deepEqual(errors, []);
  console.log(`PASS agent isolation, event list/detail, light/dark, desktop/mobile, copy, team login URL, download payload, account creation, multi-role editing, reset navigation. Screenshots: ${directory}`);
} finally { socket?.close(); chrome.kill(); }
