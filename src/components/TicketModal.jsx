import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, User, Download, Share2, Clock, Hash, Mail } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { buildCanonicalQrPayload } from "@/utils/qrPayload";

const TicketModal = ({ isOpen, onClose, ticket }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (ticket && isOpen) {
      const qrData = buildCanonicalQrPayload(ticket.qrCode || "");
      if (!qrData) {
        setQrCodeUrl("");
        return;
      }
      QRCode.toDataURL(qrData, { width: 200, margin: 2 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [ticket, isOpen]);

  const handleDownload = () => {
    alert("Ticket downloaded! (This is a demo)");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ticket.eventTitle,
        text: `My ticket for ${ticket.eventTitle}`,
      });
    } else {
      alert("Share functionality not supported on this device");
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-2 border-[rgba(100,200,255,0.3)] text-white p-0">
        <div className="space-y-4 p-6">
          {/* Ticket Card */}
          <Card className="overflow-hidden border-none bg-gradient-to-br from-[#D60024] via-[#b8001f] to-[#8b0017] rounded-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-white/20 text-white border-white/30 text-xs px-3 py-1">
                  E-Ticket
                </Badge>
                <Ticket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">{ticket.eventTitle}</h3>
              <p className="text-sm text-white/90">{ticket.ticketType}</p>
            </div>
          </Card>

          {/* QR Code Section */}
          <div className="bg-gradient-to-br from-[rgba(255,255,255,0.95)] to-[rgba(240,240,240,0.95)] rounded-xl p-6 flex items-center justify-center">
            {qrCodeUrl ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(214,0,36,0.1)] to-[rgba(59,130,246,0.1)] rounded-lg blur-xl"></div>
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 relative z-10" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-gradient-to-br from-[rgba(214,0,36,0.1)] to-[rgba(59,130,246,0.1)] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Ticket className="w-12 h-12 mx-auto mb-2 text-[#D60024]" />
                  <p className="text-xs text-gray-600">QR Code</p>
                </div>
              </div>
            )}
          </div>

          {/* Ticket Details */}
          <div className="space-y-3 bg-[rgba(255,255,255,0.05)] rounded-xl p-5 border border-[rgba(100,200,255,0.2)]">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-[#D60024] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm mb-1">Date & Time</p>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">
                  {typeof ticket.eventDate === 'string' && ticket.eventDate.includes('T') 
                    ? new Date(ticket.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                    : ticket.eventDate} at {ticket.eventTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-[#D60024] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm mb-1">Location</p>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">{ticket.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-[#D60024] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm mb-1">Quantity</p>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">
                  {ticket.quantity} ticket{ticket.quantity > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-[#D60024] mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-white text-sm mb-1">Ticket ID</p>
                <p className="text-[rgba(255,255,255,0.75)] text-sm">
                  {ticket.id || ticket.orderId}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-[rgba(214,0,36,0.15)] to-[rgba(214,0,36,0.05)] rounded-xl p-5 border border-[rgba(214,0,36,0.3)]">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-white text-lg">Total Paid</span>
              <span className="text-3xl font-bold text-[#D60024]">₹{ticket.totalPrice?.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              className="bg-primaryCTA text-primary-foreground font-semibold hover:bg-primaryCTA-hover active:bg-primaryCTA-active"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="outline"
              className="border-[rgba(100,200,255,0.3)] text-white hover:bg-[rgba(59,130,246,0.15)]"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <p className="text-xs text-center text-[rgba(255,255,255,0.5)] pt-2">
            Please show this ticket at the venue entrance
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketModal;
