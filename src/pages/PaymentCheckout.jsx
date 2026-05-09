import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { loadRazorpayScript } from "@/utils/loadRazorpayScript";

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

  const handlePayment = async () => {
    if (!bookingData?.bookingId) {
      toast.error("Booking ID not found");
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const initResponse = await apiFetch("payments/checkout/init", {
        method: "POST",
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
        }),
      });

      const checkout = initResponse?.data;
      if (!initResponse?.success || !checkout?.key || !checkout?.orderId || !checkout?.paymentId) {
        throw new Error(initResponse?.errorMessage || "Unable to initialize payment");
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is unavailable");
      }

      const razorpay = new window.Razorpay({
        key: checkout.key,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: checkout.prefill,
        notes: checkout.notes,
        theme: checkout.theme,
        handler: async (razorpayResponse) => {
          try {
            const verifyResponse = await apiFetch("payments/checkout/verify", {
              method: "POST",
              body: JSON.stringify({
                bookingId: checkout.bookingId,
                paymentId: checkout.paymentId,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }),
            });

            if (!verifyResponse?.success) {
              throw new Error(verifyResponse?.errorMessage || "Payment verification failed");
            }

            toast.success("Payment successful!");
            sessionStorage.removeItem("pendingCheckout");
            navigate(`/booking-success?bookingId=${checkout.bookingId}`);
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error(error?.message || "Payment verification failed. Please contact support if money was debited.");
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment was not completed. You can retry until this booking expires.");
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        setIsProcessing(false);
        const message = response?.error?.description || response?.error?.reason || "Payment failed. Please try again.";
        toast.error(message);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment failed. Please try again.");
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
              <CardTitle className="text-lg flex items-center gap-2">Accepted payment options</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {paymentMethods.map(({ label, icon: Icon, accent }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5"
                >
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/60">Available inside Razorpay Checkout</p>
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
                <span className="text-primaryCTA">{formatCurrency(totalsSafe.total || 0)}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active font-semibold py-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  "Pay securely with Razorpay"
                )}
              </Button>
              <p className="text-xs text-center text-white/60">
                {isProcessing
                  ? "Please wait while Razorpay Checkout opens or verifies your payment..."
                  : "Your booking is confirmed only after secure server-side payment verification."}
              </p>
              <p className="text-xs text-center text-amber-300/80 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mt-2">
                Razorpay Test Mode: use Razorpay test credentials and test payment methods until production keys are enabled.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
