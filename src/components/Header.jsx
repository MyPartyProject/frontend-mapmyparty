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
  ChevronDown,
  User,
  Ticket,
  Settings,
  LogOut,
  MapPin,
  Search,
  Loader2,
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
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">
        {title}
      </p>
      <div className="space-y-1 px-1.5">
        {items.map((item, index) => (
          <button
            key={`${type}-${item.id || item.eventId || item.name || item.title || "result"}-${index}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item)}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.06] focus:bg-white/[0.06] focus:outline-none"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-white/55">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">
                {getResultTitle(item)}
              </span>
              <span className="block truncate text-xs text-white/45">
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
  const [locationLoading, setLocationLoading] = useState(false);
  const desktopSearchRef = useRef(null);
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

  const navigateToBrowseSearch = useCallback((query = searchQuery) => {
    navigate(getBrowseSearchUrl(query));
    setSearchQuery("");
    setMobileSearchOpen(false);
    closeSearch();
  }, [closeSearch, getBrowseSearchUrl, navigate, searchQuery]);

  const handleSearchResultSelect = useCallback((item) => {
    navigate(getLinkedEventPath(item, getBrowseSearchUrl(normalizedSearchQuery)));
    setSearchQuery("");
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
    if (!searchOpen) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;
      const clickedDesktop =
        desktopSearchRef.current && desktopSearchRef.current.contains(target);
      const clickedMobile =
        mobileSearchRef.current && mobileSearchRef.current.contains(target);

      if (!clickedDesktop && !clickedMobile) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [closeSearch, searchOpen]);

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

  const executeSearch = useCallback(() => {
    if (normalizedSearchQuery.length >= HEADER_SEARCH_MIN_LENGTH) {
      navigateToBrowseSearch(normalizedSearchQuery);
    }
  }, [navigateToBrowseSearch, normalizedSearchQuery]);

  const handleSearchSubmit = useCallback((event) => {
    event.preventDefault();
    executeSearch();
  }, [executeSearch]);

  const handleSearchKeyDown = useCallback((event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  }, [closeSearch]);

  const mobileMenuItemClass =
    "w-full justify-start gap-3 rounded-xl px-3 py-3 text-left";
  const mobileMenuLinkClass =
    "block w-full rounded-xl px-3 py-3 text-sm font-medium text-left hover:bg-[rgba(255,255,255,0.06)] hover:text-primary transition-colors";

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
        className={`z-50 overflow-hidden rounded-xl border border-white/[0.08] bg-[#12121a] text-white shadow-2xl ${
          isMobile
            ? "mt-2 w-full"
            : "absolute left-0 top-full mt-2 w-[24rem]"
        }`}
      >
        <div className="border-b border-white/[0.06] px-3 py-2">
          <p className="truncate text-xs text-white/45">
            Search results for <span className="text-white/80">"{normalizedSearchQuery}"</span>
          </p>
        </div>

        <div className="max-h-[26rem] overflow-y-auto py-1">
          {searchLoading ? (
            <div className="flex items-center gap-2 px-4 py-5 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin text-[#D60024]" />
              Searching...
            </div>
          ) : searchError ? (
            <div className="px-4 py-5 text-sm text-red-300">
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
            <div className="px-4 py-5 text-sm text-white/55">
              No matching events, artists, or venues.
            </div>
          )}
        </div>

        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => navigateToBrowseSearch(normalizedSearchQuery)}
          className="flex w-full items-center justify-between border-t border-white/[0.06] px-3 py-2 text-left text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <span>View all results</span>
          <span className="text-xs text-white/35">
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
          ? "-mb-16 bg-gradient-to-b from-background/45 via-background/15 to-transparent backdrop-blur-sm shadow-none"
          : "bg-[rgba(255,255,255,0.08)] backdrop-blur-xl shadow-[0_18px_60px_-24px_rgba(0,0,0,0.65)]"
      } ${forceMainHeader ? "" : "border-b border-[rgba(255,255,255,0.18)]"}`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 gap-4">
        {/* Brand + Search */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-3 font-bold text-xl group text-white whitespace-nowrap min-w-0"
          >
            <img
              src="/logo.png"
              alt="MapMyParty"
              className="h-10 w-10 object-contain"
            />
            <span className="text-white hidden sm:inline">Map MyParty</span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <form
            ref={desktopSearchRef}
            onSubmit={handleSearchSubmit}
            className="relative hidden md:flex items-center gap-2 bg-[rgba(255,255,255,0.08)] rounded-full px-4 py-2 flex-1 max-w-xs"
          >
            <Search className="h-4 w-4 text-[rgba(255,255,255,0.5)]" />
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
              className="bg-transparent outline-none text-sm text-white placeholder:text-[rgba(255,255,255,0.5)] w-full"
            />
            {renderSearchDropdown(false)}
          </form>
        </div>

        {/* Desktop Navigation - Show main nav for non-authenticated users or when forced */}
        {(!resolvedIsAuthenticated || forceMainHeader) && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[rgba(255,255,255,0.65)]">
            <Link
              to="/browse-events"
              className="hover:text-white transition-colors duration-200"
            >
              Browse Events
            </Link>
            <Link
              to="/host-events"
              className="hover:text-white transition-colors duration-200"
            >
              Host Events
            </Link>
            <Link
              to="/about"
              className="hover:text-white transition-colors duration-200"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="hover:text-white transition-colors duration-200"
            >
              Contact
            </Link>
          </nav>
        )}

        {/* Auth Buttons + Location */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleDetectLocation}
            disabled={locationLoading || !isLocationSupported}
            className="text-white border border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.08)] rounded-full px-4 gap-2"
            title={!isLocationSupported ? "Location not available" : "Use your current location"}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden lg:inline">
              {locationLoading
                ? "Detecting..."
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
                    onClick={handleDashboardNav}
                    className="text-white border border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.08)] rounded-full px-4"
                  >
                    Dashboard
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="gap-2 text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white border border-[rgba(255,255,255,0.18)] rounded-full px-4"
                      >
                        <User className="h-4 w-4" />
                        Profile
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl"
                    >
                      <DropdownMenuItem
                        onClick={handleProfileNav}
                        className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)] focus:bg-[rgba(255,255,255,0.08)]"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleBookingsNav}
                        className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)] focus:bg-[rgba(255,255,255,0.08)]"
                      >
                        <Ticket className="mr-2 h-4 w-4" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-[#FF5555] focus:text-[#FF5555] hover:bg-[rgba(255,255,255,0.08)]"
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
                      className="gap-2 text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white border border-[rgba(255,255,255,0.18)] rounded-full px-4"
                    >
                      <User className="h-4 w-4" />
                      Profile
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl"
                  >
                    <DropdownMenuItem
                      onClick={() => navigate("/promoter/profile")}
                      className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)] focus:bg-[rgba(255,255,255,0.08)]"
                    >
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/promoter/dashboard")}
                      className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)] focus:bg-[rgba(255,255,255,0.08)]"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-[#FF5555] focus:text-[#FF5555] hover:bg-[rgba(255,255,255,0.08)]"
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
                    onClick={() => navigate("/organizer/dashboard-v2")}
                    className="text-white border border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.08)] rounded-full px-4"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="bg-[#D60024] text-white hover:opacity-90 rounded-full px-4 border border-transparent"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={handleAuthClick}
                className="text-white hover:text-white border border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.08)] rounded-full px-4"
              >
                Login
              </Button>
              <Button
                variant="default"
                onClick={handleAuthClick}
                className="rounded-full px-5 shadow-[0_12px_35px_-18px_rgba(0,0,0,0.7)]"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-1">
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
            className="h-10 w-10 rounded-full text-white hover:bg-[rgba(255,255,255,0.08)]"
            aria-label="Search events"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDetectLocation}
            disabled={locationLoading || !isLocationSupported}
            className="h-10 w-10 rounded-full text-white hover:bg-[rgba(255,255,255,0.08)]"
            aria-label="Near me"
            title={!isLocationSupported ? "Location not available" : "Use your current location"}
          >
            {locationLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </Button>
          <button
            className="p-2 text-white"
            onClick={() => {
              setMobileMenuOpen((current) => !current);
              setMobileSearchOpen(false);
              closeSearch();
            }}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="md:hidden border-t border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3"
        >
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] px-4 py-2"
          >
            <Search className="h-4 w-4 shrink-0 text-[rgba(255,255,255,0.55)]" />
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
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[rgba(255,255,255,0.55)]"
            />
            <button
              type="submit"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:opacity-90"
              aria-label="Run search"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
          {renderSearchDropdown(true)}
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
            <nav className="container py-4 flex flex-col gap-2">
              {(!resolvedIsAuthenticated || forceMainHeader || isAttendee) && (
                <>
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
              </>
            )}

            {resolvedIsAuthenticated ? (
              <>
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
                      <User className="mr-2 h-4 w-4" />
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
                      <Ticket className="mr-2 h-4 w-4" />
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
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className={`${mobileMenuItemClass} text-[#FF5555] hover:text-[#FF5555]`}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
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
                      <User className="mr-2 h-4 w-4" />
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
                      <Settings className="mr-2 h-4 w-4" />
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
                    Dashboard
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={mobileMenuItemClass}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
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
                  className={mobileMenuItemClass}
                >
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
