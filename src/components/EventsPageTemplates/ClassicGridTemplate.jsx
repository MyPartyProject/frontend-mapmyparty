import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EventCard from "@/components/EventCard";

const ClassicGridTemplate = ({
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
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground py-12">
          <div className="container">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Events</h1>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b border-border bg-background sticky top-16 z-40">
          <div className="container py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select 
                value={filters.category || "all"} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
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
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                className="md:w-auto"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-12">
          <div className="container">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    Showing {pagination.totalEvents || sortedEvents.length} events
                  </p>
                </div>

                {sortedEvents.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-2xl font-semibold mb-2">No events found</p>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or check back later for new events
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedEvents.map((event) => (
                      <EventCard
                        key={event.id || event.eventId}
                        id={event.id || event.eventId}
                        organizerSlug={event.organizer?.slug}
                        eventSlug={event.slug}
                        title={getEventTitle(event)}
                        date={formatDate(event.startDate || event.date)}
                        location={getEventLocation(event)}
                        image={getEventImage(event)}
                        category={getEventCategory(event)}
                        attendees={event._count?.bookings || event.stats?.totalTicketsSold || event.attendees || 0}
                        price={getEventPriceDisplay(event)}
                        template={event.template || "template1"}
                      />
                    ))}
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

export default ClassicGridTemplate;

