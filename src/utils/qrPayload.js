const QR_UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QR_UUID_V4_FINDER_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const QR_NOISE_REGEX = /[\u200B-\u200D\uFEFF]/g;

const normalizeQrValue = (rawValue) => {
  if (typeof rawValue !== "string") return "";
  return rawValue.replace(QR_NOISE_REGEX, "").trim();
};

const extractFromStructuredValue = (value, depth = 0) => {
  if (depth > 5 || value == null) return null;

  if (typeof value === "string") {
    return extractValidQrToken(value, depth + 1);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = extractFromStructuredValue(item, depth + 1);
      if (token) return token;
    }
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const priorityKeys = ["qr", "qrToken", "token", "value", "data", "payload", "text"];
  const visitedKeys = new Set();

  for (const key of priorityKeys) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
    visitedKeys.add(key);
    const token = extractFromStructuredValue(value[key], depth + 1);
    if (token) return token;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (visitedKeys.has(key)) continue;
    const token = extractFromStructuredValue(entry, depth + 1);
    if (token) return token;
  }

  return null;
};

const extractFromUrl = (value, depth = 0) => {
  try {
    const url = new URL(value);
    const candidates = [
      url.searchParams.get("qr"),
      url.searchParams.get("qrToken"),
      url.searchParams.get("token"),
      ...Array.from(url.searchParams.values()),
    ].filter(Boolean);

    for (const candidate of candidates) {
      const token = extractValidQrToken(candidate, depth + 1);
      if (token) return token;
    }
    return null;
  } catch {
    return null;
  }
};

export const extractValidQrToken = (rawValue, depth = 0) => {
  if (depth > 5) return null;

  const value = normalizeQrValue(rawValue);
  if (!value) return null;

  if (QR_UUID_V4_REGEX.test(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    const tokenFromJson = extractFromStructuredValue(parsed, depth + 1);
    if (tokenFromJson) {
      return tokenFromJson;
    }
  } catch {
    // Not JSON, continue.
  }

  const tokenFromUrl = extractFromUrl(value, depth);
  if (tokenFromUrl) {
    return tokenFromUrl;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded !== value) {
      const tokenFromDecoded = extractValidQrToken(decoded, depth + 1);
      if (tokenFromDecoded) {
        return tokenFromDecoded;
      }
    }
  } catch {
    // Ignore malformed encodings.
  }

  const embeddedToken = value.match(QR_UUID_V4_FINDER_REGEX)?.[0];
  if (embeddedToken && QR_UUID_V4_REGEX.test(embeddedToken)) {
    return embeddedToken;
  }

  return null;
};

export const buildCanonicalQrPayload = (rawValue) => {
  const qrToken = extractValidQrToken(rawValue);
  if (!qrToken) return null;
  return JSON.stringify({ qr: qrToken });
};
