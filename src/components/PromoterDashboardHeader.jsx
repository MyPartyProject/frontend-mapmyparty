import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Search,
    Bell,
    Home,
    MapPin,
    ChevronDown,
    User as UserIcon,
    Ticket,
    LogOut,
    Loader2,
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
import { toast } from "sonner";
import logoSvg from '@/assets/MMP logo.svg';
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

const PromoterDashboardHeader = ({ isHeaderVisible = true }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const userInfo = useMemo(() => getStoredUserInfo(), []);
    const { logout: contextLogout } = useAuth();

    const handleLogout = () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        contextLogout();
        toast.success("Logged out");
        setIsLoggingOut(false);
        navigate("/", { replace: true });
    };

    const navItems = [
        { name: 'Dashboard', icon: <Home className="h-5 w-5" />, path: '/dashboard' },
        { name: 'Browse Events', icon: <MapPin className="h-5 w-5" />, path: '/dashboard/browse-events' },
    ];

    return (
        <header
            className={`w-full bg-gradient-to-r from-[rgba(10,15,30,0.95)] via-[rgba(20,25,45,0.95)] to-[rgba(15,20,35,0.95)] border-b border-[rgba(255,255,255,0.1)] fixed top-0 left-0 right-0 z-50 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)] transition-all duration-500 ease-in-out ${isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
        >
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Left Side - Logo and Navigation */}
                    <div className="flex items-center gap-6">
                        {/* Logo */}
                        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-white hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg p-1 transition-all duration-300 hover:scale-105 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[rgba(255,255,255,0.1)]">
                                <img src={logoSvg} alt="MMP Logo" className="w-8 h-8 object-contain opacity-90 hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            <span className="hidden text-sm font-semibold tracking-[0.04em] sm:inline">MapMyParty</span>
                        </Link>

                        {/* Navigation Items */}
                        <nav className="hidden md:flex items-center gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${location.pathname === item.path
                                            ? 'bg-gradient-to-r from-[#D60024] to-[#ff4d67] text-white shadow-[0_8px_20px_-8px_rgba(214,0,36,0.5)]'
                                            : 'text-[rgba(255,255,255,0.75)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] border border-transparent hover:border-[rgba(255,255,255,0.1)]'
                                        }`}
                                >
                                    <span className="flex-shrink-0">{item.icon}</span>
                                    <span>{item.name}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Right Side - Search, Notifications, Profile */}
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="hidden lg:flex relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[rgba(255,255,255,0.5)]" />
                            <Input
                                type="search"
                                placeholder="Search events..."
                                className="w-full pl-10 pr-4 py-2 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white placeholder:text-[rgba(255,255,255,0.5)] focus:ring-2 focus:ring-[#D60024] focus:border-[#D60024] rounded-full transition-all duration-300 hover:bg-[rgba(255,255,255,0.12)]"
                            />
                        </div>

                        {/* Notifications */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative text-white hover:bg-[rgba(255,255,255,0.08)] border border-transparent hover:border-[rgba(255,255,255,0.1)] rounded-full transition-all duration-300"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#D60024] animate-pulse"></span>
                        </Button>

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-10 px-2 rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] text-white transition-all duration-300"
                                >
                                    <Avatar className="h-8 w-8 bg-[#000000] ring-2 ring-[rgba(255,255,255,0.2)]">
                                        <AvatarImage src={userInfo.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-[#D60024] to-[#ff4d67] text-white font-bold text-sm">
                                            {getInitials(userInfo.name, userInfo.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden xl:inline-flex items-center text-sm font-medium text-white ml-2">
                                        {userInfo.name || "User"}
                                        <ChevronDown className="ml-1 h-4 w-4 text-[rgba(255,255,255,0.65)]" />
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-64 rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(10,15,30,0.98)] text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                                align="end"
                                forceMount
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex items-center gap-3 rounded-lg bg-[rgba(255,255,255,0.05)] p-3 hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300">
                                        <Avatar className="h-10 w-10 bg-[#000000] ring-2 ring-[rgba(255,255,255,0.2)]">
                                            <AvatarImage src={userInfo.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-[#D60024] to-[#ff4d67] text-white font-bold">
                                                {getInitials(userInfo.name, userInfo.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-sm font-bold leading-none text-white">
                                                {userInfo.name || "Your name"}
                                            </p>
                                            <p className="text-xs leading-none text-[rgba(255,255,255,0.6)]">
                                                {userInfo.email || "Add your email"}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.1)]" />
                                <DropdownMenuItem
                                    onClick={() => navigate("/dashboard/profile")}
                                    className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300"
                                >
                                    <UserIcon className="mr-2 h-4 w-4 text-[#D60024]" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.1)]" />
                                <DropdownMenuItem
                                    onClick={() => navigate("/dashboard/bookings")}
                                    className="cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-all duration-300"
                                >
                                    <Ticket className="mr-2 h-4 w-4 text-[#D60024]" />
                                    My Bookings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.1)]" />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="text-[#FF5555] focus:text-[#FF5555] hover:bg-[rgba(255,0,0,0.1)] transition-all duration-300 cursor-pointer disabled:opacity-60"
                                >
                                    {isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default PromoterDashboardHeader;
