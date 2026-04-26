import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, Clock, Globe, Upload, X, ChevronLeft, Plus, Ticket, Users, Table2, UsersRound, Loader2, Smile } from "lucide-react";
import Header from "@/components/Header";
import LoadingOverlay from "@/components/LoadingOverlay";
import { toast } from "sonner";
import { useEvents } from "@/hooks/useEvents";
import eventMusic from "@/assets/event-music.jpg";
import TicketTypeModal from "@/components/TicketTypeModal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updateEventStep1, updateEventStep2, uploadFlyerImage, deleteFlyerImage, uploadGalleryImages, deleteGalleryImage, generateEventId, createTicket, deleteTicket, createVenue, updateVenue, createArtist, updateEventStep6, uploadArtistImage, createEventStep1, persistFlyerUrl, uploadDraftImage, persistGalleryUrls, deleteDraftCloudinaryImage } from "@/services/eventService";
import { apiFetch } from "@/config/api";
import {
  DEFAULT_EVENT_DETAIL_TEMPLATE,
  getAvailableEventDetailTemplates,
  getEventDetailTemplateOption,
  normalizeEventDetailTemplateId,
} from "@/config/eventDetailTemplates";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  // Map URL type query to backend enum values
  const eventTypeMapping = {
    "guest-list": "GUESTLIST",
    "exclusive": "EXCLUSIVE",
    "non-exclusive": "NON_EXCLUSIVE",
  };
  const { addEvent, events, updateEvent } = useEvents();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState("one-time");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverPublicId, setCoverPublicId] = useState(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]); // Existing images from backend (URLs)
  const [galleryImages, setGalleryImages] = useState([]); // All images (existing URLs + new previews)
  const [galleryImageFiles, setGalleryImageFiles] = useState([]); // Only NEW files to upload
  const [galleryImageIds, setGalleryImageIds] = useState([]); // Map of URL -> ID for deletion
  const [galleryImagePublicIds, setGalleryImagePublicIds] = useState({}); // Map URL -> Cloudinary publicId
  const [deletedImageIds, setDeletedImageIds] = useState(new Set()); // Track deleted image IDs to filter them out
  const [imagesChanged, setImagesChanged] = useState(false);
  const [textFieldsChanged, setTextFieldsChanged] = useState(false); // Track if text fields changed
  const [removeFlyerImage, setRemoveFlyerImage] = useState(false); // Track if flyer should be removed
  const [removeGalleryIds, setRemoveGalleryIds] = useState([]); // Track gallery image IDs to remove
  const [uploadingCover, setUploadingCover] = useState(false); // Loader for cover image upload
  const [uploadingGallery, setUploadingGallery] = useState(false); // Loader for gallery upload
  const [draftCoverPublicId, setDraftCoverPublicId] = useState(null); // Store draft cover publicId for later persistence
  const [draftGalleryUploads, setDraftGalleryUploads] = useState([]); // Store draft gallery uploads { url, publicId }
  const [loadingMessage, setLoadingMessage] = useState(""); // Message for loading overlay
  const [showLoading, setShowLoading] = useState(false); // Control loading overlay visibility
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [savedTickets, setSavedTickets] = useState([]);
  const [createdTicketIds, setCreatedTicketIds] = useState([]); // Track created tickets
  const [eventId, setEventId] = useState(null);
  const [backendEventId, setBackendEventId] = useState(null); // Store backend's event ID
  const [venueId, setVenueId] = useState(null); // Store venue ID if it exists
  const [venueCreated, setVenueCreated] = useState(false); // Track if venue was created
  const [originalVenueData, setOriginalVenueData] = useState(null); // Store original venue data for change detection
  const [createdArtistIndices, setCreatedArtistIndices] = useState([]); // Track created artists
  const [currentEventType, setCurrentEventType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_EVENT_DETAIL_TEMPLATE);
  const today = new Date();
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [originalDateTime, setOriginalDateTime] = useState({ start: null, end: null }); // Track original start/end for change detection
  const emptySponsor = {
    name: "",
    websiteUrl: "",
    logoUrl: "",
    isPrimary: false,
  };
  const [sponsors, setSponsors] = useState([emptySponsor]);
  const [originalSponsors, setOriginalSponsors] = useState([]);
  const [originalArtists, setOriginalArtists] = useState([]);
  const [sponsorUploadIndex, setSponsorUploadIndex] = useState(null);
  const [sponsorSaving, setSponsorSaving] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [originalIsSponsored, setOriginalIsSponsored] = useState(false);
  const [publishState, setPublishState] = useState("DRAFT");
  const [isPublished, setIsPublished] = useState(false);
  const eventCacheRef = useRef(null);
  const editHydratedRef = useRef(null);
  const sponsorsLoadedRef = useRef(false);
  const artistsLoadedRef = useRef(false);
  const originalAdditionalRef = useRef(null);
  const currentAdditionalRef = useRef(null);
  const eventFetchInProgressRef = useRef(false);
  const coverImageInputRef = useRef(null);

  const normalizeAdditionalFromState = () => ({
    tc: (termsAndConditions || "").trim(),
    advisory: { ...advisory },
    customAdvisories: [...customAdvisories],
    questions: [...customQuestions],
    organizerNote: (organizerNote || "").trim(),
  });

  const hourOptions = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
  const isValidDateObject = (date) => date instanceof Date && !Number.isNaN(date.getTime());
  const parseSafeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isValidDateObject(date) ? date : null;
  };
  const parseSafeDateOnly = (value) => {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return isValidDateObject(date) ? date : null;
  };

  const formatDateValue = (value) => {
    if (!value) return "";
    const date = parseSafeDateOnly(value);
    return date ? format(date, "dd MMM yyyy") : value;
  };

  const parseTime = (value) => {
    if (!value) return { hour: "", minute: "00", ampm: "AM" };
    const [h, m = "00"] = value.split(":");
    const hourNum = Number(h) || 0;
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return { hour: String(hour12).padStart(2, "0"), minute: String(m).padStart(2, "0"), ampm };
  };

  const buildTime = (hour12, minute, ampm) => {
    if (!hour12) return "";
    const base = Number(hour12) % 12;
    const h24 = (ampm === "PM" ? base + 12 : base === 12 ? 0 : base).toString().padStart(2, "0");
    return `${h24}:${minute || "00"}`;
  };

  const formatTimeDisplay = (value) => {
    if (!value) return "Pick a time";
    const { hour, minute, ampm } = parseTime(value);
    return `${hour}:${minute} ${ampm}`;
  };

  const TimePicker = ({ value, onChange, onClose }) => {
    const { hour, minute, ampm } = parseTime(value);
    const setPart = (h = hour, m = minute, ap = ampm, close = false) => {
      onChange(buildTime(h, m, ap));
      if (close) onClose?.();
    };

    const itemBase =
      "w-full text-left px-3 py-2 rounded-xl border border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-[#D60024]/50 hover:text-white transition";
    const itemActive = "border-[#D60024] bg-[#D60024]/10 text-white";

    return (
      <div className="grid grid-cols-3 gap-2 p-2 bg-[#0a0a0a] rounded-xl border border-gray-700 w-[280px]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.08em] text-white/60">Hour</p>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
            {hourOptions.map((h) => (
              <button
                key={h}
                type="button"
                className={`${itemBase} ${h === hour ? itemActive : ""}`}
                onClick={() => setPart(h, minute, ampm, false)}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.08em] text-white/60">Minute</p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
            {minuteOptions.map((m) => (
              <button
                key={m}
                type="button"
                className={`${itemBase} ${m === minute ? itemActive : ""}`}
                onClick={() => setPart(hour, m, ampm, true)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.08em] text-white/60">AM/PM</p>
          <div className="space-y-2">
            {["AM", "PM"].map((ap) => (
              <button
                key={ap}
                type="button"
                className={`${itemBase} ${ap === ampm ? itemActive : ""}`}
                onClick={() => setPart(hour, minute, ap, true)}
              >
                {ap}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  const editId = searchParams.get('edit');
  const eventTypeParam = searchParams.get('type');
  const isEditMode = !!editId;

  const clearTransientUiState = () => {
    setIsSubmitting(false);
    setShowLoading(false);
    setLoadingMessage("");
    setTicketModalOpen(false);
    setSelectedTicketType(null);
    setShowEmojiPicker(false);
    setAdvisoryDialogOpen(false);
    setStartCalendarOpen(false);
    setEndCalendarOpen(false);
    setStartTimeOpen(false);
    setEndTimeOpen(false);
  };

  const releaseGlobalOverlayLocks = () => {
    if (typeof document === "undefined") return;
    document.body.style.pointerEvents = "";
    document.body.style.overflow = "";
    document.body.removeAttribute("data-scroll-locked");
    document.body.removeAttribute("aria-hidden");
  };

  const buildEventFetchUrl = ({ eventId, organizerSlug, eventSlug, bustCache = false }) => {
    const suffix = bustCache ? `?t=${Date.now()}` : "";

    // This page is organizer-authenticated; fetch by protected endpoint so drafts are accessible.
    if (eventId) {
      return `api/event/manage/${encodeURIComponent(eventId)}${suffix}`;
    }

    if (organizerSlug && eventSlug) {
      return `api/event/${encodeURIComponent(organizerSlug)}/${encodeURIComponent(eventSlug)}${suffix}`;
    }

    return null;
  };

  const normalizeTicketForEdit = (ticket) => {
    if (!ticket) return null;

    const typeMap = {
      GUESTLIST: "vip-guest",
      STANDARD_TICKET: "standard",
      TABLE_TICKET: "table",
      GROUP_TICKET: "group-pass",
    };

    const entryTypeLabelMap = {
      SINGLE_ENTRY: "Single",
      COUPLE_ENTRY: "Couple",
    };

    const ticketTypeLabelMap = {
      GUESTLIST: "Guest List",
      STANDARD_TICKET: "Standard Ticket",
      TABLE_TICKET: "Table Ticket",
      GROUP_TICKET: "Group Pass",
    };

    return {
      id: ticket.id,
      publicId: ticket.publicId || "",
      ticketName: ticket.name || "",
      ticketCategory: entryTypeLabelMap[ticket.entryType] || "Single",
      ticketEntryType: ticketTypeLabelMap[ticket.type] || "Standard Ticket",
      price: String(ticket.price ?? 0),
      quantity: String(ticket.totalQty ?? 0),
      available: Number(ticket.totalQty ?? 0),
      soldQty: Number(ticket.soldQty ?? 0),
      description: ticket.info || "",
      maxPerCustomer: String(ticket.maxPerUser ?? 10),
      purchaseExpiry: ticket.purchaseExpiry || "",
      comingSoon: Boolean(ticket.comingSoon),
      onsiteOnly: Boolean(ticket.onGroundOnly),
      type: typeMap[ticket.type] || "standard",
      gstRate: ticket.gstRate ?? 18,
      gstType: ticket.gstType || "",
    };
  };

  useEffect(() => {
    clearTransientUiState();
    releaseGlobalOverlayLocks();

    return () => {
      releaseGlobalOverlayLocks();
    };
  }, [location.key, editId]);

  // Form data
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [mainCategory, setMainCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [venueName, setVenueName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [postalCode, setPostalCode] = useState("");
  const [venueContact, setVenueContact] = useState("");
  const [venueEmail, setVenueEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("one-time");
  const [originalDateInputs, setOriginalDateInputs] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
  });
  const [ticketPrice, setTicketPrice] = useState("49");
  const [artists, setArtists] = useState([{ name: "", photo: "", image: "", instagram: "", spotify: "", gender: "PREFER_NOT_TO_SAY" }]);
  const initialAdvisoryState = {
    smokingAllowed: false,
    drinkingAllowed: false,
    petsAllowed: false,
    ageRestricted: false,
    camerasAllowed: false,
    outsideFoodAllowed: false,
    seatingProvided: false,
    wheelchairAccessible: false,
    liveMusic: false,
    parkingAvailable: false,
    reentryAllowed: false,
    onsitePayments: false,
    securityCheck: false,
    cloakroom: false,
  };

  const [advisory, setAdvisory] = useState(initialAdvisoryState);
  const [customAdvisories, setCustomAdvisories] = useState([]);
  const [newCustomAdvisory, setNewCustomAdvisory] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [advisoryDialogOpen, setAdvisoryDialogOpen] = useState(false);
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [customQuestions, setCustomQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [organizerNote, setOrganizerNote] = useState("");
  const [selectedEventTypeCategory, setSelectedEventTypeCategory] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [venueThemePulse, setVenueThemePulse] = useState(false);
  const [editHydrationError, setEditHydrationError] = useState("");
  const [isEditHydrating, setIsEditHydrating] = useState(false);

  // Ensure backendEventId is set when editing (even if session flags are missing)
  useEffect(() => {
    if (isEditMode && editId && !backendEventId) {
      setBackendEventId(editId);
      sessionStorage.setItem('draftEventId', editId);
      sessionStorage.setItem('draftStarted', 'true');
    }
  }, [isEditMode, editId, backendEventId]);

  // Small pulse to emphasize manual entry section
  useEffect(() => {
    if (currentStep === 4) {
      setVenueThemePulse(true);
      const timer = setTimeout(() => setVenueThemePulse(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Theme matching EventDetailNew - black/dark with red accent
  const pageTheme = {
    background: "bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#050510]",
    card: "bg-[#0a0a0a]/80",
    border: "#1f1f1f",
    accent: "#D60024",
    text: "text-white",
    muted: "text-gray-400",
    glow: "0 14px 32px rgba(0, 0, 0, 0.28)",
  };

  const fieldClass =
    "h-12 bg-[#0f0f0f] border border-[#262626] rounded-[10px] px-[14px] text-sm text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#ef4444] focus-visible:shadow-[0_0_0_1px_#ef4444] transition-[border,box-shadow,background] duration-200";
  const cardBase = "create-event-card border border-[#1f1f1f] bg-[#0c0c0c] rounded-2xl transition-all duration-200 hover:border-[#2a2a2a]";
  const selectMenuClass = "bg-[#0f0f0f] text-white border border-[#262626] rounded-[10px]";

  const ensureBackendEventId = async () => {
    if (backendEventId) return backendEventId;

    if (!eventTitle.trim() || !mainCategory || selectedCategories.length === 0) {
      toast.error("Add title, category, and subcategory before uploading images.");
      return null;
    }

    try {
      setIsSubmitting(true);
      setLoadingMessage("Creating draft event...");
      setShowLoading(true);

      const payload = {
        title: eventTitle,
        description: eventDescription,
        category: mainCategory,
        subCategory: selectedCategories[0] || "",
      };
      if (currentEventType) {
        payload.type = currentEventType;
      }

      const resp = await apiFetch('api/event/create-event', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const backendId = resp.data?.id || resp.data?._id || resp.id || resp._id;
      if (!backendId) {
        toast.error("Could not create draft event. Please try again.");
        return null;
      }
      setBackendEventId(backendId);
      sessionStorage.setItem('draftStarted', 'true');
      sessionStorage.setItem('draftEventId', backendId);
      toast.success("Draft created. You can upload images now.");
      return backendId;
    } catch (err) {
      console.error("Failed to create draft before upload:", err);
      toast.error(err.message || "Failed to create draft event.");
      return null;
    } finally {
      setIsSubmitting(false);
      setShowLoading(false);
    }
  };

  const categoryHierarchy = {
    Music: [
      "Live Concerts",
      "Club Nights",
      "Music Festivals",
      "Bollywood",
      "Hip Hop",
      "Electronic",
      "Melodic",
      "Live Music",
      "Metal",
      "Rap",
      "Music House",
      "Techno",
      "K-pop",
      "Hollywood",
      "POP",
      "Punjabi",
      "Disco",
      "Rock",
      "Afrobeat",
      "Dance Hall",
      "Thumri",
      "Bolly Tech",
    ],
    Workshop: [
      "Comedy Shows",
      "Theater Shows",
      "Sports",
      "Arts",
      "Meeting",
      "Conference",
      "Seminar",
      "Yoga",
      "Cooking",
      "Dance",
      "Self Help",
      "Consultation",
      "Corporate Event",
      "Communication"
    ]
  };

  // Load saved tickets and venue data when component mounts or when backendEventId changes
  useEffect(() => {
    if (backendEventId) {
      // Load tickets
      const savedTicketsData = localStorage.getItem(`event_${backendEventId}_tickets`);
      if (savedTicketsData) {
        try {
          const parsedTickets = JSON.parse(savedTicketsData);
          setSavedTickets(parsedTickets);
          
          // Extract ticket IDs that were already created in the backend
          const existingTicketIds = parsedTickets
            .filter(ticket => ticket.id)
            .map(ticket => ticket.id);
            
          if (existingTicketIds.length > 0) {
            setCreatedTicketIds(existingTicketIds);
          }
        } catch (error) {
          console.error("Error parsing saved tickets:", error);
          localStorage.removeItem(`event_${backendEventId}_tickets`);
        }
      } else if (Array.isArray(eventCacheRef.current?.tickets) && eventCacheRef.current.tickets.length > 0) {
        const normalizedTickets = eventCacheRef.current.tickets
          .map(normalizeTicketForEdit)
          .filter(Boolean);

        setSavedTickets(normalizedTickets);
        setCreatedTicketIds(normalizedTickets.map((ticket) => ticket.id).filter(Boolean));
        localStorage.setItem(`event_${backendEventId}_tickets`, JSON.stringify(normalizedTickets));
      }
      
      // Load venue data from localStorage if it exists
      const loadVenueData = async () => {
        try {
          const savedVenueId = localStorage.getItem(`event_${backendEventId}_venueId`);
          const savedVenueData = localStorage.getItem(`event_${backendEventId}_venueData`);
          
          if (savedVenueId && savedVenueData) {
            // Set the venue ID and mark as created first
            setVenueId(savedVenueId);
            setVenueCreated(true);
            
            // Parse and set the venue data
            const venueData = JSON.parse(savedVenueData);
            setVenueName(venueData.name || '');
            setCity(venueData.city || '');
            setState(venueData.state || '');
            setCountry(venueData.country || '');
            setPostalCode(venueData.postalCode || '');
            setVenueContact(venueData.contact || '');
            setVenueEmail(venueData.email || '');
            setFullAddress(venueData.fullAddress || '');
            
            console.log('✅ Loaded venue data from localStorage, venueId:', savedVenueId);
            
            // Force update the original venue data for change detection
            setOriginalVenueData(venueData);
          }
        } catch (error) {
          console.error('❌ Error loading venue data:', error);
          // Clear invalid data
          localStorage.removeItem(`event_${backendEventId}_venueId`);
          localStorage.removeItem(`event_${backendEventId}_venueData`);
        }
      };
      
      loadVenueData();
    }
  }, [backendEventId]);

  // Load event data if editing
  const flattenSponsor = (s, idx = 0) => {
    const nested = s?.sponsor || {};
    return {
      name: s?.name || nested.name || "",
      websiteUrl: s?.websiteUrl || s?.website || s?.link || nested.websiteUrl || nested.website || nested.link || "",
      logoUrl: s?.logoUrl || s?.logo || nested.logoUrl || nested.logo || "",
      isPrimary: typeof s?.isPrimary === "boolean" ? s.isPrimary : idx === 0,
    };
  };

  useEffect(() => {
    if (!editId) return;
    if (editHydratedRef.current === editId) return;
    let isMounted = true;

    const pickVenueName = (venueObj) => {
      if (!venueObj) return "";
      const raw = venueObj.name || venueObj.venueName || "";
      if (raw && raw.toLowerCase() !== "location tbd") return raw;
      const fromFull = venueObj.fullAddress ? venueObj.fullAddress.split(",")[0]?.trim() : "";
      return fromFull || raw;
    };

    const normalizeAdditional = (data) => {
      const tcData = data?.TC || data?.tc;
      const tcContent =
        typeof tcData === "string" ? tcData : tcData?.content ? tcData.content : "";

      const advisoryData = data?.advisory || {};
      const normalizedAdvisory = { ...initialAdvisoryState };
      Object.keys(normalizedAdvisory).forEach((key) => {
        if (advisoryData[key]) normalizedAdvisory[key] = true;
      });
      const customList = Array.isArray(advisoryData.customAdvisories) ? advisoryData.customAdvisories : [];

      const questionsData = Array.isArray(data?.questions) ? data.questions : [];
      const note = data?.organizerNote || "";

      return {
        tc: tcContent || "",
        advisory: normalizedAdvisory,
        customAdvisories: customList,
        questions: questionsData,
        organizerNote: note,
      };
    };

    const setAdditionalFromEvent = (data) => {
      const tcData = data?.TC || data?.tc;
      if (tcData) {
        if (typeof tcData === "string") {
          setTermsAndConditions(tcData);
        } else if (tcData?.content) {
          setTermsAndConditions(tcData.content);
        }
      } else {
        setTermsAndConditions("");
      }

      const advisoryData = data?.advisory || {};
      const normalizedAdvisory = { ...initialAdvisoryState };
      Object.keys(normalizedAdvisory).forEach((key) => {
        if (advisoryData[key]) normalizedAdvisory[key] = true;
      });
      setAdvisory(normalizedAdvisory);
      const customList = Array.isArray(advisoryData.customAdvisories) ? advisoryData.customAdvisories : [];
      setCustomAdvisories(customList);

      const questionsData = Array.isArray(data?.questions) ? data.questions : [];
      setCustomQuestions(questionsData);
      setOrganizerNote(data?.organizerNote || "");

      // Capture original additional info for change detection once
      if (!originalAdditionalRef.current) {
        originalAdditionalRef.current = normalizeAdditional(data || {});
      }

      // Keep current snapshot in sync for later comparisons
      currentAdditionalRef.current = normalizeAdditional(data || {});
    };

    const hydrateGallery = (images) => {
      if (!Array.isArray(images)) {
        setExistingGalleryUrls([]);
        setGalleryImages([]);
        setGalleryImageIds({});
        setGalleryImagePublicIds({});
        return;
      }

      const galleryImagesData = images.filter((img) => img.type === "EVENT_GALLERY");
      const validGalleryImages = galleryImagesData.filter((img) => !deletedImageIds.has(img.id));

      if (validGalleryImages.length > 0) {
        const imageUrls = validGalleryImages.map((img) => img.url);
        const imageIdMap = {};
        const publicIdMap = {};
        validGalleryImages.forEach((img) => {
          imageIdMap[img.url] = img.id;
          if (img.publicId) publicIdMap[img.url] = img.publicId;
        });
        setExistingGalleryUrls(imageUrls);
        setGalleryImages(imageUrls);
        setGalleryImageIds(imageIdMap);
        setGalleryImagePublicIds(publicIdMap);
      } else {
        setExistingGalleryUrls([]);
        setGalleryImages([]);
        setGalleryImageIds({});
        setGalleryImagePublicIds({});
      }
    };

    const hydrateEvent = async (eventToEdit) => {
      if (!isMounted || !eventToEdit) return;

      editHydratedRef.current = editId;
      eventCacheRef.current = eventToEdit;
      setEditHydrationError("");

      const start = parseSafeDate(eventToEdit.startDate);
      const end = parseSafeDate(eventToEdit.endDate);
      const toDateStr = (d) => (isValidDateObject(d) ? d.toISOString().slice(0, 10) : "");
      const toTimeStr = (d) => {
        if (!isValidDateObject(d)) return "";
        const iso = d.toISOString();
        return iso.slice(11, 16);
      };

      setBackendEventId(eventToEdit.id || eventToEdit._id || backendEventId);
      setEventTitle(eventToEdit.title || "");
      setEventDescription(eventToEdit.description || "");
      setMainCategory(eventToEdit.category || "");
      setSelectedCategories([eventToEdit.subCategory || eventToEdit.subcategory || ""]);
      setCoverImage(eventToEdit.flyerImage || eventToEdit.image || eventToEdit.flyer);
      hydrateGallery(eventToEdit.images);
      setAdditionalFromEvent(eventToEdit);
      const startDateStr = toDateStr(start);
      const startTimeStr = toTimeStr(start);
      const endDateStr = toDateStr(end);
      const endTimeStr = toTimeStr(end);
      setStartDate(startDateStr);
      setStartTime(startTimeStr);
      setEndDate(endDateStr);
      setEndTime(endTimeStr);
      const normalizedStatus = (eventToEdit.publishStatus || eventToEdit.status || "").toUpperCase();
      setPublishState(normalizedStatus === "PUBLISHED" || normalizedStatus === "ACTIVE" ? "PUBLISHED" : "DRAFT");
      const normalizedTickets = Array.isArray(eventToEdit.tickets)
        ? eventToEdit.tickets.map(normalizeTicketForEdit).filter(Boolean)
        : [];
      setSavedTickets(normalizedTickets);
      setCreatedTicketIds(normalizedTickets.map((ticket) => ticket.id).filter(Boolean));
      if (eventToEdit.id || eventToEdit._id) {
        localStorage.setItem(
          `event_${eventToEdit.id || eventToEdit._id}_tickets`,
          JSON.stringify(normalizedTickets)
        );
      }
      setOriginalDateTime({
        start: isValidDateObject(start) ? start.toISOString() : null,
        end: isValidDateObject(end) ? end.toISOString() : null,
      });
      setOriginalDateInputs({
        startDate: startDateStr,
        startTime: startTimeStr,
        endDate: endDateStr,
        endTime: endTimeStr,
      });

      if (Array.isArray(eventToEdit.sponsors) && eventToEdit.sponsors.length > 0) {
        const normalizedSponsors = eventToEdit.sponsors.map((s, idx) => flattenSponsor(s, idx));
        const normalizedForCompare = normalizeSponsors(normalizedSponsors);
        setSponsors(normalizedSponsors);
        setOriginalSponsors(normalizedForCompare);
        setIsSponsored(normalizedForCompare.length > 0);
        setOriginalIsSponsored(normalizedForCompare.length > 0);
        sponsorsLoadedRef.current = true;
      } else {
        setSponsors([emptySponsor]);
        setOriginalSponsors([]);
        setIsSponsored(Boolean(eventToEdit.isSponsored));
        setOriginalIsSponsored(Boolean(eventToEdit.isSponsored));
      }

      setTicketPrice(
        eventToEdit.price
          ? String(eventToEdit.price).replace(/[^0-9.]/g, "")
          : ticketPrice
      );

      setSelectedTemplate(
        normalizeEventDetailTemplateId(eventToEdit.detailTemplate || eventToEdit.template)
      );

      const firstVenue = Array.isArray(eventToEdit.venues) && eventToEdit.venues.length > 0
        ? eventToEdit.venues[0]
        : null;
      if (firstVenue) {
        setVenueId(firstVenue.id || firstVenue._id || venueId);
        setVenueName(pickVenueName(firstVenue));
        setCity(firstVenue.city || "");
        setState(firstVenue.state || "");
        setCountry(firstVenue.country || eventToEdit.country || "India");
        setPostalCode(firstVenue.postalCode || eventToEdit.postalCode || "");
        setVenueContact(firstVenue.contact || eventToEdit.venueContact || "");
        setVenueEmail(firstVenue.email || eventToEdit.venueEmail || "");
        setFullAddress(firstVenue.fullAddress || firstVenue.address || "");
        setOriginalVenueData({
          name: pickVenueName(firstVenue),
          contact: firstVenue.contact || eventToEdit.venueContact || "",
          email: firstVenue.email || eventToEdit.venueEmail || "",
          fullAddress: firstVenue.fullAddress || firstVenue.address || "",
          city: firstVenue.city || "",
          state: firstVenue.state || "",
          country: firstVenue.country || eventToEdit.country || "India",
          postalCode: firstVenue.postalCode || eventToEdit.postalCode || "",
          latitude: firstVenue.latitude || 0,
          longitude: firstVenue.longitude || 0,
        });
        setVenueCreated(true);
      } else if (eventToEdit.location) {
        const locationParts = eventToEdit.location.split(", ");
        if (locationParts.length > 0) setVenueName(locationParts[0]);
        if (locationParts.length > 1) setCity(locationParts[1]);
        if (locationParts.length > 2) setState(locationParts[2]);
      }

      const tcData = eventToEdit.TC || eventToEdit.tc;
      if (tcData) {
        if (typeof tcData === "string") {
          setTermsAndConditions(tcData);
        } else if (tcData?.content) {
          setTermsAndConditions(tcData.content);
        }
      }

      const advisoryData = eventToEdit.advisory || {};
      const normalizedAdvisory = { ...initialAdvisoryState };
      Object.keys(normalizedAdvisory).forEach((key) => {
        if (advisoryData[key]) normalizedAdvisory[key] = true;
      });
      setAdvisory(normalizedAdvisory);
      const customList = Array.isArray(advisoryData.customAdvisories) ? advisoryData.customAdvisories : [];
      setCustomAdvisories(customList);

      const questionsData = Array.isArray(eventToEdit.questions) ? eventToEdit.questions : [];
      setCustomQuestions(questionsData);
      setOrganizerNote(eventToEdit.organizerNote || "");

      if (eventToEdit.type) {
        setSelectedEventTypeCategory(eventToEdit.type);
        setCurrentEventType(eventToEdit.type);
      }

      const normalizedArtists = Array.isArray(eventToEdit.artists)
        ? eventToEdit.artists.map((a) => ({
            name: a.name || "",
            photo: a.photo || a.image || "",
            instagram: a.instagram || a.instagramLink || "",
            spotify: a.spotify || a.spotifyLink || "",
            gender: a.gender || "PREFER_NOT_TO_SAY",
          }))
        : [];

      setArtists(
        normalizedArtists.length
          ? normalizedArtists
          : [{ name: "", photo: "", instagram: "", spotify: "", gender: "PREFER_NOT_TO_SAY" }]
      );
      if (normalizedArtists.length) {
        setCreatedArtistIndices(normalizedArtists.map((_, idx) => idx));
        artistsLoadedRef.current = true;
        setOriginalArtists(normalizedArtists);
      } else {
        setOriginalArtists([]);
      }
    };

    const hydrateFromRoute = async () => {
      try {
        if (isMounted) {
          setIsEditHydrating(true);
          setEditHydrationError("");
        }

        const stateEvent = location.state?.event;
        const cachedEvent =
          stateEvent ||
          events.find((e) => e.id === editId || e.publicId === editId || e.eventId === editId);

        if (cachedEvent) {
          await hydrateEvent(cachedEvent);
        }

        const fetchUrl = buildEventFetchUrl({ eventId: editId, bustCache: true });
        const response = await apiFetch(fetchUrl, { method: "GET" });
        const fetchedEvent = response.data?.event || response.data || response.event || response;

        if (!fetchedEvent) {
          throw new Error("Event not found.");
        }

        await hydrateEvent(fetchedEvent);
      } catch (err) {
        console.error("Failed to hydrate edit event:", err);
        if (isMounted) {
          setEditHydrationError(err?.message || "Failed to load event for editing.");
        }
      } finally {
        if (isMounted) {
          setIsEditHydrating(false);
        }
      }
    };

    hydrateFromRoute();

    return () => {
      isMounted = false;
    };
  }, [editId, events, location.state]);

  // Fetch sponsors from backend in edit mode when entering Step 5 (or when ID changes)
  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        if (!isEditMode || !backendEventId || currentStep !== 5) return;
        if (sponsorsLoadedRef.current) return;
        const hasSponsorsLoaded = sponsors.some((s) => s.name || s.logoUrl || s.websiteUrl);
        if (hasSponsorsLoaded) {
          sponsorsLoadedRef.current = true;
          return;
        }

        // Try cache first
        const cached = eventCacheRef.current;
        const sponsorDataCached = Array.isArray(cached?.sponsors) ? cached.sponsors : [];
        if (sponsorDataCached.length) {
          const normalizedCached = sponsorDataCached.map((s, idx) => flattenSponsor(s, idx));
          setSponsors(normalizedCached);
          setOriginalSponsors(normalizedCached);
          setIsSponsored(true);
          setOriginalIsSponsored(true);
          sponsorsLoadedRef.current = true;
          return;
        }

        // Check if fetch is already in progress
        if (eventFetchInProgressRef.current) return;
        eventFetchInProgressRef.current = true;

        const organizerSlug = eventCacheRef.current?.organizer?.slug;
        const eventSlug = eventCacheRef.current?.slug;
        const fetchUrl = buildEventFetchUrl({
          eventId: backendEventId,
          organizerSlug,
          eventSlug,
        });
        const response = await apiFetch(fetchUrl, { method: "GET" });
        const eventData = response.data?.event || response.data || response.event || response;
        eventCacheRef.current = eventData;
        const sponsorData = Array.isArray(eventData?.sponsors) ? eventData.sponsors : [];
        const normalizedSponsors = sponsorData.map((s, idx) => flattenSponsor(s, idx));

        setSponsors(normalizedSponsors.length ? normalizedSponsors : [emptySponsor]);
        setOriginalSponsors(normalizedSponsors);
        setIsSponsored(normalizedSponsors.length > 0 || Boolean(eventData?.isSponsored));
        setOriginalIsSponsored(normalizedSponsors.length > 0 || Boolean(eventData?.isSponsored));
        sponsorsLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to fetch sponsors for edit mode:", err);
      } finally {
        eventFetchInProgressRef.current = false;
      }
    };

    fetchSponsors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendEventId, isEditMode, currentStep]);

  // Fetch artists from backend in edit mode when entering Step 6
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        if (!isEditMode || !backendEventId || currentStep !== 6) return;
        if (artistsLoadedRef.current) return;
        const hasArtistsLoaded = artists.some((a) => a.name || a.photo || a.instagram || a.spotify);
        if (hasArtistsLoaded) return;

        // Try cache first
        const cached = eventCacheRef.current;
        const artistDataCached = Array.isArray(cached?.artists) ? cached.artists : [];
        if (artistDataCached.length) {
          const normalizedCached = artistDataCached.map((a) => ({
            name: a.name || "",
            photo: a.photo || a.image || "",
            instagram: a.instagram || a.instagramLink || "",
            spotify: a.spotify || a.spotifyLink || "",
            gender: a.gender || "PREFER_NOT_TO_SAY",
          }));
          setArtists(normalizedCached);
          setCreatedArtistIndices(normalizedCached.map((_, idx) => idx));
          setOriginalArtists(normalizedCached);
          artistsLoadedRef.current = true;
          return;
        }

        // Check if fetch is already in progress
        if (eventFetchInProgressRef.current) return;
        eventFetchInProgressRef.current = true;

        const organizerSlug = eventCacheRef.current?.organizer?.slug;
        const eventSlug = eventCacheRef.current?.slug;
        const fetchUrl = buildEventFetchUrl({
          eventId: backendEventId,
          organizerSlug,
          eventSlug,
        });
        const response = await apiFetch(fetchUrl, { method: "GET" });
        const eventData = response.data?.event || response.data || response.event || response;
        eventCacheRef.current = eventData;
        const artistData = Array.isArray(eventData?.artists) ? eventData.artists : [];
        const normalized = artistData.map((a) => ({
          name: a.name || "",
          photo: a.photo || a.image || "",
          instagram: a.instagram || a.instagramLink || "",
          spotify: a.spotify || a.spotifyLink || "",
          gender: a.gender || "PREFER_NOT_TO_SAY",
        }));

        setArtists(
          normalized.length
            ? normalized
            : [{ name: "", photo: "", instagram: "", spotify: "", gender: "PREFER_NOT_TO_SAY" }]
        );
        if (normalized.length) {
          setCreatedArtistIndices(normalized.map((_, idx) => idx));
          setOriginalArtists(normalized);
        }
        artistsLoadedRef.current = true;
      } catch (err) {
        console.error("Failed to fetch artists for edit mode:", err);
      } finally {
        eventFetchInProgressRef.current = false;
      }
    };

    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendEventId, isEditMode, currentStep]);

  // Set event type category from URL params
  useEffect(() => {
    if (eventTypeParam) {
      const eventTypeEnum = eventTypeMapping[eventTypeParam];
      if (eventTypeEnum) {
        setSelectedEventTypeCategory(eventTypeEnum); // Display backend enum value
        setCurrentEventType(eventTypeEnum); // Store backend enum value
      }
    }
  }, [eventTypeParam]);

  // Load existing images when entering Step 2
  useEffect(() => {
    const loadExistingImages = async () => {
      // Always fetch fresh data from backend when entering Step 2
      if (currentStep === 2 && backendEventId) {
        try {
          console.log("📥 ========================================");
          console.log("📥 Fetching FRESH images from backend");
          console.log("📥 Event ID:", backendEventId);
          console.log("📥 Current Step:", currentStep);

          // If gallery already exists in UI state, avoid a redundant fetch.
          if (Array.isArray(galleryImages) && galleryImages.length > 0) {
            return;
          }
          
          const cachedEvent = eventCacheRef.current;
          const cachedEventId = cachedEvent?.id || cachedEvent?._id;
          const isSameEvent = String(cachedEventId || '') === String(backendEventId);

          // Avoid redundant network calls when edit payload is already cached in memory.
          if (isSameEvent && Array.isArray(cachedEvent?.images)) {
            if (cachedEvent?.flyerImage) {
              setCoverImage(cachedEvent.flyerImage);
            }

            const galleryImagesData = cachedEvent.images.filter(img => img.type === 'EVENT_GALLERY');
            const validGalleryImages = galleryImagesData.filter(img => !deletedImageIds.has(img.id));
            const imageUrls = validGalleryImages.map(img => img.url);
            const imageIdMap = {};
            validGalleryImages.forEach(img => { imageIdMap[img.url] = img.id; });

            setExistingGalleryUrls(imageUrls);
            setGalleryImages(imageUrls);
            setGalleryImageIds(imageIdMap);
            return;
          }

          // Fetch event details to get images (with timestamp to prevent caching)
          // Check if fetch is already in progress
          if (eventFetchInProgressRef.current) return;
          eventFetchInProgressRef.current = true;

          const organizerSlug = eventCacheRef.current?.organizer?.slug;
          const eventSlug = eventCacheRef.current?.slug;
          const fetchUrl = buildEventFetchUrl({
            eventId: backendEventId,
            organizerSlug,
            eventSlug,
            bustCache: true,
          });
          const response = await apiFetch(fetchUrl, {
            method: "GET",
          });
          
          const eventData = response.data || response;
          eventCacheRef.current = eventData;
          console.log("📋 Full event data received:", eventData);
          
          // Load cover image (or clear if none exists)
          if (eventData.flyerImage) {
            setCoverImage(eventData.flyerImage);
            console.log("✅ Loaded cover image:", eventData.flyerImage);
          } else {
            setCoverImage(null);
            console.log("ℹ️ No cover image in backend - cleared");
          }
          
          // Load gallery images from 'images' array
          if (eventData.images && Array.isArray(eventData.images)) {
            console.log("📋 Total images in response:", eventData.images.length);
            
            const galleryImagesData = eventData.images.filter(img => img.type === 'EVENT_GALLERY');
            console.log("📋 Gallery images after type filter:", galleryImagesData.length);
            
            // Filter out images that were deleted in this session
            const validGalleryImages = galleryImagesData.filter(img => {
              const isDeleted = deletedImageIds.has(img.id);
              if (isDeleted) {
                console.log("🚫 Filtering out deleted image:", img.id, img.url);
              }
              return !isDeleted;
            });
            
            console.log("📋 Valid gallery images after deletion filter:", validGalleryImages.length);
            
            if (validGalleryImages.length > 0) {
              const imageUrls = validGalleryImages.map(img => img.url);
              const imageIdMap = {};
              validGalleryImages.forEach(img => {
                imageIdMap[img.url] = img.id; // Store ID for deletion
              });
              
              // Update UI with ONLY valid images from backend
              setExistingGalleryUrls(imageUrls);
              setGalleryImages(imageUrls);
              setGalleryImageIds(imageIdMap);
              
              console.log(`✅ Loaded ${imageUrls.length} valid gallery images`);
              console.log("📋 Image URLs:", imageUrls);
              console.log("📋 Image IDs:", imageIdMap);
            } else {
              // No valid gallery images in backend
              setExistingGalleryUrls([]);
              setGalleryImages([]);
              setGalleryImageIds({});
              console.log("ℹ️ No valid gallery images - cleared all");
            }
          } else {
            // No images array in response
            setExistingGalleryUrls([]);
            setGalleryImages([]);
            setGalleryImageIds({});
            console.log("ℹ️ No images array in backend response - cleared all");
          }
          
          console.log("📥 ========================================");
          
        } catch (error) {
          console.error("❌ Failed to load existing images:", error);
        } finally {
          eventFetchInProgressRef.current = false;
        }
      }
    };
    
    loadExistingImages();
    // Note: deletedImageIds is not in deps to avoid re-fetching on every deletion
    // The filter logic inside will use the current deletedImageIds state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, backendEventId]);

  // Initialize event ID on component mount (only for new events)
  useEffect(() => {
    if (!isEditMode) {
      // Check if we're starting a fresh event creation
      const urlParams = new URLSearchParams(window.location.search);
      const isNewEvent = !urlParams.get('draft'); // No draft parameter means fresh start
      
      if (isNewEvent) {
        // Clear any old draft from previous session
        sessionStorage.removeItem('draftEventId');
        sessionStorage.removeItem('draftStarted');
        sessionStorage.removeItem('deletedImageIds'); // Clear deleted images list for new event
        
        // Reset all tracking states
        setCreatedTicketIds([]);
        setVenueCreated(false);
        setCreatedArtistIndices([]);
        setDeletedImageIds(new Set()); // Clear deleted images
        
        console.log("🗑️ Cleared old draft data - starting fresh");
      } else {
        // Restore deleted image IDs from sessionStorage for existing draft
        const storedDeletedIds = sessionStorage.getItem('deletedImageIds');
        if (storedDeletedIds) {
          try {
            const deletedIds = JSON.parse(storedDeletedIds);
            setDeletedImageIds(new Set(deletedIds));
            console.log("📥 Restored deleted image IDs:", deletedIds);
          } catch (error) {
            console.error("Failed to parse deleted image IDs:", error);
          }
        }
      }
      
      if (!eventId) {
        const newEventId = generateEventId();
        setEventId(newEventId);
      }
      
      // Only restore backendEventId if we have an active draft session
      const storedBackendId = sessionStorage.getItem('draftEventId');
      const draftStarted = sessionStorage.getItem('draftStarted');
      
      if (storedBackendId && draftStarted && !backendEventId && !isNewEvent) {
        setBackendEventId(storedBackendId);
        console.log("📥 Restored backend event ID from active draft:", storedBackendId);
      }
    }
  }, [isEditMode]);

  // Store backendEventId in sessionStorage whenever it changes
  useEffect(() => {
    if (backendEventId && !isEditMode) {
      sessionStorage.setItem('draftEventId', backendEventId);
      sessionStorage.setItem('draftStarted', 'true');
      console.log("💾 Saved backend event ID to session:", backendEventId);
    }
  }, [backendEventId, isEditMode]);

  // Build a readable full address string from a suggestion
  // Manual-only venue entry (no external suggestions or maps)

  const steps = [
    { number: 1, title: "Event Details" },
    { number: 2, title: "Date & Time" },
    { number: 3, title: "Tickets" },
    { number: 4, title: "Venue & Location" },
    { number: 5, title: "Sponsor" },
    { number: 6, title: "Add Artist" },
    { number: 7, title: "Additional Info" },
    { number: 8, title: "Template" },
    { number: 9, title: "Review & Publish" },
  ];

  const progress = (currentStep / steps.length) * 100;
  const detailTemplateOptions = getAvailableEventDetailTemplates();
  const selectedTemplateOption = getEventDetailTemplateOption(selectedTemplate);
  const basicDetailsFilled = Boolean(eventTitle.trim() && mainCategory && selectedCategories.length > 0);
  const isSectionBusy = isSubmitting || uploadingCover || uploadingGallery || showLoading;
  const canJumpBetweenSections = isEditMode && !isSectionBusy;

  const nextStep = async ({ advance = true } = {}) => {
    const moveToNextStep = () => {
      if (advance) {
        setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      }
    };

    // Validate required fields for each step
    if (currentStep === 1) {
      if (!eventTitle.trim()) {
        toast.error("Event title is required");
        return;
      }
      if (!mainCategory) {
        toast.error("Main category is required");
        return;
      }
      if (selectedCategories.length === 0) {
        toast.error("Subcategory is required");
        return;
      }

      if (!coverImage && !coverImageFile) {
        toast.error("Cover image is required");
        return;
      }

      // Call API for Step 1 - Create or Update Event with basic details
      try {
        setIsSubmitting(true);
        setLoadingMessage("Saving event details...");
        setShowLoading(true);
        
        let response;
        
        // Treat edit mode as existing draft even if session flags are missing
        const hasExistingDraft =
          backendEventId &&
          (sessionStorage.getItem('draftStarted') || isEditMode);
        
        if (hasExistingDraft) {
          // UPDATE existing event (user went back to step 1)
          console.log("🔄 Updating existing draft event:", backendEventId);
          const hasAnyChanges = textFieldsChanged || imagesChanged;
          console.log("📝 Text fields changed?", textFieldsChanged, "🖼️ Images changed?", imagesChanged);
          
          try {
            if (!hasAnyChanges) {
              console.log("ℹ️ No field or image changes detected in Step 1");
              toast.info("No changes to update");
              moveToNextStep();
              return;
            }

            // Upload media first (backend /update-event is JSON-only)
            if (imagesChanged) {
              if (coverImageFile || draftCoverPublicId) {
                try {
                  // If we have a draft publicId, persist it; otherwise upload file
                  if (draftCoverPublicId) {
                    await persistFlyerUrl(backendEventId, { url: coverImage, publicId: draftCoverPublicId });
                  } else {
                    const coverResp = await uploadFlyerImage(backendEventId, coverImageFile);
                    const coverData = coverResp.data || coverResp;
                    const imageUrl = coverData.flyerImage || coverData.url;
                    if (imageUrl) setCoverImage(imageUrl);
                  }
                } catch (err) {
                  console.error("❌ Failed to persist flyer image during edit:", err);
                  toast.error(err?.message || "Failed to save cover image");
                  return;
                }
              }

              if (draftGalleryUploads.length > 0 || galleryImageFiles.length > 0) {
                try {
                  let respData;
                  if (draftGalleryUploads.length > 0) {
                    const persistPayload = draftGalleryUploads.map((img) => ({
                      url: img.url,
                      publicId: img.publicId,
                      type: "EVENT_GALLERY",
                    }));
                    const persistRes = await persistGalleryUrls(backendEventId, persistPayload);
                    respData = persistRes?.data || persistRes;
                  } else {
                    const galleryResp = await uploadGalleryImages(backendEventId, galleryImageFiles);
                    respData = galleryResp.data || galleryResp;
                  }

                  const galleryImagesData = Array.isArray(respData.images)
                    ? respData.images
                    : Array.isArray(respData.galleryImages)
                      ? respData.galleryImages
                      : [];

                  const newImageUrls = galleryImagesData
                    .filter((img) => (img.type ? img.type === "EVENT_GALLERY" : true))
                    .map((img) => img.url || img);

                  const newImageIdMap = {};
                  galleryImagesData.forEach((img) => {
                    const url = img.url || img;
                    const id = img.id || img._id;
                    if (url && id) newImageIdMap[url] = id;
                  });

                  const updatedGallery = [...existingGalleryUrls, ...newImageUrls];
                  setExistingGalleryUrls(updatedGallery);
                  setGalleryImages(updatedGallery);
                  setGalleryImageIds((prev) => ({ ...prev, ...newImageIdMap }));
                  setDraftGalleryUploads([]);
                  setImagesChanged(false);
                } catch (err) {
                  console.error("❌ Failed to upload gallery images during edit:", err);
                  toast.error(err?.message || "Failed to upload gallery images");
                  return;
                }
              }

              // Clear pending files after uploads
              setImagesChanged(false);
              setGalleryImageFiles([]);
              setCoverImageFile(null);
            }

            // If only images changed, advance without JSON update
            if (!textFieldsChanged) {
              console.log("ℹ️ Only image changes detected; skipping update-event payload");
              moveToNextStep();
              return;
            }

            const eventData = {
              eventTitle,
              description: eventDescription,
              mainCategory,
              subcategory: selectedCategories[0] || "",
              ...(currentEventType ? { eventType: currentEventType } : {}),
            };

            console.log("📤 Sending JSON update payload via updateEventStep1", eventData);

            response = await updateEventStep1(backendEventId, eventData);
            
            toast.success("Event details updated successfully!");
            
            // Reset change flags after successful update
            setTextFieldsChanged(false);
            setImagesChanged(false);
            setGalleryImageFiles([]);
            setCoverImageFile(null);
          } catch (updateError) {
            console.error("⚠️ Update failed:", updateError);
            toast.error(updateError?.message || "Failed to update event. Please try again.");
            return;
          }
        } else {
          // CREATE new event (first time) — send only allowed fields, then persist images to backend
          console.log("✨ Creating new event (first time) with temp uploads");
          
          const eventData = {
            eventTitle,
            description: eventDescription,
            mainCategory,
            subcategory: selectedCategories[0] || "",
            eventType: currentEventType || "",
          };

          response = await createEventStep1(eventData);
          
          toast.success("Event details saved successfully!");
          
          // Store the backend event ID for future updates
          let backendId = response.data?.id || response.data?._id || response.id || response._id;
          if (backendId) {
            setBackendEventId(backendId);
            console.log("💾 Backend Event ID stored:", backendId);
          }
          
          if (backendId && (coverImageFile || draftCoverPublicId)) {
            // Persist draft cover image if available; otherwise upload file
            try {
              setShowLoading(true);
              setLoadingMessage("Saving cover image...");
              if (draftCoverPublicId) {
                await persistFlyerUrl(backendId, { url: coverImage, publicId: draftCoverPublicId });
                toast.success("Cover image saved to event.");
              } else {
                const coverResp = await uploadFlyerImage(backendId, coverImageFile);
                const coverData = coverResp.data || coverResp;
                const imageUrl = coverData.flyerImage || coverData.url;
                if (imageUrl) {
                  setCoverImage(imageUrl);
                  toast.success("Cover image saved to event.");
                }
              }
            } catch (err) {
              console.error("Failed to persist cover image after create:", err);
              toast.error(err?.message || "Cover image upload failed after create.");
            } finally {
              setShowLoading(false);
              setLoadingMessage("");
            }
          }

          if (backendId && (draftGalleryUploads.length > 0 || galleryImageFiles.length > 0)) {
            try {
              setShowLoading(true);
              setLoadingMessage("Saving gallery images...");

              let respData;
              if (draftGalleryUploads.length > 0) {
                const persistPayload = draftGalleryUploads.map((img) => ({
                  url: img.url,
                  publicId: img.publicId,
                  type: "EVENT_GALLERY",
                }));
                const persistRes = await persistGalleryUrls(backendId, persistPayload);
                respData = persistRes?.data || persistRes;
              } else {
                const galleryResp = await uploadGalleryImages(backendId, galleryImageFiles);
                respData = galleryResp.data || galleryResp;
              }

              if (respData.images && Array.isArray(respData.images)) {
                setGalleryImages(respData.images.map((img) => img.url || img));
                setExistingGalleryUrls(respData.images.map((img) => img.url || img));
                const idMap = {};
                respData.images.forEach((img) => {
                  const url = img.url || img;
                  const id = img.id || img._id;
                  if (url && id) idMap[url] = id;
                });
                setGalleryImageIds((prev) => ({ ...prev, ...idMap }));
              }

              setDraftGalleryUploads([]);
              setImagesChanged(false);
              toast.success("Gallery images saved to event.");
            } catch (err) {
              console.error("Failed to persist gallery images after create:", err);
              toast.error(err?.message || "Gallery image upload failed after create.");
            } finally {
              setShowLoading(false);
              setLoadingMessage("");
            }
          }
          
          // After event exists, persist gallery images using already-uploaded temp URLs (no re-upload)
          if (backendId && galleryImageFiles.length > 0) {
            // Fallback: upload if no temp uploads are available
            try {
              setShowLoading(true);
              setLoadingMessage("Saving gallery images...");
              const galleryResp = await uploadGalleryImages(backendId, galleryImageFiles);
              const respData = galleryResp.data || galleryResp;
              
              if (respData.images && Array.isArray(respData.images)) {
                const galleryImagesData = respData.images.filter(img => img.type === 'EVENT_GALLERY');
                const newImageUrls = galleryImagesData.map(img => img.url);
                const newImageIdMap = {};
                galleryImagesData.forEach(img => { newImageIdMap[img.url] = img.id; });
                
                const updatedGalleryImages = [...galleryImages, ...newImageUrls];
                const updatedImageIdMap = { ...galleryImageIds, ...newImageIdMap };
                
                setExistingGalleryUrls(updatedGalleryImages);
                setGalleryImages(updatedGalleryImages);
                setGalleryImageIds(updatedImageIdMap);
                setGalleryImageFiles([]); // clear pending files
                
                toast.success(`${newImageUrls.length} gallery image(s) saved to event.`);
              } else if (respData.galleryImages && Array.isArray(respData.galleryImages)) {
                const newImageUrls = respData.galleryImages.map(img => img.url || img);
                const newImageIdMap = {};
                respData.galleryImages.forEach(img => { if (img.id && img.url) newImageIdMap[img.url] = img.id; });
                
                const updatedGalleryImages = [...galleryImages, ...newImageUrls];
                const updatedImageIdMap = { ...galleryImageIds, ...newImageIdMap };
                
                setExistingGalleryUrls(updatedGalleryImages);
                setGalleryImages(updatedGalleryImages);
                setGalleryImageIds(updatedImageIdMap);
                setGalleryImageFiles([]);
                
                toast.success(`${newImageUrls.length} gallery image(s) saved to event.`);
              }
            } catch (err) {
              console.error("Failed to persist gallery images after create:", err);
              toast.error(err?.message || "Gallery upload failed after create.");
            } finally {
              setShowLoading(false);
              setLoadingMessage("");
            }
          }
          
          setImagesChanged(false); // Reset flag after creation
        }
        
        console.log("API Response:", response);
        
        // Move to next step after successful API call
        moveToNextStep();
      } catch (error) {
        console.error("Error saving event:", error);
        const errorMessage = error.message || "Failed to save event details. Please try again.";
        toast.error(errorMessage);
        
        // If authentication error, redirect to login
        if (errorMessage.includes("Authentication") || errorMessage.includes("Unauthorized")) {
          setTimeout(() => {
            navigate("/auth");
          }, 2000);
        }
        return;
      } finally {
        setIsSubmitting(false);
        setShowLoading(false);
      }
      return; // Exit early to prevent default next step behavior
    }

    if (currentStep === 2) {
      if (!startDate) {
        toast.error("Starting date is required");
        return;
      }
      if (!startTime) {
        toast.error("Starting time is required");
        return;
      }
      if (!endDate) {
        toast.error("Ending date is required");
        return;
      }
      if (!endTime) {
        toast.error("Ending time is required");
        return;
      }
      if (endDate < startDate) {
        toast.error("Ending date must be after starting date");
        return;
      }

      const hasInputChanges =
        startDate !== originalDateInputs.startDate ||
        startTime !== originalDateInputs.startTime ||
        endDate !== originalDateInputs.endDate ||
        endTime !== originalDateInputs.endTime;

      if (isEditMode && backendEventId && !hasInputChanges) {
        toast.info("No changes to update");
        moveToNextStep();
        return;
      }

      // Combine date and time into ISO format for comparison and update
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${endDate}T${endTime}`).toISOString();

      // Call API for Step 3 - Update Date & Time
      try {
        setIsSubmitting(true);
        setLoadingMessage("Saving date & time...");
        setShowLoading(true);
        
        // Check if we have backend event ID
        if (!backendEventId) {
          toast.error("Event ID not found. Please go back to Step 1.");
          setIsSubmitting(false);
          setShowLoading(false);
          return;
        }
        
        const updateData = {
          startDate: startDateTime,
          endDate: endDateTime,
        };

        const response = await updateEventStep2(backendEventId, updateData);
        
        toast.success("Date & time updated successfully!");
        console.log("Step 3 API Response:", response);
        setOriginalDateTime({ start: startDateTime, end: endDateTime });
        setOriginalDateInputs({ startDate, startTime, endDate, endTime });
        
        // Move to next step after successful API call
        moveToNextStep();
      } catch (error) {
        console.error("Error updating event:", error);
        const errorMessage = error.message || "Failed to update date & time. Please try again.";
        toast.error(errorMessage);
        
        // If authentication error, redirect to login
        if (errorMessage.includes("Authentication") || errorMessage.includes("Unauthorized")) {
          setTimeout(() => {
            navigate("/auth");
          }, 2000);
        }
        return;
      } finally {
        setIsSubmitting(false);
        setShowLoading(false);
      }
      return; // Exit early to prevent default next step behavior
    }

    if (currentStep === 3) {
      // Just validate that at least one ticket exists
      if (savedTickets.length === 0) {
        toast.error("Please add at least one ticket type");
        return;
      }
      
      // Check if we have backend event ID
      if (!backendEventId) {
        toast.error("Event ID not found. Please go back to Step 1.");
        return;
      }

      if (!advance) {
        toast.success("Tickets are already saved.");
        return;
      }

      // Move to next step - tickets are already created when added
      moveToNextStep();
      return; // Exit early to prevent default next step behavior
    }

    if (currentStep === 4) {
      if (!venueName.trim()) {
        toast.error("Venue name is required");
        return;
      }
      if (!city.trim()) {
        toast.error("City is required");
        return;
      }
      if (!state.trim()) {
        toast.error("State is required");
        return;
      }
      if (!venueContact.trim()) {
        toast.error("Contact number is required");
        return;
      }
      if (!venueEmail.trim()) {
        toast.error("Email is required");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(venueEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Prepare venue data
      const fallbackAddressParts = [venueName, city, state, postalCode, country || "India"].filter(Boolean);
      const venueData = {
        name: venueName,
        contact: venueContact,
        email: venueEmail,
        fullAddress: fullAddress || fallbackAddressParts.join(", "),
        city: city,
        state: state,
        country: country || "India",
        postalCode: postalCode,
        latitude: 0,
        longitude: 0,
        googlePlaceId: "", // Optional - not used in manual mode
        eventId: backendEventId, // Use backend event ID
        isPrimary: true,
      };

      // Check if venue data has changed
      const hasVenueChanged = !originalVenueData || 
        venueData.name !== originalVenueData.name ||
        venueData.contact !== originalVenueData.contact ||
        venueData.email !== originalVenueData.email ||
        venueData.fullAddress !== originalVenueData.fullAddress ||
        venueData.city !== originalVenueData.city ||
        venueData.state !== originalVenueData.state ||
        venueData.country !== originalVenueData.country ||
        venueData.postalCode !== originalVenueData.postalCode ||
        venueData.latitude !== originalVenueData.latitude ||
        venueData.longitude !== originalVenueData.longitude;

      if (!hasVenueChanged) {
        console.log("ℹ️ No changes detected in venue details");
        toast.info("No changes to update");
        moveToNextStep();
        return;
      }

      // Call API for Step 5 - Create or Update Venue
      try {
        setIsSubmitting(true);
        setLoadingMessage(venueCreated ? "Updating venue details..." : "Saving venue details...");
        setShowLoading(true);
        
        // Check if we have backend event ID
        if (!backendEventId) {
          toast.error("Event ID not found. Please go back to Step 1.");
          setIsSubmitting(false);
          setShowLoading(false);
          return;
        }
        
        let response;
        
        // If we have a venueId, always try to update first
        if (venueId) {
          console.log("🔄 Attempting to update existing venue with ID:", venueId);
          try {
            // First try to update the existing venue
            response = await updateVenue(venueId, venueData);
            console.log('✅ Successfully updated venue:', response);
            
            // Update local state and storage
            setVenueCreated(true);
            
            // Make sure we have the latest venue ID (in case it changed)
            const updatedVenueId = response?.id || response?._id || 
                                 response?.data?.id || response?.data?._id ||
                                 response?.data?.venue?.id || response?.data?.venue?._id || venueId;
            
            // Update the venue data with the ID for future updates
            const updatedVenueData = { ...venueData, id: updatedVenueId };
            
            // Save to state and localStorage
            setVenueId(updatedVenueId);
            localStorage.setItem(`event_${backendEventId}_venueId`, updatedVenueId);
            localStorage.setItem(`event_${backendEventId}_venueData`, JSON.stringify(updatedVenueData));
            
            console.log('💾 Saved updated venue data:', { id: updatedVenueId });
            toast.success("Venue updated successfully!");

            // Update originalVenueData to prevent unnecessary API calls on next visit
            setOriginalVenueData(venueData);
            
            // Update the response with the ID for the rest of the function
            response.id = updatedVenueId;
          } catch (error) {
            console.error("❌ Error updating venue:", error);
            
            // If the update fails, we'll handle it based on the error type
            if (error.message.includes('404')) {
              console.log("Venue not found, will create a new one...");
              
              // If we have a venueId but the update failed with 404, clear the ID and try creating a new one
              setVenueId(null);
              setVenueCreated(false);
              localStorage.removeItem(`event_${backendEventId}_venueId`);
              
              // Fall through to create a new venue
            } else if (error.message.includes('401') || error.message.includes('403')) {
              // Authentication/authorization error - don't try to create a new one
              throw new Error('You do not have permission to update this venue. Please check your login status.');
            } else {
              // For other errors, show the error and stop
              throw error;
            }
          }
        }
        
        // If we don't have a venueId or the update failed with 404, create a new venue
        if (!venueId) {
          console.log("🏢 Creating new venue for event:", backendEventId);
          try {
            response = await createVenue(venueData);
            
            // Extract the venue ID from the response
            // The ID could be in response.id, response._id, response.data.id, or response.data._id
            const newVenueId = response?.id || response?._id || 
                             response?.data?.id || response?.data?._id ||
                             response?.data?.venue?.id || response?.data?.venue?._id;
            
            console.log('🔍 Extracted venue ID from response:', { newVenueId, response });
            
            if (!newVenueId) {
              console.error('❌ No venue ID found in response:', response);
              throw new Error('No venue ID returned from server in the expected format');
            }
            
            // Save the new venue ID and data
            setVenueId(newVenueId);
            setVenueCreated(true);
            localStorage.setItem(`event_${backendEventId}_venueId`, newVenueId);
            
            // Update the venue data with the ID for future updates
            const updatedVenueData = { ...venueData, id: newVenueId };
            localStorage.setItem(`event_${backendEventId}_venueData`, JSON.stringify(updatedVenueData));
            
            console.log('✅ Created new venue with ID:', newVenueId);
            toast.success("Venue created successfully!");

            // Update originalVenueData to prevent unnecessary API calls on next visit
            setOriginalVenueData(venueData);
            
            // Update the response with the ID for the rest of the function
            response.id = newVenueId;
          } catch (createError) {
            console.error("❌ Error creating venue:", createError);
            throw new Error(createError.message || 'Failed to create venue');
          }
        }
        
        // Move to next step after successful API call
        moveToNextStep();
      } catch (error) {
        console.error("Error creating venue:", error);
        const errorMessage = error.message || "Failed to save venue details. Please try again.";
        toast.error(errorMessage);
        
        // If authentication error, redirect to login
        if (errorMessage.includes("Authentication") || errorMessage.includes("Unauthorized")) {
          setTimeout(() => {
            navigate("/auth");
          }, 2000);
        }
        return;
      } finally {
        setIsSubmitting(false);
        setShowLoading(false);
      }
      return; // Exit early to prevent default next step behavior
    }

    if (currentStep === 5) {
      const cleanedSponsors = normalizeSponsors(sponsors);
      const hasChanges = sponsorsChanged(cleanedSponsors);

      // In edit mode, if sponsors are loaded and nothing changed (including toggle), skip API
      if (isEditMode && sponsorsLoadedRef.current && isSponsored === originalIsSponsored && !hasChanges) {
        toast.info("No changes to update");
        moveToNextStep();
        return;
      }

      // If toggle is off, clear sponsors only if previously set, otherwise skip
      if (!isSponsored) {
        if (!hasChanges) {
          if (!advance) {
            toast.success("Sponsor section is already up to date.");
          }
          moveToNextStep();
          return;
        }
        try {
          setSponsorSaving(true);
          setLoadingMessage("Saving sponsor details...");
          setShowLoading(true);

          if (!backendEventId) {
            toast.error("Event ID not found. Please go back to Step 1.");
            return;
          }

          const payload = { sponsors: [] };
          const response = await updateEventStep6(backendEventId, payload);
          console.log("Step 5 (Sponsor - cleared) API Response:", response);
          setOriginalSponsors([]);
          setOriginalIsSponsored(false);
          setSponsors([emptySponsor]);
          toast.success("Sponsor details saved");
          moveToNextStep();
        } catch (error) {
          console.error("Error saving sponsors:", error);
          toast.error(error.message || "Failed to save sponsor details. Please try again.");
          return;
        } finally {
          setSponsorSaving(false);
          setShowLoading(false);
          setLoadingMessage("");
        }
        return;
      }

      // Toggle is on
      if (cleanedSponsors.length === 0) {
        toast.error("Add at least one sponsor with name to continue.");
        return;
      }

      const missingNames = cleanedSponsors.some((s) => !s.name);
      if (missingNames) {
        toast.error("Sponsor name is required for each sponsor entry.");
        return;
      }

      if (!hasChanges) {
        toast.info("No changes to update");
        moveToNextStep();
        return;
      }

      try {
        setSponsorSaving(true);
        setLoadingMessage("Saving sponsor details...");
        setShowLoading(true);

        if (!backendEventId) {
          toast.error("Event ID not found. Please go back to Step 1.");
          setSponsorSaving(false);
          setShowLoading(false);
          setLoadingMessage("");
          return;
        }

        const payload = {
          sponsors: cleanedSponsors,
        };

        const response = await updateEventStep6(backendEventId, payload);
        console.log("Step 5 (Sponsor) API Response:", response);
        setOriginalSponsors(cleanedSponsors);
        setOriginalIsSponsored(true);
        toast.success("Sponsor details saved");
        moveToNextStep();
      } catch (error) {
        console.error("Error saving sponsors:", error);
        toast.error(error.message || "Failed to save sponsor details. Please try again.");
        return;
      } finally {
        setSponsorSaving(false);
        setShowLoading(false);
        setLoadingMessage("");
      }
      return;
    }

    if (currentStep === 6) {
      // Validate that all artists with names have Instagram
      for (let i = 0; i < artists.length; i++) {
        const artist = artists[i];
        if (artist.name.trim() && !(artist.instagram || '').trim()) {
          toast.error(`Instagram is required for Artist ${i + 1}`);
          return;
        }
      }

      const normalizedCurrentArtists = normalizeArtists(artists);
      const hasArtistChanges = artistsChanged(normalizedCurrentArtists);

      // Call API for Step 6 - Create Artists (only new ones)
      try {
        setIsSubmitting(true);
        setLoadingMessage("Adding artists...");
        setShowLoading(true);
        
        // Check if we have backend event ID
        if (!backendEventId) {
          toast.error("Event ID not found. Please go back to Step 1.");
          setIsSubmitting(false);
          setShowLoading(false);
          return;
        }
        
        // Filter out empty artists
        const validArtists = artists
          .filter(artist => artist.name.trim() !== "")
          .map(artist => ({
            ...artist,
            image: artist.photo || artist.image || "",
            eventId: backendEventId,
          }));
        
        if (validArtists.length === 0) {
          // No artists to create, just move to next step
          setIsSubmitting(false);
          setShowLoading(false);
          if (!advance) {
            toast.success("Artist section is already up to date.");
          }
          moveToNextStep();
          return;
        }
        
        const artistResponses = [];
        
        for (let i = 0; i < validArtists.length; i++) {
          const artist = validArtists[i];
          
          // Only create artists that haven't been created before
          if (!createdArtistIndices.includes(i)) {
            console.log(`🎤 Creating artist ${i + 1}:`, artist);
            
            const artistPayload = {
              ...artist,
              image: artist.image || artist.photo || null,
              instagramLink: artist.instagram || artist.instagramLink || null,  // Map instagram to instagramLink
              spotifyLink: artist.spotify || artist.spotifyLink || null,     // Also fix spotify for consistency
              eventId: backendEventId,
            };
            
            // Remove the old field names to avoid confusion
            delete artistPayload.instagram;
            delete artistPayload.spotify;
            
            const response = await createArtist(artistPayload);
            
            artistResponses.push(response);
            
            // Mark this artist as created
            setCreatedArtistIndices(prev => [...prev, i]);
          } else {
            console.log(`⏭️ Skipping artist ${i + 1} (already created)`);
          }
        }
        
        // Persist artists to event record (including updated images/links)
        const persistPayload = validArtists.map((artist) => ({
          name: artist.name,
          gender: artist.gender,
          image: artist.image || artist.photo || null,
          instagramLink: artist.instagram || artist.instagramLink || null,
          spotifyLink: artist.spotify || artist.spotifyLink || null,
        }));

        try {
          await updateEventStep6(backendEventId, { artists: persistPayload });
        } catch (err) {
          console.error("Failed to persist artists on updateEventStep6:", err);
        }

        console.log("Step 6 API Response:", artistResponses);
        if (!advance) {
          toast.success("Artist details processed.");
        }
        
        // Move to next step after successful API call
        moveToNextStep();
      } catch (error) {
        console.error("Error creating artists:", error);
        const errorMessage = error.message || "Failed to add artists. Please try again.";
        toast.error(errorMessage);
        
        // If authentication error, redirect to login
        if (errorMessage.includes("Authentication") || errorMessage.includes("Unauthorized")) {
          setTimeout(() => {
            navigate("/auth");
          }, 2000);
        }
      } finally {
        setIsSubmitting(false);
        setShowLoading(false);
      }
      return; // Exit early to prevent default next step behavior
    }

    if (currentStep === 7) {
      // Persist Additional Info before moving to Review
      const currentNormalized = normalizeAdditionalFromState();
      if (
        isEditMode &&
        originalAdditionalRef.current &&
        JSON.stringify(currentNormalized) === JSON.stringify(originalAdditionalRef.current)
      ) {
        toast.info("No changes to update");
        moveToNextStep();
        return;
      }
      try {
        setIsSubmitting(true);
        setLoadingMessage("Saving additional info...");
        setShowLoading(true);

        if (!backendEventId) {
          toast.error("Event ID not found. Please complete previous steps.");
          setIsSubmitting(false);
          setShowLoading(false);
          return;
        }

        const tcData = termsAndConditions
          ? {
              content: termsAndConditions,
              lastUpdated: new Date().toISOString(),
            }
          : null;

        const advisoryData = {};
        Object.keys(advisory).forEach((key) => {
          if (advisory[key] && key !== "other") {
            advisoryData[key] = true;
          }
        });
        if (customAdvisories.length > 0) {
          advisoryData.customAdvisories = customAdvisories;
        }
        const advisoryJson = Object.keys(advisoryData).length > 0 ? advisoryData : null;

        const questionsJson = customQuestions.length > 0 ? customQuestions : null;

        const updateData = {
          TC: tcData,
          advisory: advisoryJson,
          questions: questionsJson,
          organizerNote: organizerNote,
          publishStatus: publishState || "DRAFT",
        };

        await updateEventStep6(backendEventId, updateData);
        // Refresh original snapshot to avoid re-saving unchanged data on subsequent clicks
        originalAdditionalRef.current = normalizeAdditionalFromState();
        currentAdditionalRef.current = originalAdditionalRef.current;
        toast.success("Additional info saved");
        moveToNextStep();
      } catch (error) {
        console.error("Error saving additional info:", error);
        toast.error(error.message || "Failed to save additional info. Please try again.");
        return;
      } finally {
        setIsSubmitting(false);
        setShowLoading(false);
      }
      return;
    }

    if (currentStep === 8) {
      if (!backendEventId) {
        toast.error("Event ID not found. Please complete all previous steps.");
        return;
      }

      try {
        setIsSubmitting(true);
        setLoadingMessage("Saving template selection...");
        setShowLoading(true);
        await updateEventStep6(backendEventId, {
          detailTemplate: normalizeEventDetailTemplateId(selectedTemplate),
        });
        moveToNextStep();
      } catch (error) {
        console.error("Error saving template selection:", error);
        toast.error(error.message || "Failed to save template selection. Please try again.");
        return;
      } finally {
        setIsSubmitting(false);
        setShowLoading(false);
      }
      return;
    }

    if (currentStep < steps.length) {
      moveToNextStep();
    }
  };

  const saveCurrentSection = async () => {
    await nextStep({ advance: false });
  };

  const goToStep = (stepNumber) => {
    if (!isEditMode || isSectionBusy || stepNumber === currentStep) {
      return;
    }

    setCurrentStep(stepNumber);
  };

  const prevStep = () => {
    if (!isSectionBusy && currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const preview = URL.createObjectURL(file);
      setCoverImage(preview);
      setCoverImageFile(file);
      setImagesChanged(true);
      setRemoveFlyerImage(false);

      // Upload immediately to Cloudinary draft
      const { url, publicId } = await uploadDraftImage(file, 'flyers');
      setCoverImage(url);
      setDraftCoverPublicId(publicId);
      setCoverPublicId(publicId);
      toast.success("Cover image uploaded successfully.");
    } catch (error) {
      console.error("Failed to upload cover image:", error);
      toast.error(error.message || "Failed to upload cover image.");
      // Reset on error
      setCoverImage(null);
      setCoverImageFile(null);
      setDraftCoverPublicId(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverImage = async () => {
    const deleteDraftCoverIfAny = async () => {
      if (draftCoverPublicId) {
        try {
          await deleteDraftCloudinaryImage(draftCoverPublicId, "EVENT_FLYER");
        } catch (err) {
          console.warn("⚠️ Failed to delete draft cover from Cloudinary", err?.message);
        }
      }
    };

    // If editing existing event with backend ID and has existing cover image
    if (backendEventId && coverImage && typeof coverImage === 'string' && !coverImage.startsWith('data:')) {
      try {
        setLoadingMessage("Deleting cover image...");
        setShowLoading(true);
        
        console.log("🗑️ Deleting flyer image from backend immediately...");
        await deleteFlyerImage(backendEventId);
        
        console.log("✅ Flyer image deleted from backend successfully!");

        if (coverPublicId) {
          await deleteDraftCloudinaryImage(coverPublicId, "EVENT_FLYER");
        }
        await deleteDraftCoverIfAny();

        // Remove from UI immediately after successful backend deletion
        setCoverImage(null);
        setCoverImageFile(null);
        setRemoveFlyerImage(true);
        setDraftCoverPublicId(null);
        setCoverPublicId(null);
        setImagesChanged(true);
        
        // Reset the file input value to clear the filename
        if (coverImageInputRef.current) {
          coverImageInputRef.current.value = '';
        }
        
        toast.success("Cover image deleted successfully!");
        console.log("✅ Cover image removed from UI and backend");
        
      } catch (error) {
        console.error("Failed to delete flyer image:", error);
        toast.error("Failed to delete image from server");
        return; // Don't remove from UI if backend deletion failed
      } finally {
        setShowLoading(false);
      }
    } else {
      // For local images (not yet uploaded), just remove from UI
      console.log("🗑️ Removing local cover image from UI");
      
      await deleteDraftCoverIfAny();

      setCoverImage(null);
      setCoverImageFile(null);
      setDraftCoverPublicId(null);
      setCoverPublicId(null);
      setRemoveFlyerImage(true);
      setImagesChanged(true);
      
      // Reset the file input value to clear the filename
      if (coverImageInputRef.current) {
        coverImageInputRef.current.value = '';
      }
      
      console.log("✅ Local cover image removed from UI");
    }
  };

  const handleGalleryImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check file types
    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
      if (!file.type.match('image.*')) {
        invalidFiles.push(file.name);
        continue;
      }
      validFiles.push(file);
    }

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files (${invalidFiles.join(', ')}) - Only images are allowed`);
      if (validFiles.length === 0) return;
    }

    // Check total count (max 10 gallery images)
    const currentCount = galleryImages.length;
    if (currentCount + validFiles.length > 10) {
      toast.error(`Maximum 10 gallery images allowed. You already have ${currentCount} image(s).`);
      return;
    }

    try {
      setUploadingGallery(true);

      // Upload each valid file to draft folder immediately
      const uploads = [];
      for (const file of validFiles) {
        const res = await uploadDraftImage(file, 'gallery');
        uploads.push(res);
      }

      const newUrls = uploads.map((u) => u.url).filter(Boolean);
      const newDrafts = uploads.map((u) => ({ url: u.url, publicId: u.publicId })).filter((u) => u.url && u.publicId);

      setGalleryImages((prev) => [...prev, ...newUrls]);
      setDraftGalleryUploads((prev) => [...prev, ...newDrafts]);
      setGalleryImagePublicIds((prev) => ({ ...prev, ...newDrafts.reduce((acc, d) => ({ ...acc, [d.url]: d.publicId }), {}) }));
      setImagesChanged(true);

      toast.success(`${uploads.length} gallery image(s) uploaded.`);
    } catch (error) {
      console.error("Failed to upload gallery images:", error);
      toast.error(error.message || "Failed to upload gallery images.");
    } finally {
      // Reset the file input to allow re-uploading the same file
      if (e.target) {
        e.target.value = '';
      }
      setUploadingGallery(false);
    }
  };

  const removeGalleryImage = async (index) => {
    const imageToRemove = galleryImages[index];
    
    const draftMatch = draftGalleryUploads.find((d) => d.url === imageToRemove);
    const publicIdFromMap = galleryImagePublicIds[imageToRemove];
    const deleteDraftIfAny = async () => {
      if (draftMatch?.publicId) {
        try {
          await deleteDraftCloudinaryImage(draftMatch.publicId, "EVENT_GALLERY");
        } catch (err) {
          console.warn("⚠️ Failed to delete draft gallery image from Cloudinary", err?.message);
        }
      }
    };

    console.log("🔍 Attempting to remove gallery image at index:", index);
    console.log("   Image URL:", imageToRemove);
    console.log("   Backend event ID:", backendEventId);
    console.log("   All gallery image IDs:", galleryImageIds);
    
    // Check if this image has an ID in our map (means it's from backend)
    const imageId = galleryImageIds[imageToRemove];
    
    if (imageId && backendEventId) {
      try {
        setLoadingMessage("Deleting gallery image...");
        setShowLoading(true);
        
        console.log("🗑️ Deleting gallery image from backend...");
        console.log("   Image ID:", imageId);
        console.log("   DELETE URL:", `/api/event/${backendEventId}/images/${imageId}`);
        
        // Call DELETE API using new deleteGalleryImage function
        await deleteGalleryImage(backendEventId, imageId);

        if (publicIdFromMap) {
          await deleteDraftCloudinaryImage(publicIdFromMap, "EVENT_GALLERY");
        }
        
        console.log("✅ Gallery image deleted from backend successfully!");
        
        // Mark this image as deleted so it never shows again
        setDeletedImageIds(prev => {
          const newSet = new Set(prev);
          newSet.add(imageId);
          // Persist to sessionStorage
          sessionStorage.setItem('deletedImageIds', JSON.stringify([...newSet]));
          console.log("🔒 Added to deleted images list:", imageId);
          return newSet;
        });
        
      } catch (error) {
        console.error("❌ Failed to delete gallery image from backend:", error);
        
        // Check if error is 404 (image already deleted) or other error
        const errorMessage = error.message || "";
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          console.warn("⚠️ Image already deleted from backend, marking as deleted");
          
          // Still mark as deleted to prevent showing again
          setDeletedImageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(imageId);
            sessionStorage.setItem('deletedImageIds', JSON.stringify([...newSet]));
            return newSet;
          });
          
          toast.info("Image already deleted, removing from display");
        } else {
          toast.error("Failed to delete image from server");
          setShowLoading(false);
          return; // Don't remove from UI if it's a real error
        }
      }
      
      // Remove from UI after deletion attempt (successful or 404)
      setGalleryImages((prev) => prev.filter((_, i) => i !== index));
      
      // Remove from tracking
      setExistingGalleryUrls(prev => prev.filter(url => url !== imageToRemove));
      
      // Remove from ID map
      setGalleryImageIds(prev => {
        const newMap = { ...prev };
        delete newMap[imageToRemove];
        return newMap;
      });

      setGalleryImagePublicIds(prev => {
        const next = { ...prev };
        delete next[imageToRemove];
        return next;
      });
      
      setImagesChanged(true);
      
      console.log("✅ Gallery image removed from UI and marked as permanently deleted");
      setShowLoading(false);
      
    } else {
      // For local images (not yet uploaded), just remove from UI
      console.log("🗑️ Removing local gallery image from UI");
      
      await deleteDraftIfAny();

      setGalleryImages((prev) => prev.filter((_, i) => i !== index));

      // Remove from files if it's a new upload (no ID)
      const newFileIndex = index - Object.keys(galleryImageIds).length;
      if (newFileIndex >= 0) {
        setGalleryImageFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
      }

      if (draftMatch) {
        setDraftGalleryUploads((prev) => prev.filter((d) => d.url !== imageToRemove));
        setGalleryImagePublicIds((prev) => {
          const next = { ...prev };
          delete next[imageToRemove];
          return next;
        });
      }

      setImagesChanged(true);
    }
  };

  const handleArtistPhotoChange = async (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!backendEventId) {
      toast.error("Please complete Step 1 first to create the event");
      return;
    }

    try {
      setShowLoading(true);
      setLoadingMessage("Uploading artist photo...");

      const res = await uploadArtistImage(backendEventId, file);
      const imageUrl = res?.data?.image || res?.data?.url || res?.url;
      const publicId = res?.data?.publicId;

      if (!imageUrl) {
        throw new Error("Image uploaded but URL was not returned. Please try again.");
      }

      const newArtists = [...artists];
      newArtists[index].photo = imageUrl;
      newArtists[index].image = imageUrl;
      if (publicId) newArtists[index].publicId = publicId;
      setArtists(newArtists);

      toast.success("Artist photo uploaded successfully!");
    } catch (err) {
      console.error("Failed to upload artist photo:", err);
      toast.error(err?.message || "Failed to upload artist photo. Please try again.");
    } finally {
      setShowLoading(false);
      setLoadingMessage("");
    }
  };

  const handleRemoveArtistPhoto = async (index) => {
    const artist = artists[index];
    const publicId = artist?.publicId;

    if (publicId) {
      try {
        await deleteDraftCloudinaryImage(publicId, "EVENT_GALLERY");
      } catch (err) {
        console.warn("⚠️ Failed to delete artist photo from Cloudinary", err?.message);
      }
    }

    const newArtists = [...artists];
    newArtists[index].photo = "";
    newArtists[index].image = "";
    newArtists[index].publicId = "";
    setArtists(newArtists);
  };

  const openTicketModal = (type) => {
    setSelectedTicketType(type);
    setTicketModalOpen(true);
  };

  const normalizeSponsors = (list) => {
    const mapped = list
      .map((s) => ({
        name: (s.name || "").trim(),
        logoUrl: (s.logoUrl || s.logo || "").trim(),
        websiteUrl: (s.websiteUrl || s.website || "").trim(),
        isPrimary: Boolean(s.isPrimary),
      }))
      .map((s) => ({
        name: s.name,
        ...(s.logoUrl ? { logoUrl: s.logoUrl } : {}),
        ...(s.websiteUrl ? { websiteUrl: s.websiteUrl } : {}),
        isPrimary: s.isPrimary,
      }))
      .filter((s) => s.name || s.logoUrl || s.websiteUrl);

    if (mapped.length === 1) {
      mapped[0].isPrimary = true;
    } else if (mapped.length > 1 && !mapped.some((s) => s.isPrimary)) {
      mapped[0].isPrimary = true;
    }

    return mapped;
  };

  const normalizeArtists = (list) =>
    (list || [])
      .map((a) => {
        const image = (a.photo || a.image || "").trim();
        return {
          name: (a.name || "").trim(),
          image,
          photo: image,
          instagramLink: (a.instagram || a.instagramLink || "").trim(),
          spotifyLink: (a.spotify || a.spotifyLink || "").trim(),
          gender: a.gender || "PREFER_NOT_TO_SAY",
        };
      })
      .filter((a) => a.name || a.instagramLink || a.spotifyLink || a.image);

  const sponsorsChanged = (normalizedList = null) => {
    const filtered = normalizedList ?? normalizeSponsors(sponsors);
    return JSON.stringify(filtered) !== JSON.stringify(originalSponsors);
  };

  const artistsChanged = (normalizedList = null) => {
    const filtered = normalizedList ?? normalizeArtists(artists);
    return JSON.stringify(filtered) !== JSON.stringify(originalArtists);
  };

  const setPrimarySponsor = (index) => {
    setSponsors((prev) =>
      prev.map((s, i) => ({
        ...s,
        isPrimary: i === index,
      }))
    );
  };

  const handleSponsorChange = (index, key, value) => {
    setSponsors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addSponsorRow = () => {
    setSponsors((prev) => [...prev, { ...emptySponsor }]);
  };

  const removeSponsorRow = (index) => {
    setSponsors((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSponsorLogoChange = async (index, file) => {
    if (!file) return;
    if (!backendEventId) {
      toast.error("Please save event details first to upload sponsor logos.");
      return;
    }
    try {
      setSponsorUploadIndex(index);
      setShowLoading(true);
      setLoadingMessage("Uploading sponsor logo...");
      const upload = await uploadArtistImage(backendEventId, file); // reuse Cloudinary flow (EVENT_GALLERY)
      const logoUrl = upload?.data?.url || upload?.data?.image || "";
      const publicId = upload?.data?.publicId;
      setSponsors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], logoUrl, logo: logoUrl, logoPublicId: publicId };
        return next;
      });
      toast.success("Logo uploaded");
    } catch (err) {
      console.error("Failed to upload sponsor logo:", err);
      toast.error(err?.message || "Failed to upload sponsor logo");
    } finally {
      setSponsorUploadIndex(null);
      setShowLoading(false);
      setLoadingMessage("");
    }
  };

  const handleRemoveSponsorLogo = async (index) => {
    const sponsor = sponsors[index];
    const publicId = sponsor?.logoPublicId;

    if (publicId) {
      try {
        await deleteDraftCloudinaryImage(publicId, "EVENT_GALLERY");
      } catch (err) {
        console.warn("⚠️ Failed to delete sponsor logo from Cloudinary", err?.message);
      }
    }

    setSponsors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], logoUrl: "", logo: "", logoPublicId: "" };
      return next;
    });
  };

  const handleSaveTicket = async (ticketData) => {
    try {
      setLoadingMessage("Creating ticket...");
      setShowLoading(true);
      
      // Add event ID to ticket data
      const ticketWithEvent = {
        ...ticketData,
        eventId: backendEventId
      };
      
      // Create ticket in backend
      const response = await createTicket(ticketWithEvent);
      
      // Add the ticket with its ID to savedTickets
      const newTicket = {
        ...ticketData,
        id: response.data?.id || response.id // Handle different response formats
      };
      
      const updatedTickets = [...savedTickets, newTicket];
      setSavedTickets(updatedTickets);
      
      // Update createdTicketIds
      setCreatedTicketIds(prev => [...prev, newTicket.id]);
      
      // Save to localStorage
      localStorage.setItem(`event_${backendEventId}_tickets`, JSON.stringify(updatedTickets));
      
      toast.success("Ticket created successfully!");
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error(error.message || "Failed to create ticket. Please try again.");
    } finally {
      setShowLoading(false);
    }
  };

  const handleDeleteTicket = async (ticket, index) => {
    try {
      // If the ticket has an ID (already saved to backend), delete it from the backend
      if (ticket.id) {
        setLoadingMessage("Deleting ticket...");
        setShowLoading(true);
        
        await deleteTicket(ticket.id);
        
        // Remove the ticket ID from createdTicketIds if it exists
        const ticketIndex = createdTicketIds.indexOf(ticket.id);
        if (ticketIndex !== -1) {
          const updatedTicketIds = [...createdTicketIds];
          updatedTicketIds.splice(ticketIndex, 1);
          setCreatedTicketIds(updatedTicketIds);
        }
        
        // Remove from localStorage
        const updatedTickets = savedTickets.filter((_, i) => i !== index);
        localStorage.setItem(`event_${backendEventId}_tickets`, JSON.stringify(updatedTickets));
        
        // Update UI
        setSavedTickets(updatedTickets);
        
        toast.success("Ticket deleted successfully!");
      } else {
        // If ticket wasn't saved to backend yet, just remove from local state
        const updatedTickets = savedTickets.filter((_, i) => i !== index);
        setSavedTickets(updatedTickets);
        localStorage.setItem(`event_${backendEventId}_tickets`, JSON.stringify(updatedTickets));
      }
      
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error(error.message || "Failed to delete ticket. Please try again.");
    } finally {
      setShowLoading(false);
    }
  };

  const handleSubmit = async (targetState) => {
    const effectiveState = targetState || publishState;
    const isDraft = effectiveState !== "PUBLISHED";
    setPublishState(effectiveState);
    // Validation
    if (!eventTitle || !mainCategory || selectedCategories.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Call API for Step 7 - Update Additional Information
    try {
      setIsSubmitting(true);
      setLoadingMessage(isDraft ? "Saving draft..." : "Publishing event...");
      setShowLoading(true);
      
      // Check if we have backend event ID
      if (!backendEventId) {
        toast.error("Event ID not found. Please complete all previous steps.");
        setIsSubmitting(false);
        setShowLoading(false);
        return;
      }
      
      // Prepare Terms & Conditions as JSON
      const tcData = termsAndConditions ? {
        content: termsAndConditions,
        lastUpdated: new Date().toISOString()
      } : null;
      
      // Prepare Advisory as JSON (only include selected items)
      const advisoryData = {};
      Object.keys(advisory).forEach(key => {
        if (advisory[key] && key !== 'other') {
          advisoryData[key] = true;
        }
      });
      // Add custom advisories if present
      if (customAdvisories.length > 0) {
        advisoryData.customAdvisories = customAdvisories;
      }
      const advisoryJson = Object.keys(advisoryData).length > 0 ? advisoryData : null;
      
      // Prepare Questions as JSON
      const questionsJson = customQuestions.length > 0 ? customQuestions : null;
      
      const updateData = {
        TC: tcData,
        advisory: advisoryJson,
        questions: questionsJson,
        organizerNote: organizerNote,
        detailTemplate: normalizeEventDetailTemplateId(selectedTemplate),
        publishStatus: isDraft ? "DRAFT" : "PUBLISHED",
      };

      const response = await updateEventStep6(backendEventId, updateData);
      
      console.log("Step 7 API Response:", response);
      
      // Success handling (no explicit status payloads)
      toast.success(isDraft ? "Event saved as draft!" : "Event updated successfully!");
      
      // Save complete event to localStorage as fallback (until backend my-events endpoint is ready)
      try {
        const STORAGE_KEY = "mapMyParty_events";
        const existingEvents = localStorage.getItem(STORAGE_KEY);
        const eventsArray = existingEvents ? JSON.parse(existingEvents) : [];
        
        // Create complete event object
        const completeEvent = {
          id: backendEventId,
          eventId: eventId,
          eventTitle: eventTitle,
          title: eventTitle, // Alias for compatibility
          eventType: currentEventType, // Use backend enum value (GUESTLIST, EXCLUSIVE, NON_EXCLUSIVE) or undefined
          mainCategory: mainCategory,
          category: mainCategory, // Alias for compatibility
          subcategory: selectedCategories[0] || "",
          description: eventDescription,
          publishStatus: isDraft ? "DRAFT" : "PUBLISHED",
          startDate: startDate,
          endDate: endDate,
          date: startDate, // Alias for compatibility
          flyerImage: coverImage,
          flyerImageUrl: coverImage,
          image: coverImage, // Alias for compatibility
          galleryImages: galleryImages,
          detailTemplate: normalizeEventDetailTemplateId(selectedTemplate),
          ticketsSold: 0,
          totalTickets: savedTickets.reduce((sum, t) => sum + (t.available || 0), 0),
          revenue: 0,
          attendees: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Check if event already exists (update) or add new
        const existingIndex = eventsArray.findIndex(e => e.id === backendEventId || e.eventId === eventId);
        if (existingIndex >= 0) {
          eventsArray[existingIndex] = completeEvent;
          console.log("📝 Updated existing event in localStorage");
        } else {
          eventsArray.unshift(completeEvent); // Add to beginning
          console.log("➕ Added new event to localStorage");
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsArray));
        console.log("💾 Event saved to localStorage for fallback");
      } catch (storageError) {
        console.warn("⚠️ Could not save to localStorage:", storageError);
        // Don't block the flow if localStorage fails
      }
      
      // Navigate to dashboard after successful submission
      navigate("/organizer/dashboard-v2");
    } catch (error) {
      console.error("Error updating event (Step 6):", error);
      const errorMessage = error.message || "Failed to save additional information. Please try again.";
      toast.error(errorMessage);
      
      // If authentication error, redirect to login
      if (errorMessage.includes("Authentication") || errorMessage.includes("Unauthorized")) {
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
      setShowLoading(false);
    }
  };

  return (
    <div className="create-event-shell min-h-screen flex flex-col bg-gradient-to-br from-[#000000] via-[#0a0a0a] to-[#050510] text-white">
      <LoadingOverlay show={showLoading} message={loadingMessage} />
      <Header isAuthenticated userRole="organizer" />

      <main className="flex-1 py-10">
        <div className="w-full max-w-[1100px] mx-auto px-4 md:px-8 space-y-8 pb-8">
          {isEditMode && isEditHydrating && (
            <Card className={`${cardBase} p-8`}>
              <div className="flex items-center gap-3 text-white/80">
                <Loader2 className="h-5 w-5 animate-spin text-[#D60024]" />
                <div>
                  <p className="text-sm font-medium">Loading event for editing...</p>
                  <p className="text-xs text-white/50">Fetching the latest event data from the server.</p>
                </div>
              </div>
            </Card>
          )}

          {isEditMode && editHydrationError && (
            <Card className={`${cardBase} border-red-500/30 bg-red-950/20 p-6`}>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-300">Could not load this event</p>
                <p className="text-sm text-red-200/80">{editHydrationError}</p>
              </div>
            </Card>
          )}

          {/* Back Button and Clear Draft */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-10 rounded-lg px-3 text-white hover:bg-[#111111]"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-5 h-5" />
                 <span className="text-sm text-gray-300">Back</span>
              </Button>
              {/* <span className="text-sm text-gray-300">Back</span> */}
            </div>
            
            {backendEventId && !isEditMode && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-lg border-[#2a2a2a] bg-[#0f0f0f] text-white hover:bg-[#151515] hover:border-[#D60024]/40"
                onClick={() => {
                  if (confirm("Are you sure you want to start a new event? This will discard the current draft.")) {
                    sessionStorage.removeItem('draftEventId');
                    sessionStorage.removeItem('draftStarted');
                    sessionStorage.removeItem('deletedImageIds');
                    setBackendEventId(null);
                    setCreatedTicketIds([]);
                    setVenueCreated(false);
                    setCreatedArtistIndices([]);
                    setDeletedImageIds(new Set());
                    toast.success("Draft cleared. Starting new event.");
                    window.location.reload();
                  }
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Draft & Start New
              </Button>
            )}
          </div>

          {/* Progress Header */}
          <Card
            className={`border ${cardBase}`}
            style={{ borderColor: pageTheme.border, boxShadow: pageTheme.glow }}
          >
            <CardContent className="p-8 space-y-8 rounded-2xl">
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="space-y-3">
                  <p className="text-[12px] uppercase tracking-[0.12em] text-white/60">
                    Event Builder
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-[32px] font-semibold tracking-[-0.02em] text-white">
                      {isEditMode ? "Update Event" : "Create New Event"}
                    </h1>
                    {selectedEventTypeCategory && (
                      <Badge className="h-7 rounded-full border-[#2a2a2a] bg-[#111111] px-3 text-[11px] uppercase tracking-[0.12em] text-white/80">
                        {selectedEventTypeCategory}
                      </Badge>
                    )}
                    
                    {backendEventId && !isEditMode && (
                      <Badge className="h-7 rounded-full bg-[#ef4444]/20 text-white border-[#ef4444]/40 px-3 text-[11px] uppercase tracking-[0.12em]">
                        Draft
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-end sm:items-center gap-4 flex-col sm:flex-row sm:flex-wrap justify-end">
                  
                    
                  <div className="flex items-center gap-3">
                   
                    <div className="relative flex h-10 rounded-full overflow-hidden border border-[#2a2a2a] bg-[#0f0f0f] p-1">
                      <div
                        className="absolute top-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-[#D60024] rounded-full transition-all duration-300 ease-out"
                        style={{
                          transform: publishState === "PUBLISHED" ? "translateX(100%)" : "translateX(0)",
                        }}
                      />
                      {["DRAFT", "PUBLISHED"].map((state) => {
                        const isActive = publishState === state;
                        return (
                          <button
                            key={state}
                            type="button"
                            className={`relative z-10 text-sm font-medium px-5 py-2 transition-all duration-300 ${
                              isActive
                                ? "text-white"
                                : "text-gray-400 hover:text-gray-300"
                            }`}
                            onClick={() => setPublishState(state)}
                            disabled={isSectionBusy}
                          >
                            {state === "DRAFT" ? "Draft" : "Publish"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-3 h-10 rounded-full bg-[#0f0f0f] border border-[#2a2a2a]">
                    <div className="w-2 h-2 rounded-full bg-[#D60024] animate-pulse" />
                    <span className="text-xs text-gray-300 whitespace-nowrap tracking-[0.08em] uppercase">
                      Step {currentStep} of {steps.length} • {steps[currentStep - 1].title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Circle+bar tracker */}
              <div className="space-y-2">
                <div className="flex items-center gap-8 overflow-x-auto pb-1">
                  {steps.map((step, idx) => {
                    const isCurrent = step.number === currentStep;
                    const isDone = step.number < currentStep;
                    const barActive =
                      idx < currentStep - 1
                        ? "bg-[#ef4444]"
                        : idx === currentStep - 1
                        ? "bg-[#2a2a2a]"
                        : "bg-[#1a1a1a]";

                    return (
                      <div key={step.number} className="min-w-max flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => goToStep(step.number)}
                          disabled={!canJumpBetweenSections}
                          className={`flex flex-col items-center gap-2 rounded-xl transition ${
                            canJumpBetweenSections ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border text-sm font-medium transition-all ${
                              isDone
                                ? "bg-[#ef4444] border-[#ef4444] text-white"
                                : isCurrent
                                ? "border-[#ef4444] bg-[#111111] text-white"
                                : canJumpBetweenSections
                                ? "border-[#2a2a2a] bg-[#111111] text-[#777777] hover:border-[#ef4444]/60 hover:text-white"
                                : "border-[#2a2a2a] bg-[#111111] text-[#777777]"
                            }`}
                          >
                            {isDone ? <Check className="w-4 h-4" /> : step.number}
                          </div>
                          <p
                            className={`text-xs font-medium text-center leading-tight whitespace-nowrap ${
                              isCurrent ? "text-white" : canJumpBetweenSections ? "text-gray-300" : "text-gray-400"
                            }`}
                          >
                            {step.title}
                          </p>
                        </button>
                        {idx !== steps.length - 1 && (
                          <div className={`h-px w-14 rounded-full ${barActive}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {isEditMode && (
                  <p className="text-xs text-white/50">Click any section to jump directly while editing.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card className={`${cardBase} overflow-hidden`}>
            <CardHeader className="border-b border-[#1f1f1f] bg-[#0f0f0f] px-8 py-6">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#111111] text-sm font-semibold">
                  {currentStep}
                </span>
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-gray-200 px-8 py-8">
              {/* Step 1: Event Details + Images */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="eventTitle" className="text-[13px] font-medium text-[#d4d4d4]">Event Title *</Label>
                      <Input
                        id="eventTitle"
                        placeholder="Enter event title"
                        value={eventTitle}
                        className={fieldClass}
                        onChange={(e) => {
                          setEventTitle(e.target.value);
                          if (backendEventId) setTextFieldsChanged(true);
                        }}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[13px] font-medium text-[#d4d4d4]">Main Category *</Label>
                      <Select value={mainCategory} onValueChange={(value) => {
                        setMainCategory(value);
                        setSelectedCategories([]);
                        if (backendEventId) setTextFieldsChanged(true);
                      }}>
                        <SelectTrigger className={fieldClass}>
                          <SelectValue placeholder="Select main category" />
                        </SelectTrigger>
                        <SelectContent className={selectMenuClass}>
                          <SelectItem value="Music">Music</SelectItem>
                          <SelectItem value="Workshop">Workshop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {mainCategory && (
                      <div className="space-y-2.5">
                        <Label className="text-[13px] font-medium text-[#d4d4d4]">Subcategory *</Label>
                        <Select value={selectedCategories[0] || ""} onValueChange={(value) => {
                          setSelectedCategories([value]);
                          if (backendEventId) setTextFieldsChanged(true);
                        }}>
                          <SelectTrigger className={fieldClass}>
                            <SelectValue placeholder="Select subcategory" />
                          </SelectTrigger>
                          <SelectContent className={selectMenuClass}>
                            {categoryHierarchy[mainCategory]?.map((subcat) => (
                              <SelectItem key={subcat} value={subcat}>
                                {subcat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2.5">
                      <Label htmlFor="description" className="text-[13px] font-medium text-[#d4d4d4]">Event Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your event..."
                        rows={4}
                        value={eventDescription}
                        className={`${fieldClass} min-h-[120px] py-3`}
                        onChange={(e) => {
                          setEventDescription(e.target.value);
                          if (backendEventId) setTextFieldsChanged(true);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="text-sm text-muted-foreground">
                      Add a striking cover and gallery to make your event pop.
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="cover-image" className="text-[13px] font-medium text-[#d4d4d4]">Cover Image *</Label>
                      <div className="space-y-4">
                        <div className={`relative rounded-xl border border-dashed border-[#333333] bg-[#0e0e0e] p-6 text-center transition-all duration-200 ${!basicDetailsFilled ? "opacity-70" : "hover:border-[#ef4444]/60"}`}>
                        <input
                          id="cover-image" 
                          type="file" 
                          accept="image/*" 
                          onChange={handleCoverImageChange}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          disabled={uploadingCover || !basicDetailsFilled}
                          ref={coverImageInputRef}
                        />
                          <div className="pointer-events-none flex flex-col items-center gap-2">
                            <Upload className="h-5 w-5 text-gray-400" />
                            <p className="text-sm text-gray-200">Drag and drop your cover image</p>
                            <p className="text-sm text-gray-400">or click to upload</p>
                            <p className="text-xs text-gray-500">Recommended size: 1920x1080</p>
                          </div>
                        </div>
                        {!basicDetailsFilled && (
                          <p className="text-xs text-amber-400">
                            Fill title, category, and subcategory to enable image uploads.
                          </p>
                        )}
                        
                        {/* Loading indicator for cover upload */}
                        {uploadingCover && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading cover image to cloud...</span>
                          </div>
                        )}
                        
                        {coverImage && !uploadingCover && (
                          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#262626]">
                            <img 
                              src={coverImage} 
                              alt="Cover preview" 
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={handleRemoveCoverImage}
                              title="Delete from cloud"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="gallery" className="text-[13px] font-medium text-[#d4d4d4]">Gallery Images (optional)</Label>
                      <div className="space-y-4">
                        <div className={`relative rounded-xl border border-dashed border-[#333333] bg-[#0e0e0e] p-6 text-center transition-all duration-200 ${!basicDetailsFilled ? "opacity-70" : "hover:border-[#ef4444]/60"}`}>
                        <input 
                          id="gallery" 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          onChange={handleGalleryImagesChange}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          disabled={uploadingGallery || !basicDetailsFilled}
                        />
                          <div className="pointer-events-none flex flex-col items-center gap-2">
                            <Upload className="h-5 w-5 text-gray-400" />
                            <p className="text-sm text-gray-200">Drag and drop gallery images</p>
                            <p className="text-sm text-gray-400">or click to upload</p>
                            <p className="text-xs text-gray-500">Supported formats: JPG, PNG, WebP. Up to 10 images.</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add up to 10 images. Max file size: 10MB each. Images upload immediately after selection.
                        </p>
                        
                        {/* Loading indicator for gallery upload */}
                        {uploadingGallery && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading gallery images to cloud...</span>
                          </div>
                        )}
                        
                        {galleryImages.length > 0 && (
                          <div
                            className="grid gap-3"
                            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}
                          >
                            {galleryImages.map((img, index) => (
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-[#262626] group bg-[#0f0f0f]">
                                <img 
                                  src={img} 
                                  alt={`Gallery preview ${index + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeGalleryImage(index)}
                                  title="Delete from cloud"
                                  disabled={uploadingGallery}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        {galleryImages.length > 0 && !uploadingGallery && (
                          <p className="text-xs text-success">
                            ✅ {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''} uploaded to cloud
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Sponsor */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Is this event sponsored?</p>
                        <p className="text-xs text-white/70">
                          Toggle “Yes” to add sponsor details required by the backend (name required; optional logo URL, website).
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.08em] text-white/60">No</span>
                        <Switch checked={isSponsored} onCheckedChange={setIsSponsored} />
                        <span className="text-xs uppercase tracking-[0.08em] text-white/60">Yes</span>
                      </div>
                    </div>
                    {!isSponsored && (
                      <div className="text-xs text-white/60">
                        Sponsors are disabled. Click “Next” to continue or toggle “Yes” to add sponsor information.
                      </div>
                    )}
                  </div>

                  {isSponsored && (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Add sponsor details to highlight partners on your event page.
                        </p>
                        <p className="text-xs text-white/60">
                          Required: Sponsor name. Optional: logo, website URL. When multiple sponsors exist, mark one as primary.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSponsorRow}
                        className="h-10 rounded-lg border-[#2a2a2a] bg-[#0f0f0f] px-4 text-white hover:border-[#ef4444]/60 hover:bg-[#151515]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Sponsor
                      </Button>
                    </div>
                  )}

                  {isSponsored && (
                    <div className="space-y-5">
                      {sponsors.map((sponsor, index) => (
                        <Card key={index} className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                          <CardContent className="p-5 space-y-5">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">Sponsor {index + 1}</p>
                                <h5 className="font-semibold text-white">Brand details</h5>
                              </div>
                              {sponsors.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeSponsorRow(index)}
                                  className="text-white hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <div className="space-y-2.5">
                                <Label className="text-[13px] font-medium text-[#d4d4d4]">Sponsor Name *</Label>
                                <Input
                                  placeholder="BrandCo"
                                  value={sponsor.name}
                                  className={fieldClass}
                                  onChange={(e) => handleSponsorChange(index, "name", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2.5">
                                <Label className="text-[13px] font-medium text-[#d4d4d4]">Website URL</Label>
                                <Input
                                  type="url"
                                  placeholder="https://brandco.example.com"
                                  value={sponsor.websiteUrl}
                                  className={fieldClass}
                                  onChange={(e) => handleSponsorChange(index, "websiteUrl", e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                              <div className="space-y-2.5">
                                <Label className="text-[13px] font-medium text-[#d4d4d4]">Logo</Label>
                                <div className="space-y-3">
                                  <div className="relative rounded-xl border border-dashed border-[#333333] bg-[#0e0e0e] px-4 py-5 text-center transition-all duration-200 hover:border-[#ef4444]/60">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleSponsorLogoChange(index, e.target.files?.[0])}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                  />
                                    <div className="pointer-events-none flex flex-col items-center gap-2">
                                      <Upload className="h-4 w-4 text-gray-400" />
                                      <p className="text-sm text-gray-300">Upload sponsor logo</p>
                                      <p className="text-xs text-gray-500">PNG / SVG preferred</p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground">PNG / SVG with transparent background preferred</p>
                                  {sponsorUploadIndex === index && (
                                    <div className="flex items-center gap-2 text-sm text-primary">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Uploading logo...</span>
                                    </div>
                                  )}
                                  {sponsor.logoUrl && (
                                    <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-gray-700 bg-[#0a0a0a] flex items-center justify-center">
                                      <img
                                        src={sponsor.logoUrl}
                                        alt={`${sponsor.name || "Sponsor"} logo`}
                                        className="w-full h-full object-contain p-2"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                                        onClick={() => handleRemoveSponsorLogo(index)}
                                        title="Remove logo"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {sponsors.length > 1 ? (
                                  <>
                                    <Switch
                                      checked={Boolean(sponsor.isPrimary)}
                                      onCheckedChange={() => setPrimarySponsor(index)}
                                    />
                                    <div>
                                      <p className="text-sm text-white">Mark as primary sponsor</p>
                                      <p className="text-xs text-white/60">Required when multiple sponsors exist.</p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-xs text-gray-400 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-gray-700">
                                    Single sponsor is primary by default.
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {isSponsored && sponsors.length === 0 && (
                    <div className="border border-dashed border-gray-700 rounded-xl p-4 text-sm text-gray-400 text-center">
                      No sponsors added yet. Click “Add Sponsor” to include partners.
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Date & Time */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium text-[#d4d4d4]">Starting Date *</Label>
                      <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-white">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              {startDate ? formatDateValue(startDate) : "Pick a start date"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0 border-gray-700 bg-[#0a0a0a]">
                          <Calendar
                            mode="single"
                            selected={parseSafeDateOnly(startDate) || undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const iso = format(date, "yyyy-MM-dd");
                              setStartDate(iso);
                              if (endDate && iso > endDate) {
                                setEndDate(iso);
                              }
                              setStartCalendarOpen(false);
                            }}
                            disabled={{ before: today }}
                            defaultMonth={parseSafeDateOnly(startDate) || today}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium text-[#d4d4d4]">Starting Time *</Label>
                      <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-white">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatTimeDisplay(startTime)}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-auto p-0 border-gray-700 bg-[#0a0a0a]"
                        >
                          <TimePicker
                            value={startTime}
                            onChange={(val) => {
                              setStartTime(val);
                            }}
                            onClose={() => setStartTimeOpen(false)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium text-[#d4d4d4]">Ending Date *</Label>
                      <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-white">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              {endDate ? formatDateValue(endDate) : "Pick an end date"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0 border-gray-700 bg-[#0a0a0a]">
                          <Calendar
                            mode="single"
                            selected={parseSafeDateOnly(endDate) || undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const iso = format(date, "yyyy-MM-dd");
                              setEndDate(iso);
                              setEndCalendarOpen(false);
                            }}
                            disabled={{
                              before: parseSafeDateOnly(startDate) || today,
                            }}
                            defaultMonth={parseSafeDateOnly(endDate) || parseSafeDateOnly(startDate) || today}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium text-[#d4d4d4]">Ending Time *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-white">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {formatTimeDisplay(endTime)}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-auto p-0 border-gray-700 bg-[#0a0a0a]"
                        >
                          <TimePicker
                            value={endTime}
                            onChange={(val) => {
                              setEndTime(val);
                            }}
                            onClose={() => setEndTimeOpen(false)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Tickets */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-sm text-gray-400">
                    Select ticket types to add for your event
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-[#333333] bg-[#0f0f0f] text-xs md:text-sm text-gray-400">
                    Need a custom ticket? Pick <span className="font-medium text-white">Add Standard Ticket</span>, name it (e.g., <span className="font-medium text-white">Silver</span>) and set any price. You can add multiple categories.
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* VIP Guest List Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-[#ef4444]/60`}
                      onClick={() => openTicketModal("vip-guest")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0a0a0a] border border-gray-700">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Add VIP Guest List</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Free entry for VIP guests with no pricing
                        </p>
                      </CardContent>
                    </Card>

                    {/* Standard Ticket Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-[#ef4444]/60`}
                      onClick={() => openTicketModal("standard")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0a0a0a] border border-gray-700">
                            <Ticket className="w-5 h-5 text-gray-400" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Add Standard Ticket</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Regular paid tickets with GST options
                        </p>
                      </CardContent>
                    </Card>

                    {/* Table Ticket Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-[#ef4444]/60`}
                      onClick={() => openTicketModal("table")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0a0a0a] border border-gray-700">
                            <Table2 className="w-5 h-5 text-gray-400" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Add Table Ticket</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Reserved table booking for groups
                        </p>
                      </CardContent>
                    </Card>

                    {/* Group Pass Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-[#ef4444]/60`}
                      onClick={() => openTicketModal("group-pass")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#0a0a0a] border border-gray-700">
                            <UsersRound className="w-5 h-5 text-gray-400" />
                          </div>
                          <h3 className="text-base font-semibold text-white">Add Group Pass</h3>
                        </div>
                        <p className="text-sm text-gray-400">
                          Discounted pass for group bookings
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Display saved tickets */}
                  {savedTickets.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="font-semibold">Added Tickets ({savedTickets.length})</h5>
                      <div className="grid gap-3">
                        {savedTickets.map((ticket, index) => (
                          <Card key={index} className={`${cardBase}`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h6 className="font-semibold text-white">{ticket.ticketName}</h6>
                                  <p className="text-sm text-gray-400">
                                    {ticket.ticketCategory} • {ticket.ticketEntryType}
                                  </p>
                                  {ticket.ticketAddress && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      {ticket.ticketAddress}
                                    </p>
                                  )}
                                  {ticket.price !== "0" && (
                                    <p className="text-sm font-semibold mt-1 text-[#D60024]">₹{ticket.price}</p>
                                  )}
                                </div>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTicket(ticket, index);
                                  }}
                                  disabled={showLoading}
                                  className="text-gray-400 hover:text-white"
                                >
                                  {showLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Venue & Location */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-white/60">Venue</p>
                        <h3 className="text-base font-semibold text-white">Location Details</h3>
                      </div>
                      <div className="flex gap-2 text-[11px]">
                        <span className="px-3 py-1 rounded-full bg-[#0a0a0a] text-gray-400 border border-gray-700">Manual entry</span>
                        <span className="px-3 py-1 rounded-full bg-[#0a0a0a] text-gray-400 border border-gray-700">Required fields *</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="venueName">Venue Name *</Label>
                        <Input
                          id="venueName"
                          placeholder="e.g., Red Fort Delhi"
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          placeholder="Enter city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          placeholder="Enter state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Input
                          id="country"
                          placeholder="Enter country"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Postal / PIN Code *</Label>
                        <Input
                          id="postalCode"
                          placeholder="e.g., 110025"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venueContact">Contact Number *</Label>
                        <Input
                          id="venueContact"
                          type="tel"
                          placeholder="Enter contact number"
                          value={venueContact}
                          onChange={(e) => setVenueContact(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="venueEmail">Email *</Label>
                        <Input
                          id="venueEmail"
                          type="email"
                          placeholder="Enter email"
                          value={venueEmail}
                          onChange={(e) => setVenueEmail(e.target.value)}
                          className={fieldClass}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Full Address (optional)</Label>
                        <Textarea 
                          id="address" 
                          placeholder="Building / street / landmark"
                          value={fullAddress}
                          onChange={(e) => setFullAddress(e.target.value)}
                          rows={3}
                          className={`${fieldClass} min-h-[120px] py-3`}
                        />
                        <p className="text-xs text-white/60">Provide extra directions if needed. This won’t block submission.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Add Artist */}
              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label>Artists</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 rounded-lg border-[#2a2a2a] bg-[#0f0f0f] px-4 text-white hover:border-[#ef4444]/60 hover:bg-[#151515]"
                      onClick={() => setArtists([...artists, { name: "", photo: "", image: "", instagram: "", spotify: "", gender: "PREFER_NOT_TO_SAY" }])}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Artist
                    </Button>
                  </div>

                  {artists.map((artist, index) => (
                    <Card key={index} className={`${cardBase} p-5`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Artist {index + 1}</p>
                          <h5 className="font-semibold leading-tight">Add details</h5>
                        </div>
                        {artists.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setArtists(artists.filter((_, i) => i !== index))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2.5">
                          <Label htmlFor={`artist-name-${index}`} className="text-[13px] font-medium text-[#d4d4d4]">Artist Name *</Label>
                          <Input
                            id={`artist-name-${index}`}
                            placeholder="e.g., John Doe"
                            value={artist.name}
                            className={fieldClass}
                            onChange={(e) => {
                              const newArtists = [...artists];
                              newArtists[index].name = e.target.value;
                              setArtists(newArtists);
                            }}
                          />
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor={`artist-gender-${index}`} className="text-[13px] font-medium text-[#d4d4d4]">Gender</Label>
                          <Select 
                            value={artist.gender || "PREFER_NOT_TO_SAY"} 
                            onValueChange={(value) => {
                              const newArtists = [...artists];
                              newArtists[index].gender = value;
                              setArtists(newArtists);
                            }}
                          >
                            <SelectTrigger className={fieldClass}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className={selectMenuClass}>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2.5">
                          <Label htmlFor={`artist-photo-${index}`} className="text-[13px] font-medium text-[#d4d4d4]">Artist Photo *</Label>
                          <div className="space-y-3">
                            <div className="relative rounded-xl border border-dashed border-[#333333] bg-[#0e0e0e] px-4 py-5 text-center transition-all duration-200 hover:border-[#ef4444]/60">
                            <input
                              id={`artist-photo-${index}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleArtistPhotoChange(index, e)}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                              <div className="pointer-events-none flex flex-col items-center gap-2">
                                <Upload className="h-4 w-4 text-gray-400" />
                                <p className="text-sm text-gray-300">Upload artist photo</p>
                                <p className="text-xs text-gray-500">JPG/PNG/WebP</p>
                              </div>
                            </div>
                            {artist.photo && (
                              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#262626]">
                                <img 
                                  src={artist.photo} 
                                  alt={`${artist.name} preview`} 
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-7 w-7"
                                  onClick={() => handleRemoveArtistPhoto(index)}
                                  title="Remove photo"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">JPG/PNG/WebP</p>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <Label htmlFor={`artist-instagram-${index}`} className="text-[13px] font-medium text-[#d4d4d4]">Instagram *</Label>
                          <Input
                            id={`artist-instagram-${index}`}
                            placeholder="@artist_handle"
                            value={artist.instagram}
                            className={fieldClass}
                            onChange={(e) => {
                              const newArtists = [...artists];
                              newArtists[index].instagram = e.target.value;
                              setArtists(newArtists);
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Use full handle or profile URL</p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor={`artist-spotify-${index}`} className="text-[13px] font-medium text-[#d4d4d4]">Spotify (Optional)</Label>
                        <Input
                          id={`artist-spotify-${index}`}
                          placeholder="https://open.spotify.com/artist/..."
                          value={artist.spotify}
                          className={fieldClass}
                          onChange={(e) => {
                            const newArtists = [...artists];
                            newArtists[index].spotify = e.target.value;
                            setArtists(newArtists);
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 7: Additional Information */}
              {currentStep === 7 && (() => {
                const advisoryOptions = [
                  { id: 'smokingAllowed', label: '🚬 Smoking allowed' },
                  { id: 'drinkingAllowed', label: '🍺 Drinking allowed' },
                  { id: 'petsAllowed', label: '🐾 Pets allowed' },
                  { id: 'ageRestricted', label: '🔞 Show is 18+' },
                  { id: 'camerasAllowed', label: '📸 Cameras and photos allowed' },
                  { id: 'outsideFoodAllowed', label: '🍔 Outside food & drinks allowed' },
                  { id: 'seatingProvided', label: '🪑 Seating provided' },
                  { id: 'wheelchairAccessible', label: '♿ Wheelchair accessible venue' },
                  { id: 'liveMusic', label: '🎵 Live music' },
                  { id: 'parkingAvailable', label: '🚗 Parking available' },
                  { id: 'reentryAllowed', label: '🔁 Re-entry allowed' },
                  { id: 'onsitePayments', label: '💳 On-site payments available' },
                  { id: 'securityCheck', label: '👮 Security check at entry' },
                  { id: 'cloakroom', label: '🧥 Cloakroom available' },
                ];
                const emojiPalette = [
                  "✨","✅","⚠️","🚫","🎟️","🎉","🎵","🍽️","🍺","🍷","🥤","🍾","🚭","📸","🧒","🔞",
                  "🧳","🎒","🕒","⏰","🚗","🅿️","♿","🎭","🎬","🎧","🎤","🎸","🪩","🎆","🎇","🏟️","🧥","🔒","🛡️"
                ];

                const selectedBuiltIns = advisoryOptions.filter((item) => advisory[item.id]);
                const hasSelections = selectedBuiltIns.length > 0 || customAdvisories.length > 0;

                return (
                  <div className="space-y-5">
                    <Card className={`${cardBase}`}>
                      <CardHeader className="pb-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50">Step 7</p>
                        <CardTitle className="text-xl text-white">Additional Info</CardTitle>
                        <p className="text-sm text-white/70">Set policies, advisories, and helpful notes for attendees.</p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="terms" className="text-white">Terms & Conditions</Label>
                              <p className="text-xs text-white/60">Describe entry rules, refunds, or other policies.</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-gray-700 bg-[#0a0a0a] p-3">
                            <ReactQuill
                              theme="snow"
                              value={termsAndConditions}
                              onChange={setTermsAndConditions}
                              placeholder="Enter any terms and conditions..."
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                borderRadius: "12px",
                                border: "1px solid rgba(255,255,255,0.14)",
                                color: "#e5e7eb",
                              }}
                              className="text-white"
                              modules={{
                                toolbar: [
                                  ['bold', 'italic', 'underline'],
                                  [{ list: 'ordered' }, { list: 'bullet' }],
                                  [{ color: [] }, { background: [] }],
                                  [{ size: ['small', false, 'large', 'huge'] }],
                                  ['clean'],
                                ],
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-white">Advisories</Label>
                              <p className="text-xs text-white/60">Pick multiple advisories and add your own.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-lg border-[#2a2a2a] bg-[#0f0f0f] text-white hover:border-[#ef4444]/60 hover:bg-[#151515]"
                                onClick={() => setAdvisoryDialogOpen(true)}
                              >
                                {hasSelections ? `${selectedBuiltIns.length + customAdvisories.length} selected` : "Open advisory picker"}
                              </Button>
                            </div>
                          </div>

                          <Dialog open={advisoryDialogOpen} onOpenChange={setAdvisoryDialogOpen}>
                            <DialogContent className="max-w-4xl border-gray-800 bg-gray-950 text-white max-h-[90vh] overflow-hidden p-0">
                            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                              <DialogHeader>
                                <DialogTitle className="text-2xl">Choose advisories</DialogTitle>
                                <DialogDescription className="text-white/70">
                                  Turn on as many as you need, or add a custom advisory.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {advisoryOptions.map((item) => {
                                    const active = advisory[item.id];
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                                          active
                                            ? "border-[#D60024] bg-[#D60024]/10 text-white"
                                            : "border-gray-700 bg-[#0a0a0a] text-gray-400 hover:border-[#D60024]/50 hover:bg-[#0a0a0a]"
                                        }`}
                                        onClick={() => setAdvisory({ ...advisory, [item.id]: !active })}
                                      >
                                        <Checkbox
                                          checked={active}
                                          onCheckedChange={(checked) => setAdvisory({ ...advisory, [item.id]: !!checked })}
                                        />
                                        <span className="text-sm font-medium">{item.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="border-t border-gray-700 pt-4 space-y-3">
                                  <p className="text-sm font-semibold text-white">Custom advisory</p>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 flex gap-2">
                                      <Input
                                        placeholder="e.g., No re-entry after 10 PM"
                                        value={newCustomAdvisory}
                                        onChange={(e) => setNewCustomAdvisory(e.target.value)}
                                        className={fieldClass}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 w-12 rounded-[10px] border-[#2a2a2a] bg-[#0f0f0f] text-white hover:border-[#ef4444]/60 hover:bg-[#151515]"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                      >
                                        <Smile className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="accent"
                                      className="bg-[#D60024] text-white hover:bg-[#ff1a3c]"
                                      onClick={() => {
                                        const trimmed = newCustomAdvisory.trim();
                                        if (!trimmed) return;
                                        setCustomAdvisories([...customAdvisories, trimmed]);
                                        setNewCustomAdvisory("");
                                        toast.success("Custom advisory added");
                                      }}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>

                                  {showEmojiPicker && (
                                    <div className="rounded-xl border border-gray-700 bg-[#0a0a0a] p-3 space-y-2 max-h-60 overflow-y-auto">
                                      <p className="text-xs uppercase tracking-wider text-gray-500">Emoji</p>
                                      <div className="grid grid-cols-8 gap-2 text-lg">
                                        {emojiPalette.map((emoji, idx) => (
                                          <button
                                            key={`emoji-${idx}`}
                                            type="button"
                                            className="h-9 w-9 rounded-lg border border-gray-700 bg-[#0a0a0a] hover:border-[#D60024]/50 hover:bg-[#0a0a0a] transition"
                                            onClick={() => setNewCustomAdvisory((prev) => `${prev}${emoji}`)}
                                          >
                                            {emoji}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {customAdvisories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {customAdvisories.map((item, idx) => (
                                        <button
                                          key={`custom-dialog-${idx}`}
                                          type="button"
                                          className="group flex items-center gap-2 rounded-full border border-gray-700 bg-[#0a0a0a] px-3 py-1 text-sm text-gray-400 hover:border-[#D60024]/50 hover:bg-[#0a0a0a]"
                                          onClick={() => setCustomAdvisories(customAdvisories.filter((_, i) => i !== idx))}
                                        >
                                          ✨ {item}
                                          <X className="w-3 h-3 text-white/70 group-hover:text-white" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-sm text-white/70">
                                  {hasSelections
                                    ? `${selectedBuiltIns.length + customAdvisories.length} selected`
                                    : "No advisories selected yet"}
                                </p>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-white/80 hover:text-white"
                                    onClick={() => setAdvisoryDialogOpen(false)}
                                  >
                                    Close
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="accent"
                                    className="bg-[#D60024] text-white hover:bg-[#ff1a3c]"
                                    onClick={() => setAdvisoryDialogOpen(false)}
                                  >
                                    Done
                                  </Button>
                                </div>
                              </DialogFooter>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {hasSelections ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedBuiltIns.map((item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  className="group flex items-center gap-2 rounded-full border border-gray-700 bg-[#0a0a0a] px-3 py-1 text-sm text-gray-400 hover:border-[#D60024]/50 hover:bg-[#0a0a0a]"
                                  onClick={() => setAdvisory({ ...advisory, [item.id]: false })}
                                >
                                  {item.label}
                                  <X className="w-3 h-3 text-white/70 group-hover:text-white" />
                                </button>
                              ))}
                              {customAdvisories.map((item, idx) => (
                                <button
                                  key={`custom-${idx}`}
                                  type="button"
                                  className="group flex items-center gap-2 rounded-full border border-gray-700 bg-[#0a0a0a] px-3 py-1 text-sm text-gray-400 hover:border-[#D60024]/50 hover:bg-[#0a0a0a]"
                                  onClick={() => setCustomAdvisories(customAdvisories.filter((_, i) => i !== idx))}
                                >
                                  ✨ {item}
                                  <X className="w-3 h-3 text-white/70 group-hover:text-white" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500 border border-dashed border-gray-700 rounded-lg px-3 py-2 bg-[#0a0a0a]/80">
                              No advisories selected yet. Use "Open advisory picker" to add them.
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-white">Custom Questions for Attendees</Label>
                              <p className="text-xs text-white/60">Collect details like dietary needs or preferences.</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 rounded-lg border-[#2a2a2a] text-white bg-[#0f0f0f] hover:bg-[#151515] hover:border-[#ef4444]/60"
                              onClick={() => {
                                if (newQuestion.trim()) {
                                  setCustomQuestions([...customQuestions, { question: newQuestion, answer: newAnswer }]);
                                  setNewQuestion('');
                                  setNewAnswer('');
                                  toast.success('Question added');
                                } else {
                                  toast.error('Please enter a question');
                                }
                              }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Question
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Input
                              placeholder="Question (e.g., Dietary requirements?)"
                              value={newQuestion}
                              onChange={(e) => setNewQuestion(e.target.value)}
                              className={fieldClass}
                            />
                            <Textarea
                              placeholder="Answer (optional - organizer can provide default answer)"
                              value={newAnswer}
                              onChange={(e) => setNewAnswer(e.target.value)}
                              rows={2}
                              className={`${fieldClass} min-h-[120px] py-3`}
                            />
                          </div>

                          {customQuestions.length > 0 ? (
                            <div className="space-y-3">
                              {customQuestions.map((q, index) => (
                                <Card key={index} className="border border-gray-800 bg-[#0a0a0a]/80">
                                  <CardContent className="pt-4">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex-1 space-y-1">
                                        <p className="font-medium text-sm text-white">Q: {q.question}</p>
                                        {q.answer && <p className="text-sm text-gray-400">A: {q.answer}</p>}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-gray-400 hover:text-white"
                                        onClick={() => {
                                          setCustomQuestions(customQuestions.filter((_, i) => i !== index));
                                          toast.success('Question removed');
                                        }}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No questions added yet.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-white">Organizer Notes (Private)</Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any internal notes..."
                            rows={3}
                            value={organizerNote}
                            onChange={(e) => setOrganizerNote(e.target.value)}
                            className={`${fieldClass} min-h-[120px] py-3`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Step 8: Template */}
              {currentStep === 8 && (
                <div className="space-y-5 bg-[#0a0a0a]/80 p-4 rounded-xl border border-gray-800">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.14em] text-white/60">Event Page Template</p>
                    <h3 className="text-2xl font-semibold text-white">Choose attendee event detail experience</h3>
                    <p className="max-w-2xl text-sm text-gray-400">
                      The current event detail UI is the default template. Pick another template only when you want a different attendee experience for this event.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {detailTemplateOptions.map((template) => {
                      const isSelected = selectedTemplate === template.id;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`group overflow-hidden rounded-2xl border text-left transition ${
                            isSelected
                              ? "border-[#D60024] bg-[#D60024]/10 shadow-[0_0_0_1px_rgba(214,0,36,0.35)]"
                              : "border-gray-800 bg-[#0c0c0c] hover:border-gray-600"
                          }`}
                          disabled={isSectionBusy}
                        >
                          <div className="aspect-[4/3] border-b border-white/10 bg-[#111] p-4">
                            <div className={`h-full rounded-xl border ${isSelected ? "border-[#D60024]/60" : "border-gray-700"} bg-[#050505] p-3`}>
                              <div className="mb-3 h-16 rounded-lg bg-gradient-to-br from-gray-700 via-gray-900 to-black" />
                              <div className="space-y-2">
                                <div className={`h-2.5 rounded-full ${isSelected ? "bg-[#D60024]" : "bg-gray-600"}`} />
                                <div className="h-2 rounded-full bg-gray-700 w-4/5" />
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                  <div className="h-10 rounded-md bg-gray-800" />
                                  <div className="h-10 rounded-md bg-gray-800" />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-base font-semibold text-white">{template.displayName}</h4>
                                  {template.isDefault && (
                                    <Badge className="bg-gray-800 text-gray-200 border-gray-700">Default</Badge>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{template.shortName}</p>
                              </div>
                              <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                isSelected ? "border-[#D60024] bg-[#D60024] text-white" : "border-gray-700 text-transparent"
                              }`}>
                                <Check className="h-4 w-4" />
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-gray-400">{template.description}</p>
                            <p className="text-xs text-gray-500">{template.tone}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 9: Review & Publish */}
              {currentStep === 9 && (() => {
                const statusBadge = (filled) => (
                  <Badge className={filled ? 'bg-[#D60024]/20 text-white border-[#D60024]/40' : 'bg-[#0a0a0a] text-gray-400 border-gray-700'}>
                    {filled ? 'Filled' : 'Missing'}
                  </Badge>
                );

                const advisoryEntries =
                  customAdvisories.length > 0
                    ? customAdvisories
                    : Object.entries(advisory || {})
                        .filter(([, val]) => val)
                        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

                const questionsEntries = customQuestions.map((q, i) => ({
                  title: q.question,
                  answer: q.answer,
                  index: i + 1,
                }));

                const additionalInfoCards = [
                  {
                    title: 'Terms & Conditions',
                    filled: Boolean(termsAndConditions?.trim()),
                    content: termsAndConditions?.trim() || 'Not provided',
                    isHtml: true,
                  },
                  {
                    title: 'Advisories',
                    filled: Object.values(advisory || {}).some(Boolean) || customAdvisories.length > 0,
                    content: advisoryEntries,
                    type: 'advisory-list',
                    isHtml: false,
                  },
                  {
                    title: 'Custom Questions for Attendees',
                    filled: customQuestions.length > 0,
                    content: questionsEntries,
                    type: 'questions-list',
                    isHtml: false,
                  },
                  {
                    title: 'Organizer Notes (Private)',
                    filled: Boolean(organizerNote?.trim()),
                    content: organizerNote?.trim() || 'Not provided',
                    isHtml: false,
                  },
                ];

                const summaryItems = [
                  { label: 'Event Title', value: eventTitle },
                  { label: 'Category', value: mainCategory },
                  { label: 'Subcategory', value: selectedCategories[0] },
                  { label: 'Cover Image', value: coverImage ? 'Uploaded' : '' },
                  { label: 'Start', value: startDate ? `${formatDateValue(startDate)} ${formatTimeDisplay(startTime)}` : '' },
                  { label: 'End', value: endDate ? `${formatDateValue(endDate)} ${formatTimeDisplay(endTime)}` : '' },
                  { label: 'Venue', value: venueName },
                  { label: 'City', value: city },
                  { label: 'State', value: state },
                  { label: 'Tickets', value: savedTickets.length ? `${savedTickets.length} added` : '' },
                  { label: 'Sponsors', value: normalizeSponsors(sponsors).length ? `${normalizeSponsors(sponsors).length} added` : '' },
                  { label: 'Artists', value: artists.filter((a) => a.name.trim()).length ? `${artists.filter((a) => a.name.trim()).length} added` : '' },
                  { label: 'Location', value: fullAddress || [city, state].filter(Boolean).join(', ') || 'Location pending' },
                  { label: 'Template', value: selectedTemplateOption?.displayName || 'Classic' },
                ];

                return (
                  <div className="space-y-4 bg-[#0a0a0a]/80 p-4 rounded-xl border border-gray-800">
                    {/* <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
                        <h3 className="text-lg font-semibold">Review before publishing</h3>
                      </div>
                      <p className="text-sm text-white/70">Check what’s filled and what’s missing. You can go back to edit anything.</p>
                    </div> */}

                    <div className="flex flex-wrap items-center gap-3 border border-gray-800 bg-[#0a0a0a]/80 rounded-xl p-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.12em] text-white/60">Publish State</p>
                        <p className="text-sm text-white/80">Choose whether to keep this as Draft or Publish it now.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {["DRAFT", "PUBLISHED"].map((state) => {
                          const isActive = publishState === state;
                          return (
                            <Button
                              key={state}
                              type="button"
                              variant={isActive ? "accent" : "outline"}
                              className={`px-4 ${isActive ? "bg-gray-700 text-white" : "border-gray-600 text-white hover:bg-gray-800"}`}
                              onClick={() => setPublishState(state)}
                              disabled={isSectionBusy}
                            >
                              {state === "DRAFT" ? "Save as Draft" : "Publish"}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {summaryItems.map((item, idx) => (
                        <Card key={idx} className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="text-xs text-white/60">{item.label}</p>
                              <p className={`text-sm font-semibold ${item.value ? 'text-white' : 'text-white/50'}`}>
                                {item.value || 'Not provided'}
                              </p>
                            </div>
                            {statusBadge(Boolean(item.value))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                        <CardHeader>
                          <CardTitle className="text-base">Tickets</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {savedTickets.length ? (
                            savedTickets.map((t, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{t.ticketName}</span>
                                <span className="text-white/80">{t.price === '0' ? 'Free' : `₹${t.price}`}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-white/60">No tickets added</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                        <CardHeader>
                          <CardTitle className="text-base">Sponsors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {normalizeSponsors(sponsors).length ? (
                            normalizeSponsors(sponsors).map((s, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <div className="space-y-0.5">
                                  <p className="font-semibold">{s.name || s.company}</p>
                                  <p className="text-xs text-white/60">{s.tier || 'Sponsor'}</p>
                                </div>
                                {s.logo && <img src={s.logo} alt="" className="w-10 h-10 object-contain rounded border border-gray-700 bg-[#0a0a0a]" />}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-white/60">No sponsors added</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                        <CardHeader>
                          <CardTitle className="text-base">Venue</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-white/80">
                          <p>{venueName || 'Not provided'}</p>
                          <p className="text-white/60">{fullAddress || [city, state, postalCode].filter(Boolean).join(', ') || 'Location pending'}</p>
                        </CardContent>
                      </Card>

                      <Card className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                        <CardHeader>
                          <CardTitle className="text-base">Artists</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {artists.filter((a) => a.name.trim()).length ? (
                            artists
                              .filter((a) => a.name.trim())
                              .map((a, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <span className="font-semibold">{a.name}</span>
                                  {a.instagram && <span className="text-xs text-white/60">{a.instagram}</span>}
                                </div>
                              ))
                          ) : (
                            <p className="text-sm text-white/60">No artists added</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                      <CardHeader>
                        <CardTitle className="text-base">Gallery</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {galleryImages.length ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {galleryImages.slice(0, 4).map((img, i) => (
                              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-700">
                                <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white/60">No gallery images uploaded</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={`border ${cardBase}`} style={{ borderColor: pageTheme.border }}>
                      <CardHeader>
                        <CardTitle className="text-base">Additional Info</CardTitle>
                        <p className="text-xs text-white/60">What attendees see and internal notes</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {additionalInfoCards.map((info, i) => (
                          <div key={i} className="flex gap-3 border border-gray-800 rounded-lg p-3 bg-[#0a0a0a]/80 hover:border-gray-700 transition">
                            <div className="flex-1 space-y-1">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">{info.title}</p>
                              {info.filled ? (
                                info.type === 'advisory-list' ? (
                                  <div className="flex flex-wrap gap-2">
                                    {info.content.map((chip, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 rounded-full border border-[#D60024]/30 bg-[#D60024]/10 px-3 py-1 text-sm text-white"
                                      >
                                        {chip}
                                      </span>
                                    ))}
                                  </div>
                                ) : info.type === 'questions-list' ? (
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-white">
                                    {info.content.map((q) => (
                                      <li key={q.index} className="pl-1">
                                        <span className="font-semibold">{q.title}</span>
                                        {q.answer ? <span className="text-white/70"> — {q.answer}</span> : null}
                                      </li>
                                    ))}
                                  </ol>
                                ) : info.isHtml ? (
                                  <div
                                    className="text-sm text-white prose prose-invert prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: info.content }}
                                  />
                                ) : (
                                  <p className="text-sm whitespace-pre-line text-white">{info.content}</p>
                                )
                              ) : (
                                <p className="text-sm text-white/50 italic">Not provided</p>
                              )}
                            </div>
                            <div className="self-start">{statusBadge(info.filled)}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </CardContent>

            <div className="sticky bottom-4 z-20 mt-8 border-t border-[#1f1f1f] bg-[#0c0c0c]/95 backdrop-blur px-8 py-5">
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSectionBusy}
                  className="h-11 rounded-[10px] border-[#2a2a2a] bg-transparent px-5 text-white hover:bg-[#151515]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-3">
                  {isEditMode && currentStep < steps.length && (
                    <Button
                      variant="outline"
                      onClick={saveCurrentSection}
                      disabled={isSectionBusy}
                      className="h-11 rounded-[10px] border-[#2a2a2a] bg-transparent px-5 text-white hover:bg-[#151515]"
                    >
                      {isSectionBusy ? "Saving..." : "Save Section"}
                    </Button>
                  )}

                  {currentStep < steps.length ? (
                    <Button
                      onClick={() => nextStep()}
                      disabled={isSectionBusy}
                      className="h-11 rounded-[10px] bg-[#ef4444] px-5 font-medium text-white hover:bg-[#dc2626]"
                    >
                      {isSectionBusy ? "Saving..." : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      variant="accent"
                      onClick={() => handleSubmit(publishState)}
                      disabled={isSectionBusy}
                      className="h-11 rounded-[10px] bg-[#ef4444] px-5 font-medium text-white hover:bg-[#dc2626]"
                    >
                      {isSectionBusy
                        ? "Updating..."
                        : publishState === "PUBLISHED"
                          ? (isEditMode ? "Update & Publish" : "Publish Event")
                          : (isEditMode ? "Update as Draft" : "Save as Draft")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {/* Ticket Type Modal */}
      {selectedTicketType && (
        <TicketTypeModal
          open={ticketModalOpen}
          onClose={() => {
            setTicketModalOpen(false);
            setSelectedTicketType(null);
          }}
          ticketType={selectedTicketType}
          onSave={handleSaveTicket}
        />
      )}
    </div>
  );
};

export default CreateEvent;
