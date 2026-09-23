import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { organizerMobilePage, organizerMobileTotals, mobileEventList } from "./organizerMobile.js";

test("only overview, events, and profile are available on mobile", () => {
  assert.equal(organizerMobilePage("/organizer/dashboard"), "overview");
  assert.equal(organizerMobilePage("/organizer/dashboard-v2"), "overview");
  assert.equal(organizerMobilePage("/organizer/myevents/"), "events");
  assert.equal(organizerMobilePage("/ORGANIZER/PROFILE"), "profile");
  // Inventory real routes so new operational routes remain restricted by default.
  const app = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
  const routes = [...app.matchAll(/path="(\/organizer\/[^\"]+)"/g)].map((match) => match[1]);
  const allowed = new Set(["/organizer/dashboard", "/organizer/dashboard-v2", "/organizer/myevents", "/organizer/profile", "/organizer/events/:eventId/preview"]);
  for (const route of routes.filter((route) => !allowed.has(route))) {
    assert.equal(organizerMobilePage(route), "desktop", route);
  }
  assert.equal(organizerMobilePage("/organizer/profile/edit"), "desktop");
  assert.equal(organizerMobilePage("/organizer/future-operation"), "desktop");
  assert.equal(organizerMobilePage("/organizer/events/draft-id/preview/"), "eventDetail");
  assert.equal(organizerMobilePage("/organizer/events/draft-id/preview/edit"), "desktop");
  assert.equal(organizerMobilePage("/organizer/events/draft-id/refunds"), "desktop");
});

test("all events are reachable and title search spans pages", () => {
  const events = Array.from({ length: 45 }, (_, id) => ({ id, title: `Event ${id}` }));
  assert.equal(mobileEventList(events, "", 3).events.length, 5);
  assert.equal(mobileEventList(events, " EVENT 44 ", 1).events[0].id, 44);
  assert.equal(mobileEventList(events, "", 99).page, 3);
  assert.equal(mobileEventList(events, "", -2).page, 1);
  assert.equal(mobileEventList(events, "missing", 2).total, 0);
});

test("summaries preserve zero and never fall back to top events or unrelated totals", () => {
  assert.deepEqual(organizerMobileTotals({
    breakdown: { byStatus: {}, byTicketType: {} },
    trends: { revenue: [] },
    topEvents: [{ revenue: 999 }],
  }), { events: 0, tickets: 0, revenue: 0 });
  assert.deepEqual(organizerMobileTotals(null), { events: null, tickets: null, revenue: null });
  assert.deepEqual(organizerMobileTotals({
    breakdown: { byStatus: { PUBLISHED: 21, DRAFT: 4 }, byTicketType: { VIP: { ticketsSold: 30 }, GENERAL: { ticketsSold: 100 } } },
    trends: { revenue: [{ amount: 150.5 }, { amount: 0 }, { amount: 25 }] },
  }), { events: 25, tickets: 130, revenue: 175.5 });
});

test("incomplete or invalid metric data is unavailable rather than fabricated zero", () => {
  assert.deepEqual(organizerMobileTotals({
    breakdown: { byStatus: { DRAFT: null }, byTicketType: { VIP: {} } },
    trends: { revenue: [{ amount: "invalid" }] },
  }), { events: null, tickets: null, revenue: null });
});
