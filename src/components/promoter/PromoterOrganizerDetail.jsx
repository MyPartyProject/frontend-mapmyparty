import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Calendar,
  Globe,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Ticket,
  Users,
  Wallet2,
  Star,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Lock,
} from "lucide-react";
import { useOrganizerDetail } from "@/hooks/useOrganizerDetail";
import {
  manuallyRejectAdminBank,
  manuallyVerifyAdminBank,
  updateAdminOrganizerSuspension,
  verifyAdminOrganizer,
  unverifyAdminOrganizer,
} from "@/services/adminService";
import { toast } from "sonner";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "N/A";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const socialIcons = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  x: Globe,
  reddit: Globe,
  snapchat: Globe,
};

const eventStatusColors = {
  UPCOMING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  ONGOING: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  COMPLETED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
};

const publishStatusColors = {
  PUBLISHED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  DRAFT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  UNPUBLISHED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

// ─── Section: Loading skeleton ─────────────────────────────────
const SectionSkeleton = ({ lines = 3 }) => (
  <Card className="bg-card/70 border-border/60">
    <CardContent className="p-5 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </CardContent>
  </Card>
);

// ─── Section: Error card ───────────────────────────────────────
const SectionError = ({ label, message }) => (
  <Card className="bg-destructive/5 border-destructive/20">
    <CardContent className="p-5 flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
      <p className="text-sm text-muted-foreground">
        Failed to load {label}: {message}
      </p>
    </CardContent>
  </Card>
);

// ─── Section 1: Profile header ─────────────────────────────────
const ProfileHeader = ({
  profile,
  suspensionReason,
  onSuspensionReasonChange,
  onSuspend,
  onReactivate,
  onVerifyToggle,
  bankReviewNote,
  onBankReviewNoteChange,
  onVerifyBank,
  onRejectBank,
  isSubmittingAction,
  isBankActionSubmitting,
  isSuspendDialogOpen,
  onSuspendDialogChange,
  isReactivateDialogOpen,
  onReactivateDialogChange,
}) => {
  const socials = ["instagram", "linkedin", "facebook", "x", "reddit", "snapchat"];
  const activeSocials = socials.filter((s) => profile[s]);

  return (
    <Card className="bg-card/70 border-border/60">
      <CardContent className="p-6 space-y-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar className="h-20 w-20 ring-2 ring-border/40">
            {profile.logo ? <AvatarImage src={profile.logo} alt={profile.name} /> : null}
            <AvatarFallback className="text-xl font-semibold">
              {profile.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              {profile.isVerified && (
                <Badge className="bg-accent/15 text-accent border-accent/30 gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </Badge>
              )}
              {profile.isSuspended && (
                <Badge variant="destructive" className="gap-1">
                  <Lock className="w-3 h-3" /> Suspended
                </Badge>
              )}
              {!profile.isVerified && (
                <Badge variant="secondary" className="gap-1">
                  Unverified
                </Badge>
              )}
            </div>

            {/* Location */}
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              {[profile.address, profile.state].filter(Boolean).join(", ") || "No location"}
            </p>

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {formatDate(profile.createdAt)}
              </span>
              {profile.updatedAt && (
                <span className="flex items-center gap-1">
                  Updated {formatDate(profile.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {profile.description && (
          <>
            <Separator className="bg-border/40" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.description}
            </p>
          </>
        )}

        {profile.isSuspended && (
          <>
            <Separator className="bg-border/40" />
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm font-semibold text-destructive">Organizer suspended</p>
              <p className="mt-1 text-sm text-destructive/80">
                {profile.suspensionReason || "No suspension reason was recorded."}
              </p>
              <p className="mt-2 text-xs text-destructive/70">
                Suspended at {formatDate(profile.suspendedAt)}
              </p>
            </div>
          </>
        )}

        <Separator className="bg-border/40" />

        {/* Contact + GST + Socials row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact info */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</p>
            {profile.email && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground truncate">{profile.email}</span>
              </div>
            )}
            {profile.contact && (
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted/50">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">{profile.contact}</span>
              </div>
            )}
            {profile.gstNumber && (
              <Badge variant="outline" className="text-xs border-border/60 px-2.5 py-1">
                GST: {profile.gstNumber}
              </Badge>
            )}
          </div>

          {/* Social links */}
          {activeSocials.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Social</p>
              <div className="flex flex-wrap gap-2">
                {activeSocials.map((platform) => {
                  const Icon = socialIcons[platform] || Globe;
                  const url = profile[platform];
                  return (
                    <a
                      key={platform}
                      href={url.startsWith("http") ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-accent/15 px-3 py-2 text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="capitalize">{platform}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Separator className="bg-border/40" />

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card/80 p-4">
              <p className="text-xs text-muted-foreground">Access control</p>
              <p className="mt-1 font-semibold">{profile.isSuspended ? "Suspended" : "Active"}</p>
              {profile.suspensionReason && (
                <p className="mt-2 text-xs text-muted-foreground">{profile.suspensionReason}</p>
              )}
            </div>
            <div className="rounded-xl border border-border/60 bg-card/80 p-4">
              <p className="text-xs text-muted-foreground">Bank verification</p>
              <p className="mt-1 font-semibold">{profile.bankDetails?.verificationStatus || "Not submitted"}</p>
              {profile.bankDetails?.verificationMethod && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Method: {profile.bankDetails.verificationMethod}
                </p>
              )}
              {profile.bankDetails?.verifiedAt && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Verified on {formatDate(profile.bankDetails.verifiedAt)}
                </p>
              )}
              {profile.bankDetails?.verificationFailureReason && (
                <p className="mt-2 text-xs text-destructive">
                  {profile.bankDetails.verificationFailureReason}
                </p>
              )}
              {profile.bankDetails?.reviewNotes && (
                <p className="mt-2 text-xs text-muted-foreground">{profile.bankDetails.reviewNotes}</p>
              )}
            </div>
          </div>

          {profile.bankDetails && (
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Manual bank verification</p>
                  <p className="text-xs text-muted-foreground">
                    Promoter review uses the same backend verification action as admin review.
                  </p>
                </div>
                <Badge
                  variant={profile.bankDetails.verificationStatus === "VERIFIED" ? "default" : "outline"}
                  className="w-fit"
                >
                  {profile.bankDetails.verificationStatus || "UNVERIFIED"}
                </Badge>
              </div>

              <Textarea
                value={bankReviewNote}
                onChange={(event) => onBankReviewNoteChange(event.target.value)}
                placeholder="Optional note for approval. Required when rejecting."
                maxLength={500}
                className="min-h-[76px]"
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={onVerifyBank}
                  disabled={isBankActionSubmitting || profile.bankDetails.verificationStatus === "VERIFIED"}
                >
                  {isBankActionSubmitting ? "Updating..." : "Verify bank"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onRejectBank}
                  disabled={isBankActionSubmitting}
                >
                  Reject bank
                </Button>
              </div>
            </div>
          )}

          {profile.adminNotes && (
            <div className="rounded-xl border border-border/60 bg-card/80 p-4">
              <p className="text-xs text-muted-foreground">Admin notes</p>
              <p className="mt-1 text-sm text-muted-foreground">{profile.adminNotes}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant={profile.isVerified ? "outline" : "default"}
              onClick={onVerifyToggle}
              disabled={isSubmittingAction}
            >
              {isSubmittingAction ? "Updating..." : profile.isVerified ? "Unverify organizer" : "Verify organizer"}
            </Button>

            {!profile.isSuspended ? (
              <AlertDialog open={isSuspendDialogOpen} onOpenChange={onSuspendDialogChange}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isSubmittingAction}>
                    Suspend organizer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Suspend this organizer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This prevents organizer-side access while preserving existing events and bookings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="organizer-suspension-reason">
                      Suspension reason
                    </label>
                    <Textarea
                      id="organizer-suspension-reason"
                      value={suspensionReason}
                      onChange={(event) => onSuspensionReasonChange(event.target.value)}
                      placeholder="Explain why this organizer is being suspended."
                      maxLength={500}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmittingAction}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onSuspend}
                      disabled={isSubmittingAction}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isSubmittingAction ? "Suspending..." : "Suspend organizer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog open={isReactivateDialogOpen} onOpenChange={onReactivateDialogChange}>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" disabled={isSubmittingAction}>
                    Reactivate organizer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reactivate this organizer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This restores organizer-side access and clears the active suspension reason.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmittingAction}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onReactivate} disabled={isSubmittingAction}>
                      {isSubmittingAction ? "Updating..." : "Reactivate organizer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Section 2: Stats overview ─────────────────────────────────
const StatsOverview = ({ stats }) => {
  const statCards = [
    {
      label: "Total Events",
      value: stats.events.total,
      sub: `${stats.events.published} published`,
      icon: CalendarClock,
      color: "text-blue-400",
    },
    {
      label: "Total Bookings",
      value: stats.bookings.total,
      sub: `${stats.bookings.confirmed} confirmed`,
      icon: Ticket,
      color: "text-purple-400",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue.total),
      sub: `${stats.ticketsSold} tickets sold`,
      icon: Wallet2,
      color: "text-accent",
    },
    {
      label: "Reviews",
      value: stats.reviews.total,
      sub: stats.reviews.averageRating
        ? `${stats.reviews.averageRating} avg rating`
        : "No ratings yet",
      icon: Star,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="bg-card/70 border-border/60">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ─── Sub-component: Event status breakdown ─────────────────────
const StatusBreakdown = ({ statusBreakdown }) => {
  if (!statusBreakdown || Object.keys(statusBreakdown).length === 0) return null;

  return (
    <Card className="bg-card/70 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" /> Event Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <div
              key={status}
              className={`rounded-lg border px-3 py-2 text-sm ${eventStatusColors[status] || "bg-muted/30 text-muted-foreground border-border/60"}`}
            >
              <span className="font-semibold">{count}</span>{" "}
              <span className="text-xs">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Section 3: Events list ────────────────────────────────────
const EventsList = ({ eventsData }) => {
  const events = eventsData?.events || [];

  return (
    <Card className="bg-card/70 border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-muted-foreground" /> Events
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              All events by this organizer.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-border/60">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No events found for this organizer.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                {event.flyerImage ? (
                  <img
                    src={event.flyerImage}
                    alt={event.title}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <CalendarClock className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {event.category && <span>{event.category}</span>}
                    {event.startDate && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{formatDate(event.startDate)}</span>
                      </>
                    )}
                    {event.venues?.[0]?.city && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.venues[0].city}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Badge
                  className={`text-xs ${eventStatusColors[event.eventStatus] || "bg-muted/30 text-muted-foreground border-border/60"}`}
                >
                  {event.eventStatus}
                </Badge>
                {event.publishStatus && (
                  <Badge
                    className={`text-xs ${publishStatusColors[event.publishStatus] || "bg-muted/30 text-muted-foreground border-border/60"}`}
                  >
                    {event.publishStatus}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs border-border/60">
                  {event.type}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// ─── Section 4: Reviews ────────────────────────────────────────
const ReviewsList = ({ reviewsData }) => {
  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination;

  return (
    <Card className="bg-card/70 border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> Reviews
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              What attendees are saying.
            </CardDescription>
          </div>
          {pagination && (
            <Badge variant="outline" className="border-border/60">
              {pagination.total} review{pagination.total !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No reviews yet for this organizer.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border/60 bg-card/80 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {review.user?.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{review.user?.name || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.title && (
                <p className="text-sm font-medium">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main component ────────────────────────────────────────────
const PromoterOrganizerDetail = () => {
  const { id } = useParams();
  const { profile, stats, events, reviews, loading, errors, refresh } = useOrganizerDetail(id);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [bankReviewNote, setBankReviewNote] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isBankActionSubmitting, setIsBankActionSubmitting] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);

  const handleVerifyToggle = useCallback(async () => {
    if (!profile?.id || isSubmittingAction) return;

    setIsSubmittingAction(true);
    try {
      if (profile.isVerified) {
        await unverifyAdminOrganizer(profile.id);
        toast.success("Organizer unverified.");
      } else {
        await verifyAdminOrganizer(profile.id);
        toast.success("Organizer verified.");
      }
      refresh();
    } catch (error) {
      toast.error(error.message || "Failed to update organizer verification.");
    } finally {
      setIsSubmittingAction(false);
    }
  }, [isSubmittingAction, profile?.id, profile?.isVerified, refresh]);

  const handleOrganizerSuspension = useCallback(
    async (nextIsSuspended) => {
      if (!profile?.id || isSubmittingAction) return;
      if (nextIsSuspended && !suspensionReason.trim()) {
        toast.error("Suspension reason is required.");
        return;
      }

      setIsSubmittingAction(true);
      try {
        await updateAdminOrganizerSuspension(profile.id, {
          isSuspended: nextIsSuspended,
          reason: nextIsSuspended ? suspensionReason.trim() : "",
        });
        toast.success(nextIsSuspended ? "Organizer suspended." : "Organizer reactivated.");
        setIsSuspendDialogOpen(false);
        setIsReactivateDialogOpen(false);
        setSuspensionReason("");
        refresh();
      } catch (error) {
        toast.error(error.message || "Failed to update organizer status.");
      } finally {
        setIsSubmittingAction(false);
      }
    },
    [isSubmittingAction, profile?.id, refresh, suspensionReason]
  );

  const handleManualBankVerify = useCallback(async () => {
    if (!profile?.bankDetails?.id || isBankActionSubmitting) return;

    setIsBankActionSubmitting(true);
    try {
      await manuallyVerifyAdminBank(profile.bankDetails.id, {
        reviewNotes: bankReviewNote.trim(),
      });
      toast.success("Bank account verified.");
      setBankReviewNote("");
      refresh();
    } catch (error) {
      toast.error(error.message || "Failed to verify bank account.");
    } finally {
      setIsBankActionSubmitting(false);
    }
  }, [bankReviewNote, isBankActionSubmitting, profile?.bankDetails?.id, refresh]);

  const handleManualBankReject = useCallback(async () => {
    if (!profile?.bankDetails?.id || isBankActionSubmitting) return;
    const reason = bankReviewNote.trim();
    if (!reason) {
      toast.error("Rejection reason is required.");
      return;
    }

    setIsBankActionSubmitting(true);
    try {
      await manuallyRejectAdminBank(profile.bankDetails.id, {
        reason,
        reviewNotes: reason,
      });
      toast.success("Bank account rejected.");
      setBankReviewNote("");
      refresh();
    } catch (error) {
      toast.error(error.message || "Failed to reject bank account.");
    } finally {
      setIsBankActionSubmitting(false);
    }
  }, [bankReviewNote, isBankActionSubmitting, profile?.bankDetails?.id, refresh]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/promoter/organizers"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to organizers
      </Link>

      {/* Section 1: Profile (API: GET /api/organizer/:id) */}
      {loading.profile && <SectionSkeleton lines={5} />}
      {errors.profile && <SectionError label="profile" message={errors.profile} />}
      {!loading.profile && !errors.profile && profile && (
        <ProfileHeader
          profile={profile}
          suspensionReason={suspensionReason}
          onSuspensionReasonChange={setSuspensionReason}
          onSuspend={() => handleOrganizerSuspension(true)}
          onReactivate={() => handleOrganizerSuspension(false)}
          onVerifyToggle={handleVerifyToggle}
          bankReviewNote={bankReviewNote}
          onBankReviewNoteChange={setBankReviewNote}
          onVerifyBank={handleManualBankVerify}
          onRejectBank={handleManualBankReject}
          isSubmittingAction={isSubmittingAction}
          isBankActionSubmitting={isBankActionSubmitting}
          isSuspendDialogOpen={isSuspendDialogOpen}
          onSuspendDialogChange={setIsSuspendDialogOpen}
          isReactivateDialogOpen={isReactivateDialogOpen}
          onReactivateDialogChange={setIsReactivateDialogOpen}
        />
      )}

      {/* Section 2: Stats (API: GET /api/organizer/:id/stats) */}
      {loading.stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card/70 border-border/60">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {errors.stats && <SectionError label="stats" message={errors.stats} />}
      {!loading.stats && !errors.stats && stats && (
        <>
          <StatsOverview stats={stats} />
          <StatusBreakdown statusBreakdown={stats.events.statusBreakdown} />
        </>
      )}

      {/* Section 3: Events (API: GET /api/admin/organizers/:id/events) */}
      {loading.events && <SectionSkeleton lines={4} />}
      {errors.events && <SectionError label="events" message={errors.events} />}
      {!loading.events && !errors.events && events && <EventsList eventsData={events} />}

      {/* Section 4: Reviews (API: GET /api/organizer/:id/reviews) */}
      {loading.reviews && <SectionSkeleton lines={3} />}
      {errors.reviews && <SectionError label="reviews" message={errors.reviews} />}
      {!loading.reviews && !errors.reviews && reviews && <ReviewsList reviewsData={reviews} />}
    </div>
  );
};

export default PromoterOrganizerDetail;
