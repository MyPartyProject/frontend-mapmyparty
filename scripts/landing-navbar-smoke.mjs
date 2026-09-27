// Run with Vite already running: node scripts/landing-navbar-smoke.mjs
// Uses an isolated headless Chrome profile; no extra dependencies.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start the Vite dev server before running this check');
const profile = await mkdtemp(join(tmpdir(), 'mmp-navbar-smoke-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
try {
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
    catch { await delay(100); }
  }
  assert.ok(port, 'Chrome debugging endpoint started');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const response = JSON.parse(data);
    if (!response.id) return;
    const request = pending.get(response.id);
    pending.delete(response.id);
    if (response.error) request.reject(new Error(response.error.message));
    else request.resolve(response.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const until = async expression => {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    assert.fail(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0, 1000)')}`);
  };
  const resize = width => send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: false });
  const visit = async path => {
    await send('Page.navigate', { url: `${base}${path}` });
    await until('!!document.querySelector("header") && !document.querySelector(".landing-intro-overlay")');
  };
  const hidden = 'document.querySelector("header").inert && getComputedStyle(document.querySelector("header")).visibility === "hidden"';
  const visible = '!document.querySelector("header").inert && getComputedStyle(document.querySelector("header")).opacity === "1"';
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    const file = join(profile, `${name}.png`);
    await writeFile(file, Buffer.from(result.data, 'base64'));
    console.log(`Screenshot: ${file}`);
  };

  for (const path of ['/', '/landing/homepage']) {
    for (const width of [320, 390, 767, 768, 1280]) {
      await resize(width);
      await visit(path);
      assert.equal(await evaluate(width < 768 ? hidden : visible), true, `${path} initial header at ${width}`);
      if (width < 768) assert.equal(await evaluate('Math.abs(document.querySelector("main section").getBoundingClientRect().top) < 1'), true, 'Mobile hero starts at top');
      assert.equal(await evaluate('document.querySelector("main section a").getAttribute("href")'), '/browse-events');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'No horizontal overflow');
      if (path === '/' && width === 390) await screenshot('initial');
      if (width < 768) {
        await evaluate('document.querySelector("h1").click()');
        await until(visible);
        await until('[...document.querySelectorAll(".landing-nav-actions > *")].every(el => getComputedStyle(el).opacity === "1")');
        if (path === '/' && width === 390) await screenshot('revealed');
        await evaluate('window.scrollTo(0, 400)');
        await delay(100);
        assert.equal(await evaluate('Math.abs(document.querySelector("header").getBoundingClientRect().top) < 1'), true, 'Header stays pinned');
        await evaluate(`document.querySelector('[aria-label="Toggle menu"]').click()`);
        await until('!!document.querySelector("header nav.animate-in")');
        await evaluate(`document.querySelector('.landing-nav-actions [aria-label="Search events"]').click()`);
        await until('!!document.querySelector("header input[type=search]:not([tabindex])")');
      }
      console.log(`PASS ${path} ${width}px`);
    }
  }
  await resize(390);
  await send('Page.navigate', { url: `${base}/` });
  await until('!!document.querySelector(".landing-intro-overlay") && !!document.querySelector("header")');
  await evaluate('document.querySelector(".landing-intro-overlay").click()');
  assert.equal(await evaluate('document.querySelector("header").dataset.landingRevealed'), 'false', 'Intro clicks do not reveal navbar');
  await until('!document.querySelector(".landing-intro-overlay")');
  await visit('/');
  await evaluate('window.scrollTo(0, 100)');
  await until(visible);
  await resize(1280);
  await until(visible);
  await resize(390);
  await until(visible);
  await visit('/');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await until(visible);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await visit('/');
  assert.equal(await evaluate(hidden), true);
  await evaluate('document.querySelector("h1").click()');
  await until(visible);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("header")).transitionProperty'), 'none');
  await evaluate('document.querySelector("main section a").click()');
  await until('location.pathname === "/browse-events"');
  await visit('/about');
  assert.equal(await evaluate(visible), true, 'Other mobile headers stay visible');
  console.log('PASS intro guard, scroll, keyboard, resize persistence, reduced motion, CTA navigation, and non-landing header');
} finally {
  socket?.close();
  chrome.kill();
}
