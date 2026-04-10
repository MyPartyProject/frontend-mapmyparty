import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Gift,
  Globe,
  Loader2,
  MapPin,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Wallet2,
} from "lucide-react";
import { apiFetch } from "@/config/api";
import { toast } from "sonner";

const paymentMethods = [
  { label: "UPI", icon: Smartphone, accent: "from-emerald-500/80 to-teal-500/60" },
  { label: "Cards", icon: CreditCard, accent: "from-sky-500/80 to-blue-500/60" },
  { label: "Net Banking", icon: Globe, accent: "from-purple-500/80 to-indigo-500/60" },
  { label: "Wallets", icon: Wallet2, accent: "from-amber-500/80 to-orange-500/60" },
  { label: "Gift Voucher", icon: Gift, accent: "from-pink-500/80 to-rose-500/60" },
  { label: "Scan & Pay", icon: ScanLine, accent: "from-red-500/80 to-orange-500/60" },
];

const PaymentCheckout = () => {
  const { organizerSlug, eventSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [storedCheckout, setStoredCheckout] = useState(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mockGatewayOpen, setMockGatewayOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  useEffect(() => {
    const routeState = location.state;
    if (routeState?.eventSummary && routeState?.tickets?.length && routeState?.bookingData) {
      setStoredCheckout(routeState);
      sessionStorage.setItem("pendingCheckout", JSON.stringify(routeState));
      setCheckoutReady(true);
      return;
    }

    const pendingCheckoutRaw = sessionStorage.getItem("pendingCheckout");
    if (!pendingCheckoutRaw) {
      setCheckoutReady(true);
      return;
    }

    try {
      const pendingCheckout = JSON.parse(pendingCheckoutRaw);
      if (pendingCheckout?.eventSummary && pendingCheckout?.tickets?.length && pendingCheckout?.bookingData) {
        setStoredCheckout(pendingCheckout);
      }
    } catch (error) {
      console.warn("Failed to restore pending checkout state", error);
    } finally {
      setCheckoutReady(true);
    }
  }, [location.state]);

  const summary = storedCheckout?.eventSummary;
  const tickets = storedCheckout?.tickets || [];
  const bookingData = storedCheckout?.bookingData;

  useEffect(() => {
    if (checkoutReady && (!summary || !tickets.length || !bookingData)) {
      navigate(`/events/${organizerSlug}/${eventSlug}`);
    }
  }, [checkoutReady, summary, tickets.length, bookingData, organizerSlug, eventSlug, navigate]);

  const totalsSafe = useMemo(() => {
    const totals = bookingData?.totals || {};
    return {
      subtotal: totals.ticketSubtotal ?? 0,
      platformFee: totals.platformFeeTotal ?? 0,
      gst: totals.gst?.gstTotal ?? 0,
      gstType: totals.gst?.gstType || "NONE",
      cgst: totals.gst?.cgst ?? 0,
      sgst: totals.gst?.sgst ?? 0,
      igst: totals.gst?.igst ?? 0,
      total: totals.grandTotal ?? 0,
    };
  }, [bookingData]);

  const totalQty = useMemo(() => tickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0), [tickets]);

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);

  const itemsForDisplay = useMemo(() => {
    const ticketMap = new Map();
    tickets.forEach((ticket) => ticketMap.set(ticket.id, ticket));

    return (bookingData?.items || []).map((item) => ({
      ...item,
      displayName: item.name || ticketMap.get(item.ticketId)?.name || item.ticketId || "Ticket",
      quantity: item.quantity || 0,
      ticketPrice: item.ticketPrice ?? ticketMap.get(item.ticketId)?.price ?? 0,
      subtotal: item.subtotal ?? 0,
    }));
  }, [bookingData?.items, tickets]);

  const taxSummary = useMemo(() => {
    if ((totalsSafe.gstType || "").includes("IGST")) {
      return {
        label: "IGST",
        amount: totalsSafe.igst || totalsSafe.gst || 0,
      };
    }

    return {
      label: "GST",
      amount: totalsSafe.gst || 0,
    };
  }, [totalsSafe.gst, totalsSafe.gstType, totalsSafe.igst]);

  const gatewayPreview = useMemo(() => {
    if (!bookingData?.bookingId) return null;

    return {
      merchant: "MapMyParty Sandbox",
      bookingId: bookingData.bookingId,
      orderId: `ORD-${String(bookingData.bookingId).slice(0, 8).toUpperCase()}`,
      gatewayReference: `PG-${String(Date.now()).slice(-8)}`,
      method: selectedMethod || "TEST",
      amount: bookingData?.totals?.grandTotal ?? 0,
      customerName: bookingData?.userDetails?.name || "Guest User",
      customerEmail: bookingData?.userDetails?.email || "guest@mapmyparty.test",
      customerPhone: bookingData?.userDetails?.phone || "N/A",
    };
  }, [bookingData, selectedMethod]);

  const handlePayment = () => {
    if (!bookingData?.bookingId) {
      toast.error("Booking ID not found");
      return;
    }

    if (!selectedMethod) {
      toast.error("Select a payment method");
      return;
    }

    setMockGatewayOpen(true);
  };

  const handleMockGatewayConfirm = async () => {
    if (!bookingData?.bookingId) {
      toast.error("Booking ID not found");
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const response = await apiFetch("/api/payment/test/process", {
        method: "POST",
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          paymentMethod: selectedMethod || "TEST",
        }),
      });

      if (response?.success) {
        toast.success("Payment successful!");
        sessionStorage.removeItem("pendingCheckout");
        setMockGatewayOpen(false);
        navigate(`/booking-success?bookingId=${bookingData.bookingId}`);
        return;
      }

      toast.error(response?.errorMessage || "Payment failed");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0c1120] to-[#05070f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-white/80" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </Button>
          <Badge className="bg-white/10 border-white/20 text-xs">Secure Checkout</Badge>
        </div>

        {summary && (
          <Card className="bg-white/5 border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <CardContent className="p-5 grid md:grid-cols-[1.5fr,1fr] gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <img src={summary.banner} alt={summary.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold leading-snug">{summary.title}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-white/70">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {summary.date || "Date TBA"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {summary.time || "Time TBA"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {summary.venue || "Venue TBA"}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">{summary.address}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 text-sm text-white/80">
                <ShieldCheck className="h-5 w-5 text-emerald-300" /> Payments are encrypted & secure
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
          <Card className="bg-white/[0.04] border-white/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">Payment options</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {paymentMethods.map(({ label, icon: Icon, accent }) => (
                <div
                  key={label}
                  onClick={() => setSelectedMethod(label.toUpperCase())}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                    selectedMethod === label.toUpperCase()
                      ? "border-[#D60024] bg-[#D60024]/10"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/60">
                      {selectedMethod === label.toUpperCase() ? "Selected" : `Continue to pay with ${label}`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <CardHeader>
              <CardTitle className="text-lg">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Tickets</span>
                <span className="font-semibold text-white">{totalQty}</span>
              </div>
              <Separator className="bg-white/10" />

              <div className="space-y-2 text-sm">
                {itemsForDisplay.map((item) => (
                  <div key={item.ticketId || item.id} className="flex justify-between items-start gap-3">
                    <div className="text-white/80">
                      <div className="font-semibold text-white">{item.displayName}</div>
                      <div className="text-xs text-white/60">
                        Qty: {item.quantity} x {formatCurrency(item.ticketPrice || 0)}
                      </div>
                    </div>
                    <div className="text-white font-semibold">{formatCurrency(item.subtotal || 0)}</div>
                  </div>
                ))}
              </div>

              <Separator className="bg-white/10" />

              <div className="space-y-2 text-sm text-white/80">
                <div className="flex justify-between">
                  <span>Ticket subtotal</span>
                  <span className="text-white">{formatCurrency(totalsSafe.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Platform charges
                  </span>
                  <span className="text-white">{formatCurrency(totalsSafe.platformFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{taxSummary.label}</span>
                  <span className="text-white">{formatCurrency(taxSummary.amount)}</span>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="flex justify-between items-center text-base font-semibold">
                <span>Total Amount</span>
                <span className="text-[#D60024]">{formatCurrency(totalsSafe.total || 0)}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing || !selectedMethod}
                className="w-full bg-gradient-to-r from-[#D60024] to-[#ff4d67] text-white font-semibold py-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : !selectedMethod ? (
                  "Select a payment method"
                ) : (
                  "Open Mock Gateway"
                )}
              </Button>
              <p className="text-xs text-center text-white/60">
                {isProcessing
                  ? "Please wait while we process your payment..."
                  : "You'll be taken through a mocked payment gateway before confirmation."}
              </p>
              <p className="text-xs text-center text-amber-300/80 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mt-2">
                Test Mode: This is a simulated payment flow for booking validation only. No actual charges will be made.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={mockGatewayOpen} onOpenChange={setMockGatewayOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto border-gray-800 bg-gray-900 text-white p-0">
          <div className="space-y-4 p-4 sm:p-5">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                Mock Payment Gateway
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-400">
                Sandbox preview for the current booking. No real transaction will be processed.
              </DialogDescription>
            </DialogHeader>

            {gatewayPreview && (
              <div className="space-y-3">
                <div className="space-y-3 rounded-xl border border-gray-700/50 bg-transparent p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Merchant</p>
                      <p className="text-sm font-semibold text-white">{gatewayPreview.merchant}</p>
                    </div>
                    <Badge className="border border-red-600/25 bg-red-600/10 text-red-300 text-[10px] px-2 py-0.5">
                      Sandbox
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Booking ID</p>
                      <p className="break-all font-medium text-white">{gatewayPreview.bookingId}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Method</p>
                      <p className="font-medium text-white">{gatewayPreview.method}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Amount</p>
                      <p className="font-medium text-red-600">{formatCurrency(gatewayPreview.amount)}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-500">Status</p>
                      <p className="font-medium text-white">Test only</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-3 text-xs leading-5 text-gray-400">
                  This simulates the final gateway step only. On confirm, the app will call the test payment endpoint and complete the booking.
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 text-white bg-gray-800 hover:bg-gray-700 text-sm"
                onClick={() => setMockGatewayOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleMockGatewayConfirm}
                disabled={isProcessing}
                className="bg-red-600 text-white hover:bg-red-700 text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  "Authorize Test Payment"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentCheckout;
