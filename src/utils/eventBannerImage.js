import { buildUrl } from "@/config/api";

export const normalizeEventBannerUrl = (src) => {
  if (!src || typeof src !== "string") return null;

  const trimmed = src.trim().replace(/[\\,]+$/, "");
  if (!trimmed) return null;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  return buildUrl(trimmed);
};

export const resolveEventBannerImage = (event, fallback = null) => {
  const bannerSources = [
    event?.bannerImage,
    event?.flyerImage,
    event?.flyerImageUrl,
  ];

  for (const source of bannerSources) {
    const normalized = normalizeEventBannerUrl(source);
    if (normalized) return normalized;
  }

  return fallback;
};
