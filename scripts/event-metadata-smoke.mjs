// Start Vite, then: node scripts/event-metadata-smoke.mjs
// Local API/socket/scanner fixtures verify UI refreshes; real provider and camera QA are separate.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';


const base = process.env.SMOKE_URL || 'http://127.0.0.1:8080';
assert.ok((await fetch(base)).ok, 'Start Vite first');
const profile = await mkdtemp(join(tmpdir(), 'mmp-event-metadata-smoke-'));
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let socket;
const errors = [];
const pending = new Map();
const eventId='metadata-fixture';
let current={ id:eventId, organizerId:'org', title:'Metadata fixture', eventStatus:'ONGOING', publishStatus:'PUBLISHED',
startDate:new Date(Date.now()-3600000).toISOString(),endDate:new Date(Date.now()+3600000).toISOString(),
category:'Music', subCategory:'Live Concerts', venues:[{name:'Original venue',city:'Delhi',state:'Delhi'}],
checkIns:{total:1,totalBooked:3,bookedQuantity:10,checkedInQuantity:4},
tickets:[{id:'ticket',name:'Standard',type:'STANDARD_TICKET',price:100,totalQty:100,soldQty:5}],organizer:{id:'org',name:'Fixture Organizer'} };
let metadataRequests=0, statsRequests=0, delayedMetadata=false, failMetadata=false, heldRequest;
const fakeSocketModule = `const listeners=new Map();
const socket={ connected:true,active:true,on(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},
off(name,fn){listeners.get(name)?.delete(fn);},emit(name,data,cb){cb?.({success:true});},disconnect(){this.connected=false;this.active=false;},removeAllListeners(){listeners.clear();} };
window.__emitMetadata=(name,data)=>{for(const fn of [...(listeners.get(name)||[])])fn(data)};
window.__metadataListeners=()=>listeners.get('event_changed')?.size||0;
export const fetchSocketToken=async()=> 'fixture';
export const connectTicketAnalytics=()=>{socket.connected=true;socket.active=true;return socket;};
export const getTicketAnalyticsSocket=()=>socket;
export const disconnectTicketAnalytics=()=>{};
export const joinEventRoom=async()=>({success:true});
export const leaveEventRoom=async()=>({success:true});`;
const fakeScannerModule = `import React from '/node_modules/.vite/deps/react.js'; const {useRef}=React;
export default function Scanner(){const id=useRef(Math.random());return React.createElement('div',{'data-scanner-instance':id.current},'Fixture scanner open');}`;
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
      const isModule=path.endsWith('/socketService.js')||path.endsWith('/QRScanner.jsx');
      if(isModule){await send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(path.endsWith('/socketService.js')?fakeSocketModule:fakeScannerModule).toString('base64')});return;}
      let payload={success:true,data:{items:[],events:[],pagination:{total:0,totalPages:1}}};
      if(path.endsWith('/auth/me'))payload={data:{user:{id:'fixture-user',name:'Fixture Organizer',role:'ORGANIZER'},organizer:{id:'org',name:'Fixture Organizer'},hasOrganizerProfile:true,hasBankDetails:true,isBankVerified:true}};
      if(path.endsWith('/organizer/me/analytics'))payload.data={trends:{revenue:[{label:'First',amount:10000},{label:'Second',amount:5000},{label:'Empty',amount:0}],bookings:[{label:'First',count:10},{label:'Second',count:5},{label:'Empty',count:0}]}};
      if(path.endsWith('/organizer/me/analytics/breakdown'))payload.data={breakdown:{}};
      if(path.includes('/event/manage/')){
        metadataRequests++;payload.data=structuredClone(current);
        if(failMetadata){await send('Fetch.fulfillRequest',{requestId,responseCode:500,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'}],body:Buffer.from(JSON.stringify({success:false,errorMessage:'Fixture metadata failure'})).toString('base64')});return;}
      }
      if(path.endsWith('/my-events/live')){
        const ongoing=new Date(current.startDate)<=new Date()&&new Date(current.endDate)>new Date();
        const upcoming=new Date(current.startDate)>new Date();const requested=new URL(request.url).searchParams.get('status');
        payload.data={events:(requested==='ongoing'?ongoing:upcoming)?[structuredClone(current)]:[]};
      }
      if(path.includes('/booking/event/')){statsRequests++;payload.data=path.endsWith('check-ins')?{items:[],pagination:{total:3},summary:{total:1,last15m:1,totalBooked:3,bookedQuantity:10,checkedInQuantity:4}}:[];}
      if(path.endsWith('/verify-ticket'))payload.data={bookingItemId:'item',checkedIn:false,userName:'Fixture Guest',ticketName:'Standard',event:{id:eventId},members:1};
      if(path.includes('/event/manage/')&&delayedMetadata){delayedMetadata=false;heldRequest={requestId,payload};return;}
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
    assert.fail(`Timed out: ${expression}\n${await evaluate("(document.body?.innerText || '').slice(0,1500)")}\n${await evaluate('location.href')}\n${errors.join('\n')}`);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' },{urlPattern:'*/src/services/socketService.js*'},{urlPattern:'*/src/components/QRScanner.jsx*'}] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });

  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  const changed=()=>evaluate("window.__emitMetadata('event_changed',{eventId:'metadata-fixture'})");
  const navigate=async path=>{await send('Page.navigate',{url:base+path});await until('window.__metadataListeners?.() > 0');};
  await navigate('/organizer/live');
  await until("(document.body?.innerText || '').includes('Original venue')");
  await until(`document.querySelector('[aria-label="Checked-in"]')?.getAttribute('aria-valuenow') === '40'`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('[aria-label="Checked-in"]')].map(b=>Number(b.getAttribute('aria-valuenow')))`),[40,40]);
  for (const theme of ['light','dark']) {
    await evaluate(`document.documentElement.classList.remove('light','dark');document.documentElement.classList.add('${theme}')`);
    await delay(600);
    const bar=await evaluate(`(()=>{const t=document.querySelector('[aria-label="Checked-in"]');const f=t.firstElementChild;return {ratio:f.getBoundingClientRect().width/t.getBoundingClientRect().width,fill:getComputedStyle(f).backgroundColor,track:getComputedStyle(t).backgroundColor,image:getComputedStyle(f).backgroundImage}})()`);
    assert.ok(Math.abs(bar.ratio-0.4)<0.02,theme+' rendered width');
    assert.notEqual(bar.fill,bar.track);
    assert.equal(bar.image,'none');
  }
  console.log('PASS Initial live check-in quantity progress and solid colors in both themes');
  current.venues[0].name='Updated live venue';await changed();
  await until("(document.body?.innerText || '').includes('Updated live venue')");
  current.startDate=new Date(Date.now()+3600000).toISOString();current.endDate=new Date(Date.now()+7200000).toISOString();await changed();
  await until("(document.body?.innerText || '').includes('No live events today') && (document.body?.innerText || '').includes('Metadata fixture')");
  console.log('PASS Live Events venue changes and rescheduling into upcoming');
  await navigate('/organizer/reception');
  await until("(document.body?.innerText || '').includes('No live events today')");
  current.startDate=new Date(Date.now()-3600000).toISOString();await changed();
  await until("(document.body?.innerText || '').includes('Updated live venue')");
  console.log('PASS Reception discovers an event absent from its original list');
  await navigate('/organizer/live/'+eventId);
  await until("(document.body?.innerText || '').includes('Updated live venue')");
  await until(`document.querySelector('[aria-label="Checked-in"]')?.getAttribute('aria-valuenow') === '40'`);
  await evaluate("window.__emitMetadata('checkin_stats',{eventId:'metadata-fixture',checkIns:{total:0,last15m:0,bookedQuantity:10,checkedInQuantity:0}})");
  await until(`document.querySelector('[aria-label="Checked-in"]')?.getAttribute('aria-valuenow') === '0'`);
  await evaluate("window.__emitMetadata('checkin_update',{eventId:'metadata-fixture',checkIns:{total:2,last15m:2,bookedQuantity:10,checkedInQuantity:8}})");
  await until(`document.querySelector('[aria-label="Checked-in"]')?.getAttribute('aria-valuenow') === '80'`);
  current.venues[0].name='Live detail updated';await changed();
  await until("(document.body?.innerText || '').includes('Live detail updated')");
  assert.equal(await evaluate(`document.querySelector('[aria-label="Checked-in"]').getAttribute('aria-valuenow')`),'80');
  console.log('PASS API fallback, zero socket snapshot and metadata refresh preserve correct progress');
  await navigate('/organizer/reception/'+eventId);
  await until("(document.body?.innerText || '').includes('Live detail updated')");
  await evaluate(`const input=document.querySelector('input[placeholder*=manual]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'KEEP-TICKET');input.dispatchEvent(new Event('input',{bubbles:true}));`);
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Open QR Scanner')).click()");
  await until("!!document.querySelector('[data-scanner-instance]')");
  const scanner=await evaluate("document.querySelector('[data-scanner-instance]').dataset.scannerInstance");
  const statsBefore=statsRequests;
  current.venues[0].name='Reception updated';current.tickets[0].totalQty=150;await changed();
  await until("(document.body?.innerText || '').includes('Reception updated')");
  assert.equal(await evaluate("document.querySelector('input[placeholder*=manual]').value"),'KEEP-TICKET');
  assert.equal(await evaluate("document.querySelector('[data-scanner-instance]').dataset.scannerInstance"),scanner);
  assert.equal(statsRequests,statsBefore,'Metadata refresh must not overwrite reception counters');
  console.log('PASS Reception input, scanner instance and counters survive metadata refresh');
  delayedMetadata=true;await changed();
  for(let i=0;i<100&&!heldRequest;i++)await delay(50);
  assert.ok(heldRequest,'First metadata request held');
  current.venues[0].name='Newest venue';await changed();
  await send('Fetch.fulfillRequest',{requestId:heldRequest.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:base},{name:'Access-Control-Allow-Credentials',value:'true'}],body:Buffer.from(JSON.stringify(heldRequest.payload)).toString('base64')});
  await until("(document.body?.innerText || '').includes('Newest venue')");
  console.log('PASS Changes during an in-flight read queue a fresh read');
  current.venues[0].name='Focus refresh venue';await evaluate("window.dispatchEvent(new Event('focus'))");
  await until("(document.body?.innerText || '').includes('Focus refresh venue')");
  current.venues[0].name='Reconnect venue';await evaluate("window.__emitMetadata('connect')");
  await until("(document.body?.innerText || '').includes('Reconnect venue')");
  console.log('PASS Focus and reconnect recovery');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  for (const path of ['/organizer/live','/organizer/reception']) {
    await send('Page.navigate',{url:base+path});
    await until("(document.body?.innerText || '').includes('Continue on a laptop or PC')");
  }
  console.log('PASS Existing desktop-only mobile guards preserved at 390px');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  current.startDate=new Date(Date.now()+2500).toISOString();current.endDate=new Date(Date.now()+6000).toISOString();
  await navigate('/organizer/live');
  await until("(document.body?.innerText || '').includes('No live events today') && (document.body?.innerText || '').includes('Metadata fixture')");
  await until("!(document.body?.innerText || '').includes('No live events today') && (document.body?.innerText || '').includes('Metadata fixture')");
  await until("(document.body?.innerText || '').includes('No live events today') && !(document.body?.innerText || '').includes('Metadata fixture')");
  console.log('PASS Start and end boundaries refresh without a scheduler or change message');
  current.startDate=new Date(Date.now()-3600000).toISOString();current.endDate=new Date(Date.now()+3600000).toISOString();
  failMetadata=true;await navigate('/organizer/reception/'+eventId);
  await until("(document.body?.innerText || '').includes('Failed to load reception')");
  failMetadata=false;
  await evaluate("[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Retry')).click()");
  await until("(document.body?.innerText || '').includes('Verify Ticket')");
  console.log('PASS Reception retries an initial metadata failure without stale fetch guards');
  await send('Page.navigate',{url:base+'/organizer/analytics'});
  await until(`document.querySelectorAll('[data-analytics-progress]').length === 6`);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-analytics-progress]')].map(b=>Number(b.getAttribute('aria-valuenow')))`),[100,100,50,50,0,0]);
  for (const theme of ['light','dark']) {
    await evaluate(`document.documentElement.classList.remove('light','dark');document.documentElement.classList.add('${theme}')`);
    await delay(600);
    const widths=await evaluate(`[...document.querySelectorAll('[data-analytics-progress]')].map(b=>b.firstElementChild.getBoundingClientRect().width/b.getBoundingClientRect().width)`);
    assert.ok(Math.abs(widths[2]-0.5)<0.02 && Math.abs(widths[3]-0.5)<0.02,theme+' independent trend scales');
    assert.equal(widths[4],0);assert.equal(widths[5],0);
  }
  console.log('PASS Audience revenue and booking scales, fractional widths and empty bars in both themes');
  assert.deepEqual(errors,[],'No browser runtime errors');
  console.log('PASS '+metadataRequests+' authenticated metadata reads');
} finally { socket?.close(); chrome.kill(); }
