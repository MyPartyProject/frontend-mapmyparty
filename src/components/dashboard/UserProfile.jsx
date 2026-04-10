import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Lock,
  Edit2,
  Camera,
  Upload,
  Ticket,
  TrendingUp,
  Heart,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";
import { toast } from "sonner";

const CREATE_PASSWORD_ENDPOINT = "/api/user/create-password";

const roleLabelMap = {
  organizer: "Organizer",
  promoter: "Promoter",
  user: "Attendee",
};

const avatarOptions = [
  { id: "avatar-1", label: "Acoustic Dreamer", url: "https://api.dicebear.com/7.x/adventurer/png?seed=FestivalDreamer&backgroundColor=ffdfbf" },
  { id: "avatar-2", label: "Festival Vibes", url: "https://api.dicebear.com/7.x/bottts/png?seed=PartyLover&backgroundColor=f0f4ff" },
  { id: "avatar-3", label: "City Explorer", url: "https://api.dicebear.com/7.x/croodles/png?seed=CityExplorer&backgroundColor=d1f7ff" },
  { id: "avatar-4", label: "Night Groove", url: "https://api.dicebear.com/7.x/micah/png?seed=NightGroove&backgroundColor=ffe0f0" },
];

const sampleProfile = {
  name: "Rachel Derek",
  role: "user",
  location: "Sylhet, Bangladesh",
  email: "rachel@calme.io",
  phone: "+1 (231) 342-3245",
  passwordMasked: "********",
  hasPassword: true,
  memberSince: "2023-06-12T00:00:00Z",
  avatarUrl: "https://api.dicebear.com/7.x/adventurer-neutral/png?seed=MapMyParty&backgroundColor=fff1d6",
};

const normalizeRole = (value) => {
  if (!value) return "user";
  const lower = String(value).toLowerCase();
  if (lower.includes("organizer")) return "organizer";
  if (lower.includes("promoter")) return "promoter";
  return "user";
};

const getStoredProfile = () => {
  const storedRaw = sessionStorage.getItem("userProfile");
  const fallback = {
    name: sessionStorage.getItem("userName") || "",
    email: sessionStorage.getItem("userEmail") || "",
    phone: sessionStorage.getItem("userPhone") || "",
    role: sessionStorage.getItem("role") || sessionStorage.getItem("userType") || "USER",
    authProvider: sessionStorage.getItem("authProvider") || "password",
    hasPassword: sessionStorage.getItem("hasPassword") === "true",
  };
  if (!storedRaw) return fallback;
  try {
    const parsed = JSON.parse(storedRaw);
    const authProvider = parsed.authProvider || parsed.provider || fallback.authProvider || "password";
    const hasPassword =
      parsed.hasPassword !== undefined
        ? Boolean(parsed.hasPassword)
        : authProvider === "google"
          ? false
          : fallback.hasPassword;
    return { ...fallback, ...parsed, authProvider, hasPassword };
  } catch (error) {
    console.warn("Failed to parse stored user profile", error);
    return fallback;
  }
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(date);
};

const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
};

export default function UserProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordValues, setPasswordValues] = useState({ current: "", new: "", confirm: "" });
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [pendingAvatar, setPendingAvatar] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (cameraDialogOpen) { startCamera(); }
    else { stopCameraStream(); setCapturedPhoto(null); }
  }, [cameraDialogOpen]);

  const storedProfile = useMemo(() => getStoredProfile(), []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/user/profile", { method: "GET" });
      if (response?.success && response?.data) {
        const avatar = response.data.avatar || response.data.avatarUrl || "";
        const authProvider = response.data.authProvider || response.data.provider || "password";
        const hasPassword =
          response.data.hasPassword !== undefined
            ? Boolean(response.data.hasPassword)
            : authProvider === "google"
              ? false
              : true;
        const normalizedProfile = {
          ...response.data,
          avatar,
          avatarUrl: response.data.avatarUrl || avatar,
          authProvider,
          hasPassword,
        };
        setProfileData(normalizedProfile);
        sessionStorage.setItem("userName", normalizedProfile.name || "");
        sessionStorage.setItem("userEmail", normalizedProfile.email || "");
        sessionStorage.setItem("userPhone", normalizedProfile.phone || "");
        sessionStorage.setItem("userAvatar", normalizedProfile.avatarUrl || "");
        sessionStorage.setItem("userProfile", JSON.stringify(normalizedProfile));
        if (normalizedProfile.authProvider) sessionStorage.setItem("authProvider", normalizedProfile.authProvider);
        if (normalizedProfile.hasPassword !== undefined) sessionStorage.setItem("hasPassword", normalizedProfile.hasPassword ? "true" : "false");
        if (normalizedProfile.user_roles && normalizedProfile.user_roles.length > 0) {
          const roleName = normalizedProfile.user_roles[0]?.roles?.name || "USER";
          sessionStorage.setItem("role", roleName);
          sessionStorage.setItem("userType", roleName);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated()) { fetchProfile(); }
    else { setLoading(false); }
    return () => { stopCameraStream(); };
  }, [fetchProfile]);

  const profile = useMemo(() => {
    const storedProvider =
      storedProfile.authProvider ||
      storedProfile.provider ||
      sessionStorage.getItem("authProvider");
    const storedHasPassword = storedProfile.hasPassword !== undefined ? storedProfile.hasPassword : sessionStorage.getItem("hasPassword") === "true";
    if (profileData) {
      const apiRole = profileData.user_roles?.[0]?.roles?.name || 'USER';
      const provider = profileData.authProvider || profileData.provider || storedProvider || "password";
      const passwordState = provider === "password"
        ? (profileData.hasPassword !== undefined ? profileData.hasPassword : true)
        : (profileData.hasPassword !== undefined ? profileData.hasPassword : storedHasPassword !== undefined ? storedHasPassword : false);
      return {
        ...sampleProfile,
        name: profileData.name || sampleProfile.name,
        email: profileData.email || sampleProfile.email,
        phone: profileData.phone || sampleProfile.phone,
        role: apiRole,
        authProvider: provider,
        hasPassword: passwordState,
        memberSince: profileData.createdAt,
        isVerified: profileData.isVerified,
        avatarUrl: profileData.avatarUrl || profileData.avatar || sampleProfile.avatarUrl,
      };
    }
    const provider = storedProvider || sampleProfile.authProvider || "password";
    const passwordState = provider === "password" ? true : (storedHasPassword !== undefined ? storedHasPassword : false);
    return {
      ...sampleProfile, ...storedProfile,
      name: storedProfile.name || sampleProfile.name,
      email: storedProfile.email || sampleProfile.email,
      phone: storedProfile.phone || sampleProfile.phone,
      role: storedProfile.role || sampleProfile.role,
      authProvider: provider, hasPassword: passwordState,
      avatarUrl: storedProfile.avatar || storedProfile.avatarUrl || sessionStorage.getItem("userAvatar") || sampleProfile.avatarUrl,
    };
  }, [profileData, storedProfile]);

  const role = normalizeRole(profile.role);
  const memberSince = formatDate(profile.memberSince) || "March 2024";
  const authProvider = profile.authProvider || "password";
  const hasPassword = profile.hasPassword !== undefined ? Boolean(profile.hasPassword) : authProvider !== "google";
  const isCreatePasswordFlow = !hasPassword;

  const handleEditClick = useCallback((field) => {
    if (field === "name") { setEditField(field); setEditValue(profile.name || ""); setPasswordValues({ current: "", new: "", confirm: "" }); }
    else if (field === "password") { setEditField(field); setEditValue(""); setPasswordValues({ current: "", new: "", confirm: "" }); }
  }, [profile.name]);

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (!editField) return;
    setIsSaving(true);
    let payload = {};
    let endpoint = "/api/user/profile";

    if (editField === "name") {
      const trimmedValue = editValue.trim();
      if (!trimmedValue) { toast.error("Please enter a valid name."); setIsSaving(false); return; }
      payload = { name: trimmedValue };
    } else if (editField === "password") {
      const currentPassword = passwordValues.current.trim();
      const newPassword = passwordValues.new.trim();
      const confirmPassword = passwordValues.confirm.trim();
      if (isCreatePasswordFlow) {
        if (!newPassword || !confirmPassword) { toast.error("Please fill in all password fields."); setIsSaving(false); return; }
      } else {
        if (!currentPassword || !newPassword || !confirmPassword) { toast.error("Please fill in all password fields."); setIsSaving(false); return; }
      }
      if (newPassword !== confirmPassword) { toast.error("New passwords do not match."); setIsSaving(false); return; }
      if (isCreatePasswordFlow) { payload = { password: newPassword, confirmPassword }; endpoint = CREATE_PASSWORD_ENDPOINT; }
      else { payload = { currentPassword, newPassword }; endpoint = "/api/user/change-password"; }
    } else { setIsSaving(false); return; }

    try {
      const response = await apiFetch(endpoint, { method: isCreatePasswordFlow ? "POST" : "PUT", body: JSON.stringify(payload) });
      const isSuccess = response?.status === "success" || response?.success === true;
      if (!isSuccess) throw new Error(response?.message || response?.error || "Failed to update profile");

      if (editField === "password") {
        toast.success(response?.message || (isCreatePasswordFlow ? "Password created successfully" : "Password updated successfully"));
        sessionStorage.setItem("hasPassword", "true");
        if (authProvider) sessionStorage.setItem("authProvider", authProvider);
        setProfileData((prev) => ({ ...(prev || {}), hasPassword: true, authProvider: authProvider || "password" }));
        setEditField(null); setEditValue(""); setPasswordValues({ current: "", new: "", confirm: "" });
        return;
      }

      const optimisticData = { ...(profileData || {}), name: payload.name ?? profile.name };
      setProfileData(optimisticData);
      if (payload.name !== undefined) sessionStorage.setItem("userName", payload.name || "");
      toast.success(response?.message || "Profile updated successfully");
      setEditField(null);
      fetchProfile();
    } catch (saveError) {
      console.error("Failed to update profile", saveError);
      toast.error(saveError.message || "Failed to update profile");
    } finally { setIsSaving(false); }
  };

  const clearCameraStream = () => {
    const video = videoRef.current;
    if (video && video.srcObject) { video.srcObject.getTracks().forEach((t) => t.stop()); video.srcObject = null; }
  };
  const stopCameraStream = () => { clearCameraStream(); setCapturedPhoto(null); };

  const handleAvatarSave = async (dataUrl) => {
    if (!dataUrl) return;
    setAvatarUploading(true);
    try {
      const response = await apiFetch("/api/user/profile", { method: "PUT", body: JSON.stringify({ avatar: dataUrl, avatarUrl: dataUrl }) });
      const isSuccess = response?.status === "success" || response?.success === true;
      if (!isSuccess) throw new Error(response?.message || response?.error || "Failed to update avatar");
      const optimisticData = { ...(profileData || {}), avatar: dataUrl, avatarUrl: dataUrl };
      setProfileData(optimisticData);
      sessionStorage.setItem("userAvatar", dataUrl);
      sessionStorage.setItem("userProfile", JSON.stringify(optimisticData));
      toast.success(response?.message || "Avatar updated");
      setAvatarDialogOpen(false); setCameraDialogOpen(false); stopCameraStream(); setCapturedPhoto(null); setPendingAvatar(null);
    } catch (err) {
      console.error("Failed to update avatar", err);
      toast.error(err?.message || "Failed to update avatar");
    } finally { setAvatarUploading(false); }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const result = e.target?.result; if (typeof result === "string") setPendingAvatar(result); };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setCapturedPhoto(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch (err) { console.error("Camera access denied", err); toast.error("Unable to access camera"); }
  };

  const openCamera = async () => { setCapturedPhoto(null); setCameraDialogOpen(true); };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    setCapturedPhoto(dataUrl);
    clearCameraStream();
  };

  const detailRows = useMemo(() => [
    { label: "Full Name", value: profile.name, icon: User, editable: true, field: "name" },
    { label: "Email", value: profile.email, icon: Mail, editable: false },
    { label: "Phone", value: profile.phone, icon: Phone, editable: false },
    { label: "Password", value: hasPassword ? "********" : "Not set", icon: Lock, editable: true, field: "password" },
  ], [handleEditClick, hasPassword, isCreatePasswordFlow, profile]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-[#D60024]"></div>
          <p className="text-sm text-white/40">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm space-y-4">
          <p className="text-sm text-red-400">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-[#D60024] hover:bg-[#b8001f] text-white text-sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-white space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Profile</h1>
        <p className="text-sm text-white/40 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Dialog open={avatarDialogOpen} onOpenChange={(open) => { setAvatarDialogOpen(open); if (!open) stopCameraStream(); }}>
              <DialogTrigger asChild>
                <button type="button" className="relative group" onClick={() => setAvatarDialogOpen(true)}>
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-white/[0.08]">
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                    ) : (
                      <AvatarFallback className="text-xl font-bold bg-[#D60024] text-white">
                        {getInitials(profile.name, profile.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-[#0e0e18] border-white/[0.08] text-white rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-white text-base">Choose Avatar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3">
                    {avatarOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="flex flex-col items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:border-[#D60024] hover:bg-[#D60024]/5"
                        onClick={() => setPendingAvatar(option.url)}
                        disabled={avatarUploading}
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={option.url} alt={option.label} />
                          <AvatarFallback>{option.label.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-white/50 text-center leading-tight">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.05] text-xs" type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                    </Button>
                    <Button variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.05] text-xs" type="button" onClick={openCamera} disabled={avatarUploading}>
                      <Camera className="h-3.5 w-3.5 mr-1.5" /> Camera
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {pendingAvatar && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                      <Avatar className="h-12 w-12 border border-white/[0.08]">
                        <AvatarImage src={pendingAvatar} alt="Preview" />
                        <AvatarFallback>AV</AvatarFallback>
                      </Avatar>
                      <div className="flex gap-2 flex-1">
                        <Button variant="outline" type="button" onClick={() => setPendingAvatar(null)} className="flex-1 h-8 border-white/[0.08] text-white/60 text-xs" disabled={avatarUploading}>Cancel</Button>
                        <Button type="button" onClick={() => handleAvatarSave(pendingAvatar)} className="flex-1 h-8 bg-[#D60024] hover:bg-[#b8001f] text-white text-xs" disabled={avatarUploading}>
                          {avatarUploading ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Camera Dialog */}
            <Dialog open={cameraDialogOpen} onOpenChange={(open) => { setCameraDialogOpen(open); if (!open) { stopCameraStream(); setCapturedPhoto(null); } }}>
              <DialogContent className="max-w-md bg-[#0e0e18] border-white/[0.08] text-white rounded-xl">
                <DialogHeader>
                  <DialogTitle className="text-white text-base">Take a Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  {!capturedPhoto ? (
                    <>
                      <video ref={videoRef} className="w-full rounded-lg border border-white/[0.06]" autoPlay muted />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" type="button" onClick={() => { stopCameraStream(); setCameraDialogOpen(false); }} className="border-white/[0.08] text-white/60 text-xs">Cancel</Button>
                        <Button type="button" onClick={captureFromCamera} className="bg-[#D60024] hover:bg-[#b8001f] text-white text-xs" disabled={avatarUploading}>Capture</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img src={capturedPhoto} alt="Captured" className="w-full rounded-lg border border-white/[0.06] object-contain max-h-72" />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" type="button" onClick={startCamera} className="border-white/[0.08] text-white/60 text-xs" disabled={avatarUploading}>Retake</Button>
                        <Button type="button" onClick={() => handleAvatarSave(capturedPhoto)} className="bg-[#D60024] hover:bg-[#b8001f] text-white text-xs" disabled={avatarUploading}>
                          {avatarUploading ? "Saving..." : "Save Photo"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="bg-[#D60024]/10 text-[#D60024] border border-[#D60024]/20 text-xs font-medium">
                {roleLabelMap[role] || "Attendee"}
              </Badge>
              {profile.isVerified && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                  <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{profile.name}</h2>
            <p className="text-xs text-white/40 flex items-center gap-1.5 mb-4">
              <CalendarIcon className="h-3.5 w-3.5" />
              Member since {memberSince}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Mail className="h-4 w-4 text-white/30 flex-shrink-0" />
                <span className="text-sm text-white/70 truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Phone className="h-4 w-4 text-white/30 flex-shrink-0" />
                <span className="text-sm text-white/70">{profile.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Account Security */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.03]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
            <Lock className="h-4 w-4 text-white/30" />
            <h3 className="text-sm font-semibold text-white">Account Security</h3>
          </div>
          <div className="p-5 space-y-3">
            {detailRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-white/30" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider">{row.label}</p>
                      <p className="text-sm font-medium text-white truncate">{row.value}</p>
                    </div>
                  </div>
                  {row.editable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(row.field)}
                      className="text-white/40 hover:text-white hover:bg-white/[0.06] h-8 px-3 text-xs"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {[
            { label: "Total Bookings", value: "12", icon: Ticket, color: "#D60024" },
            { label: "Favorite Events", value: "8", icon: Heart, color: "#60a5fa" },
            { label: "Average Rating", value: "4.8", icon: Star, color: "#22c55e" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}12` }}>
                    <Icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editField} onOpenChange={(open) => !open && !isSaving && setEditField(null)}>
        <DialogContent className="sm:max-w-md bg-[#0e0e18] border-white/[0.08] text-white rounded-xl">
          <form onSubmit={handleEditSubmit} className="space-y-4 py-1">
            <DialogHeader>
              <DialogTitle className="text-white text-base">
                {editField === "name" ? "Update Name" : isCreatePasswordFlow ? "Create Password" : "Update Password"}
              </DialogTitle>
            </DialogHeader>

            {editField === "password" ? (
              <div className="space-y-3">
                {!isCreatePasswordFlow && (
                  <div className="space-y-1.5">
                    <Label htmlFor="profile-current-password" className="text-white/60 text-xs">Current Password</Label>
                    <Input id="profile-current-password" type="password" placeholder="Enter current password" value={passwordValues.current}
                      onChange={(event) => setPasswordValues((prev) => ({ ...prev, current: event.target.value }))}
                      required={!isCreatePasswordFlow} autoComplete="current-password"
                      className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 h-9 text-sm" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="profile-new-password" className="text-white/60 text-xs">{isCreatePasswordFlow ? "Create Password" : "New Password"}</Label>
                  <Input id="profile-new-password" type="password" placeholder={isCreatePasswordFlow ? "Enter password" : "Enter new password"} value={passwordValues.new}
                    onChange={(event) => setPasswordValues((prev) => ({ ...prev, new: event.target.value }))}
                    required autoComplete="new-password"
                    className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-confirm-password" className="text-white/60 text-xs">Confirm Password</Label>
                  <Input id="profile-confirm-password" type="password" placeholder={isCreatePasswordFlow ? "Confirm password" : "Confirm new password"} value={passwordValues.confirm}
                    onChange={(event) => setPasswordValues((prev) => ({ ...prev, confirm: event.target.value }))}
                    required autoComplete="new-password"
                    className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 h-9 text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="profile-edit-input" className="text-white/60 text-xs">Full Name</Label>
                <Input id="profile-edit-input" type="text" placeholder="Enter your full name" value={editValue}
                  onChange={(event) => setEditValue(event.target.value)} required
                  className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/25 h-9 text-sm" />
              </div>
            )}

            <Button type="submit" className="w-full bg-[#D60024] hover:bg-[#b8001f] text-white text-sm font-medium h-9" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
