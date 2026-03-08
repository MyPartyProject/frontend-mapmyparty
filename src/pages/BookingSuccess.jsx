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

  const handleDownloadTickets = () => {
    try {
      toast.info("Preparing your tickets...");
      window.open(buildUrl(`booking/${bookingId}/ticket/download`), "_blank", "noopener,noreferrer");
      toast.success("Ticket download started");
    } catch (err) {
      toast.error("Failed to download tickets");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0c1120] to-[#05070f] flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#D60024]" />
          <p className="text-white/70">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0c1120] to-[#05070f] text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="bg-white/5 border-white/10 shadow-xl">
            <CardContent className="p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30">
                <Ticket className="w-8 h-8 text-amber-300" />
              </div>
              <h1 className="text-2xl font-bold">Payment completed</h1>
              <p className="text-white/70">
                We could not load the booking summary screen, but your payment may still have been processed.
              </p>
              <p className="text-sm text-white/50">{error || "Booking summary unavailable"}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate("/dashboard/bookings")}
                  className="bg-gradient-to-r from-[#D60024] to-[#ff4d67] text-white"
                >
                  View My Bookings
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Go To Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0c1120] to-[#05070f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 mb-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Booking Confirmed!</h1>
          <p className="text-white/70 text-lg">Your tickets have been booked successfully</p>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50 px-4 py-1">
            Booking ID: {booking.id?.slice(0, 8).toUpperCase()}
          </Badge>
        </div>

        <Card className="bg-white/5 border-white/10 shadow-xl mb-6">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white">{event.name || "Event"}</h2>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="w-4 h-4 text-[#D60024]" />
                  <span>{formatDate(eventDate)}</span>
                </div>
                {eventTime && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock className="w-4 h-4 text-[#D60024]" />
                    <span>{eventTime}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-4 h-4 text-[#D60024]" />
                  <span>
                    {venueName}
                    {venueCity ? `, ${venueCity}` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10" />

            <div className="space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#D60024]" />
                Your Tickets ({totalTickets})
              </h3>
              <div className="space-y-2">
                {tickets.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div>
                      <p className="font-medium text-white">{item.name || "Ticket"}</p>
                      <p className="text-xs text-white/60">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-white">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>Subtotal</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Platform Fee</span>
                <span className="text-white">{formatCurrency(booking.platformFeeTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>GST ({(booking.gstType || "IGST").replace(/_/g, " + ")})</span>
                <span className="text-white">{formatCurrency(booking.gstTotal || 0)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Paid</span>
                <span className="text-[#D60024]">{formatCurrency(booking.totalAmount || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-200">Confirmation email sent</p>
              <p className="text-blue-300/80">
                A booking confirmation with your tickets has been sent to {user?.email || "your registered email"}.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={handleDownloadTickets}
            className="w-full bg-gradient-to-r from-[#D60024] to-[#ff4d67] hover:from-[#b5001e] hover:to-[#e6445d] text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Tickets
          </Button>
          <Button
            onClick={() => navigate("/dashboard/bookings")}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            View My Bookings
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-white/60 space-y-2">
          <p>Your tickets contain QR codes that will be scanned at the event entrance.</p>
          <p>Please carry a valid ID along with your tickets.</p>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
