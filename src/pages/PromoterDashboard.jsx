import { useMemo, useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildUrl } from "@/config/api";
import Logo from "@/assets/MMP logo.svg";
import { usePromoterDashboard } from "@/hooks/usePromoterDashboard";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Activity,
  Wallet2,
  Ticket,
  BarChart3,
  Building2,
  ShieldCheck,
  Bell,
  Search,
  ChevronLeft,
  Menu,
  User,
  LogOut,
  ChevronDown,
  FileText,
  CreditCard,
  X,
} from "lucide-react";

const navItems = [
  { label: "Overview", to: "/promoter/overview", icon: LayoutDashboard },
  { label: "Organizers", to: "/promoter/organizers", icon: Building2 },
  { label: "Events", to: "/promoter/events", icon: CalendarClock },
  { label: "Users", to: "/promoter/users", icon: Users },
  { label: "Bookings", to: "/promoter/bookings", icon: Ticket },
  { label: "Payouts", to: "/promoter/payouts", icon: Wallet2 },
  // { label: "Live", to: "/promoter/live", icon: Activity },
  { label: "Analytics", to: "/promoter/analytics", icon: BarChart3 },
  { label: "Reports", to: "/promoter/reports", icon: FileText },
  { label: "Billing", to: "/promoter/billing", icon: CreditCard },
];

const PromoterDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState({ name: "Promoter", email: "" });
  const footerMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: contextLogout } = useAuth();

  // Fetch real dashboard data
  const { dashboard, loading: dashboardLoading } = usePromoterDashboard();

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  // Dummy data inspired by schema entities (organizers, events, bookings, payouts, users)
  const data = useMemo(() => ({
    stats: dashboard ? [
      {
        title: "Total Events",
        value: dashboard.events?.total || 0,
        delta: `+${dashboard.events?.currentMonth || 0} this month`,
        icon: CalendarClock
      },
      {
        title: "Total Organizers",
        value: dashboard.organizers?.total || 0,
        delta: `+${dashboard.organizers?.currentMonth || 0} onboarded`,
        icon: Users
      },
      {
        title: "Gross Revenue",
        value: formatCurrency(dashboard.grossRevenue || 0),
        delta: `${dashboard.revenue?.incrementPercentage >= 0 ? '+' : ''}${dashboard.revenue?.incrementPercentage?.toFixed(1) || 0}% MoM`,
        icon: Wallet2
      },
      {
        title: "Platform Earnings",
        value: formatCurrency(dashboard.platformEarnings || 0),
        delta: dashboard.grossRevenue > 0 ? `${((dashboard.platformEarnings / dashboard.grossRevenue) * 100).toFixed(1)}% of GMV` : "0% of GMV",
        icon: BarChart3
      },
      {
        title: "Live Events",
        value: dashboard.liveEvents?.count || 0,
        delta: "Running now",
        icon: Activity
      },
      {
        title: "Pending Payouts",
        value: formatCurrency(dashboard.pendingPayouts?.totalAmount || 0),
        delta: `Across ${dashboard.pendingPayouts?.count || 0} payouts`,
        icon: ShieldCheck
      },
    ] : [
      { title: "Total Events", value: 0, delta: "+0 this month", icon: CalendarClock },
      { title: "Total Organizers", value: 0, delta: "+0 onboarded", icon: Users },
      { title: "Gross Revenue", value: "₹0", delta: "+0% MoM", icon: Wallet2 },
      { title: "Platform Earnings", value: "₹0", delta: "0% of GMV", icon: BarChart3 },
      { title: "Live Events", value: 0, delta: "Running now", icon: Activity },
      { title: "Pending Payouts", value: "₹0", delta: "Across 0 payouts", icon: ShieldCheck },
    ],
    organizers: [
      {
        id: "org-abc",
        slug: "abc-events",
        name: "ABC Events",
        description: "Large-format festival promoter curating multi-genre events across Mumbai and Pune.",
        state: "MH",
        address: "Unit 12B, Bandra Kurla Complex, Mumbai",
        email: "hello@abcevents.in",
        contact: "+91 98200 12345",
        isVerified: true,
        createdAt: "2023-04-12",
        updatedAt: "2024-02-14",
        owner: { name: "Amit Kulkarni", email: "amit@abc.events", phone: "+91 98200 12345" },
        managers: [
          { name: "Neha Shah", email: "neha@abc.events", phone: "+91 98222 11000" },
          { name: "Rahul Menon", email: "rahul@abc.events", phone: "+91 98111 33000" },
        ],
        socials: {
          instagram: "https://instagram.com/abcevents",
          linkedin: "https://linkedin.com/company/abcevents",
          facebook: "https://facebook.com/abcevents",
        },
        bank: { bankName: "ICICI Bank", accountNumber: "2021", ifsc: "ICIC0002021", status: "VERIFIED", gstNumber: "27ABCDE1234F1Z5" },
        events: [
          { title: "Summer Music Festival 2024", status: "LIVE", gross: 1250000, tickets: 4850, city: "Mumbai", type: "EXCLUSIVE" },
          { title: "Arena EDM Night", status: "DRAFT", gross: 360000, tickets: 1200, city: "Pune", type: "EXCLUSIVE" },
        ],
        bookings: 8450,
        gross: 3200000,
        platformFee: 265000,
        payoutDue: 82000,
        lastPayout: "Mar 2",
      },
      {
        id: "org-techcorp",
        slug: "techcorp",
        name: "TechCorp",
        description: "Conference organizer focused on innovation summits and executive networking.",
        state: "KA",
        address: "2nd Floor, Indiranagar 100ft Rd, Bengaluru",
        email: "events@techcorp.in",
        contact: "+91 98450 11223",
        isVerified: false,
        createdAt: "2023-07-03",
        updatedAt: "2024-01-28",
        owner: { name: "Shreya Rao", email: "shreya@techcorp.in", phone: "+91 98450 11223" },
        managers: [
          { name: "Anirudh Iyer", email: "anirudh@techcorp.in", phone: "+91 98861 55220" },
        ],
        socials: {
          linkedin: "https://linkedin.com/company/techcorp",
          x: "https://x.com/techcorp",
        },
        bank: { bankName: "HDFC Bank", accountNumber: "9981", ifsc: "HDFC0009981", status: "PENDING", gstNumber: "29ABCDE9981F1Z6" },
        events: [
          { title: "Tech Innovation Summit", status: "UPCOMING", gross: 940000, tickets: 3120, city: "Bengaluru", type: "CONFERENCE" },
        ],
        bookings: 4120,
        gross: 2140000,
        platformFee: 174000,
        payoutDue: 45000,
        lastPayout: "Mar 1",
      },
      {
        id: "org-culinary",
        slug: "culinary-dreams",
        name: "Culinary Dreams",
        description: "Gourmet experiences, food festivals, and chef-led pop-ups in Delhi NCR.",
        state: "DL",
        address: "C-7, Khan Market, New Delhi",
        email: "contact@culinarydreams.in",
        contact: "+91 98111 44220",
        isVerified: true,
        createdAt: "2022-11-19",
        updatedAt: "2024-02-02",
        owner: { name: "Ritika Sharma", email: "ritika@culinarydreams.in", phone: "+91 98111 44220" },
        managers: [
          { name: "Kabir Sood", email: "kabir@culinarydreams.in", phone: "+91 98190 77654" },
          { name: "Isha Arora", email: "isha@culinarydreams.in", phone: "+91 98190 55432" },
        ],
        socials: {
          instagram: "https://instagram.com/culinarydreams",
          facebook: "https://facebook.com/culinarydreams",
        },
        bank: { bankName: "SBI", accountNumber: "4410", ifsc: "SBIN0004410", status: "ON-HOLD", gstNumber: "07ABCDE4410F1Z7" },
        events: [
          { title: "Food & Wine Festival", status: "LIVE", gross: 820000, tickets: 2875, city: "Delhi", type: "EXPERIENCE" },
        ],
        bookings: 2890,
        gross: 1560000,
        platformFee: 126000,
        payoutDue: 38000,
        lastPayout: "Feb 27",
      },
      {
        id: "org-elite",
        slug: "elite-nights",
        name: "Elite Nights",
        description: "Late-night club experiences and VIP ticketing across Hyderabad.",
        state: "TG",
        address: "Road 12, Jubilee Hills, Hyderabad",
        email: "vip@elitenights.com",
        contact: "+91 98850 99881",
        isVerified: true,
        createdAt: "2023-02-08",
        updatedAt: "2024-01-18",
        owner: { name: "Karthik Reddy", email: "karthik@elitenights.com", phone: "+91 98850 99881" },
        managers: [
          { name: "Sneha Kapoor", email: "sneha@elitenights.com", phone: "+91 98850 12321" },
        ],
        socials: {
          instagram: "https://instagram.com/elitenights",
          snapchat: "https://snapchat.com/add/elitenights",
        },
        bank: { bankName: "Kotak", accountNumber: "8331", ifsc: "KKBK0008331", status: "VERIFIED", gstNumber: "36ABCDE8331F1Z4" },
        events: [
          { title: "Arena EDM Night", status: "DRAFT", gross: 360000, tickets: 1200, city: "Hyderabad", type: "EXCLUSIVE" },
        ],
        bookings: 2330,
        gross: 980000,
        platformFee: 82000,
        payoutDue: 21000,
        lastPayout: "Feb 25",
      },
    ],
    events: [
      {
        id: "evt-summer-music",
        title: "Summer Music Festival 2024",
        organizer: "ABC Events",
        description: "A multi-stage celebration of indie, electronic, and pop artists with immersive art zones.",
        type: "EXCLUSIVE",
        category: "Music",
        subCategory: "Festival",
        status: "LIVE",
        publishStatus: "PUBLISHED",
        city: "Mumbai",
        venue: "MMRDA Grounds",
        location: "Bandra Kurla Complex, Mumbai",
        startDate: "2024-07-15",
        endDate: "2024-07-15",
        ticketsSold: 4850,
        totalTickets: 5200,
        gross: 1250000,
        platformFee: 112500,
        payout: 320000,
        bookings: 4850,
        capacity: 5200,
      },
      {
        id: "evt-tech-summit",
        title: "Tech Innovation Summit",
        organizer: "TechCorp",
        description: "Flagship summit featuring product launches, startup showcases, and investor networking.",
        type: "CONFERENCE",
        category: "Conference",
        subCategory: "Technology",
        status: "UPCOMING",
        publishStatus: "PUBLISHED",
        city: "Bengaluru",
        venue: "BIEC",
        location: "Tumkur Road, Bengaluru",
        startDate: "2024-08-22",
        endDate: "2024-08-23",
        ticketsSold: 3120,
        totalTickets: 4500,
        gross: 940000,
        platformFee: 75200,
        payout: 180000,
        bookings: 3120,
        capacity: 4500,
      },
      {
        id: "evt-food-wine",
        title: "Food & Wine Festival",
        organizer: "Culinary Dreams",
        description: "Chef-led pop-ups, curated tasting menus, and signature cocktail experiences.",
        type: "EXPERIENCE",
        category: "Food",
        subCategory: "Festival",
        status: "LIVE",
        publishStatus: "PUBLISHED",
        city: "Delhi",
        venue: "NSIC Grounds",
        location: "Okhla, New Delhi",
        startDate: "2024-09-10",
        endDate: "2024-09-10",
        ticketsSold: 2875,
        totalTickets: 3500,
        gross: 820000,
        platformFee: 65600,
        payout: 150000,
        bookings: 2875,
        capacity: 3500,
      },
      {
        id: "evt-arena-edm",
        title: "Arena EDM Night",
        organizer: "Elite Nights",
        description: "Late-night EDM showcase with VIP lounges and immersive visual production.",
        type: "EXCLUSIVE",
        category: "Music",
        subCategory: "Nightlife",
        status: "COMPLETED",
        publishStatus: "PUBLISHED",
        city: "Hyderabad",
        venue: "Hitex Hall",
        location: "Madhapur, Hyderabad",
        startDate: "2024-03-14",
        endDate: "2024-03-14",
        ticketsSold: 1200,
        totalTickets: 1200,
        gross: 360000,
        platformFee: 28800,
        payout: 0,
        bookings: 1200,
        capacity: 1200,
      },
    ],
    bookings: {
      today: { count: 182, value: 420000, platformFee: 33600 },
      week: { count: 1420, value: 3280000, platformFee: 262400 },
      refunds: { count: 18, value: 52000 },
      disputes: 2,
      recent: [
        { id: "BK-9821", event: "Summer Music Festival 2024", organizer: "ABC Events", amount: 12500, status: "PAID", createdAt: "10:22 AM" },
        { id: "BK-9820", event: "Tech Innovation Summit", organizer: "TechCorp", amount: 8200, status: "PAID", createdAt: "10:10 AM" },
        { id: "BK-9819", event: "Food & Wine Festival", organizer: "Culinary Dreams", amount: 5600, status: "REFUND_PENDING", createdAt: "9:55 AM" },
      ],
      list: [
        {
          id: "BK-9821",
          eventId: "evt-summer-music",
          eventTitle: "Summer Music Festival 2024",
          eventOrganizer: "ABC Events",
          eventCity: "Mumbai",
          createdAt: "Feb 04, 2024 • 10:22 AM",
          status: "PAID",
          paymentStatus: "CAPTURED",
          tickets: 2,
          amount: 12500,
          platformFee: 950,
          gstAmount: 310,
          userId: "USR-101",
          userName: "Arjun Mehta",
          userEmail: "arjun@gmail.com",
          userPhone: "+91 98765 43210",
          userCity: "Mumbai",
          ticketName: "VIP Lounge",
          bookingItems: [
            { name: "VIP Lounge", quantity: 2, price: 6250, subtotal: 12500 },
          ],
        },
        {
          id: "BK-9820",
          eventId: "evt-tech-summit",
          eventTitle: "Tech Innovation Summit",
          eventOrganizer: "TechCorp",
          eventCity: "Bengaluru",
          createdAt: "Feb 04, 2024 • 10:10 AM",
          status: "PAID",
          paymentStatus: "CAPTURED",
          tickets: 1,
          amount: 8200,
          platformFee: 650,
          gstAmount: 210,
          userId: "USR-102",
          userName: "Sara Khan",
          userEmail: "sara.khan@gmail.com",
          userPhone: "+91 98765 43211",
          userCity: "Bengaluru",
          ticketName: "All Access Pass",
          bookingItems: [
            { name: "All Access Pass", quantity: 1, price: 8200, subtotal: 8200 },
          ],
        },
        {
          id: "BK-9819",
          eventId: "evt-food-wine",
          eventTitle: "Food & Wine Festival",
          eventOrganizer: "Culinary Dreams",
          eventCity: "Delhi",
          createdAt: "Feb 04, 2024 • 9:55 AM",
          status: "REFUND_PENDING",
          paymentStatus: "REFUND_REQUESTED",
          tickets: 3,
          amount: 5600,
          platformFee: 420,
          gstAmount: 140,
          userId: "USR-103",
          userName: "Rohit Patil",
          userEmail: "rohit@abc.events",
          userPhone: "+91 98765 43212",
          userCity: "Delhi",
          ticketName: "Tasting Pass",
          bookingItems: [
            { name: "Tasting Pass", quantity: 3, price: 1866, subtotal: 5600 },
          ],
        },
        {
          id: "BK-9818",
          eventId: "evt-arena-edm",
          eventTitle: "Arena EDM Night",
          eventOrganizer: "Elite Nights",
          eventCity: "Hyderabad",
          createdAt: "Feb 03, 2024 • 8:15 PM",
          status: "PAID",
          paymentStatus: "CAPTURED",
          tickets: 4,
          amount: 10400,
          platformFee: 780,
          gstAmount: 260,
          userId: "USR-104",
          userName: "Ananya Rao",
          userEmail: "ananya@techcorp.in",
          userPhone: "+91 98765 43213",
          userCity: "Hyderabad",
          ticketName: "Early Bird",
          bookingItems: [
            { name: "Early Bird", quantity: 4, price: 2600, subtotal: 10400 },
          ],
        },
      ],
    },
    payouts: [
      {
        organizer: "ABC Events",
        amount: 82000,
        status: "PENDING",
        eta: "Mar 4",
        bank: "ICICI • 2021",
        accountHolder: "ABC Events Pvt Ltd",
        ifsc: "ICIC0002021",
        gstNumber: "27AAACA1234F1Z5",
        kycStatus: "VERIFIED",
        lastPayout: "Feb 18",
        payoutMethod: "IMPS",
      },
      {
        organizer: "TechCorp",
        amount: 45000,
        status: "PROCESSING",
        eta: "Mar 2",
        bank: "HDFC • 9981",
        accountHolder: "TechCorp India",
        ifsc: "HDFC0009981",
        gstNumber: "29AAACT9876K1Z2",
        kycStatus: "VERIFIED",
        lastPayout: "Feb 22",
        payoutMethod: "NEFT",
      },
      {
        organizer: "Culinary Dreams",
        amount: 38000,
        status: "ON-HOLD",
        eta: "KYC",
        bank: "SBI • 4410",
        accountHolder: "Culinary Dreams LLP",
        ifsc: "SBIN0004410",
        gstNumber: "07AAACC4567M1Z9",
        kycStatus: "PENDING",
        lastPayout: "Feb 15",
        payoutMethod: "NEFT",
      },
      {
        organizer: "Elite Nights",
        amount: 21000,
        status: "PENDING",
        eta: "Mar 6",
        bank: "Kotak • 8331",
        accountHolder: "Elite Nights",
        ifsc: "KKBK0008331",
        gstNumber: "36AAACE2234P1Z3",
        kycStatus: "VERIFIED",
        lastPayout: "Feb 10",
        payoutMethod: "IMPS",
      },
    ],
    liveEvents: [
      { title: "Summer Music Festival 2024", checkIns: 3120, capacity: 5200, city: "Mumbai", status: "LIVE" },
      { title: "Food & Wine Festival", checkIns: 1450, capacity: 3400, city: "Delhi", status: "LIVE" },
      { title: "Tech Innovation Summit", checkIns: 0, capacity: 4800, city: "Bengaluru", status: "UPCOMING" },
    ],
    users: [
      { name: "Arjun Mehta", email: "arjun@gmail.com", role: "ATTENDEE", state: "MH", bookings: 24, lastActive: "Today" },
      { name: "Sara Khan", email: "sara.khan@gmail.com", role: "ORGANIZER_MANAGER", state: "KA", bookings: 8, lastActive: "Yesterday" },
      { name: "Rohit Patil", email: "rohit@abc.events", role: "ORGANIZER_OWNER", state: "MH", bookings: 42, lastActive: "2 days ago" },
      { name: "Ananya Rao", email: "ananya@techcorp.in", role: "ORGANIZER_OWNER", state: "KA", bookings: 15, lastActive: "3 days ago" },
    ],
    analytics: {
      categoryMix: { music: 35, conference: 28, food: 20, arts: 12, sports: 5 },
      risk: { refundRatio: 1.4, chargebacks: 0.08, kycPending: 1 },
    },
  }), [dashboard]);

  const statusBadge = (status) => {
    const map = {
      Live: "success",
      LIVE: "success",
      Upcoming: "default",
      UPCOMING: "default",
      Draft: "secondary",
      DRAFT: "secondary",
      PENDING: "default",
      PROCESSING: "success",
      "ON-HOLD": "destructive",
      PAID: "success",
      REFUND_PENDING: "destructive",
      VERIFIED: "success",
    };
    return map[status] || "outline";
  };

  const currency = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  useEffect(() => {
    const loadUser = () => {
      try {
        const profileRaw = sessionStorage.getItem("userProfile");
        const profile = profileRaw ? JSON.parse(profileRaw) : {};
        const name = sessionStorage.getItem("userName") || profile.name || "Promoter";
        const email = sessionStorage.getItem("userEmail") || profile.email || "";
        setUser({ name, email });
      } catch {
        setUser({ name: "Promoter", email: "" });
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(event.target)) {
        setFooterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await contextLogout();
    } catch (err) {
      console.warn("Logout API call failed:", err);
    }
    navigate("/");
    setIsLoggingOut(false);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
    setFooterMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  const sidebarContent = (isMobile = false) => (
    <>
      <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar/80 p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { navigate("/promoter/overview"); if (isMobile) setMobileSidebarOpen(false); }}
            className="flex items-center gap-3 text-left"
          >
            <img src={Logo} alt="MapMyParty" className="h-10 w-10" />
            {(isMobile || sidebarOpen) && (
              <div>
                <p className="text-xs text-foreground/60">MapMyParty</p>
                <p className="font-semibold tracking-[0.08em]">MAPMYPARTY</p>
              </div>
            )}
          </button>
          {isMobile ? (
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-foreground/80"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-foreground/80"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      <nav className="rounded-2xl border border-sidebar-border/60 bg-sidebar/70 p-2 space-y-1 shadow-[var(--shadow-card)]">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            onClick={() => { if (isMobile) setMobileSidebarOpen(false); }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl transition ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {(isMobile || sidebarOpen) && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <div
          ref={footerMenuRef}
          className="relative rounded-2xl border border-sidebar-border/60 bg-sidebar/80 p-2 shadow-[var(--shadow-card)]"
        >
          <button
            onClick={() => setFooterMenuOpen((v) => !v)}
            className="flex items-center gap-3 w-full text-left hover:bg-sidebar-accent/60 transition rounded-lg px-2 py-2"
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary-foreground font-semibold border border-primary/30">
              {(user.name || "P").charAt(0).toUpperCase()}
            </div>
            {(isMobile || sidebarOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name || "Promoter"}</p>
                <p className="text-xs text-foreground/60 truncate">{user.email || "promoter@mapmyparty"}</p>
              </div>
            )}
            {(isMobile || sidebarOpen) && (
              <ChevronDown
                className={`w-4 h-4 text-foreground/70 transition-transform ${
                  footerMenuOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </button>

          {footerMenuOpen && (
            <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-20">
              <div className="rounded-xl border border-sidebar-border/60 bg-sidebar/95 backdrop-blur-md shadow-[var(--shadow-card)] p-2 space-y-2">
                <button
                  onClick={() => {
                    setFooterMenuOpen(false);
                    if (isMobile) setMobileSidebarOpen(false);
                    navigate("/promoter/profile");
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-sidebar-accent/40 border border-sidebar-border/60 text-foreground hover:bg-sidebar-accent transition"
                >
                  <User className="w-4 h-4" />
                  {(isMobile || sidebarOpen) && <span>My Profile</span>}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive-foreground hover:bg-destructive/25 transition disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <span className="h-4 w-4 border-2 border-destructive/60 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {(isMobile || sidebarOpen) && <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="promoter-theme dashboard-theme min-h-screen bg-background text-foreground flex">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col gap-4 bg-sidebar border-r border-sidebar-border/60 px-3 py-5 transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${sidebarOpen ? "w-64" : "w-20"} flex-col gap-4 bg-sidebar border-r border-sidebar-border/60 px-3 py-5 sticky top-0 h-screen transition-all duration-300`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen">
        <div className="border-b border-border/60 bg-card/70 backdrop-blur sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Hamburger button for mobile/tablet */}
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden border-border/60 text-foreground/80 hover:bg-muted"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promoter Super Admin</p>
                <h1 className="text-2xl font-semibold">Control Center</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="border-border/60 text-foreground/80 hover:bg-muted">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="border-border/60 relative text-foreground/80 hover:bg-muted">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent" />
              </Button>
              <Button className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 border-none shadow-[var(--shadow-card)]">
                New Broadcast
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Outlet context={{ data, currency, statusBadge, dashboardLoading }} />
        </div>
      </div>
    </div>
  );
};

export default PromoterDashboard;
