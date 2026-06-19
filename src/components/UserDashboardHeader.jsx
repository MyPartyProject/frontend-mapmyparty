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
import { useAuth } from "@/contexts/AuthContext";

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
  const { logout: contextLogout } = useAuth();

  // Get user info from sessionStorage
  const userInfo = useMemo(() => {
    const name = sessionStorage.getItem("userName") || "User";
    const email = sessionStorage.getItem("userEmail") || "user@example.com";
    return { name, email };
  }, []);

  const handleLogout = () => {
    contextLogout();
    navigate("/", { replace: true });
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
    <header className="w-full border-b border-border/70 bg-background/95 backdrop-blur-xl shadow-[0_18px_55px_-28px_rgba(39,24,52,0.14)]">
      <div className="container flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <img src={logo} alt="MapMyParty" className="h-8 w-auto" />
          <span className="text-foreground">Map MyParty</span>
        </Link>

        {/* Desktop Search and Profile */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl px-4">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search events, tickets, or activities..." 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full border border-border/70 bg-muted/55 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </form>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:bg-muted border border-border/70">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-3 h-10 rounded-full border border-border/70 bg-muted/55 hover:bg-muted text-foreground">
                  <Avatar className="h-8 w-8 bg-primary/10 ring-1 ring-border/70">
                    <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                    <AvatarFallback className="bg-muted text-foreground text-sm font-medium">{getInitials(userInfo.name, userInfo.email)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-flex items-center text-sm font-medium text-foreground">
                    {userInfo.name}
                    <ChevronDown className="ml-1 h-4 w-4 text-muted-foreground" />
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl border border-border/70 bg-card text-foreground shadow-[var(--shadow-card)]">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium text-foreground">{userInfo.name}</p>
                  <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                </div>
                <DropdownMenuContent className="border-t" />
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard/profile")}
                  className="cursor-pointer hover:bg-muted"
                >
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-[#FF5555] focus:text-[#FF5555] hover:bg-muted"
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
          <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:bg-muted border border-border/70">
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
