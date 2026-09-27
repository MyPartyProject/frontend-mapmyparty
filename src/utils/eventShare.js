const SHARE_PREVIEW_PATH = "/api/event-share";

const toText = (value) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const getBrowserOrigin = () =>
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

export const formatShareDateRange = (startDate, endDate) => {
  if (!startDate) return "";

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";

  const dateOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Kolkata" };
  const timeOptions = { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" };
  const startLabel = `${start.toLocaleDateString("en-IN", dateOptions)} at ${start.toLocaleTimeString("en-IN", timeOptions)}`;

  if (!endDate) return `${startLabel} IST`;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return `${startLabel} IST`;

  const sameDate = start.toLocaleDateString("en-IN", dateOptions) === end.toLocaleDateString("en-IN", dateOptions);
  if (sameDate) {
    return `${startLabel} - ${end.toLocaleTimeString("en-IN", timeOptions)} IST`;
  }

  return `${startLabel} - ${end.toLocaleDateString("en-IN", dateOptions)} IST`;
};

const getVenueLabel = (event) =>
  [event?.venue, event?.location, event?.primaryVenue?.name, event?.primaryVenue?.fullAddress]
    .map(toText)
    .find((value) => value && !/^(venue|location|address) tba$/i.test(value)) || "";

const getCategoryLabel = (event) =>
  [event?.category, event?.subCategory].map(toText).filter(Boolean).join(" · ");

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

  const lines = [
    title,
    categoryLabel,
    [dateLabel, venueLabel].filter(Boolean).join(" · "),
    "Explore the event and book your spot on MapMyParty.",
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
