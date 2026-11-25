import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "vite";

// Local fixture-only browser check: never contacts the configured API or creates real bookings.
const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "artifacts/venues");
fs.mkdirSync(output, { recursive: true });
const chromePath =
  process.env.VENUE_TEST_CHROME ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "mmp-venue-browser-"));
const fixture = {
  id: "fixture-venue",
  name: "Brownstone Cafe",
  slug: "brownstone-cafe",
  type: "Cafe",
  status: "PUBLISHED",
  version: 0,
  organizer: { name: "Brownstone", slug: "brownstone" },
  fullAddress: "428, 12th Main Road, Indiranagar, Bengaluru",
  area: "Indiranagar",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560038",
  country: "India",
  contact: "9999999999",
  email: "venue@example.test",
  instagram: "",
  timezone: "Asia/Kolkata",
  latitude: null,
  longitude: null,
  about:
    "Tucked beneath a canopy of rain trees, Brownstone Cafe pairs single-estate pour-overs with slow-fermented sourdough plates and warm architectural minimalism.",
  amenities: [
    "Wi-Fi",
    "Outdoor seating",
    "Pet friendly",
    "Live music",
    "Parking",
  ],
  cuisines: ["Coffee", "Continental"],
  costForTwo: 140000,
  openingHours: Array.from({ length: 7 }, (_, day) => ({
    day,
    intervals: [{ open: "09:00", close: "23:00" }],
  })),
  closures: [],
  reservationsEnabled: true,
  maxGuests: 20,
  leadMinutes: 60,
  horizonDays: 90,
  slotMinutes: 30,
  menu: ["Coffee & beverages", "All-day breakfast", "Mains", "Desserts"].map(
    (name) => ({
      name,
      items: [
        {
          name: "Signature special",
          description: "Freshly prepared with seasonal ingredients.",
          price: 34000,
        },
      ],
    }),
  ),
  media: ["DESKTOP", "TABLET", "MOBILE", ...Array(8).fill("GALLERY")].map(
    (kind, index) => ({
      id: `photo-${index}`,
      kind,
      position: index,
      caption: [
        "Interior",
        "Coffee bar",
        "Seating",
        "Food",
        "Outdoor",
        "Events",
      ][Math.max(0, index - 3)],
      alt: "Venue photo",
      url: "/__venue-image.svg",
    }),
  ),
};
const server = await createServer({
  root,
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      "http://127.0.0.1:5187/api",
    ),
  },
  server: { host: "127.0.0.1", port: 5187, strictPort: true },
  plugins: [
    {
      name: "venue-fixture",
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url, "http://localhost");
          if (url.pathname === "/__venue-image.svg") {
            res.setHeader("content-type", "image/svg+xml");
            res.end(
              '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="720"><defs><linearGradient id="g"><stop stop-color="#8b6650"/><stop offset="1" stop-color="#28201b"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1920v720H0z"/><circle cx="1350" cy="150" r="260" fill="#c99774" opacity=".2"/></svg>',
            );
            return;
          }
          if (url.pathname === "/__venue-check") {
            res.setHeader("content-type", "text/html");
            res.end(
              await vite.transformIndexHtml(
                url.pathname,
                `<html><head><meta name="viewport" content="width=device-width,initial-scale=1" /></head><body><div id="root"></div><script>window.__venueFixture=${JSON.stringify(fixture)}</script><script type="module" src="/scripts/venue-browser-fixture.jsx"></script></body></html>`,
              ),
            );
            return;
          }
          if (!url.pathname.startsWith("/api/")) return next();
          let data = {};
          if (url.pathname.endsWith("/auth/me"))
            data = {
              user: {
                id: "fixture-user",
                name: "Reviewer",
                role: "ORGANIZER",
                roles: ["ORGANIZER"],
              },
            };
          else if (url.pathname.endsWith("/venue-feature"))
            data = { enabled: true };
          else if (url.pathname.endsWith("/slots"))
            data = { times: ["12:00", "12:30", "18:00"] };
          else if (url.pathname.endsWith("/reviews"))
            data = { items: [], total: 0, rating: null };
          else if (url.pathname === "/api/organizer/venues" || url.pathname === '/api/public/venues')
            data = { items: [fixture], total: 1, page: 1, limit: 12 };
          else if (url.pathname === "/api/organizer/venues/fixture-venue")
            data = fixture;
          else if (url.pathname.endsWith("/reservations"))
            data = {
              reference: "MMP-fixture",
              name: "Test Guest",
              email: "guest@example.test",
              venueName: fixture.name,
              status: "PENDING_VERIFICATION",
              localDate: "2026-12-01",
              localTime: "12:00",
              timezone: "Asia/Kolkata",
              guests: 2,
            };
          else if (url.pathname.endsWith("/verify"))
            data = {
              reference: "MMP-fixture",
              name: "Test Guest",
              email: "guest@example.test",
              venueName: fixture.name,
              status: "PENDING_APPROVAL",
              localDate: "2026-12-01",
              localTime: "12:00",
              timezone: "Asia/Kolkata",
              guests: 2,
            };
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ success: true, data }));
        });
      },
    },
  ],
});
let chrome, socket;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  await server.listen();
  chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { windowsHide: true, stdio: "ignore" },
  );
  const portFile = path.join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await pause(100);
  const port = fs.readFileSync(portFile, "utf8").split("\n")[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(
    tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  let sequence = 0;
  const pending = new Map(),
    errors = [];
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.exceptionThrown")
      errors.push(
        msg.params.exceptionDetails.exception?.description ||
          msg.params.exceptionDetails.text,
      );
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject, timer } = pending.get(msg.id);
      clearTimeout(timer);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(JSON.stringify(msg.error)));
      else resolve(msg.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Browser timed out: ${method}`));
      }, 20000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (response.exceptionDetails)
      throw new Error(response.exceptionDetails.text);
    return response.result.value;
  };
  const until = async (expression) => {
    for (let i = 0; i < 400; i++) {
      if (await evaluate(expression)) return;
      await pause(100);
    }
    throw new Error(
      `Page condition timed out: ${expression}\n${await evaluate("document.body.innerText.slice(0,2000)")}\n${errors.join("\n")}`,
    );
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:5187/__venue-check" });
  await until(
    "document.querySelector('h1')?.textContent === 'Brownstone Cafe'",
  );
  const measurements = [];
  for (const theme of ["dark", "light"])
    for (const width of [360, 390, 768, 1024, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await evaluate(`document.documentElement.className='${theme}'`);
      await pause(150);
      const measure = await evaluate(
        "({width:innerWidth, scroll:document.documentElement.scrollWidth, heading:document.querySelector('h1').getBoundingClientRect().width})",
      );
      assert.ok(
        measure.scroll <= width + 1,
        `Horizontal overflow at ${theme}/${width}: ${measure.scroll}`,
      );
      measurements.push({ theme, ...measure });
      assert.equal(await evaluate("document.querySelectorAll('.venue-photo-mosaic button').length"), 7);
      assert.ok(await evaluate("document.querySelector('#photos-section').textContent.includes('View all 8 photos')"));
      assert.ok(await evaluate("!Array.from(document.querySelectorAll('.venue-photo-mosaic button')).some(button => button.textContent.trim())"));
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });
      fs.writeFileSync(
        path.join(output, `${theme}-${width}.png`),
        Buffer.from(shot.data, "base64"),
      );
    }
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate("document.querySelectorAll('.venue-photo-mosaic button')[2].click()");
  await until("!!document.querySelector('.venue-photo-viewer img')");
  await until("document.querySelector('.venue-photo-viewer p[aria-live]')?.textContent === '03 / 08'");
  assert.ok(await evaluate("Array.from(document.querySelectorAll('.venue-photo-viewer button:not(.modal-close-button)')).every(button => getComputedStyle(button).display !== 'none')"));
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.venue-photo-viewer')).backgroundColor"), "rgba(0, 0, 0, 0)");
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 330, y: 420 }] });
  for (const x of [290, 230, 170, 100, 50]) {
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: 420 }] });
    await pause(30);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await until("document.querySelector('.venue-photo-viewer p[aria-live]')?.textContent === '04 / 08'");
  await evaluate("document.querySelector('.venue-photo-viewer .modal-close-button').click()");
  await until("!document.querySelector('[role=dialog]')");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate("document.querySelector('#menu-section button').click()");
  await until(
    "document.querySelector('[role=dialog]')?.textContent.includes('Signature special')",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
  });
  await until("!document.querySelector('[role=dialog]')");
  await evaluate("document.querySelector('#photos-section button').click()");
  await until("!!document.querySelector('[role=dialog] img')");
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "ArrowRight",
    code: "ArrowRight",
  });
  await until(
    "document.querySelector('[role=dialog]')?.textContent.includes('02 / 08')",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await until("!document.querySelector('[role=dialog]')");
  await evaluate("Array.from(document.querySelectorAll('#booking-widget-aside button')).find(b => b.textContent.includes('Select time')).click()");
  await until("Array.from(document.querySelectorAll('button')).some(b => b.textContent === '12:00 PM')");
  await evaluate("Array.from(document.querySelectorAll('button')).find(b => b.textContent === '12:00 PM').click()");
  await evaluate(
    `(() => { const form=document.querySelector('#booking-widget-aside form'); const set=(element,value)=>{Object.getOwnPropertyDescriptor(element instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));element.dispatchEvent(new Event('change',{bubbles:true}));};set(form.querySelector('input[autocomplete=name]'),'Test Guest');set(form.querySelector('input[type=email]'),'guest@example.test'); })()`,
  );
  await pause(100);
  await evaluate(
    "document.querySelector('#booking-widget-aside form').requestSubmit()",
  );
  await until(
    "document.querySelector('#booking-widget-aside').textContent.includes('PENDING VERIFICATION')",
  );
  await evaluate(
    "(() => {let input=document.querySelector('input[autocomplete=one-time-code]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'123456');input.dispatchEvent(new Event('input',{bubbles:true}));})()",
  );
  await pause(100);
  await evaluate(
    "document.querySelector('[role=dialog] form').requestSubmit()",
  );
  await until(
    "document.querySelector('#booking-widget-aside').textContent.includes('PENDING APPROVAL')",
  );
  await send("Page.navigate", {
    url: "http://127.0.0.1:5187/__venue-check?organizer",
  });
  await until("document.body.textContent.includes('Manage venue')");
  await evaluate(
    "Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Manage venue').click()",
  );
  await until("document.body.textContent.includes('Edit venue')");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  assert.ok(
    await evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),
    "Organizer editor overflows mobile",
  );
  assert.deepEqual(errors, [], `Browser runtime errors: ${errors.join("\n")}`);
  await send('Page.navigate', { url: 'http://127.0.0.1:5187/__venue-check?mobile' });
  await until("document.body.textContent.includes('Manage venue')");
  assert.ok(!await evaluate("document.body.textContent.includes('Mobile is view-only')"), 'New venue screens must be usable on mobile');
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Manage venue').click()");
  await until("document.body.textContent.includes('Edit venue')");
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Mobile organizer shell overflows');
  assert.deepEqual(errors, [], `Mobile browser errors: ${errors.join('\n')}`);
  const dimensions = await evaluate(`(async () => {
    const {createStandardFlyerFile} = await import('/src/utils/flyerImageCrop.js');
    const canvas = document.createElement('canvas'); canvas.width=1920; canvas.height=1080;
    canvas.getContext('2d').fillRect(0,0,1920,1080);
    const source = new File([await new Promise(resolve => canvas.toBlob(resolve))], 'fixture.png', {type:'image/png'});
    const results=[];
    for (const options of [undefined, {width:1920,height:720}, {width:1536,height:840}, {width:780,height:720}]) {
      const file=await createStandardFlyerFile(source,{x:0,y:0,width:1920,height:1080},options);
      const image=await createImageBitmap(file);results.push([image.width,image.height]);image.close();
    }
    return results;
  })()`);
  assert.deepEqual(dimensions, [[1920,1080],[1920,720],[1536,840],[780,720]], 'Venue crops must preserve original event flyer defaults');
  await send('Page.navigate', { url: 'http://127.0.0.1:5187/__venue-check?picker' });
  await until("document.querySelector('#picked-venue')?.textContent === 'Other' && document.body.textContent.includes('Brownstone Cafe')");
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Brownstone Cafe')).click()");
  await until("document.querySelector('#picked-venue')?.textContent === 'fixture-venue'");
  await evaluate("Array.from(document.querySelectorAll('button')).find(b=>b.textContent.startsWith('Other')).click()");
  await until("document.querySelector('#picked-venue')?.textContent === 'Other'");
  await send('Page.navigate', { url: 'http://127.0.0.1:5187/__venue-check?directory' });
  await until("document.body.textContent.includes('Find your next favourite place.') && document.body.textContent.includes('Brownstone Cafe')");
  assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'Directory overflows mobile');
  assert.deepEqual(errors, [], 'Browser checks must not raise runtime errors');
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(
      {
        measurements,
        checks: [
          "menu dialog",
          "photo keyboard navigation",
          "email verification pending state",
          "organizer editor",
          "mobile organizer route",
          "cover crop dimensions and event flyer default",
          "catalogue selection and Other",
          "public venue directory",
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "Venue fixture browser checks passed: 10 theme/viewport combinations, menu/photos, booking verification and organizer editor. No real API/provider calls.",
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  socket?.close();
  chrome?.kill();
  await Promise.race([server.close(), pause(2000)]);
  // Leave the isolated browser profile in OS temp for normal system cleanup.
}

