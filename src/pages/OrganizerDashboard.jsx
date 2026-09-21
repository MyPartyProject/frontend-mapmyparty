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
  LifeBuoy,
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
      accountNumber: "",
      accountNumberMasked: payload?.bankDetails?.accountNumberMasked || "",
      ifscCode: payload?.bankDetails?.ifscCode || "",
      bankName: payload?.bankDetails?.bankName || "",
      branchName: payload?.bankDetails?.branchName || "",
      providerName: payload?.bankDetails?.providerName || "",
      verificationStatus: payload?.bankDetails?.verificationStatus || "",
      verificationTxnId: payload?.bankDetails?.verificationTxnId || "",
      verificationMethod: payload?.bankDetails?.verificationMethod || "",
      verifiedAt: payload?.bankDetails?.verifiedAt || "",
      verificationFailureReason: payload?.bankDetails?.verificationFailureReason || "",
      beneficiaryStatus: payload?.bankDetails?.beneficiaryStatus || "NOT_PROVISIONED",
      payoutEnabled: Boolean(payload?.bankDetails?.payoutEnabled),
      payoutCoolingOffUntil: payload?.bankDetails?.payoutCoolingOffUntil || "",
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
  const [bankPassword, setBankPassword] = useState("");
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
    let uploadedLogoStorageKey = null;
    try {
      let nextLogo = editData.logo;
      if (logoFile) {
        const logoUpload = await uploadOrganizerLogo(editData.id, logoFile);
        nextLogo = logoUpload.url;
        uploadedLogoStorageKey = logoUpload.storageKey || logoUpload.key || logoUpload.publicId;
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
        if (uploadedLogoStorageKey) {
          payload.logoStorageKey = uploadedLogoStorageKey;
        }
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
      if (uploadedLogoStorageKey) {
        await deleteOrganizerLogoUpload(uploadedLogoStorageKey).catch(() => {});
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
      const exists = Boolean(data?.id);
      setBankExists(exists);
      setBankDraft((prev) => ({ ...prev, ...data, accountNumber: "" }));
      setProfileData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...data } }));
      setEditData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, ...data } }));
      setIsBankEditing(!exists); // auto-open form when no bank details yet
      setIsBankPanelOpen(true);
    } catch (error) {
      if (error?.status !== 404) {
        toast.error(error?.message || "Failed to load bank details");
        return;
      }
      setBankDraft({ ...editData.bankDetails, accountNumber: "" });
      setBankExists(false);
      setIsBankEditing(true);
      setIsBankPanelOpen(true);
    } finally {
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
    const accountHolder = bankDraft.accountHolder.trim();
    const accountNumber = bankDraft.accountNumber.trim();
    const ifscCode = bankDraft.ifscCode.trim().toUpperCase();
    if (!accountHolder || !ifscCode || (!bankExists && !accountNumber)) {
      toast.error("Enter the account holder, account number, and IFSC");
      return;
    }
    const payload = bankExists ? {
      ...(accountHolder !== profileData.bankDetails.accountHolder ? { accountHolder } : {}),
      ...(accountNumber ? { accountNumber } : {}),
      ...(ifscCode !== profileData.bankDetails.ifscCode ? { ifscCode } : {}),
    } : { accountHolder, accountNumber, ifscCode };
    if (bankExists && !Object.keys(payload).length) {
      toast.info("No bank details changed");
      return;
    }
    if (bankExists) {
      if (!bankPassword) {
        toast.error("Enter your current password to change payout details");
        return;
      }
      payload.currentPassword = bankPassword;
    }
    setIsBankSaving(true);
    try {
      const res = await apiFetch("organizer/me/bank-details", {
        method: bankExists ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      const data = res?.data || res || {};
      setBankExists(true);
      mergeBankDetailsState({ ...data, accountNumber: "" });
      setBankPassword("");
      resetSessionCache();
      setIsBankEditing(false);
      toast.success(res?.message || "Bank details saved");
    } catch (error) {
      toast.error(error?.message || "Failed to save bank details");
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
      if (error?.status === 409) await handleOpenBankPanel();
    } finally {
      setIsBankVerifying(false);
    }
  };

  const handleRefreshBankVerificationStatus = async () => {
    try {
      const res = await apiFetch("organizer/me/bank-details/verification/status", { method: "GET" });
      mergeBankDetailsState(res?.data?.bankDetails || res?.data || res || {});
    } catch (error) {
      toast.error(error?.message || "Failed to refresh bank verification status");
    }
  };

  const handleCancelBank = () => {
    setBankDraft(profileData.bankDetails);
    setBankPassword("");
    setIsBankEditing(false);
    setIsBankPanelOpen(false);
  };

  useEffect(() => {
    if (!isBankPanelOpen || !bankExists || isBankEditing || bankDraft.verificationStatus !== "VERIFICATION_IN_PROGRESS") {
      return undefined;
    }

    let cancelled = false;
    let checks = 0;

    const pollBankVerificationStatus = async () => {
      if (bankVerificationPollRef.current || cancelled) return;
      bankVerificationPollRef.current = true;
      checks += 1;

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
        if (checks >= 8) window.clearInterval(intervalId);
      }
    };

    const intervalId = window.setInterval(pollBankVerificationStatus, 15000);
    pollBankVerificationStatus();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [bankDraft.verificationStatus, bankExists, isBankEditing, isBankPanelOpen, mergeBankDetailsState]);

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
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Organizer Profile</p>
          <h2 className="text-3xl font-extrabold">Profile &amp; Payouts</h2>
          <p className="text-sm text-muted-foreground">Keep organizer contact, socials, and payouts current.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenBankPanel}
            disabled={isBankLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primaryCTA text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primaryCTA-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4" />
            {isBankLoading ? "Loading..." : "Bank Details"}
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
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
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Owner</p>
                <h3 className="text-xl font-semibold text-foreground">Edit Owner Details</h3>
              </div>
              <button onClick={handleCancelOwner} className="text-muted-foreground hover:text-foreground rounded-full p-2 hover:bg-muted transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Name</label>
                  <input
                    type="text"
                    value={ownerDraft.name || ""}
                    onChange={(e) => handleOwnerFieldChange("name", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:border-ring/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={ownerDraft.email || ""}
                    onChange={(e) => handleOwnerFieldChange("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:border-ring/50 focus:outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Phone</label>
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
                  <label className="text-sm text-muted-foreground">Avatar</label>
                  <div className="flex items-center gap-3 flex-wrap rounded-xl border border-border bg-muted/70 px-3 py-3">
                    <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center text-sm font-semibold shadow-inner shrink-0">
                      {ownerDraft.avatar ? (
                        <img src={ownerDraft.avatar} alt="Owner avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-muted-foreground">{(ownerDraft.name || ownerDraft.email || "O").slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[260px]">
                      <button
                        type="button"
                        onClick={openOwnerAvatarPicker}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 text-foreground hover:bg-primaryCTA-hover transition font-semibold"
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
                      <p className="text-xs text-muted-foreground w-full leading-relaxed">Upload, capture, or paste a URL for the owner avatar.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="whatsapp-toggle"
                    type="checkbox"
                    checked={!!ownerDraft.whatsAppNotification}
                    onChange={(e) => handleOwnerFieldChange("whatsAppNotification", e.target.checked)}
                    className="h-4 w-4 rounded border-border/60 bg-background/60 text-accent-foreground focus:ring-ring/50"
                  />
                  <label htmlFor="whatsapp-toggle" className="text-sm text-muted-foreground">
                    Enable WhatsApp notifications
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center gap-3 bg-muted/40 backdrop-blur-sm rounded-b-2xl">
              <button
                onClick={handleSaveOwner}
                disabled={isOwnerSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primaryCTA text-primary-foreground font-semibold shadow-[var(--shadow-card)] hover:bg-primaryCTA-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isOwnerSaving ? (
                  <span className="h-4 w-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isOwnerSaving ? "Saving..." : "Save Owner"}
              </button>
              <button
                onClick={handleCancelOwner}
                className="px-4 py-3 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Owner</p>
                <h3 className="text-xl font-semibold text-foreground">Choose Your Avatar</h3>
              </div>
              <button onClick={closeOwnerAvatarPicker} className="text-muted-foreground hover:text-foreground">
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
                    className={`group flex flex-col items-center gap-2 rounded-xl border border-border bg-muted p-4 transition-all hover:bg-muted ${
                      ownerPendingAvatar === option.url ? "border-accent/60 ring-2 ring-accent/30" : ""
                    }`}
                  >
                    <div className="h-20 w-20 rounded-full overflow-hidden border border-border bg-muted">
                      <img src={option.url} alt={option.label} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-accent-foreground">{option.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => ownerFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/15 border border-primary/30 text-foreground hover:bg-primaryCTA-hover transition"
                >
                  <Upload className="w-4 h-4" />
                  Upload from device
                </button>
                <button
                  type="button"
                  onClick={handleOwnerAvatarUseCamera}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted border border-dashed border-border text-foreground hover:bg-muted transition"
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
                <div className="space-y-2 border border-border rounded-lg p-4 bg-muted">
                  <p className="text-sm text-muted-foreground">Preview &amp; confirm</p>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full overflow-hidden border border-border bg-muted">
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
                        className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground hover:bg-muted transition"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOwnerAvatarApply(ownerCapturedPhoto || ownerPendingAvatar)}
                        className="px-3 py-2 rounded-lg bg-primaryCTA text-primary-foreground hover:bg-primaryCTA-hover transition"
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
          <div className="bg-background border border-border rounded-2xl w-full max-w-xl shadow-2xl shadow-black/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Owner</p>
                <h3 className="text-xl font-semibold text-foreground">Capture with Camera</h3>
              </div>
              <button onClick={closeOwnerCamera} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {!ownerCapturedPhoto ? (
                <>
                  <div className="relative w-full">
                    <video ref={ownerVideoRef} className="w-full rounded-xl border border-border" autoPlay muted />
                  </div>
                  <canvas ref={ownerCanvasRef} className="hidden" />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={closeOwnerCamera}
                      className="px-4 py-2 rounded-lg bg-muted border border-border text-foreground hover:bg-muted transition"
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
                  <img src={ownerCapturedPhoto} alt="Captured" className="w-full rounded-xl border border-border object-contain max-h-96" />
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      type="button"
                      onClick={startOwnerCamera}
                      className="px-4 py-2 rounded-lg bg-muted border border-border text-foreground hover:bg-muted transition"
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
      <div className="bg-card rounded-2xl border border-border shadow-lg shadow-black/5 overflow-hidden backdrop-blur">
        {/* Profile Header Section */}
        <div className="relative px-8 py-8 border-b border-border bg-gradient-to-r from-background via-surface to-surface">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_15%_30%,#ffffff,transparent_35%)]" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-foreground font-bold text-3xl shadow-inner border border-border overflow-hidden">
                {displayedOrganizerLogo ? (
                  <img src={displayedOrganizerLogo} alt={editData.name} className="w-full h-full object-contain p-2" />
                ) : (
                  (editData.name || "U").charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-foreground space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold">{editData.name}</h2>
                  {editData.isVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-100 text-xs font-semibold border border-emerald-500/30">
                      <BadgeCheck className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{editData.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              <span className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {editData.email}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted" />
              <span className="inline-flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {editData.contact}
              </span>
              <span className="h-1 w-1 rounded-full bg-muted" />
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {editData.state}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8 space-y-6 bg-background">
          {loadingProfile ? (
            <div className="text-muted-foreground text-sm">Loading organizer profile…</div>
          ) : !isEditing ? (
            // View Mode
            <div className="space-y-6">
              {/* Snapshot */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Events", value: editData.counts.events, accent: "text-sky-200", border: "border-sky-500/30" },
                  { label: "Images", value: editData.counts.images, accent: "text-accent-foreground", border: "border-purple-500/30" },
                  { label: "Payouts", value: editData.counts.payouts, accent: "text-success", border: "border-emerald-500/30" },
                  { label: "Tours", value: editData.counts.tours, accent: "text-warning", border: "border-amber-500/30" },
                  { label: "Reviews", value: editData.counts.reviews, accent: "text-indigo-200", border: "border-indigo-500/30" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border ${stat.border} bg-muted p-3 shadow-lg shadow-black/5`}
                  >
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
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
                  <div className="flex items-start gap-3 bg-muted border border-border rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 border border-rose-500/30">
                      <Mail className="w-5 h-5 text-rose-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Email Address</p>
                      <p className="text-base font-semibold text-foreground mt-1">{editData.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-muted border border-border rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                      <Phone className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Contact</p>
                      <p className="text-base font-semibold text-foreground mt-1">{editData.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-muted border border-border rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                      <MapPin className="w-5 h-5 text-blue-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">State</p>
                      <p className="text-base font-semibold text-foreground mt-1">{editData.state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-muted border border-border rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/30">
                      <Globe className="w-5 h-5 text-indigo-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                      <p className="text-base font-semibold text-foreground mt-1">{editData.address}</p>
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
                  <div className="flex items-start gap-3 bg-muted border border-border rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                      <BadgeCheck className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">GST Number</p>
                      <p className="text-base font-semibold text-foreground mt-1">{editData.gstNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* About */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">About Organizer</h3>
                <p className="text-muted-foreground leading-relaxed bg-muted border border-border p-4 rounded-xl">
                  {editData.description}
                </p>
              </div>

              {/* Owner Snapshot */}
              <div className="rounded-2xl border border-border bg-muted p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold overflow-hidden">
                    {owner?.avatar ? (
                      <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover" />
                    ) : (
                      (owner?.name || "O").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Owner</p>
                    <p className="text-base font-semibold text-foreground">{owner?.name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{owner?.email}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  {owner?.phone && (
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border">
                      <Phone className="w-4 h-4" />
                      {owner.phone}
                    </span>
                  )}
                  <button
                    onClick={openOwnerModal}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-foreground hover:bg-muted transition"
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
                      className="flex items-center justify-between gap-3 bg-muted border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-muted transition"
                    >
                      <span className="flex items-center gap-2">
                        {social.icon}
                        {social.label}
                      </span>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 border-b border-border pb-6">
                <div className="w-28 h-28 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                  {displayedOrganizerLogo ? (
                    <img
                      src={displayedOrganizerLogo}
                      alt="Organizer logo preview"
                      className="w-full h-full object-contain p-3"
                    />
                  ) : (
                    <ImagePlus className="w-9 h-9 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organizer Logo</p>
                    <p className="text-xs text-muted-foreground mt-1">{ORGANIZER_LOGO_HELP_TEXT}</p>
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Logo
                    </button>
                    {displayedOrganizerLogo && (
                      <button
                        type="button"
                        onClick={clearOrganizerLogoSelection}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
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
                  <label className="block text-sm font-medium text-muted-foreground">Organizer Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">Contact</label>
                  <input
                    {...PHONE_INPUT_PROPS}
                    value={editData.contact}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                    placeholder="10 digit contact number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">GST Number</label>
                  <input
                    type="text"
                    value={editData.gstNumber}
                    onChange={(e) => handleInputChange("gstNumber", e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/60 focus:outline-none"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground">Description</label>
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
                  <span className="text-xs text-muted-foreground">Share reachable links</span>
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
                      <label className="block text-sm font-medium text-muted-foreground">{social.label}</label>
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primaryCTA text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primaryCTA-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? (logoFile ? "Saving Logo..." : "Saving...") : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
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
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Payouts</p>
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent-foreground" />
                  {bankExists ? "Bank Details" : "Add Bank Details"}
                </h2>
              </div>
              <button onClick={handleCancelBank} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Provider / Status — only shown when bank details exist */}
              {bankExists && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Provider</p>
                    <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-accent-foreground" />
                      {bankDraft.providerName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent-foreground" />
                      {bankDraft.verificationStatus}
                    </p>
                  </div>
                </div>
              )}

              {bankExists && bankDraft.verificationStatus !== "VERIFIED" && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 space-y-3 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                  <div>
                    <p className="text-sm font-medium text-warning">Bank verification required</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Payouts stay locked until this account is verified.
                    </p>
                    {bankDraft.verificationFailureReason && (
                      <p className="text-xs text-destructive mt-2">{bankDraft.verificationFailureReason}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestBankVerification}
                    disabled={isBankEditing || isBankVerifying || bankDraft.verificationStatus === "VERIFICATION_IN_PROGRESS"}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-300 text-black text-sm font-semibold hover:bg-amber-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isBankEditing
                      ? "Save changes first"
                      : isBankVerifying
                      ? "Requesting..."
                      : bankDraft.verificationStatus === "VERIFICATION_IN_PROGRESS"
                        ? "Verification In Progress"
                        : "Verify Now"}
                  </button>
                  <button type="button" onClick={handleRefreshBankVerificationStatus} disabled={isBankEditing}
                    className="ml-2 inline-flex items-center justify-center px-3 py-2 rounded-lg border border-border text-foreground text-sm disabled:opacity-60">
                    Refresh status
                  </button>
                </div>
              )}

              {bankExists && bankDraft.verificationStatus === "VERIFIED" && bankDraft.payoutEnabled && (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 animate-in fade-in-0 slide-in-from-right-2 duration-300">
                  <p className="text-sm font-medium text-success">Bank account verified</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {bankDraft.verifiedAt ? `Verified on ${formatDate(bankDraft.verifiedAt)} and ready for payout` : "Ready for payout operations"}
                  </p>
                </div>
              )}

              {bankExists && bankDraft.verificationStatus === "VERIFIED" && !bankDraft.payoutEnabled && (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-warning">Bank verified; payouts still on hold</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {bankDraft.payoutCoolingOffUntil && new Date(bankDraft.payoutCoolingOffUntil) > new Date()
                        ? `Payouts are held until ${formatDate(bankDraft.payoutCoolingOffUntil)}.`
                        : `Cashfree beneficiary status: ${bankDraft.beneficiaryStatus || "Pending"}`}
                  </p>
                </div>
              )}

              {/* Prompt when no bank details */}
              {!bankExists && (
                <div className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-accent-foreground">No bank details added</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Fill in the form below to set up your payout account.</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted p-4 space-y-3">
                {bankExists && (
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Account</h4>
                    <span className="text-xs text-muted-foreground">{bankDraft.accountNumberMasked || "New account"}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: "accountHolder", label: "Account Holder" },
                    { key: "accountNumber", label: "Account Number" },
                    { key: "ifscCode", label: "IFSC Code" },
                  ].map((field) => (
                    <div key={field.key}>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{field.label}</p>
                      {isBankEditing ? (
                        <input
                          type="text"
                          value={bankDraft[field.key] || ""}
                          placeholder={field.key === "accountNumber" && bankExists ? "Enter a new account number only to replace it" : ""}
                          onChange={(e) => handleBankFieldChange(field.key, field.key === "ifscCode" ? e.target.value.toUpperCase() : e.target.value)}
                          autoComplete={field.key === "accountNumber" ? "off" : undefined}
                          required={!bankExists || field.key !== "accountNumber"}
                          className="mt-1 w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none"
                        />
                      ) : (
                        <p className="text-base font-semibold text-foreground mt-1">
                          {field.key === "accountNumber" ? bankDraft.accountNumberMasked : bankDraft[field.key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {isBankEditing && bankExists && (
                  <div>
                    <label htmlFor="bank-current-password" className="text-xs uppercase tracking-wide text-muted-foreground">Current password</label>
                    <input id="bank-current-password" type="password" autoComplete="current-password" value={bankPassword}
                      onChange={(e) => setBankPassword(e.target.value)}
                      className="mt-1 w-full px-4 py-2 rounded-lg bg-background/60 border border-border/60 text-foreground focus:ring-2 focus:ring-ring/50 focus:outline-none" />
                    <p className="mt-1 text-xs text-muted-foreground">Changing the payout destination requires your password. The new account must be verified before payouts can resume.</p>
                  </div>
                )}
              </div>

              {/* Created / Updated — only shown when bank details exist */}
              {bankExists && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-muted p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Created</p>
                    <p className="text-base font-semibold text-foreground">{formatDate(bankDraft.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Updated</p>
                    <p className="text-base font-semibold text-foreground">{formatDate(bankDraft.updatedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted flex items-center gap-3">
              {isBankEditing ? (
                <>
                  <button
                    onClick={handleSaveBank}
                    disabled={isBankSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primaryCTA text-primary-foreground shadow-[var(--shadow-card)] hover:bg-primaryCTA-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isBankSaving ? "Saving…" : bankExists ? "Save Bank Details" : "Add Bank Details"}
                  </button>
                  <button
                    onClick={handleCancelBank}
                    className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setBankDraft({ ...profileData.bankDetails, accountNumber: "" }); setIsBankEditing(true); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border border-primary/30 text-foreground hover:bg-primaryCTA-hover transition"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Bank Details
                  </button>
                  <button
                    onClick={handleCancelBank}
                    className="px-4 py-2 rounded-xl bg-muted border border-border text-foreground hover:bg-muted transition"
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
    { id: "support", name: "Support", icon: <LifeBuoy className="w-6 h-6 mr-3" /> },
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
    else if (path.startsWith("/organizer/support")) setActiveTab("support");
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
        : id === "support"
        ? "/organizer/support"
        : `/organizer/${id}`;
    navigate(base);
  };

  return (
    <div className="organizer-dashboard-theme dashboard-theme flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-24"} bg-sidebar border-r border-sidebar-border/60 flex flex-col transition-all duration-300`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className={`${sidebarOpen ? "block" : "hidden"} hover:opacity-80 transition flex items-center gap-3`}
          >
            <img src={Logo} alt="MapMyParty" className="h-10 w-auto" />
            <span className="font-sans text-xl font-bold text-inverse tracking-[0.02em] leading-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MapMyParty</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
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
                    ? "text-foreground bg-muted border border-border shadow-lg shadow-black/5"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <span className="mr-3 text-muted-foreground">{item.icon}</span>
                {sidebarOpen && item.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Sidebar Footer with profile + logout */}
        <div className="mt-auto p-4 border-t border-border">
          <div
            ref={footerMenuRef}
            className="relative bg-gradient-to-br from-white/5 via-white/0 to-blue-500/5 border border-border rounded-xl p-3 shadow-lg shadow-black/5"
          >
            <button
              onClick={() => setFooterMenuOpen((v) => !v)}
              className="flex items-center gap-3 w-full text-left hover:bg-muted transition rounded-lg px-2 py-1"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 via-blue-500/30 to-red-500/30 flex items-center justify-center text-red-100 font-semibold border border-border">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name || "Organizer"}</p>
                </div>
              )}
              {sidebarOpen && (
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
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
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground hover:bg-muted transition"
                  >
                    <User className="w-4 h-4" />
                    {sidebarOpen && <span>My Profile</span>}
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-destructive hover:bg-red-500/20 transition disabled:opacity-60"
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
