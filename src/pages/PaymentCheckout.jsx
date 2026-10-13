import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { apiFetch } from "@/config/api";
import { toast } from "sonner";
import { loadCashfreeScript } from "@/utils/loadCashfreeScript";

// Payment guide text and icons.
const paymentSteps = [
  { title: "Review your booking", description: "Check your tickets and total in the order summary.", icon: ClipboardList },
  { title: "Pay securely", description: "Tap Pay to open Cashfree and choose your payment method.", icon: CreditCard },
  { title: "Payment confirmation", description: "Your booking is confirmed once your payment is verified.", icon: ShieldCheck },
  { title: "Access your tickets", description: "Download tickets from the confirmation page or My Bookings.", icon: Ticket },
];

const PaymentCheckout = () => {
  const { organizerSlug, eventSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [storedCheckout, setStoredCheckout] = useState(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCheckoutAttempt, setPendingCheckoutAttempt] = useState(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("");
  const [isRetryingVerification, setIsRetryingVerification] = useState(false);
  const pollingStartedAtRef = useRef(null);
  const lastInitializationRetryAtRef = useRef(0);

  const paymentAttemptStorageKey = (bookingId) => `pendingPaymentAttempt:${bookingId}`;

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

  useEffect(() => {
    const bookingId = storedCheckout?.bookingData?.bookingId;
    if (!bookingId) return;
    const scopedKey = paymentAttemptStorageKey(bookingId);
    const pendingPaymentRaw = sessionStorage.getItem(scopedKey)
      || sessionStorage.getItem("pendingPaymentAttempt");
    if (!pendingPaymentRaw) {
      return;
    }

    try {
      const pendingPayment = JSON.parse(pendingPaymentRaw);
      if (pendingPayment?.bookingId === bookingId && pendingPayment?.paymentId) {
        sessionStorage.setItem(scopedKey, JSON.stringify(pendingPayment));
        sessionStorage.removeItem("pendingPaymentAttempt");
        setPendingCheckoutAttempt(pendingPayment);
        setPaymentStatusMessage("We are waiting for Cashfree to confirm this payment.");
      }
    } catch (error) {
      console.warn("Failed to restore pending payment attempt", error);
    }
  }, [storedCheckout?.bookingData?.bookingId]);

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

  const isFreeCheckout = Boolean(bookingData)
    && (
      bookingData.paymentRequired === false
      || bookingData.checkoutProvider === "FREE"
      || (Boolean(bookingData?.totals) && Number(totalsSafe.total || 0) <= 0)
    );

  useEffect(() => {
    if (!checkoutReady || !bookingData?.bookingId || !isFreeCheckout) {
      return;
    }

    sessionStorage.removeItem("pendingCheckout");
    navigate(`/booking-success?bookingId=${bookingData.bookingId}`, { replace: true });
  }, [checkoutReady, bookingData?.bookingId, isFreeCheckout, navigate]);

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

  const getCashfreeMode = (checkout) => {
    const mode = String(checkout?.mode || "").toLowerCase();
    return mode === "production" || mode === "live" ? "production" : "sandbox";
  };

  const getCashfreePaymentId = (result) => {
    return result?.paymentDetails?.cf_payment_id
      || result?.paymentDetails?.payment_id
      || result?.cf_payment_id
      || result?.payment_id
      || result?.transaction?.cf_payment_id
      || null;
  };

  const verifyCheckoutAttempt = async ({ checkout, checkoutResult }) => {
    const verifyResponse = await apiFetch("/api/payments/checkout/verify", {
      method: "POST",
      body: JSON.stringify({
        bookingId: checkout.bookingId,
        paymentId: checkout.paymentId,
        provider_order_id: checkout.orderId,
        provider_payment_id: getCashfreePaymentId(checkoutResult),
      }),
    });

    if (!verifyResponse?.success) {
      throw new Error(verifyResponse?.errorMessage || "Payment verification failed");
    }

    return verifyResponse;
  };

  const clearPendingPaymentAttempt = (bookingId = pendingCheckoutAttempt?.bookingId || bookingData?.bookingId) => {
    if (bookingId) sessionStorage.removeItem(paymentAttemptStorageKey(bookingId));
    sessionStorage.removeItem("pendingPaymentAttempt");
    setPendingCheckoutAttempt(null);
    setPaymentStatusMessage("");
  };

  const markPaymentPending = (checkout, message) => {
    sessionStorage.setItem(paymentAttemptStorageKey(checkout.bookingId), JSON.stringify(checkout));
    setPendingCheckoutAttempt(checkout);
    setPaymentStatusMessage(message || "We are waiting for Cashfree to confirm this payment.");
  };

  const handleVerificationResponse = ({ verifyResponse, checkout }) => {
    const verification = verifyResponse?.data || {};
    const status = String(verification.status || verification.paymentStatus || "").toUpperCase();

    if (status === "SUCCESS" || verification.paymentStatus === "SUCCESS") {
      toast.success("Payment successful!");
      clearPendingPaymentAttempt();
      sessionStorage.removeItem("pendingCheckout");
      navigate(`/booking-success?bookingId=${checkout.bookingId}`);
      return "success";
    }

    if (status === "PENDING" || verifyResponse?.code === 202) {
      const message = verification.message || "Payment is still being confirmed by Cashfree. We will update this automatically.";
      markPaymentPending(checkout, message);
      toast.info("Payment confirmation is pending. Please do not make another payment yet.");
      return "pending";
    }

    if (status === "FAILED") {
      clearPendingPaymentAttempt(checkout.bookingId);
      if (verification.retryAllowed) {
        toast.error(verification.message || "This payment attempt failed. You can safely try again.");
        return "retry";
      }
      sessionStorage.removeItem("pendingCheckout");
      toast.error(verification.message || "Payment failed or the booking expired.");
      navigate(`/events/${organizerSlug}/${eventSlug}`);
      return "failed";
    }

    if (status === "RECOVERY_REQUIRED") {
      markPaymentPending(checkout, verification.message);
      toast.error(verification.message || "Payment needs recovery. Please do not make another payment.");
      return "recovery";
    }

    throw new Error(verifyResponse?.message || "Payment verification returned an unknown status");
  };

  useEffect(() => {
    if (!pendingCheckoutAttempt?.bookingId) return undefined;

    let cancelled = false;
    let timer = null;
    pollingStartedAtRef.current ||= Date.now();

    const schedule = () => {
      const elapsed = Date.now() - pollingStartedAtRef.current;
      timer = window.setTimeout(poll, elapsed < 30_000 ? 3_000 : 10_000);
    };

    const poll = async () => {
      if (cancelled) return;
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }

      try {
        const response = await apiFetch(
          `/api/payments/checkout/status/${pendingCheckoutAttempt.bookingId}`,
        );
        if (cancelled || !response?.success) return;
        const status = String(response.data?.status || "").toUpperCase();

        if (status === "SUCCESS") {
          clearPendingPaymentAttempt(pendingCheckoutAttempt.bookingId);
          sessionStorage.removeItem("pendingCheckout");
          navigate(`/booking-success?bookingId=${pendingCheckoutAttempt.bookingId}`, { replace: true });
          return;
        }
        if (status === "FAILED" && response.data?.retryAllowed) {
          clearPendingPaymentAttempt(pendingCheckoutAttempt.bookingId);
          toast.error(response.data?.message || "The payment attempt failed. You can safely try again.");
          return;
        }
        if (status === "FAILED" || status === "EXPIRED") {
          clearPendingPaymentAttempt(pendingCheckoutAttempt.bookingId);
          sessionStorage.removeItem("pendingCheckout");
          toast.error(response.data?.message || "The booking expired before payment was confirmed.");
          navigate(`/events/${organizerSlug}/${eventSlug}`, { replace: true });
          return;
        }

        if (
          status === "INITIALIZING"
          && Date.now() - lastInitializationRetryAtRef.current >= 15_000
        ) {
          lastInitializationRetryAtRef.current = Date.now();
          const initResponse = await apiFetch("/api/payments/checkout/init", {
            method: "POST",
            body: JSON.stringify({ bookingId: pendingCheckoutAttempt.bookingId }),
          });
          if (initResponse?.data?.paymentSessionId && initResponse?.data?.orderId) {
            clearPendingPaymentAttempt(pendingCheckoutAttempt.bookingId);
            toast.info("Secure checkout is ready. Select Pay to continue.");
            return;
          }
        }

        setPaymentStatusMessage(response.data?.message || paymentStatusMessage);
      } catch (error) {
        console.warn("Automatic payment status check failed", error);
        if (!cancelled && (error?.status === 429 || error?.status === 503)) {
          const waitMs = Math.max(1000, Number(error.retryAfter || error?.data?.retryAfter || 5) * 1000);
          timer = window.setTimeout(poll, waitMs);
          return;
        }
      }

      if (!cancelled) schedule();
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [pendingCheckoutAttempt?.bookingId, navigate, organizerSlug, eventSlug]);

  const handlePayment = async () => {
    if (!bookingData?.bookingId) {
      toast.error("Booking ID not found");
      return;
    }

    if (isProcessing) {
      return;
    }

    if (isFreeCheckout) {
      sessionStorage.removeItem("pendingCheckout");
      navigate(`/booking-success?bookingId=${bookingData.bookingId}`, { replace: true });
      return;
    }

    setIsProcessing(true);

    try {
      const initResponse = await apiFetch("/api/payments/checkout/init", {
        method: "POST",
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
        }),
      });

      const checkout = initResponse?.data;
      if (initResponse?.success && checkout?.paymentRequired === false) {
        sessionStorage.removeItem("pendingCheckout");
        toast.success("Booking confirmed successfully!");
        navigate(`/booking-success?bookingId=${checkout.bookingId || bookingData.bookingId}`);
        return;
      }

      if (
        initResponse?.success
        && checkout?.paymentId
        && (initResponse?.code === 202 || checkout?.status === "INITIALIZING")
      ) {
        markPaymentPending(
          checkout,
          "Secure checkout is being prepared. This page will continue automatically.",
        );
        setIsProcessing(false);
        return;
      }

      if (!initResponse?.success || !checkout?.paymentSessionId || !checkout?.orderId || !checkout?.paymentId) {
        throw new Error(initResponse?.errorMessage || "Unable to initialize payment");
      }

      await loadCashfreeScript();

      if (!window.Cashfree) {
        throw new Error("Cashfree Checkout is unavailable");
      }

      const cashfree = window.Cashfree({ mode: getCashfreeMode(checkout) });
      if (!cashfree?.checkout) {
        throw new Error("Cashfree Checkout is unavailable");
      }

      let checkoutResult = null;
      try {
        checkoutResult = await cashfree.checkout({
          paymentSessionId: checkout.paymentSessionId,
          redirectTarget: "_modal",
        });
      } catch (checkoutError) {
        console.error("Cashfree checkout error:", checkoutError);
        checkoutResult = { error: checkoutError };
      }

      try {
        const verifyResponse = await verifyCheckoutAttempt({ checkout, checkoutResult });
        handleVerificationResponse({ verifyResponse, checkout });
      } catch (verificationError) {
        console.error("Payment verification error:", verificationError);
        markPaymentPending(
          checkout,
          verificationError?.message || "We could not confirm the payment immediately. Please retry verification in a moment.",
        );
        toast.info("Payment confirmation is pending. Please do not make another payment yet.");
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const retryPendingVerification = async () => {
    if (!pendingCheckoutAttempt || isRetryingVerification) {
      return;
    }

    setIsRetryingVerification(true);
    try {
      if (!pendingCheckoutAttempt.orderId) {
        const initResponse = await apiFetch("/api/payments/checkout/init", {
          method: "POST",
          body: JSON.stringify({ bookingId: pendingCheckoutAttempt.bookingId }),
        });
        if (initResponse?.data?.paymentSessionId && initResponse?.data?.orderId) {
          clearPendingPaymentAttempt(pendingCheckoutAttempt.bookingId);
          toast.info("Secure checkout is ready. Select Pay to continue.");
        } else {
          setPaymentStatusMessage("Secure checkout is still being prepared. This page will continue automatically.");
        }
        return;
      }
      const verifyResponse = await verifyCheckoutAttempt({
        checkout: pendingCheckoutAttempt,
        checkoutResult: null,
      });
      handleVerificationResponse({ verifyResponse, checkout: pendingCheckoutAttempt });
    } catch (error) {
      console.error("Pending payment verification retry failed:", error);
      setPaymentStatusMessage(error?.message || "Payment is still pending. Please retry after a short wait.");
      toast.info("Payment is still pending. Please retry after a short wait.");
    } finally {
      setIsRetryingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0c1120] to-[#05070f] text-white light:from-background light:via-surface light:to-surface light:text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-white/80 light:text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 mr-1" /> Back
          </Button>
          <Badge className="bg-white/10 border-white/20 text-xs light:bg-muted light:border-border">Secure Checkout</Badge>
        </div>

        {summary && (
          <Card className="bg-white/5 border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.45)] light:bg-muted light:border-border">
            <CardContent className="p-5 grid md:grid-cols-[1.5fr,1fr] gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-20 rounded-xl overflow-hidden border border-white/10 bg-black/30 light:border-border light:bg-surface">
                    <img src={summary.banner} alt={summary.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold leading-snug">{summary.title}</h2>
                    <div className="flex flex-wrap gap-3 text-xs text-white/70 light:text-muted-foreground">
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
                    <p className="text-xs text-white/60 light:text-muted-foreground">{summary.address}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 text-sm text-white/80 light:text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-emerald-300 light:text-success" /> Payments are encrypted & secure
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-[1.4fr,1fr] gap-6">
          <Card className="bg-card border-border text-foreground">
            <CardHeader>
              <CardTitle className="text-lg">How payment works</CardTitle>
              <p className="text-sm text-muted-foreground">Four simple steps to your tickets.</p>
            </CardHeader>
            <CardContent>
              <ol className="space-y-6">
                {/* Reveal each step 1 second apart. */}
                {paymentSteps.map(({ title, description, icon: Icon }, index) => (
                  <li
                    key={title}
                    className="group relative flex items-start gap-4 animate-in fade-in-0 motion-safe:slide-in-from-bottom-3"
                    style={{ animationDelay: `${index}s`, animationDuration: "650ms", animationFillMode: "backwards" }}
                  >
                    {/* Light/dark connector glow. */}
                    {index < paymentSteps.length - 1 && (
                      <span aria-hidden="true" className="absolute left-[23px] top-12 -bottom-6 w-0.5 rounded-full bg-accent/50 shadow-[0_0_8px_hsl(var(--accent)/0.45)] light:bg-primary/50 light:shadow-[0_0_8px_hsl(var(--primary)/0.3)] motion-safe:animate-pulse" />
                    )}
                    <div aria-hidden="true" className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                      {/* Soft pulse respects reduced motion. */}
                      <span className="pointer-events-none absolute -inset-1 rounded-full bg-accent/40 blur-lg light:bg-primary/35 motion-safe:animate-pulse" />
                      <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-accent/60 bg-secondary text-secondary-foreground light:border-primary/50 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-110">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card text-[10px] font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] light:bg-muted light:border-border">
            <CardHeader>
              <CardTitle className="text-lg">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70 light:text-muted-foreground">Tickets</span>
                <span className="font-semibold text-white light:text-foreground">{totalQty}</span>
              </div>
              <Separator className="bg-white/10 light:bg-muted" />

              <div className="space-y-2 text-sm">
                {itemsForDisplay.map((item) => (
                  <div key={item.ticketId || item.id} className="flex justify-between items-start gap-3">
                    <div className="text-white/80 light:text-muted-foreground">
                      <div className="font-semibold text-white light:text-foreground">{item.displayName}</div>
                      <div className="text-xs text-white/60 light:text-muted-foreground">
                        Qty: {item.quantity} x {formatCurrency(item.ticketPrice || 0)}
                      </div>
                    </div>
                    <div className="text-white font-semibold light:text-foreground">{formatCurrency(item.subtotal || 0)}</div>
                  </div>
                ))}
              </div>

              <Separator className="bg-white/10 light:bg-muted" />

              <div className="space-y-2 text-sm text-white/80 light:text-muted-foreground">
                <div className="flex justify-between">
                  <span>Ticket subtotal</span>
                  <span className="text-white light:text-foreground">{formatCurrency(totalsSafe.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Platform charges
                  </span>
                  <span className="text-white light:text-foreground">{formatCurrency(totalsSafe.platformFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{taxSummary.label}</span>
                  <span className="text-white light:text-foreground">{formatCurrency(taxSummary.amount)}</span>
                </div>
              </div>

              <Separator className="bg-white/10 light:bg-muted" />

              <div className="flex justify-between items-center text-base font-semibold">
                <span>Total Amount</span>
                <span className="text-primaryCTA">{formatCurrency(totalsSafe.total || 0)}</span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing || Boolean(pendingCheckoutAttempt)}
                className="w-full bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active font-semibold py-5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isFreeCheckout ? "Confirming Booking..." : "Processing Payment..."}
                  </>
                ) : (
                  pendingCheckoutAttempt
                    ? "Payment confirmation pending"
                    : isFreeCheckout ? "Confirm free booking" : "Pay securely with Cashfree"
                )}
              </Button>
              {pendingCheckoutAttempt && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Loader2 className="h-5 w-5 text-amber-200 animate-spin mt-0.5 light:text-warning" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-amber-100">Payment confirmation pending</p>
                      <p className="text-xs text-amber-100/80">
                        {paymentStatusMessage || "Cashfree is still confirming this payment. Please do not pay again."}
                      </p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={retryPendingVerification}
                      disabled={isRetryingVerification}
                      className="bg-white/90 text-slate-950 hover:bg-white light:bg-muted"
                    >
                      {isRetryingVerification ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : "Retry verification"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate(`/events/${organizerSlug}/${eventSlug}`)}
                      className="text-white/80 hover:text-white hover:bg-white/10 light:text-muted-foreground light:hover:text-foreground light:hover:bg-muted"
                    >
                      Back to event
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-center text-white/60 light:text-muted-foreground">
                {isProcessing
                  ? isFreeCheckout
                    ? "Please wait while your booking is confirmed..."
                    : "Please wait while Cashfree Checkout opens or verifies your payment..."
                  : isFreeCheckout
                    ? "Your booking will be confirmed without payment."
                    : "Your booking is confirmed only after secure server-side payment verification."}
              </p>
              {!isFreeCheckout && pendingCheckoutAttempt && getCashfreeMode(pendingCheckoutAttempt) === "sandbox" && (
                <p className="text-xs text-center text-amber-300/80 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mt-2 light:text-warning">
                  Cashfree sandbox mode is active. Use test payment methods only.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
