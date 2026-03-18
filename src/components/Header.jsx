import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, User, Ticket, Settings, LogOut } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Header = ({ 
  isAuthenticated: isAuthenticatedProp = undefined, 
  userRole: userRoleProp = null, 
  onLogout,
  forceMainHeader = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated: contextIsAuthenticated, role: contextRole, logout: contextLogout } = useAuth();

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

  const normalizedRole = typeof resolvedUserRole === "string" ? resolvedUserRole.toLowerCase() : null;
  const isOrganizer = normalizedRole === "organizer";
  const isPromoter = normalizedRole === "promoter";
  const isAttendee = !isOrganizer && !isPromoter;

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

    if (currentPath && currentPath !== "/" && !location.pathname.startsWith("/auth")) {
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

  const handleLogout = async () => {
    await contextLogout();
    if (onLogout) onLogout();
    navigate("/");
  };

  const isDashboard = location.pathname.startsWith('/dashboard') || 
                     location.pathname.startsWith('/organizer') ||
                     location.pathname.startsWith('/promoter');
  const isLandingPage = forceMainHeader && location.pathname === "/";

  // Don't show header on dashboard/organizer/promoter pages unless forced
  if (resolvedIsAuthenticated && isDashboard && !forceMainHeader) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full ${
        isLandingPage
          ? "-mb-16 bg-gradient-to-b from-slate-950/60 via-slate-950/18 to-transparent backdrop-blur-md shadow-none"
          : "bg-[rgba(255,255,255,0.08)] backdrop-blur-xl shadow-[0_18px_60px_-24px_rgba(0,0,0,0.65)]"
      } ${forceMainHeader ? "" : "border-b border-[rgba(255,255,255,0.18)]"}`}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand */}
        {/* Always show Map MyParty logo that links to home */}
        <Link to="/" className="flex items-center gap-3 font-bold text-xl group text-white">
          <img src="/logo.png" alt="MapMyParty" className="h-10 w-10 object-contain" />
          <span className="text-white">Map MyParty</span>
        </Link>

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

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
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
                      <Button variant="ghost" className="gap-2 text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white border border-[rgba(255,255,255,0.18)] rounded-full px-4">
                        <User className="h-4 w-4" />
                        Profile
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl">
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
                    <Button variant="ghost" className="gap-2 text-white hover:bg-[rgba(255,255,255,0.08)] hover:text-white border border-[rgba(255,255,255,0.18)] rounded-full px-4">
                      <User className="h-4 w-4" />
                      Profile
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl">
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
                  <Button variant="outline" onClick={handleLogout} className="bg-[#D60024] text-white hover:opacity-90 rounded-full px-4 border border-transparent">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleAuthClick} className="text-white hover:text-white border border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.08)] rounded-full px-4">
                Login
              </Button>
              <Button variant="default" onClick={handleAuthClick} className="bg-[#D60024] text-white hover:opacity-90 rounded-full px-5 shadow-[0_12px_35px_-18px_rgba(0,0,0,0.7)]">
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-4">
            {(!resolvedIsAuthenticated || forceMainHeader || isAttendee) && (
              <>
                 <Link
                 to="/browse-events"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Browse Events
                </Link>
                <Link
                  to="/host-events"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Host Events
                </Link>
                <Link
                  to="/about"
                  className="text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-medium hover:text-primary transition-colors"
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
                      className="justify-start"
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
                      className="justify-start"
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
                      className="justify-start"
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
                      className="justify-start text-[#FF5555]"
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
                      className="justify-start"
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
                      className="justify-start"
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
                    className="justify-start"
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
                  className="justify-start"
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
                  className="justify-start"
                >
                  Login
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    handleAuthClick();
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start"
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
