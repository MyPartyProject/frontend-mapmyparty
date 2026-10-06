// Start Vite, then: node scripts/payout-smoke.mjs
// Local fixtures and Chrome touch emulation; actual iPhone Safari QA is separate.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';


const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const profile = await mkdtemp(join(tmpdir(), 'mmp-payout-smoke-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
const errors = [];
const pending = new Map();
let role = 'ORGANIZER';
let setupComplete = true;
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
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    } else if (message.method === 'Fetch.requestPaused') {
      const { requestId, request } = message.params;
      const path = new URL(request.url).pathname;
      let payload = { success: true, data: { items: [], payouts: [], events: [], pagination: { total: 0, totalPages: 1 } } };
      if (path.endsWith('/auth/me')) payload = { data: { user: { id: 'payout-fixture', name: 'Payout Test', role }, organizer: { id: 'org', name: 'Fixture Organizer' }, hasOrganizerProfile: setupComplete, hasBankDetails: setupComplete, isBankVerified: setupComplete } };
      if (path.endsWith('/settlements')) payload.data = { items: [{ event: { id: 'event', title: 'Seven day settlement' }, isEstimate: true, totals: { grossTicketSales: 100, refundAmount: 0, refundReserveAmount: 0, platformFeeAmount: 6, gstTotal: 1.08, organizerBalanceAdjustmentAmount: 0, netPayoutAmount: 92.92 }, status: 'BLOCKED', eligibleAt: '2026-10-08T12:00:00Z', bankAccountMasked: '****1234', blockers: [{ code: 'GST_NOT_VERIFIED', message: 'Organizer GST details must be verified before payout.' }] }], pagination: { total: 1, totalPages: 1 } };
      if (path === '/api/organizer/me/payouts/paid-fixture') payload.data = { payout: { id: 'paid-fixture', status: 'RECONCILED', amount: 92.92, payoutDate: '2026-10-01T12:00:00Z', providerUtr: 'TESTUTR123', invoiceNumber: 'TEST-STATEMENT' }, summary: { grossTicketSales: 100, platformFeeAmount: 6, gstTotal: 1.08, netPayoutAmount: 92.92 }, bankDetails: { accountHolder: 'Fixture Organizer', accountNumberMasked: '****1234', ifscCode: 'TEST0001234' }, event: { title: 'Paid event' }, organizer: { name: 'Fixture Organizer' }, eventBreakdowns: [], timeline: [] };
      if (path.includes('/event/manage/')) payload.data = { id: 'event', organizerId: 'org', title: 'Fixture Event Finance', startDate: '2026-09-01T10:00:00Z', endDate: '2026-09-01T12:00:00Z', tickets: [], venues: [], category: 'MUSIC' };
      if (path.endsWith('/analytics/summary')) payload.data = { settlement: { isEstimate: true, totals: { grossTicketSales: 100, refundAmount: 0, refundReserveAmount: 0, platformFeeAmount: 6, gstTotal: 1.08, organizerBalanceAdjustmentAmount: 0, netPayoutAmount: 92.92 }, eligibleAt: '2026-09-08T12:00:00Z', blockers: [] } };
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
    assert.fail(`Timed out: ${expression}\n${await evaluate('document.body.innerText.slice(0,1500)')}\n${await evaluate('location.href')}\n${errors.join('\n')}`);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  for (const width of [390, 767, 768, 820, 1023, 1280]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: base + '/organizer/payouts' });
    await until("document.body.innerText.includes('Seven day settlement')");
    assert.equal(await evaluate("document.body.innerText.includes('92.92')"), true);
    assert.equal(await evaluate("document.body.innerText.includes('Organizer GST details must be verified')"), true);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, 'Payout page must fit viewport');
    assert.equal(await evaluate("document.body.innerText.includes('Mobile is view-only')"), width < 768, 'Limited organizer view only below 768px');
    await send('Page.navigate', { url: base + '/organizer/payouts/paid-fixture' });
    await until("document.body.innerText.includes('TESTUTR123')");
    assert.equal(await evaluate("document.body.innerText.includes('Paid') && document.body.innerText.includes('92.92') && document.body.innerText.includes('****1234')"), true);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), true, 'Payout detail fits viewport');
    console.log('PASS paid payout detail viewport ' + width);
    console.log('PASS payout organizer viewport ' + width + ': amount, blocker, mobile access and overflow');
  }
  await send('Page.navigate', { url: base + '/organizer/dashboard' });
  for (const width of [767, 768, 767]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await until(width < 768
      ? "!!document.querySelector('nav[aria-label=\"Organizer navigation\"]') && !!document.querySelector('#mobile-view-note')"
      : "!!document.querySelector('aside nav') && !document.querySelector('nav[aria-label=\"Organizer navigation\"]')");
  }
  console.log('PASS organizer dashboard switches both ways at 768px without navigation');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: base + '/organizer/events/event/preview' });
  await until("document.body.innerText.includes('Event finance') && document.body.innerText.includes('92.92')");
  console.log('PASS mobile event finance');
  for (const width of [390, 768]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: base + '/organizer/select-event-type' });
    await until(width < 768
      ? "document.body.innerText.includes('Continue on a laptop or PC')"
      : "document.body.innerText.includes('Choose your event type')");
    assert.equal(await evaluate("document.body.innerText.includes('Choose your event type')"), width >= 768);
  }
  console.log('PASS operational route limited on phones and available on tablets');
  setupComplete = false;
  for (const width of [390, 768]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: base + '/organizer/dashboard' });
    await until(width < 768
      ? "document.body.innerText.includes('Complete organizer setup on a laptop or PC')"
      : "location.pathname === '/organizer/onboarding' && document.body.innerText.includes('Complete setup to continue')");
    assert.equal(await evaluate("!!document.querySelector('form')"), width >= 768);
  }
  console.log('PASS incomplete onboarding notice on phones and setup form on tablets');
  setupComplete = true;
  role = 'ADMIN';
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/promoter/payouts' });
  await until("document.body.innerText.includes('Seven day settlement')");
  console.log('PASS promoter upcoming settlements');
} finally { socket?.close(); chrome.kill(); }
