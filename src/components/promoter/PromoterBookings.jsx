import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Filter,
  Loader,
  Ticket,
  Wallet2,
  XCircle,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePromoterBookings } from "@/hooks/usePromoterBookings";

const statusVariant = (status) => {
  const normalized = String(status || "").toUpperCase();
  const map = {
    CONFIRMED: "success",
    SUCCESS: "success",
    PENDING: "default",
    CANCELLED: "secondary",
    FAILED: "destructive",
    REFUNDED: "destructive",
    UNPAID: "secondary",
  };

  return map[normalized] || "outline";
};

const statusLabel = (status) =>
  String(status || "UNKNOWN")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const PromoterBookings = () => {
  const { currency } = useOutletContext();
  const {
    summary,
    eventHighlights,
    bookings,
    loading,
    isFetching,
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
  } = usePromoterBookings();

  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!bookings.length) {
      setSelectedId("");
      return;
    }

    if (!selectedId || !bookings.some((booking) => booking.id === selectedId)) {
      setSelectedId(bookings[0].id);
    }
  }, [bookings, selectedId]);

  const selectedBooking = bookings.find((item) => item.id === selectedId) || bookings[0] || null;

  const handleSearchChange = useCallback(
    (e) => {
      updateFilters({ search: e.target.value });
    },
    [updateFilters]
  );

  const handleStatusFilter = useCallback(
    (status) => {
      setSelectedId("");
      updateFilters({ status });
    },
    [updateFilters]
  );

  const formatDateTime = useCallback((value) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, []);

  const paymentStatusIcon = useMemo(() => {
    const normalized = String(selectedBooking?.paymentStatus || "").toUpperCase();
    if (normalized === "SUCCESS") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (normalized === "FAILED" || normalized === "REFUNDED") return <XCircle className="w-4 h-4 text-amber-400" />;
    return <AlertTriangle className="w-4 h-4 text-sky-400" />;
  }, [selectedBooking?.paymentStatus]);

  const paginationNumbers = useMemo(() => {
    const pages = [];
    const maxPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (maxPages <= 1) return [];

    pages.push(1);
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(maxPages - 1, currentPage + 1);

    if (startPage > 2) pages.push("...");
    for (let pageNum = startPage; pageNum <= endPage; pageNum += 1) {
      if (pageNum !== 1 && pageNum !== maxPages) pages.push(pageNum);
    }
    if (endPage < maxPages - 1) pages.push("...");
    if (maxPages > 1) pages.push(maxPages);

    return pages;
  }, [pagination.page, pagination.totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground">Platform-wide booking ledger, payment state, and refund movement.</p>
        </div>
        <Badge variant="outline" className="text-sm py-1 px-3 border-border/70">
          {pagination.total} Bookings
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today</CardTitle>
            <CardDescription>Live booking pulse</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary?.today?.count || 0}</p>
            <p className="text-sm text-muted-foreground">
              {currency(summary?.today?.value || 0)} | platform {currency(summary?.today?.platformFee || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Last 7 Days</CardTitle>
            <CardDescription>Across all events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary?.week?.count || 0}</p>
            <p className="text-sm text-muted-foreground">
              {currency(summary?.week?.value || 0)} | platform {currency(summary?.week?.platformFee || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Refunds & Pending Payments</CardTitle>
            <CardDescription>Transactions needing attention</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> {summary?.refunds?.count || 0} refunds
            </p>
            <p className="text-sm text-muted-foreground">
              Refund value {currency(summary?.refunds?.value || 0)} | pending {summary?.pendingPayments?.count || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by booking, user, event, or transaction..."
            className="pl-9"
          />
          {isFetching && (
            <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {["ALL", "CONFIRMED", "PENDING", "REFUNDED", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-3 py-2 rounded-lg border border-border/60 transition ${
                filters.status === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/70 text-muted-foreground hover:bg-card"
              }`}
            >
              {status === "ALL" ? "All" : statusLabel(status)}
            </button>
          ))}
        </div>
      </div>

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
              <p className="font-semibold text-destructive">Error loading bookings</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && !isFetching && bookings.length === 0 && (
        <Card className="bg-card/70 border-border/60">
          <CardContent className="pt-6 text-center text-muted-foreground py-12">
            <p>No bookings found. Try adjusting your filters.</p>
          </CardContent>
        </Card>
      )}

      {!loading && bookings.length > 0 && (
        <>
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
            <Card className="bg-card/70 border-border/60">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  <CardTitle className="text-base">Booking ledger</CardTitle>
                </div>
                <CardDescription>Detailed transaction timeline</CardDescription>
              </CardHeader>
              <CardContent className={`space-y-2 transition-opacity duration-150 ${isFetching ? "opacity-60" : "opacity-100"}`}>
                {bookings.map((booking) => (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedId(booking.id)}
                    className={`w-full text-left rounded-lg border px-3 py-3 text-sm transition ${
                      selectedBooking?.id === booking.id
                        ? "border-primary/60 bg-card"
                        : "border-border/60 bg-card/80 hover:bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold break-all">{booking.id}</p>
                        <p className="text-sm">{booking.eventTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.userName} | {booking.eventOrganizer}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(booking.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-accent">{currency(booking.amount)}</p>
                        <div className="mt-1 flex flex-col items-end gap-1">
                          <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
                          <Badge variant={statusVariant(booking.paymentStatus)}>{statusLabel(booking.paymentStatus)}</Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/70 border-border/60">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wallet2 className="w-4 h-4" />
                  <CardTitle className="text-base">Booking detail</CardTitle>
                </div>
                <CardDescription>Full ticket, payment, and user metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {selectedBooking ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Booking ID</p>
                        <p className="font-semibold break-all">{selectedBooking.id}</p>
                      </div>
                      <Badge variant={statusVariant(selectedBooking.status)}>{statusLabel(selectedBooking.status)}</Badge>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">Event</p>
                      <p className="font-semibold">{selectedBooking.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBooking.eventOrganizer}
                        {selectedBooking.eventCity ? ` | ${selectedBooking.eventCity}` : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-semibold">{selectedBooking.userName}</p>
                      <p className="text-xs text-muted-foreground">{selectedBooking.userEmail || "No email"}</p>
                      <p className="text-xs text-muted-foreground">{selectedBooking.userPhone || "No phone"}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Tickets</p>
                        <p className="font-semibold">{selectedBooking.tickets}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Platform fee</p>
                        <p className="font-semibold">{currency(selectedBooking.platformFee)}</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">GST</p>
                        <p className="font-semibold">{currency(selectedBooking.gstAmount)}</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">Payment status</p>
                      <p className="font-semibold flex items-center gap-2">
                        {paymentStatusIcon}
                        {statusLabel(selectedBooking.paymentStatus)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedBooking.transactionId || "No transaction reference"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tickets breakdown</p>
                      <div className="space-y-2 mt-2">
                        {selectedBooking.bookingItems.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{item.quantity} x {item.name}</span>
                            <span>{currency(item.subtotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No booking selected.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-2">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => changePage(pagination.page - 1)}
                      className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {paginationNumbers.map((pageNum, idx) => (
                    <PaginationItem key={`${pageNum}-${idx}`}>
                      {pageNum === "..." ? (
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
                      className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <CardTitle className="text-base">Top booking events</CardTitle>
              </div>
              <CardDescription>Highest grossing confirmed booking activity</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {eventHighlights.length > 0 ? (
                eventHighlights.map((event) => (
                  <div key={event.id} className="rounded-lg border border-border/60 bg-card/80 p-3 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{event.title}</p>
                      <Badge variant={statusVariant(event.status)}>{statusLabel(event.status)}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">{event.organizer}</p>
                    <p className="text-muted-foreground">Tickets sold: {Number(event.ticketsSold || 0).toLocaleString()}</p>
                    <p className="text-muted-foreground">Bookings: {Number(event.bookings || 0).toLocaleString()}</p>
                    <p className="text-muted-foreground text-xs">Gross {currency(event.gross || 0)}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-border/60 bg-card/80 p-4 text-muted-foreground">
                  No confirmed booking highlights yet.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PromoterBookings;
