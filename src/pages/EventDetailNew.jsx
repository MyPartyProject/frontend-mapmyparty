import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, ChevronDown, ChevronRight, Calendar, MapPin, Clock, Users, Share2, Heart,
  Ticket, Star, TrendingUp, Mail, Phone, Globe, Instagram,
  Facebook, Twitter, Plus, Minus, X, Check, Info, Image as ImageIcon,
  Navigation, Building, User, BookOpen, Medal, Loader2, ShieldCheck,
  AlertTriangle, Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, buildUrl } from "@/config/api";
import usePublicEventDetail from "@/hooks/usePublicEventDetail";
import { fetchSession, resetSessionCache, isAuthenticated as isAuthedSync } from "@/utils/auth";
import BillingDetailsModal from "@/components/BillingDetailsModal";
// import PromoterDashboardHeader from "@/components/PromoterDashboardHeader";

const FALLBACK_IMAGE = "https://via.placeholder.com/1200x600?text=Event";
const SPONSOR_PLACEHOLDER = "https://via.placeholder.com/200x200?text=Sponsor";
const TAB_PAUSE_DURATION_MS = 2 * 60 * 1000; // 2 minutes
const hasHtmlTag = (value) =>
  typeof value === "string" && /<\/?[a-z][\s\S]*>/i.test(value);
const hasEscapedHtmlTag = (value) =>
  typeof value === "string" && /&lt;\/?[a-z][\s\S]*&gt;/i.test(value);
const decodeHtmlEntities = (value) => {
  if (typeof value !== "string" || !value.includes("&")) return value;
  if (typeof document === "undefined") return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const EventDetailNew = () => {
  const { organizerSlug, eventSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { event, loading, error } = usePublicEventDetail(organizerSlug, eventSlug);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [autoRotatePausedUntil, setAutoRotatePausedUntil] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [ticketQuantities, setTicketQuantities] = useState({});

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [isSessionAuthed, setIsSessionAuthed] = useState(isAuthedSync());
  const [sessionUser, setSessionUser] = useState(null);
  const [advisoryModalOpen, setAdvisoryModalOpen] = useState(false);
  const [tcOpen, setTcOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [aboutCanExpand, setAboutCanExpand] = useState(false);
  const aboutRef = useRef(null);
  const [organizerNoteExpanded, setOrganizerNoteExpanded] = useState(false);
  const [organizerNoteCanExpand, setOrganizerNoteCanExpand] = useState(true);
  const galleryImages = useMemo(
    () => (Array.isArray(event?.gallery) ? event.gallery.filter(Boolean) : []),
    [event?.gallery]
  );
  const selectedImageIndex = useMemo(
    () => galleryImages.findIndex((image) => image === selectedImage),
    [galleryImages, selectedImage]
  );
  const normalizedFaqs = useMemo(() => {
    if (Array.isArray(event?.faqs) && event.faqs.length > 0) return event.faqs;
    if (Array.isArray(event?.questions) && event.questions.length > 0) return event.questions;
    return [];
  }, [event?.faqs, event?.questions]);

  const normalizedTerms = useMemo(() => {
    if (Array.isArray(event?.termsAndConditions) && event.termsAndConditions.length > 0) {
      return event.termsAndConditions;
    }
    if (event?.TC?.content || event?.TC?.terms) {
      return [event.TC];
    }
    return [];
  }, [event?.termsAndConditions, event?.TC]);

  const getTermHtml = (term) => {
    if (!term) return "";
    const decodedContent = decodeHtmlEntities(term.content || "");
    if (decodedContent && (hasHtmlTag(decodedContent) || hasEscapedHtmlTag(term.content))) {
      return decodedContent;
    }
    const decodedTerms = decodeHtmlEntities(term.terms || "");
    if (hasHtmlTag(decodedTerms) || hasEscapedHtmlTag(term.terms)) return decodedTerms;
    return "";
  };

  const showFaqTc = useMemo(() => {
    const hasFaq = normalizedFaqs.length > 0;
    const hasTerms = normalizedTerms.length > 0;
    return hasFaq || hasTerms;
  }, [normalizedFaqs, normalizedTerms]);

  const artistsCount = Array.isArray(event?.artists) ? event.artists.length : 0;
  const showArtistsTab = artistsCount > 1;

  const visibleTabs = useMemo(() => {
    const base = ["about", "gallery", "location", "organizer"];
    if (showArtistsTab) base.push("artists");
    return base;
  }, [showArtistsTab]);

  const rotatingTabs = useMemo(() => {
    return visibleTabs;
  }, [visibleTabs]);

  const pauseAutoRotate = () => setAutoRotatePausedUntil(Date.now() + TAB_PAUSE_DURATION_MS);
  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    pauseAutoRotate();
  };

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    if (rotatingTabs.length <= 1) return undefined;
    const interval = setInterval(() => {
      if (Date.now() < autoRotatePausedUntil) return;
      setActiveTab((prev) => {
        const idx = rotatingTabs.indexOf(prev);
        const next = rotatingTabs[(idx + 1) % rotatingTabs.length];
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [rotatingTabs, autoRotatePausedUntil]);

  const tabAnimationStyle = useMemo(() => ({ animation: "tabFadeSlide 0.6s ease" }), []);
  const pageCss = useMemo(
    () =>
      `
      @keyframes tabFadeSlide {0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}
      @keyframes sponsorMarquee {0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
      `,
    []
  );

  useEffect(() => {
    setAboutExpanded(false);
  }, [event?.id]);

  useEffect(() => {
    if (aboutExpanded) {
      setAboutCanExpand(true);
      return;
    }
    const el = aboutRef.current;
    if (!el) return;
    const measure = () => {
      const isOverflowing = el.scrollHeight - el.clientHeight > 2;
      setAboutCanExpand(isOverflowing);
    };
    requestAnimationFrame(measure);
  }, [event?.about, aboutExpanded, activeTab]);

  const renderTermsContent = () => {
    const decodedTermsHtml = decodeHtmlEntities(event?.termsHtml || "");
    if (decodedTermsHtml && (hasHtmlTag(decodedTermsHtml) || hasEscapedHtmlTag(event?.termsHtml))) {
      return (
        <div
          className="prose prose-invert max-w-none text-gray-400 prose-p:my-1 prose-li:my-0.5 prose-ol:list-decimal prose-ul:list-disc prose-headings:text-white text-[11px] leading-4"
          dangerouslySetInnerHTML={{ __html: decodedTermsHtml }}
        />
      );
    }

    const decodedTerms = decodeHtmlEntities(event?.terms || "");
    if (hasHtmlTag(decodedTerms) || hasEscapedHtmlTag(event?.terms)) {
      return (
        <div
          className="prose prose-invert max-w-none text-gray-400 prose-p:my-1 prose-li:my-0.5 prose-ol:list-decimal prose-ul:list-disc prose-headings:text-white text-[11px] leading-4"
          dangerouslySetInnerHTML={{ __html: decodedTerms }}
        />
      );
    }

    const termsLines = event?.terms
      ?.split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (termsLines?.length) {
      return (
        <ul className="space-y-1 pl-4 list-disc text-gray-400 text-[11px] leading-4">
          {termsLines.map((line, idx) => (
            <li key={`term-line-${idx}`}>{line}</li>
          ))}
        </ul>
      );
    }

    return <p className="text-gray-500 text-[11px]">No terms provided.</p>;
  };

  const renderFaqTc = () => (
    <div className="space-y-4">
      {normalizedFaqs.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <button
            className="w-full flex items-center justify-between gap-2 text-left px-5 py-4 hover:bg-gray-800 transition"
            onClick={() => setFaqOpen((prev) => !prev)}
          >
            <span className="flex items-center gap-2 text-white font-medium text-base">
              <Megaphone className="h-5 w-5 text-red-600" />
              Frequently Asked Questions
            </span>
            <ChevronDown
              className={`h-5 w-5 text-gray-400 transition-transform ${faqOpen ? "rotate-180" : ""}`}
            />
          </button>
          {faqOpen && (
            <div className="border-t border-gray-800 divide-y divide-gray-800">
              {normalizedFaqs.map((qa, idx) => (
                <div key={`faq-${idx}`} className="px-5 py-4">
                  <p className="text-white font-medium text-sm mb-1">{qa.question}</p>
                  {qa.answer ? (
                    <p className="text-gray-300 text-sm leading-relaxed">{qa.answer}</p>
                  ) : (
                    <p className="text-gray-500 text-xs">No answer provided.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <button
          className="w-full flex items-center justify-between gap-2 text-left px-5 py-4 hover:bg-gray-800 transition"
          onClick={() => setTcOpen((prev) => !prev)}
        >
          <span className="flex items-center gap-2 text-white font-medium text-base">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            Terms & Conditions
          </span>
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${tcOpen ? "rotate-180" : ""}`}
          />
        </button>
        {tcOpen && (
          <div className="border-t border-gray-800 px-5 py-4 bg-gray-800">
            {normalizedTerms.length > 0 ? (
              normalizedTerms.map((t, idx) => (
                <div key={`term-${idx}`} className="mb-3 last:mb-0">
                  {getTermHtml(t) ? (
                    <div
                      className="text-gray-300 text-sm leading-6 space-y-2"
                      style={{ lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: getTermHtml(t) }}
                    />
                  ) : (
                    renderTermsContent()
                  )}
                  {t.lastUpdated && (
                    <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(t.lastUpdated).toLocaleDateString()}</p>
                  )}
                </div>
              ))
            ) : (
              renderTermsContent()
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderFaqTcBlock = () => (
    <div className="mt-4 space-y-4" style={tabAnimationStyle}>
      {showFaqTc ? (
        renderFaqTc()
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-sm text-gray-500">No FAQs or terms provided for this event.</p>
        </div>
      )}
    </div>
  );

  const hasSponsors = useMemo(
    () => Array.isArray(event?.sponsors) && event.sponsors.length > 0 && (event?.isSponsored ?? true),
    [event?.isSponsored, event?.sponsors]
  );

  const sponsorsSorted = useMemo(() => {
    if (!hasSponsors) return [];
    return [...event.sponsors].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  }, [event?.sponsors, hasSponsors]);

  const primarySponsor = useMemo(() => (hasSponsors ? sponsorsSorted[0] : null), [hasSponsors, sponsorsSorted]);
  const secondarySponsors = useMemo(
    () => (hasSponsors && sponsorsSorted.length > 1 ? sponsorsSorted.slice(1) : []),
    [hasSponsors, sponsorsSorted]
  );
  const showSponsorStrip = useMemo(
    () => hasSponsors && sponsorsSorted.length > 1,
    [hasSponsors, sponsorsSorted.length]
  );

  const getArtistImage = (artist) =>
    artist.image || artist.photo || artist.avatar || artist.profileImage || FALLBACK_IMAGE;

  const showPreviousImage = () => {
    if (galleryImages.length <= 1 || selectedImageIndex === -1) return;
    const previousIndex = (selectedImageIndex - 1 + galleryImages.length) % galleryImages.length;
    setSelectedImage(galleryImages[previousIndex]);
  };

  const showNextImage = () => {
    if (galleryImages.length <= 1 || selectedImageIndex === -1) return;
    const nextIndex = (selectedImageIndex + 1) % galleryImages.length;
    setSelectedImage(galleryImages[nextIndex]);
  };

  // Resume booking after Google OAuth redirect
  useEffect(() => {
    if (searchParams.get('resumeBooking') !== 'true') return;

    const pendingRaw = sessionStorage.getItem('pendingBooking');
    sessionStorage.removeItem('pendingBooking');

    // Clean URL
    searchParams.delete('resumeBooking');
    setSearchParams(searchParams, { replace: true });

    if (!pendingRaw) return;
    try {
      const pending = JSON.parse(pendingRaw);
      if (pending.ticketQuantities) {
        setTicketQuantities(pending.ticketQuantities);
      }
    } catch { return; }

    // Wait for session, then open billing modal
    const resumeAfterLoad = async () => {
      const ok = await ensureSession();
      if (ok) {
        setBillingModalOpen(true);
      }
    };
    resumeAfterLoad();
  }, [searchParams]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleQuantityChange = (ticketId, change) => {
    setTicketQuantities((prev) => {
      const ticket = event?.tickets?.find((t) => t.id === ticketId);
      const current = prev[ticketId] || 0;
      const next = Math.max(0, current + change);

      if (!ticket) return { ...prev, [ticketId]: next };

      const availabilityCap = ticket.available ?? Infinity;
      const perUserCap = ticket.maxPerUser ?? Infinity;
      const cap = Math.min(availabilityCap, perUserCap);
      const capped = Math.min(next, cap);

      return { ...prev, [ticketId]: capped };
    });
  };

  const totalTickets = useMemo(() => {
    return Object.values(ticketQuantities).reduce((sum, qty) => sum + qty, 0);
  }, [ticketQuantities]);

  const totalAmount = useMemo(() => {
    if (!event) return 0;
    const tickets = Array.isArray(event.tickets) ? event.tickets : [];
    return tickets.reduce((sum, ticket) => {
      const qty = ticketQuantities[ticket.id] || 0;
      return sum + ticket.price * qty;
    }, 0);
  }, [ticketQuantities, event]);

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return "—";
    const num = Number(value);
    if (Number.isNaN(num)) return "—";
    return `₹${num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const getTicketCap = (ticket) => {
    if (!ticket) return Infinity;
    const availabilityCap = ticket.available ?? Infinity;
    const perUserCap = ticket.maxPerUser ?? Infinity;
    return Math.min(availabilityCap, perUserCap);
  };

  const isSalesClosed = useMemo(() => {
    const status = (event?.eventStatus || "").toUpperCase();
    const publish = (event?.publishStatus || "").toUpperCase();
    return ["COMPLETED", "CANCELLED"].includes(status) || publish === "DRAFT";
  }, [event?.eventStatus, event?.publishStatus]);

  const isSoldOut = useMemo(() => {
    if (!event?.tickets?.length) return false;
    return event.tickets.every((t) => (t.available || 0) === 0);
  }, [event?.tickets]);

  const bookingDisabledReason = useMemo(() => {
    if (isSalesClosed) return "Sales closed";
    if (isSoldOut) return "Sold out";
    return "";
  }, [isSalesClosed, isSoldOut]);

  const ensureSession = async () => {
    setAuthLoading(true);
    try {
      const session = await fetchSession();
      if (session?.isAuthenticated) {
        setIsSessionAuthed(true);
        setSessionUser(session.user || null);
        return true;
      }
    } catch (err) {
      console.warn("Auth check failed, using cached flag", err);
      if (isAuthedSync()) {
        setIsSessionAuthed(true);
        return true;
      }
    } finally {
      setAuthLoading(false);
    }
    return false;
  };

  const handleBookNow = async () => {
    if (totalTickets === 0) {
      toast.error("Please select at least one ticket");
      return;
    }

    // Check if user is authenticated
    if (!isSessionAuthed) {
      setAuthModalOpen(true);
      return;
    }

    // Ensure we have fresh session data
    await ensureSession();

    // Show billing modal to collect address details
    setBillingModalOpen(true);
  };

  const handleBillingSubmit = async (billingData) => {
    const selectedTickets = event.tickets
      .map((ticket) => ({
        ...ticket,
        quantity: ticketQuantities[ticket.id] || 0,
      }))
      .filter((t) => t.quantity > 0);

    const payload = {
      eventId: event.id || event.eventId || id,
      tickets: selectedTickets.map((t) => ({ ticketId: t.id, quantity: t.quantity })),
      userDetails: billingData,
    };

    try {
      setBookingLoading(true);
      const res = await apiFetch("/api/booking/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res?.success) {
        throw new Error(res?.message || "Booking failed");
      }

      const checkoutState = {
        eventSummary: {
          id: event?.id,
          title: event.title || event.eventTitle || event.name || "Event",
          date: event.startDate,
          time: event.time,
          venue: event.venue,
          address: event.address,
          banner: event.flyerImage || event.coverImage || FALLBACK_IMAGE,
        },
        tickets: selectedTickets,
        bookingData: res.data,
      };

      // Close billing modal
      setBillingModalOpen(false);
      sessionStorage.setItem("pendingCheckout", JSON.stringify(checkoutState));

      // Navigate to payment checkout
      navigate(`/events/${organizerSlug}/${eventSlug}/checkout`, {
        state: checkoutState,
      });
    } catch (err) {
      toast.error(err?.message || "Unable to create booking. Please try again.");
      setBookingLoading(false);
    }
  };

  const handleInlineLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginForm;
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setAuthLoading(true);
    try {
      await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role: "USER" }),
      });

      resetSessionCache();
      const session = await fetchSession(true);

      if (!session?.isAuthenticated) {
        throw new Error("Login succeeded but session validation failed");
      }

      setIsSessionAuthed(true);
      setSessionUser(session.user);
      setAuthModalOpen(false);
      setBillingModalOpen(true);
    } catch (err) {
      toast.error(err?.message || "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleInlineSignup = async (e) => {
    e.preventDefault();
    const { name, email, phone, password } = signupForm;
    if (!name || !email || !phone || !password) {
      toast.error("Please fill all fields");
      return;
    }
    const phoneDigits = (phone || "").replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setAuthLoading(true);
    try {
      await apiFetch("auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, phone: phoneDigits, password, role: "USER" }),
      });

      resetSessionCache();
      const session = await fetchSession(true);

      if (!session?.isAuthenticated) {
        throw new Error("Signup succeeded but session validation failed");
      }

      setIsSessionAuthed(true);
      setSessionUser(session.user);
      setAuthModalOpen(false);
      setBillingModalOpen(true);
    } catch (err) {
      toast.error(err?.message || "Signup failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Save pending booking state before navigating away
    sessionStorage.setItem('pendingBooking', JSON.stringify({
      returnUrl: window.location.pathname,
      ticketQuantities,
      timestamp: Date.now(),
    }));
    const redirect = encodeURIComponent(window.location.href);
    const googleAuthUrl = buildUrl(`auth/google?redirect=${redirect}`);
    window.location.href = googleAuthUrl;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out ${event?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="event-detail-theme min-h-screen bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#050510] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D60024] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-theme min-h-screen bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#050510] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Event Not Found</h2>
          <Button onClick={() => navigate("/dashboard/browse-events")} className="bg-gradient-to-r from-[#D60024] to-[#ff4d67]">
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-theme min-h-screen text-white bg-gray-950">
      <style>{pageCss}</style>

      {/* Header */}
      {/* <PromoterDashboardHeader /> */}

      {/* Hero Section - matching reference design */}
      <div className="pt-14 pb-2">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-[1.3fr,0.6fr] gap-8 items-start px-8">
            {/* Left: Hero Image with Overlays */}
            <div className="relative">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-auto rounded-2xl object-cover shadow-2xl"
              />

              {/* Share Button - Top Right Corner */}
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  onClick={handleShare}
                  className="bg-gray-900/90 hover:bg-gray-900 text-white border border-gray-700/50 backdrop-blur-md rounded-full p-3 shadow-lg"
                  title="Share event"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

             
                
              

              {/* Primary Sponsor - Bottom Right */}
              {primarySponsor && (
                <div className="absolute bottom-4 right-4">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/15 shadow-lg">
                    <img
                      src={primarySponsor.logo || SPONSOR_PLACEHOLDER}
                      alt={primarySponsor.name}
                      className="h-10 w-10 object-contain rounded-full bg-white/10 p-1"
                    />
                    <span className="text-[11px] uppercase tracking-[0.15em] text-white/80">Powered by</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Event Details Card */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardContent className="p-6 space-y-5">
                  {/* Event Title and Category */}
                  <div className="space-y-3">
                    <h2 className="text-4xl font-bold text-white leading-tight">{event.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {event.category && <span>{event.category}</span>}
                      {event.category && event.subCategory && <span>•</span>}
                      {event.subCategory && <span>{event.subCategory}</span>}
                    </div>
                  </div>

                  {/* <div className="h-px bg-gray-800"></div> */}

                  {/* Date & Time */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-800/80 border border-gray-700">
                      <Calendar className="h-6 w-6 text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Date & Time</p>
                      <p className="text-white font-semibold text-sm">{formatDate(event.startDate)}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{formatTime(event.startDate)}</p>
                    </div>
                  </div>

                  {/* <div className="h-px bg-gray-800"></div> */}

                  {/* Location */}
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gray-800/80 border border-gray-700">
                      <MapPin className="h-6 w-6 text-gray-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Venue</p>
                      <p className="text-white font-semibold text-sm">{event.venue}</p>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{event.address}</p>
                    </div>
                  </div>

                  {/* Book Now Button */}
                  <Button
                    onClick={() => {
                      const ticketSection = document.getElementById('ticket-section');
                      if (ticketSection) {
                        ticketSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-2 rounded-lg transition-all mt-4"
                    size="lg"
                  >
                    {isSoldOut ? 'SOLD OUT' : isSalesClosed ? 'Sales Closed' : 'Book Now'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor Strip Section */}
      {showSponsorStrip && (
        <div className="relative isolate overflow-hidden bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 py-4">
          {/* Background glow effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-red-600/5 blur-3xl" />
            <div className="absolute -right-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-red-600/5 blur-3xl" />
          </div>

          {/* Section Header */}
          

          {/* Marquee Container */}
          <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
            {/* Left fade gradient */}
            <div className="absolute left-6 lg:left-12 top-0 bottom-0 w-16 lg:w-24 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
            {/* Right fade gradient */}
            <div className="absolute right-6 lg:right-12 top-0 bottom-0 w-16 lg:w-24 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

            <div className="relative overflow-hidden rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
              <div className="flex items-center gap-6 py-2 min-w-max animate-[sponsorMarquee_25s_linear_infinite] hover:[animation-play-state:paused]">
                {[...sponsorsSorted, ...sponsorsSorted].map((s, idx) => (
                  <a
                    key={`${s.id || s.name || "sponsor"}-${idx}`}
                    href={s.website || "#"}
                    target={s.website ? "_blank" : undefined}
                    rel={s.website ? "noopener noreferrer" : undefined}
                    className="group flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-300 hover:bg-white/5"
                  >
                    {/* Logo Container */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative h-14 w-14 rounded-xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center overflow-hidden shadow-lg group-hover:border-gray-600/50 group-hover:shadow-xl group-hover:shadow-red-600/10 transition-all duration-300">
                        <img
                          src={s.logo || SPONSOR_PLACEHOLDER}
                          alt={s.name || "Sponsor"}
                          className="h-10 w-10 object-contain filter brightness-100 group-hover:brightness-110 transition-all duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>

                    {/* Sponsor Info */}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold whitespace-nowrap text-gray-300 group-hover:text-white transition-colors duration-300">
                        {s.name || "Sponsor"}
                      </span>
                      {s.isPrimary && (
                        <span className="text-[10px] uppercase tracking-wider text-red-500/80 font-medium">
                          Presenting Partner
                        </span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 lg:px-16 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-4">

            {/* About Section */}
            <div className="space-y-3">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  About This Event
                </h2>
                <div
                  ref={aboutRef}
                  className="text-gray-300 text-sm leading-relaxed whitespace-pre-line transition-all duration-300"
                  style={
                    aboutExpanded
                      ? {}
                      : {
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }
                  }
                >
                  {event.about}
                </div>
                {aboutCanExpand && (
                  <button
                    type="button"
                    onClick={() => setAboutExpanded((prev) => !prev)}
                    className="text-sm font-medium text-red-600 hover:text-red-500 transition"
                  >
                    {aboutExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-700 my-6"></div>

            {/* Event Guide Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Event Guide</h2>
                {event.advisoryItems?.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(true)}
                    className="text-red-600 hover:text-red-500 flex items-center gap-1 text-sm font-medium transition-colors"
                  >
                    See all <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {event.advisoryItems?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {event.advisoryItems.slice(0, 4).map((item, idx) => {
                    const getIcon = (text) => {
                      const lower = text.toLowerCase();

                      // Age restrictions
                      if (lower.includes('18+') || lower.includes('18 +') || lower.includes('age limit') ||
                          lower.includes('age restriction') || lower.includes('adults only') ||
                          lower.includes('21+') || lower.includes('21 +') || lower.includes('mature')) return '🔞';

                      // Parking
                      if (lower.includes('parking') || lower.includes('valet') || lower.includes('vehicle')) return '🅿️';

                      // ID/Documents
                      if (lower.includes('id') || lower.includes('identification') || lower.includes('valid id') ||
                          lower.includes('government id') || lower.includes('photo id') ||
                          lower.includes('passport') || lower.includes('license') || lower.includes('proof')) return '🆔';

                      // Food & Drinks
                      if (lower.includes('food') || lower.includes('drink') || lower.includes('beverage') ||
                          lower.includes('refreshment') || lower.includes('meal') || lower.includes('dining') ||
                          lower.includes('outside food') || lower.includes('outside drink') ||
                          lower.includes('catering') || lower.includes('restaurant')) return '🍽️';

                      // Photography/Camera
                      if (lower.includes('camera') || lower.includes('photo') || lower.includes('photography') ||
                          lower.includes('recording') || lower.includes('video') || lower.includes('filming')) return '📸';

                      // Entry/Gate/Doors
                      if (lower.includes('entry') || lower.includes('gate') || lower.includes('door') ||
                          lower.includes('entrance') || lower.includes('admission') || lower.includes('check-in') ||
                          lower.includes('checkin') || lower.includes('arrive') || lower.includes('arrival')) return '🚪';

                      // Timing/Schedule
                      if (lower.includes('time') || lower.includes('schedule') || lower.includes('timing') ||
                          lower.includes('start') || lower.includes('duration') || lower.includes('hours') ||
                          lower.includes('clock') || lower.includes('punctual')) return '⏰';

                      // Dress Code
                      if (lower.includes('dress') || lower.includes('attire') || lower.includes('clothing') ||
                          lower.includes('outfit') || lower.includes('formal') || lower.includes('casual') ||
                          lower.includes('wear')) return '👔';

                      // Safety/Security
                      if (lower.includes('security') || lower.includes('safety') || lower.includes('safe') ||
                          lower.includes('emergency') || lower.includes('first aid') || lower.includes('medical')) return '🛡️';

                      // Prohibited Items
                      if (lower.includes('prohibited') || lower.includes('not allowed') || lower.includes('banned') ||
                          lower.includes('restricted') || lower.includes('forbidden') || lower.includes('no smoking') ||
                          lower.includes('weapons') || lower.includes('drugs')) return '🚫';

                      // Tickets/Passes
                      if (lower.includes('ticket') || lower.includes('pass') || lower.includes('wristband') ||
                          lower.includes('badge') || lower.includes('qr') || lower.includes('barcode')) return '🎫';

                      // Weather
                      if (lower.includes('weather') || lower.includes('rain') || lower.includes('outdoor') ||
                          lower.includes('indoor') || lower.includes('umbrella') || lower.includes('sun')) return '⛅';

                      // Accessibility
                      if (lower.includes('wheelchair') || lower.includes('accessible') || lower.includes('disability') ||
                          lower.includes('special needs') || lower.includes('mobility')) return '♿';

                      // Children/Kids
                      if (lower.includes('child') || lower.includes('kid') || lower.includes('minor') ||
                          lower.includes('baby') || lower.includes('stroller') || lower.includes('family')) return '👶';

                      // Pets/Animals
                      if (lower.includes('pet') || lower.includes('dog') || lower.includes('animal') ||
                          lower.includes('service animal')) return '🐕';

                      // Seating
                      if (lower.includes('seat') || lower.includes('chair') || lower.includes('standing') ||
                          lower.includes('reserved seating')) return '💺';

                      // Default icon for custom advisories
                      return '⚠️';
                    };

                    return (
                      <div
                        key={`advisory-preview-${idx}`}
                        className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                      >
                        <span className="text-lg flex-shrink-0">{getIcon(item)}</span>
                        <span className="text-sm text-gray-300">{item}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No advisories provided.</p>
              )}
            </div>

            <div className="h-px bg-gray-700 my-6"></div>

            {/* Artist Section */}
            {event.artists?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Artists</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.artists.map((artist) => (
                    <div
                      key={artist.id || artist.name}
                      className="flex gap-4 items-center"
                    >
                      <img
                        src={getArtistImage(artist)}
                        alt={artist.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="space-y-2">
                        <p className="text-white font-medium text-base">{artist.name}</p>
                        <div className="flex gap-3 text-xs font-medium">
                          {artist.instagramLink && (
                            <a
                              href={artist.instagramLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-red-600 hover:text-red-500"
                            >
                              Instagram
                            </a>
                          )}
                          {artist.spotifyLink && (
                            <a
                              href={artist.spotifyLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-red-600 hover:text-red-500"
                            >
                              Spotify
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="h-px bg-gray-700 my-6"></div>

            {/* Gallery Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Event Gallery</h2>
              </div>
              <div 
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {/* First Column - 2 stacked images */}
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {event.gallery[0] && (
                    <div
                      onClick={() => setSelectedImage(event.gallery[0])}
                      className="relative w-40 h-28 md:w-52 md:h-36 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                    >
                      <img
                        src={event.gallery[0]}
                        alt="Gallery 1"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {event.gallery[1] && (
                    <div
                      onClick={() => setSelectedImage(event.gallery[1])}
                      className="relative w-40 h-28 md:w-52 md:h-36 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                    >
                      <img
                        src={event.gallery[1]}
                        alt="Gallery 2"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Second Column - 2 stacked images */}
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {event.gallery[2] && (
                    <div
                      onClick={() => setSelectedImage(event.gallery[2])}
                      className="relative w-40 h-28 md:w-52 md:h-36 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                    >
                      <img
                        src={event.gallery[2]}
                        alt="Gallery 3"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {event.gallery[3] && (
                    <div
                      onClick={() => setSelectedImage(event.gallery[3])}
                      className="relative w-40 h-28 md:w-52 md:h-36 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                    >
                      <img
                        src={event.gallery[3]}
                        alt="Gallery 4"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Third Column - 1 tall image */}
                {event.gallery[4] && (
                  <div
                    onClick={() => setSelectedImage(event.gallery[4])}
                    className="relative w-48 h-58 md:w-64 md:h-74 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                    style={{ height: 'calc(2 * 9rem + 0.75rem)' }}
                  >
                    <img
                      src={event.gallery[4]}
                      alt="Gallery 5"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}

                {/* Additional images - horizontal scroll items */}
                {event.gallery.slice(5).map((image, index) => (
                  <div
                    key={index + 5}
                    onClick={() => setSelectedImage(image)}
                    className="relative w-48 h-58 md:w-64 md:h-74 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0"
                    style={{ height: 'calc(2 * 9rem + 0.75rem)' }}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 6}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ))}
              </div>
              <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
            </div>

            <div className="h-px bg-gray-700 my-6"></div>

            {/* Location Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Venue</h2>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-transparent border border-gray-700/50">
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">{event.venue}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{event.address}</p>
                </div>
                <Button
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800 hover:text-white flex items-center gap-2"
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`, '_blank')}
                >
                  <MapPin className="h-4 w-4" />
                  Get Directions
                </Button>
              </div>

              {/* Map */}
              {/* <div className="relative h-64 md:h-80 rounded-xl overflow-hidden bg-gray-800 mt-4">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(event.address)}`}
                  allowFullScreen
                  title="Event Location Map"
                  className="grayscale"
                ></iframe>
              </div> */}
            </div>

            {/* <div className="h-px bg-gray-700 my-6"></div> */}

            {/* Organizer Section */}
            {/* <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white">Organized By</h2>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <img
                  src={event.organizer.logo}
                  alt={event.organizer.name}
                  className="w-20 h-20 rounded-lg object-cover border border-gray-700"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-white">{event.organizer.name}</h3>
                    {event.organizer.verified && (
                      <Badge className="bg-green-600/20 text-green-400 border border-green-600/30 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3">{event.organizer.bio}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-500">
                      <strong className="text-white">{event.organizer.eventsOrganized}</strong> Events
                    </span>
                    <span className="text-gray-500">
                      <strong className="text-white">{event.organizer.followers.toLocaleString()}</strong> Followers
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-white">{event.organizer.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-white">{event.organizer.phone}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                  <Globe className="h-5 w-5 text-gray-400" />
                  <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-500">
                    {event.organizer.website}
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button variant="outline" className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button variant="outline" className="flex-1 border-gray-700 text-white hover:bg-gray-800">
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
              </div>
            </div> */}

            <div className="h-px bg-gray-700 my-6"></div>

            {/* Organizer Note Section */}
            {event.organizerNote?.trim?.() && (
              <div className="space-y-3">
                <div className="rounded-xl bg-transparent border border-gray-700/50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-2">Organizer Note</h2>
                      <div
                        className="text-sm text-gray-300 leading-relaxed whitespace-pre-line transition-all duration-300"
                        style={
                          organizerNoteExpanded
                            ? {}
                            : {
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }
                        }
                      >
                        {event.organizerNote}
                      </div>
                      {organizerNoteCanExpand && (
                        <button
                          type="button"
                          onClick={() => setOrganizerNoteExpanded((prev) => !prev)}
                          className="text-sm font-medium text-red-600 hover:text-red-500 transition mt-2"
                        >
                          {organizerNoteExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="h-px bg-gray-700 my-6"></div>

            {/* FAQ & Terms & Conditions Section */}
            <div className="space-y-3">
              {normalizedFaqs.length > 0 && (
                <div className="rounded-xl border border-gray-700/50 overflow-hidden bg-transparent">
                  <button
                    className="w-full flex items-center justify-between gap-2 text-left px-5 py-4 transition"
                    onClick={() => setFaqOpen((prev) => !prev)}
                  >
                    <span className="text-white font-semibold text-lg">
                      Frequently Asked Questions
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-gray-400 transition-transform ${faqOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {faqOpen && (
                    <div className="border-t border-gray-800 divide-y divide-gray-800/20">
                      {normalizedFaqs.map((qa, idx) => (
                        <div key={`faq-${idx}`} className="px-5 py-2">
                          <p className="text-white font-semibold text-base mb-1">{qa.question}</p>
                          {qa.answer ? (
                            <p className="text-gray-400 text-sm leading-relaxed">{qa.answer}</p>
                          ) : (
                            <p className="text-gray-500 text-xs">No answer provided.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-gray-700/50 overflow-hidden bg-transparent">
                <button
                  className="w-full flex items-center justify-between gap-2 text-left px-5 py-4 transition"
                  onClick={() => setTcOpen((prev) => !prev)}
                >
                  <span className="text-white font-semibold text-lg">
                    Terms & Conditions
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${tcOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {tcOpen && (
                  <div className="border-t border-gray-800 px-5 py-4 bg-transparent">
                    {normalizedTerms.length > 0 ? (
                      normalizedTerms.map((t, idx) => (
                        <div key={`term-${idx}`} className="mb-2 last:mb-0">
                          {getTermHtml(t) ? (
                            <div
                              className="text-gray-400 text-[11px] leading-4 space-y-1"
                              dangerouslySetInnerHTML={{ __html: getTermHtml(t) }}
                            />
                          ) : (
                            renderTermsContent()
                          )}
                          {t.lastUpdated && (
                            <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(t.lastUpdated).toLocaleDateString()}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      renderTermsContent()
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Advisory Modal */}
            <Dialog open={advisoryModalOpen} onOpenChange={setAdvisoryModalOpen}>
              <DialogContent className="max-w-lg border-gray-800 bg-gray-900 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Event Guide</DialogTitle>
                  <DialogDescription className="text-gray-400 text-sm">
                    All advisories and notes for this event
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {event?.advisoryItems?.length ? (
                    event.advisoryItems.map((item, idx) => {
                      const getIcon = (text) => {
                        const lower = text.toLowerCase();

                        // Age restrictions
                        if (lower.includes('18+') || lower.includes('18 +') || lower.includes('age limit') ||
                            lower.includes('age restriction') || lower.includes('adults only') ||
                            lower.includes('21+') || lower.includes('21 +') || lower.includes('mature')) return '🔞';

                        // Parking
                        if (lower.includes('parking') || lower.includes('valet') || lower.includes('vehicle')) return '🅿️';

                        // ID/Documents
                        if (lower.includes('id') || lower.includes('identification') || lower.includes('valid id') ||
                            lower.includes('government id') || lower.includes('photo id') ||
                            lower.includes('passport') || lower.includes('license') || lower.includes('proof')) return '🆔';

                        // Food & Drinks
                        if (lower.includes('food') || lower.includes('drink') || lower.includes('beverage') ||
                            lower.includes('refreshment') || lower.includes('meal') || lower.includes('dining') ||
                            lower.includes('outside food') || lower.includes('outside drink') ||
                            lower.includes('catering') || lower.includes('restaurant')) return '🍽️';

                        // Photography/Camera
                        if (lower.includes('camera') || lower.includes('photo') || lower.includes('photography') ||
                            lower.includes('recording') || lower.includes('video') || lower.includes('filming')) return '📸';

                        // Entry/Gate/Doors
                        if (lower.includes('entry') || lower.includes('gate') || lower.includes('door') ||
                            lower.includes('entrance') || lower.includes('admission') || lower.includes('check-in') ||
                            lower.includes('checkin') || lower.includes('arrive') || lower.includes('arrival')) return '🚪';

                        // Timing/Schedule
                        if (lower.includes('time') || lower.includes('schedule') || lower.includes('timing') ||
                            lower.includes('start') || lower.includes('duration') || lower.includes('hours') ||
                            lower.includes('clock') || lower.includes('punctual')) return '⏰';

                        // Dress Code
                        if (lower.includes('dress') || lower.includes('attire') || lower.includes('clothing') ||
                            lower.includes('outfit') || lower.includes('formal') || lower.includes('casual') ||
                            lower.includes('wear')) return '👔';

                        // Safety/Security
                        if (lower.includes('security') || lower.includes('safety') || lower.includes('safe') ||
                            lower.includes('emergency') || lower.includes('first aid') || lower.includes('medical')) return '🛡️';

                        // Prohibited Items
                        if (lower.includes('prohibited') || lower.includes('not allowed') || lower.includes('banned') ||
                            lower.includes('restricted') || lower.includes('forbidden') || lower.includes('no smoking') ||
                            lower.includes('weapons') || lower.includes('drugs')) return '🚫';

                        // Tickets/Passes
                        if (lower.includes('ticket') || lower.includes('pass') || lower.includes('wristband') ||
                            lower.includes('badge') || lower.includes('qr') || lower.includes('barcode')) return '🎫';

                        // Weather
                        if (lower.includes('weather') || lower.includes('rain') || lower.includes('outdoor') ||
                            lower.includes('indoor') || lower.includes('umbrella') || lower.includes('sun')) return '⛅';

                        // Accessibility
                        if (lower.includes('wheelchair') || lower.includes('accessible') || lower.includes('disability') ||
                            lower.includes('special needs') || lower.includes('mobility')) return '♿';

                        // Children/Kids
                        if (lower.includes('child') || lower.includes('kid') || lower.includes('minor') ||
                            lower.includes('baby') || lower.includes('stroller') || lower.includes('family')) return '👶';

                        // Pets/Animals
                        if (lower.includes('pet') || lower.includes('dog') || lower.includes('animal') ||
                            lower.includes('service animal')) return '🐕';

                        // Seating
                        if (lower.includes('seat') || lower.includes('chair') || lower.includes('standing') ||
                            lower.includes('reserved seating')) return '💺';

                        // Default icon for custom advisories
                        return '⚠️';
                      };

                      return (
                        <div
                          key={`advisory-modal-${idx}`}
                          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                        >
                          <span className="text-xl flex-shrink-0">{getIcon(item)}</span>
                          <p className="text-white text-sm">{item}</p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No advisories provided.</p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Column - Booking Section */}
          <div className="lg:col-span-1" id="ticket-section">
            <div className="space-y-3">
              <div className="rounded-xl border border-gray-700/50 p-4 space-y-3 bg-transparent">
                <h1 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-red-600" />
                  Select Tickets
                </h1>

                <div className="space-y-3">
                  {event.tickets.map((ticket) => {
                    const cap = getTicketCap(ticket);
                    const qty = ticketQuantities[ticket.id] || 0;
                    return (
                      <div
                        key={ticket.id}
                        className={`p-4 rounded-xl border border-gray-700/50 bg-transparent ${ticket.available === 0 ? "opacity-60" : ""}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-white text-xl">{ticket.name}</h4>
                          <span className="text-xl font-bold text-red-600">{formatCurrency(ticket.price)}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">{ticket.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-gray-500">
                            <p>{ticket.available} available</p>
                            {Number.isFinite(cap) && cap < Infinity && (
                              <p className="text-gray-600 mt-0.5">Max {cap} per user</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(ticket.id, -1)}
                              disabled={!qty || isSalesClosed || ticket.available === 0}
                              className="h-7 w-7 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-lg font-bold text-white">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(ticket.id, 1)}
                              disabled={isSalesClosed || ticket.available === 0 || qty >= cap}
                              className="h-7 w-7 rounded-full border border-gray-600 flex items-center justify-center text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        {ticket.available === 0 && (
                          <p className="text-gray-500 text-xs mt-2">Sold out</p>
                        )}
                        {ticket.available > 0 && Number.isFinite(cap) && cap < Infinity && qty >= cap && (
                          <p className="text-gray-500 text-xs mt-2">Max per user limit reached</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-gray-800 flex justify-between items-center text-sm">
                  <span className="text-gray-400">Tickets</span>
                  <span className="font-semibold text-white text-base">{totalTickets}</span>
                </div>

                <Button
                  onClick={handleBookNow}
                  disabled={totalTickets === 0 || isSalesClosed || isSoldOut}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-all text-sm py-4 rounded-lg"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  {bookingDisabledReason || "Book Now"}
                </Button>

                <p className="text-[11px] text-center text-gray-500">
                  {bookingDisabledReason ? "Booking unavailable" : "Secure payment • Instant confirmation"}
                </p>
              </div>

              {/* Event Stats */}
              {/* <Card className="border-2 border-[rgba(100,200,255,0.2)] bg-gradient-to-br from-[rgba(255,255,255,0.08)] to-[rgba(59,130,246,0.05)] rounded-xl mt-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#fbbf24]" />
                      <span className="text-2xl font-bold text-white">{event.rating}</span>
                    </div>
                    <span className="text-sm text-[rgba(255,255,255,0.65)]">{event.reviews} reviews</span>
                  </div>
                  <div className="space-y-2 text-sm text-[rgba(255,255,255,0.8)]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                      <span>Trending in {event.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total revenue</span>
                      <span className="font-semibold">{formatCurrency(event.revenue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tickets sold</span>
                      <span className="font-semibold">{event.ticketsSold ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Confirmed bookings</span>
                      <span className="font-semibold">{event.confirmedBookings ?? event.attendees ?? "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
          {galleryImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  showPreviousImage();
                }}
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </Button>
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  showNextImage();
                }}
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
                aria-label="Next image"
              >
                <ChevronRight className="h-7 w-7" />
              </Button>
            </>
          )}
          <img
            src={selectedImage}
            alt="Gallery"
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
          {galleryImages.length > 1 && selectedImageIndex !== -1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white/80"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImageIndex + 1} / {galleryImages.length}
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="border-gray-800 bg-gray-900 text-white max-w-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Sign in to book instantly
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Secure checkout with email or Google. We'll auto-apply your details to the ticket.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={authMode} onValueChange={setAuthMode} className="mt-2">
            <TabsList className="grid grid-cols-2 bg-gray-800">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4 space-y-4">
              <form className="space-y-4" onSubmit={handleInlineLogin}>
                <div className="space-y-2">
                  <Label htmlFor="inline-email">Email</Label>
                  <Input
                    id="inline-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inline-password">Password</Label>
                  <Input
                    id="inline-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Link
                    to={`/auth?type=user&forgot=true${loginForm.email.trim() ? `&email=${encodeURIComponent(loginForm.email.trim())}` : ""}`}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button type="submit" className="w-full py-5 bg-red-600 hover:bg-red-700" disabled={authLoading}>
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing you in...
                    </span>
                  ) : (
                    "Login & Book"
                  )}
                </Button>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-500">or continue with</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-700 text-white bg-gray-800 hover:bg-gray-700"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-4 space-y-4">
              <form className="space-y-4" onSubmit={handleInlineSignup}>
                <div className="space-y-2">
                  <Label htmlFor="inline-name">Full Name</Label>
                  <Input
                    id="inline-name"
                    placeholder="Your name"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inline-signup-email">Email</Label>
                  <Input
                    id="inline-signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inline-signup-phone">Phone</Label>
                  <Input
                    id="inline-signup-phone"
                    type="tel"
                    placeholder="10-15 digits"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inline-signup-password">Password</Label>
                  <Input
                    id="inline-signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full py-5 bg-green-600 hover:bg-green-700" disabled={authLoading}>
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your account...
                    </span>
                  ) : (
                    "Sign Up & Book"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Billing Details Modal */}
      <BillingDetailsModal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        onSubmit={handleBillingSubmit}
        isLoading={bookingLoading}
        user={sessionUser}
      />
    </div>
  );
};

export default EventDetailNew;
