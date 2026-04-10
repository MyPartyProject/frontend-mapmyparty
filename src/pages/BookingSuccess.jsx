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
  Mail,
  MapPin,
  Ticket,
} from "lucide-react";
import { apiFetch, buildUrl } from "@/config/api";
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
  const user = bookingPayload?.user || null;
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

  const handleDownloadTickets = () => {
    try {
      toast.info("Preparing your tickets...");
      window.open(buildUrl(`booking/${bookingId}/ticket/download`), "_blank", "noopener,noreferrer");
      toast.success("Ticket download started");
    } catch (err) {
      toast.error("Failed to download tickets");
    }
  };

  const bookingIdLabel = booking?.id ? booking.id.slice(0, 8).toUpperCase() : "BOOKING";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[#D60024]" />
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
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#D60024]/18 blur-3xl" />
            <div className="absolute right-0 top-28 h-64 w-64 rounded-full bg-[#ff4d67]/10 blur-3xl" />
          </div>
          <div className="relative mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
            <Card className="w-full border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <CardContent className="space-y-5 p-6 sm:p-8 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#D60024]/30 bg-[#D60024]/10">
                  <Ticket className="h-7 w-7 text-[#D60024]" />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#ff9cae]">Booking status</p>
                  <h1 className="text-2xl sm:text-3xl font-medium tracking-[0.02em]">Payment completed</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    We could not load the booking summary screen, but your payment may still have been processed.
                  </p>
                  <p className="text-xs text-muted-foreground/80">{error || "Booking summary unavailable"}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate("/dashboard/bookings")}
                    className="bg-gradient-to-r from-[#D60024] to-[#ff4d67] text-white text-sm"
                  >
                    View My Bookings
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="border-border/60 bg-card text-foreground hover:bg-white/5 text-sm"
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
          <div className="absolute -left-28 top-0 h-80 w-80 rounded-full bg-[#D60024]/18 blur-3xl" />
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-[#ff4d67]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:py-12">
          <div className="mb-8 text-center space-y-3">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#D60024]/25 bg-[#D60024]/10">
              <CheckCircle2 className="h-8 w-8 text-[#D60024]" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#ff9cae]">Booking confirmed</p>
            <h1 className="text-3xl sm:text-4xl font-medium tracking-[0.02em]">Your tickets are ready</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              The payment went through successfully and your booking has been confirmed.
            </p>
            <Badge className="border border-[#D60024]/25 bg-[#D60024]/10 text-[#ffb7c4] text-xs px-3 py-1">
              Booking ID: {bookingIdLabel}
            </Badge>
          </div>

          <div className="grid gap-6">
            <Card className="border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <CardContent className="space-y-6 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Event</p>
                    <h2 className="text-2xl sm:text-3xl font-medium tracking-[0.01em]">{event.name || "Event"}</h2>
                    <div className="grid gap-2 text-sm text-foreground/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#D60024]" />
                        <span>{formatDate(eventDate)}</span>
                      </div>
                      {eventTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#D60024]" />
                          <span>{eventTime}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-[#D60024]" />
                        <span>
                          {venueName}
                          {venueCity ? `, ${venueCity}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3 text-sm sm:min-w-[180px]">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tickets</p>
                    <p className="mt-1 text-2xl font-semibold text-[#D60024]">{totalTickets}</p>
                    <p className="text-xs text-muted-foreground">Booked successfully</p>
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80">
                    <Ticket className="h-4 w-4 text-[#D60024]" />
                    Ticket Summary
                  </h3>
                  <div className="space-y-2">
                    {tickets.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-card/70 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name || "Ticket"}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(item.subtotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border/60" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-foreground/75">
                    <span>Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/75">
                    <span>Platform charges</span>
                    <span className="text-foreground">{formatCurrency(booking.platformFeeTotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/75">
                    <span>{taxSummary.label}</span>
                    <span className="text-foreground">{formatCurrency(taxSummary.amount)}</span>
                  </div>
                  <div className="h-px bg-border/60 pt-1" />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Total Paid</span>
                    <span className="text-[#D60024]">{formatCurrency(booking.totalAmount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="flex items-start gap-3 p-4">
                  <Mail className="mt-0.5 h-5 w-5 text-[#D60024]" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Confirmation email sent</p>
                    <p className="text-sm text-muted-foreground">
                      A booking confirmation with your tickets has been sent to {user?.email || "your registered email"}.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="flex items-start gap-3 p-4">
                  <Download className="mt-0.5 h-5 w-5 text-[#D60024]" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Download anytime</p>
                    <p className="text-sm text-muted-foreground">
                      Your tickets are available as PDFs for easy access at the venue.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={handleDownloadTickets}
                className="w-full bg-gradient-to-r from-[#D60024] to-[#ff4d67] hover:from-[#b5001e] hover:to-[#e6445d] text-white text-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Tickets
              </Button>
              <Button
                onClick={() => navigate("/dashboard/bookings")}
                variant="outline"
                className="w-full border-border/60 bg-card text-foreground hover:bg-white/5 text-sm"
              >
                View My Bookings
              </Button>
            </div>

            <div className="text-center text-xs sm:text-sm text-muted-foreground space-y-1">
              <p>Your tickets contain QR codes that will be scanned at the event entrance.</p>
              <p>Please carry a valid ID along with your tickets.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
