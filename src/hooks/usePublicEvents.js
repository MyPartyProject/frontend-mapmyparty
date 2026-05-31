import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/config/api";

const PUBLIC_EVENTS_STORAGE_KEY = "mapMyParty_events";
const DEFAULT_LOCATION_RADIUS_KM = 50;

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getEventCoordinates = (event) => {
  const venue = Array.isArray(event?.venues) ? event.venues[0] : null;

  const latitude =
    toFiniteNumber(event?.coordinates?.lat) ??
    toFiniteNumber(event?.latitude) ??
    toFiniteNumber(event?.venueLatitude) ??
    toFiniteNumber(event?.venue?.latitude) ??
    toFiniteNumber(venue?.latitude) ??
    toFiniteNumber(venue?.lat);

  const longitude =
    toFiniteNumber(event?.coordinates?.lng) ??
    toFiniteNumber(event?.longitude) ??
    toFiniteNumber(event?.venueLongitude) ??
    toFiniteNumber(event?.venue?.longitude) ??
    toFiniteNumber(venue?.longitude) ??
    toFiniteNumber(venue?.lng);

  if (latitude === null || longitude === null) {
    return null;
  }

  return { latitude, longitude };
};

const getDistanceKm = (originLatitude, originLongitude, targetLatitude, targetLongitude) => {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const deltaLatitude = toRadians(targetLatitude - originLatitude);
  const deltaLongitude = toRadians(targetLongitude - originLongitude);
  const lat1 = toRadians(originLatitude);
  const lat2 = toRadians(targetLatitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const getFilterCacheKey = (filterParams = {}) => {
  const params = new URLSearchParams();

  if (filterParams.category) params.set("category", filterParams.category);
  if (filterParams.subCategory) params.set("subCategory", filterParams.subCategory);
  if (filterParams.search) params.set("search", filterParams.search);

  const query = params.toString();
  return query ? `${PUBLIC_EVENTS_STORAGE_KEY}:${query}` : PUBLIC_EVENTS_STORAGE_KEY;
};

/**
 * Hook for fetching public published events
 * Shows events from localStorage until backend API is ready
 */
export const usePublicEvents = (initialFilters = {}) => {
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    totalEvents: 0,
  });

  // Filters state
  const [filters, setFilters] = useState({
    category: initialFilters.category || null,
    subCategory: initialFilters.subCategory || null,
    search: initialFilters.search || null,
    latitude: toFiniteNumber(initialFilters.latitude),
    longitude: toFiniteNumber(initialFilters.longitude),
    radiusKm:
      toFiniteNumber(initialFilters.radiusKm) ?? DEFAULT_LOCATION_RADIUS_KM,
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 20,
  });

  const applyFiltersAndPaginate = useCallback((rawEvents = [], filterParams = {}) => {
    let filtered = Array.isArray(rawEvents) ? [...rawEvents] : [];

    // Only keep published events
    filtered = filtered.filter((event) => {
      const status = (
        event.publishStatus ||
        event.publish_status ||
        event.publishstatus ||
        event.status
      );

      return typeof status === "string" && status.toUpperCase() === "PUBLISHED";
    });

    if (filterParams.search) {
      const searchLower = filterParams.search.toLowerCase();
      filtered = filtered.filter((event) => {
        const potentialFields = [
          event.title,
          event.eventTitle,
          event.description,
          event.location,
          event.venue,
          event?.venues?.[0]?.name,
          event?.venues?.[0]?.city,
          event?.venues?.[0]?.state,
          event?.venues?.[0]?.country,
          event?.venues?.[0]?.fullAddress,
          event?.organizer?.name,
        ];

        return potentialFields.some((field) =>
          typeof field === "string" && field.toLowerCase().includes(searchLower)
        );
      });
    }

    if (filterParams.category) {
      const desired = filterParams.category.toUpperCase();
      filtered = filtered.filter((event) => {
        const primary = (event.category || event.mainCategory || "").toUpperCase();
        const secondary = (event.subCategory || event.secondaryCategory || "").toUpperCase();
        const categoriesArray = Array.isArray(event.categories)
          ? event.categories.map((cat) => String(cat).toUpperCase())
          : [];

        return (
          primary === desired ||
          secondary === desired ||
          categoriesArray.includes(desired)
        );
      });
    }

    if (filterParams.subCategory) {
      const desiredSub = filterParams.subCategory.toUpperCase();
      filtered = filtered.filter((event) => {
        const primarySub = (event.subCategory || event.secondaryCategory || "").toUpperCase();
        const subCategoriesArray = Array.isArray(event.subCategories)
          ? event.subCategories.map((cat) => String(cat).toUpperCase())
          : [];

        return primarySub === desiredSub || subCategoriesArray.includes(desiredSub);
      });
    }

    const latitude = toFiniteNumber(filterParams.latitude);
    const longitude = toFiniteNumber(filterParams.longitude);
    const radiusKm =
      toFiniteNumber(filterParams.radiusKm) ?? DEFAULT_LOCATION_RADIUS_KM;

    if (latitude !== null && longitude !== null) {
      filtered = filtered
        .map((event) => {
          const coordinates = getEventCoordinates(event);
          if (!coordinates) return null;

          const distanceKm = getDistanceKm(
            latitude,
            longitude,
            coordinates.latitude,
            coordinates.longitude
          );

          return {
            ...event,
            distanceKm,
          };
        })
        .filter((event) => event && event.distanceKm <= radiusKm)
        .sort((left, right) => {
          const distanceDifference = left.distanceKm - right.distanceKm;
          if (distanceDifference !== 0) return distanceDifference;

          const leftDate = left.startDate ? new Date(left.startDate).getTime() : Number.MAX_SAFE_INTEGER;
          const rightDate = right.startDate ? new Date(right.startDate).getTime() : Number.MAX_SAFE_INTEGER;
          return leftDate - rightDate;
        });
    }

    const requestedPage = filterParams.page || 1;
    const limit = filterParams.limit || 20;
    const totalEvents = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalEvents / limit));
    const page = Math.min(requestedPage, totalPages);
    const startIndex = (page - 1) * limit;
    const paginatedEvents = filtered.slice(startIndex, startIndex + limit);

    return {
      allEvents: filtered,
      events: paginatedEvents,
      pagination: {
        page,
        limit,
        totalPages,
        totalEvents,
      },
    };
  }, []);

  /**
   * Fetch events from API or localStorage
   */
  const fetchEvents = useCallback(async (filterParams = filters) => {
    try {
      setLoading(true);
      setError(null);
      let sourceEvents = [];

      try {
        const params = new URLSearchParams();
        if (filterParams.category) params.set("category", filterParams.category);
        if (filterParams.subCategory) params.set("subCategory", filterParams.subCategory);
        if (filterParams.search) params.set("search", filterParams.search);

        const response = await apiFetch(`/api/event${params.toString() ? `?${params.toString()}` : ""}`, {
          method: "GET",
        });

        const eventsData = response.data?.events || response.data || response;
        sourceEvents = Array.isArray(eventsData) ? eventsData : [];

        try {
          localStorage.setItem(getFilterCacheKey(filterParams), JSON.stringify(sourceEvents));

          const hasServerFilters =
            Boolean(filterParams.category) ||
            Boolean(filterParams.subCategory) ||
            Boolean(filterParams.search);

          if (!hasServerFilters) {
            localStorage.setItem(PUBLIC_EVENTS_STORAGE_KEY, JSON.stringify(sourceEvents));
          }
        } catch (storageError) {
          console.warn("⚠️ Unable to cache events in localStorage", storageError);
        }
      } catch (apiError) {
        // Fallback to localStorage if API not ready
        if (apiError.message?.includes("404") || apiError.message?.includes("Cannot GET")) {
          console.warn("⚠️ Public events API not available yet. Using localStorage fallback.");

          const queryScopedCache = localStorage.getItem(getFilterCacheKey(filterParams));
          const stored = queryScopedCache || localStorage.getItem(PUBLIC_EVENTS_STORAGE_KEY);
          sourceEvents = stored ? JSON.parse(stored) : [];
          setError(null);
        } else {
          throw apiError;
        }
      }

      const {
        allEvents: processedAllEvents,
        events: processedEvents,
        pagination: paginationData,
      } = applyFiltersAndPaginate(
        sourceEvents,
        filterParams
      );

      setAllEvents(processedAllEvents);
      setEvents(processedEvents);
      setPagination(paginationData);
    } catch (err) {
      console.error("❌ Error fetching public events:", err);
      setError(err.message || "Failed to fetch events");
      setAllEvents([]);
      setEvents([]);
      setPagination({
        page: 1,
        limit: filterParams.limit || 20,
        totalPages: 0,
        totalEvents: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, applyFiltersAndPaginate]);

  /**
   * Update filters and refetch
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => {
        const updated = { ...prev, ...newFilters };
        // Reset to page 1 when filters change (except when explicitly setting page)
        if (
          !newFilters.page &&
          (
            newFilters.category ||
            newFilters.subCategory ||
            newFilters.search ||
            newFilters.latitude !== undefined ||
            newFilters.longitude !== undefined ||
            newFilters.radiusKm !== undefined
          )
        ) {
          updated.page = 1;
        }
        return updated;
    });
  }, []);

  useEffect(() => {
    const has = (key) => Object.prototype.hasOwnProperty.call(initialFilters, key);

    setFilters((prev) => {
      const next = { ...prev };
      let changed = false;

      if (has("category")) {
        const value = initialFilters.category || null;
        if (prev.category !== value) {
          next.category = value;
          changed = true;
        }
      }

      if (has("subCategory")) {
        const value = initialFilters.subCategory || null;
        if (prev.subCategory !== value) {
          next.subCategory = value;
          changed = true;
        }
      }

      if (has("search")) {
        const value = initialFilters.search || null;
        if (prev.search !== value) {
          next.search = value;
          changed = true;
        }
      }

      if (has("latitude")) {
        const value = toFiniteNumber(initialFilters.latitude);
        if (prev.latitude !== value) {
          next.latitude = value;
          changed = true;
        }
      }

      if (has("longitude")) {
        const value = toFiniteNumber(initialFilters.longitude);
        if (prev.longitude !== value) {
          next.longitude = value;
          changed = true;
        }
      }

      if (has("radiusKm")) {
        const value =
          toFiniteNumber(initialFilters.radiusKm) ?? DEFAULT_LOCATION_RADIUS_KM;
        if (prev.radiusKm !== value) {
          next.radiusKm = value;
          changed = true;
        }
      }

      if (has("page")) {
        const value = Math.max(1, Number.parseInt(initialFilters.page, 10) || 1);
        if (prev.page !== value) {
          next.page = value;
          changed = true;
        }
      }

      if (has("limit")) {
        const value = Math.max(1, Number.parseInt(initialFilters.limit, 10) || 20);
        if (prev.limit !== value) {
          next.limit = value;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [
    initialFilters.category,
    initialFilters.subCategory,
    initialFilters.search,
    initialFilters.latitude,
    initialFilters.longitude,
    initialFilters.radiusKm,
    initialFilters.page,
    initialFilters.limit,
  ]);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      category: null,
      subCategory: null,
      search: null,
      latitude: null,
      longitude: null,
      radiusKm: DEFAULT_LOCATION_RADIUS_KM,
      page: 1,
      limit: 20,
    });
  }, []);

  /**
   * Refresh events
   */
  const refresh = useCallback(() => {
    fetchEvents(filters);
  }, [fetchEvents, filters]);

  // Fetch events when filters change
  useEffect(() => {
    fetchEvents(filters);
  }, [filters, fetchEvents]);

  return {
    events,
    allEvents,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    clearFilters,
    refresh,
  };
};

