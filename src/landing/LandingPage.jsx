import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarRange,
  MapPin,
  Music2,
  Sparkles,
  ShieldCheck,
  Clock3,
  PartyPopper,
  Star,
  Search,
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
    price: `From ₹5000`,
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
    price: "From ₹15000",
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

const heroMobileScreenClass = (isActive) =>
  `absolute inset-0 flex h-full flex-col transition-all duration-500 ease-out ${
    isActive ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-[0.985] opacity-0"
  }`;

const HeroMobileDiscoverScreen = () => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between text-[11px] text-slate-300">
      <span>Discover</span>
      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-pink-100">Live now</span>
    </div>
    <div className="mt-3 rounded-2xl bg-white/[0.07] px-3 py-2 text-xs text-slate-300">Tonight near you</div>
    <div className="mt-3 grid gap-3">
      {featuredEvents.slice(0, 3).map((event) => (
        <div key={event.id} className="rounded-2xl bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${event.image})` }}
            />
            <div className="min-w-0">
              <p className="text-xs text-pink-200">{event.category}</p>
              <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
              <p className="text-xs text-slate-300 line-clamp-1">{event.location}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-auto rounded-2xl bg-gradient-to-r from-fuchsia-500/40 to-purple-500/40 p-3">
      <div className="flex items-center justify-between text-xs text-white">
        <span>Discover Now</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </div>
);

const HeroMobileEventScreen = () => {
  const event = featuredEvents[0];

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex min-h-[152px] items-end rounded-[22px] bg-cover bg-center p-4"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(12,8,24,0.08),rgba(12,8,24,0.88)), url(${event.image})`,
        }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-pink-100/80">{event.category}</p>
          <p className="mt-2 text-lg font-semibold leading-tight text-white">{event.title}</p>
        </div>
      </div>
      <div className="mt-3 rounded-2xl bg-white/[0.07] p-3">
        <div className="flex items-center gap-2 text-sm text-slate-200/80">
          <CalendarRange className="h-4 w-4 text-amber-200" />
          <span className="line-clamp-1">{event.date}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-200/80">
          <MapPin className="h-4 w-4 text-pink-200" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.07] p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/65">Attendees</p>
          <p className="mt-2 text-sm font-semibold text-white">{event.attendees.toLocaleString()} going</p>
        </div>
        <div className="rounded-2xl bg-white/[0.07] p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/65">Tickets</p>
          <p className="mt-2 text-sm font-semibold text-white">{event.price}</p>
        </div>
      </div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.08] p-3">
        <div className="flex items-center justify-between text-sm text-white">
          <span>Book in two taps</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

const HeroMobileTicketScreen = () => (
  <div className="flex h-full flex-col">
    <div className="rounded-[22px] border border-white/12 bg-gradient-to-br from-fuchsia-500/18 via-purple-500/12 to-amber-300/8 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-200/70">My ticket</p>
          <p className="mt-2 text-lg font-semibold text-white">Night Skyline Pass</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white">VIP</span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto] gap-4">
        <div className="space-y-2 text-sm text-slate-200/80">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-4 w-4 text-amber-200" />
            Entry pass
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
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white/[0.07] p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/65">Status</p>
        <p className="mt-2 text-sm font-semibold text-white">Ready to scan</p>
      </div>
      <div className="rounded-2xl bg-white/[0.07] p-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-300/65">Seat</p>
        <p className="mt-2 text-sm font-semibold text-white">VIP Lounge</p>
      </div>
    </div>
    <div className="mt-auto rounded-2xl border border-emerald-300/25 bg-emerald-400/15 px-4 py-3">
      <p className="text-sm font-semibold text-emerald-100">Payment confirmed</p>
      <p className="mt-1 text-xs text-slate-300/75">Saved in your wallet and ready for entry.</p>
    </div>
  </div>
);

const heroMobileScreens = [
  { id: "discover", title: "Discover events", component: HeroMobileDiscoverScreen },
  { id: "details", title: "Event details", component: HeroMobileEventScreen },
  { id: "ticket", title: "Ticket wallet", component: HeroMobileTicketScreen },
];

const HeroMobileDemo = ({ activeScreen }) => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="relative flex h-full min-h-[31rem] w-full items-center justify-center sm:min-h-[33rem]">
      <div className="absolute h-80 w-80 rounded-full bg-fuchsia-500/14 blur-3xl" />
      <div className="relative w-[260px] sm:w-[286px] lg:w-[300px]">
        <div className="rounded-[34px] border border-white/20 bg-[#120a24]/90 p-4 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.8)]">
          <div className="rounded-[28px] bg-[#0e0820] p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span>MapMyParty</span>
              <span>9:24</span>
            </div>
            <div className="relative mt-4 min-h-[420px] sm:min-h-[448px]">
              {heroMobileScreens.map((screen, index) => {
                const ScreenComponent = screen.component;
                const isActive = index === activeScreen;

                return (
                  <div key={screen.id} className={heroMobileScreenClass(isActive)} aria-hidden={!isActive}>
                    <ScreenComponent />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const [activeMobileScreen, setActiveMobileScreen] = useState(0);
  const [isHeroShowcasePaused, setIsHeroShowcasePaused] = useState(false);

  useEffect(() => {
    if (isHeroShowcasePaused) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveMobileScreen((prev) => (prev + 1) % heroMobileScreens.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, [isHeroShowcasePaused]);

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
                className="feature-showcase relative flex w-full max-w-[32rem] flex-col items-center justify-center overflow-visible"
                style={{ animation: "heroShowcaseFloat 6s ease-in-out infinite" }}
                onMouseEnter={() => setIsHeroShowcasePaused(true)}
                onMouseLeave={() => setIsHeroShowcasePaused(false)}
              >
                <div className="feature-carousel-track relative flex min-h-[34rem] w-full items-center justify-center overflow-visible bg-transparent p-0">
                  <HeroMobileDemo activeScreen={activeMobileScreen} />
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  {heroMobileScreens.map((screen, index) => {
                    const isActive = index === activeMobileScreen;

                    return (
                      <button
                        key={screen.id}
                        type="button"
                        aria-label={`Show ${screen.title}`}
                        onClick={() => setActiveMobileScreen(index)}
                        className={`transition-all duration-300 ease-out ${isActive ? "h-1.5 w-[20px] rounded-[10px] bg-white" : "h-1.5 w-1.5 rounded-full bg-white/40 hover:bg-white/60"}`}
                      />
                    );
                  })}
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
