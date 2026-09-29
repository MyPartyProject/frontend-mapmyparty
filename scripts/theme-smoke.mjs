// Run with Vite running: node scripts/theme-smoke.mjs
// Isolated headless Chrome; role screens use local API fixtures, never real accounts.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const profile = await mkdtemp(join(tmpdir(), 'mmp-theme-smoke-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: ['ignore','ignore','pipe'] });
chrome.stderr.on('data', data => { if (process.env.THEME_DEBUG) console.log(data.toString()); });
const sockets = [];
let role = null;
async function connect(url) {
  const socket = new WebSocket(url);
  sockets.push(socket);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  socket.onclose = event => {
    for (const request of pending.values()) request.reject(new Error(`Chrome disconnected (${event.code}: ${event.reason})`));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (process.env.THEME_DEBUG) console.log(method);
    const timeout = setTimeout(() => reject(new Error(`Chrome timed out: ${method}`)), 20000);
    pending.set(++id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  socket.onmessage = async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    } else if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      let payload = { success: true, data: { items: [], events: [], bookings: [], pagination: { total: 0, totalPages: 1 }, categories: [], tickets: [], analytics: {} } };
      const apiPath = new URL(request.url).pathname;
      if (apiPath.endsWith('/organizer/me/statistics')) payload.data = Object.fromEntries(
        ['events', 'attendees', 'revenue', 'ticketSales'].map(key => [key, { overall: 120, currentPeriod: 40, previousPeriod: 30, change: 25 }])
      );
      if (apiPath.endsWith('/organizer/me/analytics')) payload.data = {
        demographics: { age: [{ label: '25–34', value: 60 }], gender: { female: 55, male: 45 } },
        trends: { revenue: [{ label: 'Sep 28', revenue: 12000 }], bookings: [{ label: 'Sep 28', bookings: 30 }] },
        topEvents: [{ id: 'theme-event', title: 'Analytics Preview Event', revenue: 12000, ticketsSold: 40, bookings: 30 }],
      };
      if (apiPath.endsWith('/analytics/trends')) payload.data = { revenue: [{ label: 'Sep 28', revenue: 12000 }], bookings: [{ label: 'Sep 28', bookings: 30 }] };
      if (apiPath.endsWith('/analytics/breakdown')) payload.data = { breakdown: { confirmed: 30, pending: 10 } };
      if (apiPath.endsWith('/analytics/tickets')) payload.data = { tickets: [{ name: 'General', soldQuantity: 40, revenue: 12000, totalQuantity: 100 }] };
      if (apiPath.endsWith('/analytics/sales-timeline')) payload.data = { timeline: [{ label: 'Sep 28', date: '2026-09-28', revenue: 12000, bookings: 30 }], totals: { revenue: 12000, ticketsSold: 40 } };
      if (/\/user\/bookings\?/.test(request.url)) payload.data.items = [{
        id: 'theme-booking', publicId: 'THEME-001', status: 'CONFIRMED', totalAmount: 1200,
        createdAt: new Date().toISOString(), payment: { status: 'SUCCESS' },
        event: { id: 'theme-event', title: 'Theme Preview Event', startDate: new Date(Date.now() + 86400000).toISOString(), venue: { city: 'Mumbai', state: 'Maharashtra' } },
      }];
      if (request.url.includes('/auth/me')) payload = role ? { data: {
        user: { id: 'theme-fixture', name: 'Theme Preview', email: 'preview@example.test', role },
        organizer: { id: 'theme-organizer', name: 'Theme Preview' },
        hasOrganizerProfile: true, hasBankDetails: true, isBankVerified: true,
      } } : { data: { user: null } };
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Access-Control-Allow-Origin', value: base },
        { name: 'Access-Control-Allow-Credentials', value: 'true' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, OPTIONS' },
      ], body: Buffer.from(JSON.stringify(payload)).toString('base64') });
    }
  };
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await delay(100); }
    assert.fail(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0,700)')}\n${errors.join('\n')}`);
  };
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  const visit = async path => {
    await send('Page.navigate', { url: base + path });
    await until('document.querySelector("[data-theme-toggle]") && !document.querySelector(".landing-intro-overlay")');
  };
  const screenshot = async name => {
    await send('Page.bringToFront');
    await delay(350);
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const file = join(profile, name + '.png');
    await writeFile(file, Buffer.from(data, 'base64'));
    console.log(`Screenshot: ${file}`);
  };
  const resize = width => send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  return { send, evaluate, until, visit, screenshot, resize, errors };
}
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); }
  }
  assert.ok(port, 'Chrome started');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = await connect(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  const theme = value => `document.documentElement.classList.contains('${value}')`;
  const clickToggle = `Array.from(document.querySelectorAll('[data-theme-toggle]')).find(el => el.getBoundingClientRect().width > 0).click()`;
  await page.resize(1440);
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await page.visit('/');
  assert.equal(await page.evaluate(theme('light')), true, 'First visit defaults to light despite OS dark');
  assert.equal(await page.evaluate('getComputedStyle(document.body).backgroundColor'), 'rgb(255, 255, 255)');
  assert.equal(await page.evaluate('getComputedStyle(document.querySelector("h1")).color'), 'rgb(255, 255, 255)', 'Media headline stays inverse');
  await page.screenshot('landing-light');
  await page.evaluate(clickToggle);
  await page.until(theme('dark'));
  assert.equal(await page.evaluate('localStorage.getItem("mapmyparty-theme")'), 'dark');
  await page.screenshot('landing-dark');
  await page.visit('/browse-events');
  assert.equal(await page.evaluate(theme('dark')), true, 'Choice survives navigation/reload');
  await page.evaluate(clickToggle);
  await page.until(theme('light'));
  await page.screenshot('browse-light');

  const secondTarget = await (await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' })).json();
  const second = await connect(secondTarget.webSocketDebuggerUrl);
  await second.visit('/about');
  await second.evaluate(clickToggle);
  await page.until(theme('dark'));
  await second.evaluate('localStorage.setItem("mapmyparty-theme", "invalid")');
  await page.until(theme('light'));
  console.log('PASS default, toggle, persistence, tab sync, invalid preference');

  for (const [testRole, path] of [[null,'/auth'],['USER','/dashboard/bookings'],['ORGANIZER','/organizer/myevents'],['ADMIN','/promoter/overview']]) {
    role = testRole;
    for (const width of [390,1440]) {
      await page.resize(width);
      await page.visit(path);
      await page.until(`location.pathname === ${JSON.stringify(path)}`);
      for (const selected of ['light','dark']) {
        await page.evaluate(`localStorage.setItem('mapmyparty-theme', '${selected}'); window.dispatchEvent(new StorageEvent('storage', {key:'mapmyparty-theme',newValue:'${selected}'}));`);
        await page.until(theme(selected));
        assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${path} ${width}: no horizontal overflow`);
        await page.screenshot(`${testRole || 'visitor'}-${width}-${selected}`);
      }
      if (testRole === 'USER') {
        await page.until(`Array.from(document.querySelectorAll('button')).some(el => el.textContent.includes('View Tickets'))`);
        await page.evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('View Tickets')).click()`);
        await page.until('!!document.querySelector("[role=dialog]")');
        await page.evaluate('window.__themeDialog = document.querySelector("[role=dialog]"); true');
        await second.evaluate(clickToggle);
        await page.until(theme('light'));
        assert.equal(await page.evaluate('window.__themeDialog === document.querySelector("[role=dialog]")'), true, 'Switching preserves open dialog');
        await page.until('getComputedStyle(document.querySelector("[role=dialog]")).backgroundColor === "rgb(255, 255, 255)"');
        assert.equal(await page.evaluate('getComputedStyle(document.querySelector("[role=dialog]")).backgroundColor'), 'rgb(255, 255, 255)', 'Portal follows root theme');
        await page.screenshot(`tickets-${width}-light`);
        await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await page.until('!document.querySelector("[role=dialog]")');
        await page.evaluate(`const input = document.querySelector('input[placeholder="Search by event name or booking ID..."]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Theme'); input.dispatchEvent(new Event('input',{bubbles:true}));`);
        await page.evaluate(clickToggle);
        await page.until(theme('dark'));
        assert.equal(await page.evaluate(`document.querySelector('input[placeholder="Search by event name or booking ID..."]').value`), 'Theme', 'Switching preserves entered filter');
      }
      assert.ok(await page.evaluate('document.querySelectorAll("[data-theme-toggle]").length > 0'));
    }
  }
  console.log('PASS visitor and role screens, populated bookings, portal theme, dialog and filter preservation (local fixtures)');

  role = 'ORGANIZER';
  await page.resize(1440);
  await page.visit('/organizer/analytics');
  await page.until(`document.body.innerText.includes('Analytics Preview Event')`);
  await page.evaluate(`localStorage.setItem('mapmyparty-theme','light'); window.dispatchEvent(new StorageEvent('storage',{key:'mapmyparty-theme',newValue:'light'}));`);
  await page.until(theme('light'));
  const visibleGradients = `Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().width && el.getBoundingClientRect().height && getComputedStyle(el).backgroundImage.includes('gradient')).map(el => el.className)`;
  assert.deepEqual(await page.evaluate(visibleGradients), [], 'Populated light analytics has no gradients');
  assert.equal(await page.evaluate(`document.querySelector('nav [data-theme-toggle]').getAttribute('role')`), 'switch');
  await page.evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.textContent === '7d').click()`);
  await page.until(`document.body.innerText.includes('Last 7 days')`);
  await page.until(`!!document.querySelector('[title="Revenue: ₹12.0K, Bookings: 30"]')`);
  await page.screenshot('organizer-analytics-light');
  await page.evaluate(clickToggle);
  await page.until(theme('dark'));
  assert.ok((await page.evaluate(visibleGradients)).length > 0, 'Dark analytics retains gradients');
  assert.equal(await page.evaluate(`(() => {
    const panels = Array.from(document.querySelectorAll('main div'));
    const styles = () => panels.map(el => { const s = getComputedStyle(el); return [s.backgroundImage,s.backgroundColor,s.borderRadius,s.boxShadow,s.color].join('|'); }).join('\\n');
    const before = styles();
    document.documentElement.removeAttribute('data-organizer-ui');
    const after = styles();
    document.documentElement.setAttribute('data-organizer-ui','');
    return before === after;
  })()`), true, 'Organizer scope has no effect on dark content styles');
  assert.equal(await page.evaluate(`document.body.innerText.includes('Last 7 days')`), true, 'Switch retains analytics filter');
  await page.screenshot('organizer-analytics-dark');
  await page.evaluate(`document.querySelector('aside > div button:last-child').click()`);
  assert.equal(await page.evaluate(`document.querySelector('nav [data-theme-toggle]').getAttribute('aria-label')`), 'Dark mode', 'Collapsed toggle remains accessible');
  await page.evaluate(clickToggle);
  await page.until(theme('light'));
  for (const path of ['/organizer/dashboard', '/organizer/live', '/organizer/reception', '/organizer/support', '/organizer/select-event-type', '/organizer/create-event']) {
    await page.send('Page.navigate', { url: base + path });
    await page.until(`document.documentElement.hasAttribute('data-organizer-ui') && !!document.querySelector('button')`);
    await delay(500);
    assert.deepEqual(await page.evaluate(visibleGradients), [], `${path}: no light gradients`);
    assert.equal(await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), true, `${path}: no horizontal overflow`);
    if (path === '/organizer/support') {
      await page.evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Create ticket')).click()`);
      await page.until(`!!document.querySelector('[role="dialog"]')`);
      assert.deepEqual(await page.evaluate(`(() => { const s = getComputedStyle(document.querySelector('[role="dialog"]')); return [s.backgroundColor, s.borderRadius, s.backgroundImage]; })()`), ['rgb(255, 255, 255)', '16px', 'none'], 'Organizer portal uses rounded solid styling');
      assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('.fixed.inset-0[data-state="open"]')).backgroundColor`), 'rgba(255, 255, 255, 0.4)', 'Modal scrim remains translucent');
      await page.screenshot('organizer-support-dialog-light');
    }
  }
  await page.screenshot('organizer-create-event-light');
  assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('input')).borderRadius`), '10px', 'Event builder inputs have soft corners');
  await page.evaluate(`history.pushState({},'', '/organizer/events/theme-event/preview'); dispatchEvent(new PopStateEvent('popstate'));`);
  await page.until(`!document.documentElement.hasAttribute('data-organizer-ui')`);
  await page.visit('/about');
  assert.equal(await page.evaluate(`document.documentElement.hasAttribute('data-organizer-ui')`), false, 'Organizer scope clears on public pages');
  console.log('PASS populated organizer analytics, solid light fills, dark gradients, sidebar switch and route scope');

  role = null;
  await page.resize(1440);
  await page.visit('/auth');
  await page.evaluate(`localStorage.setItem('mapmyparty-theme','garbage')`);
  await page.visit('/auth');
  assert.equal(await page.evaluate(theme('light')), true, 'Invalid saved value defaults to light');
  const blocked = await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `
    for (const method of ['getItem','setItem','removeItem']) {
      const original = Storage.prototype[method];
      Storage.prototype[method] = function(key, ...args) {
        if (key === 'mapmyparty-theme') throw new DOMException('Blocked', 'SecurityError');
        return original.call(this,key,...args);
      };
    }` });
  await page.visit('/auth');
  assert.equal(await page.evaluate(theme('light')), true);
  await page.evaluate(clickToggle);
  await page.until(theme('dark'));
  await page.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked.identifier });
  assert.deepEqual(page.errors, [], 'No uncaught application errors');
  console.log('PASS unavailable storage; screenshots saved to ' + profile);
} finally {
  sockets.forEach(socket => socket.close());
  chrome.kill();
}
