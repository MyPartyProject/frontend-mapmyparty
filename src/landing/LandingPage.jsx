import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clapperboard,
  MapPin,
  Music2,
  PartyPopper,
  Search,
  ShieldCheck,
  Ticket,
  Sparkles,
  Trophy,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/config/api";
import eventFallback from "@/assets/event-music.jpg";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";
import { formatEventPriceLabel } from "@/utils/priceFormatter";

const PICK_YOUR_VIBE_SECTION_CONFIG = [
  {
    key: "live-concerts",
    label: "Live Concerts",
    eyebrow: "Music",
    description: "Big-stage nights, headline acts, and live crowd energy.",
    icon: Music2,
    image: "/images/ph2.jpg",
    filters: { category: "Music", subCategory: "Live Concerts" },
  },
  {
    key: "club-nights",
    label: "Club Nights",
    eyebrow: "Nightlife",
    description: "Late-night dance floors, DJs, and bottle-service energy.",
    icon: Sparkles,
    image: "/images/ph1.jpg",
    filters: { category: "Music", subCategory: "Club Nights" },
  },
  {
    key: "music-festivals",
    label: "Music Festivals",
    eyebrow: "Festival",
    description: "Outdoor stages, immersive lineups, and all-day memories.",
    icon: Music2,
    image: "/images/ph3.jpg",
    filters: { category: "Music", subCategory: "Music Festivals" },
  },
  {
    key: "concerts",
    label: "Concerts",
    eyebrow: "Live",
    description: "Arena shows, acoustic nights, and high-energy concert moments.",
    icon: Music2,
    image: "/images/ph1.jpg",
    filters: { category: "Concerts", subCategory: "Live Concerts" },
  },
  {
    key: "sports",
    label: "Sports",
    eyebrow: "Action",
    description: "Matches, tournaments, and crowd-pumping live sports events.",
    icon: Trophy,
    image: "/images/ph2.jpg",
    filters: { category: "Sports", subCategory: "Live Sports" },
  },
  {
    key: "movies",
    label: "Movies",
    eyebrow: "Cinema",
    description: "Screenings, premieres, and film nights with a big-screen feel.",
    icon: Clapperboard,
    image: eventFallback,
    filters: { category: "Movies", subCategory: "Movie Screenings" },
  },
  {
    key: "plays",
    label: "Plays",
    eyebrow: "Stage",
    description: "Drama, theater, and live performance stories on stage.",
    icon: Ticket,
    image: "/images/ph2.jpg",
    filters: { category: "Plays", subCategory: "Plays" },
  },
  {
    key: "activities",
    label: "Activities",
    eyebrow: "Outings",
    description: "Adventures, meetups, and hands-on experiences worth planning for.",
    icon: PartyPopper,
    image: "/images/ph3.jpg",
    filters: { category: "Activities", subCategory: "Activities" },
  },
  {
    key: "comedy-shows",
    label: "Comedy Shows",
    eyebrow: "Laughs",
    description: "Stand-up rooms, improv sets, and intimate comedy nights.",
    icon: Sparkles,
    image: eventFallback,
    filters: { category: "Workshop", subCategory: "Comedy Shows" },
  },
  {
    key: "theater-shows",
    label: "Theater Shows",
    eyebrow: "Workshop",
    description:
      "Stage productions, dramatic nights, and live performance craft.",
    icon: ShieldCheck,
    image: "/images/ph2.jpg",
    filters: { category: "Workshop", subCategory: "Theater Shows" },
  },
];

const EVENT_SECTION_CONFIG = [
  {
    ...PICK_YOUR_VIBE_SECTION_CONFIG[0],
    key: "music",
    label: "Music",
    description:
      "Live concerts, festivals, club nights, and music-led experiences.",
    filters: { category: "Music" },
  },
  {
    ...PICK_YOUR_VIBE_SECTION_CONFIG[3],
    filters: { category: "Concerts" },
  },
  {
    ...PICK_YOUR_VIBE_SECTION_CONFIG[4],
    filters: { category: "Sports" },
  },
  {
    ...PICK_YOUR_VIBE_SECTION_CONFIG[5],
    filters: { category: "Movies" },
  },
  {
    ...PICK_YOUR_VIBE_SECTION_CONFIG[6],
    filters: { category: "Plays" },
  },
  {
    ...PICK_YOUR_VIBE_SECTION_CONFIG[7],
    filters: { category: "Activities" },
  },
];

const PICK_YOUR_VIBE_EXCLUDED_KEYS = new Set([
  "movies",
  "plays",
  "activities",
  "comedy-shows",
  "theater-shows",
]);

const PICK_YOUR_VIBE_CONFIG = PICK_YOUR_VIBE_SECTION_CONFIG.filter(
  (section) => !PICK_YOUR_VIBE_EXCLUDED_KEYS.has(section.key),
);

const steps = [
  {
    title: "Discover",
    desc: "Spot curated events that match your vibe instantly.",
    icon: Sparkles,
  },
  {
    title: "Book",
    desc: "Secure seats with one-tap checkout and instant tickets.",
    icon: ShieldCheck,
  },
  {
    title: "Enjoy",
    desc: "Get reminders, live updates, and seamless entry.",
    icon: Clock3,
  },
];

const heroSlides = [
  { id: "party-video", type: "video", src: "/videos/party2.mp4" },
  { id: "party-image-1", type: "image", src: "/images/ph1.jpg" },
  { id: "party-image-2", type: "image", src: "/images/ph2.jpg" },
  { id: "party-image-3", type: "image", src: "/images/ph3.jpg" },
];

const heroCarouselStyles = `
  @keyframes heroImageDrift {
    0% {
      transform: scale(1.035) translate3d(0, 0, 0);
    }
    50% {
      transform: scale(1.075) translate3d(0, -1.2%, 0);
    }
    100% {
      transform: scale(1.105) translate3d(0, -2.4%, 0);
    }
  }

  @keyframes landingReveal {
    0% {
      opacity: 0;
      transform: translate3d(0, 18px, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes landingGlowPulse {
    0%, 100% {
      opacity: 0.42;
      transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
      opacity: 0.72;
      transform: translate3d(0, -10px, 0) scale(1.06);
    }
  }

  @keyframes landingLineFlow {
    0% {
      transform: translateX(-60%);
      opacity: 0;
    }
    25%, 75% {
      opacity: 0.8;
    }
    100% {
      transform: translateX(60%);
      opacity: 0;
    }
  }

  @keyframes landingHeroHaze {
    0%, 100% {
      transform: translate3d(0, 0, 0) scale(1);
      opacity: 0.42;
    }
    50% {
      transform: translate3d(-14px, -10px, 0) scale(1.05);
      opacity: 0.68;
    }
  }

  @keyframes landingHeroParticleFloat {
    0%, 100% {
      opacity: 0.16;
      transform: translate3d(0, 0, 0) scale(0.95);
    }
    50% {
      opacity: 0.48;
      transform: translate3d(10px, -16px, 0) scale(1.05);
    }
  }

  .landing-reveal {
    animation: landingReveal 720ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--landing-delay, 0ms);
  }

  .landing-glow {
    animation: landingGlowPulse 7s ease-in-out infinite;
  }

  .landing-flow-line > span {
    animation: landingLineFlow 4.8s ease-in-out infinite;
  }

  .landing-hero-haze {
    animation: landingHeroHaze 9s ease-in-out infinite;
  }

  .landing-hero-particle {
    animation: landingHeroParticleFloat 7.5s ease-in-out infinite;
    animation-delay: var(--landing-delay, 0ms);
  }

  .landing-event-card {
    transform-style: preserve-3d;
  }

  .landing-event-card__image {
    transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1), filter 700ms ease;
  }

  .landing-event-card:hover .landing-event-card__image {
    transform: scale(1.08);
    filter: saturate(1.12) contrast(1.05);
  }

  @media (prefers-reduced-motion: reduce) {
    .landing-reveal,
    .landing-glow,
    .landing-flow-line > span,
    .landing-hero-haze,
    .landing-hero-particle {
      animation: none;
    }

    .landing-event-card__image {
      transition: none;
    }
  }
`;

const SearchResultsSkeleton = () => (
  <div className="space-y-5">
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-7 w-24 rounded-full bg-muted/50" />
      <Skeleton className="h-7 w-24 rounded-full bg-muted/50" />
      <Skeleton className="h-7 w-24 rounded-full bg-muted/50" />
    </div>

    <div className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20 bg-muted/50" />
        <Skeleton className="h-7 w-40 bg-muted/50" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </div>
  </div>
);

const EventCardSkeleton = () => (
  <div
    className="relative min-h-[11.25rem] overflow-hidden rounded-lg border border-border/40 bg-card/70 shadow-[var(--shadow-card)]"
  >
    <Skeleton className="absolute inset-0 h-full w-full bg-muted/50" />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
    <div className="relative flex min-h-[11.25rem] flex-col justify-between p-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-6 w-20 rounded-full bg-muted/60" />
        <Skeleton className="h-6 w-16 rounded-full bg-muted/60" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-5 w-4/5 bg-muted/60" />
        <Skeleton className="h-3.5 w-2/3 bg-muted/60" />
        <Skeleton className="h-7 w-24 rounded-full bg-muted/60" />
      </div>
    </div>
  </div>
);

const EmptyState = ({ children }) => (
  <div className="relative flex min-h-[11.25rem] overflow-hidden rounded-lg border border-border/40 bg-card/70 px-3.5 py-3 text-xs text-muted-foreground shadow-[var(--shadow-card)]">
    <div className="theme-gradient-primary absolute inset-0 opacity-10" />
    <div className="relative mt-auto flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/50 text-accent shadow-[var(--shadow-card)]">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <p className="leading-5">{children}</p>
    </div>
  </div>
);

const formatDate = (value) => {
  if (!value) return "Date TBA";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBA";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getEventLocation = (event) => {
  const venue = event.venue;

  if (venue && typeof venue === "object") {
    const parts = [
      venue.name,
      venue.city || venue.address?.city,
      venue.state || venue.address?.state,
      venue.country || venue.address?.country,
    ].filter(Boolean);

    if (parts.length) return parts.join(", ");
  }

  if (typeof venue === "string" && venue.trim()) return venue;

  const parts = [
    event.venueName,
    event.city,
    event.state,
    event.country,
  ].filter(Boolean);
  if (parts.length) return parts.join(", ");

  return event.location || "Location TBA";
};

const getPriceLabel = (price) => {
  if (!Number.isFinite(price)) return null;
  return formatEventPriceLabel(price, { prefix: "From" });
};

const getEventPriceDisplay = (event) => {
  if (Array.isArray(event.tickets) && event.tickets.length > 0) {
    const prices = event.tickets
      .map((ticket) => Number(ticket.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length > 0) return getPriceLabel(Math.min(...prices));
  }

  const explicitPrice = Number(event.minPrice ?? event.price);
  return getPriceLabel(explicitPrice);
};

const getEventHref = (event) => {
  const organizerSlug =
    event.organizerSlug ||
    event.organizer?.slug ||
    event.organizer?.organizerSlug ||
    event.organizer?.user?.slug;
  const eventSlug = event.eventSlug || event.slug;

  if (organizerSlug && eventSlug)
    return `/events/${organizerSlug}/${eventSlug}`;
  return "/browse-events";
};

const mapEventToCard = (event) => {
  return {
    id: event.id || event._id || event.slug || event.title,
    href: getEventHref(event),
    title: event.title || "Untitled Event",
    date: formatDate(event.startDate || event.date),
    location: getEventLocation(event),
    image: resolveEventBannerImage(event),
    category: event.subCategory || event.category || "Event",
    price: getEventPriceDisplay(event),
  };
};

const buildBrowseEventsPath = ({ category, subCategory, search } = {}) => {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (subCategory) params.set("subCategory", subCategory);
  if (search) params.set("search", search);

  return `/browse-events${params.toString() ? `?${params.toString()}` : ""}`;
};

const getRightAlignedGridOffsetClass = (count) => {
  if (count <= 1)
    return "sm:[&>*:first-child]:col-start-2 lg:[&>*:first-child]:col-start-3 2xl:[&>*:first-child]:col-start-4";
  if (count === 2)
    return "lg:[&>*:first-child]:col-start-2 2xl:[&>*:first-child]:col-start-3";
  if (count === 3) return "2xl:[&>*:first-child]:col-start-2";
  return "";
};

const getCategoryEventGridClass = (count, alignRight = false) => {
  const baseClass = "grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4";
  if (!alignRight) return baseClass;
  return `${baseClass} ${getRightAlignedGridOffsetClass(count)}`;
};

const LandingEventCard = ({
  href,
  title,
  date,
  location,
  image,
  category,
  price,
}) => {
  const [imageSrc, setImageSrc] = useState(image || eventFallback);

  const handleImageError = () => {
    if (imageSrc !== eventFallback) setImageSrc(eventFallback);
  };

  const opensEventDetail = typeof href === "string" && href.startsWith("/events/");

  return (
    <Link
      to={href || "/browse-events"}
      target={opensEventDetail ? "_blank" : undefined}
      rel={opensEventDetail ? "noopener noreferrer" : undefined}
      className="group block h-full"
    >
      <article className="landing-event-card relative h-full min-h-[11.25rem] overflow-hidden rounded-lg border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1 hover:border-border hover:shadow-[var(--shadow-elegant)]">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={imageSrc}
            alt={title}
            className="landing-event-card__image h-full w-full object-cover"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-background/5" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/55 to-transparent" />
          <div className="theme-gradient-primary absolute inset-0 opacity-10 transition-opacity duration-500 group-hover:opacity-20" />
        </div>

        <div className="relative flex h-full min-h-[11.25rem] flex-col justify-between p-3 sm:min-h-[inherit]">
          <div className="flex items-start justify-between gap-2">
            {category && (
              <div className="max-w-[62%] truncate rounded-full border border-border/40 bg-card/85 px-2.5 py-1 text-[0.68rem] font-medium leading-none text-foreground shadow-[var(--shadow-card)] backdrop-blur-md">
                {category}
              </div>
            )}
            {price && (
              <div className="inline-flex min-w-[4.75rem] shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[0.68rem] font-bold leading-none tabular-nums text-accent shadow-[var(--shadow-card)] backdrop-blur-md">
                {price}
              </div>
            )}
          </div>

          <div className="mt-auto">
            <h3 className="line-clamp-2 text-sm font-black leading-tight text-foreground drop-shadow-xl transition-colors group-hover:text-accent sm:text-base">
              {title}
            </h3>
            <div className="mt-2 grid gap-1 text-[0.7rem] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarRange className="h-3 w-3 shrink-0 text-accent" />
                <span className="line-clamp-1">{date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0 text-accent" />
                <span className="line-clamp-1">{location}</span>
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
};

const LandingDiscoverySection = ({
  section,
  events,
  sectionsLoading,
  emptyMessage,
  isReversed = false,
  className = "relative bg-background py-3 sm:py-4",
  headerDelay = "0ms",
}) => {
  const itemCount = sectionsLoading ? 3 : Math.max(events.length, 1);

  return (
    <section className={className}>
      <div className="container relative px-4 sm:px-6 lg:px-8">
        <div className="relative border-t border-border/20 pt-3">
          <div
            className={`theme-gradient-primary pointer-events-none absolute top-0 h-36 w-36 rounded-full opacity-10 blur-3xl ${isReversed ? "left-0" : "right-0"}`}
          />
          <div
            className={`landing-reveal relative flex flex-col gap-3 sm:items-end sm:justify-between ${isReversed ? "sm:flex-row-reverse" : "sm:flex-row"}`}
            style={{ "--landing-delay": headerDelay }}
          >
            <div
              className={`min-w-0 sm:max-w-2xl ${isReversed ? "sm:text-right" : ""}`}
            >
              <h2 className="text-3xl font-black leading-tight text-foreground sm:text-[2.15rem]">
                {section.label}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                {section.description}
              </p>
            </div>
            <Link
              to={buildBrowseEventsPath(section.filters)}
              className="shrink-0"
            >
              <Button variant="accent" className="h-10 rounded-full px-4">
                Browse all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div
            className={`landing-reveal relative mt-3.5 ${getCategoryEventGridClass(itemCount, isReversed)}`}
            style={{ "--landing-delay": "120ms" }}
          >
            {sectionsLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <EventCardSkeleton key={`${section.key}-skeleton-${index}`} />
              ))
            ) : events.length > 0 ? (
              events.map((event) => (
                <LandingEventCard key={event.id} {...event} />
              ))
            ) : (
              <EmptyState>{emptyMessage}</EmptyState>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const heroVideoRef = useRef(null);
  const [eventSections, setEventSections] = useState({});
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    events: [],
    artists: [],
    venues: [],
    totalEvents: 0,
    totalArtists: 0,
    totalVenues: 0,
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    heroSlides
      .filter((slide) => slide.type === "image")
      .forEach((slide) => {
        const image = new Image();
        image.src = slide.src;
      });
  }, []);

  const runSearch = async ({ query }) => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setSearchResults({
        events: [],
        artists: [],
        venues: [],
        totalEvents: 0,
        totalArtists: 0,
        totalVenues: 0,
      });
      setSearchError("");
      setHasSearchResults(false);
      setSearchLoading(false);
      return;
    }

    if (normalizedQuery.length < 2) {
      searchRequestRef.current += 1;
      setSearchResults({
        events: [],
        artists: [],
        venues: [],
        totalEvents: 0,
        totalArtists: 0,
        totalVenues: 0,
      });
      setSearchError("");
      setHasSearchResults(false);
      setSearchLoading(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    setSearchLoading(true);
    setSearchError("");

    try {
      const params = new URLSearchParams();
      params.set("q", normalizedQuery);
      params.set("limit", "6");

      const response = await apiFetch(
        `/api/event/search?${params.toString()}`,
        {
          method: "GET",
        },
      );

      if (requestId !== searchRequestRef.current) return;

      const data = response?.data || {};
      setSearchResults({
        events: Array.isArray(data.events)
          ? data.events.map((event) => mapEventToCard(event))
          : [],
        artists: Array.isArray(data.artists) ? data.artists : [],
        venues: Array.isArray(data.venues) ? data.venues : [],
        totalEvents: data.totalEvents || 0,
        totalArtists: data.totalArtists || 0,
        totalVenues: data.totalVenues || 0,
      });
      setHasSearchResults(true);
    } catch (error) {
      if (requestId !== searchRequestRef.current) return;
      setSearchResults({
        events: [],
        artists: [],
        venues: [],
        totalEvents: 0,
        totalArtists: 0,
        totalVenues: 0,
      });
      setSearchError(error.message || "Failed to search events");
      setHasSearchResults(true);
    } finally {
      if (requestId === searchRequestRef.current) {
        setSearchLoading(false);
      }
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      runSearch({ query: searchQuery });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const activeSlide = heroSlides[activeHeroSlide];

    if (activeSlide.type === "video") {
      const video = heroVideoRef.current;

      if (!video) return undefined;

      video.currentTime = 0;
      const playAttempt = video.play();
      if (playAttempt?.catch) playAttempt.catch(() => {});
      return undefined;
    }

    if (heroVideoRef.current) {
      heroVideoRef.current.pause();
    }

    const timeoutId = window.setTimeout(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [activeHeroSlide]);

  useEffect(() => {
    let isMounted = true;

    const fetchSectionEvents = async () => {
      if (isMounted) {
        setSectionsLoading(true);
      }

      try {
        const results = await Promise.all(
          EVENT_SECTION_CONFIG.map(async (section) => {
            const params = new URLSearchParams();
            if (section.filters.category)
              params.set("category", section.filters.category);
            if (section.filters.subCategory)
              params.set("subCategory", section.filters.subCategory);
            params.set("limit", "3");

            const response = await apiFetch(
              `/api/event${params.toString() ? `?${params.toString()}` : ""}`,
              {
                method: "GET",
              },
            );

            const events = Array.isArray(response?.data?.events)
              ? response.data.events
              : Array.isArray(response?.data)
                ? response.data
                : [];

            return [section.key, events.map((event) => mapEventToCard(event))];
          }),
        );

        if (isMounted) {
          setEventSections(Object.fromEntries(results));
        }
      } catch (error) {
        if (isMounted) setEventSections({});
      } finally {
        if (isMounted) setSectionsLoading(false);
      }
    };

    fetchSectionEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleHeroVideoEnded = () => {
    setActiveHeroSlide(1);
  };

  const goToPreviousHeroSlide = () => {
    setActiveHeroSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  const goToNextHeroSlide = () => {
    setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handleSearchSubmit = () => {
    runSearch({ query: searchQuery });
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  const clearSearch = () => {
    searchRequestRef.current += 1;
    setSearchQuery("");
    setSearchError("");
    setHasSearchResults(false);
    setSearchLoading(false);
    setSearchResults({
      events: [],
      artists: [],
      venues: [],
      totalEvents: 0,
      totalArtists: 0,
      totalVenues: 0,
    });
  };

  const featuredVibe = EVENT_SECTION_CONFIG[0];
  const featuredVibeEvents = eventSections[featuredVibe.key] || [];
  const otherSections = EVENT_SECTION_CONFIG.filter(
    (section) => section.key !== featuredVibe.key,
  );

  return (
    <div className="landing-homepage min-h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <style>{heroCarouselStyles}</style>
      <Header forceMainHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-background pb-4 pt-16 sm:pb-6 sm:pt-20">
          <div className="absolute inset-0 overflow-hidden">
            {heroSlides.map((slide, index) => {
              const isActive = index === activeHeroSlide;

              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-out ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
                >
                  {slide.type === "video" ? (
                    <video
                      ref={index === 0 ? heroVideoRef : null}
                      className="h-full w-full scale-[1.04] object-cover"
                      src={slide.src}
                      muted
                      playsInline
                      preload="auto"
                      onEnded={handleHeroVideoEnded}
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-cover bg-center will-change-transform"
                      style={{
                        backgroundImage: `url(${slide.src})`,
                        animation: isActive
                          ? "heroImageDrift 4200ms ease-out forwards"
                          : "none",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/92 via-background/58 to-background/20 lg:from-background/88 lg:via-background/46 lg:to-background/12" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/68 via-background/8 to-background" />
          <div className="theme-gradient-primary pointer-events-none absolute inset-0 opacity-20" />
          <div className="theme-gradient-primary pointer-events-none absolute inset-x-0 top-0 h-96 opacity-10 blur-3xl" />
          <div className="landing-hero-haze pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
          <div className="landing-hero-haze pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-primaryCTA/20 blur-3xl [animation-delay:1.2s]" />
          <div className="landing-glow pointer-events-none absolute -left-16 top-16 h-56 w-56 rounded-full bg-card/70 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="landing-hero-particle pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-accent/45 shadow-[var(--shadow-card)]"
              style={{
                left: `${44 + (index % 5) * 10}%`,
                top: `${20 + Math.floor(index / 5) * 28 + (index % 2) * 6}%`,
                "--landing-delay": `${index * 320}ms`,
              }}
            />
          ))}

          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 sm:right-6 lg:right-10">
            <button
              type="button"
              aria-label="Previous hero slide"
              onClick={goToPreviousHeroSlide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/45 text-foreground/75 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-accent hover:text-accent-foreground sm:h-11 sm:w-11"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next hero slide"
              onClick={goToNextHeroSlide}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/40 bg-card/45 text-foreground/75 shadow-[var(--shadow-card)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-accent hover:text-accent-foreground sm:h-11 sm:w-11"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="grid min-h-[22.5rem] items-center pb-16 pt-4 sm:min-h-[24rem] sm:pt-5 lg:min-h-[25.5rem] lg:grid-cols-[0.42fr_0.58fr] lg:pb-8">
              <div className="landing-reveal max-w-[30rem]">
                <h1 className="mt-4 max-w-[26rem] text-left text-2xl font-black leading-[1.02] tracking-tight text-foreground drop-shadow-2xl text-pretty sm:max-w-[28rem] sm:text-3xl md:text-[3.1rem] lg:text-[2.55rem] xl:text-[2.85rem]">
                  Find your{" "}
                  <span className="theme-gradient-primary bg-clip-text text-transparent">
                    vibe.
                  </span>
                </h1>
                <p className="mt-4 max-w-[28rem] text-sm leading-6 text-foreground/80 drop-shadow-xl sm:text-base sm:leading-7">
                  Create events, sell tickets, and thrill your guests. Or jump
                  in as an attendee and enjoy the city's best experiences.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link to="/auth">
                    <Button
                      size="lg"
                      variant="accent"
                      className="h-12 w-full rounded-full px-7 text-base shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 sm:w-auto"
                    >
                      Host an Event
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div
                className="pointer-events-none hidden lg:block"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="relative overflow-hidden bg-background py-8 sm:py-10">
          <div className="theme-gradient-primary absolute -left-24 top-12 h-72 w-72 rounded-full opacity-10 blur-3xl" />
          <div className="container relative px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <div className="landing-reveal flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-accent">
                    Discover
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
                    Pick your vibe
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                    Switch between real event moods and jump straight into a
                    filtered browse page when one feels right.
                  </p>
                </div>
                <Link to="/browse-events">
                  <Button
                    variant="outline"
                    className="rounded-full border-border/60 bg-background/60 text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    View all events
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {PICK_YOUR_VIBE_CONFIG.map((section, index) => {
                  const Icon = section.icon;

                  return (
                    <Link
                      key={section.key}
                      to={buildBrowseEventsPath(section.filters)}
                      className="group landing-reveal block h-full text-left"
                      style={{ "--landing-delay": `${index * 70}ms` }}
                    >
                      <div className="relative flex h-full min-h-[16.75rem] flex-col overflow-hidden rounded-[1.5rem] border border-border/50 bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-2 hover:border-border hover:shadow-[var(--shadow-elegant)]">
                        <div className="relative flex-1 overflow-hidden">
                          <img
                            src={section.image}
                            alt=""
                            aria-hidden="true"
                            className="h-full min-h-[10.25rem] w-full object-cover opacity-75 transition duration-700 group-hover:scale-110 group-hover:opacity-95"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
                          <div className="theme-gradient-primary absolute inset-0 opacity-10" />
                          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-border/40 bg-card/75 px-3 py-1.5 text-xs font-medium text-foreground shadow-[var(--shadow-card)] backdrop-blur-md">
                            <Icon className="h-3.5 w-3.5 text-accent" />
                            {section.eyebrow}
                          </div>
                        </div>
                        <div className="relative p-4">
                          <h3 className="text-xl font-black text-foreground">
                            {section.label}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {section.description}
                          </p>
                          <div className="mt-4 flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                            <span>Explore this vibe</span>
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 transition group-hover:bg-primaryCTA group-hover:text-primary-foreground">
                              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        <LandingDiscoverySection
          section={featuredVibe}
          events={featuredVibeEvents}
          sectionsLoading={sectionsLoading}
          emptyMessage={
            "No live events are available in this vibe yet. Try another vibe or browse the full catalog."
          }
        />

        {otherSections.map((section, index) => (
          <LandingDiscoverySection
            key={section.key}
            section={section}
            events={eventSections[section.key] || []}
            sectionsLoading={sectionsLoading}
            emptyMessage={"No live events are available in this section yet."}
            isReversed={(index + 1) % 2 === 1}
          />
        ))}

        {/* How it works */}
        <section className="relative bg-background py-10 sm:py-12">
          <div className="container relative px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/60 p-5 shadow-[var(--shadow-elegant)] backdrop-blur-xl sm:p-8">
              <div className="theme-gradient-primary absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full opacity-10 blur-3xl" />
              <div className="landing-reveal relative mx-auto mb-12 max-w-3xl text-center">
                <p className="text-sm uppercase tracking-[0.18em] text-accent">
                  Seamless
                </p>
                <h2 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">
                  How Map MyParty works
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                  From discovery to entry, we keep every step delightful with
                  live updates and secure check-ins.
                </p>
              </div>

              <div className="relative grid gap-5 md:grid-cols-3">
                <div className="landing-flow-line pointer-events-none absolute left-[16%] right-[16%] top-11 hidden h-px overflow-hidden bg-border/50 md:block">
                  <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                </div>
                {steps.map(({ title, desc, icon: Icon }, index) => (
                  <div
                    key={title}
                    className="landing-reveal relative overflow-hidden rounded-[1.5rem] border border-border/50 bg-card/70 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-border hover:shadow-[var(--shadow-elegant)]"
                    style={{ "--landing-delay": `${index * 100}ms` }}
                  >
                    <div className="theme-gradient-primary absolute inset-0 opacity-10" />
                    <div className="relative flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border/40 bg-accent/10 text-accent shadow-[var(--shadow-card)]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="relative mt-6 text-2xl font-black text-foreground">
                      {title}
                    </h3>
                    <p className="relative mt-3 text-sm leading-7 text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform trust */}
        <section className="relative bg-background py-10 sm:py-12">
          <div className="container relative px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/60 p-5 shadow-[var(--shadow-elegant)] backdrop-blur-xl sm:p-8">
              <div className="theme-gradient-primary absolute right-0 top-8 h-80 w-80 rounded-full opacity-10 blur-3xl" />
              <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div className="landing-reveal space-y-5">
                  <p className="text-sm uppercase tracking-[0.18em] text-accent">
                    Platform
                  </p>
                  <h2 className="text-3xl font-black text-foreground sm:text-4xl">
                    Built for real event discovery
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                    Map MyParty keeps the public experience focused on
                    discovery, booking, and clear event details without relying
                    on inflated claims or placeholder activity.
                  </p>
                  <div className="flex flex-wrap gap-3 text-foreground">
                    <div className="flex items-center gap-2 rounded-full border border-border/40 bg-card/70 px-4 py-2 text-sm shadow-[var(--shadow-card)] backdrop-blur">
                      <Search className="h-4 w-4 text-accent" />
                      Event, artist, and venue search
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border/40 bg-card/70 px-4 py-2 text-sm shadow-[var(--shadow-card)] backdrop-blur">
                      <ShieldCheck className="h-4 w-4 text-accent" />
                      Secure booking flow
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border/40 bg-card/70 px-4 py-2 text-sm shadow-[var(--shadow-card)] backdrop-blur">
                      <Clock3 className="h-4 w-4 text-accent" />
                      Event updates and entry tools
                    </div>
                  </div>
                </div>

                <div
                  className="landing-reveal relative"
                  style={{ "--landing-delay": "120ms" }}
                >
                  <div className="theme-gradient-primary absolute -inset-6 rounded-[2.5rem] opacity-10 blur-2xl" />
                  <div className="relative rounded-[2rem] border border-border/50 bg-card/75 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-7">
                    <div className="grid gap-4">
                      <div className="rounded-2xl border border-border/40 bg-background/45 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/40 bg-accent/10 text-accent">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Discover
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Browse event categories and search by event,
                              artist, venue, organizer, or city.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/40 bg-background/45 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/40 bg-accent/10 text-accent">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Book
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Move from event detail to checkout through the
                              platform booking flow.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/40 bg-background/45 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/40 bg-accent/10 text-accent">
                            <Clock3 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Attend
                            </p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              Keep tickets and event access organized inside the
                              attendee experience.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative bg-background py-10 sm:py-12">
          <div className="container relative px-4 text-center sm:px-6 lg:px-8">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-border/50 bg-card/75 p-7 shadow-[var(--shadow-elegant)] backdrop-blur-xl sm:p-10">
              <div className="landing-glow pointer-events-none absolute left-1/2 top-8 h-52 w-52 -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl" />
              <div className="relative space-y-6">
                <h2 className="text-3xl font-black text-foreground md:text-5xl">
                  Find your{" "}
                  <span className="theme-gradient-primary bg-clip-text text-transparent">
                    vibe.
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Create events, sell tickets, and thrill your guests. Or jump
                  in as an attendee and enjoy the city's best experiences.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link to="/auth">
                    <Button
                      size="lg"
                      variant="accent"
                      className="h-12 w-full rounded-full px-8 text-base sm:w-auto"
                    >
                      Host an Event
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
