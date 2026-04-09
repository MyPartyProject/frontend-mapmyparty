import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Avatar as AvatarSelector,
  AvatarFallback as AvatarSelectorFallback,
  AvatarImage as AvatarSelectorImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
const avatarOptions = [
  {
    id: "avatar-1",
    label: "Acoustic Dreamer",
    url: "https://api.dicebear.com/7.x/adventurer/png?seed=FestivalDreamer&backgroundColor=ffdfbf",
  },
  {
    id: "avatar-2",
    label: "Festival Vibes",
    url: "https://api.dicebear.com/7.x/bottts/png?seed=PartyLover&backgroundColor=f0f4ff",
  },
  {
    id: "avatar-3",
    label: "City Explorer",
    url: "https://api.dicebear.com/7.x/croodles/png?seed=CityExplorer&backgroundColor=d1f7ff",
  },
  {
    id: "avatar-4",
    label: "Night Groove",
    url: "https://api.dicebear.com/7.x/micah/png?seed=NightGroove&backgroundColor=ffe0f0",
  },
];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  PencilLine,
} from "lucide-react";
import { isAuthenticated } from "@/utils/auth";
import { apiFetch } from "@/config/api";
import { toast } from "sonner";

const CREATE_PASSWORD_ENDPOINT = "/api/user/create-password";

const roleLabelMap = {
  organizer: "Organizer",
  promoter: "Promoter",
  user: "Attendee",
};

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
  coverImage:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
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

  if (!storedRaw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(storedRaw);
    const authProvider = parsed.authProvider || parsed.provider || fallback.authProvider || "password";
    const hasPassword =
      parsed.hasPassword !== undefined
        ? Boolean(parsed.hasPassword)
        : authProvider === "google"
          ? false
          : fallback.hasPassword;
    return {
      ...fallback,
      ...parsed,
      authProvider,
      hasPassword,
    };
  } catch (error) {
    console.warn("⚠️ Failed to parse stored user profile", error);
    return fallback;
  }
};

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
};

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [passwordValues, setPasswordValues] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const storedProfile = useMemo(() => getStoredProfile(), []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/api/user/profile", {
        method: "GET",
      });

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
        if (normalizedProfile.authProvider) {
          sessionStorage.setItem("authProvider", normalizedProfile.authProvider);
        }
        if (normalizedProfile.hasPassword !== undefined) {
          sessionStorage.setItem("hasPassword", normalizedProfile.hasPassword ? "true" : "false");
        }

        if (normalizedProfile.user_roles && normalizedProfile.user_roles.length > 0) {
          const roleName = normalizedProfile.user_roles[0]?.roles?.name || "USER";
          sessionStorage.setItem("role", roleName);
          sessionStorage.setItem("userType", roleName);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  const profile = useMemo(() => {
    const storedProvider =
      storedProfile.authProvider ||
      storedProfile.provider ||
      sessionStorage.getItem("authProvider");
    const storedHasPassword =
      storedProfile.hasPassword !== undefined
        ? storedProfile.hasPassword
        : sessionStorage.getItem("hasPassword") === "true";

    if (profileData) {
      const apiRole = profileData.user_roles?.[0]?.roles?.name || 'USER';
      const provider =
        profileData.authProvider ||
        profileData.provider ||
        storedProvider ||
        "password";
      const passwordState =
        provider === "password"
          ? (profileData.hasPassword !== undefined ? profileData.hasPassword : true)
          : (profileData.hasPassword !== undefined
            ? profileData.hasPassword
            : storedHasPassword !== undefined
              ? storedHasPassword
              : false);
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
        whatsAppNotification: profileData.whatsAppNotification,
        avatarUrl: profileData.avatarUrl || profileData.avatar || sampleProfile.avatarUrl,
      };
    }
    
    const provider =
      storedProvider ||
      sampleProfile.authProvider ||
      "password";
    const passwordState =
      provider === "password"
        ? true
        : (storedHasPassword !== undefined
          ? storedHasPassword
          : false);

    // Fallback to stored profile or sample
    return {
      ...sampleProfile,
      ...storedProfile,
      name: storedProfile.name || sampleProfile.name,
      email: storedProfile.email || sampleProfile.email,
      phone: storedProfile.phone || sampleProfile.phone,
      role: storedProfile.role || sampleProfile.role,
      authProvider: provider,
      hasPassword: passwordState,
      avatarUrl:
        storedProfile.avatar ||
        storedProfile.avatarUrl ||
        sessionStorage.getItem("userAvatar") ||
        sampleProfile.avatarUrl,
    };
  }, [profileData, storedProfile]);

  const role = normalizeRole(profile.role);
  const memberSince = formatDate(profile.memberSince) || "March 2024";
  const authProvider = profile.authProvider || "password";
  const hasPassword = profile.hasPassword !== undefined ? Boolean(profile.hasPassword) : authProvider !== "google";
  const isCreatePasswordFlow = !hasPassword;

  const handleEditClick = useCallback(
    (field) => {
      setEditField(field);
      if (field === "name") {
        setEditValue(profile.name || "");
        setPasswordValues({ current: "", new: "", confirm: "" });
      } else if (field === "password") {
        setEditValue("");
        setPasswordValues({ current: "", new: "", confirm: "" });
      }
    },
    [profile.name]
  );

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editField) {
      return;
    }

    setIsSaving(true);

    let payload = {};
    let endpoint = "/api/user/profile";
    if (editField === "name") {
      const trimmedValue = editValue.trim();
      if (!trimmedValue) {
        toast.error("Please enter a valid name.");
        setIsSaving(false);
        return;
      }
      payload = { name: trimmedValue };
    } else if (editField === "password") {
      const currentPassword = passwordValues.current.trim();
      const newPassword = passwordValues.new.trim();
      const confirmPassword = passwordValues.confirm.trim();

      if (isCreatePasswordFlow) {
        if (!newPassword || !confirmPassword) {
          toast.error("Please fill in all password fields.");
          setIsSaving(false);
          return;
        }
      } else {
        if (!currentPassword || !newPassword || !confirmPassword) {
          toast.error("Please fill in all password fields.");
          setIsSaving(false);
          return;
        }
      }

      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        setIsSaving(false);
        return;
      }
      if (isCreatePasswordFlow) {
        payload = { password: newPassword, confirmPassword };
        endpoint = CREATE_PASSWORD_ENDPOINT;
      } else {
        payload = { currentPassword, newPassword };
        endpoint = "/api/user/change-password";
      }
    } else {
      setIsSaving(false);
      return;
    }

    try {
      const response = await apiFetch(endpoint, {
        method: isCreatePasswordFlow ? "POST" : "PUT",
        body: JSON.stringify(payload),
      });

      const isSuccess = response?.status === "success" || response?.success === true;
      if (!isSuccess) {
        throw new Error(response?.message || response?.error || "Failed to update profile");
      }

      if (editField === "password") {
        toast.success(
          response?.message ||
            (isCreatePasswordFlow ? "Password created successfully" : "Password updated successfully")
        );
        // persist hasPassword + authProvider hints for UI
        sessionStorage.setItem("hasPassword", "true");
        if (authProvider) {
          sessionStorage.setItem("authProvider", authProvider);
        }
        setProfileData((prev) => ({
          ...(prev || {}),
          hasPassword: true,
          authProvider: authProvider || "password",
        }));
        setEditField(null);
        setEditValue("");
        setPasswordValues({ current: "", new: "", confirm: "" });
        return;
      }

      const optimisticData = {
        ...(profileData || {}),
        name: payload.name ?? profile.name,
      };
      setProfileData(optimisticData);

      if (payload.name !== undefined) {
        sessionStorage.setItem("userName", payload.name || "");
      }

      toast.success(response?.message || "Profile updated successfully");
      setEditField(null);

      // Re-fetch to ensure backend persisted the change
      fetchProfile();
    } catch (saveError) {
      console.error("Failed to update profile", saveError);
      toast.error(saveError.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const passwordDisplay = hasPassword ? profile.passwordMasked || "********" : "Not set";

  const detailRows = useMemo(
    () => [
      {
        label: "Full Name",
        value: profile.name,
        actions: [
          {
            label: "Edit name",
            type: "icon",
            onClick: () => handleEditClick("name"),
          },
        ],
      },
      {
        label: "Email",
        value: profile.email,
        actions: [],
      },
      {
        label: "Phone",
        value: profile.phone,
        actions: [],
      },
      {
        label: "Password",
        value: passwordDisplay,
        actions: [
          {
            label: isCreatePasswordFlow ? "Create password" : "Edit password",
            type: "icon",
            onClick: () => handleEditClick("password"),
          },
        ],
      },
    ],
    [handleEditClick, isCreatePasswordFlow, passwordDisplay, profile]
  );

  const isUserAuthenticated = isAuthenticated();

  if (!isUserAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated={false} userRole="user" />
        <main className="flex-1 flex items-center justify-center bg-muted/20 px-4">
          <Card className="max-w-md w-full shadow-elegant text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Please log in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You need an account to view your profile details.
              </p>
              <Button onClick={() => (window.location.href = "/auth")} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated userRole={role} />
        <main className="flex-1 flex items-center justify-center bg-muted/20 px-4">
          <Card className="max-w-md w-full shadow-elegant text-center">
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">Loading profile...</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header isAuthenticated userRole={role} />
        <main className="flex-1 flex items-center justify-center bg-muted/20 px-4">
          <Card className="max-w-md w-full shadow-elegant text-center">
            <CardHeader>
              <CardTitle className="text-2xl text-destructive">Error Loading Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Header isAuthenticated userRole={role} />
      <main className="flex-1 pb-12">
        <div className="relative">
          <div className="relative h-56 md:h-64 w-full overflow-hidden">
            <img
              src={profile.coverImage}
              alt="Profile cover"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="container max-w-5xl">
            <div className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
              <Button
                variant="ghost"
                className="w-fit gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                Member since {memberSince}
              </div>
            </div>

            <Card className="mt-6 md:-mt-16 border-none shadow-none" style={{ marginTop: 20 }}>
              <CardContent className="p-0 md:px-4 md:py-6">
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-6">
                      <div className="flex flex-col items-center gap-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="relative">
                              <Avatar className="h-24 w-24 border-4 border-background shadow-lg transition-transform hover:scale-[1.02]">
                                {profile.avatarUrl ? (
                                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                                ) : (
                                  <AvatarFallback className="text-xl font-semibold">
                                    {getInitials(profile.name, profile.email)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground shadow">Change</span>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Select your vibe</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                              {avatarOptions.map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/80 p-3 transition hover:border-primary hover:bg-primary/10"
                                >
                                  <AvatarSelector className="h-16 w-16 border-2 border-border/60 shadow">
                                    <AvatarSelectorImage src={option.url} alt={option.label} />
                                    <AvatarSelectorFallback>{option.label.slice(0, 2).toUpperCase()}</AvatarSelectorFallback>
                                  </AvatarSelector>
                                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                                    {option.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <Button variant="link" size="sm" className="px-0 text-destructive">
                            Delete
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex-1 space-y-3 sm:mt-0">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{profile.location}</span>
                          <Badge variant="secondary" className="uppercase tracking-wide">
                            {roleLabelMap[role] || "Attendee"}
                          </Badge>
                          {profile.isVerified && (
                            <Badge variant="outline" className="gap-1">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{profile.name}</h1>

                        <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {profile.email}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {profile.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="space-y-6">
                    <div className="grid gap-6 text-sm md:grid-cols-2">
                      {detailRows.map((row) => (
                        <div key={row.label} className="space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {row.label}:
                          </p>
                          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <span>{row.value}</span>
                            {row.actions
                              ?.filter((action) => action.type === "icon")
                              .map((action) => (
                                <button
                                  key={action.label}
                                  type="button"
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                                  aria-label={action.label}
                                  onClick={action.onClick}
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                </button>
                              ))}
                          </div>
                          {row.subValue && (
                            row.subIsLink ? (
                              <a
                                href={row.subValue}
                                className="text-sm text-primary underline decoration-primary/50 underline-offset-4"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {row.subValue}
                              </a>
                            ) : (
                              <p className="text-sm text-muted-foreground">{row.subValue}</p>
                            )
                          )}
                          <div className="flex flex-wrap gap-3 pt-1">
                            {row.actions
                              ?.filter((action) => action.type !== "icon")
                              .map((action) => (
                                <Button
                                  key={action.label}
                                  variant={action.variant || "link"}
                                  size="sm"
                                  className="px-0 h-auto text-xs font-semibold text-primary"
                                  type="button"
                                  onClick={action.onClick}
                                >
                                  {action.label}
                                </Button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={!!editField} onOpenChange={(open) => !open && !isSaving && setEditField(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEditSubmit} className="space-y-5 py-2">
            <DialogHeader>
              <DialogTitle>
                {editField === "name"
                  ? "Update Name"
                  : isCreatePasswordFlow
                    ? "Create Password"
                    : "Update Password"}
              </DialogTitle>
            </DialogHeader>

            {editField === "password" ? (
              <>
                {!isCreatePasswordFlow && (
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm font-medium text-foreground">
                      Current Password
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter current password"
                      value={passwordValues.current}
                      onChange={(event) =>
                        setPasswordValues((prev) => ({ ...prev, current: event.target.value }))
                      }
                      required={!isCreatePasswordFlow}
                      autoComplete="current-password"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={passwordValues.new}
                    onChange={(event) =>
                      setPasswordValues((prev) => ({ ...prev, new: event.target.value }))
                    }
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordValues.confirm}
                    onChange={(event) =>
                      setPasswordValues((prev) => ({ ...prev, confirm: event.target.value }))
                    }
                    required
                    autoComplete="new-password"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-input" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <Input
                  id="edit-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={editValue}
                  onChange={(event) => setEditValue(event.target.value)}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

