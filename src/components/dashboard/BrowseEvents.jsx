import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  MapPin,
  Music,
  PartyPopper,
  Search,
  Ticket,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import Header from "@/components/Header";
import { isAuthenticated as checkAuth } from "@/utils/auth";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";

const PAGE_SIZE = 20;

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

const WORKSHOP_SUBCATEGORIES = [
  "Comedy Shows",
  "Theater Shows",
  "Sports",
  "Arts",
  "Meeting",
  "Conference",
  "Seminar",
  "Yoga",
  "Cooking",
  "Dance",
  "Self Help",
  "Consultation",
  "Corporate Event",
  "Communication",
].map((label) => ({ label, value: label }));

const SPORTS_SUBCATEGORIES = [
  "Live Sports",
  "Stadium Matches",
  "Esports",
  "Fitness Events",
  "Marathons",
  "Tournaments",
].map((label) => ({ label, value: label }));

const MOVIES_SUBCATEGORIES = [
  "Movie Screenings",
  "Film Festivals",
  "Premieres",
  "Drive-In Cinema",
  "Short Films",
].map((label) => ({ label, value: label }));

const PLAYS_SUBCATEGORIES = [
  "Plays",
  "Drama Shows",
  "Musical Theatre",
  "Stage Performances",
  "Classical Drama",
].map((label) => ({ label, value: label }));

const CONCERTS_SUBCATEGORIES = [
  "Live Concerts",
  "Acoustic Concerts",
  "Arena Shows",
  "Orchestra Nights",
  "DJ Concerts",
  "Music Festival",
].map((label) => ({ label, value: label }));

const ACTIVITIES_SUBCATEGORIES = [
  "Adventure Activities",
  "Games Night",
  "Family Activities",
  "Community Events",
  "Outdoor Activities",
  "Experiences",
].map((label) => ({ label, value: label }));

const MUSIC_SUBCATEGORIES = [
  "Live Concerts",
  "Club Nights",
  "Music Festivals",
  "Bollywood",
  "Hip Hop",
  "Electronic",
  "Melodic",
  "Live Music",
  "Metal",
  "Rap",
  "Music House",
  "Techno",
  "K-pop",
  "Hollywood",
  "POP",
  "Punjabi",
  "Disco",
  "Rock",
  "Afrobeat",
  "Dance Hall",
  "Thumri",
  "Bolly Tech",
].map((label) => ({ label, value: label }));

const KNOWN_SUBCATEGORY_OPTIONS = {
  music: MUSIC_SUBCATEGORIES,
  concerts: CONCERTS_SUBCATEGORIES,
  sports: SPORTS_SUBCATEGORIES,
  movies: MOVIES_SUBCATEGORIES,
  plays: PLAYS_SUBCATEGORIES,
  activities: ACTIVITIES_SUBCATEGORIES,
  workshop: WORKSHOP_SUBCATEGORIES,
};

const PINNED_CATEGORY_KEYS = [
  "music",
  "concerts",
  "sports",
  "movies",
  "plays",
  "activities",
  "workshop",
];

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

const normalizeSubCategoryValue = (value) => {
  const normalized = normalizeBrowseValue(value);
  if (!normalized) return null;

  const knownOptions = [
    ...WORKSHOP_SUBCATEGORIES,
    ...MUSIC_SUBCATEGORIES,
    ...CONCERTS_SUBCATEGORIES,
    ...SPORTS_SUBCATEGORIES,
    ...MOVIES_SUBCATEGORIES,
    ...PLAYS_SUBCATEGORIES,
    ...ACTIVITIES_SUBCATEGORIES,
  ];
  const match = knownOptions.find((option) => getLookupKey(option.value) === getLookupKey(normalized));

  return match?.value || normalized;
};

const inferCategoryKeyFromSubCategory = (subCategory) => {
  const normalized = getLookupKey(subCategory);
  if (!normalized) return null;

  if (MUSIC_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "music";
  }

  if (CONCERTS_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "concerts";
  }

  if (SPORTS_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "sports";
  }

  if (MOVIES_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "movies";
  }

  if (PLAYS_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "plays";
  }

  if (ACTIVITIES_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "activities";
  }

  if (WORKSHOP_SUBCATEGORIES.some((option) => getLookupKey(option.value) === normalized)) {
    return "workshop";
  }

  return null;
};

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
  const selectedSubCategory = normalizeSubCategoryValue(searchParams.get("subCategory")) || "all";
  const selectedCategory =
    getLookupKey(searchParams.get("category")) ||
    inferCategoryKeyFromSubCategory(selectedSubCategory) ||
    "all";
  const latitude = parseBrowseCoordinate(searchParams.get("lat"));
  const longitude = parseBrowseCoordinate(searchParams.get("lng"));

  return {
    searchQuery: normalizeBrowseValue(searchParams.get("search")),
    selectedCategory,
    selectedSubCategory,
    latitude,
    longitude,
    radiusKm: parseBrowseRadius(searchParams.get("radius")),
    page: parseBrowsePage(searchParams.get("page")),
  };
};

const buildBrowseSearchParams = ({
  searchQuery,
  selectedCategory,
  selectedSubCategory,
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

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
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
  normalizeSubCategoryValue(event.subCategory || event.secondaryCategory);

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

  const updateBrowseState = useCallback((updates, options = {}) => {
    const nextState = {
      searchQuery: updates.searchQuery ?? urlState.searchQuery,
      selectedCategory: updates.selectedCategory ?? urlState.selectedCategory,
      selectedSubCategory: updates.selectedSubCategory ?? urlState.selectedSubCategory,
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
        inferCategoryKeyFromSubCategory(nextState.selectedSubCategory) || "all";
    }

    const nextParams = buildBrowseSearchParams(nextState);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: options.replace ?? false });
    }
  }, [searchParams, setSearchParams, urlState]);

  const {
    allEvents: catalogEvents = [],
    loading: catalogLoading,
    error: catalogError,
  } = usePublicEvents({
    search: urlState.searchQuery || null,
    latitude: urlState.latitude,
    longitude: urlState.longitude,
    radiusKm: urlState.radiusKm,
  });

  const {
    events: visibleEvents = [],
    allEvents: filteredEvents = [],
    loading: eventsLoading,
    error: eventsError,
    pagination,
  } = usePublicEvents({
    search: urlState.searchQuery || null,
    category: urlState.selectedCategory === "all" ? null : urlState.selectedCategory,
    subCategory: urlState.selectedSubCategory === "all" ? null : urlState.selectedSubCategory,
    latitude: urlState.latitude,
    longitude: urlState.longitude,
    radiusKm: urlState.radiusKm,
    page: urlState.page,
    limit: PAGE_SIZE,
  });

  const loading = catalogLoading || eventsLoading;
  const error = eventsError || catalogError;
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
    (Number.isFinite(urlState.latitude) && Number.isFinite(urlState.longitude)) ||
    Boolean(appliedSearchQuery);

  const resultsStart =
    pagination.totalEvents > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const resultsEnd = Math.min(pagination.page * pagination.limit, pagination.totalEvents);

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

  const getEventImage = (event) => {
    return resolveEventBannerImage(event, "https://via.placeholder.com/400x250?text=Event");
  };

  const getEventPriceDisplay = (event) => {
    if (Array.isArray(event.tickets) && event.tickets.length > 0) {
      const prices = event.tickets
        .map((ticket) => Number(ticket.price))
        .filter((price) => !Number.isNaN(price) && price > 0);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return minPrice > 0 ? `Rs.${minPrice.toLocaleString()}` : "Free";
      }
    }

    return typeof event.price === "number" && event.price > 0 ? `Rs.${event.price}` : "Free";
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    updateBrowseState({
      searchQuery: "",
      selectedCategory: "all",
      selectedSubCategory: "all",
      latitude: null,
      longitude: null,
      radiusKm: 50,
      page: 1,
    });
  };

  const EventCard = ({ event }) => (
    <Link
      to={`/events/${event.organizer?.slug || "events"}/${event.slug || event.id}`}
      className="group block"
    >
      <div className="h-full overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.05]">
        <div className="relative h-44 overflow-hidden">
          <img
            src={getEventImage(event)}
            alt={event.title || event.eventTitle || "Event"}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-lg bg-[#D60024] px-2.5 py-1 text-xs font-semibold text-white">
            {getEventPriceDisplay(event)}
          </span>
        </div>
        <div className="space-y-2.5 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-[#D60024]">
            {event.title || event.eventTitle}
          </h3>
          <div className="space-y-1.5 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDate(event.startDate || event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{getEventLocation(event)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {event.subCategory && (
              <Badge className="border-0 bg-white/[0.06] px-2 py-0.5 text-[10px] font-normal text-white/60">
                {event.subCategory}
              </Badge>
            )}
            {event.eventStatus && (
              <Badge className="border-0 bg-[#60a5fa]/10 px-2 py-0.5 text-[10px] font-normal text-[#60a5fa]">
                {event.eventStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen w-full text-white">
      {showPublicHeader && <Header forceMainHeader />}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Discover amazing events happening near you
            </h1>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-xl border-white/[0.08] bg-white/[0.05] pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#D60024]/50 focus:ring-1 focus:ring-[#D60024]/50"
            />
          </div>
        </div>

        <div className="mb-6 max-w-4xl space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-[0.22em] text-white/35">
              Category
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  updateBrowseState({
                    selectedCategory: "all",
                    selectedSubCategory: "all",
                    page: 1,
                  })
                }
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  urlState.selectedCategory === "all"
                    ? "bg-[#D60024] text-white"
                    : "border border-white/[0.06] bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white"
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
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#D60024] text-white"
                        : "border border-white/[0.06] bg-white/[0.05] text-white/60 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {category.label}
                    <span className={`ml-0.5 text-[10px] ${isActive ? "text-white/70" : "text-white/30"}`}>
                      ({category.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeSubcategories.length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    updateBrowseState({
                      selectedSubCategory: "all",
                      page: 1,
                    })
                  }
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                    urlState.selectedSubCategory === "all"
                      ? "bg-white/[0.12] text-white"
                      : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70"
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
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                      urlState.selectedSubCategory === subCategory.value
                        ? "bg-[#D60024] text-white"
                        : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70"
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

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] text-white/30">Filters:</span>
              {urlState.selectedCategory !== "all" && (
                <Badge className="border-0 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/60">
                  {categoryLookup.get(urlState.selectedCategory)?.label || toDisplayLabel(urlState.selectedCategory)}
                </Badge>
              )}
              {urlState.selectedSubCategory !== "all" && (
                <Badge className="border-0 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/60">
                  {urlState.selectedSubCategory}
                </Badge>
              )}
              {Number.isFinite(urlState.latitude) && Number.isFinite(urlState.longitude) && (
                <Badge className="border-0 bg-[#38bdf8]/10 px-2 py-0.5 text-[11px] text-[#7dd3fc]">
                  Nearby
                </Badge>
              )}
              {appliedSearchQuery && (
                <Badge className="border-0 bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/60">
                  "{appliedSearchQuery}"
                </Badge>
              )}
              <button
                type="button"
                onClick={clearAllFilters}
                className="ml-auto flex items-center gap-1 text-[11px] text-white/40 hover:text-white"
              >
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {trendingEvents.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <TrendingUp className="h-5 w-5 text-[#D60024]" />
                Trending Now
              </h2>
              <span className="text-xs text-white/30">{trendingEvents.length} events</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trendingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        <div className="space-y-10">
          {groupedByCategory.map((category) => {
            if (category.events.length === 0) return null;
            const Icon = category.icon;

            return (
              <section key={category.key} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${category.color}18` }}
                    >
                      <Icon className="h-4.5 w-4.5" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{category.label}</h3>
                      <p className="text-xs text-white/30">{category.events.length} events on this page</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {category.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {loading && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div key={index} className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.04]">
                <div className="h-44 rounded-t-xl bg-white/[0.06]" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                  <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
                  <div className="h-3 w-1/3 rounded bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visibleEvents.length === 0 && (
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
            <Search className="mx-auto mb-4 h-12 w-12 text-white/15" />
            <h3 className="mb-1 text-base font-semibold text-white">No events found</h3>
            <p className="mb-5 text-sm text-white/40">
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
          <div className="mt-10 flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-white/45">
              {`Showing ${resultsStart}-${resultsEnd} of ${pagination.totalEvents} events`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateBrowseState({ page: pagination.page - 1 })}
                disabled={pagination.page <= 1}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => updateBrowseState({ page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
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
