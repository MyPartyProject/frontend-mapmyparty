import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Search,
  ShieldCheck,
  Instagram,
  Linkedin,
  Facebook,
  Globe,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useOrganizers } from "@/hooks/useOrganizers";

const socialIcons = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  x: Globe,
  reddit: Globe,
  snapchat: Globe,
};

const SocialLink = ({ platform, value }) => {
  if (!value) return null;
  const Icon = socialIcons[platform] || Globe;
  const label = platform.charAt(0).toUpperCase() + platform.slice(1);
  return (
    <a
      href={value.startsWith("http") ? value : `https://${value}`}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50 hover:bg-accent/20 text-muted-foreground hover:text-accent transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </a>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const OrganizerCard = ({ org }) => {
  const socials = ["instagram", "linkedin", "facebook", "x", "reddit", "snapchat"];
  const activeSocials = socials.filter((s) => org[s]);

  return (
    <Card className="bg-card/70 border-border/60 hover:border-border transition-colors">
      <CardContent className="p-5 space-y-4">
        {/* Header: Avatar + Name + Verified Badge */}
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-border/40">
            {org.logo ? (
              <AvatarImage src={org.logo} alt={org.name} />
            ) : null}
            <AvatarFallback className="text-base font-semibold">
              {org.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold truncate">{org.name}</h3>
              {org.isVerified && (
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
              )}
              {org.isSuspended && (
                <Badge variant="destructive" className="text-[10px]">
                  <Lock className="mr-1 h-3 w-3" />
                  Suspended
                </Badge>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {[org.address, org.state].filter(Boolean).join(", ") || "No location"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {org.description && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {org.description}
          </p>
        )}

        {org.isSuspended && org.suspensionReason && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {org.suspensionReason}
          </div>
        )}

        <Separator className="bg-border/40" />

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {org.email && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground truncate">{org.email}</span>
            </div>
          )}
          {org.contact && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="text-muted-foreground">{org.contact}</span>
            </div>
          )}
        </div>

        {/* GST + Joined Date Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {org.gstNumber && (
            <Badge variant="outline" className="text-xs border-border/60 px-2.5 py-1">
              GST: {org.gstNumber}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Joined {formatDate(org.createdAt)}
          </div>
        </div>

        {/* Social Links */}
        {activeSocials.length > 0 && (
          <>
            <Separator className="bg-border/40" />
            <div className="flex items-center gap-2 flex-wrap">
              {activeSocials.map((platform) => (
                <SocialLink key={platform} platform={platform} value={org[platform]} />
              ))}
            </div>
          </>
        )}

        <Separator className="bg-border/40" />
        <Link
          to={`/promoter/organizers/${org.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80 transition"
        >
          View details <ChevronRight className="w-4 h-4" />
        </Link>
      </CardContent>
    </Card>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="bg-card/70 border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Separator className="bg-border/40" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <Skeleton className="h-6 w-1/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const PromoterOrganizers = () => {
  const { organizers, loading, error } = useOrganizers();
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return organizers;
    const q = searchQuery.toLowerCase();
    return organizers.filter(
      (org) =>
        org.name?.toLowerCase().includes(q) ||
        org.email?.toLowerCase().includes(q) ||
        org.state?.toLowerCase().includes(q) ||
        org.address?.toLowerCase().includes(q) ||
        org.contact?.includes(q)
    );
  }, [organizers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Organizers</h2>
          <p className="text-muted-foreground">
            All verified organizers registered on the platform.
          </p>
        </div>
        {!loading && (
          <Badge variant="outline" className="text-sm py-1 px-3 border-border/70">
            <Building2 className="w-3.5 h-3.5 mr-1.5" />
            {filtered.length} Organizer{filtered.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Search */}
      {!loading && !error && organizers.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, state, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-destructive">Failed to load organizers</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && <LoadingSkeleton />}

      {/* Empty State */}
      {!loading && !error && filtered.length === 0 && (
        <Card className="bg-card/70 border-border/60">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-lg font-medium">
              {searchQuery ? "No organizers match your search" : "No organizers found"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Try adjusting your search terms."
                : "Organizers will appear here once they register."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Organizer Cards Grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((org) => (
            <OrganizerCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromoterOrganizers;
