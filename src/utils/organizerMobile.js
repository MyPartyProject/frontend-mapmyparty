export const ORGANIZER_COMPACT_QUERY = "(width < 1024px)";

const mobilePages = {
  "/organizer/dashboard": "overview",
  "/organizer/dashboard-v2": "overview",
  "/organizer/myevents": "events",
  "/organizer/profile": "profile",
};

export function organizerMobilePage(pathname) {
  const path = pathname.replace(/\/+$/, "").toLowerCase();
  if (/^\/organizer\/events\/[^/]+\/preview$/.test(path)) return "eventDetail";
  return mobilePages[path] || "desktop";
}

export function mobileEventList(events, search, requestedPage) {
  const matches = events.filter((event) => String(event.title || "").toLowerCase().includes(search.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(matches.length / 20));
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(requestedPage, 10) || 1));
  return { events: matches.slice((page - 1) * 20, page * 20), total: matches.length, totalPages, page };
}

export function organizerDesktopTask(pathname) {
  const path = pathname.toLowerCase();
  if (/create-event|select-event-type/.test(path)) return "Event creation and editing";
  if (path.includes("/reception")) return "Reception and check-in";
  if (path.includes("/live")) return "Live event operations";
  if (path.includes("/food-beverages")) return "Food and beverage management";
  if (path.includes("/payouts")) return "Payout details and operations";
  if (path.includes("/refunds")) return "Refund management";
  if (path.includes("/attendees")) return "Attendee management";
  if (path.includes("/analytics")) return "Detailed analytics";
  if (path.includes("/bookings")) return "Booking management";
  if (path.includes("/support")) return "Organizer support";
  if (path.includes("/preview")) return "Organizer event previews";
  return "Organizer operations";
}

// These breakdowns are organization-wide; revenue alone uses summary.period.
export function organizerMobileTotals(analytics) {
  const sum = (values) => {
    if (!values || values.some((value) => value == null || !Number.isFinite(Number(value)))) return null;
    return values.reduce((total, value) => total + Number(value), 0);
  };
  return {
    events: sum(analytics?.breakdown?.byStatus && Object.values(analytics.breakdown.byStatus)),
    tickets: sum(analytics?.breakdown?.byTicketType && Object.values(analytics.breakdown.byTicketType).map((item) => item?.ticketsSold)),
    revenue: sum(analytics?.trends?.revenue?.map((item) => item?.amount)),
  };
}
