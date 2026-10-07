// Run Vite first. Uses local API/camera fixtures; physical camera QA is separate.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const artifacts = await mkdtemp(join(tmpdir(), 'mmp-entry-agent-browser-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${join(artifacts, 'profile')}`, '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
const pending = new Map(), errors = [], requests = [];
const agent = { id: 'agent-one', agentId: 'desk_one', name: 'Riya · Entry Agent', active: true, guidelines: 'Check the entire group before allowing entry.' };
const event = { id: 'event-one', title: 'Friday Night Live', startDate: new Date(Date.now() - 3600000).toISOString(), endDate: new Date(Date.now() + 3600000).toISOString(), instructions: 'Direct guests to Gate 2.', entryInstructions: 'Direct guests to Gate 2.', venues: [{ name: 'The Courtyard', city: 'Bengaluru', fullAddress: '12 Main Road' }] };
let admitted = false, blocked = false, sessionExpired = false, admissionLost = false;
let refreshDelay = 0, refreshFailed = false;
let paginatedActivity = false;
let upcomingLocked = true;
const upcomingEvent = { ...event, id: 'event-upcoming', title: 'Upcoming assigned event', startDate: new Date(Date.now() + 3 * 86400000).toISOString(), endDate: new Date(Date.now() + 4 * 86400000).toISOString() };
const istMidnight = date => new Date(Math.floor((new Date(date).getTime() + 19800000) / 86400000) * 86400000 - 19800000).toISOString();
const qrToken = '11111111-1111-4111-8111-111111111111';
const ticket = () => ({ bookingItemId: 'item-one', ticketReference: 'MMP-TKT-001', attendeeName: 'Aarav Sharma', ticketType: 'Group Pass', ticketCategory: 'GROUP_TICKET', quantity: 4, checkedIn: admitted, alreadyCheckedIn: admitted, checkedInAt: admitted ? new Date().toISOString() : null, event });
const activity = () => ({ rows: admitted ? [{ id: 'item-one', ticketReference: 'MMP-TKT-001', attendeeName: 'Aarav Sharma', ticketType: 'Group Pass', quantity: 4, checkedInAt: new Date().toISOString(), agentName: agent.name, agentId: agent.agentId }] : [], total: admitted ? 1 : 0, page: 1, pageSize: 20 });
const scannerModule = `import React from '/node_modules/.vite/deps/react.js'; export default function Scanner(props){return React.createElement('div', {role:'dialog', 'data-rear-only':String(props.rearOnly)},React.createElement('button',{onClick:()=>props.onScan('${qrToken}')},'Fixture scan'),React.createElement('button',{onClick:props.onClose},'Use manual code'));}`;
try {
  let port;
  for (let i = 0; i < 100; i++) { try { port = (await readFile(join(artifacts, 'profile', 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); } }
  assert.ok(port, 'Chrome started');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let nextId = 0;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
    pending.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) { const entry = pending.get(message.id); pending.delete(message.id); if (message.error) entry?.reject(new Error(message.error.message)); else entry?.resolve(message.result); return; }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params;
    const url = new URL(request.url), path = url.pathname;
    if (request.method === 'OPTIONS') {
      await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: [
        { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: 'content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,OPTIONS' },
      ] });
      return;
    }
    if (path.endsWith('/QRScanner.jsx')) {
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/javascript' }], body: Buffer.from(scannerModule).toString('base64') }); return;
    }
    requests.push({ path, search: url.search, method: request.method });
    let responseCode = 200, result = { success: true, data: {} };
    const body = request.postData ? JSON.parse(request.postData) : {};
    if (path.endsWith('/auth/me')) result.data = { user: { id: 'owner', name: 'Owner', role: 'ORGANIZER' }, organizer: { id: 'org', name: 'Organizer' }, hasOrganizerProfile: true, hasBankDetails: true, isBankVerified: true };
    if (path.endsWith('/organizer/me/onboarding-status')) result.data = { completed: true, hasOrganizerProfile: true, hasBankDetails: true };
    if (path.endsWith('/entry-agent/login')) { sessionExpired = false; result.data = agent; }
    if (path.endsWith('/entry-agent/logout')) result.data = { loggedOut: true };
    if (path.endsWith('/entry-agent/me')) result.data = agent;
    if (path.endsWith('/entry-agent/events')) result.data = blocked ? [] : [{ ...event, locked: false, unlockAt: istMidnight(event.startDate) }, { ...upcomingEvent, locked: upcomingLocked, unlockAt: istMidnight(upcomingEvent.startDate) }];
    if (path.endsWith('/entry-agent/events/event-upcoming')) {
      if (upcomingLocked) { responseCode = 403; result = { errorMessage: 'This event is not available for entry. Contact your organizer.' }; }
      else result.data = { event: upcomingEvent, guidelines: agent.guidelines, totals: { total: 0, totalBooked: 0, bookedQuantity: 0, checkedInQuantity: 0 }, activity: { rows: [], total: 0, page: 1, pageSize: 20 }, serverTime: new Date().toISOString() };
    }
    if (path.endsWith('/entry-agent/events/event-one')) result.data = { event, guidelines: agent.guidelines, totals: { total: admitted ? 1 : 0, totalBooked: 2, bookedQuantity: 8, checkedInQuantity: admitted ? 4 : 0 }, activity: activity(), serverTime: new Date().toISOString() };
    if (path.endsWith('/entry-agent/events/event-one') && paginatedActivity) result.data.activity = { ...activity(), total: 21, page: Number(url.searchParams.get('page') || 1) };
    if (path.endsWith('/entry-agent/me') || path.endsWith('/entry-agent/events')) {
      if (refreshDelay) await delay(refreshDelay);
      if (refreshFailed) { responseCode = 503; result = { errorMessage: 'Refresh unavailable.' }; }
    }
    if (path.endsWith('/verify')) {
      result.data = ticket();
      if (body.manualCheckInCode === 'badbad') { responseCode = 404; result = { errorMessage: 'Ticket not found.' }; }
    }
    if (path.endsWith('/admit')) {
      const wasAdmitted = admitted; admitted = true; result.data = { ...ticket(), alreadyCheckedIn: wasAdmitted };
      if (admissionLost) { responseCode = 503; result = { errorMessage: 'Connection interrupted after admission.' }; admissionLost = false; }
    }
    if (path.includes('/entry-agent/events/') && blocked) { responseCode = 403; result = { errorMessage: 'You are not assigned to this event.' }; }
    if (path.includes('/entry-agent/') && !path.endsWith('/login') && sessionExpired) { responseCode = 401; result = { errorMessage: 'Session expired.' }; }
    if (path.endsWith('/organizer/entry-agents')) result.data = request.method === 'POST' ? { ...agent, ...body, id: 'new-agent' } : [agent, ...Array.from({ length: 5 }, (_, i) => ({ ...agent, id: 'extra-' + i, agentId: 'desk_extra_' + i, name: 'A very long entry agent name for layout verification ' + i, active: i % 2 === 0 }))];
    if (path.endsWith('/organizer/entry-agents/events')) result.data = [event, ...Array.from({ length: 29 }, (_, i) => ({ ...event, id: 'event-extra-' + i, title: 'Another organizer event ' + i, publishStatus: i === 0 ? 'DRAFT' : 'PUBLISHED', startDate: i === 0 ? null : event.startDate }))];
    if (path.endsWith('/organizer/entry-agents/events/event-one')) result.data = request.method === 'PUT' ? { saved: true } : { event, agentIds: [agent.id], counts: [{ agentId: agent.id, admissions: admitted ? 1 : 0, attendees: admitted ? 4 : 0 }], activity: activity() };
    if (path.endsWith('/password')) result.data = agent;
    await send('Fetch.fulfillRequest', { requestId, responseCode, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Credentials', value: 'true' }, { name: 'Access-Control-Allow-Headers', value: 'content-type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,OPTIONS' }], body: Buffer.from(JSON.stringify(result)).toString('base64') });
  };
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const until = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(100); } throw new Error('Timed out: ' + expression + '\n' + await evaluate('document.body.innerText')); };
  const click = text => evaluate(`[...document.querySelectorAll('button')].find(b => b.innerText.includes(${JSON.stringify(text)}))?.click()`);
  const fill = (selector, value) => evaluate(`{const el=document.querySelector(${JSON.stringify(selector)}); const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; setter.call(el,${JSON.stringify(value)}); el.dispatchEvent(new Event('input',{bubbles:true}));}`);
  const navigate = async path => { await send('Page.navigate', { url: base + path }); await until('document.readyState === "complete"'); };
  const screenshot = async name => { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await writeFile(join(artifacts, name + '.png'), Buffer.from(result.data, 'base64')); };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }, { urlPattern: '*/src/components/QRScanner.jsx*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/entry-agent/login'); await until('!!document.querySelector("input[name=agentId]")');
  await evaluate('[...document.querySelectorAll("button")].find(b => b.getAttribute("aria-label") === "Show password").click()');
  assert.equal(await evaluate('document.querySelector("input[name=password]").type'), 'text');
  await fill('input[name=agentId]', 'desk_one'); await fill('input[name=password]', 'FixturePassword1!'); await click('Sign in');
  await until('document.body.innerText.includes("Friday Night Live")');
  const refreshReady = '[...document.querySelectorAll("button")].some(b => b.innerText.includes("Refresh") && !b.disabled)';
  const readCounts = () => ['/api/entry-agent/me', '/api/entry-agent/events'].map(path => requests.filter(r => r.path === path && r.method === 'GET').length);
  await until(refreshReady);
  let before = readCounts();
  refreshDelay = 500;
  await evaluate(`{ const refresh = [...document.querySelectorAll('button')].find(b => b.innerText.includes('Refresh')); refresh.click(); refresh.click(); window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('online')); }`);
  await until('[...document.querySelectorAll("button")].some(b => b.innerText.includes("Refresh") && b.disabled)');
  await until(refreshReady);
  assert.deepEqual(readCounts(), before.map(count => count + 1), 'Overlapping manual clicks and reconnect send one request per endpoint');
  before = readCounts();
  await evaluate(`window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange'));`);
  await delay(16000);
  assert.deepEqual(readCounts(), before, 'No polling or focus/tab-return refresh');
  assert.equal(await evaluate('document.body.innerText.includes("refreshes every 15s")'), false);
  refreshFailed = true;
  await click('Refresh'); await until('document.body.innerText.includes("Refresh unavailable")'); await until(refreshReady);
  refreshFailed = false; before = readCounts();
  await click('Refresh'); await until(refreshReady);
  assert.deepEqual(readCounts(), before.map(count => count + 1), 'Manual refresh recovers after failure');
  assert.equal(await evaluate('!!document.querySelector("[role=alert]")'), false);
  before = readCounts();
  await evaluate(`window.dispatchEvent(new Event('online')); window.dispatchEvent(new Event('online'));`);
  await until('[...document.querySelectorAll("button")].some(b => b.innerText.includes("Refresh") && b.disabled)');
  await until(refreshReady);
  assert.deepEqual(readCounts(), before.map(count => count + 1), 'Reconnect still refreshes once');
  refreshDelay = 0;
  console.log('PASS single refresh requests, overlap guard, failure recovery, reconnect and no 15-second/focus polling');
  const lockedCard = `[...document.querySelectorAll('h3')].find(h => h.textContent === 'Upcoming assigned event').parentElement`;
  assert.equal(await evaluate(`(() => { const card = ${lockedCard}; return card.tagName === 'DIV' && !card.querySelector('a,button,[tabindex]') && card.textContent.includes('Unlocks on'); })()`), true, 'Locked assignment has no link or keyboard action');
  const detailCount = requests.filter(r => r.path === '/api/entry-agent/events/event-upcoming').length;
  await evaluate(`(${lockedCard}).click()`);
  assert.equal(await evaluate('location.pathname'), '/entry-agent/events');
  assert.equal(requests.filter(r => r.path === '/api/entry-agent/events/event-upcoming').length, detailCount);
  await screenshot('locked-assignment');
  await navigate('/entry-agent/events/event-upcoming');
  await until('document.body.innerText.includes("not available for entry")');
  assert.equal(await evaluate('!!document.querySelector("input[placeholder]")'), false, 'Direct URL cannot expose entry actions');
  await navigate('/entry-agent/events'); await until(refreshReady);
  upcomingLocked = false;
  await click('Refresh'); await until(`!!document.querySelector('a[href="/entry-agent/events/event-upcoming"]')`); await until(refreshReady);
  await evaluate(`document.querySelector('a[href="/entry-agent/events/event-upcoming"]').click()`);
  await until('document.body.innerText.includes("Ticket check-in code")');
  await navigate('/entry-agent/events'); await until(refreshReady);
  console.log('PASS locked assignment card, direct URL denial and server unlock reflected after refresh');
  await evaluate('document.querySelector("a[href*=event-one]").click()');
  await until('document.body.innerText.includes("Ticket check-in code")');
  await until(refreshReady);
  paginatedActivity = true;
  await click('Refresh'); await until('document.body.innerText.includes("Your admissions (21)")'); await until(refreshReady);
  const detailReads = () => requests.filter(r => r.path === '/api/entry-agent/events/event-one' && r.method === 'GET');
  let detailBefore = detailReads().length;
  await click('Next'); await until(refreshReady);
  assert.equal(detailReads().length, detailBefore + 1, 'Pagination refreshes detail once');
  assert.equal(detailReads().at(-1).search, '?page=2');
  detailBefore = detailReads().length;
  await click('Previous'); await until(refreshReady);
  assert.equal(detailReads().length, detailBefore + 1);
  assert.equal(detailReads().at(-1).search, '?page=1');
  paginatedActivity = false;
  console.log('PASS entry activity pagination');
  await screenshot('mobile-entry-desk');
  await click('Scan ticket QR'); await until('!!document.querySelector("[data-rear-only]")');
  assert.equal(await evaluate('document.querySelector("[data-rear-only]").dataset.rearOnly'), 'true');
  await click('Fixture scan'); await until('document.body.innerText.includes("Review ticket")');
  assert.equal(admitted, false, 'QR review does not admit automatically');
  assert.ok(await evaluate('document.body.innerText.includes("4 attendees")'));
  await screenshot('mobile-review');
  detailBefore = detailReads().length;
  await click('Allow entry'); await until('document.body.innerText.includes("Entry confirmed")'); await until(refreshReady);
  assert.equal(detailReads().length, detailBefore + 1, 'Successful admission refreshes event totals once');
  assert.equal(requests.filter(r => r.path.endsWith('/admit') && r.method === 'POST').length, 1);
  await click('Use another code'); await fill('input[placeholder="e.g. 9sv9begy"]', 'code1234'); await click('Verify ticket');
  await until('document.body.innerText.includes("Already checked in")');
  console.log('PASS mobile login, rear-camera option, review-first QR, whole-group admission and duplicate manual code');
  await click('Use another code'); admitted = false; admissionLost = true;
  await fill('input[placeholder="e.g. 9sv9begy"]', 'code1234'); await click('Verify ticket'); await until('document.body.innerText.includes("Review ticket")');
  await click('Allow entry'); await until('document.body.innerText.includes("Admission not confirmed")'); await click('Verify again'); await until('document.body.innerText.includes("Already checked in")');
  console.log('PASS uncertain admission is reverified without a second admission');
  await click('Use another code'); await fill('input[placeholder="e.g. 9sv9begy"]', 'badbad'); await click('Verify ticket'); await until('document.body.innerText.includes("Ticket not found")');
  assert.ok(await evaluate('!!document.querySelector("input[placeholder]")'));
  for (const width of [360, 390, 768, 1024]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: true });
    for (const theme of ['light', 'dark']) {
      await evaluate(`document.documentElement.classList.remove('light','dark');document.documentElement.classList.add('${theme}')`);
      assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), `${width}px ${theme}: no overflow`);
      await screenshot(`entry-${width}-${theme}`);
    }
  }
  blocked = true; await click('Refresh'); await until('document.body.innerText.includes("not assigned")');
  assert.equal(await evaluate('!!document.querySelector("input[placeholder]")'), false);
  blocked = false; sessionExpired = true; const refreshCalls = requests.filter(r => r.path.endsWith('/auth/refresh')).length;
  await click('Refresh'); await until('location.pathname === "/entry-agent/login"');
  assert.equal(requests.filter(r => r.path.endsWith('/auth/refresh')).length, refreshCalls, 'Agent expiry never refreshes organizer credentials');
  console.log('PASS phone/tablet themes, invalid code recovery, revoked access and isolated session expiry');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate('/organizer/entry-agents?event=event-one'); await until('document.body.innerText.includes("Save assignments")');
  await click('Save assignments'); await until('document.body.innerText.includes("Assignments and instructions saved")');
  await click('Create a new agent'); await until('!!document.querySelector("input[name=agentId]")');
  await fill('input[name=name]', 'Another agent'); await fill('input[name=agentId]', 'desk_new'); await fill('input[name=password]', 'FixturePassword1!'); await click('Save agent');
  await until('document.body.innerText.includes("desk_new")'); await click('Save assignments');
  await screenshot('organizer-assignments');
  await click('Cancel'); await until('!document.querySelector("[role=dialog]")');
  for (const theme of ['light', 'dark']) {
    await evaluate(`document.documentElement.classList.remove('light','dark');document.documentElement.classList.add('${theme}')`);
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".entry-agent-card h2")).fontSize'), '14px');
    assert.ok(await evaluate('document.querySelector(".entry-agent-card").getBoundingClientRect().height < 120'));
    await screenshot('organizer-compact-' + theme);
  }
  await evaluate('document.querySelector(".entry-agent-actions button").focus()');
  await delay(200);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".entry-agent-actions")).opacity'), '1');
  await click('Create agent'); await until('!!document.querySelector("input[name=password]")');
  await fill('input[name=password]', 'VisiblePassword1!');
  await evaluate('[...document.querySelectorAll("button")].find(b => b.getAttribute("aria-label") === "Show password").click()');
  assert.equal(await evaluate('document.querySelector("input[name=password]").type'), 'text');
  assert.equal(await evaluate('document.querySelector("input[name=password]").value'), 'VisiblePassword1!');
  await screenshot('organizer-create');
  await click('Cancel');
  await evaluate('[...document.querySelectorAll("button")].find(b => b.title === "Reset password").click()');
  await until('!!document.querySelector("input[name=password]")');
  assert.equal(await evaluate('document.querySelector("input[name=password]").type'), 'password');
  await evaluate('[...document.querySelectorAll("button")].find(b => b.getAttribute("aria-label") === "Show password").click()');
  assert.equal(await evaluate('document.querySelector("input[name=password]").type'), 'text');
  await click('Cancel'); await click('Assign event');
  await until('[...document.querySelectorAll("input")].some(el => el.getAttribute("aria-label") === "Search events")');
  assert.ok(await evaluate('[...document.querySelectorAll("button")].filter(b => b.innerText.startsWith("Another organizer event")).length === 29'));
  assert.ok(await evaluate('[...document.querySelectorAll("button")].some(b => b.innerText.includes("Another organizer event 0") && b.innerText.includes("Draft") && b.innerText.includes("Date not set"))'));
  await screenshot('organizer-draft-tag');
  await fill('input[aria-label="Search events"]', 'no-match');
  await until('document.body.innerText.includes("No matching events")');
  await fill('input[aria-label="Search events"]', 'Friday');
  await screenshot('organizer-event-picker');
  await click('Friday Night Live'); await until('document.body.innerText.includes("Save assignments")');
  console.log('PASS compact computed sizes, focus actions, creation/reset/login password visibility and event search');
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('PASS organizer assignment save and inline creation');
  console.log('Browser artifacts:', artifacts);
} finally { socket?.close(); chrome.kill(); }
