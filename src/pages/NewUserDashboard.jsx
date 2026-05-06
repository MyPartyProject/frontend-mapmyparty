import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Search,
  Bell,
  Home,
  MapPin,
  ChevronDown,
  User as UserIcon,
  X,
  Loader2,
  Ticket,
  LogOut,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiFetch } from "@/config/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import logoSvg from '@/assets/MMP logo.svg';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep"
];

const POPULAR_CITIES = [
  { name: "Mumbai", icon: "🏙️", landmark: "Gateway of India" },
  { name: "Delhi", icon: "🏛️", landmark: "India Gate" },
  { name: "Bengaluru", icon: "🌿", landmark: "Cubbon Park" },
  { name: "Hyderabad", icon: "🕌", landmark: "Charminar" },
  { name: "Chandigarh", icon: "🌸", landmark: "Rose Garden" },
  { name: "Ahmedabad", icon: "🧵", landmark: "Sabarmati" },
  { name: "Pune", icon: "🏰", landmark: "Shaniwar Wada" },
  { name: "Chennai", icon: "🌊", landmark: "Marina Beach" },
  { name: "Kolkata", icon: "🎡", landmark: "Howrah" },
  { name: "Kochi", icon: "🌴", landmark: "Backwaters" },
];

const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
};

const getStoredUserInfo = () => {
  let storedProfile = {};
  const profileRaw = sessionStorage.getItem("userProfile");
  try {
    storedProfile = profileRaw ? JSON.parse(profileRaw) : {};
  } catch (error) {
    console.warn("Failed to parse stored profile", error);
  }

  return {
    name: storedProfile.name || sessionStorage.getItem("userName") || "User",
    email: storedProfile.email || sessionStorage.getItem("userEmail") || "user@example.com",
    avatar: storedProfile.avatar || storedProfile.avatarUrl || sessionStorage.getItem("userAvatar") || null,
  };
};

const NewUserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(() => getStoredUserInfo());
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [stateInput, setStateInput] = useState("");
  const [selectedState, setSelectedState] = useState(null);
  const [pendingState, setPendingState] = useState(null);
  const [locationEvents, setLocationEvents] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { user: authUser, logout: contextLogout } = useAuth();

  useEffect(() => {
    if (authUser) {
      const fallback = getStoredUserInfo();
      const updated = {
        name: authUser.name || fallback.name,
        email: authUser.email || fallback.email,
        avatar: authUser.avatar || authUser.avatarUrl || authUser.photo || fallback.avatar,
      };
      setUserInfo(updated);
    }
  }, [authUser]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const filteredStates = useMemo(() => {
    const term = stateInput.trim().toLowerCase();
    if (!term) return INDIAN_STATES;
    return INDIAN_STATES.filter((s) => s.toLowerCase().includes(term));
  }, [stateInput]);

  const extractStateFromEvent = (event = {}) => {
    const candidates = [
      event.state,
      event.location,
      event.venue,
      event.venue?.state,
      event.venues?.[0]?.state,
      event.venues?.[0]?.city,
      event.city,
    ];
    return candidates.find((c) => typeof c === "string" && c.trim().length > 0) || "";
  };

  const isEventInState = (event, state) => {
    if (!state) return false;
    const target = state.toLowerCase();
    const candidate = extractStateFromEvent(event).toLowerCase();
    return candidate.includes(target);
  };

  const fetchEventsByState = async (state) => {
    if (!state) return;
    setLocationLoading(true);
    setLocationError(null);
    try {
      const apiKey = import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY;
      if (apiKey) {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            `${state}, India`
          )}&key=${apiKey}`
        );
        const geoJson = await geoRes.json();
        const loc = geoJson?.results?.[0]?.geometry?.location || null;
        setGeocodeResult(loc);
      } else {
        setGeocodeResult(null);
      }

      const response = await apiFetch("/api/event", {
        method: "GET",
      });
      const eventsData = response.data?.events || response.data || response;
      const list = Array.isArray(eventsData) ? eventsData : [];
      const filtered = list.filter((evt) => isEventInState(evt, state));
      setLocationEvents(filtered);
      setSelectedState(state);
      return filtered;
    } catch (err) {
      console.error("Failed to fetch events for state", err);
      setLocationError(err.message || "Failed to load events for this location");
      setLocationEvents([]);
      return [];
    } finally {
      setLocationLoading(false);
    }
  };

  const handleConfirmState = async () => {
    const state = pendingState || stateInput || selectedState;
    if (!state) return;
    const events = await fetchEventsByState(state);
    setSelectedState(state);
    setLocationPopoverOpen(false);
    const count = events?.length || 0;
    count === 0
      ? toast.info(`No events in ${state} yet.`)
      : toast.success(`${count} event${count === 1 ? "" : "s"} in ${state}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050510]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-[#D60024]"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await contextLogout();
      toast.success("Logged out");
    } catch (err) {
      if (err?.status === 401) {
        console.warn("Logout 401: session already invalid/expired");
        toast("Session expired, logging out");
      } else {
        console.warn("Logout API call failed:", err);
        toast.error(err?.message || "Logout failed, clearing session");
      }
    } finally {
      setIsLoggingOut(false);
      navigate("/");
    }
  };

  const navItems = [
    { name: 'Home', icon: Home, path: '/dashboard' },
    { name: 'Explore', icon: Compass, path: '/dashboard/browse-events' },
    { name: 'Bookings', icon: Ticket, path: '/dashboard/bookings' },
    { name: 'Profile', icon: UserIcon, path: '/dashboard/profile' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050510] text-white">
      {/* ── Desktop Header ── */}
      <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-[#0a0a12]/80 backdrop-blur-lg border-b border-white/[0.06] fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
              <img src={logoSvg} alt="MMP" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-base font-bold tracking-tight">MapMyParty</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#D60024] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              type="search"
              placeholder="Search events..."
              className="w-full pl-9 pr-3 h-9 bg-white/[0.05] border-white/[0.08] text-white text-sm placeholder:text-white/30 rounded-lg focus:ring-1 focus:ring-[#D60024]/50 focus:border-[#D60024]/50"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#D60024]"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 pl-1.5 pr-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06]">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={userInfo.avatar} />
                  <AvatarFallback className="bg-[#D60024] text-white text-[10px] font-bold">
                    {getInitials(userInfo.name, userInfo.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden xl:block text-sm font-medium text-white/80 ml-2 max-w-[120px] truncate">
                  {userInfo.name}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-white/40 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#12121a] border-white/[0.08] text-white rounded-xl shadow-2xl" align="end">
              <DropdownMenuLabel className="font-normal px-3 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userInfo.avatar} />
                    <AvatarFallback className="bg-[#D60024] text-white text-xs font-bold">
                      {getInitials(userInfo.name, userInfo.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{userInfo.name}</p>
                    <p className="text-xs text-white/40 truncate">{userInfo.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/[0.06] px-3 py-2">
                <UserIcon className="mr-2.5 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/bookings")} className="cursor-pointer text-white/70 hover:text-white focus:text-white focus:bg-white/[0.06] px-3 py-2">
                <Ticket className="mr-2.5 h-4 w-4" />
                My Bookings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10 px-3 py-2 disabled:opacity-50"
              >
                {isLoggingOut ? <Loader2 className="mr-2.5 h-4 w-4 animate-spin" /> : <LogOut className="mr-2.5 h-4 w-4" />}
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-[#0a0a12]/90 backdrop-blur-lg border-b border-white/[0.06] fixed top-0 left-0 right-0 z-40">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <img src={logoSvg} alt="MMP" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-sm font-bold">MapMyParty</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06]">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#D60024]"></span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={userInfo.avatar} />
                  <AvatarFallback className="bg-[#D60024] text-white text-[10px] font-bold">
                    {getInitials(userInfo.name, userInfo.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 bg-[#12121a] border-white/[0.08] text-white rounded-xl shadow-2xl" align="end">
              <DropdownMenuLabel className="font-normal px-3 py-2.5">
                <p className="text-sm font-semibold text-white truncate">{userInfo.name}</p>
                <p className="text-xs text-white/40 truncate">{userInfo.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 px-3 py-2 disabled:opacity-50"
              >
                {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 pt-14 lg:pt-16 pb-16 lg:pb-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a12]/95 backdrop-blur-lg border-t border-white/[0.06]">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-lg transition-colors ${
                  active ? 'text-[#D60024]' : 'text-white/40'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-[#D60024]' : ''}`} />
                <span className={`text-[10px] font-medium ${active ? 'text-[#D60024]' : ''}`}>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Location Dialog (kept for location filtering feature) ── */}
      <Dialog open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
        <DialogContent className="max-w-[900px] w-[92vw] md:w-[90vw] bg-[#0e0e18] border border-white/[0.08] text-white rounded-2xl p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-white">Pick your location</p>
              <p className="text-sm text-white/50">Choose a city or state to filter events near you.</p>
            </div>
            {locationLoading && <Loader2 className="h-5 w-5 animate-spin text-[#D60024]" />}
          </div>

          <Input
            value={stateInput}
            onChange={(e) => {
              setStateInput(e.target.value);
              setPendingState(null);
            }}
            placeholder="Search Indian states..."
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/30 focus:ring-1 focus:ring-[#D60024]/50"
          />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Popular cities</p>
            <div className="grid grid-cols-5 gap-2">
              {POPULAR_CITIES.map((city) => {
                const active = (pendingState || selectedState) === city.name;
                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => {
                      setPendingState(city.name);
                      setStateInput(city.name);
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 transition-all text-sm border ${
                      active
                        ? "border-[#D60024] bg-[#D60024]/10 text-white"
                        : "border-white/[0.06] bg-white/[0.03] text-white/70 hover:border-white/[0.15] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="text-lg leading-none">{city.icon}</span>
                    <span className="text-xs font-medium">{city.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">All states</p>
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredStates.map((state) => {
                const active = (pendingState || selectedState) === state;
                return (
                  <button
                    key={state}
                    type="button"
                    onClick={() => {
                      setPendingState(state);
                      setStateInput(state);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 border transition-all text-xs ${
                      active
                        ? "border-[#D60024] bg-[#D60024]/10 text-white"
                        : "border-white/[0.06] bg-white/[0.03] text-white/70 hover:border-white/[0.15]"
                    }`}
                  >
                    <MapPin className="h-3 w-3 text-white/30 flex-shrink-0" />
                    <span className="truncate">{state}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              variant="outline"
              className="border-white/[0.08] text-white/70 hover:bg-white/[0.05]"
              type="button"
              onClick={() => {
                setPendingState(null);
                setStateInput("");
                setSelectedState(null);
                setLocationEvents([]);
                setGeocodeResult(null);
                setLocationError(null);
              }}
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={handleConfirmState}
              disabled={locationLoading || (!pendingState && !stateInput && !selectedState)}
              className="disabled:opacity-50"
            >
              {locationLoading ? "Loading..." : "Confirm location"}
            </Button>
          </div>

          {locationError && (
            <p className="text-xs text-red-400">{locationError}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewUserDashboard;
