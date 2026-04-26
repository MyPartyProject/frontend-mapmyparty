import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/config/api";

const FALLBACK_IMAGE = "https://via.placeholder.com/1200x600?text=Event";
const SPONSOR_PLACEHOLDER = "https://via.placeholder.com/200x200?text=Sponsor";
const hasHtmlTag = (value) =>
  typeof value === "string" && /<\/?[a-z][\s\S]*>/i.test(value);
const hasEscapedHtmlTag = (value) =>
  typeof value === "string" && /&lt;\/?[a-z][\s\S]*&gt;/i.test(value);
const decodeHtmlEntities = (value) => {
  if (typeof value !== "string" || !value.includes("&")) return value;
  if (typeof document === "undefined") return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

function buildAdvisoryItems(raw) {
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((i) => typeof i === "string")) return raw.filter(Boolean);

  if (typeof raw === "object") {
    const list = [];
    Object.entries(raw).forEach(([key, val]) => {
      if (key === "customAdvisories" && Array.isArray(val)) {
        val.forEach((c) => c && list.push(c));
        return;
      }
      if (val === true) {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .trim();
        list.push(label.charAt(0).toUpperCase() + label.slice(1));
      }
    });
    return list;
  }

  const formatted = formatAdvisory(raw);
  if (!formatted) return [];
  return formatted.split(",").map((i) => i.trim()).filter(Boolean);
}

function formatAdvisory(raw) {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    const items = raw
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item;
        if (typeof item === "object") {
          return Object.entries(item)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(", ");
        }
        return String(item);
      })
      .filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  if (typeof raw === "object") {
    const items = Object.entries(raw)
      .filter(([, v]) => v !== false && v !== null && v !== undefined)
      .map(([k, v]) => (typeof v === "boolean" ? k : `${k}: ${v}`));
    return items.length ? items.join(", ") : null;
  }
  return String(raw);
}

function normalizeCoreEvent(data) {
  const rawTc = data.TC || null;
  const rawTermsContent = rawTc?.content || data.termsHtml || "";
  const rawTermsText = rawTc?.terms || data.terms || "";
  const decodedTermsContent = decodeHtmlEntities(rawTermsContent || "");
  const decodedTermsText = decodeHtmlEntities(rawTermsText || "");
  const termsHtml = decodedTermsContent
    ? (hasHtmlTag(decodedTermsContent) || hasEscapedHtmlTag(rawTermsContent) ? decodedTermsContent : "")
    : (hasHtmlTag(decodedTermsText) || hasEscapedHtmlTag(rawTermsText) ? decodedTermsText : "");
  const termsText = termsHtml ? "" : (typeof rawTermsText === "string" ? rawTermsText : "");
  const termsAndConditions = Array.isArray(data?.termsAndConditions)
    ? data.termsAndConditions.map((t) => {
        if (!t || typeof t !== "object") return t;
        const content = decodeHtmlEntities(t.content || "");
        const terms = decodeHtmlEntities(t.terms || "");

        if (content && (hasHtmlTag(content) || hasEscapedHtmlTag(t.content))) {
          return { ...t, content };
        }
        if (terms && (hasHtmlTag(terms) || hasEscapedHtmlTag(t.terms))) {
          return { ...t, content: terms };
        }
        return { ...t };
      })
    : rawTc
      ? [
          {
            ...rawTc,
            content:
              decodeHtmlEntities(rawTc.content || "") ||
              ((hasHtmlTag(decodeHtmlEntities(rawTc.terms || "")) || hasEscapedHtmlTag(rawTc.terms))
                ? decodeHtmlEntities(rawTc.terms)
                : ""),
          },
        ]
      : [];

  const advisoryItems = buildAdvisoryItems(data.advisory?.warnings || data.advisory || data.advisories);

  return {
    id: data.id,
    slug: data.slug || data.id,
    title: data.title || "Untitled Event",
    category: data.category || "EVENT",
    image: data.flyerImage || FALLBACK_IMAGE,
    startDate: data.startDate,
    endDate: data.endDate,
    location: "Location TBA",
    venue: "Venue TBA",
    address: "Address TBA",
    coordinates: null,
    attendees: 0,
    rating: 0,
    description: data.description || "No description available.",
    about: data.description || "No description available.",
    highlights: [],
    gallery: [FALLBACK_IMAGE],
    tickets: [],
    organizer: data.organizer
      ? {
          name: data.organizer.name || "Organizer",
          email: data.organizer.email || "",
          phone: data.organizer.phone || "",
          website: data.organizer.website || "",
          logo: data.organizer.logo || "https://via.placeholder.com/200x200?text=Organizer",
          verified: !!data.organizer.isVerified,
          bio: data.organizer.description || "",
          eventsOrganized: data.organizer.eventsOrganized || 0,
          followers: data.organizer.followers || 0,
        }
      : {
          name: "Organizer",
          email: "",
          phone: "",
          website: "",
          logo: "https://via.placeholder.com/200x200?text=Organizer",
          verified: false,
          bio: "",
          eventsOrganized: 0,
          followers: 0,
        },
    tags: data.tags || [],
    ageRestriction: data.TC?.ageRestriction || data.ageRestriction || "Not specified",
    dresscode: data.dresscode || "Not specified",
    parking: data.parking || "Not specified",
    accessibility: data.accessibility || "Not specified",
    reviews: 0,
    advisory: formatAdvisory(data.advisory?.warnings || data.advisory || data.advisories),
    advisoryItems,
    terms: termsText,
    termsHtml,
    termsUpdated: data.TC?.lastUpdated || data.termsUpdated || "",
    termsAndConditions,
    reviewsList: [],
    stats: {},
    artists: [],
    type: data.type,
    publishStatus: data.publishStatus,
    eventStatus: data.eventStatus,
    detailTemplate: data.detailTemplate || data.template || "classic",
    organizerNote: data.organizerNote,
    subCategory: data.subCategory,
    categorySlug: data.categorySlug,
    questions: data.questions,
    sponsors: [],
    flyerImage: data.flyerImage,
    isSponsored: data.isSponsored,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    primaryVenue: {},
    capacity: 0,
  };
}

function mergeTickets(tickets) {
  if (!Array.isArray(tickets)) return [];
  return tickets.map((t) => ({
    id: t.id,
    name: t.name || "Ticket",
    description: t.info || t.description || "",
    price: Number(t.price) || 0,
    available: Math.max(0, Number(t.remainingQty) || 0),
    maxPerUser: t.maxPerUser != null ? Number(t.maxPerUser) : null,
  }));
}

function mergeVenues(venues) {
  if (!Array.isArray(venues) || venues.length === 0) return {};
  const primary = venues.find((v) => v.isPrimary) || venues[0];
  const cityState = `${primary.city || ""}${primary.city && primary.state ? ", " : ""}${primary.state || ""}`.trim();

  return {
    venue: primary.name || "Venue TBA",
    address: primary.fullAddress || [primary.city, primary.state, primary.country].filter(Boolean).join(", ") || "Address TBA",
    location: primary.name || cityState || "Location TBA",
    coordinates: primary.latitude && primary.longitude
      ? { lat: primary.latitude, lng: primary.longitude }
      : null,
    primaryVenue: primary,
  };
}

function mergeGallery(gallery) {
  if (!Array.isArray(gallery) || gallery.length === 0) return [FALLBACK_IMAGE];
  return gallery.map((img) => (typeof img === "object" ? img.url : img)).filter(Boolean);
}

function mergeSponsors(sponsors) {
  if (!Array.isArray(sponsors)) return [];
  return sponsors.map((s) => ({
    id: s.id || s.name,
    name: s.name || "Sponsor",
    logo: s.logoUrl || s.logo || SPONSOR_PLACEHOLDER,
    website: s.websiteUrl || s.website || "",
    isPrimary: !!s.isPrimary,
    description: s.description || "",
  }));
}

function mergeReviews(summary) {
  if (!summary) return {};
  return {
    rating: summary.averageRating || 0,
    reviews: summary.totalReviews || 0,
  };
}

export default function usePublicEventDetail(organizerSlug, eventSlug) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState({
    tickets: true,
    venues: true,
    artists: true,
    gallery: true,
    sponsors: true,
    reviews: true,
  });

  const fetchSubResources = useCallback(async (eventId) => {
    const endpoints = [
      { key: "tickets", path: `/api/public/events/${eventId}/tickets` },
      { key: "venues", path: `/api/public/events/${eventId}/venues` },
      { key: "artists", path: `/api/public/events/${eventId}/artists` },
      { key: "gallery", path: `/api/public/events/${eventId}/gallery` },
      { key: "sponsors", path: `/api/public/events/${eventId}/sponsors` },
      { key: "reviews", path: `/api/public/events/${eventId}/reviews/summary` },
    ];

    const results = await Promise.allSettled(
      endpoints.map(({ path }) => apiFetch(path, { method: "GET" }))
    );

    const updates = {};
    const loadingUpdates = {};

    results.forEach((result, idx) => {
      const { key } = endpoints[idx];
      loadingUpdates[key] = false;

      if (result.status !== "fulfilled") {
        console.warn(`Failed to fetch ${key}:`, result.reason);
        return;
      }

      const responseData = result.value?.data ?? result.value;

      switch (key) {
        case "tickets": {
          const tickets = mergeTickets(responseData);
          updates.tickets = tickets;
          updates.capacity = tickets.reduce((sum, t) => sum + (t.available || 0), 0);
          break;
        }
        case "venues":
          Object.assign(updates, mergeVenues(responseData));
          break;
        case "artists":
          updates.artists = Array.isArray(responseData) ? responseData : [];
          break;
        case "gallery":
          updates.gallery = mergeGallery(responseData);
          break;
        case "sponsors":
          updates.sponsors = mergeSponsors(responseData);
          break;
        case "reviews":
          Object.assign(updates, mergeReviews(responseData));
          break;
      }
    });

    setSectionsLoading((prev) => ({ ...prev, ...loadingUpdates }));
    setEvent((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  useEffect(() => {
    if (!organizerSlug || !eventSlug) return;

    let cancelled = false;

    const fetchCore = async () => {
      setLoading(true);
      setError(null);
      setSectionsLoading({
        tickets: true,
        venues: true,
        artists: true,
        gallery: true,
        sponsors: true,
        reviews: true,
      });

      try {
        const res = await apiFetch(
          `/api/public/events/${encodeURIComponent(organizerSlug)}/${encodeURIComponent(eventSlug)}`,
          { method: "GET" }
        );

        const coreData = res?.data ?? res;

        if (cancelled) return;

        if (!coreData || !coreData.id) {
          setEvent(null);
          setLoading(false);
          return;
        }

        const normalized = normalizeCoreEvent(coreData);
        setEvent(normalized);
        setLoading(false);

        // Fire sub-resource fetches in parallel
        fetchSubResources(coreData.id);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch event", err);
        setError(err?.message || "Failed to load event");
        setEvent(null);
        setLoading(false);
      }
    };

    fetchCore();

    return () => {
      cancelled = true;
    };
  }, [organizerSlug, eventSlug, fetchSubResources]);

  return { event, loading, sectionsLoading, error };
}
