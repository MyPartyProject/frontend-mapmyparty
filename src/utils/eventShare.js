import { formatEventPriceLabel } from "@/utils/priceFormatter";

const SHARE_PREVIEW_PATH = "/api/event-share";

const toText = (value) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const getBrowserOrigin = () =>
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

const formatShareDateRange = (startDate, endDate) => {
  if (!startDate) return "";

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";

  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  const timeOptions = { hour: "numeric", minute: "2-digit" };
  const startLabel = `${start.toLocaleDateString(undefined, dateOptions)} at ${start.toLocaleTimeString(undefined, timeOptions)}`;

  if (!endDate) return startLabel;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;

  const sameDate = start.toDateString() === end.toDateString();
  if (sameDate) {
    return `${startLabel} - ${end.toLocaleTimeString(undefined, timeOptions)}`;
  }

  return `${startLabel} - ${end.toLocaleDateString(undefined, dateOptions)}`;
};

const getStartingPriceLabel = (tickets = []) => {
  if (!Array.isArray(tickets) || tickets.length === 0) return "";

  const prices = tickets
    .map((ticket) => Number(ticket?.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) return "";

  return formatEventPriceLabel(Math.min(...prices), { prefix: "From" }) || "";
};

const getVenueLabel = (event) =>
  toText(event?.venue) ||
  toText(event?.location) ||
  toText(event?.primaryVenue?.name) ||
  toText(event?.primaryVenue?.fullAddress);

const getCategoryLabel = (event) =>
  [event?.category, event?.subCategory].map(toText).filter(Boolean).join(" / ");

export const buildEventDetailPath = (organizerSlug, eventSlug) => {
  const organizer = toText(organizerSlug);
  const event = toText(eventSlug);
  if (!organizer || !event) return "";

  return `/events/${encodeURIComponent(organizer)}/${encodeURIComponent(event)}`;
};

export const buildEventSharePreviewUrl = ({
  organizerSlug,
  eventSlug,
  origin = getBrowserOrigin(),
} = {}) => {
  const organizer = toText(organizerSlug);
  const event = toText(eventSlug);
  if (!origin || !organizer || !event) return "";

  const params = new URLSearchParams({
    organizer,
    event,
  });

  return `${origin}${SHARE_PREVIEW_PATH}?${params.toString()}`;
};

export const buildEventSharePayload = (
  event,
  { organizerSlug, eventSlug, currentUrl, origin = getBrowserOrigin() } = {},
) => {
  const title = toText(event?.title) || "MapMyParty event";
  const detailPath = buildEventDetailPath(organizerSlug, eventSlug);
  const eventUrl = detailPath && origin ? `${origin}${detailPath}` : currentUrl || origin;
  const previewUrl =
    buildEventSharePreviewUrl({ organizerSlug, eventSlug, origin }) || eventUrl;
  const dateLabel = formatShareDateRange(event?.startDate, event?.endDate);
  const venueLabel = getVenueLabel(event);
  const categoryLabel = getCategoryLabel(event);
  const priceLabel = getStartingPriceLabel(event?.tickets);

  const lines = [
    `You're invited to ${title}.`,
    dateLabel ? `When: ${dateLabel}` : "",
    venueLabel ? `Where: ${venueLabel}` : "",
    categoryLabel ? `Vibe: ${categoryLabel}` : "",
    priceLabel ? `Tickets: ${priceLabel}` : "",
    "See the full event, flyer, and tickets on MapMyParty.",
  ].filter(Boolean);

  return {
    title: `${title} | MapMyParty`,
    text: lines.join("\n"),
    url: previewUrl,
    eventUrl,
  };
};

export const getEventShareClipboardText = (payload) =>
  [payload?.text, payload?.url].map(toText).filter(Boolean).join("\n\n");

export const shareEventInvite = async (event, options = {}) => {
  const payload = buildEventSharePayload(event, options);

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return { action: "shared", payload };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { action: "cancelled", payload };
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(getEventShareClipboardText(payload));
    return { action: "copied", payload };
  }

  throw new Error("Sharing is not supported on this device.");
};
