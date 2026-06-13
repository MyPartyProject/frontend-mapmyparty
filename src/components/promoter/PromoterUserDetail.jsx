import { useCallback, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Lock,
  Loader,
  Mail,
  Phone,
  ShieldCheck,
  Ticket,
  Users,
  Wallet2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
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
import { usePromoterUserDetail } from "@/hooks/usePromoterUserDetail";
import { updateAdminUserSuspension } from "@/services/adminService";
import { toast } from "sonner";

const PromoterUserDetail = () => {
  const { id } = useParams();
  const { currency } = useOutletContext();
  const { user, bookings, loading, isFetching, error, notFound, pagination, changePage, refresh } =
    usePromoterUserDetail(id);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);

  const formatDate = useCallback((value, withTime = false) => {
    if (!value) return "N/A";
    return new Date(value).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    });
  }, []);

  const recentEvents = useMemo(() => {
    const grouped = new Map();

    bookings.forEach((booking) => {
      const key = booking.eventId || booking.id;
      const eventTickets =
        booking.tickets ||
        booking.bookingItems?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) ||
        0;

      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          title: booking.eventTitle || "Unknown event",
          date: booking.eventDate,
          organizer: booking.eventOrganizer || "Unknown organizer",
          tickets: 0,
          spent: 0,
          items: [],
        });
      }

      const event = grouped.get(key);
      event.tickets += eventTickets;
      event.spent += Number(booking.totalAmount || 0);
      event.items.push(booking);
    });

    return Array.from(grouped.values());
  }, [bookings]);

  const avgTicketPrice = user?.totalTickets
    ? Math.round(Number(user.totalSpent || 0) / Number(user.totalTickets || 1))
    : 0;

  const handleSuspensionAction = useCallback(
    async (nextIsSuspended) => {
      if (!user?.id || isSubmittingAction) return;
      if (nextIsSuspended && !suspensionReason.trim()) {
        toast.error("Suspension reason is required.");
        return;
      }

      setIsSubmittingAction(true);
      try {
        await updateAdminUserSuspension(user.id, {
          isSuspended: nextIsSuspended,
          reason: nextIsSuspended ? suspensionReason.trim() : "",
        });
        toast.success(nextIsSuspended ? "User suspended." : "User reactivated.");
        setIsSuspendDialogOpen(false);
        setIsReactivateDialogOpen(false);
        if (!nextIsSuspended) {
          setSuspensionReason("");
        }
        refresh();
      } catch (actionError) {
        toast.error(actionError.message || "Failed to update user status.");
      } finally {
        setIsSubmittingAction(false);
      }
    },
    [isSubmittingAction, refresh, suspensionReason, user?.id]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="space-y-6">
        <Link to="/promoter/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to users
        </Link>
        <Card className="bg-card/70 border-border/60">
          <CardContent className="py-16 text-center">
            <p className="text-lg font-semibold">User not found</p>
            <p className="text-sm text-muted-foreground mt-2">Select another user from the list.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-6">
        <Link to="/promoter/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to users
        </Link>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Error loading user details</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/promoter/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      {isFetching && (
        <div className="h-0.5 w-full bg-muted overflow-hidden rounded-full">
          <div className="h-full w-1/3 bg-primary rounded-full animate-pulse" />
        </div>
      )}

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Some user data could not be refreshed</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{user?.name || "Unnamed user"}</CardTitle>
                  <CardDescription className="text-muted-foreground flex flex-wrap items-center gap-2">
                    <Badge variant={user?.status === "active" ? "success" : "secondary"}>
                      {user?.status || "registered"}
                    </Badge>
                    {user?.isSuspended && (
                      <Badge variant="destructive" className="gap-1">
                        <Lock className="h-3 w-3" />
                        Suspended
                      </Badge>
                    )}
                    {user?.isVerified && (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                    <span className="text-muted-foreground/60">&middot;</span>
                    Joined {formatDate(user?.joinedAt)}
                  </CardDescription>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-2">
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="text-sm">{user?.id || "N/A"}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" /> {user?.email || "No email"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" /> {user?.phone || "No phone"}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" /> Joined {formatDate(user?.joinedAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /> Last booking {formatDate(user?.lastBookingAt, true)}
                </div>
              </div>
              {user?.isSuspended && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                  <p className="text-sm font-semibold text-destructive">Account suspended</p>
                  <p className="mt-1 text-sm text-destructive/80">
                    {user?.suspensionReason || "No suspension reason was recorded."}
                  </p>
                  <p className="mt-2 text-xs text-destructive/70">
                    Suspended at {formatDate(user?.suspendedAt, true)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-card/70 border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Ticket className="w-4 h-4" /> Tickets
                </p>
                <p className="text-2xl font-semibold">{Number(user?.totalTickets || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Confirmed ticket quantity</p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Wallet2 className="w-4 h-4" /> Spent
                </p>
                <p className="text-2xl font-semibold text-accent">{currency(user?.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Confirmed booking spend</p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Avg/Ticket
                </p>
                <p className="text-2xl font-semibold">{currency(avgTicketPrice)}</p>
                <p className="text-xs text-muted-foreground">Average spend per ticket</p>
              </CardContent>
            </Card>
            <Card className="bg-card/70 border-border/60">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Events
                </p>
                <p className="text-2xl font-semibold">{Number(user?.eventsAttended || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Distinct confirmed events</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Recent Events & Bookings</CardTitle>
              <CardDescription className="text-muted-foreground">
                Booking activity for the current page of results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEvents.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-card/80 p-6 text-sm text-muted-foreground">
                  No bookings found for this user.
                </div>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-border/60 bg-card/80 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                          <Users className="w-3 h-3" /> {event.organizer}
                          <span className="text-muted-foreground/60">&middot;</span>
                          <Calendar className="w-3 h-3" /> {formatDate(event.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total spent</p>
                        <p className="font-semibold text-accent">{currency(event.spent)}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tickets booked</span>
                        <span className="font-semibold">{event.tickets}</span>
                      </div>
                      <div className="space-y-2">
                        {event.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-xs text-muted-foreground"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span>{formatDate(item.createdAt, true)}</span>
                              <Badge variant={item.status === "CONFIRMED" ? "success" : "secondary"} className="text-xs">
                                {item.status}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="space-y-1">
                              {item.bookingItems?.map((bookingItem, idx) => (
                                <div key={`${item.id}-${idx}`} className="flex items-center justify-between gap-3">
                                  <span>
                                    {bookingItem.quantity || 0} x {bookingItem.ticketName || "Ticket"}
                                  </span>
                                  <span>{currency(bookingItem.totalAmount || 0)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => changePage(pagination.page - 1)}
                      className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <div className="px-4 text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => changePage(pagination.page + 1)}
                      className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription className="text-muted-foreground">User profile and verification state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{user?.status || "registered"}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-semibold">{formatDate(user?.joinedAt)}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                <p className="text-xs text-muted-foreground">Verification</p>
                <p className="font-semibold flex items-center gap-2">
                  {user?.isVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      Unverified
                    </>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                <p className="text-xs text-muted-foreground">Access</p>
                <p className="font-semibold flex items-center gap-2">
                  {user?.isSuspended ? (
                    <>
                      <Lock className="w-4 h-4 text-destructive" />
                      Suspended
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Active
                    </>
                  )}
                </p>
                {user?.isSuspended && user?.suspensionReason && (
                  <p className="mt-2 text-xs text-muted-foreground">{user.suspensionReason}</p>
                )}
              </div>
              <div className="rounded-xl border border-border/60 bg-card/80 p-3 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Admin action</p>
                  <p className="text-sm text-muted-foreground">
                    Suspend risky users or restore access after review.
                  </p>
                </div>
                {!user?.isSuspended ? (
                  <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        Suspend user
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Suspend this user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This blocks authenticated access immediately. Provide a clear reason for the audit trail.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="user-suspension-reason">
                          Suspension reason
                        </label>
                        <Textarea
                          id="user-suspension-reason"
                          value={suspensionReason}
                          onChange={(event) => setSuspensionReason(event.target.value)}
                          placeholder="Explain why this account is being suspended."
                          maxLength={500}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmittingAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSuspensionAction(true)}
                          disabled={isSubmittingAction}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isSubmittingAction ? "Suspending..." : "Suspend user"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <AlertDialog open={isReactivateDialogOpen} onOpenChange={setIsReactivateDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Reactivate user
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reactivate this user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Access will be restored and the current suspension reason will be cleared.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmittingAction}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleSuspensionAction(false)}
                          disabled={isSubmittingAction}
                        >
                          {isSubmittingAction ? "Updating..." : "Reactivate user"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Booking Stats</CardTitle>
              <CardDescription className="text-muted-foreground">Lifetime activity summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confirmed bookings</span>
                <span className="font-semibold">{Number(user?.totalBookings || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total tickets</span>
                <span className="font-semibold">{Number(user?.totalTickets || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total spent</span>
                <span className="font-semibold text-accent">{currency(user?.totalSpent)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg per ticket</span>
                <span className="font-semibold">{currency(avgTicketPrice)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Events attended</span>
                <span className="font-semibold">{Number(user?.eventsAttended || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription className="text-muted-foreground">Recent booking transactions on this page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookings.length === 0 ? (
                <div className="text-sm text-muted-foreground">No transactions available.</div>
              ) : (
                bookings.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{booking.eventTitle}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(booking.createdAt, true)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currency(booking.totalAmount || 0)}</p>
                      <Badge
                        variant={booking.paymentStatus === "CAPTURED" || booking.status === "CONFIRMED" ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {booking.paymentStatus || booking.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PromoterUserDetail;
