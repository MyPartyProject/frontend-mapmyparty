import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Share2, ArrowRight } from "lucide-react";
import usePublicEventDetail from "@/hooks/usePublicEventDetail";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";
import { formatEventPriceLabel } from "@/utils/priceFormatter";
import overviewHero from "@/assets/overview-hero.png";
import overviewAbout from "@/assets/overview-about.jpg";
import expect1 from "@/assets/expect1.jpg";
import expect2 from "@/assets/expect2.jpg";
import expect3 from "@/assets/expect3.jpg";

const fallbackExpectationImages = [expect1, expect2, expect3];

const isPlaceholderImage = (value) =>
  typeof value === "string" && value.includes("placeholder.com");

const formatDateRange = (startDate, endDate) => {
  if (!startDate) return "Date TBA";

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return "Date TBA";

  const dateOptions = { month: "short", day: "numeric", year: "numeric" };
  const timeOptions = { hour: "numeric", minute: "2-digit" };
  const startLabel = `${start.toLocaleDateString(undefined, dateOptions)} at ${start.toLocaleTimeString(undefined, timeOptions)}`;

  if (!endDate) return startLabel;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return startLabel;

  return `${startLabel} - ${end.toLocaleDateString(undefined, dateOptions)}`;
};

const truncateText = (value, maxLength = 180) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const getStartingPriceLabel = (tickets = []) => {
  if (!Array.isArray(tickets) || tickets.length === 0) return null;

  const prices = tickets
    .map((ticket) => Number(ticket.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) return null;

  return formatEventPriceLabel(Math.min(...prices), { prefix: "From" });
};

const EventOverviewPage = () => {
  const { organizerSlug, eventSlug } = useParams();
  const navigate = useNavigate();
  const { event, loading, error } = usePublicEventDetail(organizerSlug, eventSlug);
  const [expectExpanded, setExpectExpanded] = useState([false, false, false]);

  const detailPath = `/events/${organizerSlug}/${eventSlug}`;
  const title = event?.title || "Event";
  const description =
    event?.description ||
    event?.about ||
    "Event details will be available soon.";
  const organizerName = event?.organizer?.name || "MapMyParty";
  const categoryLabel = [event?.category, event?.subCategory].filter(Boolean).join(" / ") || "Event";
  const venueLabel = event?.venue || event?.location || "Venue TBA";
  const addressLabel = event?.address || event?.primaryVenue?.fullAddress || venueLabel;
  const dateLabel = formatDateRange(event?.startDate, event?.endDate);
  const priceLabel = getStartingPriceLabel(event?.tickets);
  const heroImage = resolveEventBannerImage(event || {}, overviewHero);

  const galleryImages = useMemo(
    () =>
      Array.isArray(event?.gallery)
        ? event.gallery.filter((image) => image && !isPlaceholderImage(image))
        : [],
    [event?.gallery],
  );

  const aboutImage = galleryImages[0] || heroImage || overviewAbout;

  const expectationItems = useMemo(() => {
    const artists = Array.isArray(event?.artists) ? event.artists : [];
    const tickets = Array.isArray(event?.tickets) ? event.tickets : [];

    return [
      {
        img: artists[0]?.image || galleryImages[1] || fallbackExpectationImages[0],
        title: artists[0]?.name || "Featured Experience",
        desc: artists[0]
          ? `Featuring ${artists[0].name}${event?.subCategory ? ` for ${event.subCategory}` : ""}.`
          : truncateText(description, 150),
      },
      {
        img: galleryImages[2] || fallbackExpectationImages[1],
        title: venueLabel,
        desc: addressLabel || "Venue details are available on the event page.",
      },
      {
        img: galleryImages[3] || fallbackExpectationImages[2],
        title: tickets.length ? `${tickets.length} Ticket Option${tickets.length === 1 ? "" : "s"}` : "Ticketing",
        desc: priceLabel
          ? `${priceLabel}. Check live ticket availability before booking.`
          : "Check live ticket availability on the event page.",
      },
    ];
  }, [addressLabel, description, event?.artists, event?.subCategory, event?.tickets, galleryImages, priceLabel, venueLabel]);

  const eventFacts = [
    { label: "Organizer", value: organizerName },
    { label: "When", value: dateLabel },
    { label: "Where", value: venueLabel },
    { label: "Category", value: categoryLabel },
  ];

  const handleShare = () => {
    const shareUrl = window.location.href.replace("/overview", "");

    if (navigator.share) {
      navigator.share({
        title,
        text: `Check out this event: ${title}`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1426] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff6a63]" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b1426] px-4 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/8 p-6 text-center">
          <p className="text-lg font-semibold">Event overview unavailable</p>
          <p className="mt-2 text-sm text-white/70">
            {error || "This event could not be found."}
          </p>
          <Button
            className="mt-5 rounded-full bg-transparent px-5 font-semibold text-[#ff6a63] ring-1 ring-[#ff6a63] hover:bg-[#ff6a63] hover:text-white"
            onClick={() => navigate("/browse-events")}
          >
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1426] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-24 h-96 w-96 rounded-full bg-[#ff4f5c] blur-3xl opacity-40" />
        <div className="absolute left-12 top-40 h-64 w-64 rounded-full bg-[#f38b5d] blur-3xl opacity-30" />
      </div>

      <header className="relative z-10">
        <div className="container flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:bg-white/10"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#ff5d6c] via-[#ff7c55] to-[#ff4f5c] shadow-lg shadow-[#ff5d6c]/30" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#ff6a63]">{organizerName}</p>
                <p className="text-sm text-white/80">Event Overview</p>
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold uppercase tracking-wide text-[#ff6a63] md:flex">
            <a href="#hero" className="hover:text-white">Home</a>
            <a href="#about" className="hover:text-white">About</a>
            <a href="#tickets" className="hover:text-white">Tickets</a>
            <a href="#gallery" className="hover:text-white">Highlights</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:bg-white/10"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
              <span className="sr-only">Share</span>
            </Button>
            <Button
              className="hidden rounded-full bg-transparent px-5 font-semibold text-[#ff6a63] ring-1 ring-[#ff6a63] hover:bg-[#ff6a63] hover:text-white md:inline-flex"
              onClick={() => navigate(detailPath)}
            >
              Event Page
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section id="hero" className="container grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-16">
          <div className="relative space-y-8">
            <div className="absolute -left-10 -top-12 hidden h-28 w-48 bg-white/8 backdrop-blur-lg md:block" />
            <div className="inline-block rounded-lg bg-white/8 px-5 py-4 backdrop-blur-lg ring-1 ring-white/10">
              <p className="max-w-xs text-sm leading-relaxed text-white/70">
                {categoryLabel} by {organizerName}. {dateLabel}
              </p>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-[1.05] text-white md:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-2xl text-lg text-white/75">{description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <Button
                size="lg"
                className="group rounded-full border-2 border-[#ff6a63] bg-transparent px-7 text-lg font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#ff6a63]"
                onClick={() => navigate(`${detailPath}#ticket-section`)}
              >
                {priceLabel || "View Tickets"}
                <ArrowRight className="ml-3 h-5 w-5 transition group-hover:translate-x-1" />
              </Button>
            </div>

            <div
              className="hidden h-28 w-48 items-center justify-center rounded-lg md:flex"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.25) 1px, transparent 0)",
                backgroundSize: "12px 12px",
              }}
            />
          </div>

          <div className="relative flex flex-col items-center gap-4 lg:items-end">
            <img
              src={heroImage}
              alt={title}
              className="mx-auto max-h-[520px] w-full max-w-[520px] rounded-[2rem] object-cover shadow-[0_30px_90px_-45px_rgba(0,0,0,0.75)]"
            />
          </div>
        </section>

        <section className="relative w-full py-4">
          <div className="absolute inset-0 bg-[#101a2e]/80" />
          <div className="container relative flex justify-end">
            <p className="max-w-xs text-right text-xs leading-relaxed text-white/75">
              {venueLabel}. {addressLabel}
            </p>
          </div>
        </section>

        <section className="container pb-8 pt-2" />

        <section id="tickets" className="w-full bg-white text-[#0b1426]">
          <div className="container flex flex-col items-start justify-between gap-6 py-6 md:flex-row md:items-center">
            <p className="text-sm font-medium text-[#2a2a2a]">Event details from the live listing</p>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold uppercase">
              {eventFacts.map((fact) => (
                <span key={fact.label} className="rounded-full bg-[#0b1426]/5 px-4 py-2 text-[#0b1426]">
                  {fact.label}: {fact.value}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="container pb-8 pt-2" />

        <section id="about" className="w-full bg-[#0b1426] text-white pb-10 pt-6">
          <div className="container px-0 space-y-4">
            <div className="flex flex-col gap-3 px-10 text-right lg:items-end">
              <h3 className="text-3xl font-semibold text-[#f6cfc8]">About the Experience</h3>
              <p className="max-w-3xl text-sm leading-relaxed text-white/80">
                {description}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(detailPath)}
                  className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-white/70 hover:text-white"
                >
                  Open full event page
                </button>
              </div>
            </div>
          </div>

          <section className="container pb-6 pt-4" />

          <div className="w-full">
            <img
              src={aboutImage}
              alt={`${title} overview`}
              className="block h-[220px] w-full object-cover md:h-[280px] lg:h-[320px]"
            />
          </div>
        </section>

        <section id="gallery" className="w-full bg-[#0b1426] text-white pb-12 pt-8">
          <div className="container px-0 space-y-8">
            <div className="space-y-3 px-4 text-center md:px-10 md:text-left">
              <h3 className="text-3xl font-semibold uppercase tracking-[0.08em] text-[#f6cfc8]">What to Expect</h3>
              <p className="max-w-3xl text-sm leading-relaxed text-white/80">
                Highlights are based on this event's current artists, venue, ticket options, and gallery data.
              </p>
            </div>

            <div className="grid gap-8 px-4 md:grid-cols-3 md:px-6">
              {expectationItems.map((item, idx) => {
                const expanded = expectExpanded[idx];
                return (
                  <div key={`${item.title}-${idx}`} className="relative flex flex-col">
                    <button
                      className="absolute right-6 top-6 z-20 rounded-full bg-[#f7b7b0] ring-2 ring-white/50 shadow-lg transition-transform hover:scale-105"
                      style={{ width: "72px", height: "72px" }}
                      type="button"
                      aria-label={`More about ${item.title}`}
                      onClick={() =>
                        setExpectExpanded((prev) => {
                          const next = [...prev];
                          next[idx] = !next[idx];
                          return next;
                        })
                      }
                    />
                    <div
                      className="overflow-hidden rounded-[36px] bg-gradient-to-b from-[#1f2435] via-[#151c2e] to-[#0f1628] ring-1 ring-white/10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]"
                      style={{
                        WebkitMaskImage:
                          "radial-gradient(circle 40px at calc(100% - 48px) 48px, transparent 0 40px, black 40px 100%)",
                        maskImage:
                          "radial-gradient(circle 40px at calc(100% - 48px) 48px, transparent 0 40px, black 40px 100%)",
                      }}
                    >
                      {expanded && (
                        <div className="px-5 pt-5 text-center text-white">
                          <p className="mb-2 text-base font-semibold">{item.desc}</p>
                        </div>
                      )}
                      <img
                        src={item.img}
                        alt={item.title}
                        className="h-[220px] w-full object-cover md:h-[240px]"
                      />
                      <div className="bg-[#f7e0dc]/85 px-6 py-5 text-center text-[#1a0f18] backdrop-blur-sm">
                        <p className="text-base font-semibold text-[#1f1a1d]">{item.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EventOverviewPage;
