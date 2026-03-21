import { useCallback, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Calendar, MapPin, Search, Ticket, Users, ChevronRight, AlertCircle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePromoterEvents } from "@/hooks/usePromoterEvents";

const PromoterEvents = () => {
  const { currency, statusBadge } = useOutletContext();
  const {
    events, loading, isFetching, error, pagination, filters,
    updateFilters, changePage,
  } = usePromoterEvents();

  const handleSearchChange = useCallback((e) => {
    updateFilters({ search: e.target.value });
  }, [updateFilters]);

  const handleStatusFilter = useCallback((status) => {
    updateFilters({ eventStatus: status });
  }, [updateFilters]);

  const paginationNumbers = useMemo(() => {
    const pages = [];
    const maxPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (maxPages <= 1) return [];

    pages.push(1);
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(maxPages - 1, currentPage + 1);

    if (startPage > 2) pages.push('...');
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== maxPages) pages.push(i);
    }
    if (endPage < maxPages - 1) pages.push('...');
    if (maxPages > 1) pages.push(maxPages);

    return pages;
  }, [pagination.totalPages, pagination.page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Events</h2>
          <p className="text-muted-foreground">All events across organizers with live status and revenue.</p>
        </div>
        <Badge variant="outline" className="text-sm py-1 px-3 border-border/70">
          {pagination.total} Events
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events (min 2 chars)..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
          {/* Subtle inline spinner while fetching */}
          {isFetching && (
            <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {["ALL", "ONGOING", "UPCOMING", "COMPLETED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-2 rounded-lg border border-border/60 transition ${
                filters.eventStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/70 text-muted-foreground hover:bg-card"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Thin progress bar when fetching — visible but non-intrusive */}
      {isFetching && !loading && (
        <div className="h-0.5 w-full bg-muted overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
        </div>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Error loading events</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial full-page spinner — only on first load */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state — only when not loading and no results */}
      {!loading && !isFetching && events.length === 0 && (
        <Card className="bg-card/70 border-border/60">
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <p>No events found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Events grid — stays visible during fetches (dims slightly) */}
      {!loading && events.length > 0 && (
        <>
          <div className={`grid grid-cols-1 xl:grid-cols-2 gap-4 transition-opacity duration-150 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {events.map((event) => {
              const ticketsSold = event.tickets.reduce((sum, ticket) => sum + ticket.soldQty, 0);
              const bookings = event._count.bookings;

              return (
                <Card key={event.id} className="bg-card/70 border-border/60">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <CardDescription className="text-muted-foreground flex flex-wrap items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.organizer?.name}
                          <span className="text-muted-foreground/60">•</span>
                          <Calendar className="w-4 h-4" />
                          {new Date(event.startDate).toLocaleDateString()}
                          {event.venues[0] && (
                            <>
                              <span className="text-muted-foreground/60">•</span>
                              <MapPin className="w-4 h-4" />
                              {event.venues[0].city}
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusBadge(event.eventStatus)}>{event.eventStatus}</Badge>
                        {event.publishStatus && (
                          <Badge variant={event.publishStatus === "PUBLISHED" ? "success" : "secondary"}>
                            {event.publishStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Ticket className="w-4 h-4" /> Tickets
                        </p>
                        <p className="text-lg font-semibold">{ticketsSold.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Bookings</p>
                        <p className="text-lg font-semibold">{bookings.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Min Price</p>
                        <p className="text-lg font-semibold text-accent">
                          {event.tickets.length > 0 ? currency(event.tickets[0].price) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{event.category}</p>
                      </div>
                      <Link
                        to={`/promoter/events/${event.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent/80 transition"
                      >
                        View details <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => changePage(pagination.page - 1)}
                      className={!pagination.hasPrevPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>

                  {paginationNumbers.map((pageNum, idx) => (
                    <PaginationItem key={`${pageNum}-${idx}`}>
                      {pageNum === '...' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => changePage(pageNum)}
                          isActive={pageNum === pagination.page}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => changePage(pagination.page + 1)}
                      className={!pagination.hasNextPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PromoterEvents;
