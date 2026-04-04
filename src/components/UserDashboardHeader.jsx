import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, User, Ticket, LogOut, Search, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "@/assets/MMP logo.svg";

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

const UserDashboardHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  // Get user info from sessionStorage
  const userInfo = useMemo(() => {
    const name = sessionStorage.getItem("userName") || "User";
    const email = sessionStorage.getItem("userEmail") || "user@example.com";
    return { name, email };
  }, []);

  const handleLogout = async () => {
    // Call logout API to clear cookies on backend (if available)
    try {
      const { buildUrl } = await import("@/config/api");
      await fetch(buildUrl("auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Continue even if logout API fails
      console.warn("Logout API call failed:", err);
    }
    
    // Clear all session data using centralized function
    const { clearSessionData, resetSessionCache } = await import("@/utils/auth");
    clearSessionData();
    resetSessionCache();
    
    // Redirect to home
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = (searchText || "").trim();
    if (q.length > 0) {
      navigate(`/dashboard/browse-events?search=${encodeURIComponent(q)}`);
    } else {
      navigate("/dashboard/browse-events");
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full border-b border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] backdrop-blur-xl shadow-[0_18px_55px_-24px_rgba(0,0,0,0.65)]">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-white">
          <img src={logo} alt="MapMyParty" className="h-8 w-auto" />
          <span className="text-white">Map MyParty</span>
        </Link>

        {/* Desktop Search and Profile */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl px-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.65)]" />
            <input 
              type="text" 
              placeholder="Search events, tickets, or activities..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-white placeholder:text-[rgba(255,255,255,0.65)] focus:outline-none focus:ring-2 focus:ring-[#D60024] focus:border-transparent"
            />
          </form>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)]">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-3 h-10 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white">
                  <Avatar className="h-8 w-8 bg-[#000000] ring-1 ring-[rgba(255,255,255,0.18)]">
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback className="bg-[rgba(255,255,255,0.08)] text-white text-sm font-medium">{getInitials(userInfo.name, userInfo.email)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-flex items-center text-sm font-medium text-white">
                    {userInfo.name}
                    <ChevronDown className="ml-1 h-4 w-4 text-[rgba(255,255,255,0.65)]" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] text-white shadow-[0_22px_60px_-20px_rgba(0,0,0,0.65)]">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium text-white">{userInfo.name}</p>
                  <p className="text-xs text-[rgba(255,255,255,0.65)]">{userInfo.email}</p>
                </div>
                <DropdownMenuContent className="border-t" />
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/profile")}
                  className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <User className="mr-2 h-4 w-4" />
                  My Profile
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
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" className="rounded-full text-white hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)]">
            <Bell className="h-5 w-5" />
          </Button>
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full px-4 pb-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search events, tickets, or activities..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </form>
        </div>
      )}
    </header>
  );
};

export default UserDashboardHeader;
