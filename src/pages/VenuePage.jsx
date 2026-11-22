import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Coffee,
  ArrowUpRight,
  Star,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { venueRequest, venueMoney, venueDays } from "@/services/venueService";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import VenueBooking from "@/components/venues/VenueBooking";
import VenuePhotoViewer from "@/components/venues/VenuePhotoViewer";
import logo from "@/assets/MMP logo.svg";
import "@/styles/venue-page.css";

export function VenueHeader() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="border-b border-border/50 bg-background/90 backdrop-blur-xl relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center gap-3 sm:gap-8">
        <Link to="/" aria-label="MapMyParty home" className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <img src={logo} alt="MapMyParty" className="w-14 h-14 object-contain" />
        </Link>
        <nav aria-label="Venue navigation" className="ml-auto flex items-center gap-4 sm:gap-6 text-sm font-medium whitespace-nowrap">
          <Link to="/browse-events" className="hidden sm:inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground">
            Events
          </Link>
          <Link to="/venues" className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-[#EC4899] decoration-2 underline-offset-8">
            Venues
          </Link>
          <Link to="/organizer/venues" className="hidden md:inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-foreground">
            List your venue
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <ThemeToggle presentation="navbar" className="h-11 w-11 border-0 bg-transparent shadow-none hover:bg-transparent hover:text-[#EC4899] [&_svg]:size-5" />
          {!isAuthenticated && (
            <Link
              to="/auth"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 sm:px-5 text-sm font-semibold whitespace-nowrap transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function VenueReviews({ venueId, preview }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, error } = useQuery({
    queryKey: ["venue-reviews", venueId, page],
    queryFn: () =>
      venueRequest(`venues/${venueId}/reviews?page=${page}&limit=5`),
    enabled: !preview,
  });
  const write = async (remove = false) => {
    setBusy(true);
    try {
      await venueRequest(
        `venues/${venueId}/reviews/me`,
        remove ? "DELETE" : "PUT",
        remove ? undefined : { rating, comment },
      );
      await client.invalidateQueries({ queryKey: ["venue-reviews", venueId] });
      setOpen(false);
      toast.success(remove ? "Review removed" : "Review saved");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section id="reviews-section" className="space-y-4 pt-2">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <h2 className="text-xl font-semibold">
          Reviews{" "}
          {data?.total > 0 && (
            <span className="text-sm text-gold">
              ★ {data.rating.toFixed(1)} · {data.total}
            </span>
          )}
        </h2>
        <Button
          variant="outline"
          className="rounded-full"
          disabled={preview}
          onClick={() => (user ? setOpen(true) : navigate("/auth"))}
        >
          Write a review
        </Button>
      </div>
      {error && <p role="alert">Unable to load reviews. Please retry.</p>}
      {!data?.items.length && !error && (
        <div className="theme-card rounded-2xl p-8 sm:p-10 text-center luxury-grain text-muted-foreground">
          No reviews yet. Be the first to review this venue.
        </div>
      )}
      {data?.items.map((review) => (
        <article
          key={review.id}
          className="theme-card rounded-2xl p-5 space-y-2"
        >
          <div className="flex justify-between gap-3">
            <strong>{review.user.name}</strong>
            <span
              className="text-gold"
              aria-label={`${review.rating} out of 5 stars`}
            >
              {"★".repeat(review.rating)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            {review.comment}
          </p>
          {review.userId === user?.id && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setComment(review.comment);
                  setRating(review.rating);
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Delete your review?")) write(true);
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </article>
      ))}
      {data?.total > 5 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page * 5 >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
            <DialogDescription>
              Share your experience. One review per account and venue.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              write();
            }}
          >
            <div className="flex gap-2" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} stars`}
                  aria-pressed={n === rating}
                  onClick={() => setRating(n)}
                >
                  <Star
                    className={
                      n <= rating
                        ? "fill-[#C99774] text-[#C99774]"
                        : "text-muted-foreground"
                    }
                  />
                </button>
              ))}
            </div>
            <label className="block text-sm">
              Your review
              <textarea
                required
                minLength={5}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border bg-background p-3"
              />
            </label>
            <Button disabled={busy}>Publish review</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function VenueSurface({ venue, preview = false }) {
  const [viewer, setViewer] = useState(null);
  const photos = venue.media.filter((m) => m.kind === "GALLERY");
  const covers = Object.fromEntries(
    venue.media.filter((m) => m.kind !== "GALLERY").map((m) => [m.kind, m.url]),
  );
  const items = viewer?.kind === "menu" ? venue.menu : photos;
  const move = (delta) =>
    setViewer((v) => ({
      ...v,
      index: (v.index + delta + items.length) % items.length,
    }));
  useEffect(() => {
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
    document.head.appendChild(fonts);
    const oldTitle = document.title;
    document.title = `${venue.name} | MapMyParty`;
    return () => {
      fonts.remove();
      document.title = oldTitle;
    };
  }, [venue.name]);
  const focusBooking = () => {
    document
      .getElementById("booking-widget-aside")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    document
      .getElementById("venue-booking-date")
      ?.focus({ preventScroll: true });
  };
  const selected = items[viewer?.index];
  const mapsQuery =
    venue.latitude != null && venue.longitude != null
      ? `${venue.latitude},${venue.longitude}`
      : `${venue.name} ${venue.fullAddress}`;
  return (
    <div className="venue-page min-h-screen relative bg-background text-foreground">
      <VenueHeader />
      {preview && (
        <p className="text-center p-3 bg-secondary">
          Organizer preview · {venue.status}
        </p>
      )}
      <main className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
        <section
          id="venue-top"
          className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-border/50 shadow-xl"
        >
          <div className="relative w-full h-[360px] sm:h-[420px] lg:h-auto lg:aspect-[16/6] overflow-hidden bg-[#1B1222]">
            {covers.DESKTOP && (
              <picture>
                <source media="(min-width:1024px)" srcSet={covers.DESKTOP} />
                <source
                  media="(min-width:640px)"
                  srcSet={covers.TABLET || covers.DESKTOP}
                />
                <img
                  src={covers.MOBILE || covers.DESKTOP}
                  alt={`${venue.name} cover`}
                  className="absolute inset-0 w-full h-full object-cover"
                  fetchPriority="high"
                />
              </picture>
            )}
            <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-[#0F0A13] via-[#0F0A13]/35 to-transparent" />
          </div>
            <div className="bg-card sm:bg-transparent sm:absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-3 min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1B1222]/85 text-[#F2EEF5] border border-[#48285D]/80">
                    <Coffee size={14} />
                    {venue.type}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs bg-[#C99774]/15 text-[hsl(var(--accent))] sm:text-[#E8C5AC] border border-[#C99774]/40">
                    ₹0 booking fee
                  </span>
                </div>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground sm:text-[#F2EEF5] leading-[1.05] break-words">
                  {venue.name}
                </h1>
                <p className="flex items-center gap-2 text-sm sm:text-base text-muted-foreground sm:text-[#B9AEC4]">
                  <MapPin size={16} className="text-[#C99774] shrink-0" />
                  {[venue.area, venue.city].filter(Boolean).join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={focusBooking}
                className="cta-primary shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full text-sm font-semibold"
              >
                Book a place{" "}
                <span className="rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] uppercase">
                  Free
                </span>
              </button>
            </div>
        </section>
        <section
          aria-label="Venue Key Information"
          className="mt-4 sm:mt-5 theme-card rounded-2xl overflow-hidden"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
            <Info title="Address">
              <p className="text-sm font-medium leading-relaxed">
                {venue.fullAddress}
              </p>
              <a
                className="inline-flex items-center text-xs text-gold font-semibold mt-3"
                href={`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noreferrer"
              >
                Get directions <ArrowUpRight size={14} />
              </a>
            </Info>
            <Info title="Opening hours">
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  View weekly opening hours
                </summary>
                <ul className="text-xs space-y-1 mt-2">
                  {venueDays.map((day, i) => (
                    <li key={day}>
                      {day}:{" "}
                      {venue.openingHours
                        .find((h) => h.day === i)
                        ?.intervals.map(
                          (h) =>
                            `${h.open}–${h.close}${h.close <= h.open ? " (+1 day)" : ""}`,
                        )
                        .join(", ") || "Closed"}
                    </li>
                  ))}
                </ul>
                {venue.closures.length > 0 && (
                  <ul className="text-xs mt-3 space-y-1">
                    {venue.closures.map((row) => (
                      <li key={row.date}>
                        {row.date}:{" "}
                        {row.intervals
                          .map((h) => `${h.open}–${h.close}`)
                          .join(", ") || "Closed"}
                      </li>
                    ))}
                  </ul>
                )}
              </details>
              <p className="text-xs text-muted-foreground mt-3">
                {venue.reservationsEnabled
                  ? "Reservations by request"
                  : "Reservations paused"}{" "}
                · IST
              </p>
            </Info>
            <Info title="Cost for two">
              <p className="text-sm font-semibold">
                {venue.costForTwo != null
                  ? `${venueMoney(venue.costForTwo)} approx.`
                  : "Contact venue"}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                {venue.cuisines.join(", ")}
              </p>
            </Info>
            <Info title="Contact">
              <button
                className="text-sm font-mono text-left"
                title="Copy phone number"
                onClick={() =>
                  navigator.clipboard
                    .writeText(`+91${venue.contact}`)
                    .then(() => toast.success("Phone number copied"))
                    .catch(() =>
                      toast.error("Unable to copy. Please select the number."),
                    )
                }
              >
                +91 {venue.contact}
              </button>
              <a
                className="block text-xs break-all mt-2"
                href={`mailto:${venue.email}`}
              >
                {venue.email}
              </a>
              {venue.instagram && (
                <a
                  className="block text-xs text-gold mt-2"
                  href={venue.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram ↗
                </a>
              )}
            </Info>
          </div>
        </section>
        <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-8 space-y-10 sm:space-y-12 min-w-0">
            <section
              aria-label="Venue Amenities"
              className="flex flex-wrap gap-2.5"
            >
              {venue.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium bg-card border border-border/50"
                >
                  <Check size={14} className="text-gold" />
                  {amenity}
                </span>
              ))}
            </section>
            <section className="theme-card rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#C99774] via-secondary to-transparent opacity-80" />
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <h2 className="text-xl font-semibold">About</h2>
                <span className="font-mono text-[11px] uppercase tracking-widest text-gold">
                  The Space & Vibe
                </span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
                {venue.about || "About this venue will be added soon."}
              </p>
            </section>
            <section id="photos-section" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  Photos{" "}
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    {photos.length} curated views
                  </span>
                </h2>
              </div>
              <div className="venue-photo-mosaic" data-count={Math.min(photos.length, 5)}>
                {photos.slice(0, 5).map((photo, index) => (
                  <button
                    key={photo.id}
                    className="group relative min-w-0 overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`Open ${venue.name} photo ${index + 1}`}
                    onClick={() => setViewer({ kind: "photo", index })}
                  >
                    <img
                      src={photo.url}
                      alt={
                        `${venue.name} photo ${index + 1}`
                      }
                      className="w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              {photos.length > 5 && (
                <div className="flex justify-end">
                  <Button variant="outline" className="rounded-full px-5 gap-2" onClick={() => setViewer({ kind: "photo", index: 0 })}>
                    View all {photos.length} photos <ArrowUpRight size={16} aria-hidden="true" />
                  </Button>
                </div>
              )}
              {!photos.length && (
                <p className="text-sm text-muted-foreground">
                  Photos have not been added yet.
                </p>
              )}
            </section>
            <section id="menu-section" className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">Menu</h2>
                <span className="text-xs font-mono text-muted-foreground">
                  {venue.menu.length} pages
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {venue.menu.map((category, index) => (
                  <button
                    key={index}
                    className="aspect-[3/4] rounded-2xl theme-card p-4 sm:p-5 flex flex-col justify-between text-left luxury-grain"
                    onClick={() => setViewer({ kind: "menu", index })}
                  >
                    <span className="font-mono uppercase text-[10px] tracking-widest text-gold">
                      Menu page {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-2xl font-semibold break-words">
                      {category.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      View menu ↗
                    </span>
                  </button>
                ))}
              </div>
              {!venue.menu.length && (
                <p className="text-sm text-muted-foreground">
                  The menu has not been added yet.
                </p>
              )}
            </section>
            <VenueReviews venueId={venue.id} preview={preview} />
          </div>
          <VenueBooking venue={venue} preview={preview} />
        </div>
        <section className="theme-card rounded-2xl p-6 sm:p-8 mt-12 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-semibold">
              Your venue belongs on MapMyParty.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Show your space, share your menu and welcome new guests.
            </p>
          </div>
          <Link
            to="/organizer/venues"
            className="cta-primary rounded-full px-6 py-3 text-center text-sm font-semibold shrink-0"
          >
            List your venue
          </Link>
        </section>
      </main>
      <footer className="border-t border-border/50 py-6 px-4 text-center text-xs text-muted-foreground">
        © MapMyParty ·{" "}
        <a href="mailto:support@mapmyparty.com">Contact support</a> ·{" "}
        <Link to="/privacy-policy">Privacy</Link>
      </footer>
      {viewer?.kind === "photo" && <VenuePhotoViewer photos={photos} venueName={venue.name} startIndex={viewer.index} onClose={() => setViewer(null)} />}
      <Dialog
        open={viewer?.kind === "menu"}
        onOpenChange={(open) => {
          if (!open) setViewer(null);
        }}
      >
        <DialogContent
          className="venue-page venue-menu-reader max-w-4xl w-[calc(100%-2rem)] max-h-[90dvh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl sm:rounded-3xl border-border/70 bg-card shadow-2xl"
          overlayClassName="bg-[#0F0A13]/90 backdrop-blur-xl"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") move(-1);
            if (e.key === "ArrowRight") move(1);
          }}
        >
          <div className="flex items-center justify-between gap-3 px-5 py-4 pr-16 border-b border-border/40 bg-card/90">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider bg-secondary/40 text-gold border border-gold/30">
                {viewer?.kind === "menu" ? `Menu ? ${String(viewer.index + 1).padStart(2, "0")}` : "Photos"}
              </span>
              <DialogTitle className="text-sm sm:text-base font-semibold truncate">{viewer?.kind === "menu" ? selected?.name : "Venue photos"}</DialogTitle>
            </div>
            <span className="font-mono text-xs text-muted-foreground shrink-0">{viewer ? `${viewer.index + 1} / ${items.length}` : ""}</span>
          </div>
          <div className="overflow-y-auto min-h-0 bg-background/95">
            {viewer?.kind === "photo" && selected && <img src={selected.url} alt={`${venue.name} gallery photo`} className="max-h-[65dvh] w-full object-contain" />}
            {viewer?.kind === "menu" && selected && (
              <div className="min-h-[340px] sm:min-h-[460px] w-full max-w-2xl mx-auto p-6 sm:p-10 space-y-6">
                <div className="text-center border-b border-border/50 pb-5">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold">{venue.name} ? Curated Menu</span>
                  <h4 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mt-1">{selected.name}</h4>
                </div>
                <div className="space-y-5">
                  {selected.items.map((dish, i) => (
                    <div key={i} className="flex items-baseline justify-between gap-4 border-b border-border/25 pb-3.5">
                      <div className="min-w-0 break-words">
                        <h5 className="text-sm sm:text-base font-semibold text-foreground">{dish.name}</h5>
                        <p className="text-xs text-muted-foreground mt-0.5">{dish.description}</p>
                      </div>
                      <span className="font-mono text-sm font-semibold text-gold shrink-0">{venueMoney(dish.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border/40 bg-card/90">
            <Button className="rounded-full h-auto px-3.5 py-1.5 text-xs gap-1.5 bg-muted/40" variant="outline" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft className="w-3.5 h-3.5" />Previous</Button>
            <DialogDescription className="text-xs hidden sm:inline text-center">{viewer?.kind === "menu" ? "Pay for what you order at the venue ? Zero booking fee" : selected?.caption || "Venue photography"}</DialogDescription>
            <Button className="rounded-full h-auto px-3.5 py-1.5 text-xs gap-1.5 bg-muted/40" variant="outline" onClick={() => move(1)} aria-label="Next">Next<ChevronRight className="w-3.5 h-3.5" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Info({ title, children }) {
  return (
    <div className="p-5 sm:p-6 min-w-0">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function VenuePage() {
  const { organizerSlug, venueSlug } = useParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ["public-venue", organizerSlug, venueSlug],
    queryFn: () =>
      venueRequest(`public/venues/by-slug/${organizerSlug}/${venueSlug}`),
    retry: false,
  });
  if (isLoading)
    return (
      <p className="p-10 text-center" role="status">
        Loading venue…
      </p>
    );
  if (error || !data)
    return (
      <main className="p-10 text-center">
        <h1>Venue unavailable</h1>
        <p>{error?.message}</p>
        <Link to="/venues">Browse venues</Link>
      </main>
    );
  return <VenueSurface key={data.id} venue={data} />;
}
