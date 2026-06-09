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
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  Calendar as CalendarIcon,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  MapPin,
  NotebookText,
  Music2,
  Pencil,
  Plus,
  RotateCcw,
  Smile,
  Sparkles,
  Ticket,
  Trash2,
  Users,
  Table2,
  UsersRound,
  Upload,
  X,
  ChevronLeft,
} from "lucide-react";
import Header from "@/components/Header";
import LoadingOverlay from "@/components/LoadingOverlay";
import { toast } from "sonner";
import { useEvents } from "@/hooks/useEvents";
import eventMusic from "@/assets/event-music.jpg";
import TicketTypeModal from "@/components/TicketTypeModal";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updateEventStep1, updateEventStep2, uploadFlyerImage, deleteFlyerImage, uploadGalleryImages, deleteGalleryImage, generateEventId, createTicket, updateTicket, deleteTicket, createVenue, updateVenue, updateEventStep6, uploadArtistImage, uploadSponsorLogo, deleteArtist, createEventStep1, persistFlyerUrl, uploadDraftImage, persistGalleryUrls, deleteDraftStorageObject } from "@/services/eventService";
import { apiFetch } from "@/config/api";
import { TEMPLATE_CONFIGS, DETAIL_TEMPLATE_CONFIGS, getTemplateConfig, mapTemplateId, mapTemplateNameToId } from "@/config/templates";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import {
  PHONE_INPUT_PROPS,
  normalizeTenDigitPhoneNumber,
  sanitizeTenDigitPhoneInput,
} from "@/utils/phone";
import { EVENT_CATEGORY_HIERARCHY, EVENT_CATEGORY_OPTIONS } from "@/config/eventCategories";

const DEFAULT_ARTIST_GENDER = "MALE";
const ARTIST_GENDER_VALUES = ["MALE", "FEMALE", "OTHER"];

const normalizeArtistGender = (gender) => {
  const normalized = (gender || "").toUpperCase();
  return ARTIST_GENDER_VALUES.includes(normalized) ? normalized : DEFAULT_ARTIST_GENDER;
};

const createEmptyArtist = () => ({
  clientId: `artist-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: "",
  photo: "",
  image: "",
  instagram: "",
  spotify: "",
  gender: DEFAULT_ARTIST_GENDER,
});

const normalizeArtistIdentityPart = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

const getArtistIdentity = (artist) => {
  const stableId = artist?.id || artist?._id || artist?.artistId;
  if (stableId) return `id:${stableId}`;

  const name = normalizeArtistIdentityPart(artist?.name);
  const instagram = normalizeArtistIdentityPart(
    artist?.instagram || artist?.instagramLink || artist?.instagramUrl || artist?.instagramHandle
  );
  const spotify = normalizeArtistIdentityPart(
    artist?.spotify || artist?.spotifyLink || artist?.spotifyUrl
  );
  const image = normalizeArtistIdentityPart(
    artist?.photo || artist?.image || artist?.imageUrl || artist?.avatar || artist?.profileImage
  );

  return `profile:${name}|${instagram}|${spotify}|${image}`;
};

const getArtistRenderKey = (artist) => {
  const stableId = artist?.id || artist?._id || artist?.artistId;
  if (stableId) return `id:${stableId}`;
  if (artist?.clientId) return `client:${artist.clientId}`;
  return getArtistIdentity(artist);
};

const extractArtistList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.artists,
    payload.data?.artists,
    payload.event?.artists,
    payload.data?.event?.artists,
    payload.event?.data?.artists,
    payload.data?.data?.artists,
    payload.data?.data?.event?.artists,
  ];

  return candidates.find(Array.isArray) || [];
};

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
  const { events } = useEvents();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState("one-time");
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [coverStorageKey, setCoverStorageKey] = useState(null);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]); // Existing images from backend (URLs)
  const [galleryImages, setGalleryImages] = useState([]); // All images (existing URLs + new previews)
  const [galleryImageFiles, setGalleryImageFiles] = useState([]); // Only NEW files to upload
  const [galleryImageIds, setGalleryImageIds] = useState([]); // Map of URL -> ID for deletion
  const [galleryImageStorageKeys, setGalleryImageStorageKeys] = useState({}); // Map URL -> storage key
  const [deletedImageIds, setDeletedImageIds] = useState(new Set()); // Track deleted image IDs to filter them out
  const [imagesChanged, setImagesChanged] = useState(false);
  const [textFieldsChanged, setTextFieldsChanged] = useState(false); // Track if text fields changed
  const [removeFlyerImage, setRemoveFlyerImage] = useState(false); // Track if flyer should be removed
  const [removeGalleryIds, setRemoveGalleryIds] = useState([]); // Track gallery image IDs to remove
  const [uploadingCover, setUploadingCover] = useState(false); // Loader for cover image upload
  const [uploadingGallery, setUploadingGallery] = useState(false); // Loader for gallery upload
  const [draftCoverStorageKey, setDraftCoverStorageKey] = useState(null); // Store draft cover key for later persistence
  const [draftGalleryUploads, setDraftGalleryUploads] = useState([]); // Store draft gallery uploads { url, publicId }
  const [loadingMessage, setLoadingMessage] = useState(""); // Message for loading overlay
  const [showLoading, setShowLoading] = useState(false); // Control loading overlay visibility
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [editingTicketIndex, setEditingTicketIndex] = useState(null);
  const [savedTickets, setSavedTickets] = useState([]);
  const [createdTicketIds, setCreatedTicketIds] = useState([]); // Track created tickets
  const [eventId, setEventId] = useState(null);
  const [backendEventId, setBackendEventId] = useState(null); // Store backend's event ID
  const [venueId, setVenueId] = useState(null); // Store venue ID if it exists
  const [venueCreated, setVenueCreated] = useState(false); // Track if venue was created
  const [originalVenueData, setOriginalVenueData] = useState(null); // Store original venue data for change detection
  const [, setCreatedArtistIndices] = useState([]); // Track saved artist identities for edit hydration
  const [currentEventType, setCurrentEventType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("Classic"); // Default template (using name)
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
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [activeSponsorIndex, setActiveSponsorIndex] = useState(null);
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
  const buildEventDateTime = (dateValue, timeValue) => {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue || "");
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeValue || "");
    if (!dateMatch || !timeMatch) return null;

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    if (hour > 23 || minute > 59) return null;

    const date = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute
    ) {
      return null;
    }

    return date;
  };
  const validateEventDateTime = () => {
    const start = buildEventDateTime(startDate, startTime);
    const end = buildEventDateTime(endDate, endTime);

    if (!start || !end) {
      return { error: "Please select a valid start and end date/time" };
    }

    if (start.getTime() < Date.now()) {
      return { error: "Starting date and time must be in the future" };
    }

    if (end.getTime() <= start.getTime()) {
      return { error: "Ending date and time must be after starting date and time" };
    }

    return {
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    };
  };
  const isEndDateTimeNotAfterStart = ({
    nextStartDate = startDate,
    nextStartTime = startTime,
    nextEndDate = endDate,
    nextEndTime = endTime,
  } = {}) => {
    const start = buildEventDateTime(nextStartDate, nextStartTime);
    const end = buildEventDateTime(nextEndDate, nextEndTime);

    return Boolean(start && end && end.getTime() <= start.getTime());
  };
  const clearEndTimeIfInvalid = (nextValues = {}) => {
    if (!isEndDateTimeNotAfterStart(nextValues)) return false;

    setEndTime("");
    return true;
  };
  const notifyEndTimeCleared = () => {
    toast.info("Ending time cleared. It must be after starting time.");
  };
  const handleStartTimeChange = (value) => {
    setStartTime(value);
    if (clearEndTimeIfInvalid({ nextStartTime: value })) {
      notifyEndTimeCleared();
    }
  };
  const handleEndTimeChange = (value) => {
    setEndTime(value);
  };
  const resetDateTimeInputs = () => {
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setStartCalendarOpen(false);
    setEndCalendarOpen(false);
    setStartTimeOpen(false);
    setEndTimeOpen(false);
  };

  const formatDateValue = (value) => {
    if (!value) return "";
    const date = parseSafeDateOnly(value);
    return date ? format(date, "dd MMM yyyy") : value;
  };

  const parseTime = (value, defaultAmpm = "AM") => {
    if (!value) return { hour: "", minute: "00", ampm: defaultAmpm };
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

  const TimePicker = ({ value, onChange, onClose, defaultAmpm = "AM", isValueInvalid, onInvalid }) => {
    const parsedTime = parseTime(value, defaultAmpm);
    const [draftHour, setDraftHour] = useState(parsedTime.hour);
    const [draftMinute, setDraftMinute] = useState(parsedTime.minute);
    const [draftAmpm, setDraftAmpm] = useState(parsedTime.ampm);

    useEffect(() => {
      const nextTime = parseTime(value, defaultAmpm);
      setDraftHour(nextTime.hour);
      setDraftMinute(nextTime.minute);
      setDraftAmpm(nextTime.ampm);
    }, [value, defaultAmpm]);

    const setPart = (h = draftHour, m = draftMinute, ap = draftAmpm, close = false) => {
      setDraftHour(h);
      setDraftMinute(m);
      setDraftAmpm(ap);

      if (!h) return;

      const nextValue = buildTime(h, m, ap);
      const invalid = typeof isValueInvalid === "function" && isValueInvalid(nextValue);

      if (invalid) {
        if (close) onInvalid?.();
        return;
      }

      onChange(nextValue);
      if (close) onClose?.();
    };

    const itemBase =
      "w-full text-left px-3 py-2 rounded-lg border border-border/50 bg-background/60 text-muted-foreground hover:border-ring hover:text-foreground transition";
    const itemActive = "border-ring bg-accent/10 text-foreground";

    return (
      <div className="grid grid-cols-3 gap-2 p-2 bg-popover rounded-xl border border-border w-[280px] shadow-[var(--shadow-card)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Hour</p>
          <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
            {hourOptions.map((h) => (
              <button
                key={h}
                type="button"
                className={`${itemBase} ${h === draftHour ? itemActive : ""}`}
                onClick={() => setPart(h, draftMinute, draftAmpm, false)}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Minute</p>
          <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
            {minuteOptions.map((m) => (
              <button
                key={m}
                type="button"
                className={`${itemBase} ${m === draftMinute ? itemActive : ""}`}
                onClick={() => setPart(draftHour, m, draftAmpm, true)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">AM/PM</p>
          <div className="space-y-2">
            {["AM", "PM"].map((ap) => (
              <button
                key={ap}
                type="button"
                className={`${itemBase} ${ap === draftAmpm ? itemActive : ""}`}
                onClick={() => setPart(draftHour, draftMinute, ap, Boolean(draftHour))}
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
    setEditingTicketIndex(null);
    setShowEmojiPicker(false);
    setAdvisoryDialogOpen(false);
    setSponsorDialogOpen(false);
    setActiveSponsorIndex(null);
    setArtistDialogOpen(false);
    setActiveArtistIndex(null);
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
  const [artists, setArtistsState] = useState([createEmptyArtist()]);
  const artistsRef = useRef(artists);
  const setArtists = (updater) => {
    setArtistsState((previousArtists) => {
      const nextArtists = typeof updater === "function" ? updater(previousArtists) : updater;
      artistsRef.current = nextArtists;
      return nextArtists;
    });
  };
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
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [activeArtistIndex, setActiveArtistIndex] = useState(null);
  const [deletingArtistId, setDeletingArtistId] = useState(null);
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

  // Match the organizer dashboard surface tokens.
  const pageTheme = {
    background: "bg-background",
    card: "bg-card",
    border: "hsl(var(--border))",
    accent: "hsl(var(--accent))",
    text: "text-foreground",
    muted: "text-muted-foreground",
    glow: "var(--shadow-card)",
  };

  const fieldClass =
    "h-12 border border-input bg-background/60 rounded-[10px] px-[14px] text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-ring transition-[border,box-shadow,background] duration-200";
  const cardBase = "create-event-card border border-border bg-card rounded-xl shadow-[var(--shadow-card)] transition-all duration-200 hover:border-border/80";
  const selectMenuClass = "bg-popover text-popover-foreground border border-border rounded-[10px] shadow-[var(--shadow-card)]";

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
            setVenueContact(sanitizeTenDigitPhoneInput(venueData.contact || ''));
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
      logoStorageKey: s?.logoStorageKey || s?.storageKey || s?.key || s?.logoPublicId || nested.logoStorageKey || nested.storageKey || nested.key || nested.publicId || "",
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
        setGalleryImageStorageKeys({});
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
        setGalleryImageStorageKeys(publicIdMap);
      } else {
        setExistingGalleryUrls([]);
        setGalleryImages([]);
        setGalleryImageIds({});
        setGalleryImageStorageKeys({});
      }
    };

    const hydrateEvent = async (eventToEdit) => {
      if (!isMounted || !eventToEdit) return;

      const previousEventId =
        eventCacheRef.current?.id ||
        eventCacheRef.current?._id ||
        eventCacheRef.current?.eventId ||
        eventCacheRef.current?.publicId ||
        backendEventId;
      const incomingEventId =
        eventToEdit.id ||
        eventToEdit._id ||
        eventToEdit.eventId ||
        eventToEdit.publicId ||
        editId;
      const isSameEventHydration =
        previousEventId &&
        incomingEventId &&
        String(previousEventId) === String(incomingEventId);
      const previousCachedArtists = extractArtistList(eventCacheRef.current);

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

      if (eventToEdit.template) {
        const templateName = mapTemplateId(eventToEdit.template);
        setSelectedTemplate(templateName);
      }

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
        setVenueContact(sanitizeTenDigitPhoneInput(firstVenue.contact || eventToEdit.venueContact || ""));
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

      const normalizedArtists = normalizeArtists(extractArtistList(eventToEdit));
      const currentArtists = normalizeArtists(artistsRef.current);
      const cachedArtists = normalizeArtists(previousCachedArtists);
      const shouldPreserveCurrentArtists =
        normalizedArtists.length === 0 &&
        isSameEventHydration &&
        (currentArtists.length > 0 || cachedArtists.length > 0);
      const nextArtists = shouldPreserveCurrentArtists
        ? currentArtists.length
          ? currentArtists
          : cachedArtists
        : normalizedArtists;

      setArtists(
        nextArtists.length
          ? nextArtists
          : [createEmptyArtist()]
      );
      eventCacheRef.current = {
        ...eventCacheRef.current,
        artists: nextArtists,
      };
      if (nextArtists.length) {
        setCreatedArtistIndices(nextArtists.map(getArtistIdentity));
        artistsLoadedRef.current = true;
        if (!shouldPreserveCurrentArtists) {
          setOriginalArtists(nextArtists);
        }
      } else {
        setOriginalArtists([]);
        artistsLoadedRef.current = false;
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
        const currentArtists = normalizeArtists(artistsRef.current);
        if (currentArtists.length > 0) {
          if (eventCacheRef.current) {
            eventCacheRef.current = {
              ...eventCacheRef.current,
              artists: currentArtists,
            };
          }
          artistsLoadedRef.current = true;
          return;
        }

        // Try cache first
        const cached = eventCacheRef.current;
        const artistDataCached = extractArtistList(cached);
        if (artistDataCached.length) {
          const normalizedCached = normalizeArtists(artistDataCached);
          if (normalizedCached.length) {
            setArtists(normalizedCached);
            setCreatedArtistIndices(normalizedCached.map(getArtistIdentity));
            setOriginalArtists(normalizedCached);
            eventCacheRef.current = {
              ...cached,
              artists: normalizedCached,
            };
            artistsLoadedRef.current = true;
            return;
          }
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
        const artistData = extractArtistList(eventData);
        const normalized = normalizeArtists(artistData);
        const currentArtistsAfterFetch = normalizeArtists(artistsRef.current);
        const shouldPreserveCurrentArtists =
          normalized.length === 0 && currentArtistsAfterFetch.length > 0;
        const nextArtists = shouldPreserveCurrentArtists
          ? currentArtistsAfterFetch
          : normalized;

        setArtists(
          nextArtists.length
            ? nextArtists
            : [createEmptyArtist()]
        );
        eventCacheRef.current = {
          ...eventData,
          artists: nextArtists,
        };
        if (nextArtists.length) {
          setCreatedArtistIndices(nextArtists.map(getArtistIdentity));
          if (!shouldPreserveCurrentArtists) {
            setOriginalArtists(nextArtists);
          }
        } else {
          setOriginalArtists([]);
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
    { number: 8, title: "Review & Publish" },
  ];

  const progress = (currentStep / steps.length) * 100;
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
              if (coverImageFile || draftCoverStorageKey) {
                try {
                  // If we have a draft key, persist it; otherwise upload file
                  if (draftCoverStorageKey) {
                    await persistFlyerUrl(backendEventId, { url: coverImage, publicId: draftCoverStorageKey });
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
              subCategory: selectedCategories[0] || "",
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
            subCategory: selectedCategories[0] || "",
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
          
          if (backendId && (coverImageFile || draftCoverStorageKey)) {
            // Persist draft cover image if available; otherwise upload file
            try {
              setShowLoading(true);
              setLoadingMessage("Saving cover image...");
              if (draftCoverStorageKey) {
                await persistFlyerUrl(backendId, { url: coverImage, publicId: draftCoverStorageKey });
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
      const dateTimeValidation = validateEventDateTime();
      if (dateTimeValidation.error) {
        toast.error(dateTimeValidation.error);
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

      const { startDateTime, endDateTime } = dateTimeValidation;

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
      const venueContactDigits = normalizeTenDigitPhoneNumber(venueContact);
      if (!venueContactDigits) {
        toast.error("Contact number must be exactly 10 digits");
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
        contact: venueContactDigits,
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

      if (isEditMode && artistsLoadedRef.current && !hasArtistChanges) {
        toast.info("No changes to update");
        moveToNextStep();
        return;
      }

      // Call API for Step 6 - replace the event artist list with the current form state
      try {
        setIsSubmitting(true);
        setLoadingMessage("Saving artist details...");
        setShowLoading(true);
        
        // Check if we have backend event ID
        if (!backendEventId) {
          toast.error("Event ID not found. Please go back to Step 1.");
          setIsSubmitting(false);
          setShowLoading(false);
          return;
        }
        
        // Filter out empty artists
        const validArtists = normalizedCurrentArtists
          .filter(artist => artist.name.trim() !== "")
          .map(artist => ({
            ...artist,
            gender: normalizeArtistGender(artist.gender),
            image: artist.photo || artist.image || "",
            eventId: backendEventId,
          }));
        
        if (validArtists.length === 0 && !hasArtistChanges) {
          setIsSubmitting(false);
          setShowLoading(false);
          if (!advance) {
            toast.success("Artist section is already up to date.");
          }
          moveToNextStep();
          return;
        }
        
        const persistPayload = validArtists.map((artist) => ({
          ...(artist.id ? { id: artist.id } : {}),
          name: artist.name,
          gender: normalizeArtistGender(artist.gender),
          image: artist.image || artist.photo || null,
          instagramLink: artist.instagram || artist.instagramLink || null,
          spotifyLink: artist.spotify || artist.spotifyLink || null,
        }));

        const response = await updateEventStep6(backendEventId, { artists: persistPayload });
        const responseArtists = extractArtistList(response);
        const savedArtists = normalizeArtists(
          responseArtists.length > 0 || persistPayload.length === 0
            ? responseArtists
            : persistPayload
        );

        console.log("Step 6 API Response:", response);
        setOriginalArtists(savedArtists);
        setCreatedArtistIndices(savedArtists.map(getArtistIdentity));
        setArtists(savedArtists.length ? savedArtists : [createEmptyArtist()]);
        if (eventCacheRef.current) {
          eventCacheRef.current = {
            ...eventCacheRef.current,
            artists: savedArtists,
          };
        }
        artistsLoadedRef.current = true;
        if (!advance) {
          toast.success("Artist details saved.");
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

      // Upload immediately to storage draft
      const { url, publicId } = await uploadDraftImage(file, 'flyers');
      setCoverImage(url);
      setDraftCoverStorageKey(publicId);
      setCoverStorageKey(publicId);
      toast.success("Cover image uploaded successfully.");
    } catch (error) {
      console.error("Failed to upload cover image:", error);
      toast.error(error.message || "Failed to upload cover image.");
      // Reset on error
      setCoverImage(null);
      setCoverImageFile(null);
      setDraftCoverStorageKey(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverImage = async () => {
    const deleteDraftCoverIfAny = async () => {
      if (draftCoverStorageKey) {
        try {
          await deleteDraftStorageObject(draftCoverStorageKey, "EVENT_FLYER");
        } catch (err) {
          console.warn("Failed to delete draft cover from storage", err?.message);
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

        if (coverStorageKey) {
          await deleteDraftStorageObject(coverStorageKey, "EVENT_FLYER");
        }
        await deleteDraftCoverIfAny();

        // Remove from UI immediately after successful backend deletion
        setCoverImage(null);
        setCoverImageFile(null);
        setRemoveFlyerImage(true);
        setDraftCoverStorageKey(null);
        setCoverStorageKey(null);
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
      setDraftCoverStorageKey(null);
      setCoverStorageKey(null);
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
      setGalleryImageStorageKeys((prev) => ({ ...prev, ...newDrafts.reduce((acc, d) => ({ ...acc, [d.url]: d.publicId }), {}) }));
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
    const publicIdFromMap = galleryImageStorageKeys[imageToRemove];
    const deleteDraftIfAny = async () => {
      if (draftMatch?.publicId) {
        try {
          await deleteDraftStorageObject(draftMatch.publicId, "EVENT_GALLERY");
        } catch (err) {
          console.warn("Failed to delete draft gallery image from storage", err?.message);
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
          await deleteDraftStorageObject(publicIdFromMap, "EVENT_GALLERY");
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

      setGalleryImageStorageKeys(prev => {
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
        setGalleryImageStorageKeys((prev) => {
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
        await deleteDraftStorageObject(publicId, "ARTIST_IMAGE");
      } catch (err) {
        console.warn("Failed to delete artist photo from storage", err?.message);
      }
    }

    const newArtists = [...artists];
    newArtists[index].photo = "";
    newArtists[index].image = "";
    newArtists[index].publicId = "";
    setArtists(newArtists);
  };

  const openTicketModal = (type) => {
    setEditingTicketIndex(null);
    setSelectedTicketType(type);
    setTicketModalOpen(true);
  };

  const resolveTicketModalType = (ticket = {}) => {
    if (["vip-guest", "standard", "table", "group-pass"].includes(ticket.type)) {
      return ticket.type;
    }

    const ticketLabel = `${ticket.ticketEntryType || ticket.ticketCategory || ""}`.toLowerCase();
    if (ticketLabel.includes("guest")) return "vip-guest";
    if (ticketLabel.includes("table")) return "table";
    if (ticketLabel.includes("group")) return "group-pass";
    return "standard";
  };

  const openEditTicketModal = (ticket, index) => {
    setEditingTicketIndex(index);
    setSelectedTicketType(resolveTicketModalType(ticket));
    setTicketModalOpen(true);
  };

  const normalizeSponsors = (list) => {
    const mapped = list
      .map((s) => ({
        name: (s.name || "").trim(),
        logoUrl: (s.logoUrl || s.logo || "").trim(),
        logoStorageKey: (s.logoStorageKey || s.storageKey || s.key || s.logoPublicId || s.publicId || "").trim(),
        websiteUrl: (s.websiteUrl || s.website || "").trim(),
        isPrimary: Boolean(s.isPrimary),
      }))
      .map((s) => ({
        name: s.name,
        ...(s.logoUrl ? { logoUrl: s.logoUrl } : {}),
        ...(s.logoStorageKey ? { logoStorageKey: s.logoStorageKey } : {}),
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

  const normalizeArtists = (list) => {
    const seen = new Set();

    return (list || [])
      .map((a) => {
        const artist = a?.artist || a?.profile || a || {};
        const image = (
          artist.photo ||
          artist.image ||
          artist.imageUrl ||
          artist.avatar ||
          artist.profileImage ||
          ""
        ).trim();
        const instagramLink = (
          artist.instagram ||
          artist.instagramLink ||
          artist.instagramUrl ||
          artist.instagramHandle ||
          ""
        ).trim();
        const spotifyLink = (
          artist.spotify ||
          artist.spotifyLink ||
          artist.spotifyUrl ||
          ""
        ).trim();
        return {
          id: artist.id || artist._id || artist.artistId || a?.id || a?._id || "",
          clientId: artist.clientId || a?.clientId || "",
          name: (artist.name || "").trim(),
          image,
          photo: image,
          instagram: instagramLink,
          instagramLink,
          spotify: spotifyLink,
          spotifyLink,
          gender: normalizeArtistGender(artist.gender),
          ...(artist.publicId || a?.publicId ? { publicId: artist.publicId || a.publicId } : {}),
          ...(artist.imageStorageKey || artist.storageKey || artist.key || artist.publicId || a?.imageStorageKey
            ? { imageStorageKey: artist.imageStorageKey || artist.storageKey || artist.key || artist.publicId || a.imageStorageKey }
            : {}),
        };
      })
      .filter((a) => a.name || a.instagramLink || a.spotifyLink || a.image)
      .filter((a) => {
        const identity = getArtistIdentity(a);
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      });
  };

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

  const hasSponsorContent = (sponsor = {}) =>
    Boolean(
      (sponsor.name || "").trim() ||
      (sponsor.logoUrl || sponsor.logo || "").trim() ||
      (sponsor.websiteUrl || sponsor.website || sponsor.link || "").trim()
    );

  const openSponsorEditor = (index) => {
    setActiveSponsorIndex(index);
    setSponsorDialogOpen(true);
  };

  const addSponsorFromSection = () => {
    setIsSponsored(true);
    const reusableIndex = sponsors.findIndex((sponsor) => !hasSponsorContent(sponsor));

    if (reusableIndex >= 0) {
      openSponsorEditor(reusableIndex);
      return;
    }

    const nextIndex = sponsors.length;
    setSponsors((prev) => [...prev, { ...emptySponsor }]);
    openSponsorEditor(nextIndex);
  };

  const removeSponsorFromSection = (index) => {
    const sponsorToRemove = sponsors[index];
    if (!sponsorToRemove) return;

    setSponsors((prev) => {
      const nextSponsors = prev.filter((_, sponsorIndex) => sponsorIndex !== index);
      if (nextSponsors.length === 0) return [{ ...emptySponsor }];
      if (nextSponsors.length === 1) return [{ ...nextSponsors[0], isPrimary: true }];
      if (nextSponsors.some((sponsor) => sponsor.isPrimary)) return nextSponsors;
      return nextSponsors.map((sponsor, sponsorIndex) => ({
        ...sponsor,
        isPrimary: sponsorIndex === 0,
      }));
    });

    if (activeSponsorIndex === index) {
      setSponsorDialogOpen(false);
      setActiveSponsorIndex(null);
    } else if (activeSponsorIndex !== null && activeSponsorIndex > index) {
      setActiveSponsorIndex((prev) => prev - 1);
    }

    toast.success("Sponsor removed.");
  };

  const hasArtistContent = (artist = {}) =>
    Boolean(
      (artist.name || "").trim() ||
      (artist.photo || artist.image || artist.imageUrl || artist.avatar || artist.profileImage || "").trim() ||
      (artist.instagram || artist.instagramLink || artist.instagramUrl || artist.instagramHandle || "").trim() ||
      (artist.spotify || artist.spotifyLink || artist.spotifyUrl || "").trim()
    );

  const updateArtistField = (index, key, value) => {
    setArtists((prev) =>
      prev.map((artist, artistIndex) =>
        artistIndex === index ? { ...artist, [key]: value } : artist
      )
    );
  };

  const openArtistEditor = (index) => {
    setActiveArtistIndex(index);
    setArtistDialogOpen(true);
  };

  const addArtistFromSection = () => {
    const reusableIndex = artists.findIndex((artist) => !hasArtistContent(artist));

    if (reusableIndex >= 0) {
      openArtistEditor(reusableIndex);
      return;
    }

    const nextIndex = artists.length;
    setArtists((prev) => [...prev, createEmptyArtist()]);
    openArtistEditor(nextIndex);
  };

  const applyArtistRemoval = (index, artistToRemove) => {
    const removedIdentity = getArtistIdentity(artistToRemove);

    setArtists((prev) => {
      const nextArtists = prev.filter((_, artistIndex) => artistIndex !== index);
      return nextArtists.length ? nextArtists : [createEmptyArtist()];
    });
    setOriginalArtists((prev) =>
      prev.filter((artist) => getArtistIdentity(artist) !== removedIdentity)
    );
    setCreatedArtistIndices((prev) =>
      prev.filter((identity) => identity !== removedIdentity)
    );

    if (eventCacheRef.current?.artists) {
      eventCacheRef.current = {
        ...eventCacheRef.current,
        artists: eventCacheRef.current.artists.filter(
          (artist) => getArtistIdentity(artist) !== removedIdentity
        ),
      };
    }

    if (activeArtistIndex === index) {
      setArtistDialogOpen(false);
      setActiveArtistIndex(null);
    } else if (activeArtistIndex > index) {
      setActiveArtistIndex((prev) => prev - 1);
    }
  };

  const removeArtistFromSection = async (index) => {
    const artistToRemove = artists[index];
    if (!artistToRemove) return;

    const artistId = artistToRemove.id || artistToRemove._id || artistToRemove.artistId;

    if (!artistId) {
      if (artistToRemove.publicId) {
        try {
          await deleteDraftStorageObject(artistToRemove.publicId, "ARTIST_IMAGE");
        } catch (err) {
          console.warn("⚠️ Failed to delete unsaved artist photo", err?.message);
        }
      }
      applyArtistRemoval(index, artistToRemove);
      toast.success("Artist removed.");
      return;
    }

    try {
      setDeletingArtistId(artistId);
      setLoadingMessage("Deleting artist...");
      setShowLoading(true);

      await deleteArtist(artistId);
      applyArtistRemoval(index, artistToRemove);
      toast.success("Artist deleted successfully.");
    } catch (error) {
      console.error("Failed to delete artist:", error);
      const errorMessage = error.message || "Failed to delete artist. Please try again.";

      if (errorMessage.includes("not found") || errorMessage.includes("already deleted")) {
        applyArtistRemoval(index, artistToRemove);
        toast.info("Artist was already deleted, removing it from the section.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setDeletingArtistId(null);
      setShowLoading(false);
      setLoadingMessage("");
    }
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
      const upload = await uploadSponsorLogo(backendEventId, file);
      const logoUrl = upload?.data?.url || upload?.data?.image || "";
      const publicId = upload?.data?.publicId;
      setSponsors((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], logoUrl, logo: logoUrl, logoPublicId: publicId, logoStorageKey: publicId };
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
        await deleteDraftStorageObject(publicId, "SPONSOR_LOGO");
      } catch (err) {
        console.warn("Failed to delete sponsor logo from storage", err?.message);
      }
    }

    setSponsors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], logoUrl: "", logo: "", logoPublicId: "", logoStorageKey: "" };
      return next;
    });
  };

  const handleSaveTicket = async (ticketData) => {
    try {
      const isEditingTicket = editingTicketIndex !== null && savedTickets[editingTicketIndex];
      setLoadingMessage(isEditingTicket ? "Updating ticket..." : "Creating ticket...");
      setShowLoading(true);

      if (isEditingTicket) {
        const existingTicket = savedTickets[editingTicketIndex];
        const ticketWithEvent = {
          ...existingTicket,
          ...ticketData,
          eventId: backendEventId,
        };

        let updatedTicket = {
          ...existingTicket,
          ...ticketData,
        };

        if (existingTicket.id) {
          const response = await updateTicket(existingTicket.id, ticketWithEvent);
          const responseTicket = response?.data?.ticket || response?.data || response?.ticket || response;
          const normalizedResponseTicket = normalizeTicketForEdit(responseTicket);

          updatedTicket = {
            ...existingTicket,
            ...ticketData,
            ...(normalizedResponseTicket || {}),
            id: existingTicket.id,
            publicId: normalizedResponseTicket?.publicId || existingTicket.publicId,
            groupQuantity: ticketData.groupQuantity,
            tableQuantity: ticketData.tableQuantity,
          };
        }

        const updatedTickets = savedTickets.map((ticket, index) =>
          index === editingTicketIndex ? updatedTicket : ticket
        );

        setSavedTickets(updatedTickets);
        localStorage.setItem(`event_${backendEventId}_tickets`, JSON.stringify(updatedTickets));
        setEditingTicketIndex(null);

        toast.success("Ticket updated successfully!");
        return;
      }
      
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
      console.error("Error saving ticket:", error);
      toast.error(error.message || "Failed to save ticket. Please try again.");
    } finally {
      setShowLoading(false);
      setLoadingMessage("");
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
        publishStatus: isDraft ? "DRAFT" : "PUBLISHED",
      };

      const response = await updateEventStep6(backendEventId, updateData);
      
      console.log("Step 7 API Response:", response);
      
      // Success handling (no explicit status payloads)
      toast.success(isDraft ? "Event saved as draft!" : "Event updated successfully!");
      
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

  const renderReviewStep = () => {
    const normalizedSponsors = normalizeSponsors(sponsors);
    const normalizedArtists = normalizeArtists(artists);
    const activeArtists = normalizedArtists.filter((artist) => artist.name);
    const locationLine = fullAddress || [city, state, postalCode].filter(Boolean).join(", ");
    const scheduleStart = startDate ? `${formatDateValue(startDate)}${startTime ? `, ${formatTimeDisplay(startTime)}` : ""}` : "";
    const scheduleEnd = endDate ? `${formatDateValue(endDate)}${endTime ? `, ${formatTimeDisplay(endTime)}` : ""}` : "";
    const totalCapacity = savedTickets.reduce(
      (sum, ticket) => sum + (Number(ticket.quantity ?? ticket.available) || 0),
      0
    );
    const totalSold = savedTickets.reduce((sum, ticket) => sum + (Number(ticket.soldQty) || 0), 0);
    const advisoryEntries =
      customAdvisories.length > 0
        ? customAdvisories
        : Object.entries(advisory || {})
            .filter(([, val]) => val)
            .map(([key]) => key.replace(/([A-Z])/g, " $1").trim());

    const questionsEntries = customQuestions.map((q, i) => ({
      title: q.question,
      answer: q.answer,
      index: i + 1,
    }));

    const formatTicketPrice = (price) => {
      const numericPrice = Number(price) || 0;
      if (numericPrice === 0) return "Free";
      return `INR ${new Intl.NumberFormat("en-IN").format(numericPrice)}`;
    };

    const sectionBase =
      "rounded-xl border border-border/50 bg-card p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-border sm:p-5 animate-in fade-in-0 slide-in-from-bottom-2";
    const nestedPanel = "rounded-lg border border-border/40 bg-background/40 p-4";
    const mutedPanel = "rounded-lg border border-border/30 bg-muted/20 p-3";
    const sectionStatus = (complete) => (
      <Badge
        className={
          complete
            ? "border-accent/40 bg-accent/10 text-foreground"
            : "border-border/50 bg-muted/30 text-muted-foreground"
        }
      >
        {complete ? "Ready" : "Needs review"}
      </Badge>
    );

    const ValueItem = ({ label, value, className = "", valueClassName = "" }) => (
      <div className={`min-w-0 ${className}`}>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p
          className={`mt-1 break-words text-sm font-semibold leading-relaxed ${valueClassName} ${
            value ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {value || "Not provided"}
        </p>
      </div>
    );

    const ReviewSection = ({ icon: Icon, title, description, complete, children, className = "" }) => (
      <section className={`${sectionBase} ${className}`}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/15">
              <Icon className="h-5 w-5 text-accent" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="shrink-0">{sectionStatus(complete)}</div>
        </div>
        {children}
      </section>
    );

    const readinessItems = [
      {
        label: "Overview",
        complete: Boolean(eventTitle && mainCategory && selectedCategories[0] && coverImage),
      },
      {
        label: "Schedule",
        complete: Boolean(startDate && startTime && endDate && endTime && venueName),
      },
      {
        label: "Tickets",
        complete: savedTickets.length > 0,
      },
      {
        label: "Attendee Info",
        complete: Boolean(
          termsAndConditions?.trim() ||
            advisoryEntries.length > 0 ||
            questionsEntries.length > 0 ||
            organizerNote?.trim()
        ),
      },
    ];

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-border/50 bg-background/40 p-4 sm:p-5 animate-in fade-in-0 slide-in-from-bottom-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Final Checkpoint</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">Review before publishing</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Scan each grouped section, confirm missing items, then use the single action area below to save a draft or publish.
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-card px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Current state</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {publishState === "PUBLISHED" ? "Published" : "Draft"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {readinessItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-border/40 bg-card/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </p>
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.complete ? "bg-accent" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {item.complete ? "Ready" : "Needs review"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <ReviewSection
            icon={ClipboardCheck}
            title="Event Overview"
            description="Core event identity, category, cover, and public summary."
            complete={Boolean(eventTitle && mainCategory && selectedCategories[0] && coverImage)}
          >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-start">
              <div className={`${nestedPanel} space-y-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:bg-background/55`}>
                <ValueItem
                  label="Event title"
                  value={eventTitle}
                  valueClassName="text-base leading-snug"
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <ValueItem label="Category" value={mainCategory} />
                  <ValueItem label="Subcategory" value={selectedCategories[0]} />
                  <ValueItem label="Publish state" value={publishState === "PUBLISHED" ? "Published" : "Draft"} />
                  <ValueItem label="Event type" value={selectedEventTypeCategory || selectedEventType} />
                </div>

                <ValueItem
                  label="Description"
                  value={eventDescription}
                  valueClassName="max-w-3xl text-[13px] font-medium leading-6"
                />
              </div>

              <div className="overflow-hidden rounded-lg border border-border/40 bg-background/40 transition-all duration-300 hover:-translate-y-0.5 hover:border-border/70 hover:shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Event cover preview"
                    className="h-48 w-full object-cover transition-transform duration-500 hover:scale-[1.03] xl:h-full xl:min-h-[260px]"
                  />
                ) : (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground xl:min-h-[260px]">
                    <ImageIcon className="h-6 w-6" />
                    <p className="text-sm">Cover image missing</p>
                  </div>
                )}
              </div>
            </div>
          </ReviewSection>

          <ReviewSection
            icon={MapPin}
            title="Schedule & Venue"
            description="Timing and location details attendees will rely on."
            complete={Boolean(startDate && startTime && endDate && endTime && venueName)}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className={`${nestedPanel} transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:bg-background/55`}>
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <ValueItem label="Start" value={scheduleStart} />
                  </div>
                </div>
                <div className={`${nestedPanel} transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:bg-background/55`}>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <ValueItem label="End" value={scheduleEnd} />
                  </div>
                </div>
              </div>

              <div className={`${nestedPanel} space-y-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:bg-background/55`}>
                <ValueItem label="Venue" value={venueName} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <ValueItem label="City" value={city} />
                  <ValueItem label="State" value={state} />
                  <ValueItem label="Country" value={country} />
                  <ValueItem label="Postal code" value={postalCode} />
                </div>
              </div>

              <div className={`${nestedPanel} transition-all duration-200 hover:-translate-y-0.5 hover:border-border/70 hover:bg-background/55`}>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <ValueItem label="Location" value={locationLine || "Location pending"} valueClassName="font-medium" />
                </div>
              </div>
            </div>
          </ReviewSection>
        </div>

        <div className="space-y-5">
          <ReviewSection
            icon={Ticket}
            title="Tickets & Pricing"
            description="Ticket names, prices, capacity, and availability."
            complete={savedTickets.length > 0}
          >
            {savedTickets.length ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={mutedPanel}>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ticket types</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{savedTickets.length}</p>
                  </div>
                  <div className={mutedPanel}>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Capacity</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{totalCapacity || "Not set"}</p>
                  </div>
                  <div className={mutedPanel}>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Sold</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{totalSold}</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/40">
                  <div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-border/40 bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground md:grid">
                    <span>Ticket</span>
                    <span>Price</span>
                    <span>Capacity</span>
                    <span>Availability</span>
                  </div>
                  <div className="divide-y divide-border/40">
                    {savedTickets.map((ticket, index) => (
                      <div key={`${ticket.ticketName}-${index}`} className="grid gap-3 px-4 py-4 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:items-center">
                        <div>
                          <p className="font-semibold text-foreground">{ticket.ticketName || `Ticket ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">{ticket.ticketEntryType || ticket.ticketCategory || "Ticket"}</p>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{formatTicketPrice(ticket.price)}</p>
                        <p className="text-sm text-muted-foreground">{ticket.quantity || ticket.available || "Not set"}</p>
                        <p className="text-sm text-muted-foreground">
                          {Number(ticket.available ?? ticket.quantity) || 0} available
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={nestedPanel}>
                <p className="text-sm text-muted-foreground">No tickets added.</p>
              </div>
            )}
          </ReviewSection>

          <ReviewSection
            icon={Users}
            title="Artists & Sponsors"
            description="People and partners attached to the event."
            complete={activeArtists.length > 0 || normalizedSponsors.length > 0}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className={nestedPanel}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Artists</p>
                {activeArtists.length ? (
                  <div className="space-y-3">
                    {activeArtists.map((artist) => (
                      <div key={getArtistRenderKey(artist)} className="flex gap-3 rounded-lg border border-border/30 bg-card/70 p-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                          {artist.image ? (
                            <img src={artist.image} alt={`${artist.name} preview`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Users className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{artist.name}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {artist.instagramLink && <span className="truncate">{artist.instagramLink}</span>}
                            {artist.spotifyLink && <span className="truncate">{artist.spotifyLink}</span>}
                            {!artist.instagramLink && !artist.spotifyLink && <span>No profile links</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No artists added.</p>
                )}
              </div>

              <div className={nestedPanel}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sponsors</p>
                {normalizedSponsors.length ? (
                  <div className="space-y-3">
                    {normalizedSponsors.map((sponsor, index) => (
                      <div key={`${sponsor.name}-${index}`} className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/70 p-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/40 bg-muted/30">
                          {sponsor.logoUrl ? (
                            <img src={sponsor.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{sponsor.name || "Sponsor"}</p>
                          <p className="text-xs text-muted-foreground">{sponsor.isPrimary ? "Primary sponsor" : "Sponsor"}</p>
                          {sponsor.websiteUrl && (
                            <a
                              href={sponsor.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-accent hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              <span className="truncate">{sponsor.websiteUrl}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sponsors added.</p>
                )}
              </div>
            </div>
          </ReviewSection>
        </div>

        <ReviewSection
          icon={ImageIcon}
          title="Media & Gallery"
          description="Cover image and supporting image previews."
          complete={Boolean(coverImage || galleryImages.length)}
        >
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border/40 bg-background/40">
              {coverImage ? (
                <img src={coverImage} alt="Cover image preview" className="h-44 w-full object-cover" />
              ) : (
                <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">No cover image uploaded.</div>
              )}
            </div>
            {galleryImages.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryImages.slice(0, 6).map((img, index) => (
                  <div key={`${img}-${index}`} className="aspect-square overflow-hidden rounded-lg border border-border/40 bg-background/40">
                    <img src={img} alt={`Gallery preview ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
                {galleryImages.length > 6 && (
                  <div className="flex aspect-square items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-sm font-semibold text-muted-foreground">
                    +{galleryImages.length - 6} more
                  </div>
                )}
              </div>
            ) : (
              <p className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm text-muted-foreground">
                No gallery images uploaded.
              </p>
            )}
          </div>
        </ReviewSection>

        <ReviewSection
          icon={FileText}
          title="Attendee Information"
          description="Policies, advisories, and attendee questions."
          complete={Boolean(termsAndConditions?.trim() || advisoryEntries.length > 0 || questionsEntries.length > 0)}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className={nestedPanel}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Terms</p>
              {termsAndConditions?.trim() ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-sm text-foreground"
                  dangerouslySetInnerHTML={{ __html: termsAndConditions }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No terms provided.</p>
              )}
            </div>

            <div className={nestedPanel}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Advisories</p>
              {advisoryEntries.length ? (
                <div className="flex flex-wrap gap-2">
                  {advisoryEntries.map((chip, index) => (
                    <span
                      key={`${chip}-${index}`}
                      className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm text-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No advisories selected.</p>
              )}
            </div>

            <div className={`${nestedPanel} lg:col-span-2`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Custom questions</p>
              {questionsEntries.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {questionsEntries.map((question) => (
                    <div key={question.index} className="rounded-lg border border-border/30 bg-card/70 p-3">
                      <p className="text-sm font-semibold text-foreground">
                        {question.index}. {question.title}
                      </p>
                      {question.answer ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{question.answer}</p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">No default answer.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No custom questions added.</p>
              )}
            </div>
          </div>
        </ReviewSection>

        <ReviewSection
          icon={NotebookText}
          title="Organizer Notes"
          description="Private notes for internal organizer context."
          complete={Boolean(organizerNote?.trim())}
        >
          <div className={nestedPanel}>
            <p className={`whitespace-pre-line text-sm leading-relaxed ${organizerNote?.trim() ? "text-foreground" : "text-muted-foreground"}`}>
              {organizerNote?.trim() || "No private notes provided."}
            </p>
          </div>
        </ReviewSection>
      </div>
    );
  };

  return (
    <div className="create-event-shell min-h-screen flex flex-col bg-background text-foreground">
      <LoadingOverlay show={showLoading} message={loadingMessage} />
      <Header isAuthenticated userRole="organizer" />

      <main className="flex-1 py-6">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-8">
          {isEditMode && isEditHydrating && (
            <Card className={`${cardBase} p-8`}>
              <div className="flex items-center gap-3 text-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <div>
                  <p className="text-sm font-medium">Loading event for editing...</p>
                  <p className="text-xs text-muted-foreground">Fetching the latest event data from the server.</p>
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
                className="h-10 rounded-lg px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-5 h-5" />
                 <span className="text-sm">Back</span>
              </Button>
              {/* <span className="text-sm text-muted-foreground">Back</span> */}
            </div>
            
            {backendEventId && !isEditMode && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-lg border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
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
          <Card className={`${cardBase}`} style={{ boxShadow: pageTheme.glow }}>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Event Builder
                  </p>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">
                      {isEditMode ? "Update Event" : "Create New Event"}
                    </h1>
                    {selectedEventTypeCategory && (
                      <Badge className="h-7 rounded-full border-border/60 bg-muted/40 px-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {selectedEventTypeCategory}
                      </Badge>
                    )}
                    
                    {backendEventId && !isEditMode && (
                      <Badge className="h-7 rounded-full border-border/60 bg-secondary/30 px-3 text-[11px] uppercase tracking-[0.12em] text-foreground">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete each section, review the event, then publish when everything is ready.
                  </p>
                </div>
                <div className="w-full rounded-lg border border-border/50 bg-background/40 p-3 lg:w-[280px]">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="truncate text-xs text-muted-foreground">
                      Step {currentStep} of {steps.length} • {steps[currentStep - 1].title}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5 bg-muted" />
                </div>
              </div>

              {/* Compact step tracker */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                  {steps.map((step, idx) => {
                    const isCurrent = step.number === currentStep;
                    const isDone = step.number < currentStep;
                    const barActive =
                      idx < currentStep - 1
                        ? "bg-primaryCTA"
                        : idx === currentStep - 1
                        ? "bg-border"
                        : "bg-muted";

                    return (
                      <div key={step.number} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => goToStep(step.number)}
                          disabled={!canJumpBetweenSections}
                          className={`group flex min-h-[3.625rem] w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${
                            isDone
                              ? "border-primary/50 bg-primary/15"
                              : isCurrent
                              ? "border-ring/70 bg-muted/50"
                              : canJumpBetweenSections
                              ? "border-border/40 bg-background/30 hover:border-ring/60 hover:bg-muted/40"
                              : "border-border/30 bg-background/20"
                          } ${canJumpBetweenSections ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-all ${
                              isDone
                                ? "border-primaryCTA bg-primaryCTA text-primary-foreground"
                                : isCurrent
                                ? "border-ring bg-accent/10 text-foreground"
                                : canJumpBetweenSections
                                ? "border-border/60 bg-card text-muted-foreground group-hover:border-ring"
                                : "border-border/50 bg-card text-muted-foreground"
                            }`}
                          >
                            {isDone ? <Check className="h-3 w-3" /> : step.number}
                          </div>
                          <p
                            className={`min-w-0 truncate text-[11px] font-semibold leading-tight ${
                              isCurrent || isDone ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.title}
                          </p>
                        </button>
                        {idx !== steps.length - 1 && (
                          <div className={`hidden ${barActive}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                {isEditMode && (
                  <p className="text-xs text-muted-foreground">Click any section to jump directly while editing.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <Card className={`${cardBase} overflow-hidden`}>
            <CardHeader className="border-b border-border/60 bg-card/95 px-5 py-4 sm:px-6">
              <CardTitle className="flex items-center gap-3 text-xl text-foreground sm:text-2xl">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold">
                  {currentStep}
                </span>
                {steps[currentStep - 1].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 px-5 py-6 text-foreground sm:px-6">
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
                          {EVENT_CATEGORY_OPTIONS.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
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
                            {EVENT_CATEGORY_HIERARCHY[mainCategory]?.map((subcat) => (
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
                        <div className={`relative rounded-xl border border-dashed border-border/50 bg-background/40 p-6 text-center transition-all duration-200 ${!basicDetailsFilled ? "opacity-70" : "hover:border-ring/60"}`}>
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
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-foreground">Drag and drop your cover image</p>
                            <p className="text-sm text-muted-foreground">or click to upload</p>
                            <p className="text-xs text-muted-foreground/80">Recommended size: 1920x1080</p>
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
                          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border/50">
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
                        <div className={`relative rounded-xl border border-dashed border-border/50 bg-background/40 p-6 text-center transition-all duration-200 ${!basicDetailsFilled ? "opacity-70" : "hover:border-ring/60"}`}>
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
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-foreground">Drag and drop gallery images</p>
                            <p className="text-sm text-muted-foreground">or click to upload</p>
                            <p className="text-xs text-muted-foreground/80">Supported formats: JPG, PNG, WebP. Up to 10 images.</p>
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
                              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border/50 group bg-background/60">
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
              {currentStep === 5 && (() => {
                const sponsorCards = sponsors
                  .map((sponsor, index) => ({ sponsor, index }))
                  .filter(({ sponsor }) => hasSponsorContent(sponsor));
                const activeSponsor = activeSponsorIndex !== null ? sponsors[activeSponsorIndex] : null;
                const activeSponsorLogo = activeSponsor?.logoUrl || activeSponsor?.logo || "";
                const activeFieldId = activeSponsorIndex ?? "sponsor";

                return (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/60 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">Is this event sponsored?</p>
                          <p className="text-xs text-muted-foreground">
                            Toggle Yes to add sponsor details required by the backend.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">No</span>
                          <Switch
                            checked={isSponsored}
                            onCheckedChange={(checked) => {
                              setIsSponsored(checked);
                              if (!checked) {
                                setSponsorDialogOpen(false);
                                setActiveSponsorIndex(null);
                              }
                            }}
                          />
                          <span className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Yes</span>
                        </div>
                      </div>
                      {!isSponsored && (
                        <div className="text-xs text-muted-foreground">
                          Sponsors are disabled. Click Next to continue or toggle Yes to add sponsor information.
                        </div>
                      )}
                    </div>

                    {isSponsored && (
                      <>
                        <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 5</p>
                            <h3 className="mt-2 text-2xl font-bold text-foreground">Sponsor</h3>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                              Highlight event partners with compact sponsor profiles. Open a card to update the same sponsor details.
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="group h-11 shrink-0 rounded-[10px] border-border bg-background/60 px-4 text-foreground shadow-[var(--shadow-card)] hover:border-ring/60 hover:bg-muted hover:text-foreground"
                            onClick={addSponsorFromSection}
                          >
                            <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                            Add Sponsor
                          </Button>
                        </div>

                        {sponsorCards.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {sponsorCards.map(({ sponsor, index }) => {
                              const sponsorLogo = sponsor.logoUrl || sponsor.logo || "";
                              const sponsorWebsite = sponsor.websiteUrl || sponsor.website || sponsor.link || "";
                              const isPrimarySponsor = Boolean(sponsor.isPrimary) || sponsorCards.length === 1;

                              return (
                                <article
                                  key={`sponsor-card-${index}`}
                                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/75 p-3 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-ring/50 hover:shadow-[var(--shadow-elegant)]"
                                >
                                  <div className="theme-gradient-primary pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                                  <div className="relative flex min-w-0 items-center gap-3">
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background/60">
                                      {sponsorLogo ? (
                                        <img src={sponsorLogo} alt={`${sponsor.name || "Sponsor"} logo`} className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105" />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                          <ImageIcon className="h-7 w-7" />
                                        </div>
                                      )}
                                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/80 to-transparent opacity-80" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-foreground">{sponsor.name || "New sponsor"}</p>
                                          <p className="mt-1 text-xs text-muted-foreground">Sponsor {index + 1}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                            onClick={() => openSponsorEditor(index)}
                                            title="Edit sponsor"
                                            aria-label={`Edit ${sponsor.name || `sponsor ${index + 1}`}`}
                                          >
                                            <Pencil className="h-3.5 w-3.5" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                            onClick={() => removeSponsorFromSection(index)}
                                            title="Remove sponsor"
                                            aria-label={`Remove ${sponsor.name || `sponsor ${index + 1}`}`}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>

                                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                                        <div className="flex min-w-0 items-center gap-2">
                                          <Globe className="h-3.5 w-3.5 shrink-0 text-accent" />
                                          <span className="truncate">{sponsorWebsite || "Website optional"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                                          <span className="truncate">{isPrimarySponsor ? "Primary sponsor" : "Supporting sponsor"}</span>
                                        </div>
                                      </div>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge className="rounded-full border-border/50 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                          {sponsorLogo ? "Logo ready" : "No logo"}
                                        </Badge>
                                        <Badge className="rounded-full border-border/50 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                          {sponsorWebsite ? "Website linked" : "Website optional"}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center shadow-[var(--shadow-card)]">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card text-muted-foreground">
                              <ImageIcon className="h-5 w-5" />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-foreground">No sponsors added yet</p>
                            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                              Add sponsors as compact profiles, then use Save Section when partner details are ready.
                            </p>
                          </div>
                        )}

                        <Dialog
                          open={sponsorDialogOpen && Boolean(activeSponsor)}
                          onOpenChange={(open) => {
                            setSponsorDialogOpen(open);
                            if (!open) setActiveSponsorIndex(null);
                          }}
                        >
                          {activeSponsor && (
                            <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden border-border/50 bg-popover/95 p-0 text-foreground shadow-[var(--shadow-elegant)] backdrop-blur-xl">
                              <div className="max-h-[86vh] overflow-y-auto">
                                <div className="relative overflow-hidden border-b border-border/50 p-5 sm:p-6">
                                  <div className="theme-gradient-primary pointer-events-none absolute inset-0 opacity-10" />
                                  <DialogHeader className="relative">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                      Sponsor profile
                                    </p>
                                    <DialogTitle className="mt-2 text-2xl text-foreground">
                                      {activeSponsor.name || "Add sponsor details"}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                      Update the sponsor information shown in this event partner section.
                                    </DialogDescription>
                                  </DialogHeader>
                                </div>

                                <div className="space-y-5 p-5 sm:p-6">
                                  <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2.5">
                                      <Label htmlFor={`sponsor-name-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Sponsor Name *</Label>
                                      <Input
                                        id={`sponsor-name-${activeFieldId}`}
                                        placeholder="BrandCo"
                                        value={activeSponsor.name}
                                        className={fieldClass}
                                        onChange={(e) => handleSponsorChange(activeSponsorIndex, "name", e.target.value)}
                                      />
                                    </div>

                                    <div className="space-y-2.5">
                                      <Label htmlFor={`sponsor-website-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Website URL (Optional)</Label>
                                      <Input
                                        id={`sponsor-website-${activeFieldId}`}
                                        type="url"
                                        placeholder="https://brandco.example.com"
                                        value={activeSponsor.websiteUrl}
                                        className={fieldClass}
                                        onChange={(e) => handleSponsorChange(activeSponsorIndex, "websiteUrl", e.target.value)}
                                      />
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                      <div>
                                        <Label htmlFor={`sponsor-logo-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Sponsor Logo</Label>
                                        <p className="mt-1 text-xs text-muted-foreground">PNG / SVG with transparent background preferred</p>
                                      </div>
                                      {activeSponsorLogo && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                          onClick={() => handleRemoveSponsorLogo(activeSponsorIndex)}
                                        >
                                          <X className="mr-2 h-3.5 w-3.5" />
                                          Remove
                                        </Button>
                                      )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                                      <div className="relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)]">
                                        {activeSponsorLogo ? (
                                          <img src={activeSponsorLogo} alt={`${activeSponsor.name || "Sponsor"} logo preview`} className="h-full w-full object-contain p-4" />
                                        ) : (
                                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <ImageIcon className="h-7 w-7" />
                                            <span className="text-xs">No logo</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="relative flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-5 text-center transition-all duration-200 hover:border-ring/60 hover:bg-muted/30">
                                        <input
                                          id={`sponsor-logo-${activeFieldId}`}
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleSponsorLogoChange(activeSponsorIndex, e.target.files?.[0])}
                                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                        <div className="pointer-events-none flex flex-col items-center gap-2">
                                          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground shadow-[var(--shadow-card)]">
                                            {sponsorUploadIndex === activeSponsorIndex ? (
                                              <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                              <Upload className="h-5 w-5" />
                                            )}
                                          </span>
                                          <p className="text-sm font-semibold text-foreground">
                                            {sponsorUploadIndex === activeSponsorIndex ? "Uploading logo..." : "Upload sponsor logo"}
                                          </p>
                                          <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                                            Choose a logo to make this sponsor card easier to scan.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                                    {sponsors.length > 1 ? (
                                      <div className="flex items-center gap-3">
                                        <Switch
                                          checked={Boolean(activeSponsor.isPrimary)}
                                          onCheckedChange={() => setPrimarySponsor(activeSponsorIndex)}
                                        />
                                        <div>
                                          <p className="text-sm text-foreground">Mark as primary sponsor</p>
                                          <p className="text-xs text-muted-foreground">Required when multiple sponsors exist.</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground">
                                        Single sponsor is primary by default.
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <DialogFooter className="border-t border-border/50 bg-card/80 px-5 py-4 sm:px-6">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-lg border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
                                    onClick={() => setSponsorDialogOpen(false)}
                                  >
                                    Close
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="accent"
                                    className="h-10 rounded-lg px-5"
                                    onClick={() => setSponsorDialogOpen(false)}
                                  >
                                    Done
                                  </Button>
                                </DialogFooter>
                              </div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Step 2: Date & Time */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <TooltipProvider delayDuration={150}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Reset date and time"
                            disabled={!startDate && !startTime && !endDate && !endTime}
                            onClick={resetDateTimeInputs}
                            className="h-9 w-9 rounded-full border-border/60 bg-background/60 text-muted-foreground hover:border-ring hover:text-foreground"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Reset date and time</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <Label className="text-[13px] font-medium text-[#d4d4d4]">Starting Date *</Label>
                      <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-foreground">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              {startDate ? formatDateValue(startDate) : "Pick a start date"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0 border-border/50 bg-background/40">
                          <Calendar
                            mode="single"
                            selected={parseSafeDateOnly(startDate) || undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const iso = format(date, "yyyy-MM-dd");
                              const nextEndDate = endDate && iso > endDate ? iso : endDate;
                              setStartDate(iso);
                              if (nextEndDate !== endDate) {
                                setEndDate(nextEndDate);
                              }
                              if (clearEndTimeIfInvalid({ nextStartDate: iso, nextEndDate })) {
                                notifyEndTimeCleared();
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
                      <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-foreground">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {formatTimeDisplay(startTime)}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-auto p-0 border-border/50 bg-background/40"
                        >
                          <TimePicker
                            value={startTime}
                            onChange={handleStartTimeChange}
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
                            <span className="flex items-center gap-2 text-foreground">
                              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                              {endDate ? formatDateValue(endDate) : "Pick an end date"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0 border-border/50 bg-background/40">
                          <Calendar
                            mode="single"
                            selected={parseSafeDateOnly(endDate) || undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              const iso = format(date, "yyyy-MM-dd");
                              setEndDate(iso);
                              if (clearEndTimeIfInvalid({ nextEndDate: iso })) {
                                notifyEndTimeCleared();
                              }
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
                      <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`w-full justify-between ${fieldClass}`}
                          >
                            <span className="flex items-center gap-2 text-foreground">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              {formatTimeDisplay(endTime)}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          sideOffset={8}
                          className="w-auto p-0 border-border/50 bg-background/40"
                        >
                          <TimePicker
                            value={endTime}
                            onChange={handleEndTimeChange}
                            onClose={() => setEndTimeOpen(false)}
                            defaultAmpm={parseTime(startTime).ampm}
                            isValueInvalid={(value) => isEndDateTimeNotAfterStart({ nextEndTime: value })}
                            onInvalid={() => toast.error("Ending time must be after starting time")}
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
                  <div className="text-sm text-muted-foreground">
                    Select ticket types to add for your event
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-border/50 bg-background/60 text-xs md:text-sm text-muted-foreground">
                    Need a custom ticket? Pick <span className="font-medium text-foreground">Add Standard Ticket</span>, name it (e.g., <span className="font-medium text-foreground">Silver</span>) and set any price. You can add multiple categories.
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* VIP Guest List Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-ring/60`}
                      onClick={() => openTicketModal("vip-guest")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/40 border border-border/50">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">Add VIP Guest List</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Free entry for VIP guests with no pricing
                        </p>
                      </CardContent>
                    </Card>

                    {/* Standard Ticket Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-ring/60`}
                      onClick={() => openTicketModal("standard")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/40 border border-border/50">
                            <Ticket className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">Add Standard Ticket</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Regular paid tickets with GST options
                        </p>
                      </CardContent>
                    </Card>

                    {/* Table Ticket Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-ring/60`}
                      onClick={() => openTicketModal("table")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/40 border border-border/50">
                            <Table2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">Add Table Ticket</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Reserved table booking for groups
                        </p>
                      </CardContent>
                    </Card>

                    {/* Group Pass Card */}
                    <Card 
                      className={`group transition-all cursor-pointer border ${cardBase} hover:border-ring/60`}
                      onClick={() => openTicketModal("group-pass")}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-background/40 border border-border/50">
                            <UsersRound className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <h3 className="text-base font-semibold text-foreground">Add Group Pass</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
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
                                  <h6 className="font-semibold text-foreground">{ticket.ticketName}</h6>
                                  <p className="text-sm text-muted-foreground">
                                    {ticket.ticketCategory} • {ticket.ticketEntryType}
                                  </p>
                                  {ticket.ticketAddress && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {ticket.ticketAddress}
                                    </p>
                                  )}
                                  {ticket.price !== "0" && (
                                    <p className="text-sm font-semibold mt-1 text-accent">₹{ticket.price}</p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditTicketModal(ticket, index);
                                    }}
                                    disabled={showLoading}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Edit ticket"
                                    aria-label={`Edit ${ticket.ticketName || `ticket ${index + 1}`}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTicket(ticket, index);
                                    }}
                                    disabled={showLoading}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Delete ticket"
                                    aria-label={`Delete ${ticket.ticketName || `ticket ${index + 1}`}`}
                                  >
                                    {showLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
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
                  <div className="rounded-2xl border border-border/50 bg-background/60 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Venue</p>
                        <h3 className="text-base font-semibold text-foreground">Location Details</h3>
                      </div>
                      <div className="flex gap-2 text-[11px]">
                        <span className="px-3 py-1 rounded-full bg-background/40 text-muted-foreground border border-border/50">Manual entry</span>
                        <span className="px-3 py-1 rounded-full bg-background/40 text-muted-foreground border border-border/50">Required fields *</span>
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
                          {...PHONE_INPUT_PROPS}
                          placeholder="10 digit contact number"
                          value={venueContact}
                          onChange={(e) => setVenueContact(sanitizeTenDigitPhoneInput(e.target.value))}
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
                        <p className="text-xs text-muted-foreground">Provide extra directions if needed. This won’t block submission.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Add Artist */}
              {currentStep === 6 && (() => {
                const artistCards = artists
                  .map((artist, index) => ({ artist, index }))
                  .filter(({ artist }) => hasArtistContent(artist));
                const activeArtist = activeArtistIndex !== null ? artists[activeArtistIndex] : null;
                const activeArtistImage = activeArtist?.photo || activeArtist?.image || "";
                const activeFieldId = activeArtistIndex ?? "artist";

                return (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step 6</p>
                        <h3 className="mt-2 text-2xl font-bold text-foreground">Add Artist</h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                          Build your lineup with compact artist profiles. Open a card to update the same artist details.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="group h-11 shrink-0 rounded-[10px] border-border bg-background/60 px-4 text-foreground shadow-[var(--shadow-card)] hover:border-ring/60 hover:bg-muted hover:text-foreground"
                        onClick={addArtistFromSection}
                      >
                        <Plus className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                        Add Artist
                      </Button>
                    </div>

                    {artistCards.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {artistCards.map(({ artist, index }) => {
                          const artistImage = artist.photo || artist.image || "";
                          const instagram = artist.instagram || artist.instagramLink || "";
                          const spotify = artist.spotify || artist.spotifyLink || "";
                          const artistId = artist.id || artist._id || artist.artistId || getArtistRenderKey(artist);
                          const isDeletingArtist = deletingArtistId === artistId;

                          return (
                            <article
                              key={getArtistRenderKey(artist)}
                              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/75 p-3 shadow-[var(--shadow-card)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-ring/50 hover:shadow-[var(--shadow-elegant)]"
                            >
                              <div className="theme-gradient-primary pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
                              <div className="relative flex min-w-0 items-center gap-3">
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background/60">
                                  {artistImage ? (
                                    <img src={artistImage} alt={`${artist.name || "Artist"} preview`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                      <UsersRound className="h-7 w-7" />
                                    </div>
                                  )}
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background/80 to-transparent opacity-80" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-foreground">{artist.name || "New artist"}</p>
                                      <p className="mt-1 text-xs text-muted-foreground">Artist {index + 1} - {normalizeArtistGender(artist.gender)}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                        onClick={() => openArtistEditor(index)}
                                        title="Edit artist"
                                        aria-label={`Edit ${artist.name || `artist ${index + 1}`}`}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => removeArtistFromSection(index)}
                                        disabled={isDeletingArtist}
                                        title="Remove artist"
                                        aria-label={`Remove ${artist.name || `artist ${index + 1}`}`}
                                      >
                                        {isDeletingArtist ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                                    <div className="flex min-w-0 items-center gap-2">
                                      <AtSign className="h-3.5 w-3.5 shrink-0 text-accent" />
                                      <span className="truncate">{instagram || "Instagram required"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Music2 className="h-3.5 w-3.5 shrink-0 text-accent" />
                                      <span className="truncate">{spotify ? "Spotify linked" : "Spotify not added"}</span>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge className="rounded-full border-border/50 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                      {artistImage ? "Photo ready" : "No photo"}
                                    </Badge>
                                    <Badge className="rounded-full border-border/50 bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                                      {instagram ? "Profile ready" : "Needs Instagram"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/60 bg-background/40 p-6 text-center shadow-[var(--shadow-card)]">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card text-muted-foreground">
                          <UsersRound className="h-5 w-5" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-foreground">No artists added yet</p>
                        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                          Add artists as compact profiles, then use Save Section when the lineup is ready.
                        </p>
                      </div>
                    )}

                    <Dialog
                      open={artistDialogOpen && Boolean(activeArtist)}
                      onOpenChange={(open) => {
                        setArtistDialogOpen(open);
                        if (!open) setActiveArtistIndex(null);
                      }}
                    >
                      {activeArtist && (
                        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden border-border/50 bg-popover/95 p-0 text-foreground shadow-[var(--shadow-elegant)] backdrop-blur-xl">
                          <div className="max-h-[86vh] overflow-y-auto">
                            <div className="relative overflow-hidden border-b border-border/50 p-5 sm:p-6">
                              <div className="theme-gradient-primary pointer-events-none absolute inset-0 opacity-10" />
                              <DialogHeader className="relative">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                  Artist profile
                                </p>
                                <DialogTitle className="mt-2 text-2xl text-foreground">
                                  {activeArtist.name || "Add artist details"}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                  Update the artist information shown in this event lineup.
                                </DialogDescription>
                              </DialogHeader>
                            </div>

                            <div className="space-y-5 p-5 sm:p-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2.5">
                                  <Label htmlFor={`artist-name-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Artist Name *</Label>
                                  <Input
                                    id={`artist-name-${activeFieldId}`}
                                    placeholder="e.g., John Doe"
                                    value={activeArtist.name}
                                    className={fieldClass}
                                    onChange={(e) => updateArtistField(activeArtistIndex, "name", e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2.5">
                                  <Label htmlFor={`artist-gender-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Gender</Label>
                                  <Select
                                    value={normalizeArtistGender(activeArtist.gender)}
                                    onValueChange={(value) => updateArtistField(activeArtistIndex, "gender", value)}
                                  >
                                    <SelectTrigger id={`artist-gender-${activeFieldId}`} className={fieldClass}>
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

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2.5">
                                  <Label htmlFor={`artist-instagram-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Instagram *</Label>
                                  <Input
                                    id={`artist-instagram-${activeFieldId}`}
                                    placeholder="@artist_handle"
                                    value={activeArtist.instagram}
                                    className={fieldClass}
                                    onChange={(e) => updateArtistField(activeArtistIndex, "instagram", e.target.value)}
                                  />
                                  <p className="text-xs text-muted-foreground">Use full handle or profile URL</p>
                                </div>

                                <div className="space-y-2.5">
                                  <Label htmlFor={`artist-spotify-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Spotify (Optional)</Label>
                                  <Input
                                    id={`artist-spotify-${activeFieldId}`}
                                    placeholder="https://open.spotify.com/artist/..."
                                    value={activeArtist.spotify}
                                    className={fieldClass}
                                    onChange={(e) => updateArtistField(activeArtistIndex, "spotify", e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <div>
                                    <Label htmlFor={`artist-photo-${activeFieldId}`} className="text-[13px] font-medium text-foreground">Artist Photo *</Label>
                                    <p className="mt-1 text-xs text-muted-foreground">JPG/PNG/WebP</p>
                                  </div>
                                  {activeArtistImage && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => handleRemoveArtistPhoto(activeArtistIndex)}
                                    >
                                      <X className="mr-2 h-3.5 w-3.5" />
                                      Remove
                                    </Button>
                                  )}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
                                  <div className="relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-card shadow-[var(--shadow-card)]">
                                    {activeArtistImage ? (
                                      <img src={activeArtistImage} alt={`${activeArtist.name || "Artist"} preview`} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Camera className="h-7 w-7" />
                                        <span className="text-xs">No photo</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="relative flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/60 p-5 text-center transition-all duration-200 hover:border-ring/60 hover:bg-muted/30">
                                    <input
                                      id={`artist-photo-${activeFieldId}`}
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleArtistPhotoChange(activeArtistIndex, e)}
                                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <div className="pointer-events-none flex flex-col items-center gap-2">
                                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 bg-background/60 text-muted-foreground shadow-[var(--shadow-card)]">
                                        <Upload className="h-5 w-5" />
                                      </span>
                                      <p className="text-sm font-semibold text-foreground">Upload artist photo</p>
                                      <p className="max-w-xs text-xs leading-5 text-muted-foreground">
                                        Choose a profile image to make this artist card easier to scan.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <DialogFooter className="border-t border-border/50 bg-card/80 px-5 py-4 sm:px-6">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-lg border-border bg-background text-foreground hover:bg-muted hover:text-foreground"
                                onClick={() => setArtistDialogOpen(false)}
                              >
                                Close
                              </Button>
                              <Button
                                type="button"
                                variant="accent"
                                className="h-10 rounded-lg px-5"
                                onClick={() => setArtistDialogOpen(false)}
                              >
                                Done
                              </Button>
                            </DialogFooter>
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                );
              })()}

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
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 7</p>
                        <CardTitle className="text-xl text-foreground">Additional Info</CardTitle>
                        <p className="text-sm text-muted-foreground">Set policies, advisories, and helpful notes for attendees.</p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label htmlFor="terms" className="text-foreground">Terms & Conditions</Label>
                              <p className="text-xs text-muted-foreground">Describe entry rules, refunds, or other policies.</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-border/50 bg-background/40 p-3">
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
                              className="text-foreground"
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
                              <Label className="text-foreground">Advisories</Label>
                              <p className="text-xs text-muted-foreground">Pick multiple advisories and add your own.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 rounded-lg border-border bg-background/60 text-foreground hover:border-ring/60 hover:bg-muted"
                                onClick={() => setAdvisoryDialogOpen(true)}
                              >
                                {hasSelections ? `${selectedBuiltIns.length + customAdvisories.length} selected` : "Open advisory picker"}
                              </Button>
                            </div>
                          </div>

                          <Dialog open={advisoryDialogOpen} onOpenChange={setAdvisoryDialogOpen}>
                            <DialogContent className="max-w-4xl border-border/40 bg-popover text-foreground max-h-[90vh] overflow-hidden p-0">
                            <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
                              <DialogHeader>
                                <DialogTitle className="text-2xl">Choose advisories</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
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
                                            ? "border-ring bg-accent/10 text-foreground"
                                            : "border-border/50 bg-background/40 text-muted-foreground hover:border-ring/60 hover:bg-muted/40"
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

                                <div className="border-t border-border/50 pt-4 space-y-3">
                                  <p className="text-sm font-semibold text-foreground">Custom advisory</p>
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
                                        className="h-12 w-12 rounded-[10px] border-border bg-background/60 text-foreground hover:border-ring/60 hover:bg-muted"
                                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                                      >
                                        <Smile className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="accent"
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
                                    <div className="rounded-xl border border-border/50 bg-background/40 p-3 space-y-2 max-h-60 overflow-y-auto">
                                      <p className="text-xs uppercase tracking-wider text-muted-foreground/80">Emoji</p>
                                      <div className="grid grid-cols-8 gap-2 text-lg">
                                        {emojiPalette.map((emoji, idx) => (
                                          <button
                                            key={`emoji-${idx}`}
                                            type="button"
                                            className="h-9 w-9 rounded-lg border border-border/50 bg-background/40 hover:border-ring/60 hover:bg-muted/40 transition"
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
                                          className="group flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1 text-sm text-muted-foreground hover:border-ring/60 hover:bg-muted/40"
                                          onClick={() => setCustomAdvisories(customAdvisories.filter((_, i) => i !== idx))}
                                        >
                                          ✨ {item}
                                          <X className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <p className="text-sm text-muted-foreground">
                                  {hasSelections
                                    ? `${selectedBuiltIns.length + customAdvisories.length} selected`
                                    : "No advisories selected yet"}
                                </p>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-foreground hover:text-foreground"
                                    onClick={() => setAdvisoryDialogOpen(false)}
                                  >
                                    Close
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="accent"
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
                                  className="group flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1 text-sm text-muted-foreground hover:border-ring/60 hover:bg-muted/40"
                                  onClick={() => setAdvisory({ ...advisory, [item.id]: false })}
                                >
                                  {item.label}
                                  <X className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                                </button>
                              ))}
                              {customAdvisories.map((item, idx) => (
                                <button
                                  key={`custom-${idx}`}
                                  type="button"
                                  className="group flex items-center gap-2 rounded-full border border-border/50 bg-background/40 px-3 py-1 text-sm text-muted-foreground hover:border-ring/60 hover:bg-muted/40"
                                  onClick={() => setCustomAdvisories(customAdvisories.filter((_, i) => i !== idx))}
                                >
                                  ✨ {item}
                                  <X className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground/80 border border-dashed border-border/50 rounded-lg px-3 py-2 bg-background/40">
                              No advisories selected yet. Use "Open advisory picker" to add them.
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <Label className="text-foreground">Custom Questions for Attendees</Label>
                              <p className="text-xs text-muted-foreground">Collect details like dietary needs or preferences.</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-10 rounded-lg border-border text-foreground bg-background/60 hover:bg-muted hover:border-ring/60"
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
                                <Card key={index} className="border border-border/40 bg-background/40">
                                  <CardContent className="pt-4">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex-1 space-y-1">
                                        <p className="font-medium text-sm text-foreground">Q: {q.question}</p>
                                        {q.answer && <p className="text-sm text-muted-foreground">A: {q.answer}</p>}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-foreground"
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
                            <p className="text-sm text-muted-foreground">No questions added yet.</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-foreground">Organizer Notes (Private)</Label>
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

              {/* Step 8: Review & Publish */}
              {currentStep === 8 && renderReviewStep()}

            </CardContent>

            <div className="sticky bottom-4 z-20 mt-6 border-t border-border/60 bg-card/95 px-5 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSectionBusy}
                  className="h-11 rounded-[10px] border-border bg-background px-5 text-foreground hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {isEditMode && currentStep < 8 && (
                    <Button
                      variant="outline"
                      onClick={saveCurrentSection}
                      disabled={isSectionBusy}
                      className="h-11 rounded-[10px] border-border bg-background px-5 text-foreground hover:bg-muted hover:text-foreground"
                    >
                      {isSectionBusy ? "Saving..." : "Save Section"}
                    </Button>
                  )}

                  {currentStep < 8 ? (
                    <Button
                      onClick={() => nextStep()}
                      disabled={isSectionBusy}
                      className="h-11 rounded-[10px] px-5 font-medium"
                    >
                      {isSectionBusy ? "Saving..." : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit("DRAFT")}
                        disabled={isSectionBusy}
                        className="h-11 rounded-[10px] border-border bg-background px-5 text-foreground hover:bg-muted hover:text-foreground"
                      >
                        {isSectionBusy ? "Saving..." : isEditMode ? "Update Draft" : "Save Draft"}
                      </Button>
                      <Button
                        variant="accent"
                        onClick={() => handleSubmit("PUBLISHED")}
                        disabled={isSectionBusy}
                        className="h-11 rounded-[10px] px-5 font-semibold"
                      >
                        {isSectionBusy ? "Publishing..." : isEditMode ? "Update & Publish" : "Publish Event"}
                      </Button>
                    </>
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
            setEditingTicketIndex(null);
          }}
          ticketType={selectedTicketType}
          onSave={handleSaveTicket}
          initialTicket={editingTicketIndex !== null ? savedTickets[editingTicketIndex] : null}
        />
      )}
    </div>
  );
};

export default CreateEvent;
