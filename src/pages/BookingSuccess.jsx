import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  Loader2,
  MapPin,
  Ticket,
} from "lucide-react";
import { apiFetch, downloadFile } from "@/config/api";
import { toast } from "sonner";

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [bookingPayload, setBookingPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bookingId) {
      navigate("/dashboard");
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const response = await apiFetch(`/api/booking/${bookingId}`);
        if (response?.success && response?.data) {
          setBookingPayload(response.data);
          setError(null);
          return;
        }

        throw new Error(response?.message || "Failed to fetch booking details");
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(err?.message || "Failed to load booking details");
        toast.error(err?.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, navigate]);

  const booking = bookingPayload?.booking || null;
  const event = bookingPayload?.event || null;
  const tickets = bookingPayload?.tickets || [];

  const totalTickets = useMemo(
    () => tickets.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [tickets]
  );

  const subtotal = Math.max(
    0,
    Number(booking?.totalAmount || 0) - Number(booking?.platformFeeTotal || 0) - Number(booking?.gstTotal || 0)
  );

  const venueName = event?.venue?.name || "Venue TBA";
  const venueCity = event?.venue?.city || "";
  const eventDate = event?.startDate || null;
  const eventTime = eventDate
    ? new Date(eventDate).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(value || 0));

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const taxSummary = useMemo(() => {
    if ((booking?.gstType || "").includes("IGST")) {
      return {
        label: "IGST",
        amount: Number(booking?.gstTotal || 0),
      };
    }

    return {
      label: "GST",
      amount: Number(booking?.gstTotal || 0),
    };
  }, [booking?.gstTotal, booking?.gstType]);

  const handleDownloadTickets = async () => {
    try {
      toast.info("Preparing your tickets...");
      await downloadFile(
        `/api/booking/${bookingId}/ticket/download`,
        `tickets-${bookingIdLabel}.pdf`
      );
      toast.success("Ticket download started");
    } catch (err) {
      toast.error(err?.message || "Failed to download tickets");
    }
  };

  const bookingIdLabel = booking?.id ? booking.id.slice(0, 8).toUpperCase() : "BOOKING";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-red-600" />
          <p className="text-sm text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking || !event) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-red-600/5 blur-3xl" />
            <div className="absolute right-0 top-28 h-64 w-64 rounded-full bg-red-600/5 blur-3xl" />
          </div>
          <div className="relative mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
            <Card className="w-full border border-border/70 bg-card text-foreground shadow-[var(--shadow-elegant)]">
              <CardContent className="space-y-4 p-5 text-center sm:p-6">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/80">
                  <Ticket className="h-6 w-6 text-red-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Booking status</p>
                  <h1 className="text-2xl font-bold tracking-[0.02em] text-foreground sm:text-3xl">Payment completed</h1>
                  <p className="text-sm text-muted-foreground">
                    We could not load the booking summary screen, but your payment may still have been processed.
                  </p>
                  <p className="text-xs text-muted-foreground">{error || "Booking summary unavailable"}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    onClick={() => navigate("/dashboard/bookings")}
                    className="bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active text-sm"
                  >
                    View My Bookings
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="border-border bg-background text-foreground hover:bg-muted hover:text-foreground text-sm"
                  >
                    Go To Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-red-600/5 blur-3xl" />
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-red-600/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-xl px-4 py-10 sm:py-12">
          <Card className="border border-border/70 bg-card text-foreground shadow-[var(--shadow-elegant)]">
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-gray-700/50 bg-gray-800/80">
                  <CheckCircle2 className="h-6 w-6 text-red-600" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Booking confirmed</p>
                  <h1 className="text-2xl font-bold tracking-[0.02em] text-foreground sm:text-3xl">Your tickets are ready</h1>
                  <p className="text-sm text-muted-foreground">
                    The payment went through successfully and your booking has been confirmed.
                  </p>
                </div>
              </div>

              <Badge className="border border-red-600/20 bg-red-600/10 px-2.5 py-1 text-[10px] text-red-300">
                Booking ID: {bookingIdLabel}
              </Badge>

              <div className="rounded-xl border border-border/70 bg-muted/35 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Event</p>
                    <p className="truncate text-lg font-semibold text-foreground">{event.name || "Event"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tickets</p>
                    <p className="font-semibold text-red-600">{totalTickets}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span>{formatDate(eventDate)}</span>
                  </div>
                  {eventTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span>{eventTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="truncate">
                      {venueName}
                      {venueCity ? `, ${venueCity}` : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform charges</span>
                  <span className="text-foreground">{formatCurrency(booking.platformFeeTotal || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{taxSummary.label}</span>
                  <span className="text-foreground">{formatCurrency(taxSummary.amount)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Paid</span>
                  <span className="text-red-600">{formatCurrency(booking.totalAmount || 0)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/80">
                  <Ticket className="h-4 w-4 text-red-600" />
                  Ticket Summary
                </h3>
                <div className="space-y-2">
                  {tickets.map((item) => (
                    <div
                      key={item.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border/70 bg-muted/35 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name || "Ticket"}</p>
                        <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(item.subtotal)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleDownloadTickets}
                  className="w-full bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active text-sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Tickets
                </Button>
                <Button
                  onClick={() => navigate("/dashboard/bookings")}
                  variant="outline"
                  className="w-full border-border bg-background text-foreground hover:bg-muted hover:text-foreground text-sm"
                >
                  View My Bookings
                </Button>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/35 px-4 py-3 text-center text-xs leading-5 text-muted-foreground sm:text-sm">
                Your tickets contain QR codes that will be scanned at the event entrance. Please carry a valid ID along
                with your tickets.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
