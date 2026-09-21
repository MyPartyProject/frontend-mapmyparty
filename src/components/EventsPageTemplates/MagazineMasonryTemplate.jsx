import { useState } from "react";
import { Search, Loader2, Calendar, MapPin, Users, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import eventMusic from "@/assets/event-music.jpg";

const MagazineMasonryTemplate = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  handleSearchChange,
  handleCategoryChange,
  handleClearFilters,
  filters,
  loading,
  error,
  sortedEvents,
  pagination,
  updateFilters,
  getEventTitle,
  formatDate,
  getEventLocation,
  getEventImage,
  getEventCategory,
  getEventPriceDisplay,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [imageSrcs, setImageSrcs] = useState({});

  const handleImageError = (eventId) => {
    setImageSrcs(prev => ({ ...prev, [eventId]: eventMusic }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <main className="flex-1">
        {/* Hero Section with Overlay */}
        <section className="relative bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground py-20 overflow-hidden">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          ></div>
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
                Discover Your Next Experience
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8">
                Curated events that inspire, entertain, and connect
              </p>
              
              {/* Search Bar in Hero */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search events, artists, venues..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-background/95 backdrop-blur-sm border-0 shadow-xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Compact Filter Bar */}
        <section className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
                
                {showFilters && (
                  <div className="flex items-center gap-3 flex-1">
                    <Select 
                      value={filters.category || "all"} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="food">Food & Drink</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="arts">Arts & Culture</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="popularity">Popularity</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleClearFilters}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {pagination.totalEvents || sortedEvents.length} events
              </div>
            </div>
          </div>
        </section>

        {/* Magazine Masonry Layout */}
        <section className="py-12">
          <div className="container">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-accent-foreground mb-4" />
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {sortedEvents.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-3xl font-bold mb-2">No events found</p>
                    <p className="text-muted-foreground text-lg">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                ) : (
                  <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                    {sortedEvents.map((event, index) => {
                      const eventId = event.id || event.eventId;
                      const imageSrc = imageSrcs[eventId] || getEventImage(event);
                      const isLarge = index % 7 === 0; // Make every 7th item larger

                      return (
                        <Link
                          key={eventId}
                          to={`/events/${event.organizer?.slug || 'organizer'}/${event.slug || eventId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Card className={`group overflow-hidden border-border hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer break-inside-avoid mb-6 ${isLarge ? 'md:col-span-2' : ''}`}>
                            <div className="relative overflow-hidden aspect-[4/3]">
                              <img
                                src={imageSrc}
                                alt={getEventTitle(event)}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                onError={() => handleImageError(eventId)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                              
                              <div className="absolute top-3 left-3">
                                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm font-semibold">
                                  {getEventCategory(event)}
                                </Badge>
                              </div>
                              
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="font-bold text-xl mb-2 line-clamp-2 group-hover:text-accent-foreground transition-colors text-foreground">
                                  {getEventTitle(event)}
                                </h3>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(event.startDate || event.date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span className="line-clamp-1">{getEventLocation(event)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {event._count?.bookings || event.stats?.totalTicketsSold || event.attendees ? (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>{event._count?.bookings || event.stats?.totalTicketsSold || event.attendees} going</span>
                                    </div>
                                  ) : null}
                                </div>
                                {getEventPriceDisplay(event) && (
                                  <span className="text-lg font-bold text-accent-foreground">
                                    {getEventPriceDisplay(event)}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => updateFilters({ page: pagination.page - 1 })}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button variant="outline" disabled>
                      Page {pagination.page} of {pagination.totalPages}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => updateFilters({ page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default MagazineMasonryTemplate;

