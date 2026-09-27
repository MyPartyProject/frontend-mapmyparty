import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Ticket, Calendar, MapPin, Loader2, AlertCircle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketModal from "@/components/TicketModal";
import StarRating from "@/components/StarRating";
import eventPlaceholder from "@/assets/event-music.jpg";
import { apiFetch, downloadFile } from "@/config/api";
import { fetchSession, resetSessionCache } from "@/utils/auth";
import { toast } from "sonner";
import { resolveEventBannerImage } from "@/utils/eventBannerImage";

const UserDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const validateSession = useCallback(async () => {
    try {
      resetSessionCache();
      const session = await fetchSession(true);

      if (session?.isAuthenticated) {
        toast.success("Google authentication successful!");
      } else {
        toast.error("Session validation failed");
      }
    } catch (err) {
      console.error("Error validating session:", err);
      toast.error(err?.message || "Failed to validate session");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/user/bookings", { method: "GET" });
      if (response?.success && Array.isArray(response?.data?.items)) {
        setBookings(response.data.items);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.error("Failed to load bookings", err);
      setError(err?.message || "Failed to load your bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if redirected from OAuth
  useEffect(() => {
    const authParam = searchParams.get("auth");

    if (authParam === "success") {
      // Validate session (backend already set cookies)
      validateSession();

      // Clean up URL - remove query params
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, validateSession, setSearchParams]);

  const fetchUserReview = useCallback(async (eventId) => {
    try {
      const response = await apiFetch(`/api/event/${eventId}/reviews/me`, {
        method: "GET",
      });
      
      if (response?.success && response?.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      // 404 means no review exists yet, which is fine
      if (err?.status === 404) {
        return null;
      }
      console.error("Failed to fetch user review:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Fetch reviews for each booking after bookings are loaded
  useEffect(() => {
    const fetchReviewsForBookings = async () => {
      if (bookings.length === 0) return;

      const reviewsPromises = bookings.map(async (booking) => {
        const event = booking.event || {};
        if (!event.id) return null;
        
        try {
          const review = await fetchUserReview(event.id);
          return { bookingId: booking.id, review };
        } catch (err) {
          return null;
        }
      });

      const reviewsResults = await Promise.all(reviewsPromises);
      
      // Update bookings with review data
      setBookings((prevBookings) =>
        prevBookings.map((booking) => {
          const reviewResult = reviewsResults.find((r) => r?.bookingId === booking.id);
          if (reviewResult?.review) {
            return {
              ...booking,
              review: reviewResult.review,
            };
          }
          return booking;
        })
      );
    };

    if (bookings.length > 0) {
      fetchReviewsForBookings();
    }
  }, [bookings.length, fetchUserReview]);

  const tickets = useMemo(() => {
    const formatDate = (iso) => {
      if (!iso) return { date: "Date TBD", time: "" };
      const date = new Date(iso);
      return {
        date: date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: date.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
    };

    return bookings.map((booking) => {
      const event = booking.event || {};
      const venue = event.venue || {};
      
      const { date, time } = formatDate(event.startDate || booking.createdAt);
      const bookingDate = new Date(booking.createdAt || Date.now()).toLocaleDateString(
        undefined,
        { year: "numeric", month: "long", day: "numeric" }
      );

      // Build location string from venue data
      const locationParts = [];
      if (venue.fullAddress) {
        locationParts.push(venue.fullAddress);
      } else {
        if (venue.name) locationParts.push(venue.name);
        if (venue.city) locationParts.push(venue.city);
        if (venue.state) locationParts.push(venue.state);
      }
      // Fallback to event.venue if venue object is empty
      if (locationParts.length === 0 && event.venue) {
        if (event.venue.city) locationParts.push(event.venue.city);
        if (event.venue.state) locationParts.push(event.venue.state);
      }
      const location = locationParts.length > 0 
        ? locationParts.join(", ") 
        : "Location TBA";

      const primaryTicketType = "Ticket";
      const totalTickets = Number(booking.totalTickets) || 1;
      const ticketTypesList = `${primaryTicketType} (${totalTickets}x)`;

      return {
        id: booking.id,
        eventId: event.id,
        eventLink: event.organizer?.slug && event.slug ? `/events/${event.organizer.slug}/${event.slug}` : "/events",
        eventTitle: event.title || "Untitled Event",
        eventDate: date,
        eventTime: time,
        location,
        image: resolveEventBannerImage(event, eventPlaceholder),
        ticketTypes: [],
        ticketTypesList,
        primaryTicketType,
        totalTickets,
        totalPrice: Number(booking.totalAmount) || 0,
        subtotal: 0,
        platformFee: 0,
        gst: 0,
        bookingDate,
        status: (booking.status || "").toLowerCase(),
        review: booking.review || null,
        organizerName: event.organizer?.name || "N/A",
        raw: booking,
      };
    });
  }, [bookings]);

  const handleRetry = () => {
    fetchBookings();
  };

  const handleDownloadTicket = async (ticket) => {
    if (!ticket?.id) return;
    try {
      await downloadFile(`/api/booking/${encodeURIComponent(ticket.id)}/ticket/download`, `ticket-${ticket.id}.pdf`);
      toast.success("Ticket downloaded!");
    } catch (err) {
      toast.error(err?.message || "Failed to download ticket");
    }
  };

  const handleResendTicket = async (ticket) => {
    try {
      // Placeholder: call API to resend ticket if available
      // await apiFetch(`/api/user/bookings/${ticket.id}/resend`, { method: 'POST' });
      toast.success("Ticket resend requested (not implemented)");
    } catch (err) {
      console.error("Failed to resend ticket", err);
      toast.error("Failed to resend ticket");
    }
  };

  const handleOpenReviewDialog = (ticket) => {
    setSelectedBookingForReview(ticket);
    // Check if booking already has a review
    const existingReview = ticket.review || ticket.raw?.review;
    if (existingReview) {
      setReviewRating(existingReview.rating || 0);
      setReviewTitle(existingReview.title || "");
      setReviewComment(existingReview.comment || "");
    } else {
      setReviewRating(0);
      setReviewTitle("");
      setReviewComment("");
    }
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedBookingForReview(null);
    setReviewRating(0);
    setReviewTitle("");
    setReviewComment("");
  };

  const handleSubmitReview = async () => {
    if (!selectedBookingForReview) return;

    if (reviewRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!reviewComment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    setIsSubmittingReview(true);
    try {
      // Create review using the correct endpoint
      const reviewPayload = {
        rating: reviewRating,
        comment: reviewComment.trim(),
      };
      
      // Add title if provided (optional field)
      if (reviewTitle.trim()) {
        reviewPayload.title = reviewTitle.trim();
      }

      const response = await apiFetch(`/api/event/${selectedBookingForReview.eventId}/reviews`, {
        method: "POST",
        body: JSON.stringify(reviewPayload),
      });

      if (response?.success || response?.code === 201) {
        toast.success("Review submitted successfully!");
        
        // Fetch the created review to get full details
        const reviewData = await fetchUserReview(selectedBookingForReview.eventId);
        
        // Update the booking in the local state with the review
        if (reviewData) {
          setBookings((prevBookings) =>
            prevBookings.map((booking) => {
              if (booking.id === selectedBookingForReview.id) {
                return {
                  ...booking,
                  review: reviewData,
                };
              }
              return booking;
            })
          );
        }
        
        handleCloseReviewDialog();
        // Refresh bookings to ensure we have the latest data
        fetchBookings();
      } else {
        throw new Error(response?.message || "Failed to submit review");
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error(err?.message || "Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated userRole="user" />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Tickets</h1>
            <p className="text-muted-foreground text-lg">
              View and manage your event bookings
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Loading your bookings...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
                <h3 className="text-xl font-semibold">Unable to load bookings</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="accent" onClick={handleRetry}>
                  Try Again
                </Button>
                <p className="text-muted-foreground mb-6">
                  Start exploring events and book your first ticket!
                </p>
                <Button variant="accent">Browse Events</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="overflow-hidden shadow-sm border border-gray-200">
                  <div className="p-6">
                    {/* Top header row: Booking Date/ID/Payment/Amount */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                      <div>
                        <div className="text-xs font-medium text-gray-500">BOOKING DATE & TIME</div>
                        <div className="mt-1 font-semibold text-gray-800">{ticket.bookingDate} {ticket.eventTime ? `• ${ticket.eventTime}` : ""}</div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500">BOOKING ID</div>
                        <div className="mt-1 font-semibold text-gray-800">{ticket.id}</div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500">PAYMENT METHOD</div>
                        <div className="mt-1 font-semibold text-gray-800">{ticket.raw?.payment?.paymentMethod || "N/A"}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-500">BOOKING AMOUNT</div>
                        <div className="mt-1 font-semibold text-gray-800">₹{ticket.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      {/* Image */}
                      <div className="w-28 h-36 flex-shrink-0 rounded shadow-sm overflow-hidden bg-gray-100">
                        <img src={ticket.image} alt={ticket.eventTitle} className="w-full h-full object-cover" />
                      </div>

                      {/* Middle content: title, address, tickets */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{ticket.eventTitle}</h3>
                        <div className="text-sm text-gray-600 mb-3">
                          {ticket.location}
                        </div>

                        <div className="text-sm text-gray-700 font-medium">
                          {ticket.ticketTypesList || `${ticket.primaryTicketType} - ₹${ticket.totalPrice.toFixed(2)} X ${ticket.totalTickets}`}
                        </div>
                      </div>

                      {/* Right side actions */}
                      <div className="w-44 flex flex-col justify-between items-end">
                        <div className="text-sm text-gray-600">&nbsp;</div>
                        <div className="text-right">
                          <button
                            onClick={() => handleDownloadTicket(ticket)}
                            className="text-red-600 hover:underline text-sm mr-4"
                          >
                            Download Ticket
                          </button>
                          <button
                            onClick={() => handleResendTicket(ticket)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Resend Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {selectedTicket && (
            <TicketModal
              isOpen={!!selectedTicket}
              onClose={() => setSelectedTicket(null)}
              ticket={selectedTicket}
              onDownload={handleDownloadTicket}
            />
          )}

          {/* Review Dialog */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {selectedBookingForReview?.review || selectedBookingForReview?.raw?.review
                    ? "Edit Your Review"
                    : "Write a Review"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Event: {selectedBookingForReview?.eventTitle}</Label>
                </div>

                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <StarRating
                    rating={reviewRating}
                    onRatingChange={setReviewRating}
                    readonly={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-title">Review Title (Optional)</Label>
                  <Input
                    id="review-title"
                    placeholder="Give your review a title..."
                    value={reviewTitle}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 120) {
                        setReviewTitle(value);
                      }
                    }}
                    maxLength={120}
                  />
                  <p className={`text-xs ${reviewTitle.length >= 120 ? "text-destructive" : "text-muted-foreground"}`}>
                    {reviewTitle.length}/120 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-comment">Your Review *</Label>
                  <Textarea
                    id="review-comment"
                    placeholder="Share your experience at this event..."
                    value={reviewComment}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        setReviewComment(value);
                      }
                    }}
                    rows={5}
                    className="resize-none"
                    maxLength={1000}
                  />
                  <p className={`text-xs ${reviewComment.length >= 1000 ? "text-destructive" : "text-muted-foreground"}`}>
                    {reviewComment.length}/1000 characters
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCloseReviewDialog}
                  disabled={isSubmittingReview}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;
