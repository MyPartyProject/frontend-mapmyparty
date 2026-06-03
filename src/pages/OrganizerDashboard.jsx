import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { clearSessionData, resetSessionCache } from "@/utils/auth";
import { useAuth } from "@/contexts/AuthContext";
import { buildUrl, apiFetch } from "@/config/api";
import {
  Calendar,
  X,
  MapPin,
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Menu,
  Home,
  Users,
  Download,
  ChevronDown,
  LogOut,
  Radio,
  Shield,
  BadgeCheck,
  Instagram,
  Linkedin,
  Facebook,
  Twitter,
  ExternalLink,
  Building2,
  CheckCircle2,
  Globe,
  Camera,
  ImagePlus,
  Upload,
  CupSoda,
  Receipt,
} from "lucide-react";
import FinancialReporting from "./FinancialReporting";
import OrganizerDashboardHome from "./OrganizerDashboardHome";
import AudienceAnalytics from "./AudienceAnalytics";
import MyEvents from "./MyEvents";
import MyBookings from "./MyBookings";
import LiveEvents from "./LiveEvents";
import LiveEventPage from "./LiveEventPage";
import Reception from "./Reception";
import FoodBeverages from "./FoodBeverages";
import OrganizerPayouts from "./OrganizerPayouts";
import EventAttendees from "./EventAttendees";
import EventRefunds from "./EventRefunds";
import Logo from "@/assets/MMP logo.svg";
import {
  deleteOrganizerLogoUpload,
  ORGANIZER_LOGO_HELP_TEXT,
  uploadOrganizerLogo,
  validateOrganizerLogoFile,
} from "@/services/organizerLogoService";
import {
  PHONE_INPUT_PROPS,
  normalizeTenDigitPhoneNumber,
  sanitizeTenDigitPhoneInput,
} from "@/utils/phone";

const sanitizeOwnerProfile = (owner = {}) => ({
  ...(owner || {}),
  phone: sanitizeTenDigitPhoneInput(owner?.phone || ""),
});

// Profile Content Component
const OrganizerProfileContent = ({ user }) => {
  const buildInitialData = (payload = {}, owner = {}) => ({
    id: payload.id || "",
    name: payload.name || "",
    description: payload.description || "",
    gstNumber: payload.gstNumber || "",
    logo: payload.logo || "",
    state: payload.state || "",
    address: payload.address || "",
    isVerified: payload.isVerified ?? false,
    ownerId: payload.ownerId || "",
    createdAt: payload.createdAt || "",
    updatedAt: payload.updatedAt || "",
    contact: sanitizeTenDigitPhoneInput(payload.contact || ""),
    email: payload.email || "",
    instagram: payload.instagram || "",
    linkedin: payload.linkedin || "",
    facebook: payload.facebook || "",
    reddit: payload.reddit || "",
    x: payload.x || "",
    snapchat: payload.snapchat || "",
    ownerName: owner.name || payload.ownerName || "",
    ownerEmail: owner.email || payload.ownerEmail || "",
    ownerPhone: sanitizeTenDigitPhoneInput(owner.phone || payload.contact || payload.ownerPhone || ""),
    ownerAvatar: owner.avatar || "",
    counts: {
      events: payload?._count?.events ?? 0,
      images: payload?._count?.images ?? 0,
      payouts: payload?._count?.payouts ?? 0,
      tours: payload?._count?.tours ?? 0,
      reviews: payload?._count?.reviews ?? 0,
    },
    bankDetails: {
      accountHolder: payload?.bankDetails?.accountHolder || "",
      accountNumber: payload?.bankDetails?.accountNumber || "",
      ifscCode: payload?.bankDetails?.ifscCode || "",
      bankName: payload?.bankDetails?.bankName || "",
      branchName: payload?.bankDetails?.branchName || "",
      providerName: payload?.bankDetails?.providerName || "",
      verificationStatus: payload?.bankDetails?.verificationStatus || "",
      verificationTxnId: payload?.bankDetails?.verificationTxnId || "",
      verificationMethod: payload?.bankDetails?.verificationMethod || "",
      verifiedAt: payload?.bankDetails?.verifiedAt || "",
      verificationFailureReason: payload?.bankDetails?.verificationFailureReason || "",
      lastVerificationRequestedAt: payload?.bankDetails?.lastVerificationRequestedAt || "",
      reviewNotes: payload?.bankDetails?.reviewNotes || "",
      createdAt: payload?.bankDetails?.createdAt || "",
      updatedAt: payload?.bankDetails?.updatedAt || "",
    },
  });

  const [profileData, setProfileData] = useState(() => buildInitialData(user?.organizer || {}, user));
  const [editData, setEditData] = useState(() => buildInitialData(user?.organizer || {}, user));
  const [bankDraft, setBankDraft] = useState(() => buildInitialData(user?.organizer || {}, user).bankDetails);
  const [owner, setOwner] = useState(() => sanitizeOwnerProfile(user));
  const [ownerDraft, setOwnerDraft] = useState(() => sanitizeOwnerProfile(user));
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isOwnerAvatarPickerOpen, setIsOwnerAvatarPickerOpen] = useState(false);
  const [isOwnerCameraOpen, setIsOwnerCameraOpen] = useState(false);
  const [ownerPendingAvatar, setOwnerPendingAvatar] = useState(null);
  const [ownerCapturedPhoto, setOwnerCapturedPhoto] = useState(null);
  const [isOwnerSaving, setIsOwnerSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isBankPanelOpen, setIsBankPanelOpen] = useState(false);
  const [isBankEditing, setIsBankEditing] = useState(false);
  const [bankExists, setBankExists] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [isBankVerifying, setIsBankVerifying] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");

  const ownerVideoRef = useRef(null);
  const ownerCanvasRef = useRef(null);
  const ownerFileInputRef = useRef(null);
  const organizerLogoInputRef = useRef(null);
  const bankVerificationPollRef = useRef(false);

  useEffect(() => {
    const fresh = buildInitialData(user?.organizer || {}, user);
    setProfileData(fresh);
    setEditData(fresh);
    setBankDraft(fresh.bankDetails);
    setOwner(sanitizeOwnerProfile(user));
    setOwnerDraft(sanitizeOwnerProfile(user));
  }, [user]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const fetchProfileData = useCallback(async () => {
    setLoadingProfile(true);
    try {
      // Use user prop from context as owner data
      const ownerData = sanitizeOwnerProfile(user);
      setOwner(ownerData);
      setOwnerDraft(ownerData);

      // Fetch organizer-specific profile data (lazy-loaded)
      const orgRes = await apiFetch("organizer/me/profile", { method: "GET" });
      const organizerPayload = orgRes?.data || orgRes || {};

      const normalized = buildInitialData(organizerPayload, ownerData);
      setProfileData(normalized);
      setEditData(normalized);
      setBankDraft(normalized.bankDetails);
    } catch (error) {
      console.error("Failed to load organizer profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value || "—";
    }
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: field === "contact" ? sanitizeTenDigitPhoneInput(value) : value,
    }));
  };

  const handleOrganizerLogoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await validateOrganizerLogoFile(file);
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } catch (error) {
      if (organizerLogoInputRef.current) {
        organizerLogoInputRef.current.value = "";
      }
      setLogoFile(null);
      setLogoPreview("");
      toast.error(error?.message || "Choose a valid organizer logo.");
    }
  };

  const clearOrganizerLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview("");
    setEditData((prev) => ({ ...prev, logo: "" }));
    if (organizerLogoInputRef.current) {
      organizerLogoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    let uploadedLogoPublicId = null;
    try {
      let nextLogo = editData.logo;
      if (logoFile) {
        const logoUpload = await uploadOrganizerLogo(editData.id, logoFile);
        nextLogo = logoUpload.url;
        uploadedLogoPublicId = logoUpload.publicId;
      }

      const contact = editData.contact?.trim()
        ? normalizeTenDigitPhoneNumber(editData.contact)
        : undefined;
      if (editData.contact?.trim() && !contact) {
        toast.error("Contact number must be exactly 10 digits");
        setIsSaving(false);
        return;
      }

      const allowed = {
        name: editData.name,
        description: editData.description,
        gstNumber: editData.gstNumber,
        instagram: editData.instagram,
        linkedin: editData.linkedin,
        facebook: editData.facebook,
        reddit: editData.reddit,
        x: editData.x,
        snapchat: editData.snapchat,
        contact,
        email: editData.email,
      };
      const payload = Object.fromEntries(
        Object.entries(allowed).filter(
          ([, v]) => v !== undefined && v !== null && String(v).trim() !== ""
        )
      );

      if (logoFile || editData.logo !== profileData.logo) {
        payload.logo = nextLogo || null;
      }

      if (Object.keys(payload).length === 0) {
        toast.info("No profile changes to save.");
        setIsSaving(false);
        return;
      }

      const res = await apiFetch("organizer/me/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = res?.data || res || {};
      const normalized = buildInitialData(data, owner);
      setProfileData(normalized);
      setEditData(normalized);
      setBankDraft(normalized.bankDetails);
      setLogoFile(null);
      setLogoPreview("");
      if (organizerLogoInputRef.current) {
        organizerLogoInputRef.current.value = "";
      }
      setIsEditing(false);
      toast.success("Organizer profile updated");
    } catch (error) {
      if (uploadedLogoPublicId) {
        await deleteOrganizerLogoUpload(uploadedLogoPublicId).catch(() => {});
      }
      console.error("Failed to save organizer profile:", error);
      toast.error(error?.message || "Failed to save organizer profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profileData);
    setLogoFile(null);
    setLogoPreview("");
    if (organizerLogoInputRef.current) {
      organizerLogoInputRef.current.value = "";
    }
  };

  const handleOpenBankPanel = async () => {
    setIsBankLoading(true);
    try {
      const res = await apiFetch("organizer/me/bank-details", { method: "GET" });
      const data = res?.data || res || {};
      const exists = !!(data?.accountHolder || data?.accountNumber);
      setBankExists(exists);
      setBankDraft((prev) => ({ ...prev, ...data }));
      setProfileData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...data } }));
      setEditData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...data } }));
      setIsBankEditing(!exists); // auto-open form when no bank details yet
    } catch (error) {
      console.error("Failed to load bank details:", error);
      setBankDraft(editData.bankDetails);
      setBankExists(false);
      setIsBankEditing(true); // assume no details on error, open form
    } finally {
      setIsBankPanelOpen(true);
      setIsBankLoading(false);
    }
  };

  const handleBankFieldChange = (field, value) => {
    setBankDraft((prev) => ({ ...prev, [field]: value }));
  };

  const mergeBankDetailsState = useCallback((data = {}) => {
    setBankDraft((prev) => ({ ...prev, ...data }));
    setProfileData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...data } }));
    setEditData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...data } }));
  }, []);

  const handleSaveBank = async () => {
    if (isBankSaving) return;
    setIsBankSaving(true);
    try {
      const payload = {
        accountHolder: bankDraft.accountHolder,
        accountNumber: bankDraft.accountNumber,
        ifscCode: bankDraft.ifscCode,
        bankName: bankDraft.bankName,
        branchName: bankDraft.branchName,
      };
      const res = await apiFetch("organizer/me/bank-details", {
        method: bankExists ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      const data = res?.data || res || {};
      setBankExists(true);
      mergeBankDetailsState(data);
      resetSessionCache();
      setIsBankEditing(false);
      setIsBankPanelOpen(false);
    } catch (error) {
      console.error("Failed to save bank details:", error);
    } finally {
      setIsBankSaving(false);
    }
  };

  const handleRequestBankVerification = async () => {
    if (isBankVerifying) return;
    setIsBankVerifying(true);
    try {
      const res = await apiFetch("organizer/me/bank-details/verification/request", {
        method: "POST",
      });
      const data = res?.data?.bankDetails || res?.data || res || {};
      mergeBankDetailsState(data);
      resetSessionCache();
      toast.success(res?.message || "Bank verification requested");
    } catch (error) {
      toast.error(error?.message || "Failed to request bank verification");
    } finally {
      setIsBankVerifying(false);
    }
  };

  const handleCancelBank = () => {
    setBankDraft(profileData.bankDetails);
    setIsBankEditing(false);
    setIsBankPanelOpen(false);
  };

  useEffect(() => {
    if (!isBankPanelOpen || !bankExists || bankDraft.verificationStatus === "VERIFIED") {
      return undefined;
    }

    let cancelled = false;

    const pollBankVerificationStatus = async () => {
      if (bankVerificationPollRef.current || cancelled) return;
      bankVerificationPollRef.current = true;

      try {
        const res = await apiFetch("organizer/me/bank-details/verification/status", {
          method: "GET",
        });
        const payload = res?.data || res || {};
        const data = payload.bankDetails || payload;
        const nextStatus = payload.bankVerificationStatus || data.verificationStatus;

        if (data?.id) {
          mergeBankDetailsState(data);
          resetSessionCache();
        }

        if (nextStatus === "VERIFIED" && bankDraft.verificationStatus !== "VERIFIED") {
          toast.success("Bank verification completed successfully");
        } else if (nextStatus === "FAILED" && bankDraft.verificationStatus !== "FAILED") {
          toast.error(data.verificationFailureReason || "Bank verification failed");
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.message || "Failed to refresh bank verification status");
        }
      } finally {
        bankVerificationPollRef.current = false;
      }
    };

    const intervalId = window.setInterval(pollBankVerificationStatus, 10000);
    pollBankVerificationStatus();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bankDraft.verificationStatus, bankExists, isBankPanelOpen, mergeBankDetailsState]);

  useEffect(() => {
    if (!isOwnerCameraOpen) {
      stopOwnerCameraStream();
      setOwnerCapturedPhoto(null);
    }
  }, [isOwnerCameraOpen]);

  const ownerAvatarOptions = [
    {
      id: "owner-avatar-1",
      label: "Acoustic Dreamer",
      url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Acoustic+Dreamer",
    },
    {
      id: "owner-avatar-2",
      label: "Festival Vibes",
      url: "https://api.dicebear.com/7.x/bottts/svg?seed=Festival+Vibes",
    },
    {
      id: "owner-avatar-3",
      label: "City Explorer",
      url: "https://api.dicebear.com/7.x/micah/svg?seed=City+Explorer",
    },
    {
      id: "owner-avatar-4",
      label: "Night Groove",
      url: "https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Night+Groove",
    },
  ];

  const openOwnerModal = useCallback(() => {
    setOwnerDraft(sanitizeOwnerProfile(owner));
    setIsOwnerModalOpen(true);
  }, [owner]);

  const handleOwnerFieldChange = (field, value) => {
    setOwnerDraft(prev => ({
      ...prev,
      [field]: field === "phone" ? sanitizeTenDigitPhoneInput(value) : value,
    }));
  };

  const handleSaveOwner = async () => {
    setIsOwnerSaving(true);
    try {
      const phone = ownerDraft.phone?.trim()
        ? normalizeTenDigitPhoneNumber(ownerDraft.phone)
        : undefined;
      if (ownerDraft.phone?.trim() && !phone) {
        toast.error("Phone number must be exactly 10 digits");
        return;
      }

      const payload = {
        name: ownerDraft.name,
        email: ownerDraft.email,
        phone,
        avatar: ownerDraft.avatar,
        whatsAppNotification: ownerDraft.whatsAppNotification
      };
      await apiFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      setOwner({ ...ownerDraft, phone: phone || "" });
      setIsOwnerModalOpen(false);
    } catch (error) {
      console.error("Failed to update owner:", error);
    } finally {
      setIsOwnerSaving(false);
    }
  };

  const handleCancelOwner = () => {
    setIsOwnerModalOpen(false);
    setIsOwnerAvatarPickerOpen(false);
    setIsOwnerCameraOpen(false);
    stopOwnerCameraStream();
    setOwnerPendingAvatar(null);
    setOwnerCapturedPhoto(null);
    setOwnerDraft(sanitizeOwnerProfile(owner));
  };

  const openOwnerAvatarPicker = () => {
    setOwnerPendingAvatar(ownerDraft.avatar || owner.avatar || "");
    setIsOwnerAvatarPickerOpen(true);
  };

  const handleOwnerFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setOwnerPendingAvatar(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const startOwnerCamera = async () => {
    try {
      setOwnerCapturedPhoto(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (ownerVideoRef.current) {
        ownerVideoRef.current.srcObject = stream;
        await ownerVideoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const clearOwnerCameraStream = () => {
    const video = ownerVideoRef.current;
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
  };

  const stopOwnerCameraStream = () => {
    clearOwnerCameraStream();
    setOwnerCapturedPhoto(null);
  };

  const captureOwnerPhoto = () => {
    if (!ownerVideoRef.current || !ownerCanvasRef.current) return;
    const video = ownerVideoRef.current;
    const canvas = ownerCanvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setOwnerCapturedPhoto(dataUrl);
    clearOwnerCameraStream();
  };

  const handleOwnerAvatarUseCamera = async () => {
    setIsOwnerCameraOpen(true);
    await startOwnerCamera();
  };

  const handleOwnerAvatarApply = (value) => {
    setOwnerDraft((prev) => ({ ...prev, avatar: value }));
    setOwnerPendingAvatar(value);
    setIsOwnerAvatarPickerOpen(false);
    setIsOwnerCameraOpen(false);
    stopOwnerCameraStream();
  };

  const closeOwnerAvatarPicker = () => {
    setIsOwnerAvatarPickerOpen(false);
    setOwnerPendingAvatar(null);
  };

  const closeOwnerCamera = () => {
    setIsOwnerCameraOpen(false);
    stopOwnerCameraStream();
    setOwnerCapturedPhoto(null);
  };

  const displayedOrganizerLogo = logoPreview || editData.logo;

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">Organizer Profile</p>
          <h2 className="text-3xl font-extrabold">Profile &amp; Payouts</h2>
          <p className="text-sm text-white/60">Keep organizer contact, socials, and payouts current.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenBankPanel}
            disabled={isBankLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            {isBankLoading ? "Loading..." : "Bank Details"}
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition"
            >
              <Edit2 className="w-4 h-4" />
              Edit Organization
            </button>
          )}
        </div>
      </div>

      {/* Owner edit modal */}
      {isOwnerModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl max-h-[88vh] rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-elegant)] ring-1 ring-border/30 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-card/80 backdrop-blur-sm rounded-t-2xl">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Owner</p>
                <h3 className="text-xl font-semibold text-white">Edit Owner Details</h3>
              </div>
              <button onClick={handleCancelOwner} className="text-white/60 hover:text-white rounded-full p-2 hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Name</label>
                  <input
                    type="text"
                    value={ownerDraft.name || ""}
                    onChange={(e) => handleOwnerFieldChange("name", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:border-ring/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Email</label>
                  <input
                    type="email"
                    value={ownerDraft.email || ""}
                    onChange={(e) => handleOwnerFieldChange("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:border-ring/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Phone</label>
                  <div className="flex gap-2">
                    <input
                      {...PHONE_INPUT_PROPS}
                      value={ownerDraft.phone || ""}
                      onChange={(e) => handleOwnerFieldChange("phone", e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:border-ring/50 focus:outline-none transition"
                      placeholder="10 digit phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/70">Avatar</label>
                  <div className="flex items-center gap-3 flex-wrap rounded-xl border border-white/10 bg-white/5/70 px-3 py-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-white/10 bg-white/10 flex items-center justify-center text-sm font-semibold shadow-inner shrink-0">
                      {ownerDraft.avatar ? (
                        <img src={ownerDraft.avatar} alt="Owner avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-white/70">{(ownerDraft.name || ownerDraft.email || "O").slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[260px]">
                      <button
                        type="button"
                        onClick={openOwnerAvatarPicker}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-foreground hover:bg-primary/25 transition font-semibold"
                      >
                        <Edit2 className="w-4 h-4" />
                        Choose avatar
                      </button>
                      <input
                        type="url"
                        value={ownerDraft.avatar || ""}
                        onChange={(e) => handleOwnerFieldChange("avatar", e.target.value)}
                        className="flex-1 min-w-[240px] px-4 py-2.5 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:border-ring/50 focus:outline-none transition"
                        placeholder="https://..."
                      />
                      <p className="text-xs text-white/50 w-full leading-relaxed">Upload, capture, or paste a URL for the owner avatar.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="whatsapp-toggle"
                    type="checkbox"
                    checked={!!ownerDraft.whatsAppNotification}
                    onChange={(e) => handleOwnerFieldChange("whatsAppNotification", e.target.checked)}
                    className="h-4 w-4 rounded border-border/60 bg-background/60 text-accent focus:ring-ring/50"
                  />
                  <label htmlFor="whatsapp-toggle" className="text-sm text-white/80">
                    Enable WhatsApp notifications
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3 bg-white/5/40 backdrop-blur-sm rounded-b-2xl">
              <button
                onClick={handleSaveOwner}
                disabled={isOwnerSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[var(--shadow-card)] hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isOwnerSaving ? (
                  <span className="h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isOwnerSaving ? "Saving..." : "Save Owner"}
              </button>
              <button
                onClick={handleCancelOwner}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Owner avatar picker modal */}
      {isOwnerAvatarPickerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border/60 rounded-2xl w-full max-w-2xl shadow-[var(--shadow-elegant)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Owner</p>
                <h3 className="text-xl font-semibold text-white">Choose Your Avatar</h3>
              </div>
              <button onClick={closeOwnerAvatarPicker} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ownerAvatarOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setOwnerPendingAvatar(option.url)}
                    className={`group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 ${
                      ownerPendingAvatar === option.url ? "border-accent/60 ring-2 ring-accent/30" : ""
                    }`}
                  >
                    <div className="h-20 w-20 rounded-full overflow-hidden border border-white/15 bg-white/10">
                      <img src={option.url} alt={option.label} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-sm font-semibold text-white group-hover:text-accent">{option.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => ownerFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 text-foreground hover:bg-primary/25 transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload from device
                </button>
                <button
                  type="button"
                  onClick={handleOwnerAvatarUseCamera}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-dashed border-white/15 text-white hover:bg-white/10 transition"
                >
                  <Camera className="w-4 h-4" />
                  Use camera
                </button>
                <input
                  ref={ownerFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleOwnerFileChange}
                />
              </div>

              {(ownerPendingAvatar || ownerCapturedPhoto) && (
                <div className="space-y-2 border border-white/10 rounded-lg p-4 bg-white/5">
                  <p className="text-sm text-white/70">Preview &amp; confirm</p>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-white/10 bg-white/10">
                      <img
                        src={ownerCapturedPhoto || ownerPendingAvatar || ownerDraft.avatar || owner.avatar || ""}
                        alt="Selected avatar preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOwnerPendingAvatar(null);
                          setOwnerCapturedPhoto(null);
                        }}
                        className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOwnerAvatarApply(ownerCapturedPhoto || ownerPendingAvatar)}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
                      >
                        Use this avatar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Owner camera modal */}
      {isOwnerCameraOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-[#0b1220] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Owner</p>
                <h3 className="text-xl font-semibold text-white">Capture with Camera</h3>
              </div>
              <button onClick={closeOwnerCamera} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {!ownerCapturedPhoto ? (
                <>
                  <div className="relative w-full">
                    <video ref={ownerVideoRef} className="w-full rounded-xl border border-white/10" autoPlay muted />
                  </div>
                  <canvas ref={ownerCanvasRef} className="hidden" />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={closeOwnerCamera}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={captureOwnerPhoto}
                      className="px-4 py-2 rounded-lg bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition"
                    >
                      Capture
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={ownerCapturedPhoto} alt="Captured" className="w-full rounded-xl border border-white/10 object-contain max-h-96" />
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={startOwnerCamera}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                    >
                      Retake
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleOwnerAvatarApply(ownerCapturedPhoto);
                        closeOwnerCamera();
                      }}
                      className="px-4 py-2 rounded-lg bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover active:bg-primaryCTA-active transition"
                    >
                      Save photo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-[#0f1628] rounded-2xl border border-white/10 shadow-lg shadow-black/30 overflow-hidden backdrop-blur">
        {/* Profile Header Section */}
        <div className="relative px-8 py-8 border-b border-white/10 bg-gradient-to-r from-[#0b1220] via-[#0f172a] to-[#111827]">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_15%_30%,#ffffff,transparent_35%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-white font-bold text-3xl shadow-inner border border-white/10 overflow-hidden">
                {displayedOrganizerLogo ? (
                  <img src={displayedOrganizerLogo} alt={editData.name} className="w-full h-full object-contain p-2" />
                ) : (
                  (editData.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-white space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold">{editData.name}</h2>
                  {editData.isVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-100 text-xs font-semibold border border-emerald-500/30">
                      <BadgeCheck className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-sm leading-relaxed max-w-2xl">{editData.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
              <span className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {editData.email}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="inline-flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {editData.contact}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {editData.state}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 space-y-6 bg-[#0b1220]">
          {loadingProfile ? (
            <div className="text-white/70 text-sm">Loading organizer profile…</div>
          ) : !isEditing ? (
            // View Mode
            <div className="space-y-6">
              {/* Snapshot */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Events", value: editData.counts.events, accent: "text-sky-200", border: "border-sky-500/30" },
                  { label: "Images", value: editData.counts.images, accent: "text-purple-200", border: "border-purple-500/30" },
                  { label: "Payouts", value: editData.counts.payouts, accent: "text-emerald-200", border: "border-emerald-500/30" },
                  { label: "Tours", value: editData.counts.tours, accent: "text-amber-200", border: "border-amber-500/30" },
                  { label: "Reviews", value: editData.counts.reviews, accent: "text-indigo-200", border: "border-indigo-500/30" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border ${stat.border} bg-white/5 p-3 shadow-lg shadow-black/20`}
                  >
                    <p className="text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.accent}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Contact & Location */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Contact &amp; Reach</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
                      <Mail className="w-5 h-5 text-rose-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Email Address</p>
                      <p className="text-base font-semibold text-white mt-1">{editData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                      <Phone className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Contact</p>
                      <p className="text-base font-semibold text-white mt-1">{editData.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                      <MapPin className="w-5 h-5 text-blue-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">State</p>
                      <p className="text-base font-semibold text-white mt-1">{editData.state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                      <Globe className="w-5 h-5 text-indigo-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Address</p>
                      <p className="text-base font-semibold text-white mt-1">{editData.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* GST */}
              {editData.gstNumber && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Tax Information</h3>
                  </div>
                  <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                      <BadgeCheck className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">GST Number</p>
                      <p className="text-base font-semibold text-white mt-1">{editData.gstNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* About */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">About Organizer</h3>
                <p className="text-white/80 leading-relaxed bg-white/5 border border-white/10 p-4 rounded-xl">
                  {editData.description}
                </p>
              </div>

              {/* Owner Snapshot */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {owner?.avatar ? (
                      <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                    ) : (
                      (owner?.name || "O").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Owner</p>
                    <p className="text-base font-semibold text-white">{owner?.name || "—"}</p>
                    <p className="text-xs text-white/60">{owner?.email}</p>
                  </div>
                </div>
                <div className="text-sm text-white/70 flex flex-wrap gap-3">
                  {owner?.phone && (
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                      <Phone className="w-4 h-4" />
                      {owner.phone}
                    </span>
                  )}
                  <button
                    onClick={openOwnerModal}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Owner
                  </button>
                </div>
              </div>

              {/* Socials */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Social Handles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Instagram", value: editData.instagram, icon: <Instagram className="w-4 h-4" /> },
                    { label: "LinkedIn", value: editData.linkedin, icon: <Linkedin className="w-4 h-4" /> },
                    { label: "Facebook", value: editData.facebook, icon: <Facebook className="w-4 h-4" /> },
                    { label: "X (Twitter)", value: editData.x, icon: <Twitter className="w-4 h-4" /> },
                    { label: "Reddit", value: editData.reddit, icon: <Users className="w-4 h-4" /> },
                    { label: "Snapchat", value: editData.snapchat, icon: <User className="w-4 h-4" /> },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.value || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 hover:bg-white/10 transition"
                    >
                      <span className="flex items-center gap-2">
                        {social.icon}
                        {social.label}
                      </span>
                      <ExternalLink className="w-4 h-4 text-white/50" />
                    </a>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 border-b border-white/10 pb-6">
                <div className="w-28 h-28 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {displayedOrganizerLogo ? (
                    <img
                      src={displayedOrganizerLogo}
                      alt="Organizer logo preview"
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <ImagePlus className="w-9 h-9 text-white/35" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-white/80">Organizer Logo</p>
                    <p className="text-xs text-white/50 mt-1">{ORGANIZER_LOGO_HELP_TEXT}</p>
                  </div>
                  <input
                    ref={organizerLogoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleOrganizerLogoChange}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => organizerLogoInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/15 transition"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    {displayedOrganizerLogo && (
                      <button
                        type="button"
                        onClick={clearOrganizerLogoSelection}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                      >
                        <X className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Organizer Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Email Address</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">Contact</label>
                  <input
                    {...PHONE_INPUT_PROPS}
                    value={editData.contact}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                    placeholder="10 digit contact number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">GST Number</label>
                  <input
                    type="text"
                    value={editData.gstNumber}
                    onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-white/80">Description</label>
                  <textarea
                    value={editData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none min-h-[120px]"
                    maxLength={2000}
                  />
                </div>
              </div>

              {/* Socials edit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Social Handles</h3>
                  <span className="text-xs text-white/50">Share reachable links</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "instagram", label: "Instagram URL" },
                    { key: "linkedin", label: "LinkedIn URL" },
                    { key: "facebook", label: "Facebook URL" },
                    { key: "x", label: "X (Twitter) URL" },
                    { key: "reddit", label: "Reddit handle or URL" },
                    { key: "snapchat", label: "Snapchat handle" },
                  ].map((social) => (
                    <div className="space-y-2" key={social.key}>
                      <label className="block text-sm font-medium text-white/80">{social.label}</label>
                      <input
                        type="text"
                        value={editData[social.key]}
                        onChange={(e) => handleInputChange(social.key, e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? (logoFile ? "Saving Logo..." : "Saving...") : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bank detail slide-over */}
      {isBankPanelOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCancelBank} />
          <div className="relative ml-auto h-full w-full max-w-lg bg-card border-l border-border/60 shadow-[var(--shadow-elegant)] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border/60 bg-card/80">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Payouts</p>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  {bankExists ? "Bank Details" : "Add Bank Details"}
                </h2>
              </div>
              <button onClick={handleCancelBank} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Provider / Status — only shown when bank details exist */}
              {bankExists && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Provider</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-accent" />
                      {bankDraft.providerName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Status</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      {bankDraft.verificationStatus}
                    </p>
                  </div>
                </div>
              )}

              {bankExists && bankDraft.verificationStatus !== "VERIFIED" && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 space-y-3 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                  <div>
                    <p className="text-sm font-medium text-amber-200">Bank verification required</p>
                    <p className="text-xs text-white/55 mt-0.5">
                      Payouts stay locked until this account is verified.
                    </p>
                    {bankDraft.verificationFailureReason && (
                      <p className="text-xs text-red-300 mt-2">{bankDraft.verificationFailureReason}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestBankVerification}
                    disabled={isBankVerifying || bankDraft.verificationStatus === "VERIFICATION_IN_PROGRESS"}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-300 text-black text-sm font-semibold hover:bg-amber-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isBankVerifying
                      ? "Requesting..."
                      : bankDraft.verificationStatus === "VERIFICATION_IN_PROGRESS"
                        ? "Verification In Progress"
                        : "Verify Now"}
                  </button>
                </div>
              )}

              {bankExists && bankDraft.verificationStatus === "VERIFIED" && (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                  <p className="text-sm font-medium text-emerald-200">Bank account verified</p>
                  <p className="text-xs text-white/55 mt-0.5">
                    {bankDraft.verifiedAt ? `Verified on ${formatDate(bankDraft.verifiedAt)}` : "Ready for payout operations"}
                  </p>
                </div>
              )}

              {/* Prompt when no bank details */}
              {!bankExists && (
                <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-accent">No bank details added</p>
                    <p className="text-xs text-white/50 mt-0.5">Fill in the form below to set up your payout account.</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                {bankExists && (
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Account</h4>
                    <span className="text-xs text-white/60">Txn: {bankDraft.verificationTxnId}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: "accountHolder", label: "Account Holder" },
                    { key: "bankName", label: "Bank Name" },
                    { key: "branchName", label: "Branch Name" },
                    { key: "accountNumber", label: "Account Number" },
                    { key: "ifscCode", label: "IFSC Code" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-xs uppercase tracking-wide text-white/50">{field.label}</p>
                      {isBankEditing ? (
                        <input
                          type="text"
                          value={bankDraft[field.key]}
                          onChange={(e) => handleBankFieldChange(field.key, e.target.value)}
                          className="mt-1 w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none"
                        />
                      ) : (
                        <p className="text-base font-semibold text-white mt-1">{bankDraft[field.key]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Created / Updated — only shown when bank details exist */}
              {bankExists && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Created</p>
                    <p className="text-base font-semibold text-white">{formatDate(bankDraft.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-wide text-white/50">Updated</p>
                    <p className="text-base font-semibold text-white">{formatDate(bankDraft.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-white/5 flex items-center gap-3">
              {isBankEditing ? (
                <>
                  <button
                    onClick={handleSaveBank}
                    disabled={isBankSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isBankSaving ? "Saving…" : bankExists ? "Save Bank Details" : "Add Bank Details"}
                  </button>
                  <button
                    onClick={handleCancelBank}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsBankEditing(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-foreground hover:bg-primary/25 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Bank Details
                  </button>
                  <button
                    onClick={handleCancelBank}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrganizerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const footerMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { id: liveEventId } = useParams();

  // Close footer menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(e.target)) {
        setFooterMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Note: Authentication is handled by ProtectedRoute wrapper
  // No need for redundant auth check here

  // User data from auth context (populated by AuthProvider on app load)
  const { user: authUser, logout: contextLogout } = useAuth();
  const user = {
    name: authUser?.name || "Organizer",
    email: authUser?.email || "",
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await contextLogout();
    navigate("/");
    setIsLoggingOut(false);
  };


  // Navigation items with their corresponding tab values
  const navItems = [
    { id: "dashboard", name: "Dashboard", icon: <Home className="w-6 h-6 mr-3" /> },
    { id: "myevents", name: "My Events", icon: <Calendar className="w-6 h-6 mr-3" /> },
    { id: "bookings", name: "My Bookings", icon: <Receipt className="w-6 h-6 mr-3" /> },
    { id: "analytics", name: "Audience Analytics", icon: <Users className="w-6 h-6 mr-3" /> },
    { id: "live", name: "Live Events", icon: <Radio className="w-6 h-6 mr-3" /> },
    { id: "reception", name: "Reception", icon: <Shield className="w-6 h-6 mr-3" /> },
    { id: "food-beverages", name: "Food & Beverages", icon: <CupSoda className="w-6 h-6 mr-3" /> },
    { id: "payouts", name: "Payouts", icon: <CreditCard className="w-6 h-6 mr-3" /> },
    // { id: "financial", name: "Financial Reporting", icon: <Download className="w-6 h-6 mr-3" /> },
  ];

  // Sync active tab from URL
  useEffect(() => {
    const path = location.pathname || "";
    if (path.startsWith("/organizer/myevents")) setActiveTab("myevents");
    else if (path.startsWith("/organizer/bookings")) setActiveTab("bookings");
    else if (path.startsWith("/organizer/analytics")) setActiveTab("analytics");
    else if (path.startsWith("/organizer/live")) setActiveTab("live");
    else if (path.startsWith("/organizer/reception")) setActiveTab("reception");
    else if (path.startsWith("/organizer/food-beverages")) setActiveTab("food-beverages");
    else if (path.startsWith("/organizer/payouts")) setActiveTab("payouts");
    else if (path.startsWith("/organizer/events") && path.includes("/attendees")) setActiveTab("attendees");
    else if (path.startsWith("/organizer/events") && path.includes("/refunds")) setActiveTab("refunds");
    else if (path.startsWith("/organizer/financial")) setActiveTab("financial");
    else if (path.startsWith("/organizer/profile")) setActiveTab("profile");
    else setActiveTab("dashboard");
  }, [location.pathname]);

  const handleNav = (id) => {
    setActiveTab(id);
    const base =
      id === "dashboard"
        ? "/organizer/dashboard"
        : id === "profile"
        ? "/organizer/profile"
        : `/organizer/${id}`;
    navigate(base);
  };

  return (
    <div className="organizer-dashboard-theme dashboard-theme flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-24"} bg-sidebar border-r border-sidebar-border/60 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className={`${sidebarOpen ? "block" : "hidden"} hover:opacity-80 transition flex items-center gap-3`}
          >
            <img src={Logo} alt="MapMyParty" className="h-10 w-auto" />
            <span className="font-league-gothic text-xl font-bold text-white tracking-[0.02em] leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MapMyParty</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-white/80"
          >
            {sidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition ${
                  activeTab === item.id
                    ? "text-white bg-white/10 border border-white/10 shadow-lg shadow-black/20"
                    : "text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="mr-3 text-white/80">{item.icon}</span>
                {sidebarOpen && item.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer with profile + logout */}
        <div className="mt-auto p-4 border-t border-white/10">
          <div
            ref={footerMenuRef}
            className="relative bg-gradient-to-br from-white/5 via-white/0 to-blue-500/5 border border-white/10 rounded-xl p-3 shadow-lg shadow-black/20"
          >
            <button
              onClick={() => setFooterMenuOpen((v) => !v)}
              className="flex items-center gap-3 w-full text-left hover:bg-white/5 transition rounded-lg px-2 py-1"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 via-blue-500/30 to-red-500/30 flex items-center justify-center text-red-100 font-semibold border border-white/10">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.name || "Organizer"}</p>
                </div>
              )}
              {sidebarOpen && (
                <ChevronDown
                  className={`w-4 h-4 text-white/70 transition-transform ${
                    footerMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {footerMenuOpen && (
              <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-20">
                <div className="rounded-xl border border-sidebar-border/60 bg-sidebar/95 backdrop-blur-md shadow-[var(--shadow-card)] p-2 space-y-2">
                  <button
                    onClick={() => {
                      setFooterMenuOpen(false);
                      handleNav("profile");
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                  >
                    <User className="w-4 h-4" />
                    {sidebarOpen && <span>My Profile</span>}
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 hover:bg-red-500/20 transition disabled:opacity-60"
                  >
                    {isLoggingOut ? (
                      <span className="h-4 w-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    {sidebarOpen && <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Tab Content */}
          <div className="p-4 lg:p-5 space-y-5">
            {activeTab === "dashboard" && (
              <OrganizerDashboardHome
                user={user}
                handleLogout={handleLogout}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
              />
            )}

            {activeTab === "myevents" && <MyEvents />}
            {activeTab === "bookings" && (
              <MyBookings browseEventsPath="/browse-events" showSummarySections={false} />
            )}
            {activeTab === "analytics" && <AudienceAnalytics />}
            {activeTab === "live" && !liveEventId && <LiveEvents />}
            {activeTab === "live" && liveEventId && <LiveEventPage embedded />}
            {activeTab === "reception" && <Reception />}
            {activeTab === "food-beverages" && <FoodBeverages />}
            {activeTab === "payouts" && <OrganizerPayouts />}
            {activeTab === "attendees" && <EventAttendees />}
            {activeTab === "refunds" && <EventRefunds />}
            {activeTab === "financial" && <FinancialReporting />}
            {activeTab === "profile" && <OrganizerProfileContent user={user} />}
          </div>
        </main>
      </div>

    </div>
    
  );
}

export default OrganizerDashboard;
