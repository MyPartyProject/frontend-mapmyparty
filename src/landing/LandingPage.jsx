import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  MapPin,
  Music2,
  Sparkles,
  QrCode,
  ShieldCheck,
  Clock3,
  PartyPopper,
  Star,
  Search,
  Ticket,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/EventCard";
import eventMusic from "@/assets/event-music.jpg";
import eventConference from "@/assets/event-conference.jpg";
import eventFood from "@/assets/event-food.jpg";

const featuredEvents = [
  {
    id: "1",
    organizerSlug: "demo-organizer",
    eventSlug: "summer-music-festival-2024",
    title: "Summer Music Festival 2024",
    date: "July 15, 2024",
    location: "Central Park, New York",
    image: eventMusic,
    category: "Music",
    attendees: 5000,
    price: "From $49",
  },
  {
    id: "2",
    organizerSlug: "demo-organizer",
    eventSlug: "tech-innovation-conference",
    title: "Tech Innovation Conference",
    date: "August 22, 2024",
    location: "Convention Center, San Francisco",
    image: eventConference,
    category: "Conference",
    attendees: 2000,
    price: "From $199",
  },
  {
    id: "3",
    organizerSlug: "demo-organizer",
    eventSlug: "food-wine-tasting-festival",
    title: "Food & Wine Tasting Festival",
    date: "September 10, 2024",
    location: "Riverside Park, Chicago",
    image: eventFood,
    category: "Food & Drink",
    attendees: 3500,
    price: "From $75",
  },
];

const highlights = [
  { label: "Live events", value: "12K+", icon: CalendarRange },
  { label: "Cities covered", value: "240+", icon: MapPin },
  { label: "Tickets issued", value: "3.2M", icon: TicketIcon },
];

const categories = [
  { name: "Concerts", icon: Music2, color: "from-fuchsia-500/20 to-orange-500/20" },
  { name: "Tech & Business", icon: Sparkles, color: "from-blue-500/20 to-cyan-500/20" },
  { name: "Food & Drinks", icon: PartyPopper, color: "from-amber-500/20 to-rose-500/20" },
  { name: "Workshops", icon: ShieldCheck, color: "from-emerald-500/20 to-lime-500/20" },
];

const steps = [
  { title: "Discover", desc: "Spot curated events that match your vibe instantly.", icon: Sparkles },
  { title: "Book", desc: "Secure seats with one-tap checkout and instant tickets.", icon: ShieldCheck },
  { title: "Enjoy", desc: "Get reminders, live updates, and seamless entry.", icon: Clock3 },
];

function TicketIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M3 9a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2" />
      <path d="M21 15a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2a2 2 0 0 0-2-2" />
      <path d="M12 17v-2" />
      <path d="M12 13v-2" />
      <path d="M12 9V7" />
    </svg>
  );
}

const slideMotionClass = (isActive) =>
  `transform-gpu transition-all duration-500 ease-out ${isActive ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`;

const slideMotionStyle = (isActive, delay) => ({
  transitionDelay: `${isActive ? delay : 0}ms`,
});

const heroShowcaseStyles = `
  @keyframes heroShowcaseFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-6px);
    }
  }
`;

const getHeroFeatureSlideState = (index, activeIndex, total) => {
  if (index === activeIndex) return "active";
  if (index === (activeIndex + 1) % total) return "queued";
  return "hidden";
};

const heroFeatureSlideStateClass = (state) => {
  if (state === "active") {
    return "z-20 translate-y-0 scale-100 opacity-100";
  }

  if (state === "queued") {
    return "z-10 translate-y-4 scale-[0.985] opacity-25";
  }

  return "z-0 translate-y-8 scale-[0.97] opacity-0";
};

const DemoMetric = ({ label, value, accent = "text-white" }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-3 backdrop-blur-sm">
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/65">{label}</p>
    <p className={`mt-2 text-lg font-semibold ${accent}`}>{value}</p>
  </div>
);

const AttendeeDemoVisual = () => (
  <div className="mx-auto flex w-full justify-center">
    <div className="w-[210px] sm:w-[226px]">
      <div className="rounded-[30px] border border-white/20 bg-[#120a24]/90 p-3 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)]">
        <div className="rounded-[24px] bg-[#0e0820] p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span>MapMyParty</span>
            <span>9:24</span>
          </div>
          <div className="mt-3 grid gap-3">
            {featuredEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="rounded-2xl bg-white/10 p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${event.image})` }}
                  />
                  <div>
                    <p className="text-xs text-pink-200">{event.category}</p>
                    <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
                    <p className="text-xs text-slate-300 line-clamp-1">{event.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-gradient-to-r from-fuchsia-500/40 to-purple-500/40 p-3">
            <div className="flex items-center justify-between text-xs text-white">
              <span>Discover Now</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HostEventsVisual = () => (
  <div className="mx-auto w-full max-w-[300px] space-y-3 rounded-[22px] border border-white/10 bg-[#0f0920]/78 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.75)]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200/70">Publishing flow</p>
        <p className="text-lg font-semibold text-white">Summer Rooftop Sessions</p>
      </div>
      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">
        Published
      </span>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <DemoMetric label="Attendees" value="1.4K" accent="text-pink-100" />
      <DemoMetric label="Tickets" value="864" accent="text-amber-100" />
      <DemoMetric label="Revenue" value="$24K" accent="text-fuchsia-100" />
    </div>
    <div className="grid gap-3 sm:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <p className="text-sm font-semibold text-white">Event creation</p>
        <div className="mt-3 space-y-2">
          {["Details ready", "Tickets live", "Venue confirmed"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-200/80">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <div className="flex items-center justify-between text-sm text-white">
          <span>Ticket sales</span>
          <span className="text-slate-300/75">72%</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-fuchsia-400 via-pink-400 to-amber-300" />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-300/75">
          <span>Sold</span>
          <span className="text-white">864 / 1200</span>
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsVisual = () => {
  const bars = [42, 58, 50, 74, 68, 88, 96];

  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[22px] border border-white/10 bg-[#0f0920]/78 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.75)]">
      <div className="grid grid-cols-3 gap-3">
        <DemoMetric label="Revenue" value="$28.4K" accent="text-amber-100" />
        <DemoMetric label="Attendees" value="2.1K" accent="text-pink-100" />
        <DemoMetric label="Engagement" value="+18%" accent="text-fuchsia-100" />
      </div>
      <div className="mt-4 rounded-2xl bg-[#120a24]/82 p-4">
        <div className="flex items-center justify-between text-xs text-slate-300/70">
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-fuchsia-200" />
            Revenue trend
          </span>
          <span>Last 7 days</span>
        </div>
        <div className="mt-5 flex h-32 items-end gap-2">
          {bars.map((bar, index) => (
            <div key={index} className="flex-1 rounded-t-2xl bg-white/6 p-1">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-fuchsia-500 via-pink-400 to-amber-300"
                style={{ height: `${bar}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/65">Top market</p>
          <p className="mt-2 text-sm text-white">Austin, TX</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/65">Conversion</p>
          <p className="mt-2 text-sm text-white">14.8% ticket view to booking</p>
        </div>
      </div>
    </div>
  );
};

const TicketingVisual = () => (
  <div className="relative mx-auto flex min-h-[220px] w-full max-w-[300px] items-center justify-center pb-8">
    <div className="w-full max-w-[300px] rounded-[24px] border border-white/12 bg-gradient-to-br from-fuchsia-500/18 via-purple-500/12 to-amber-300/8 p-5 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200/70">Instant ticket</p>
          <p className="text-xl font-semibold text-white">Night Skyline Pass</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">Paid</span>
      </div>
      <div className="mt-6 grid grid-cols-[1fr_auto] gap-4">
        <div className="space-y-2 text-sm text-slate-200/80">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-amber-200" />
            VIP Access
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-pink-200" />
            Doors open at 8:00 PM
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-fuchsia-200" />
            Downtown Social Club
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white/10 p-3">
          {Array.from({ length: 16 }).map((_, index) => (
            <div
              key={index}
              className={`h-3 w-3 rounded-[4px] ${index % 3 === 0 || index % 5 === 0 ? "bg-white" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300/65">Checkout speed</p>
          <p className="mt-1 text-lg font-semibold text-white">2 tap purchase</p>
        </div>
        <ShieldCheck className="h-8 w-8 text-emerald-200" />
      </div>
    </div>
    <div className="absolute bottom-0 right-1 rounded-2xl border border-emerald-300/25 bg-[#0b1322]/96 p-4 shadow-[0_25px_70px_-30px_rgba(0,0,0,0.75)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
        <CheckCircle2 className="h-4 w-4" />
        Payment confirmed
      </div>
      <p className="mt-2 text-xs text-slate-300/75">Instant confirmation sent to email and app wallet.</p>
    </div>
  </div>
);

const CheckInVisual = () => (
  <div className="mx-auto w-full max-w-[300px] space-y-3 rounded-[22px] border border-white/10 bg-[#0f0920]/78 p-4 shadow-[0_24px_80px_-36px_rgba(0,0,0,0.75)]">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200/70">Entry control</p>
        <p className="text-lg font-semibold text-white">Gate 02 scanner</p>
      </div>
      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">
        Scanning live
      </span>
    </div>
    <div className="grid gap-3 sm:grid-cols-[1fr_0.95fr]">
      <div className="rounded-2xl bg-[#120a24]/82 p-4">
        <div className="mx-auto flex h-40 w-full max-w-[180px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5">
          <div className="relative h-24 w-24 rounded-2xl bg-white/6">
            <div className="absolute left-0 top-0 h-7 w-7 rounded-tl-2xl border-l-2 border-t-2 border-fuchsia-200" />
            <div className="absolute right-0 top-0 h-7 w-7 rounded-tr-2xl border-r-2 border-t-2 border-fuchsia-200" />
            <div className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-2xl border-b-2 border-l-2 border-fuchsia-200" />
            <div className="absolute bottom-0 right-0 h-7 w-7 rounded-br-2xl border-b-2 border-r-2 border-fuchsia-200" />
            <div className="absolute inset-5 grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className={`rounded-[3px] ${index % 2 === 0 || index === 7 ? "bg-white" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <QrCode className="h-4 w-4" />
            Attendee verified
          </div>
          <p className="mt-3 text-base text-white">Nina Carter</p>
          <p className="text-sm text-slate-300/75">VIP + Lounge access</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DemoMetric label="Checked in" value="842" accent="text-emerald-100" />
          <DemoMetric label="Remaining" value="358" accent="text-amber-100" />
        </div>
      </div>
    </div>
  </div>
);

const HeroFeatureSlide = ({ slide, state }) => {
  const isActive = state === "active";

  return (
    <div
      className={`feature-slide absolute inset-0 transition-all duration-500 ease-out ${heroFeatureSlideStateClass(state)} ${isActive ? "" : "pointer-events-none"}`}
      aria-hidden={!isActive}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(19,10,36,0.94),rgba(10,7,23,0.97))] px-6 py-6 shadow-[0_32px_90px_-38px_rgba(0,0,0,0.9)]">
        <div className="feature-slide-content flex flex-col items-start gap-3">
          <div className={slideMotionClass(isActive)} style={slideMotionStyle(isActive, 0)}>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200/80">
              {slide.label}
            </span>
          </div>
          <div className={slideMotionClass(isActive)} style={slideMotionStyle(isActive, 0)}>
            <h3 className="max-w-[17rem] text-[1.85rem] font-semibold leading-tight text-white">{slide.title}</h3>
          </div>
          <div className={slideMotionClass(isActive)} style={slideMotionStyle(isActive, 120)}>
            <p className="max-w-sm text-sm leading-relaxed text-slate-200/78">{slide.description}</p>
          </div>
        </div>
        <div
          className={`feature-visual mt-5 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4 ${slideMotionClass(isActive)}`}
          style={slideMotionStyle(isActive, 240)}
        >
          {slide.visual}
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [activeFeatureSlide, setActiveFeatureSlide] = useState(0);
  const [isFeatureCarouselPaused, setIsFeatureCarouselPaused] = useState(false);

  const heroFeatureSlides = [
    {
      id: "attendees",
      label: "FOR ATTENDEES",
      title: "Discover events instantly",
      description: "Explore concerts, nightlife, food festivals and conferences happening around you.",
      visual: <AttendeeDemoVisual />,
    },
    {
      id: "host-events",
      label: "FOR ORGANIZERS",
      title: "Host unforgettable events",
      description: "Create, publish and manage events with powerful tools designed for organizers.",
      visual: <HostEventsVisual />,
    },
    {
      id: "ticketing",
      label: "TICKETING",
      title: "Sell tickets instantly",
      description: "Launch ticket sales with secure checkout and instant confirmations.",
      visual: <TicketingVisual />,
    },
    {
      id: "analytics",
      label: "ANALYTICS",
      title: "Track event performance",
      description: "Monitor ticket sales, attendance and engagement in real time.",
      visual: <AnalyticsVisual />,
    },
    {
      id: "check-in",
      label: "EVENT ENTRY",
      title: "Fast attendee check-ins",
      description: "Scan tickets and manage entry with real-time attendee verification.",
      visual: <CheckInVisual />,
    },
  ];

  useEffect(() => {
    if (isFeatureCarouselPaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveFeatureSlide((prev) => (prev + 1) % heroFeatureSlides.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isFeatureCarouselPaused, heroFeatureSlides.length]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <style>{heroShowcaseStyles}</style>
      <Header forceMainHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#140a2b]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,105,180,0.28),transparent_45%),radial-gradient(circle_at_65%_25%,rgba(122,78,255,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,183,104,0.25),transparent_40%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0619] via-[#1b0c2f] to-[#31154a] opacity-90" />
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-16 top-16 h-3 w-3 rounded-full bg-pink-300/70 blur-sm" />
            <div className="absolute left-40 top-28 h-2 w-2 rounded-full bg-purple-200/70 blur-sm" />
            <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-fuchsia-300/70 blur-sm" />
            <div className="absolute right-36 bottom-24 h-3 w-3 rounded-full bg-rose-200/80 blur-sm" />
            <div className="absolute left-1/2 bottom-14 h-2 w-2 rounded-full bg-amber-200/80 blur-sm" />
          </div>

          <div className="relative container px-6 md:px-8 lg:px-10 pt-10 pb-20 lg:pt-14 lg:pb-24 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] items-center">
            <div className="space-y-5">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-semibold leading-tight text-white">Discover. Book. Party.</h1>
                <h2 className="text-2xl md:text-3xl font-medium text-slate-100">
                  Your City's Events, <span className="text-pink-300">One Map Away.</span>
                </h2>
              </div>
              <p className="text-base md:text-lg text-slate-200/80 max-w-xl">
                Find concerts, club nights, weddings, comedy shows and private parties - instantly book tickets with
                zero hassle.
              </p>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-lg shadow-[0_25px_60px_-30px_rgba(0,0,0,0.65)] sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-slate-200/90">
                    <Search className="h-4 w-4 text-slate-200/80" />
                    Search events, artists or venues...
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-slate-100">
                      <MapPin className="h-3.5 w-3.5 text-pink-200" />
                      New York City
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-400 hover:to-pink-400">
                      Search
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-400 hover:to-fuchsia-400">
                    Browse Events
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white hover:text-slate-900">
                    Host Your Event
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute -right-6 top-8 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl" />
              <div className="absolute -left-6 bottom-8 h-52 w-52 rounded-full bg-pink-400/25 blur-3xl" />
              <div
                className="feature-showcase relative h-[440px] w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.04] p-8 backdrop-blur-[10px] shadow-[0_44px_140px_-40px_rgba(0,0,0,0.85)]"
                style={{ animation: "heroShowcaseFloat 6s ease-in-out infinite" }}
                onMouseEnter={() => setIsFeatureCarouselPaused(true)}
                onMouseLeave={() => setIsFeatureCarouselPaused(false)}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_78%_14%,rgba(255,105,180,0.16),transparent_28%),radial-gradient(circle_at_82%_80%,rgba(255,183,104,0.12),transparent_30%)] opacity-80" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200/70">
                      <Sparkles className="h-3.5 w-3.5 text-pink-200" />
                      Product Showcase
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-300/55">
                      {String(activeFeatureSlide + 1).padStart(2, "0")} / {String(heroFeatureSlides.length).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="relative min-h-0 flex-1">
                    <div className="pointer-events-none absolute inset-x-4 top-4 bottom-2 rounded-[24px] border border-white/6 bg-white/[0.03] opacity-40" />
                    <div className="pointer-events-none absolute inset-x-6 top-8 bottom-0 rounded-[24px] border border-white/5 bg-black/15 opacity-50" />

                    {heroFeatureSlides.map((slide, index) => (
                      <HeroFeatureSlide
                        key={slide.id}
                        slide={slide}
                        state={getHeroFeatureSlideState(index, activeFeatureSlide, heroFeatureSlides.length)}
                      />
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-center gap-2">
                    {heroFeatureSlides.map((slide, index) => {
                      const isActive = index === activeFeatureSlide;

                      return (
                        <button
                          key={slide.id}
                          type="button"
                          aria-label={`Go to ${slide.title}`}
                          onClick={() => setActiveFeatureSlide(index)}
                          className={`transition-all duration-300 ease-out ${isActive ? "h-1.5 w-[20px] rounded-[10px] bg-white" : "h-1.5 w-1.5 rounded-full bg-white/40 hover:bg-white/60"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="relative py-14 bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_25%)]" />
          <div className="container relative px-4 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Discover</p>
                <h2 className="text-3xl font-bold">Pick your vibe</h2>
              </div>
              <Link to="/browse-events">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white hover:text-slate-900">
                  View all events
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map(({ name, icon: Icon, color }) => (
                <Link key={name} to="/events" className="group">
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_25px_80px_-24px_rgba(0,0,0,0.65)]`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-80 transition-opacity group-hover:opacity-100`} />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-slate-200/70">Category</p>
                        <p className="text-lg font-semibold">{name}</p>
                      </div>
                      <div className="rounded-xl bg-white/20 p-2 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="relative mt-6 flex items-center gap-2 text-sm text-slate-100/80">
                      Explore now
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className="py-16 bg-slate-900/60">
          <div className="container px-4 space-y-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-amber-200/80">Curated</p>
                <h2 className="text-3xl font-bold">Featured events</h2>
                <p className="text-slate-300/80">Handpicked experiences trending near you.</p>
              </div>
              <Link to="/browse-events">
                <Button variant="accent" className="bg-amber-400 text-slate-900 hover:bg-amber-300">
                  Browse all
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} {...event} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-slate-950">
          <div className="container px-4">
            <div className="text-center mb-10 space-y-3">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Seamless</p>
              <h2 className="text-3xl font-bold">How Map MyParty works</h2>
              <p className="text-slate-300/80 max-w-2xl mx-auto">
                From discovery to entry, we keep every step delightful with live updates and secure check-ins.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {steps.map(({ title, desc, icon: Icon }, index) => (
                <div
                  key={title}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/0 to-white/0" />
                  <div className="relative flex items-center justify-between">
                    <div className="rounded-xl bg-amber-400/15 p-3 text-amber-100">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200/70">0{index + 1}</span>
                  </div>
                  <h3 className="relative mt-5 text-xl font-semibold">{title}</h3>
                  <p className="relative mt-2 text-slate-300/80">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="relative overflow-hidden py-16 bg-[#140a2b]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,105,180,0.22),transparent_45%),radial-gradient(circle_at_70%_20%,rgba(122,78,255,0.32),transparent_40%),radial-gradient(circle_at_82%_72%,rgba(255,183,104,0.2),transparent_38%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0619] via-[#1b0c2f] to-[#31154a] opacity-90" />
          <div className="container relative px-4 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.18em] text-amber-200/80">Trusted</p>
              <h2 className="text-3xl font-bold text-white">
                Loved by organizers & attendees
              </h2>
              <p className="text-slate-200/80 max-w-2xl">
                Instant payouts, secure tickets, and live support keep events smooth. Join thousands who make every
                celebration unforgettable with Map MyParty.
              </p>
              <div className="flex flex-wrap gap-3 text-white">
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur shadow-[0_16px_40px_-24px_rgba(0,0,0,0.7)]">
                  <Star className="h-4 w-4 text-amber-300" />
                  4.8/5 average satisfaction
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur shadow-[0_16px_40px_-24px_rgba(0,0,0,0.7)]">
                  <ShieldCheck className="h-4 w-4 text-pink-200" />
                  Verified organizers
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur shadow-[0_16px_40px_-24px_rgba(0,0,0,0.7)]">
                  <Clock3 className="h-4 w-4 text-fuchsia-200" />
                  Real-time support
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl shadow-[0_40px_120px_-35px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-300/25 to-pink-300/25 flex items-center justify-center text-amber-100 font-semibold border border-white/10">
                  M
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-300/70">Organizer Story</p>
                  <p className="font-semibold text-lg text-white">Neha, Indie Fest</p>
                </div>
              </div>
              <p className="mt-4 text-slate-200/80 leading-relaxed">
                "Ticketing used to be a headache. With Map MyParty, we sold out in days, scanned tickets on-site, and
                paid artists instantly. The live attendee updates kept our crew fully aligned."
              </p>
              <div className="mt-4 flex items-center gap-6 text-sm text-slate-200/75">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-pink-200" />
                  Verified payout
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  8K attendees
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-slate-950">
          <div className="container px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <PartyPopper className="h-4 w-4 text-amber-300" />
              <span className="text-slate-200">Host or attend-your choice.</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready for your next{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">
                unforgettable night?
              </span>
            </h2>
            <p className="text-slate-300/80 max-w-2xl mx-auto">
              Create events, sell tickets, and thrill your guests. Or jump in as an attendee and enjoy the city's best
              experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" variant="hero" className="text-base px-8">
                  Host an Event
                </Button>
              </Link>
              <Link to="/browse-events">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 border-white/30 text-white hover:bg-white hover:text-slate-900"
                >
                  Find Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default LandingPage;
