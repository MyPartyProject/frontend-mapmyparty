import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Music2,
  Search,
  Sparkles,
  ShieldCheck,
  Clock3,
  PartyPopper,
  Star,
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

const heroSlides = [
  { id: "party-video", type: "video", src: "/videos/party2.mp4" },
  { id: "party-image-1", type: "image", src: "/images/ph1.jpg" },
  { id: "party-image-2", type: "image", src: "/images/ph2.jpg" },
  { id: "party-image-3", type: "image", src: "/images/ph3.jpg" },
];

const heroCarouselStyles = `
  @keyframes heroImageDrift {
    0% {
      transform: scale(1.04) translate3d(0, 0, 0);
    }
    50% {
      transform: scale(1.09) translate3d(0, -1.5%, 0);
    }
    100% {
      transform: scale(1.12) translate3d(0, -3%, 0);
    }
  }
`;

const LandingPage = () => {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const heroVideoRef = useRef(null);

  useEffect(() => {
    heroSlides
      .filter((slide) => slide.type === "image")
      .forEach((slide) => {
        const image = new Image();
        image.src = slide.src;
      });
  }, []);

  useEffect(() => {
    const activeSlide = heroSlides[activeHeroSlide];

    if (activeSlide.type === "video") {
      const video = heroVideoRef.current;

      if (!video) return undefined;

      video.currentTime = 0;
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {});
      }

      return undefined;
    }

    if (heroVideoRef.current) {
      heroVideoRef.current.pause();
    }

    const timeoutId = window.setTimeout(() => {
      setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [activeHeroSlide]);

  const handleHeroVideoEnded = () => {
    setActiveHeroSlide(1);
  };

  const goToPreviousHeroSlide = () => {
    setActiveHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNextHeroSlide = () => {
    setActiveHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <style>{heroCarouselStyles}</style>
      <Header forceMainHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#140a2b] min-h-[20rem] sm:min-h-[23rem] lg:min-h-[28rem]">
          <div className="absolute inset-0">
            {heroSlides.map((slide, index) => {
              const isActive = index === activeHeroSlide;

              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${isActive ? "opacity-100" : "pointer-events-none opacity-0"}`}
                >
                  {slide.type === "video" ? (
                    <video
                      ref={index === 0 ? heroVideoRef : null}
                      className="h-full w-full object-cover"
                      src={slide.src}
                      muted
                      playsInline
                      preload="auto"
                      onEnded={handleHeroVideoEnded}
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-cover bg-center will-change-transform"
                      style={{
                        backgroundImage: `url(${slide.src})`,
                        animation: isActive ? "heroImageDrift 4000ms ease-out forwards" : "none",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Previous hero slide"
              onClick={goToPreviousHeroSlide}
              className="inline-flex h-11 w-11 items-center justify-center text-white/65 transition-all duration-300 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next hero slide"
              onClick={goToNextHeroSlide}
              className="inline-flex h-11 w-11 items-center justify-center text-white/65 transition-all duration-300 hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,105,180,0.18),transparent_45%),radial-gradient(circle_at_65%_25%,rgba(122,78,255,0.2),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(255,183,104,0.14),transparent_40%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-[#12081f]/45 to-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/30" />
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-16 top-16 h-3 w-3 rounded-full bg-pink-300/70 blur-sm" />
            <div className="absolute left-40 top-28 h-2 w-2 rounded-full bg-purple-200/70 blur-sm" />
            <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-fuchsia-300/70 blur-sm" />
            <div className="absolute right-36 bottom-24 h-3 w-3 rounded-full bg-rose-200/80 blur-sm" />
            <div className="absolute left-1/2 bottom-14 h-2 w-2 rounded-full bg-amber-200/80 blur-sm" />
          </div>

          <div className="relative container px-6 md:px-8 lg:px-10 pt-10 pb-20 lg:pt-14 lg:pb-24" />
        </section>

        {/* Search */}
        <section className="bg-slate-950">
          <div className="container px-6 md:px-8 lg:px-10 pt-6 pb-10 lg:pt-8 lg:pb-14">
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
