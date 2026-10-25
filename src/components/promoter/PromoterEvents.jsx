import { useCallback, useMemo, useEffect } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Search, Users, ChevronRight, AlertCircle, Loader } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const { currency } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const reviewStatus = params.get('reviewStatus') || 'ALL';
  const {
    events, loading, isFetching, error, pagination, filters,
    updateFilters, changePage,
  } = usePromoterEvents({ reviewStatus });
  useEffect(() => { updateFilters({ reviewStatus }); }, [reviewStatus, updateFilters]);

  const handleSearchChange = useCallback((e) => {
    updateFilters({ search: e.target.value });
  }, [updateFilters]);

  const handleStatusFilter = useCallback((status) => {
    updateFilters({ eventStatus: status });
  }, [updateFilters]);

  const handlePublishStatusFilter = useCallback((publishStatus) => {
    updateFilters({ publishStatus });
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
    <div className="min-w-0 space-y-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{reviewStatus === 'PENDING' ? 'Pending event reviews' : 'Events'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">All events across organizers with live status and revenue.</p>
        </div>
        <Badge variant="outline" className="shrink-0 border-border/70 px-2 py-1 text-xs">
          {pagination.total} Events
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search events" placeholder="Search events (min 2 chars)..." value={filters.search} onChange={handleSearchChange} className="h-11 pl-9 pr-10 text-sm md:h-9 [@media(pointer:coarse)]:h-11" />
          {isFetching && <Loader className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Review status</span>
            <select value={reviewStatus} onChange={e => setParams(e.target.value === 'ALL' ? {} : { reviewStatus: e.target.value })} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 [@media(pointer:coarse)]:h-11">
              {['ALL', 'PENDING', 'CHANGES_REQUIRED'].map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Event status</span>
            <select value={filters.eventStatus} onChange={e => handleStatusFilter(e.target.value)} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 [@media(pointer:coarse)]:h-11">
              {['ALL', 'ONGOING', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="min-w-0 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Publish status</span>
            <select value={filters.publishStatus} onChange={e => handlePublishStatusFilter(e.target.value)} className="h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 [@media(pointer:coarse)]:h-11">
              {['ALL', 'DRAFT', 'PENDING', 'PUBLISHED'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Thin progress bar when fetching — visible but non-intrusive */}
      {isFetching && !loading && (
        <div className="h-0.5 w-full bg-muted overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-primary rounded-full animate-pulse light:bg-primaryCTA" />
        </div>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="flex items-start gap-3 p-4">
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
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
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
                <Card key={event.id} className="flex min-w-0 flex-col border-border/60 bg-card/70">
                  <CardHeader className="space-y-2 p-4 pb-3">
                    <CardTitle className="break-words text-base leading-snug [overflow-wrap:anywhere]">{event.title}</CardTitle>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs leading-5 text-muted-foreground">
                      <span className="inline-flex min-w-0 max-w-full items-start gap-1.5"><Users className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{event.organizer?.name}</span></span>
                      <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" />{new Date(event.startDate).toLocaleDateString()}</span>
                      {event.venues[0] && <span className="inline-flex min-w-0 max-w-full items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 [overflow-wrap:anywhere]">{event.venues[0].city}</span></span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-0">
                    <dl className="grid grid-cols-3 gap-3 border-y border-border/50 py-3">
                      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Tickets</dt><dd className="mt-1 break-words text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">{ticketsSold.toLocaleString()}</dd></div>
                      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Bookings</dt><dd className="mt-1 break-words text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">{bookings.toLocaleString()}</dd></div>
                      <div className="min-w-0"><dt className="text-xs text-muted-foreground">Min price</dt><dd className="mt-1 break-words text-sm font-semibold tabular-nums text-accent light:text-accent-foreground [overflow-wrap:anywhere]">{event.tickets.length > 0 ? currency(event.tickets[0].price) : 'N/A'}</dd></div>
                    </dl>
                    <div className="mt-auto flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0"><p className="text-xs text-muted-foreground">Category</p><p className="text-sm font-medium [overflow-wrap:anywhere]">{event.category}</p></div>
                      <Button asChild variant="outline" size="sm" className="h-11 w-full shrink-0 text-sm sm:w-auto md:h-9 [@media(pointer:coarse)]:h-11">
                        <Link to={'/promoter/events/' + event.id}>View details <ChevronRight className="h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination>
                <PaginationContent className="flex-wrap justify-center gap-1 [&_a]:h-11 [&_a]:min-w-11 md:[&_a]:h-9 md:[&_a]:min-w-9 [@media(pointer:coarse)]:[&_a]:h-11 [@media(pointer:coarse)]:[&_a]:min-w-11">
                  <PaginationItem>
                    <PaginationPrevious
                      role="button"
                      tabIndex={pagination.hasPrevPage ? 0 : -1}
                      aria-disabled={!pagination.hasPrevPage}
                      onKeyDown={(event) => { if (pagination.hasPrevPage && ['Enter', ' '].includes(event.key)) { event.preventDefault(); changePage(pagination.page - 1); } }}
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
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); changePage(pageNum); } }}
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
                      role="button"
                      tabIndex={pagination.hasNextPage ? 0 : -1}
                      aria-disabled={!pagination.hasNextPage}
                      onKeyDown={(event) => { if (pagination.hasNextPage && ['Enter', ' '].includes(event.key)) { event.preventDefault(); changePage(pagination.page + 1); } }}
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
