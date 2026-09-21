import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Ticket, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon } from "lucide-react";
import { apiFetch } from "@/config/api";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";
import { formatEventPriceLabel } from "@/utils/priceFormatter";

const Dashboard = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [, setErrorUpcoming] = useState(null);

  const normalizeUpcomingEvent = (event) => {
    const startDate = event.startDate || event.date || event.start_time || event.start;
    const endDate = event.endDate || event.end_time || event.end;
    const venue = Array.isArray(event.venues) ? event.venues[0] : event.venue;
    const location = venue
      ? [venue.name, venue.city, venue.state].filter(Boolean).join(", ")
      : event.location || "Venue TBA";

    const prices = Array.isArray(event.tickets)
      ? event.tickets.map((t) => Number(t.price || t.amount)).filter((n) => !isNaN(n) && n > 0)
      : [];
    const minPrice = prices.length > 0 ? Math.min(...prices) : Number(event.price) || 0;

    const formatTime = (dateString) => {
      if (!dateString) return "Time TBA";
      const d = new Date(dateString);
      if (isNaN(d)) return "Time TBA";
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    };

    return {
      id: event.id || event._id,
      slug: event.slug || event.eventSlug || event.eventId || event.id || event._id,
      title: event.title || event.eventTitle || "Event",
      date: startDate || endDate,
      endDate,
      time: formatTime(startDate),
      location,
      price: minPrice,
      image: resolveEventBannerImage(event, "https://via.placeholder.com/600x400?text=Event"),
      category: event.category || event.mainCategory || event.subCategory || "Event",
      rating: event.rating || event.averageRating || 4.5,
      attendees: event.attendees || event.analytics?.attendees || event.analytics?.totalAttendees || 0,
      organizer: event.organizer,
    };
  };

  const fetchUpcomingEvents = useCallback(async () => {
    try {
      setLoadingUpcoming(true);
      setErrorUpcoming(null);
      const response = await apiFetch("/api/event", { method: "GET" });
      const rawEvents = response?.data?.events || response?.data || response || [];
      const nowTime = Date.now();
      const isPublished = (evt) => {
        const status = evt.publishStatus || evt.publish_status || evt.publishstatus || evt.status;
        return typeof status === "string" && status.toUpperCase() === "PUBLISHED";
      };

      const normalized = Array.isArray(rawEvents)
        ? rawEvents
            .filter(isPublished)
            .map(normalizeUpcomingEvent)
            .filter((evt) => {
              if (!evt.date) return false;
              const d = new Date(evt.date).getTime();
              if (Number.isNaN(d)) return false;
              return d - nowTime >= 0;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        : [];

      setUpcomingEvents(normalized);
    } catch (err) {
      console.error("Error fetching upcoming events:", err);
      setErrorUpcoming(err?.message || "Failed to load upcoming events");
      setUpcomingEvents([]);
    } finally {
      setLoadingUpcoming(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [fetchUpcomingEvents]);

  const nextEvent = upcomingEvents
    .map((event) => {
      const parsedDate = event?.date ? new Date(event.date) : null;
      return { event, parsedDate };
    })
    .filter(({ parsedDate }) => parsedDate && !isNaN(parsedDate))
    .sort((a, b) => a.parsedDate - b.parsedDate)[0]?.event;

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch { return dateString; }
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return "Date TBA";
    try {
      return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateString; }
  };

  // Skeleton loading card
  const SkeletonCard = ({ className = "" }) => (
    <div className={`rounded-xl bg-muted border border-border animate-pulse ${className}`}>
      <div className="h-44 bg-muted rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );

  // Event Card component
  const EventCard = ({ event, showPrice = true }) => {
    if (!event.organizer?.slug || !event.slug) return null;
    return (
      <Link
        to={`/events/${event.organizer.slug}/${event.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="rounded-xl overflow-hidden border border-border bg-muted hover:bg-muted hover:border-border transition-all duration-200">
          <div className="relative h-44 overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <Badge className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-inverse text-[10px] font-medium border-0">
              {event.category}
            </Badge>
            {showPrice && (
              <span className="absolute bottom-3 right-3 inline-flex min-w-[4.75rem] items-center justify-center rounded-lg bg-primaryCTA px-3.5 py-1.5 text-sm font-extrabold leading-none tabular-nums text-inverse">
                {formatEventPriceLabel(event.price)}
              </span>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-accent-foreground transition-colors leading-snug">
              {event.title}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{formatDate(event.date)}</span>
                <span className="text-muted-foreground">|</span>
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };


  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-foreground space-y-8">

      {/* â”€â”€ Welcome â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Discover events, manage your tickets, and explore what's next.</p>
        </div>
        <Link to="/dashboard/browse-events">
          <Button className="text-sm font-medium h-9 px-4">
            Explore Events
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* â”€â”€ Next Event Highlight â”€â”€ */}
      {!loadingUpcoming && nextEvent && nextEvent.organizer?.slug && nextEvent.slug && (
        <section className="rounded-xl border border-border bg-muted overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-80 h-48 md:h-auto flex-shrink-0">
              <img src={nextEvent.image} alt={nextEvent.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background hidden md:block" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent md:hidden" />
              <Badge className="absolute top-3 left-3 bg-primaryCTA text-inverse text-[10px] border-0 font-medium">Up Next</Badge>
            </div>
            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Your next event</p>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-3">{nextEvent.title}</h3>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateLong(nextEvent.date)} at {nextEvent.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{nextEvent.location}</span>
                </div>
              </div>
              <Link
                to={`/events/${nextEvent.organizer.slug}/${nextEvent.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="text-sm font-medium h-9 px-5">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* â”€â”€ Upcoming Events â”€â”€ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Upcoming Events</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Events happening soon</p>
          </div>
          <Link to="/dashboard/browse-events" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingUpcoming ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted p-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No upcoming events right now</p>
            <Link to="/dashboard/browse-events">
              <Button className="text-sm h-9 px-4">Browse Events</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {upcomingEvents.slice(0, 8).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>


      {/* â”€â”€ Quick Actions & Calendar â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-muted p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Ticket, label: "Browse Events", path: "/dashboard/browse-events", color: "#8438B0" },
              { icon: Calendar, label: "My Bookings", path: "/dashboard/bookings", color: "#8438B0" },
              { icon: Download, label: "My Tickets", path: "/dashboard/bookings", color: "#8438B0" },
              { icon: MapPin, label: "Nearby", path: "/dashboard/browse-events", color: "#8438B0" },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} to={action.path}>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg border border-border bg-muted hover:bg-muted hover:border-border transition-all cursor-pointer group">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${action.color}12` }}>
                      <Icon className="h-4 w-4" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Event Calendar */}
        <div className="rounded-xl border border-border bg-muted p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Schedule</h3>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </div>

          {loadingUpcoming ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 5).map((event) => (
                event.organizer?.slug && event.slug ? (
                  <Link
                    key={`cal-${event.id}`}
                    to={`/events/${event.organizer.slug}/${event.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                      <div className="text-center min-w-[44px] py-1.5 px-2 rounded-lg bg-muted border border-border">
                        <p className="text-[10px] font-semibold text-accent-foreground uppercase">
                          {new Date(event.date).toLocaleString('default', { month: 'short' })}
                        </p>
                        <p className="text-lg font-bold text-foreground leading-none">
                          {new Date(event.date).getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-accent-foreground transition-colors">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.time}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                    </div>
                  </Link>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
