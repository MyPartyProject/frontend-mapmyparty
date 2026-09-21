import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Clock, User, Ticket as TicketIcon, QrCode, CheckCircle2, Sparkles, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";
import { buildCanonicalQrPayload } from "@/utils/qrPayload";

const VintageTicket = ({ ticket, index = 0, onClick, compact = false }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  // Determine if QR should be visible (event is ongoing or started today)
  const isQRVisible = useMemo(() => {
    if (!ticket.eventStartDate) return false;
    const now = new Date();
    const startDate = new Date(ticket.eventStartDate);
    const endDate = ticket.eventEndDate ? new Date(ticket.eventEndDate) : startDate;

    // Set start of day for comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const eventEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    eventEndDay.setHours(23, 59, 59, 999);

    // QR is visible from start day to end day
    return todayStart >= eventStartDay && now <= eventEndDay;
  }, [ticket.eventStartDate, ticket.eventEndDate]);

  // Check if event is in the past
  const isEventPast = useMemo(() => {
    if (!ticket.eventEndDate && !ticket.eventStartDate) return false;
    const endDate = new Date(ticket.eventEndDate || ticket.eventStartDate);
    endDate.setHours(23, 59, 59, 999);
    return new Date() > endDate;
  }, [ticket.eventStartDate, ticket.eventEndDate]);

  // Generate QR code
  useEffect(() => {
    if (ticket.qrCode) {
      const qrData = buildCanonicalQrPayload(ticket.qrCode);
      if (!qrData) {
        setQrCodeUrl("");
        return;
      }
      QRCode.toDataURL(qrData, {
        width: 160,
        margin: 1,
        color: {
          dark: '#111827',
          light: '#FFFFFF'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [ticket]);

  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    const d = new Date(dateString);
    if (isNaN(d)) return "TBA";
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d)) return "";
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = () => {
    if (ticket.checkedIn) return "bg-emerald-500";
    if (isEventPast) return "bg-gray-500";
    if (ticket.bookingStatus === "CONFIRMED") return "bg-primaryCTA";
    return "bg-amber-500";
  };

  const getStatusText = () => {
    if (ticket.checkedIn) return "Checked In";
    if (isEventPast) return "Past Event";
    if (ticket.bookingStatus === "CONFIRMED") return "Valid";
    return "Pending";
  };

  // Animation delay based on index
  const animationDelay = `${index * 0.1}s`;

  return (
    <div
      className="vintage-ticket-wrapper perspective-1000"
      style={{
        animationDelay,
        '--entrance-delay': animationDelay
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className={`vintage-ticket relative cursor-pointer transition-all duration-500
          ${isHovered ? 'scale-[1.02] shadow-2xl' : 'shadow-lg'}
          animate-ticket-entrance`}
      >
        {/* Main ticket body */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface via-surface to-surface border border-primary/40">
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

          {/* Top decorative bar */}
          <div className="h-2 bg-gradient-to-r from-primary via-primary to-primary" />

          {/* Decorative corner elements */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg opacity-70" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg opacity-70" />

          <div className="flex flex-col md:flex-row">
            {/* Left section - Event details */}
            <div className="flex-1 p-4 md:p-5 relative">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${getStatusColor()} text-inverse text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider shadow-sm`}>
                      {getStatusText()}
                    </Badge>
                    {ticket.checkedIn && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                    )}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-accent-foreground leading-tight line-clamp-2">
                    {ticket.eventTitle}
                  </h3>
                  <p className="text-xs text-accent-foreground/70 mt-1 font-medium uppercase tracking-wide">
                    {ticket.eventCategory} {ticket.eventSubCategory && `/ ${ticket.eventSubCategory}`}
                  </p>
                </div>

                {/* Ticket quantity badge */}
                <div className="hidden md:flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primaryCTA shadow-lg transform -rotate-6">
                  <span className="text-[9px] font-bold text-accent-foreground uppercase">Qty</span>
                  <span className="text-lg font-black text-inverse">{ticket.quantity || 1}</span>
                </div>
              </div>

              {/* Event details */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-accent-foreground">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/10 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-accent-foreground" />
                  </div>
                  <span className="text-sm font-medium">{formatDate(ticket.eventStartDate)}</span>
                  {formatTime(ticket.eventStartDate) && (
                    <>
                      <span className="text-accent-foreground">|</span>
                      <Clock className="w-3.5 h-3.5 text-accent-foreground" />
                      <span className="text-sm">{formatTime(ticket.eventStartDate)}</span>
                    </>
                  )}
                </div>

                {(ticket.venueName || ticket.venueCity) && (
                  <div className="flex items-start gap-2 text-accent-foreground">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-accent-foreground" />
                    </div>
                    <span className="text-sm line-clamp-2">
                      {[ticket.venueName, ticket.venueCity, ticket.venueState].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-accent-foreground">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/10 to-primary/10 flex items-center justify-center">
                    <TicketIcon className="w-3.5 h-3.5 text-accent-foreground" />
                  </div>
                  <span className="text-sm font-semibold">{ticket.ticketName}</span>
                  <Badge className="bg-primaryCTA/20 text-accent-foreground text-[10px] border border-primary/30">
                    {ticket.ticketType}
                  </Badge>
                </div>
              </div>

              {/* Ticket quantity (mobile) */}
              <div className="flex md:hidden items-center justify-between mt-4 pt-3 border-t border-dashed border-primary/40">
                <span className="text-xs text-accent-foreground/60 uppercase tracking-wide">Quantity</span>
                <span className="text-xl font-black text-accent-foreground">{ticket.quantity || 1}</span>
              </div>

              {/* Organizer */}
              {ticket.organizerName && (
                <div className="mt-3 pt-3 border-t border-dashed border-primary/40">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-accent-foreground" />
                    <span className="text-xs text-accent-foreground/60">Presented by</span>
                    <span className="text-xs font-semibold text-accent-foreground">{ticket.organizerName}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Perforated divider */}
            <div className="hidden md:flex flex-col items-center justify-center w-6 relative">
              <div className="absolute inset-y-4 w-px border-l-2 border-dashed border-primary/50" />
              {/* Perforated holes */}
              <div className="absolute top-0 w-5 h-5 bg-background rounded-full -translate-y-1/2 shadow-inner" />
              <div className="absolute bottom-0 w-5 h-5 bg-background rounded-full translate-y-1/2 shadow-inner" />
            </div>

            {/* Right section - QR Code */}
            <div className="w-full md:w-40 p-4 md:p-5 flex flex-col items-center justify-center bg-gradient-to-b from-surface to-surface border-t md:border-t-0 md:border-l border-dashed border-primary/40">
              <div className="relative">
                {/* QR Code container */}
                <div className={`relative p-2 bg-white rounded-xl border-2 border-primary/30 shadow-inner
                  ${!isQRVisible && !ticket.checkedIn ? 'qr-blur-container' : ''}`}>
                  {qrCodeUrl ? (
                    <>
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className={`w-24 h-24 md:w-28 md:h-28 ${!isQRVisible && !ticket.checkedIn ? 'blur-md' : ''}`}
                      />
                      {/* Blur overlay with message */}
                      {!isQRVisible && !ticket.checkedIn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted rounded-xl">
                          <Sparkles className="w-5 h-5 text-accent-foreground mb-1 animate-pulse" />
                          <span className="text-[9px] font-bold text-accent-foreground text-center px-2 leading-tight">
                            Available on<br />event day
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/5 rounded-lg">
                      <QrCode className="w-10 h-10 text-accent-foreground animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Manual check-in code */}
                {ticket.manualCheckInCode && (
                  <div className="mt-2 text-center">
                    <span className="text-[8px] text-accent-foreground/60 uppercase tracking-wider block">Code</span>
                    <span className={`text-xs font-bold text-accent-foreground tracking-widest
                      ${!isQRVisible && !ticket.checkedIn ? 'blur-sm select-none' : ''}`}>
                      {ticket.manualCheckInCode.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Price tag */}
              {ticket.ticketPrice !== null && ticket.ticketPrice !== undefined && (
                <div className="mt-3 px-4 py-1.5 bg-secondary rounded-full shadow-md">
                  <span className="text-sm font-bold text-accent-foreground">
                    {ticket.ticketPrice > 0 ? `₹${ticket.ticketPrice.toLocaleString()}` : 'FREE'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom decorative strip */}
          <div className="h-3 bg-gradient-to-r from-primary via-primary to-primary relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-around">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-muted rounded-full" />
              ))}
            </div>
          </div>

          {/* Bottom corner elements */}
          <div className="absolute bottom-5 left-4 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg opacity-70" />
          <div className="absolute bottom-5 right-4 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg opacity-70" />
        </div>

        {/* Ticket stub tear effect */}
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-background rounded-full" />
          ))}
        </div>
      </div>

      <style jsx>{`
        .vintage-ticket-wrapper {
          perspective: 1000px;
        }

        @keyframes ticketEntrance {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-ticket-entrance {
          animation: ticketEntrance 0.5s ease-out forwards;
          animation-delay: var(--entrance-delay, 0s);
          opacity: 0;
        }

        .qr-blur-container::after {
          content: '';
          position: absolute;
          inset: 0;
          backdrop-filter: blur(6px);
          border-radius: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default VintageTicket;
