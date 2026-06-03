import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAdminProfile, updateAdminProfile } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import {
  PHONE_INPUT_PROPS,
  normalizeTenDigitPhoneNumber,
  sanitizeTenDigitPhoneInput,
} from "@/utils/phone";
import {
  Calendar,
  CreditCard,
  Loader2,
  Mail,
  Phone,
  Save,
  Shield,
  User,
  Wallet2,
} from "lucide-react";

const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (email || "PR").slice(0, 2).toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const PromoterProfile = () => {
  const { refreshAuth } = useAuth();
  const { data, dashboardLoading } = useOutletContext();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const user = await fetchAdminProfile();
        setProfile(user);
        setForm({
          name: user?.name || "",
          email: user?.email || "",
          phone: sanitizeTenDigitPhoneInput(user?.phone || ""),
          avatar: user?.avatar || "",
          password: "",
        });
      } catch (loadError) {
        setError(loadError.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    const profilePhone = sanitizeTenDigitPhoneInput(profile.phone || "");
    return (
      form.name.trim() !== (profile.name || "") ||
      form.email.trim() !== (profile.email || "") ||
      form.phone.trim() !== profilePhone ||
      form.avatar.trim() !== (profile.avatar || "") ||
      Boolean(form.password.trim())
    );
  }, [form, profile]);

  const stats = useMemo(() => {
    const allStats = Array.isArray(data?.stats) ? data.stats : [];
    return allStats.slice(0, 4);
  }, [data]);

  const handleChange = (field) => (event) => {
    const value = field === "phone"
      ? sanitizeTenDigitPhoneInput(event.target.value)
      : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!profile) return;

    const payload = {};
    const profilePhone = sanitizeTenDigitPhoneInput(profile.phone || "");
    const nextPhone = sanitizeTenDigitPhoneInput(form.phone);
    if (form.name.trim() !== (profile.name || "")) payload.name = form.name.trim();
    if (form.email.trim() !== (profile.email || "")) payload.email = form.email.trim();
    if (nextPhone !== profilePhone) {
      const normalizedPhone = normalizeTenDigitPhoneNumber(nextPhone);
      if (!normalizedPhone) {
        toast.error("Phone number must be exactly 10 digits.");
        return;
      }
      payload.phone = normalizedPhone;
    }
    if (form.avatar.trim() !== (profile.avatar || "")) payload.avatar = form.avatar.trim();
    if (form.password.trim()) payload.password = form.password.trim();

    if (Object.keys(payload).length === 0) {
      toast.info("No profile changes to save.");
      return;
    }

    try {
      setSaving(true);
      const updatedUser = await updateAdminProfile(payload);
      setProfile(updatedUser);
      setForm({
        name: updatedUser?.name || "",
        email: updatedUser?.email || "",
        phone: sanitizeTenDigitPhoneInput(updatedUser?.phone || ""),
        avatar: updatedUser?.avatar || "",
        password: "",
      });
      sessionStorage.setItem("userName", updatedUser?.name || "");
      sessionStorage.setItem("userEmail", updatedUser?.email || "");
      sessionStorage.setItem("userPhone", updatedUser?.phone || "");
      sessionStorage.setItem(
        "userProfile",
        JSON.stringify({
          ...(profile || {}),
          ...updatedUser,
        })
      );
      await refreshAuth();
      toast.success("Profile updated successfully.");
    } catch (saveError) {
      toast.error(saveError.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md border-border/60 bg-card/80">
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="text-sm text-red-400">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-[var(--shadow-card)]">
        <div className="relative overflow-hidden px-6 py-7 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsla(var(--accent)/0.18),transparent_35%),linear-gradient(135deg,hsla(var(--primary)/0.18),transparent_55%),linear-gradient(180deg,hsla(var(--secondary)/0.18),transparent)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              <Avatar className="h-24 w-24 border-4 border-background shadow-[var(--shadow-card)] sm:h-28 sm:w-28">
                <AvatarImage src={form.avatar || profile?.avatar || ""} alt={profile?.name || "Promoter"} />
                <AvatarFallback className="bg-primary/20 text-2xl font-semibold text-primary-foreground">
                  {getInitials(profile?.name, profile?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Account</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-3xl font-semibold tracking-tight">{profile?.name || "Promoter"}</h2>
                    <Badge className="border border-primary/30 bg-primary/15 text-foreground">
                      <Shield className="mr-1 h-3.5 w-3.5" />
                      Platform Admin
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {profile?.email || "No email"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {profile?.phone || "No phone"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(profile?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[480px]">
              {dashboardLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border/60 bg-background/50 p-4 animate-pulse">
                      <div className="mb-3 h-4 w-24 rounded bg-white/10" />
                      <div className="h-7 w-28 rounded bg-white/10" />
                      <div className="mt-2 h-3 w-20 rounded bg-white/10" />
                    </div>
                  ))
                : stats.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border/60 bg-background/55 p-4 backdrop-blur-sm">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.title}</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.delta}</p>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="border-b border-border/60 pb-5">
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Update the promoter account details shown in the sidebar and across the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="promoter-name">Full Name</Label>
                  <Input id="promoter-name" value={form.name} onChange={handleChange("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoter-email">Email Address</Label>
                  <Input id="promoter-email" type="email" value={form.email} onChange={handleChange("email")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoter-phone">Phone Number</Label>
                  <Input id="promoter-phone" {...PHONE_INPUT_PROPS} value={form.phone} onChange={handleChange("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promoter-avatar">Avatar URL</Label>
                  <Input
                    id="promoter-avatar"
                    value={form.avatar}
                    onChange={handleChange("avatar")}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="space-y-2">
                  <Label htmlFor="promoter-password">New Password</Label>
                  <Input
                    id="promoter-password"
                    type="password"
                    value={form.password}
                    onChange={handleChange("password")}
                    placeholder="Leave blank to keep the current password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use this only when you want to rotate the promoter account password.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live Preview</p>
                  <div className="mt-4 flex items-center gap-3">
                    <Avatar className="h-14 w-14 border border-border/60">
                      <AvatarImage src={form.avatar || profile?.avatar || ""} alt={form.name || profile?.name || "Promoter"} />
                      <AvatarFallback className="bg-primary/20 text-primary-foreground">
                        {getInitials(form.name || profile?.name, form.email || profile?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{form.name || "Promoter"}</p>
                      <p className="truncate text-xs text-muted-foreground">{form.email || "No email"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {hasChanges ? "Unsaved changes are ready to publish." : "Profile details are up to date."}
                </p>
                <Button
                  type="submit"
                  disabled={saving || !hasChanges}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Account Snapshot</CardTitle>
              <CardDescription>Key promoter account metadata and current session identity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Role</p>
                <p className="mt-2 flex items-center gap-2 font-semibold">
                  <Shield className="h-4 w-4 text-primary" />
                  Platform Administrator
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Member Since</p>
                <p className="mt-2 flex items-center gap-2 font-semibold">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatDate(profile?.createdAt)}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Last Updated</p>
                <p className="mt-2 flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-primary" />
                  {formatDate(profile?.updatedAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>Revenue Access</CardTitle>
              <CardDescription>Quick financial indicators already available in the promoter dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Platform Earnings</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                  <Wallet2 className="h-4 w-4 text-primary" />
                  {stats[3]?.value || "0"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Gross Revenue</p>
                <p className="mt-2 flex items-center gap-2 text-lg font-semibold">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {stats[2]?.value || "0"}
                </p>
              </div>
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/10 p-4 text-sm text-muted-foreground">
                Changes saved here immediately refresh the sidebar account identity for the active session.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PromoterProfile;
