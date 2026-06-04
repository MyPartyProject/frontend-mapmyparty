import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  User,
  Ticket,
  Settings,
  LogOut,
  MapPin,
  Search,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";

const HEADER_SEARCH_MIN_LENGTH = 2;
const HEADER_SEARCH_DEBOUNCE_MS = 300;
const HEADER_SEARCH_LIMIT = 6;
const HEADER_RESULT_LIMIT = 3;

const EMPTY_SEARCH_RESULTS = {
  events: [],
  artists: [],
  venues: [],
  totalEvents: 0,
  totalArtists: 0,
  totalVenues: 0,
};

const normalizeSearchPayload = (response) => {
  const data = response?.data ?? response ?? {};
  const events = Array.isArray(data.events) ? data.events : [];
  const artists = Array.isArray(data.artists) ? data.artists : [];
  const venues = Array.isArray(data.venues) ? data.venues : [];

  return {
    events,
    artists,
    venues,
    totalEvents: Number(data.totalEvents) || events.length,
    totalArtists: Number(data.totalArtists) || artists.length,
    totalVenues: Number(data.totalVenues) || venues.length,
  };
};

const getResultTitle = (item, fallback = "Untitled") =>
  item?.title || item?.name || item?.eventTitle || fallback;

const getResultMeta = (item, type) => {
  if (type === "event") {
    return [item?.subCategory || item?.category, item?.organizer?.name]
      .filter(Boolean)
      .join(" | ") || "Event";
  }

  if (type === "artist") {
    return item?.eventTitle ? `Artist | ${item.eventTitle}` : "Artist";
  }

  const location = [item?.city, item?.state].filter(Boolean).join(", ");
  return [location, item?.eventTitle].filter(Boolean).join(" | ") || "Venue";
};

const getLinkedEventPath = (item, fallbackPath) => {
  const organizerSlug =
    item?.organizerSlug ||
    item?.organizer?.slug ||
    item?.organizer?.organizerSlug ||
    item?.organizer?.user?.slug;
  const eventSlug = item?.eventSlug || item?.slug;

  if (organizerSlug && eventSlug) {
    return `/events/${organizerSlug}/${eventSlug}`;
  }

  return fallbackPath;
};

const HeaderSearchSection = ({ title, type, icon: Icon, items, onSelect }) => {
  if (!items.length) return null;

  return (
    <div className="py-2">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1 px-1.5">
        {items.map((item, index) => (
          <button
            key={`${type}-${item.id || item.eventId || item.name || item.title || "result"}-${index}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/55 focus:bg-muted/55 focus:outline-none"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-muted/40 text-muted-foreground">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {getResultTitle(item)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {getResultMeta(item, type)}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const Header = ({
  isAuthenticated: isAuthenticatedProp = undefined,
  userRole: userRoleProp = null,
  onLogout,
  forceMainHeader = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(EMPTY_SEARCH_RESULTS);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [desktopSearchExpanded, setDesktopSearchExpanded] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const desktopSearchRef = useRef(null);
  const desktopSearchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const searchRequestRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated: contextIsAuthenticated,
    role: contextRole,
    logout: contextLogout,
  } = useAuth();

  const resolvedIsAuthenticated = useMemo(() => {
    if (typeof isAuthenticatedProp === "boolean") {
      return isAuthenticatedProp;
    }
    return contextIsAuthenticated;
  }, [isAuthenticatedProp, contextIsAuthenticated]);

  const resolvedUserRole = useMemo(() => {
    if (userRoleProp) {
      return userRoleProp;
    }
    return contextRole || null;
  }, [userRoleProp, contextRole]);

  const normalizedRole =
    typeof resolvedUserRole === "string"
      ? resolvedUserRole.toLowerCase()
      : null;
  const isOrganizer = normalizedRole === "organizer";
  const isPromoter =
    normalizedRole === "promoter" || normalizedRole === "admin";
  const isAttendee = !isOrganizer && !isPromoter;
  const isLocationSupported =
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    "geolocation" in navigator;

  const handleProfileNav = () => {
    navigate("/dashboard/profile");
  };

  const handleBookingsNav = () => {
    navigate("/dashboard/bookings");
  };

  const handleDashboardNav = () => {
    navigate("/dashboard");
  };

  const handleAuthClick = () => {
    const currentPath = `${location.pathname}${location.search}`;
    const authParams = new URLSearchParams();

    if (
      currentPath &&
      currentPath !== "/" &&
      !location.pathname.startsWith("/auth")
    ) {
      authParams.set("redirect", currentPath);
    }

    const isUserFacingRoute =
      location.pathname === "/browse-events" ||
      location.pathname.startsWith("/events/") ||
      location.pathname.startsWith("/dashboard");

    if (isUserFacingRoute) {
      authParams.set("type", "user");
    }

    const query = authParams.toString();
    navigate(query ? `/auth?${query}` : "/auth");
  };

  const handleLogout = () => {
    contextLogout();
    if (onLogout) onLogout();
    navigate("/", { replace: true });
  };

  const buildBrowseEventsUrl = useCallback((updater) => {
    const params = new URLSearchParams(
      location.pathname.includes("browse-events") ? location.search : "",
    );

    updater(params);

    const query = params.toString();
    return `/browse-events${query ? `?${query}` : ""}`;
  }, [location.pathname, location.search]);

  const normalizedSearchQuery = searchQuery.trim();
  const visibleSearchResults = useMemo(() => ({
    events: searchResults.events.slice(0, HEADER_RESULT_LIMIT),
    artists: searchResults.artists.slice(0, HEADER_RESULT_LIMIT),
    venues: searchResults.venues.slice(0, HEADER_RESULT_LIMIT),
  }), [searchResults]);
  const hasVisibleSearchResults =
    visibleSearchResults.events.length > 0 ||
    visibleSearchResults.artists.length > 0 ||
    visibleSearchResults.venues.length > 0;
  const totalSearchResults =
    searchResults.totalEvents + searchResults.totalArtists + searchResults.totalVenues;

  const getBrowseSearchUrl = useCallback((query = searchQuery) =>
    buildBrowseEventsUrl((params) => {
      const normalized = String(query || "").trim();
      if (normalized) {
        params.set("search", normalized);
      } else {
        params.delete("search");
      }
      params.delete("page");
    }), [buildBrowseEventsUrl, searchQuery]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const openDesktopSearch = useCallback(() => {
    setDesktopSearchExpanded(true);
    setMobileMenuOpen(false);

    if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
      setSearchOpen(true);
    }
  }, [normalizedSearchQuery.length]);

  const navigateToBrowseSearch = useCallback((query = searchQuery) => {
    navigate(getBrowseSearchUrl(query));
    setSearchQuery("");
    setDesktopSearchExpanded(false);
    setMobileSearchOpen(false);
    closeSearch();
  }, [closeSearch, getBrowseSearchUrl, navigate, searchQuery]);

  const handleSearchResultSelect = useCallback((item) => {
    navigate(getLinkedEventPath(item, getBrowseSearchUrl(normalizedSearchQuery)));
    setSearchQuery("");
    setDesktopSearchExpanded(false);
    setMobileSearchOpen(false);
    closeSearch();
  }, [closeSearch, getBrowseSearchUrl, navigate, normalizedSearchQuery]);

  useEffect(() => {
    const query = normalizedSearchQuery;

    if (query.length < HEADER_SEARCH_MIN_LENGTH) {
      searchRequestRef.current += 1;
      setSearchResults(EMPTY_SEARCH_RESULTS);
      setSearchLoading(false);
      setSearchError("");
      setSearchOpen(false);
      return undefined;
    }

    const controller = new AbortController();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSearchOpen(true);
    setSearchLoading(true);
    setSearchError("");

    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: query,
          limit: String(HEADER_SEARCH_LIMIT),
        });
        const response = await apiFetch(`/api/event/search?${params.toString()}`, {
          method: "GET",
          signal: controller.signal,
          suppressAuthFailure: true,
        });

        if (requestId !== searchRequestRef.current) return;
        setSearchResults(normalizeSearchPayload(response));
      } catch (error) {
        if (controller.signal.aborted || requestId !== searchRequestRef.current) return;
        console.error("Header search failed", error);
        setSearchResults(EMPTY_SEARCH_RESULTS);
        setSearchError(error?.message || "Search is unavailable right now");
      } finally {
        if (requestId === searchRequestRef.current) {
          setSearchLoading(false);
        }
      }
    }, HEADER_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedSearchQuery]);

  useEffect(() => {
    if (!desktopSearchExpanded) return undefined;

    const frame = window.requestAnimationFrame(() => {
      desktopSearchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [desktopSearchExpanded]);

  useEffect(() => {
    if (!searchOpen && !desktopSearchExpanded && !mobileSearchOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      const clickedDesktop =
        desktopSearchRef.current && desktopSearchRef.current.contains(target);
      const clickedMobile =
        mobileSearchRef.current && mobileSearchRef.current.contains(target);

      if (!clickedDesktop && !clickedMobile) {
        setDesktopSearchExpanded(false);
        setMobileSearchOpen(false);
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeSearch, desktopSearchExpanded, mobileSearchOpen, searchOpen]);

  const handleDetectLocation = async () => {
    if (!isLocationSupported) {
      toast.error("Location is not available in this browser or page context.");
      return;
    }

    setLocationLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          navigate(
            buildBrowseEventsUrl((params) => {
              params.set("nearby", "true");
              params.set("lat", String(latitude));
              params.set("lng", String(longitude));
              params.delete("page");
            }),
          );
          setLocationLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error(
            error?.code === 1
              ? "Location access denied. Please allow location to use Near Me."
              : "Unable to detect your location right now.",
          );
          setLocationLoading(false);
        },
      );
    } catch (error) {
      console.error("Error detecting location:", error);
      toast.error("Unable to detect your location right now.");
      setLocationLoading(false);
    }
  };

  const handleSearchSubmit = useCallback((event) => {
    event.preventDefault();
    if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
      setSearchOpen(true);
    }
  }, [normalizedSearchQuery.length]);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setDesktopSearchExpanded(false);
      setMobileSearchOpen(false);
      closeSearch();
    }
  }, [closeSearch]);

  const mobileMenuItemClass =
    "h-11 w-full justify-start gap-3 rounded-xl px-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted/55 hover:text-foreground active:scale-[0.99]";
  const mobileMenuLinkClass =
    "flex h-11 w-full items-center rounded-xl px-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/55 hover:text-foreground active:scale-[0.99]";
  const mobileIconButtonClass =
    "h-9 w-9 rounded-full border border-border/45 bg-card/60 p-0 text-foreground shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/70 hover:text-foreground active:translate-y-0";
  const mobileSectionClass =
    "rounded-[1rem] border border-border/35 bg-background/35 p-2";
  const mobileSectionLabelClass =
    "px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground";
  const mobileLogoutButtonClass =
    "h-11 w-full justify-start gap-3 rounded-xl border border-border/45 bg-card/65 px-3 text-left text-sm font-medium text-destructive hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive active:scale-[0.99]";
  const navLinkClass =
    "text-[15px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground";
  const actionButtonClass =
    "group relative h-9 w-9 rounded-full border border-border/50 bg-card/55 p-0 text-foreground shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/70 hover:text-foreground focus-visible:ring-ring disabled:hover:translate-y-0";
  const expandingActionButtonClass =
    "group h-9 w-9 justify-start gap-0 overflow-hidden rounded-full border border-border/50 bg-card/55 px-2.5 text-foreground shadow-[var(--shadow-card)] transition-[width,gap,background-color,border-color,color,transform] duration-300 ease-out hover:w-[7.75rem] hover:-translate-y-0.5 hover:gap-1.5 hover:bg-muted/70 hover:text-foreground focus-visible:w-[7.75rem] focus-visible:gap-1.5 focus-visible:ring-ring disabled:hover:w-9 disabled:hover:translate-y-0 disabled:hover:gap-0";
  const expandingActionLabelClass =
    "max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-medium leading-none opacity-0 transition-[max-width,opacity] duration-300 ease-out group-hover:max-w-[5.75rem] group-hover:opacity-100 group-focus-visible:max-w-[5.75rem] group-focus-visible:opacity-100";
  const tooltipClass =
    "pointer-events-none absolute left-1/2 top-[calc(100%+0.55rem)] z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-border/50 bg-card px-2.5 py-1 text-xs font-medium text-foreground opacity-0 shadow-[var(--shadow-card)] transition-all duration-200 group-hover:translate-y-0.5 group-hover:opacity-100 group-focus-visible:translate-y-0.5 group-focus-visible:opacity-100";
  const dropdownContentClass =
    "rounded-xl border border-border/50 bg-card/95 text-foreground shadow-[var(--shadow-card)] backdrop-blur-xl";
  const dropdownItemClass =
    "cursor-pointer hover:bg-muted/55 focus:bg-muted/55";

  const isDashboard =
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/organizer") ||
    location.pathname.startsWith("/promoter");
  const isLandingPage =
    forceMainHeader &&
    (location.pathname === "/" || location.pathname === "/landing/homepage");

  const renderSearchDropdown = (isMobile = false) => {
    if (!searchOpen || normalizedSearchQuery.length < HEADER_SEARCH_MIN_LENGTH) {
      return null;
    }

    return (
      <div
        className={`z-50 overflow-hidden rounded-xl border border-border/50 bg-card/95 text-foreground shadow-[var(--shadow-card)] backdrop-blur-xl ${
          isMobile
            ? "mt-2 w-full"
            : "absolute right-0 top-full mt-2 w-[24rem]"
        }`}
      >
        <div className="border-b border-border/40 px-3 py-2">
          <p className="truncate text-xs text-muted-foreground">
            Search results for <span className="text-foreground">"{normalizedSearchQuery}"</span>
          </p>
        </div>

        <div className="max-h-[26rem] overflow-y-auto py-1">
          {searchLoading ? (
            <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Searching...
            </div>
          ) : searchError ? (
            <div className="px-4 py-5 text-sm text-destructive">
              {searchError}
            </div>
          ) : hasVisibleSearchResults ? (
            <>
              <HeaderSearchSection
                title="Events"
                type="event"
                icon={Ticket}
                items={visibleSearchResults.events}
                onSelect={handleSearchResultSelect}
              />
              <HeaderSearchSection
                title="Artists"
                type="artist"
                icon={User}
                items={visibleSearchResults.artists}
                onSelect={handleSearchResultSelect}
              />
              <HeaderSearchSection
                title="Venues"
                type="venue"
                icon={MapPin}
                items={visibleSearchResults.venues}
                onSelect={handleSearchResultSelect}
              />
            </>
          ) : (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              No matching events, artists, or venues.
            </div>
          )}
        </div>

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => navigateToBrowseSearch(normalizedSearchQuery)}
          className="flex w-full items-center justify-between border-t border-border/40 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground"
        >
          <span>View all results</span>
          <span className="text-xs text-muted-foreground">
            {totalSearchResults > 0 ? `${totalSearchResults} found` : "Browse events"}
          </span>
        </button>
      </div>
    );
  };

  // Don't show header on dashboard/organizer/promoter pages unless forced
  if (resolvedIsAuthenticated && isDashboard && !forceMainHeader) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full ${
        isLandingPage
          ? "-mb-14 bg-gradient-to-b from-background/55 via-background/20 to-transparent backdrop-blur-sm shadow-none"
          : "bg-card/70 shadow-[var(--shadow-card)] backdrop-blur-xl"
      } ${forceMainHeader ? "" : "border-b border-border/45"} relative`}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 lg:px-8">
        {/* Brand + Search */}
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-3">
          <Link
            to="/"
            className="group flex min-w-0 items-center gap-2.5 whitespace-nowrap text-base font-semibold text-foreground"
          >
            <img
              src="/logo.png"
              alt="MapMyParty"
              className="h-8 w-8 object-contain"
            />
            <span className="hidden text-foreground sm:inline">Map MyParty</span>
          </Link>

        </div>

        {/* Desktop Navigation - Show main nav for non-authenticated users or when forced */}
        {(!resolvedIsAuthenticated || forceMainHeader) && (
          <nav className="hidden items-center gap-5 md:flex lg:gap-6">
            <Link
              to="/browse-events"
              className={navLinkClass}
            >
              Browse Events
            </Link>
            <Link
              to="/host-events"
              className={navLinkClass}
            >
              Host Events
            </Link>
            <Link
              to="/about"
              className={navLinkClass}
            >
              About
            </Link>
            <Link
              to="/contact"
              className={navLinkClass}
            >
              Contact
            </Link>
          </nav>
        )}

        {/* Auth Buttons + Location */}
        <div className="hidden flex-1 basis-0 items-center justify-end gap-3 md:flex">
          <form
            ref={desktopSearchRef}
            onSubmit={handleSearchSubmit}
            className={`relative hidden h-9 items-center justify-end rounded-full border border-border/50 bg-card/55 shadow-[var(--shadow-card)] transition-[width,background-color,border-color] duration-300 ease-out md:flex ${
              desktopSearchExpanded ? "w-[19rem] lg:w-[20rem]" : "w-9"
            }`}
          >
            <input
              ref={desktopSearchInputRef}
              type="search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
                  setSearchOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              className={`min-w-0 bg-transparent pl-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground transition-all duration-300 ${
                desktopSearchExpanded
                  ? "w-full opacity-100"
                  : "w-0 opacity-0 pointer-events-none"
              }`}
              tabIndex={desktopSearchExpanded ? 0 : -1}
            />
            <button
              type="button"
              onClick={openDesktopSearch}
              className="group/search flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/70 hover:text-foreground"
              aria-label="Search events"
              aria-expanded={desktopSearchExpanded}
            >
              <Search className="h-4 w-4" />
            </button>
            {renderSearchDropdown(false)}
          </form>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDetectLocation}
            disabled={locationLoading || !isLocationSupported}
            aria-label={
              locationLoading
                ? "Detecting location"
                : !isLocationSupported
                  ? "Location unavailable"
                  : "Near Me"
            }
            className={expandingActionButtonClass}
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            <span aria-hidden="true" className={expandingActionLabelClass}>
              {locationLoading
                ? "Detecting"
                : !isLocationSupported
                  ? "Unavailable"
                  : "Near Me"}
            </span>
          </Button>
          {resolvedIsAuthenticated ? (
            <>
              {isAttendee ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDashboardNav}
                    className={expandingActionButtonClass}
                    aria-label="Dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span aria-hidden="true" className={expandingActionLabelClass}>Dashboard</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={expandingActionButtonClass}
                        aria-label="Profile"
                      >
                        <User className="h-4 w-4" />
                        <span aria-hidden="true" className={expandingActionLabelClass}>Profile</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={`w-52 ${dropdownContentClass}`}
                    >
                      <DropdownMenuItem
                        onClick={handleProfileNav}
                        className={dropdownItemClass}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBookingsNav}
                        className={dropdownItemClass}
                      >
                        <Ticket className="mr-2 h-4 w-4" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className={`${dropdownItemClass} text-destructive focus:text-destructive`}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : isPromoter ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={expandingActionButtonClass}
                      aria-label="Profile"
                    >
                      <User className="h-4 w-4" />
                      <span aria-hidden="true" className={expandingActionLabelClass}>Profile</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={`w-56 ${dropdownContentClass}`}
                  >
                    <DropdownMenuItem
                      onClick={() => navigate("/promoter/profile")}
                      className={dropdownItemClass}
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/promoter/dashboard")}
                      className={dropdownItemClass}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className={`${dropdownItemClass} text-destructive focus:text-destructive`}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/organizer/dashboard-v2")}
                    className={expandingActionButtonClass}
                    aria-label="Dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span aria-hidden="true" className={expandingActionLabelClass}>Dashboard</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className={`${actionButtonClass} text-destructive hover:text-destructive`}
                    aria-label="Logout"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className={tooltipClass}>Logout</span>
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleAuthClick}
                className="h-9 rounded-full border border-border/50 bg-card/45 px-3 text-[13px] text-foreground hover:bg-muted/70 hover:text-foreground"
              >
                Login
              </Button>
              <Button
                variant="default"
                onClick={handleAuthClick}
                className="h-9 rounded-full px-4 text-[13px] shadow-[var(--shadow-card)]"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const nextMobileSearchOpen = !mobileSearchOpen;
              setMobileSearchOpen(nextMobileSearchOpen);
              if (!nextMobileSearchOpen) {
                closeSearch();
              } else if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
                setSearchOpen(true);
              }
              setMobileMenuOpen(false);
            }}
            className={mobileIconButtonClass}
            aria-label="Search events"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDetectLocation}
            disabled={locationLoading || !isLocationSupported}
            className={mobileIconButtonClass}
            aria-label="Near me"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
          <button
            className={`${mobileIconButtonClass} flex items-center justify-center`}
            onClick={() => {
              setMobileMenuOpen((current) => !current);
              setMobileSearchOpen(false);
              closeSearch();
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4 transition-transform duration-200" /> : <Menu className="h-4 w-4 transition-transform duration-200" />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="border-t border-border/45 bg-card/55 px-4 py-3 md:hidden"
        >
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-2"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
                  setSearchOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => {
                if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
                  setSearchOpen(true);
                }
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primaryCTA text-primary-foreground transition hover:bg-primaryCTA-hover"
              aria-label="Show search results"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
          {renderSearchDropdown(true)}
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute inset-x-0 top-full z-50 md:hidden">
          <div className="mx-auto max-w-md px-3 pt-2">
            <nav className="animate-in fade-in slide-in-from-top-2 max-h-[calc(100vh-4.5rem)] overflow-y-auto rounded-[1.25rem] border border-border/45 bg-card/95 p-3 shadow-[var(--shadow-elegant)] backdrop-blur-xl duration-200">
              <div className="flex flex-col gap-3">
                {(!resolvedIsAuthenticated || forceMainHeader || isAttendee) && (
                  <div className={mobileSectionClass}>
                    <div className={mobileSectionLabelClass}>Navigation</div>
                    <div className="space-y-1">
                      <Link
                        to="/browse-events"
                        className={mobileMenuLinkClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Browse Events
                      </Link>
                      <Link
                        to="/host-events"
                        className={mobileMenuLinkClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Host Events
                      </Link>
                      <Link
                        to="/about"
                        className={mobileMenuLinkClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About
                      </Link>
                      <Link
                        to="/contact"
                        className={mobileMenuLinkClass}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Contact
                      </Link>
                    </div>
                  </div>
                )}

                {resolvedIsAuthenticated ? (
                  <>
                    <div className={mobileSectionClass}>
                      <div className={mobileSectionLabelClass}>Account</div>
                      <div className="space-y-1">
                        {isAttendee ? (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                handleProfileNav();
                                setMobileMenuOpen(false);
                              }}
                              className={mobileMenuItemClass}
                            >
                              <User className="h-4 w-4" />
                              Profile
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                handleBookingsNav();
                                setMobileMenuOpen(false);
                              }}
                              className={mobileMenuItemClass}
                            >
                              <Ticket className="h-4 w-4" />
                              My Bookings
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                handleDashboardNav();
                                setMobileMenuOpen(false);
                              }}
                              className={mobileMenuItemClass}
                            >
                              <Settings className="h-4 w-4" />
                              Dashboard
                            </Button>
                          </>
                        ) : isPromoter ? (
                          <>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                navigate("/promoter/profile");
                                setMobileMenuOpen(false);
                              }}
                              className={mobileMenuItemClass}
                            >
                              <User className="h-4 w-4" />
                              My Profile
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                navigate("/promoter/dashboard");
                                setMobileMenuOpen(false);
                              }}
                              className={mobileMenuItemClass}
                            >
                              <Settings className="h-4 w-4" />
                              Dashboard
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              navigate("/organizer/dashboard-v2");
                              setMobileMenuOpen(false);
                            }}
                            className={mobileMenuItemClass}
                          >
                            <Settings className="h-4 w-4" />
                            Dashboard
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="px-1 pb-1 pt-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className={mobileLogoutButtonClass}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className={mobileSectionClass}>
                    <div className={mobileSectionLabelClass}>Account</div>
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          handleAuthClick();
                          setMobileMenuOpen(false);
                        }}
                        className={mobileMenuItemClass}
                      >
                        Login
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => {
                          handleAuthClick();
                          setMobileMenuOpen(false);
                        }}
                        className="h-11 w-full justify-start rounded-xl px-3 text-left text-sm font-medium"
                      >
                        Sign Up
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
