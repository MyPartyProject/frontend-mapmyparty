import { useState } from "react";
import { Search, Loader2, Calendar, MapPin, Users, ArrowRight } from "lucide-react";
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

const ListTableTemplate = ({
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
  const [imageSrcs, setImageSrcs] = useState({});

  const handleImageError = (eventId) => {
    setImageSrcs(prev => ({ ...prev, [eventId]: eventMusic }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <main className="flex-1">
        {/* Minimalist Header */}
        <section className="bg-background border-b border-border">
          <div className="container py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Events</h1>
                <p className="text-muted-foreground">
                  Browse and discover events near you
                </p>
              </div>
              
              {/* Search */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filters Sidebar + Content */}
        <section className="flex-1 py-8">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters */}
              <aside className="lg:w-64 flex-shrink-0">
                <Card className="sticky top-24">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Category</h3>
                      <Select 
                        value={filters.category || "all"} 
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
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
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Sort By</h3>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                          <SelectItem value="popularity">Popularity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </Button>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        {pagination.totalEvents || sortedEvents.length} events found
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </aside>

              {/* Main Content - List View */}
              <div className="flex-1">
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
                        <p className="text-2xl font-semibold mb-2">No events found</p>
                        <p className="text-muted-foreground">
                          Try adjusting your filters or check back later for new events
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedEvents.map((event) => {
                          const eventId = event.id || event.eventId;
                          const imageSrc = imageSrcs[eventId] || getEventImage(event);

                          return (
                            <Link
                              key={eventId}
                              to={`/events/${event.organizer?.slug || 'organizer'}/${event.slug || eventId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Card className="group overflow-hidden border-border hover:shadow-lg transition-all duration-300 hover:border-primary cursor-pointer">
                                <div className="flex flex-col md:flex-row">
                                  {/* Image */}
                                  <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                                    <img
                                      src={imageSrc}
                                      alt={getEventTitle(event)}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                      onError={() => handleImageError(eventId)}
                                    />
                                    <div className="absolute top-3 left-3">
                                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                                        {getEventCategory(event)}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <CardContent className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                      <h3 className="font-bold text-xl mb-3 group-hover:text-accent-foreground transition-colors line-clamp-2">
                                        {getEventTitle(event)}
                                      </h3>

                                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4" />
                                          <span>{formatDate(event.startDate || event.date)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-4 h-4" />
                                          <span>{getEventLocation(event)}</span>
                                        </div>
                                        {(event._count?.bookings || event.stats?.totalTicketsSold || event.attendees) && (
                                          <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>{event._count?.bookings || event.stats?.totalTicketsSold || event.attendees} attending</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                      <div>
                                        {getEventPriceDisplay(event) && (
                                          <span className="text-2xl font-bold text-accent-foreground">
                                            {getEventPriceDisplay(event)}
                                          </span>
                                        )}
                                      </div>
                                      <Button variant="accent" size="sm" className="gap-2">
                                        View Details
                                        <ArrowRight className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </div>
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ListTableTemplate;

