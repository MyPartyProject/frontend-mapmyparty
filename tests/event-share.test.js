import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/event-share.js";
import { buildEventSharePayload, formatShareDateRange, shareEventInvite } from "../src/utils/eventShare.js";

const origin = "https://events.example";
const options = { origin, organizerSlug: "host", eventSlug: "party" };
const event = { id: "123", title: 'Music & "Friends" <live>', category: "Music", subCategory: "Live", startDate: "2026-10-01T20:00:00Z", flyerImage: "/api/storage/banner.jpg" };
const shareUrl = `${origin}/api/event-share?organizer=host&event=party`;

async function request(t, { core = event, status = 200, method = "GET", query = { organizer: "host", event: "party" }, venuesFail = false } = {}) {
  t.mock.method(globalThis, "fetch", async (url) => {
    const venues = url.endsWith("/venues");
    const responseStatus = venues ? (venuesFail ? 503 : 200) : status;
    return { ok: responseStatus === 200, status: responseStatus, json: async () => ({ data: venues ? [{ name: "The Venue" }] : core }) };
  });
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; } };
  await handler({ method, query, headers: { host: "events.example" } }, response);
  return response;
}

test("preview metadata contains escaped event details, category first, banner and share identity", async (t) => {
  const response = await request(t);
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /og:title" content="Music &amp; &quot;Friends&quot; &lt;live&gt;"/);
  assert.match(response.body, /og:description" content="Music · Live \| When:/);
  assert.match(response.body, /og:image" content="https:\/\/api.mapmyparty.com\/api\/storage\/banner.jpg"/);
  assert.ok(response.body.includes(shareUrl.replaceAll("&", "&amp;")));
  assert.ok(response.body.includes(`window.location.replace("${origin}/events/host/party")`));
  assert.match(response.body, /IST/);
  assert.match(response.headers["Content-Type"], /text\/html/);
});

test("banner selection handles public URLs, trailing junk, flyer fallbacks and missing images", async (t) => {
  for (const [images, expected] of [
    [{ bannerImage: "https://cdn.example/banner.jpg,\\", flyerImage: "other.jpg" }, "https://cdn.example/banner.jpg"],
    [{ bannerImage: "//cdn.example/banner.jpg" }, "https://cdn.example/banner.jpg"],
    [{ bannerImage: " ", flyerImage: "flyer.jpg" }, "https://api.mapmyparty.com/api/flyer.jpg"],
    [{ bannerImage: "blob:local", flyerImage: "", flyerImageUrl: "https://cdn.example/flyer.jpg" }, "https://cdn.example/flyer.jpg"],
    [{ bannerImage: "data:image/png;base64,abc", flyerImage: null }, `${origin}/logo.png`],
  ]) {
    await t.test(expected, async (t) => {
      const response = await request(t, { core: { ...event, ...images }, venuesFail: true });
      assert.equal(response.statusCode, 200);
      assert.ok(response.body.includes(`og:image" content="${expected}"`));
    });
  }
});

test("invalid or unavailable events and upstream errors are uncached", async (t) => {
  for (const [args, expected] of [[{ query: {} }, 400], [{ status: 404 }, 404], [{ status: 403 }, 404], [{ status: 500 }, 502], [{ core: null }, 404], [{ method: "POST" }, 405]]) {
    await t.test(JSON.stringify(args), async (t) => {
      const response = await request(t, args);
      assert.equal(response.statusCode, expected);
      assert.equal(response.headers["Cache-Control"], "no-store");
    });
  }
});

test("HEAD includes headers without a response body", async (t) => {
  const response = await request(t, { method: "HEAD" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, undefined);
});

test("invite includes category and omits missing dates and venue placeholders", () => {
  const payload = buildEventSharePayload({ title: "Party", category: "Music", venue: "Venue TBA", location: "Location TBA" }, options);
  assert.equal(payload.text, "Party\nMusic\nExplore the event and book your spot on MapMyParty.");
  assert.equal(payload.url, shareUrl);
  assert.equal(formatShareDateRange("invalid"), "");
  assert.match(formatShareDateRange(event.startDate, "2026-10-02T02:00:00Z"), /2 Oct 2026 at 1:30 am - 7:30 am IST/);
});

test("native share, cancellation, failures and clipboard fallback", async (t) => {
  for (const mode of ["native", "cancel", "failure", "clipboard"]) {
    await t.test(mode, async () => {
      const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
      let sent;
      let copied;
      const navigator = { clipboard: { writeText: async (text) => { copied = text; } } };
      if (mode !== "clipboard") navigator.share = async (payload) => {
        if (mode === "cancel") throw Object.assign(new Error("Cancelled"), { name: "AbortError" });
        if (mode === "failure") throw new Error("Unsupported");
        sent = payload;
      };
      Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigator });
      try {
        const result = await shareEventInvite(event, options);
        assert.equal(result.action, mode === "native" ? "shared" : mode === "cancel" ? "cancelled" : "copied");
        if (mode === "native") assert.equal(sent.url, shareUrl);
        if (["cancel", "native"].includes(mode)) assert.equal(copied, undefined);
        else assert.equal(copied, `${result.payload.text}\n\n${shareUrl}`);
      } finally {
        if (original) Object.defineProperty(globalThis, "navigator", original);
        else delete globalThis.navigator;
      }
    });
  }
});
