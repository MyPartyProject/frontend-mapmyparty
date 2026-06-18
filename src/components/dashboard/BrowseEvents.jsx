import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Filter,
  Loader2,
  MapPin,
  Music,
  PartyPopper,
  Search,
  Ticket,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import Header from "@/components/Header";
import { isAuthenticated as checkAuth } from "@/utils/auth";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";
import { formatEventPriceLabel, normalizePriceLabel } from "@/utils/priceFormatter";
import eventFallback from "@/assets/event-music.jpg";
import {
  EVENT_CATEGORY_OPTIONS,
  EVENT_SUBCATEGORY_OPTIONS_BY_KEY,
  inferEventCategoryKeyFromSubCategory,
  normalizeEventSubCategoryValue,
} from "@/config/eventCategories";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const MOBILE_EVENT_ROW_CLASS =
  "flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide sm:grid sm:overflow-visible sm:pb-0 sm:snap-none";

const MOBILE_EVENT_ITEM_CLASS =
  "w-[78vw] max-w-[20rem] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink sm:snap-none";

const MOBILE_CHIP_ROW_CLASS =
  "flex snap-x gap-2 overflow-x-auto pb-1 scroll-smooth scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0 sm:snap-none";

const MOBILE_CHIP_ITEM_CLASS = "shrink-0 snap-start whitespace-nowrap sm:shrink";

const CATEGORY_ORDER = [
  "music",
  "concerts",
  "sports",
  "movies",
  "plays",
  "activities",
  "workshop",
  "business",
  "entertainment",
  "food",
  "wellness",
];
const FALLBACK_CATEGORY_COLORS = ["#60a5fa", "#f472b6", "#2dd4bf", "#f59e0b", "#818cf8"];

const KNOWN_CATEGORY_META = {
  business: { label: "Business", icon: Briefcase, color: "#38bdf8" },
  activities: { label: "Activities", icon: PartyPopper, color: "#22c55e" },
  entertainment: { label: "Entertainment", icon: Sparkles, color: "#ef4444" },
  concerts: { label: "Concerts", icon: Music, color: "#a855f7" },
  food: { label: "Food", icon: Sparkles, color: "#f59e0b" },
  movies: { label: "Movies", icon: Clapperboard, color: "#0ea5e9" },
  music: { label: "Music", icon: Music, color: "#a855f7" },
  plays: { label: "Plays", icon: Ticket, color: "#f97316" },
  sports: { label: "Sports", icon: Trophy, color: "#14b8a6" },
  wellness: { label: "Wellness", icon: Sparkles, color: "#10b981" },
  workshop: { label: "Workshop", icon: Briefcase, color: "#f97316" },
};

const KNOWN_SUBCATEGORY_OPTIONS = EVENT_SUBCATEGORY_OPTIONS_BY_KEY;

const PINNED_CATEGORY_KEYS = EVENT_CATEGORY_OPTIONS.map((category) => category.toLowerCase());

const normalizeBrowseValue = (value) => (typeof value === "string" ? value.trim() : "");

const getLookupKey = (value) => normalizeBrowseValue(value).toLowerCase();

const toDisplayLabel = (value) => {
  const normalized = normalizeBrowseValue(value);
  if (!normalized) return "";

  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const parseBrowsePage = (value) => Math.max(1, Number.parseInt(value, 10) || 1);

const parseBrowseCoordinate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBrowseRadius = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
};

const parseBrowseNearby = (value) => value === "true" || value === "1";

const resolveCategoryMeta = (value, fallbackIndex = 0) => {
  const normalizedValue = normalizeBrowseValue(value) || "Other";
  const key = getLookupKey(normalizedValue) || "other";
  const knownMeta = KNOWN_CATEGORY_META[key];

  return {
    key,
    value: knownMeta?.label || normalizedValue,
    label: knownMeta?.label || toDisplayLabel(normalizedValue),
    icon: knownMeta?.icon || Sparkles,
    color: knownMeta?.color || FALLBACK_CATEGORY_COLORS[fallbackIndex % FALLBACK_CATEGORY_COLORS.length],
  };
};

const sortCategoryEntries = (left, right) => {
  const leftOrder = CATEGORY_ORDER.indexOf(left.key);
  const rightOrder = CATEGORY_ORDER.indexOf(right.key);

  if (leftOrder !== -1 || rightOrder !== -1) {
    if (leftOrder === -1) return 1;
    if (rightOrder === -1) return -1;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }

  return left.label.localeCompare(right.label);
};

const getBrowseStateFromSearchParams = (searchParams) => {
  const selectedSubCategory = normalizeEventSubCategoryValue(searchParams.get("subCategory")) || "all";
  const selectedCategory =
    getLookupKey(searchParams.get("category")) ||
    inferEventCategoryKeyFromSubCategory(selectedSubCategory) ||
    "all";
  const parsedLatitude = parseBrowseCoordinate(searchParams.get("lat"));
  const parsedLongitude = parseBrowseCoordinate(searchParams.get("lng"));
  const nearby =
    parseBrowseNearby(searchParams.get("nearby")) &&
    Number.isFinite(parsedLatitude) &&
    Number.isFinite(parsedLongitude);

  return {
    searchQuery: normalizeBrowseValue(searchParams.get("search")),
    selectedCategory,
    selectedSubCategory,
    nearby,
    latitude: nearby ? parsedLatitude : null,
    longitude: nearby ? parsedLongitude : null,
    radiusKm: parseBrowseRadius(searchParams.get("radius")),
    page: parseBrowsePage(searchParams.get("page")),
  };
};

const buildBrowseSearchParams = ({
  searchQuery,
  selectedCategory,
  selectedSubCategory,
  nearby,
  latitude,
  longitude,
  radiusKm,
  page,
}) => {
  const params = new URLSearchParams();
  const normalizedSearch = normalizeBrowseValue(searchQuery);

  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  }

  if (selectedCategory !== "all") {
    params.set("category", KNOWN_CATEGORY_META[selectedCategory]?.label || toDisplayLabel(selectedCategory));
  }

  if (selectedSubCategory !== "all") {
    params.set("subCategory", selectedSubCategory);
  }

  if (nearby && Number.isFinite(latitude) && Number.isFinite(longitude)) {
    params.set("nearby", "true");
    params.set("lat", String(latitude));
    params.set("lng", String(longitude));
    if (Number.isFinite(radiusKm) && radiusKm > 0 && radiusKm !== 50) {
      params.set("radius", String(radiusKm));
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  return params;
};

const getEventCategoryValue = (event) => normalizeBrowseValue(event.category || event.mainCategory);

const getEventSubCategoryValue = (event) =>
  normalizeEventSubCategoryValue(event.subCategory || event.subcategory || event.secondaryCategory);

const getEventTrendScore = (event) => {
  const soldTickets = Array.isArray(event.tickets)
    ? event.tickets.reduce((total, ticket) => {
        const soldQty = Number(ticket?.soldQty);
        return total + (Number.isFinite(soldQty) ? soldQty : 0);
      }, 0)
    : 0;

  const bookingCount = Number(event?._count?.bookings) || 0;
  return soldTickets * 10 + bookingCount * 3;
};

export default function BrowseEvents({ showPublicHeader = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlState = useMemo(() => getBrowseStateFromSearchParams(searchParams), [searchParams]);
  const [searchQuery, setSearchQuery] = useState(() => urlState.searchQuery);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [activeTrendingIndex, setActiveTrendingIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const updateBrowseState = useCallback((updates, options = {}) => {
    const nextState = {
      searchQuery: updates.searchQuery ?? urlState.searchQuery,
      selectedCategory: updates.selectedCategory ?? urlState.selectedCategory,
      selectedSubCategory: updates.selectedSubCategory ?? urlState.selectedSubCategory,
      nearby: updates.nearby ?? urlState.nearby,
      latitude: updates.latitude ?? urlState.latitude,
      longitude: updates.longitude ?? urlState.longitude,
      radiusKm: updates.radiusKm ?? urlState.radiusKm,
      page: updates.page ?? urlState.page,
    };

    if (nextState.selectedCategory === "all") {
      nextState.selectedSubCategory = "all";
    }

    if (nextState.selectedSubCategory !== "all" && nextState.selectedCategory === "all") {
      nextState.selectedCategory =
        inferEventCategoryKeyFromSubCategory(nextState.selectedSubCategory) || "all";
    }

    if (
      !nextState.nearby ||
      !Number.isFinite(nextState.latitude) ||
      !Number.isFinite(nextState.longitude)
    ) {
      nextState.nearby = false;
      nextState.latitude = null;
      nextState.longitude = null;
      nextState.radiusKm = 50;
    }

    const nextParams = buildBrowseSearchParams(nextState);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: options.replace ?? false });
    }
  }, [searchParams, setSearchParams, urlState]);

  const {
    catalogEvents = [],
    events: visibleEvents = [],
    allEvents: filteredEvents = [],
    loading: eventsLoading,
    error,
    pagination,
  } = usePublicEvents({
    search: urlState.searchQuery || null,
    category: urlState.selectedCategory === "all" ? null : urlState.selectedCategory,
    subCategory: urlState.selectedSubCategory === "all" ? null : urlState.selectedSubCategory,
    latitude: urlState.nearby ? urlState.latitude : null,
    longitude: urlState.nearby ? urlState.longitude : null,
    radiusKm: urlState.nearby ? urlState.radiusKm : 50,
    page: urlState.page,
    limit: PAGE_SIZE,
  });

  const loading = eventsLoading;
  const appliedSearchQuery = urlState.searchQuery;

  useEffect(() => {
    if (showPublicHeader && checkAuth()) {
      const role = (sessionStorage.getItem("role") || "USER").toUpperCase();
      if (role === "USER") {
        navigate(
          {
            pathname: "/dashboard/browse-events",
            search: location.search,
          },
          { replace: true }
        );
      }
    }
  }, [showPublicHeader, navigate, location.search]);

  useEffect(() => {
    setSearchQuery(urlState.searchQuery);
  }, [urlState.searchQuery]);

  useEffect(() => {
    const normalizedSearch = normalizeBrowseValue(searchQuery);
    if (normalizedSearch === urlState.searchQuery) return;

    const timer = setTimeout(() => {
      updateBrowseState(
        {
          searchQuery: normalizedSearch,
          page: 1,
        },
        { replace: true }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, updateBrowseState, urlState.searchQuery]);

  useEffect(() => {
    if (eventsLoading) return;

    if (pagination.page !== urlState.page) {
      updateBrowseState({ page: pagination.page }, { replace: true });
    }
  }, [eventsLoading, pagination.page, updateBrowseState, urlState.page]);

  const categoryOptions = useMemo(() => {
    const categories = new Map();

    PINNED_CATEGORY_KEYS.forEach((key) => {
      const meta = KNOWN_CATEGORY_META[key];
      if (!meta) return;

      categories.set(key, {
        key,
        value: meta.label,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        count: 0,
      });
    });

    catalogEvents.forEach((event) => {
      const categoryValue = getEventCategoryValue(event);
      if (!categoryValue) return;

      const key = getLookupKey(categoryValue);
      const existing = categories.get(key);

      if (existing) {
        existing.count += 1;
        return;
      }

      categories.set(key, {
        ...resolveCategoryMeta(categoryValue, categories.size),
        count: 1,
      });
    });

    if (urlState.selectedCategory !== "all" && !categories.has(urlState.selectedCategory)) {
      categories.set(urlState.selectedCategory, {
        ...resolveCategoryMeta(urlState.selectedCategory, categories.size),
        count: 0,
      });
    }

    return Array.from(categories.values()).sort(sortCategoryEntries);
  }, [catalogEvents, urlState.selectedCategory]);

  const categoryLookup = useMemo(
    () => new Map(categoryOptions.map((category) => [category.key, category])),
    [categoryOptions]
  );

  const activeSubcategories = useMemo(() => {
    if (urlState.selectedCategory === "all") return [];

    const subcategories = new Map();

    (KNOWN_SUBCATEGORY_OPTIONS[urlState.selectedCategory] || []).forEach((option) => {
      subcategories.set(getLookupKey(option.value), {
        ...option,
        count: 0,
      });
    });

    catalogEvents.forEach((event) => {
      if (getLookupKey(getEventCategoryValue(event)) !== urlState.selectedCategory) return;

      const subCategoryValue = getEventSubCategoryValue(event);
      if (!subCategoryValue) return;

      const key = getLookupKey(subCategoryValue);

      if (!subcategories.has(key)) {
        subcategories.set(key, {
          label: subCategoryValue,
          value: subCategoryValue,
          count: 0,
        });
      }

      subcategories.get(key).count += 1;
    });

    if (
      urlState.selectedSubCategory !== "all" &&
      !subcategories.has(getLookupKey(urlState.selectedSubCategory))
    ) {
      subcategories.set(getLookupKey(urlState.selectedSubCategory), {
        label: urlState.selectedSubCategory,
        value: urlState.selectedSubCategory,
        count: 0,
      });
    }

    return Array.from(subcategories.values());
  }, [catalogEvents, urlState.selectedCategory, urlState.selectedSubCategory]);

  const trendingEvents = useMemo(() => {
    return [...filteredEvents]
      .sort((left, right) => {
        const scoreDifference = getEventTrendScore(right) - getEventTrendScore(left);
        if (scoreDifference !== 0) return scoreDifference;

        const leftDate = left.startDate ? new Date(left.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const rightDate = right.startDate ? new Date(right.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        return leftDate - rightDate;
      })
      .slice(0, 4);
  }, [filteredEvents]);

  useEffect(() => {
    setActiveTrendingIndex((currentIndex) => {
      if (trendingEvents.length === 0) return 0;
      return Math.min(currentIndex, trendingEvents.length - 1);
    });
  }, [trendingEvents.length]);

  useEffect(() => {
    if (trendingEvents.length <= 1 || isAutoplayPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveTrendingIndex((currentIndex) => (currentIndex + 1) % trendingEvents.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [trendingEvents.length, isAutoplayPaused]);

  const goToPreviousTrending = () => {
    if (trendingEvents.length <= 1) return;
    setActiveTrendingIndex(
      (currentIndex) => (currentIndex - 1 + trendingEvents.length) % trendingEvents.length,
    );
  };

  const goToNextTrending = () => {
    if (trendingEvents.length <= 1) return;
    setActiveTrendingIndex((currentIndex) => (currentIndex + 1) % trendingEvents.length);
  };

  const handleTouchStart = (e) => {
    setIsAutoplayPaused(true);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNextTrending();
    } else if (distance < -minSwipeDistance) {
      goToPreviousTrending();
    }
    setTouchStartX(null);
    setTouchEndX(null);
    setIsAutoplayPaused(false);
  };

  const handleMouseEnter = () => {
    setIsAutoplayPaused(true);
  };

  const handleMouseLeave = () => {
    setIsAutoplayPaused(false);
  };

  const groupedByCategory = useMemo(() => {
    const groups = new Map();

    visibleEvents.forEach((event) => {
      const categoryValue = getEventCategoryValue(event) || "Other";
      const key = getLookupKey(categoryValue) || "other";

      if (!groups.has(key)) {
        groups.set(key, {
          ...resolveCategoryMeta(categoryValue, groups.size),
          events: [],
        });
      }

      groups.get(key).events.push(event);
    });

    return Array.from(groups.values()).sort(sortCategoryEntries);
  }, [visibleEvents]);

  const hasActiveFilters =
    urlState.selectedCategory !== "all" ||
    urlState.selectedSubCategory !== "all" ||
    urlState.nearby ||
    Boolean(appliedSearchQuery);

  const activeFilterCount = [
    urlState.selectedCategory !== "all",
    urlState.selectedSubCategory !== "all",
    urlState.nearby,
    Boolean(appliedSearchQuery),
  ].filter(Boolean).length;
  const activeTrendingSlideIndex =
    trendingEvents.length > 0 ? activeTrendingIndex % trendingEvents.length : 0;

  const resultsStart =
    pagination.totalEvents > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const resultsEnd = Math.min(pagination.page * pagination.limit, pagination.totalEvents);
  const browseShellClass = `w-full bg-background text-foreground ${
    showPublicHeader ? "min-h-screen" : "min-h-full"
  }`;
  const browseContentClass = showPublicHeader
    ? "mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 sm:py-8 lg:px-8"
    : "mx-auto max-w-7xl px-4 pb-4 pt-4 sm:px-6 sm:py-8 lg:px-8";
  const categoryEventGridClass = `${MOBILE_EVENT_ROW_CLASS} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getEventLocation = (event) => {
    if (event.venues?.length > 0) {
      const venue = event.venues[0];
      const cityState = `${venue.city || ""}${venue.city && venue.state ? ", " : ""}${venue.state || ""}`.trim();

      return cityState || venue.name || event.location || "Location TBA";
    }

    return event.location || "Location TBA";
  };

  const getEventHref = (event) =>
    `/events/${event.organizer?.slug || "events"}/${event.slug || event.id}`;

  const getEventImage = (event) => {
    return resolveEventBannerImage(event, eventFallback);
  };

  const getEventPriceDisplay = (event) => {
    if (Array.isArray(event.tickets) && event.tickets.length > 0) {
      const prices = event.tickets
        .map((ticket) => Number(ticket.price))
        .filter((price) => !Number.isNaN(price) && price > 0);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return formatEventPriceLabel(minPrice);
      }
    }

    if (typeof event.price === "number") return formatEventPriceLabel(event.price);

    return normalizePriceLabel(event.price) || "Free";
  };

  const isLocationSupported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    "geolocation" in navigator;

  const applyNearbyFilter = () => {
    if (!isLocationSupported) {
      toast.error("Location is not available in this browser or page context.");
      return;
    }

    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateBrowseState({
          nearby: true,
          latitude,
          longitude,
          radiusKm: 50,
          page: 1,
        });
        setNearbyLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error(
          error?.code === 1
            ? "Location access denied. Please allow location to use Nearby."
            : "Unable to detect your location right now.",
        );
        setNearbyLoading(false);
      },
    );
  };

  const clearNearbyFilter = () => {
    updateBrowseState({
      nearby: false,
      latitude: null,
      longitude: null,
      radiusKm: 50,
      page: 1,
    });
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    updateBrowseState({
      searchQuery: "",
      selectedCategory: "all",
      selectedSubCategory: "all",
      nearby: false,
      latitude: null,
      longitude: null,
      radiusKm: 50,
      page: 1,
    });
  };

  const EventCard = ({ event }) => (
    <Link
      to={getEventHref(event)}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block h-full ${MOBILE_EVENT_ITEM_CLASS}`}
    >
      <article className="relative h-full min-h-[11.25rem] overflow-hidden rounded-lg border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1 hover:border-border hover:shadow-[var(--shadow-elegant)]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={getEventImage(event)}
            alt={event.title || event.eventTitle || "Event"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-background/5" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/55 to-transparent" />
          <div className="theme-gradient-primary absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20" />
        </div>

        <div className="relative flex h-full min-h-[11.25rem] flex-col justify-between p-3">
          <div className="flex items-start justify-between gap-2">
            {(event.subCategory || event.subcategory || event.category) && (
              <div className="max-w-[62%] truncate rounded-full border border-border/40 bg-card/85 px-2.5 py-1 text-[0.68rem] font-medium leading-none text-foreground shadow-[var(--shadow-card)] backdrop-blur-md">
                {event.subCategory || event.subcategory || event.category}
              </div>
            )}
            <div className="inline-flex min-w-[4.75rem] shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-bold leading-none tabular-nums text-accent shadow-[var(--shadow-card)] backdrop-blur-md">
              {getEventPriceDisplay(event)}
            </div>
          </div>

          <div className="mt-auto">
            <h3 className="line-clamp-2 text-sm font-black leading-tight text-foreground drop-shadow-xl transition-colors group-hover:text-accent sm:text-base">
              {event.title || event.eventTitle}
            </h3>
            <div className="mt-2 grid gap-1 text-[0.7rem] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0 text-accent" />
                <span className="line-clamp-1">{formatDate(event.startDate || event.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-accent" />
                <span className="line-clamp-1">{getEventLocation(event)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2.5">
              <span className="h-px flex-1 bg-gradient-to-r from-border/70 via-border/30 to-transparent" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/75 px-3 py-1.5 text-[0.68rem] font-semibold text-foreground shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 group-hover:border-border group-hover:bg-primaryCTA group-hover:text-primary-foreground">
                View Details
                <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  return (
    <div className={browseShellClass}>
      {showPublicHeader && <Header forceMainHeader />}
      <div className={browseContentClass}>
        {trendingEvents.length > 0 && (
          <div className="mb-6">
            <section className="relative mx-auto w-[calc(100vw-32px)] max-w-[420px] overflow-hidden rounded-[16px] border border-accent/15 bg-card/45 shadow-[0_0_15px_rgba(168,85,247,0.05)] sm:w-auto sm:max-w-none sm:mx-0 sm:mb-5 sm:rounded-[1.5rem] sm:border-border/50 sm:bg-card sm:shadow-[var(--shadow-elegant)]">
              {/* Mobile Swipe Buttons (Over image) */}
              {trendingEvents.length > 1 && (
                <div className="absolute left-2 right-2 top-[75px] xs:top-[85px] -translate-y-1/2 z-20 flex justify-between pointer-events-none sm:hidden">
                  <button
                    type="button"
                    aria-label="Previous event"
                    disabled={activeTrendingSlideIndex === 0}
                    onClick={goToPreviousTrending}
                    className="pointer-events-auto inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-sm transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next event"
                    disabled={activeTrendingSlideIndex === trendingEvents.length - 1}
                    onClick={goToNextTrending}
                    className="pointer-events-auto inline-flex h-[32px] w-[32px] items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-sm transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="relative overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-out sm:min-h-[22rem] lg:min-h-[24rem] motion-reduce:transition-none"
                  style={{ transform: `translateX(-${activeTrendingSlideIndex * 100}%)` }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {trendingEvents.map((event, index) => {
                    const isActive = index === activeTrendingSlideIndex;
                    const eventHref = getEventHref(event);

                    return (
                      <div
                        key={event.id || index}
                        aria-hidden={!isActive}
                        className={`relative min-w-full overflow-hidden flex flex-col sm:block ${
                          isActive ? "" : "pointer-events-none"
                        }`}
                      >
                        {/* Image Wrapper */}
                        <div className="relative w-full aspect-[16/9] min-h-[150px] max-h-[190px] overflow-hidden rounded-t-[16px] sm:absolute sm:inset-0 sm:h-full sm:w-full sm:aspect-none sm:rounded-none">
                          <img
                            src={getEventImage(event)}
                            alt={event.title || event.eventTitle || "Event"}
                            className="h-full w-full object-cover object-center"
                          />
                          {/* Compact price badge on top-left of the flyer image */}
                          <div className="absolute top-3 left-3 z-10 sm:hidden">
                            <span className="inline-flex items-center justify-center rounded-full border border-accent/30 bg-black/60 px-2.5 py-1 text-[10px] font-bold leading-none text-accent backdrop-blur-md">
                              {getEventPriceDisplay(event)}
                            </span>
                          </div>

                          {/* Desktop Overlays (hidden on mobile) */}
                          <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-background/92 via-background/58 to-background/16" />
                          <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                          <div className="hidden sm:block theme-gradient-primary absolute inset-0 opacity-15" />
                        </div>

                        {/* Event Information Section */}
                        <div className="relative flex flex-col justify-between bg-card/95 border-t border-border/10 p-4 sm:absolute sm:inset-0 sm:bg-transparent sm:border-t-0 sm:flex-col sm:justify-end sm:px-6 sm:py-6 lg:px-7">
                          <div className="flex flex-col gap-2.5 sm:max-w-2xl">
                            <h1 className="line-clamp-2 text-[17px] font-semibold leading-snug text-foreground sm:text-4xl sm:font-black sm:leading-tight sm:drop-shadow-xl">
                              {event.title || event.eventTitle}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground sm:mt-3 sm:gap-2 sm:text-sm">
                              {/* On mobile: simple text with icon. On desktop: rounded-full border bg-card/70 px-2.5 py-1.5 */}
                              <span className="flex items-center gap-1.5 sm:inline-flex sm:items-center sm:gap-1.5 sm:rounded-full sm:border sm:border-border/40 sm:bg-card/70 sm:px-2.5 sm:py-1.5 sm:backdrop-blur-md">
                                <Calendar className="h-3.5 w-3.5 text-accent shrink-0" />
                                <span className="text-[12px] sm:text-xs sm:font-normal">{formatDate(event.startDate || event.date)}</span>
                              </span>
                              <span className="flex items-center gap-1.5 sm:inline-flex sm:items-center sm:gap-1.5 sm:rounded-full sm:border sm:border-border/40 sm:bg-card/70 sm:px-2.5 sm:py-1.5 sm:backdrop-blur-md">
                                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                                <span className="text-[12px] sm:text-xs sm:font-normal truncate max-w-[180px] sm:max-w-none">{getEventLocation(event)}</span>
                              </span>
                            </div>
                            <div className="mt-2.5 flex sm:mt-4 sm:flex-row">
                              <Button
                                asChild
                                variant="accent"
                                className="h-10 rounded-[10px] px-[18px] text-[13px] font-semibold w-fit transition-all duration-200 active:scale-[0.97] hover:opacity-90 sm:h-10 sm:rounded-full sm:px-5 sm:text-sm"
                              >
                                <Link to={eventHref} target="_blank" rel="noopener noreferrer">
                                  View Details
                                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop controls */}
              {trendingEvents.length > 1 && (
                <>
                  <div className="hidden sm:flex absolute bottom-4 right-5 z-10 items-center gap-2">
                    <button
                      type="button"
                      aria-label="Previous event"
                      onClick={goToPreviousTrending}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/65 text-foreground shadow-[var(--shadow-card)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-border hover:bg-primaryCTA hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next event"
                      onClick={goToNextTrending}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-card/65 text-foreground shadow-[var(--shadow-card)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-border hover:bg-primaryCTA hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Desktop indicators */}
                  <div className="hidden sm:flex absolute bottom-5 left-6 gap-2 lg:left-7 z-10">
                    {trendingEvents.map((event, index) => (
                      <button
                        key={event.id || index}
                        type="button"
                        aria-label={`Go to slide ${index + 1}`}
                        onClick={() => setActiveTrendingIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-200 ${
                          index === activeTrendingSlideIndex ? "w-7 bg-accent" : "w-3 bg-muted-foreground/35"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>


          </div>
        )}

        <div className="mb-4 sm:mb-5">
          <button
            type="button"
            onClick={() => setFiltersExpanded((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/70 px-4 py-2 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] backdrop-blur transition hover:-translate-y-0.5 hover:border-border hover:bg-primaryCTA hover:text-primary-foreground"
            aria-expanded={filtersExpanded}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[0.68rem] font-bold leading-none text-accent-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              filtersExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div
                className={`mt-3 max-h-[70vh] overflow-y-auto rounded-xl border border-border/40 bg-card/70 p-3 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-200 sm:max-h-none sm:overflow-visible sm:p-4 ${
                  filtersExpanded ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                }`}
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_0.45fr]">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                      Category
                    </p>
                    <div className={MOBILE_CHIP_ROW_CLASS}>
                      <button
                        type="button"
                        onClick={() =>
                          updateBrowseState({
                            selectedCategory: "all",
                            selectedSubCategory: "all",
                            page: 1,
                          })
                        }
                        className={`${MOBILE_CHIP_ITEM_CLASS} rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          urlState.selectedCategory === "all"
                            ? "bg-primaryCTA text-primary-foreground"
                            : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        All Events
                      </button>
                      {categoryOptions.map((category) => {
                        const Icon = category.icon;
                        const isActive = urlState.selectedCategory === category.key;

                        return (
                          <button
                            key={category.key}
                            type="button"
                            onClick={() =>
                              updateBrowseState({
                                selectedCategory: category.key,
                                selectedSubCategory: "all",
                                page: 1,
                              })
                            }
                            className={`${MOBILE_CHIP_ITEM_CLASS} flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                              isActive
                                ? "bg-primaryCTA text-primary-foreground"
                                : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {category.label}
                            <span className={`ml-0.5 text-[10px] ${isActive ? "text-primary-foreground/75" : "text-muted-foreground/70"}`}>
                              ({category.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {activeSubcategories.length > 0 && (
                      <div className="mt-3 border-t border-border/25 pt-3">
                        <div className={MOBILE_CHIP_ROW_CLASS}>
                          <button
                            type="button"
                            onClick={() =>
                              updateBrowseState({
                                selectedSubCategory: "all",
                                page: 1,
                              })
                            }
                            className={`${MOBILE_CHIP_ITEM_CLASS} rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                              urlState.selectedSubCategory === "all"
                                ? "bg-muted text-foreground"
                                : "bg-muted/35 text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                            }`}
                          >
                            All
                          </button>
                          {activeSubcategories.map((subCategory) => (
                            <button
                              key={subCategory.value}
                              type="button"
                              onClick={() =>
                                updateBrowseState({
                                  selectedSubCategory: subCategory.value,
                                  page: 1,
                                })
                              }
                              className={`${MOBILE_CHIP_ITEM_CLASS} rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                                urlState.selectedSubCategory === subCategory.value
                                  ? "bg-primaryCTA text-primary-foreground"
                                  : "bg-muted/35 text-muted-foreground hover:bg-muted/55 hover:text-foreground"
                              }`}
                            >
                              {subCategory.label}
                              {subCategory.count > 0 && (
                                <span className="ml-1 text-[10px] opacity-70">({subCategory.count})</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                      Location
                    </p>
                    <div className={MOBILE_CHIP_ROW_CLASS}>
                      <button
                        type="button"
                        onClick={applyNearbyFilter}
                        disabled={nearbyLoading || !isLocationSupported}
                        className={`${MOBILE_CHIP_ITEM_CLASS} inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                          urlState.nearby
                            ? "bg-primaryCTA text-primary-foreground"
                            : "border border-border/40 bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                        title={!isLocationSupported ? "Location not available" : "Use your current location"}
                      >
                        {nearbyLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5" />
                        )}
                        {urlState.nearby ? "Nearby selected" : "Nearby"}
                      </button>
                      {urlState.nearby && (
                        <button
                          type="button"
                          onClick={clearNearbyFilter}
                          className={`${MOBILE_CHIP_ITEM_CLASS} inline-flex w-fit items-center gap-1 rounded-full border border-border/30 bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground`}
                        >
                          <X className="h-3 w-3" /> Remove nearby
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-3 border-t border-border/25 pt-3">
                    <div className={MOBILE_CHIP_ROW_CLASS}>
                      <span className={`${MOBILE_CHIP_ITEM_CLASS} text-[11px] text-muted-foreground`}>
                        Filters:
                      </span>
                      {urlState.selectedCategory !== "all" && (
                        <Badge className={`${MOBILE_CHIP_ITEM_CLASS} border-0 bg-muted/45 px-2 py-0.5 text-[11px] text-muted-foreground`}>
                          {categoryLookup.get(urlState.selectedCategory)?.label || toDisplayLabel(urlState.selectedCategory)}
                        </Badge>
                      )}
                      {urlState.selectedSubCategory !== "all" && (
                        <Badge className={`${MOBILE_CHIP_ITEM_CLASS} border-0 bg-muted/45 px-2 py-0.5 text-[11px] text-muted-foreground`}>
                          {urlState.selectedSubCategory}
                        </Badge>
                      )}
                      {urlState.nearby && (
                        <Badge className={`${MOBILE_CHIP_ITEM_CLASS} border-0 bg-accent/10 px-2 py-0.5 text-[11px] text-accent`}>
                          Nearby
                        </Badge>
                      )}
                      {appliedSearchQuery && (
                        <Badge className={`${MOBILE_CHIP_ITEM_CLASS} border-0 bg-muted/45 px-2 py-0.5 text-[11px] text-muted-foreground`}>
                          "{appliedSearchQuery}"
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full border border-border/30 bg-card/60 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground sm:w-auto sm:justify-start"
                    >
                      <X className="h-3 w-3" /> Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        )}

        <div className="space-y-6 sm:space-y-8">
          {groupedByCategory.map((category) => {
            if (category.events.length === 0) return null;
            const Icon = category.icon;

            return (
              <section key={category.key} className="space-y-3 border-t border-border/20 pt-4 sm:pt-5">
                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-card/70 text-accent shadow-[var(--shadow-card)] sm:h-10 sm:w-10">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-black leading-tight text-foreground sm:text-2xl">
                        {category.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category.events.length} events on this page
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="accent"
                    className="h-9 shrink-0 rounded-full px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                    onClick={() =>
                      updateBrowseState({
                        selectedCategory: category.key,
                        selectedSubCategory: "all",
                        page: 1,
                      })
                    }
                  >
                    Browse All
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className={categoryEventGridClass}>
                  {category.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {loading && (
          <div className={`mt-6 ${categoryEventGridClass}`}>
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className={MOBILE_EVENT_ITEM_CLASS}>
                <div className="animate-pulse rounded-lg border border-border/40 bg-card/70">
                  <div className="h-44 rounded-t-lg bg-muted/40" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-3/4 rounded bg-muted/50" />
                    <div className="h-3 w-1/2 rounded bg-muted/40" />
                    <div className="h-3 w-1/3 rounded bg-muted/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visibleEvents.length === 0 && (
          <div className="mt-6 rounded-xl border border-border/40 bg-card/70 p-7 text-center shadow-[var(--shadow-card)] sm:p-12">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/45 sm:mb-4 sm:h-12 sm:w-12" />
            <h3 className="mb-1 text-base font-semibold text-foreground">No events found</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              {appliedSearchQuery
                ? "Try adjusting your search or filters"
                : "No events are available for this category yet"}
            </p>
            <Button
              onClick={clearAllFilters}
              className="h-9 bg-primaryCTA px-4 text-sm text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {!loading && pagination.totalPages > 1 && visibleEvents.length > 0 && (
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border/40 bg-card/70 px-3 py-4 shadow-[var(--shadow-card)] sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="text-center text-sm text-muted-foreground sm:text-left">
              {`Showing ${resultsStart}-${resultsEnd} of ${pagination.totalEvents} events`}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <button
                type="button"
                onClick={() => updateBrowseState({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/40 px-4 text-sm text-foreground transition hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => updateBrowseState({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/40 px-4 text-sm text-foreground transition hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
