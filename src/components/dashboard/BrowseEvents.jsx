import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Search,
  TrendingUp,
  Star,
  Users,
  Ticket,
  SlidersHorizontal,
  Sparkles,
  Briefcase,
  Music,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePublicEvents } from "@/hooks/usePublicEvents";
import Header from "@/components/Header";
import { isAuthenticated as checkAuth } from "@/utils/auth";

const CATEGORY_CONFIG = [
  {
    id: "WORKSHOP",
    label: "Workshop",
    icon: Briefcase,
    color: "#f97316",
  },
  {
    id: "MUSIC",
    label: "Music",
    icon: Music,
    color: "#a855f7",
  },
];

const WORKSHOP_SUBCATEGORIES = [
  "Sports", "Arts", "Meeting", "Conference", "Seminar", "Yoga",
  "Cooking", "Dance", "Self Help", "Consultation", "Corporate Event", "Communication",
].map((label) => ({ label, value: label.toUpperCase() }));

const MUSIC_SUBCATEGORIES = [
  "Bollywood", "Hiphop", "Electronic", "Melodic", "Live Music", "Metal",
  "Rap", "Music House", "Techno", "K-pop", "Hollywood", "Pop",
  "Punjabi", "Disco", "Rock", "Afrobeat", "Dancehall", "Thumri", "Bolly Tech",
].map((label) => ({ label, value: label.toUpperCase() }));

export default function BrowseEvents({ showPublicHeader = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const navigate = useNavigate();

  const {
    events: apiEvents = [],
    loading,
    error,
    updateFilters,
  } = usePublicEvents();

  const events = apiEvents;

  useEffect(() => {
    if (showPublicHeader && checkAuth()) {
      const role = (sessionStorage.getItem("role") || "USER").toUpperCase();
      if (role === "USER") {
        navigate("/dashboard/browse-events", { replace: true });
      }
    }
  }, [showPublicHeader, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({
        search: searchQuery || null,
        category: selectedCategory === "all" ? null : selectedCategory,
        subCategory: selectedSubCategory === "all" ? null : selectedSubCategory,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedSubCategory, updateFilters]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return dateString; }
  };

  const getEventLocation = (event) => {
    if (event.venues?.length > 0) {
      const venue = event.venues[0];
      return `${venue.city || ""}${venue.city && venue.state ? ", " : ""}${venue.state || ""}`.trim() || "Location TBA";
    }
    return event.location || "Location TBA";
  };

  const getEventPriceDisplay = (event) => {
    if (Array.isArray(event.tickets) && event.tickets.length > 0) {
      const prices = event.tickets.map((t) => Number(t.price)).filter((p) => !isNaN(p) && p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        return minPrice > 0 ? `₹${minPrice.toLocaleString()}` : "Free";
      }
    }
    return typeof event.price === "number" && event.price > 0 ? `₹${event.price}` : "Free";
  };

  const filteredEvents = events || [];
  const trendingEvents = useMemo(() => filteredEvents.filter((e) => e.trending).slice(0, 4), [filteredEvents]);

  const activeSubcategories =
    selectedCategory === "all"
      ? []
      : selectedCategory === "WORKSHOP"
      ? WORKSHOP_SUBCATEGORIES
      : MUSIC_SUBCATEGORIES;

  const groupedByCategory = useMemo(() => {
    return CATEGORY_CONFIG.map((cat) => ({
      ...cat,
      events: filteredEvents.filter(
        (event) => (event.category || event.mainCategory || "").toUpperCase() === cat.id
      ),
    }));
  }, [filteredEvents]);

  const hasActiveFilters = selectedCategory !== "all" || selectedSubCategory !== "all" || searchQuery;

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedSubCategory("all");
    setSearchQuery("");
  };

  // Reusable event card
  const EventCard = ({ event }) => (
    <Link to={`/events/${event.organizer?.slug}/${event.slug}`} key={event.id} className="group block">
      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 h-full">
        <div className="relative h-44 overflow-hidden">
          <img
            src={event.flyerImage || event.image || event.coverImage || event.thumbnail || "https://via.placeholder.com/400x250?text=Event"}
            alt={event.title || event.eventTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className="absolute top-3 left-3 text-xs font-semibold text-white bg-[#D60024] px-2.5 py-1 rounded-lg">
            {getEventPriceDisplay(event)}
          </span>
        </div>
        <div className="p-4 space-y-2.5">
          <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-[#D60024] transition-colors leading-snug">
            {event.title || event.eventTitle}
          </h3>
          <div className="space-y-1.5 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatDate(event.startDate || event.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{getEventLocation(event)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {event.subCategory && (
              <Badge className="bg-white/[0.06] text-white/60 border-0 text-[10px] px-2 py-0.5 font-normal">
                {event.subCategory}
              </Badge>
            )}
            {event.eventStatus && (
              <Badge className="bg-[#60a5fa]/10 text-[#60a5fa] border-0 text-[10px] px-2 py-0.5 font-normal">
                {event.eventStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="w-full text-white min-h-screen">
      {showPublicHeader && <Header forceMainHeader />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Browse Events</h1>
          <p className="text-sm text-white/40 mt-1">Discover amazing events happening near you</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              type="search"
              placeholder="Search events by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-white/[0.05] border-white/[0.08] text-white text-sm placeholder:text-white/30 rounded-xl focus:ring-1 focus:ring-[#D60024]/50 focus:border-[#D60024]/50"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-5 space-y-4">
          {/* Category tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider flex-shrink-0">Category</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setSelectedCategory("all"); setSelectedSubCategory("all"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-[#D60024] text-white"
                    : "bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                }`}
              >
                All Events
              </button>
              {CATEGORY_CONFIG.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                const count = filteredEvents.filter(
                  (event) => (event.category || event.mainCategory || "").toUpperCase() === cat.id
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory("all"); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#D60024] text-white"
                        : "bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                    <span className={`text-xs ml-1 ${isActive ? 'text-white/70' : 'text-white/30'}`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subcategory pills */}
          {activeSubcategories.length > 0 && (
            <div className="pt-3 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubCategory("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedSubCategory === "all"
                      ? "bg-white/[0.12] text-white"
                      : "bg-white/[0.04] text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
                  }`}
                >
                  All
                </button>
                {activeSubcategories.map((sub) => (
                  <button
                    key={sub.value}
                    onClick={() => setSelectedSubCategory(sub.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSubCategory === sub.value
                        ? "bg-[#D60024] text-white"
                        : "bg-white/[0.04] text-white/50 hover:text-white/70 hover:bg-white/[0.06]"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-white/30">Filters:</span>
              {selectedCategory !== "all" && (
                <Badge className="bg-white/[0.06] text-white/60 border-0 text-xs">
                  {CATEGORY_CONFIG.find((c) => c.id === selectedCategory)?.label}
                </Badge>
              )}
              {selectedSubCategory !== "all" && (
                <Badge className="bg-white/[0.06] text-white/60 border-0 text-xs">
                  {selectedSubCategory}
                </Badge>
              )}
              {searchQuery && (
                <Badge className="bg-white/[0.06] text-white/60 border-0 text-xs">"{searchQuery}"</Badge>
              )}
              <button onClick={clearAllFilters} className="text-xs text-white/40 hover:text-white ml-auto flex items-center gap-1">
                <X className="h-3 w-3" /> Clear all
              </button>
            </div>
          )}
        </div>

        {/* Trending Events */}
        {trendingEvents.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#D60024]" />
                Trending Now
              </h2>
              <span className="text-xs text-white/30">{trendingEvents.length} events</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {trendingEvents.map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </section>
        )}

        {/* Events by Category */}
        <div className="space-y-10">
          {groupedByCategory.map((cat) => {
            if (cat.events.length === 0) return null;
            const Icon = cat.icon;
            return (
              <section key={cat.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}18` }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: cat.color }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{cat.label}</h3>
                      <p className="text-xs text-white/30">{cat.events.length} events</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cat.events.map((event) => <EventCard key={event.id} event={event} />)}
                </div>
              </section>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse">
                <div className="h-44 bg-white/[0.06] rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/[0.08] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.06] rounded w-1/2" />
                  <div className="h-3 bg-white/[0.06] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center mt-6">
            <Search className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white mb-1">No events found</h3>
            <p className="text-sm text-white/40 mb-5">
              {searchQuery ? "Try adjusting your search or filters" : "No events available in this category"}
            </p>
            <Button onClick={clearAllFilters} className="bg-[#D60024] hover:bg-[#b8001f] text-white text-sm h-9 px-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
