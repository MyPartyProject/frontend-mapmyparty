import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building2, Calendar, Loader2, Mail, Phone, ShieldCheck, User } from "lucide-react";
import { apiFetch } from "@/config/api";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const getInitials = (name, email) => {
  const source = (name || email || "").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const roleLabel = (roles = []) => {
  if (!Array.isArray(roles) || roles.length === 0) return "Attendee";
  const first = roles[0]?.roles?.name || "USER";
  return first.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
};

export default function AttendeeProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch("/api/user/profile", { method: "GET" });
      const profileData = response?.data || response;

      if (!profileData || typeof profileData !== "object") {
        throw new Error("Invalid profile data");
      }

      setProfile(profileData);
    } catch (err) {
      console.error("Failed to fetch attendee profile:", err);
      setError(err?.message || "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const organizers = useMemo(() => {
    const owned = Array.isArray(profile?.ownedOrganizers) ? profile.ownedOrganizers : [];
    const managed = profile?.managerOfOrganizer ? [profile.managerOfOrganizer] : [];
    const map = new Map();
    [...owned, ...managed].forEach((org) => {
      if (org?.id && !map.has(org.id)) map.set(org.id, org);
    });
    return Array.from(map.values());
  }, [profile]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/30 mx-auto mb-3" />
          <p className="text-sm text-white/50">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-200 mb-4">{error || "Profile not found"}</p>
          <Button onClick={fetchProfile}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const fullName = profile.name || "Unnamed User";
  const email = profile.email || "N/A";
  const phone = profile.phone || "N/A";
  const isVerified = Boolean(profile.isVerified);
  const attendeeRole = roleLabel(profile.user_roles);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-white">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">My Profile</h1>
        <p className="text-sm text-white/45 mt-1">Attendee profile information</p>
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <Avatar className="h-20 w-20 border border-white/20">
            <AvatarImage src={profile.avatar || undefined} alt={fullName} />
            <AvatarFallback className="bg-white/10 text-white text-lg">
              {getInitials(fullName, email)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold truncate">{fullName}</h2>
              <Badge className="bg-white/10 text-white border border-white/15">{attendeeRole}</Badge>
              {isVerified && (
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/50" />
                <span className="text-white/80 truncate">{email}</span>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-white/50" />
                <span className="text-white/80">{phone}</span>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-white/50" />
                <span className="text-white/80">Joined {formatDate(profile.createdAt)}</span>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 flex items-center gap-2">
                <User className="h-4 w-4 text-white/50" />
                <span className="text-white/80">WhatsApp Alerts: {profile.whatsAppNotification ? "Enabled" : "Disabled"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-white/60" />
          <h3 className="text-base font-semibold">Organizer Associations</h3>
        </div>
        {organizers.length === 0 ? (
          <p className="text-sm text-white/50">No organizer association found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {organizers.map((org) => (
              <div key={org.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="font-medium text-white">{org.name || "Unnamed Organizer"}</p>
                <p className="text-xs text-white/50 mt-1">
                  {[org.address, org.state].filter(Boolean).join(", ") || "Location not available"}
                </p>
                <div className="mt-2">
                  <Badge
                    className={
                      org.isVerified
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                        : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                    }
                  >
                    {org.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
