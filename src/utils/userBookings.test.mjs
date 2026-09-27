import { test } from "node:test";
import assert from "node:assert/strict";
import { getUpcomingBookings, loadAllBookings } from "./userBookings.js";

test("fetches each required page once and includes upcoming bookings beyond page one", async () => {
  const calls = [];
  const signal = new AbortController().signal;
  const firstPage = Array.from({ length: 100 }, (_, id) => ({ id, status: "cancelled" }));
  const upcoming = { id: 100, status: "confirmed", eventDate: "2099-01-01" };
  const items = await loadAllBookings(async (url, options) => {
    calls.push(url);
    assert.equal(options.signal, signal);
    assert.equal(options.cache, "no-store");
    return { success: true, data: { items: calls.length === 1 ? firstPage : [upcoming], pagination: { totalPages: 2 } } };
  }, signal);
  assert.deepEqual(calls, ["/api/user/bookings?page=1&limit=100", "/api/user/bookings?page=2&limit=100"]);
  assert.equal(items.length, 101);
  assert.deepEqual(getUpcomingBookings(items), [upcoming]);
});

test("empty accounts need only one request", async () => {
  let calls = 0;
  const items = await loadAllBookings(async () => {
    calls++;
    return { success: true, data: { items: [], pagination: { totalPages: 0 } } };
  }, new AbortController().signal);
  assert.equal(calls, 1);
  assert.deepEqual(items, []);
});

test("failed pages reject instead of returning a misleading partial list", async () => {
  let calls = 0;
  await assert.rejects(loadAllBookings(async () => {
    calls++;
    return calls === 1
      ? { success: true, data: { items: [{ id: 1 }], pagination: { totalPages: 2 } } }
      : { success: false };
  }, new AbortController().signal), /Failed to load your bookings/);
  assert.equal(calls, 2);
});

test("unmount cancellation prevents further pagination requests", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(loadAllBookings(async () => {
    calls++;
    controller.abort();
    return { success: true, data: { items: [], pagination: { totalPages: 3 } } };
  }, controller.signal), { name: "AbortError" });
  assert.equal(calls, 1);
});

test("upcoming selection excludes other statuses and invalid or past dates, without reordering the source", () => {
  const bookings = [
    { id: "later", status: "confirmed", eventDate: "2030-03-01" },
    { id: "soon", status: "confirmed", eventDate: "2030-02-01" },
    ...["pending", "pending_payment", "cancelled", "failed", "refunded"].map(status => ({ status, eventDate: "2030-02-01" })),
    ...[null, "bad date", "2029-01-01", "2030-01-01"].map(eventDate => ({ status: "confirmed", eventDate })),
  ];
  assert.deepEqual(getUpcomingBookings(bookings, Date.parse("2030-01-01")).map(b => b.id), ["soon", "later"]);
  assert.equal(bookings[0].id, "later");
  assert.deepEqual(getUpcomingBookings([], Date.parse("2030-01-01")), []);
});
