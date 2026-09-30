// Start Vite, then: node scripts/touch-navigation-smoke.mjs
// Local fixtures and Chrome touch emulation; actual iPhone Safari QA is separate.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import loadConfig from 'tailwindcss/loadConfig.js';

function assertHoverGuard(rule) {
  let parent = rule.parent;
  while (parent && !(parent.type === 'atrule' && parent.name === 'media' && parent.params.includes('(hover: hover)') && parent.params.includes('(pointer: fine)'))) parent = parent.parent;
  assert.ok(parent, `Unguarded hover: ${rule.selector}`);
}

const config = loadConfig(resolve('tailwind.config.ts'));
const css = await postcss([tailwind({ ...config, content: [{ raw: 'hover:bg-red-500 group-hover:opacity-100 peer-hover:text-red-500 light:group-hover:blur-sm', extension: 'html' }] })]).process('@tailwind utilities;', { from: undefined });
let hoverRules = 0;
css.root.walkRules(rule => {
  if (!rule.selector.includes(':hover')) return;
  hoverRules++;
  assertHoverGuard(rule);
});
assert.equal(hoverRules, 4, 'Direct, group, peer and light hover are guarded');
const landing = await readFile('src/landing/LandingPage.jsx', 'utf8');
const landingStyles = landing.match(/const heroCarouselStyles = `([\s\S]*?)`;/)?.[1];
assert.ok(landingStyles, 'Landing styles found');
for (const source of [await readFile('src/index.css', 'utf8'), landingStyles]) {
  postcss.parse(source).walkRules(rule => {
    if (rule.selector.includes(':hover') && !rule.selector.includes(':-webkit-autofill')) assertHoverGuard(rule);
  });
}
console.log('PASS generated and handwritten hover media guards');
if (process.argv.includes('--css-only')) process.exit(0);

const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const profile = await mkdtemp(join(tmpdir(), 'mmp-touch-smoke-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
const pending = new Map();
let role = null;
const events = [1, 2, 3].map(id => ({ id: `touch-${id}`, title: `Touch Event ${id}`, status: 'PUBLISHED', category: 'Music', startDate: '2099-01-01T18:00:00Z', price: 100, venue: { city: 'Mumbai' } }));
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await delay(100); }
  }
  assert.ok(port, 'Chrome started');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`Timed out: ${method}`)); }, 15000);
    const requestId = ++id;
    pending.set(requestId, { resolve: result => { clearTimeout(timeout); resolve(result); }, reject: error => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  socket.onclose = () => { for (const request of pending.values()) request.reject(new Error('Chrome connection closed')); pending.clear(); };
  socket.onmessage = async ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request?.reject(new Error(message.error.message)); else request?.resolve(message.result);
    } else if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      let payload = { data: { events, items: [], categories: [] } };
      if (request.url.includes('/auth/me')) payload = { data: { user: role ? { id: 'touch-user', name: 'Touch User', role } : null } };
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base },
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
    for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await delay(100); }
    assert.fail(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0,1500)')}\n${await evaluate('location.href')}`);
  };
  await send('Page.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  const active = 'document.querySelector("[data-trending-event-link][data-active=true]")';
  const href = () => evaluate(`${active}.getAttribute('href')`);
  const touch = async (type, x, y) => send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }] });
  for (const path of ['/browse-events', '/dashboard/browse-events']) {
    role = path.startsWith('/dashboard') ? 'USER' : null;
    await send('Page.navigate', { url: base + path });
    await until(`!!${active}`);
    // Record and cancel navigation locally, preserving React's real click handling.
    await evaluate(`window.touchClicks=[]; document.addEventListener('click', e => { const a=e.target.closest('a'); if(a && !e.defaultPrevented){window.touchClicks.push(a.getAttribute('href'));e.preventDefault();} });`);
    for (const theme of ['light', 'dark']) {
      await evaluate(`localStorage.setItem('mapmyparty-theme','${theme}'); window.dispatchEvent(new StorageEvent('storage',{key:'mapmyparty-theme',newValue:'${theme}'}));`);
      await until(`document.documentElement.classList.contains('${theme}')`);
      assert.equal(await evaluate(`${active}.querySelectorAll('a,button').length`), 0, 'No nested interactive banner content');
      assert.equal(await evaluate(`Array.from(document.querySelectorAll('[data-trending-event-link][data-active=false]')).every(a=>a.tabIndex===-1)`), true);
      const expected = await href();
      for (const child of ['img', 'h1', 'span']) {
        await evaluate(`${active}.scrollIntoView({block:'center',behavior:'instant'});`);
        const point = await evaluate(`(() => { const r=${active}.querySelector('${child}').getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
        const count = await evaluate('window.touchClicks.length');
        await touch('touchStart', point.x, point.y);
        await touch('touchEnd');
        await until(`window.touchClicks.length === ${count + 1}`);
        assert.equal(await evaluate('window.touchClicks.at(-1)'), expected, 'First tap follows correct event');
      }
      const center = await evaluate(`(() => {const r=${active}.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+40};})()`);
      const beforeSwipe = await href();
      const clicks = await evaluate('window.touchClicks.length');
      await touch('touchStart', center.x + 60, center.y);
      await touch('touchMove', center.x - 60, center.y + 2);
      await touch('touchEnd');
      await until(`${active}.getAttribute('href') !== '${beforeSwipe}'`);
      assert.equal(await evaluate('window.touchClicks.length'), clicks, 'Swipe does not navigate');
      // A synthetic compatibility click after a swipe must also be suppressed.
      assert.equal(await evaluate(`${active}.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,detail:1}))`), false);
      const keyboardClicks = await evaluate('window.touchClicks.length');
      await evaluate(`${active}.click()`);
      assert.equal(await evaluate('window.touchClicks.length'), keyboardClicks + 1, 'Keyboard activation survives swipe suppression');
      const beforeVertical = await href();
      await touch('touchStart', center.x, center.y);
      await touch('touchMove', center.x - 10, center.y + 100);
      await touch('touchEnd');
      assert.equal(await href(), beforeVertical, 'Vertical scroll does not change slide');
      await touch('touchStart', center.x, center.y);
      await touch('touchCancel');
      const beforeAutoplay = await href();
      await until(`${active}.getAttribute('href') !== '${beforeAutoplay}'`);
      // Tap a dot after cancellation: it must not inherit click suppression.
      const tapElement = async selector => {
        await evaluate(`document.querySelector('${selector}').scrollIntoView({block:'center',behavior:'instant'})`);
        const point = await evaluate(`(() => {const r=document.querySelector('${selector}').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
        await touch('touchStart', point.x, point.y);
        await touch('touchEnd');
      };
      const first = await evaluate(`document.querySelector('[data-trending-event-link]').getAttribute('href')`);
      await tapElement('button[aria-label="Go to slide 1"]');
      await until(`${active}.getAttribute('href') === '${first}'`);
      await tapElement('button[aria-label="Next event"]');
      await until(`${active}.getAttribute('href') !== '${first}'`);
      await tapElement('button[aria-label="Previous event"]');
      await until(`${active}.getAttribute('href') === '${first}'`);
      const gridHref = await evaluate(`document.querySelector('a.group[target="_blank"]').getAttribute('href')`);
      const beforeGrid = await evaluate('window.touchClicks.length');
      await tapElement('a.group[target="_blank"]');
      await until(`window.touchClicks.length === ${beforeGrid + 1}`);
      assert.equal(await evaluate('window.touchClicks.at(-1)'), gridHref, 'Grid card follows link on first tap');
      console.log(`PASS ${path} ${theme}: first taps, grid, keyboard, swipe, scroll, cancellation, autoplay and controls`);
    }
  }
} finally {
  socket?.close();
  chrome.kill();
}
