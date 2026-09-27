import { formatShareDateRange } from "../src/utils/eventShare.js";

const DEFAULT_API_BASE_URL = "https://api.mapmyparty.com/api";
const DEFAULT_PUBLIC_ORIGIN = "https://www.mapmyparty.com";
const FALLBACK_IMAGE_PATH = "/logo.png";

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
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw Object.assign(new Error(`API ${response.status}`), { status: response.status });
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

const getVenueLabel = (venues) => {
  if (!Array.isArray(venues) || venues.length === 0) return "";
  const primary = venues.find((venue) => venue?.isPrimary) || venues[0];
  return (
    toText(primary?.name) ||
    toText(primary?.fullAddress) ||
    [primary?.city, primary?.state, primary?.country].map(toText).filter(Boolean).join(", ")
  );
};

const normalizeImageUrl = (imageUrl) => {
  const image = toText(imageUrl).replace(/[\\,]+$/, "");
  if (!image || /^(data:|blob:)/i.test(image)) return "";
  try {
    const url = new URL(image.startsWith("//") ? `https:${image}` : /^https?:\/\//i.test(image) ? image : buildApiUrl(image));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const buildMeta = ({ core, venues, origin, eventUrl, shareUrl }) => {
  const title = toText(core?.title) || "MapMyParty event";
  const date = formatShareDateRange(core?.startDate, core?.endDate);
  const venue = getVenueLabel(venues);
  const category = [core?.category, core?.subCategory].map(toText).filter(Boolean).join(" · ");

  const details = [
    category,
    date ? `When: ${date}` : "",
    venue ? `Where: ${venue}` : "",
  ].filter(Boolean);

  const description = [...details, "Explore the event and book your spot on MapMyParty."].join(" | ");

  return {
    title,
    description: truncate(description),
    image: [core?.bannerImage, core?.flyerImage, core?.flyerImageUrl].map(normalizeImageUrl).find(Boolean) || `${origin}${FALLBACK_IMAGE_PATH}`,
    url: eventUrl,
    shareUrl,
  };
};

const renderShareHtml = ({ title, description, image, url, shareUrl = url }, statusCode) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);
  const scriptUrl = JSON.stringify(url).replace(/</g, "\\u003c");

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
    <meta property="og:url" content="${escapeHtml(shareUrl)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${safeImage}">
    <meta name="robots" content="${statusCode === 200 ? "index,follow" : "noindex"}">
  </head>
  <body>
    <p>Opening <a href="${safeUrl}">${safeTitle}</a>...</p>
    <script>window.location.replace(${scriptUrl});</script>
  </body>
</html>`;
};

const sendHtml = (req, res, statusCode, meta) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", statusCode === 200 ? "public, max-age=300, s-maxage=900" : "no-store");
  res.end(req.method === "HEAD" ? undefined : renderShareHtml(meta, statusCode));
};

export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.setHeader("Allow", "GET, HEAD");
    res.setHeader("Cache-Control", "no-store");
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
    sendHtml(req, res, 400, {
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
    if (!core?.id) throw Object.assign(new Error("Event unavailable"), { status: 404 });

    const venues = await fetchOptionalJson(`/public/events/${encodeURIComponent(core.id)}/venues`);
    const shareUrl = `${origin}/api/event-share?${new URLSearchParams({ organizer: organizerSlug, event: eventSlug })}`;

    const meta = buildMeta({ core, venues, origin, eventUrl, shareUrl });
    sendHtml(req, res, 200, meta);
  } catch (error) {
    const status = [403, 404, 410].includes(error.status) ? 404 : 502;
    sendHtml(req, res, status, {
      title: "MapMyParty event",
      description: "View the flyer, event details, and tickets on MapMyParty.",
      image: `${origin}${FALLBACK_IMAGE_PATH}`,
      url: eventUrl,
    });
  }
}
