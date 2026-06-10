const DEFAULT_API_BASE_URL = "https://api.mapmyparty.com/api";
const DEFAULT_PUBLIC_ORIGIN = "https://www.mapmyparty.com";
const FALLBACK_IMAGE_PATH = "/images/ph1.jpg";

const firstValue = (value) => (Array.isArray(value) ? value[0] : value);

const toText = (value) =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

const escapeHtml = (value) =>
  toText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const truncate = (value, maxLength = 220) => {
  const text = toText(value).replace(/\s+/g, " ");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
};

const normalizeApiBaseUrl = () => {
  const raw =
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    process.env.MMP_API_BASE_URL ||
    DEFAULT_API_BASE_URL;

  return `${raw.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;
};

const buildApiUrl = (path = "") => {
  let cleanPath = String(path).replace(/^\/+/, "");
  if (cleanPath === "api" || cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.replace(/^api\/?/, "");
  }
  return `${normalizeApiBaseUrl()}/${cleanPath}`;
};

const getPublicOrigin = (req) => {
  const configured =
    process.env.VITE_PUBLIC_APP_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.APP_ORIGIN;

  if (configured) return configured.replace(/\/+$/, "");

  const host = toText(req.headers["x-forwarded-host"] || req.headers.host);
  if (!host) return DEFAULT_PUBLIC_ORIGIN;

  const protocol = toText(req.headers["x-forwarded-proto"]) || "https";
  return `${protocol.split(",")[0]}://${host.split(",")[0]}`.replace(/\/+$/, "");
};

const buildEventPath = (organizerSlug, eventSlug) =>
  `/events/${encodeURIComponent(organizerSlug)}/${encodeURIComponent(eventSlug)}`;

const fetchJson = async (path) => {
  const response = await fetch(buildApiUrl(path), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
  }

  const body = await response.json();
  return body?.data ?? body;
};

const fetchOptionalJson = async (path) => {
  try {
    return await fetchJson(path);
  } catch {
    return null;
  }
};

const formatShareDateRange = (startDate, endDate) => {
  if (!startDate) return "";

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "";

  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  const timeOptions = { hour: "numeric", minute: "2-digit" };
  const startLabel = `${start.toLocaleDateString("en-US", dateOptions)} at ${start.toLocaleTimeString("en-US", timeOptions)}`;

  if (!endDate) return startLabel;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;

  if (start.toDateString() === end.toDateString()) {
    return `${startLabel} - ${end.toLocaleTimeString("en-US", timeOptions)}`;
  }

  return `${startLabel} - ${end.toLocaleDateString("en-US", dateOptions)}`;
};

const formatTicketPrice = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  if (amount <= 0) return "Free";
  return `From INR ${Math.round(amount).toLocaleString("en-IN")}`;
};

const getStartingPriceLabel = (tickets) => {
  if (!Array.isArray(tickets)) return "";

  const prices = tickets
    .map((ticket) => Number(ticket?.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) return "";
  return formatTicketPrice(Math.min(...prices));
};

const getVenueLabel = (venues) => {
  if (!Array.isArray(venues) || venues.length === 0) return "";
  const primary = venues.find((venue) => venue?.isPrimary) || venues[0];
  return (
    toText(primary?.name) ||
    toText(primary?.fullAddress) ||
    [primary?.city, primary?.state, primary?.country].map(toText).filter(Boolean).join(", ")
  );
};

const normalizeImageUrl = (imageUrl, origin) => {
  const image = toText(imageUrl);
  if (!image) return `${origin}${FALLBACK_IMAGE_PATH}`;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("//")) return `https:${image}`;
  if (image.startsWith("/")) return `${origin}${image}`;
  return buildApiUrl(image);
};

const buildMeta = ({ core, tickets, venues, origin, eventUrl }) => {
  const title = toText(core?.title) || "MapMyParty event";
  const organizer = toText(core?.organizer?.name);
  const date = formatShareDateRange(core?.startDate, core?.endDate);
  const venue = getVenueLabel(venues);
  const category = [core?.category, core?.subCategory].map(toText).filter(Boolean).join(" / ");
  const price = getStartingPriceLabel(tickets);

  const details = [
    date ? `When: ${date}` : "",
    venue ? `Where: ${venue}` : "",
    category ? `Vibe: ${category}` : "",
    price ? `Tickets: ${price}` : "",
  ].filter(Boolean);

  const description =
    details.length > 0
      ? `${details.join(" | ")}. View the flyer, details, and tickets on MapMyParty.`
      : truncate(core?.description || "View the flyer, details, and tickets on MapMyParty.");

  return {
    title: organizer ? `${title} by ${organizer} | MapMyParty` : `${title} | MapMyParty`,
    description: truncate(description),
    image: normalizeImageUrl(core?.bannerImage || core?.flyerImage, origin),
    url: eventUrl,
  };
};

const renderShareHtml = ({ title, description, image, url }) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);
  const scriptUrl = JSON.stringify(url);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    <link rel="canonical" href="${safeUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="MapMyParty">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:alt" content="${safeTitle}">
    <meta property="og:url" content="${safeUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${safeImage}">
    <meta name="robots" content="index,follow">
  </head>
  <body>
    <p>Opening <a href="${safeUrl}">${safeTitle}</a>...</p>
    <script>window.location.replace(${scriptUrl});</script>
  </body>
</html>`;
};

const sendHtml = (res, statusCode, meta) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=900, stale-while-revalidate=86400");
  res.end(renderShareHtml(meta));
};

export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const organizerSlug = toText(firstValue(req.query?.organizer));
  const eventSlug = toText(firstValue(req.query?.event));
  const origin = getPublicOrigin(req);
  const eventUrl =
    organizerSlug && eventSlug
      ? `${origin}${buildEventPath(organizerSlug, eventSlug)}`
      : origin;

  if (!organizerSlug || !eventSlug) {
    sendHtml(res, 400, {
      title: "MapMyParty event",
      description: "View event flyers, details, and tickets on MapMyParty.",
      image: `${origin}${FALLBACK_IMAGE_PATH}`,
      url: eventUrl,
    });
    return;
  }

  try {
    const core = await fetchJson(
      `/public/events/${encodeURIComponent(organizerSlug)}/${encodeURIComponent(eventSlug)}`,
    );

    const [tickets, venues] = await Promise.all([
      fetchOptionalJson(`/public/events/${encodeURIComponent(core.id)}/tickets`),
      fetchOptionalJson(`/public/events/${encodeURIComponent(core.id)}/venues`),
    ]);

    const meta = buildMeta({ core, tickets, venues, origin, eventUrl });
    sendHtml(res, 200, meta);
  } catch {
    sendHtml(res, 200, {
      title: "MapMyParty event",
      description: "View the flyer, event details, and tickets on MapMyParty.",
      image: `${origin}${FALLBACK_IMAGE_PATH}`,
      url: eventUrl,
    });
  }
}
