import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Clock3,
  Loader2,
  LifeBuoy,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Shield,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addAdminSupportInternalNote,
  assignAdminSupportTicket,
  createSupportTicket,
  fetchAdminSupportQueue,
  fetchAdminSupportTicketDetail,
  fetchAdminSupportSummary,
  fetchMySupportTicketDetail,
  fetchMySupportTickets,
  replyToMySupportTicket,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
  updateAdminSupportTicketStatus,
} from "@/services/supportService";
import {
  formatSupportDateTime,
  formatSupportLabel,
  supportPriorityTone,
  supportStatusTone,
} from "./supportUi";

const emptyRequesterForm = (defaultSourceSurface, searchParams) => ({
  subject: searchParams.get("subject") || "",
  description: "",
  category: searchParams.get("category") || "OTHER",
  priority: searchParams.get("priority") || "MEDIUM",
  sourceSurface: searchParams.get("sourceSurface") || defaultSourceSurface || "",
  bookingId: searchParams.get("bookingId") || "",
  eventId: searchParams.get("eventId") || "",
  organizerId: searchParams.get("organizerId") || "",
  paymentId: searchParams.get("paymentId") || "",
});

const emptyStaffFilters = {
  status: "ALL",
  priority: "ALL",
  category: "ALL",
  requesterType: "ALL",
  assignee: "",
  organizerId: "",
  eventId: "",
  search: "",
};

const normalizeTicket = (ticket = {}) => {
  const requester = ticket.requester || ticket.requesterUser || ticket.user || {};
  const assignee = ticket.assignee || ticket.assignedToUser || ticket.assignedTo || {};
  const messages = Array.isArray(ticket.messages)
    ? ticket.messages
    : Array.isArray(ticket.thread)
    ? ticket.thread
    : [];

  return {
    ...ticket,
    id: ticket.id || ticket.ticketId || ticket.publicId,
    publicId: ticket.publicId || ticket.ticketNumber || ticket.reference || ticket.id,
    subject: ticket.subject || ticket.title || "Untitled ticket",
    description:
      ticket.description ||
      ticket.descriptionSnapshot ||
      ticket.initialMessage ||
      "",
    status: ticket.status || "OPEN",
    priority: ticket.priority || "MEDIUM",
    category: ticket.category || "OTHER",
    requesterType: ticket.requesterType || ticket.requestType || "USER",
    organizerId: ticket.organizerId || ticket.organizer?.id || "",
    eventId: ticket.eventId || ticket.event?.id || "",
    bookingId: ticket.bookingId || ticket.booking?.id || "",
    paymentId: ticket.paymentId || ticket.payment?.id || "",
    sourceSurface: ticket.sourceSurface || "",
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt || ticket.lastMessageAt || ticket.lastActivityAt || ticket.createdAt,
    resolvedAt: ticket.resolvedAt || null,
    closedAt: ticket.closedAt || null,
    requester: {
      id: requester.id || ticket.requesterUserId || "",
      name: requester.name || requester.fullName || ticket.requesterName || "Unknown requester",
      email: requester.email || ticket.requesterEmail || "",
    },
    assignee: assignee?.id || assignee?.email || assignee?.name
      ? {
          id: assignee.id || "",
          name: assignee.name || assignee.fullName || "",
          email: assignee.email || "",
        }
      : null,
    messages: messages.map((message, index) => ({
      ...message,
      id: message.id || `${ticket.id || "ticket"}-message-${index}`,
      body: message.body || message.message || "",
      messageType: message.messageType || message.type || "PUBLIC_REPLY",
      isInternal: Boolean(message.isInternal),
      createdAt: message.createdAt || message.timestamp || ticket.updatedAt || ticket.createdAt,
      author: {
        id: message.authorUserId || message.author?.id || "",
        name:
          message.author?.name ||
          message.authorName ||
          message.authorRoleSnapshot ||
          (message.messageType === "SYSTEM_EVENT" ? "System" : "Support"),
        role: message.authorRoleSnapshot || message.author?.role || "",
      },
    })),
  };
};

const buildQueuePayload = (filters) => {
  const payload = {
    page: 1,
    limit: 50,
  };
  if (filters.status !== "ALL") payload.status = filters.status;
  if (filters.priority !== "ALL") payload.priority = filters.priority;
  if (filters.category !== "ALL") payload.category = filters.category;
  if (filters.requesterType !== "ALL") payload.requesterType = filters.requesterType;
  if (filters.assignee) payload.assignee = filters.assignee;
  if (filters.organizerId) payload.organizerId = filters.organizerId;
  if (filters.eventId) payload.eventId = filters.eventId;
  if (filters.search) payload.search = filters.search;
  return payload;
};

const SupportWorkspace = ({
  mode = "requester",
  title,
  description,
  defaultSourceSurface = "",
  requesterTypeLabel = "USER",
}) => {
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [internalNoteBody, setInternalNoteBody] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [queueFilters, setQueueFilters] = useState(emptyStaffFilters);
  const [summary, setSummary] = useState(null);
  const [requestForm, setRequestForm] = useState(() =>
    emptyRequesterForm(defaultSourceSurface, searchParams)
  );
  const [assignmentForm, setAssignmentForm] = useState({
    assignedToUserId: "",
    assignedTeamRole: "ADMIN",
  });
  const [statusForm, setStatusForm] = useState({
    status: "OPEN",
    resolutionCode: "",
  });

  const isStaff = mode === "staff";

  const loadSummary = useCallback(async () => {
    if (!isStaff) return;
    try {
      const response = await fetchAdminSupportSummary();
      setSummary(response);
    } catch (error) {
      console.error("Failed to load support summary", error);
    }
  }, [isStaff]);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      if (isStaff) {
        const response = await fetchAdminSupportQueue(buildQueuePayload(queueFilters));
        const normalized = response.items.map(normalizeTicket);
        setTickets(normalized);
        if (!selectedTicketId && normalized[0]?.id) setSelectedTicketId(normalized[0].id);
        if (selectedTicketId && !normalized.some((ticket) => ticket.id === selectedTicketId)) {
          setSelectedTicketId(normalized[0]?.id || "");
        }
      } else {
        const response = await fetchMySupportTickets();
        const normalized = response.items.map(normalizeTicket);
        setTickets(normalized);
        if (!selectedTicketId && normalized[0]?.id) setSelectedTicketId(normalized[0].id);
        if (selectedTicketId && !normalized.some((ticket) => ticket.id === selectedTicketId)) {
          setSelectedTicketId(normalized[0]?.id || "");
        }
      }
    } catch (error) {
      console.error("Failed to load support tickets", error);
      toast.error(error?.message || "Failed to load support tickets");
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [isStaff, queueFilters, selectedTicketId]);

  const loadTicketDetail = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }

    setLoadingDetail(true);
    try {
      const response = isStaff
        ? await fetchAdminSupportTicketDetail(ticketId)
        : await fetchMySupportTicketDetail(ticketId);
      const normalized = normalizeTicket(response);
      setSelectedTicket(normalized);
      setStatusForm({
        status: normalized.status || "OPEN",
        resolutionCode: normalized.resolutionCode || "",
      });
      setAssignmentForm({
        assignedToUserId: normalized.assignee?.id || "",
        assignedTeamRole: normalized.assignedTeamRole || "ADMIN",
      });
    } catch (error) {
      console.error("Failed to load ticket detail", error);
      toast.error(error?.message || "Failed to load ticket detail");
      setSelectedTicket(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [isStaff]);

  useEffect(() => {
    setRequestForm(emptyRequesterForm(defaultSourceSurface, searchParams));
  }, [defaultSourceSurface, searchParams]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (isStaff) {
      loadSummary();
    }
  }, [isStaff, loadSummary]);

  useEffect(() => {
    loadTicketDetail(selectedTicketId);
  }, [loadTicketDetail, selectedTicketId]);

  const handleRequestFormChange = (field, value) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    if (!requestForm.subject.trim() || !requestForm.description.trim()) {
      toast.error("Subject and description are required");
      return;
    }

    setSubmitting(true);
    try {
      const created = normalizeTicket(await createSupportTicket({
        ...requestForm,
        requesterType: requesterTypeLabel,
      }));
      toast.success("Support ticket created");
      setRequestForm(emptyRequesterForm(defaultSourceSurface, searchParams));
      setCreateDialogOpen(false);
      await loadTickets();
      if (created.id) {
        setSelectedTicketId(created.id);
        setDetailDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to create support ticket", error);
      toast.error(error?.message || "Failed to create support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedTicket?.id || !replyBody.trim()) return;
    setSubmitting(true);
    try {
      await replyToMySupportTicket(selectedTicket.id, { body: replyBody.trim() });
      toast.success("Reply sent");
      setReplyBody("");
      await loadTickets();
      await loadTicketDetail(selectedTicket.id);
    } catch (error) {
      console.error("Failed to send reply", error);
      toast.error(error?.message || "Failed to send reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicket?.id) return;
    if (statusForm.status === "CLOSED" && !statusForm.resolutionCode.trim()) {
      toast.error("Resolution code is required before closing a ticket");
      return;
    }

    setSubmitting(true);
    try {
      await updateAdminSupportTicketStatus(selectedTicket.id, {
        status: statusForm.status,
        resolutionCode: statusForm.resolutionCode || undefined,
      });
      toast.success("Ticket status updated");
      await Promise.all([loadTickets(), loadTicketDetail(selectedTicket.id), loadSummary()]);
    } catch (error) {
      console.error("Failed to update support ticket status", error);
      toast.error(error?.message || "Failed to update ticket status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignmentUpdate = async () => {
    if (!selectedTicket?.id) return;
    setSubmitting(true);
    try {
      await assignAdminSupportTicket(selectedTicket.id, {
        assignedToUserId: assignmentForm.assignedToUserId || null,
        assignedTeamRole: assignmentForm.assignedTeamRole || null,
      });
      toast.success("Assignment updated");
      await Promise.all([loadTickets(), loadTicketDetail(selectedTicket.id), loadSummary()]);
    } catch (error) {
      console.error("Failed to update assignment", error);
      toast.error(error?.message || "Failed to update assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInternalNote = async () => {
    if (!selectedTicket?.id || !internalNoteBody.trim()) return;
    setSubmitting(true);
    try {
      await addAdminSupportInternalNote(selectedTicket.id, { body: internalNoteBody.trim() });
      toast.success("Internal note added");
      setInternalNoteBody("");
      await loadTicketDetail(selectedTicket.id);
    } catch (error) {
      console.error("Failed to add internal note", error);
      toast.error(error?.message || "Failed to add internal note");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMeta = useMemo(() => {
    if (!selectedTicket) return [];
    return [
      selectedTicket.bookingId ? { label: "Booking", value: selectedTicket.bookingId } : null,
      selectedTicket.eventId ? { label: "Event", value: selectedTicket.eventId } : null,
      selectedTicket.organizerId ? { label: "Organizer", value: selectedTicket.organizerId } : null,
      selectedTicket.paymentId ? { label: "Payment", value: selectedTicket.paymentId } : null,
      selectedTicket.sourceSurface ? { label: "Source", value: selectedTicket.sourceSurface } : null,
    ].filter(Boolean);
  }, [selectedTicket]);

  const handleTicketCardClick = (ticketId) => {
    setSelectedTicketId(ticketId);
    if (!isStaff) {
      setDetailDialogOpen(true);
    }
  };

  const requesterDetailContent = selectedTicket ? (
    <>
      <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">
              {selectedTicket.publicId || selectedTicket.id}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white sm:text-xl">{selectedTicket.subject}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-white/55">
              {selectedTicket.description || "No description provided."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={supportStatusTone(selectedTicket.status)}>
              {formatSupportLabel(selectedTicket.status)}
            </Badge>
            <Badge className={supportPriorityTone(selectedTicket.priority)}>
              {formatSupportLabel(selectedTicket.priority)}
            </Badge>
            <Badge className="border-white/15 bg-white/5 text-white/70">
              {formatSupportLabel(selectedTicket.category)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/35">Requester</p>
            <p className="mt-2 text-sm font-medium text-white">{selectedTicket.requester?.name}</p>
            <p className="text-xs text-white/45">{selectedTicket.requester?.email || "No email"}</p>
            <p className="mt-1 text-xs text-white/45">
              {formatSupportLabel(selectedTicket.requesterType)}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-white/35">Timeline</p>
            <p className="mt-2 text-xs text-white/55">Created: {formatSupportDateTime(selectedTicket.createdAt)}</p>
            <p className="text-xs text-white/55">Updated: {formatSupportDateTime(selectedTicket.updatedAt)}</p>
            {selectedTicket.resolvedAt && (
              <p className="text-xs text-white/55">Resolved: {formatSupportDateTime(selectedTicket.resolvedAt)}</p>
            )}
            {selectedTicket.closedAt && (
              <p className="text-xs text-white/55">Closed: {formatSupportDateTime(selectedTicket.closedAt)}</p>
            )}
          </div>
        </div>

        {selectedMeta.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMeta.map((item) => (
              <Badge key={`${item.label}-${item.value}`} className="border-white/15 bg-white/5 text-white/70">
                {item.label}: {item.value}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-white/60" />
          <h3 className="text-base font-semibold text-white">Conversation</h3>
        </div>
        <div className="space-y-3">
          {selectedTicket.messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-sm text-white/50">
              No replies yet.
            </div>
          ) : (
            selectedTicket.messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-xl border p-4 ${
                  message.isInternal
                    ? "border-amber-500/20 bg-amber-500/10"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">{message.author?.name || "Support"}</p>
                  <Badge
                    className={
                      message.isInternal
                        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                        : "border-white/15 bg-white/5 text-white/70"
                    }
                  >
                    {formatSupportLabel(message.messageType)}
                  </Badge>
                  <span className="text-xs text-white/40">{formatSupportDateTime(message.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">
                  {message.body || "No content"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="text-base text-white">Reply</CardTitle>
          <CardDescription className="text-white/45">
            {selectedTicket.status === "CLOSED"
              ? "Closed tickets cannot receive new requester replies."
              : "Reply in-thread and staff will see the update in the queue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={replyBody}
            onChange={(event) => setReplyBody(event.target.value)}
            className="min-h-[120px] border-white/[0.08] bg-white/[0.03] text-white"
            placeholder="Add more context or answer the support team."
            disabled={selectedTicket.status === "CLOSED"}
          />
          <Button onClick={handleReply} disabled={submitting || selectedTicket.status === "CLOSED"}>
            <Send className="h-4 w-4" />
            Send reply
          </Button>
        </CardContent>
      </Card>
    </>
  ) : null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-white/45">{description}</p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
          onClick={() => {
            loadTickets();
            if (selectedTicketId) loadTicketDetail(selectedTicketId);
            if (isStaff) loadSummary();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {isStaff && summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Open", value: summary?.open ?? summary?.counts?.open ?? 0, icon: LifeBuoy },
            { label: "Unassigned", value: summary?.unassigned ?? summary?.counts?.unassigned ?? 0, icon: UserRound },
            { label: "Waiting for user", value: summary?.waitingForUser ?? summary?.counts?.waitingForUser ?? 0, icon: Clock3 },
          ].map((item) => (
            <Card key={item.label} className="border-white/[0.08] bg-white/[0.03]">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05]">
                  <item.icon className="h-5 w-5 text-white/70" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isStaff && (
        <Card className="border-white/[0.08] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Plus className="h-4 w-4" />
              Create a Ticket
            </CardTitle>
            <CardDescription className="text-white/45">
              Raise an issue from your dashboard and keep all replies in one thread.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-white">Start a new support conversation</p>
                <p className="mt-1 text-xs text-white/45">
                  Open the ticket form in a focused modal and submit from any device.
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Create ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isStaff && (
        <Card className="border-white/[0.08] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">Queue Filters</CardTitle>
            <CardDescription className="text-white/45">
              Narrow the shared support queue before opening a ticket.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-white/70">Status</Label>
              <Select
                value={queueFilters.status}
                onValueChange={(value) => setQueueFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  {SUPPORT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatSupportLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Priority</Label>
              <Select
                value={queueFilters.priority}
                onValueChange={(value) => setQueueFilters((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All priorities</SelectItem>
                  {SUPPORT_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {formatSupportLabel(priority)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Category</Label>
              <Select
                value={queueFilters.category}
                onValueChange={(value) => setQueueFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All categories</SelectItem>
                  {SUPPORT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {formatSupportLabel(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Requester</Label>
              <Select
                value={queueFilters.requesterType}
                onValueChange={(value) => setQueueFilters((prev) => ({ ...prev, requesterType: value }))}
              >
                <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All requesters</SelectItem>
                  <SelectItem value="USER">Attendees</SelectItem>
                  <SelectItem value="ORGANIZER">Organizers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Search</Label>
              <Input
                value={queueFilters.search}
                onChange={(event) => setQueueFilters((prev) => ({ ...prev, search: event.target.value }))}
                className="border-white/[0.08] bg-white/[0.03] text-white"
                placeholder="Subject, public id, email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Assignee</Label>
              <Input
                value={queueFilters.assignee}
                onChange={(event) => setQueueFilters((prev) => ({ ...prev, assignee: event.target.value }))}
                className="border-white/[0.08] bg-white/[0.03] text-white"
                placeholder="User id or email"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Organizer ID</Label>
              <Input
                value={queueFilters.organizerId}
                onChange={(event) => setQueueFilters((prev) => ({ ...prev, organizerId: event.target.value }))}
                className="border-white/[0.08] bg-white/[0.03] text-white"
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Event ID</Label>
              <Input
                value={queueFilters.eventId}
                onChange={(event) => setQueueFilters((prev) => ({ ...prev, eventId: event.target.value }))}
                className="border-white/[0.08] bg-white/[0.03] text-white"
                placeholder="Optional"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className={`grid grid-cols-1 gap-6 ${isStaff ? "xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
        <Card className="border-white/[0.08] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">{isStaff ? "Ticket Queue" : "Your Tickets"}</CardTitle>
            <CardDescription className="text-white/45">
              {loadingTickets ? "Loading..." : `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className={isStaff ? "space-y-3" : ""}>
            {loadingTickets ? (
              <div className="flex items-center justify-center py-12 text-white/50">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center">
                <LifeBuoy className="mx-auto mb-3 h-8 w-8 text-white/25" />
                <p className="text-sm text-white/55">No support tickets found.</p>
              </div>
            ) : (
              <div className={isStaff ? "space-y-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
                {tickets.map((ticket) => {
                const active = ticket.id === selectedTicketId;
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleTicketCardClick(ticket.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#D60024]/45 bg-[#D60024]/10"
                        : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {ticket.publicId || ticket.id} • {formatSupportDateTime(ticket.updatedAt)}
                        </p>
                      </div>
                      <Badge className={supportStatusTone(ticket.status)}>
                        {formatSupportLabel(ticket.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={supportPriorityTone(ticket.priority)}>
                        {formatSupportLabel(ticket.priority)}
                      </Badge>
                      <Badge className="border-white/15 bg-white/5 text-white/70">
                        {formatSupportLabel(ticket.category)}
                      </Badge>
                      {isStaff && (
                        <Badge className="border-white/15 bg-white/5 text-white/70">
                          {formatSupportLabel(ticket.requesterType)}
                        </Badge>
                      )}
                    </div>
                    {!isStaff && (
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                        <span className="text-xs text-white/40">
                          {ticket.messages?.length || 0} message{ticket.messages?.length === 1 ? "" : "s"}
                        </span>
                        <span className="text-xs font-medium text-[#D60024]">View details</span>
                      </div>
                    )}
                  </button>
                );
              })}
              </div>
            )}
          </CardContent>
        </Card>

        {isStaff && (
        <Card className="border-white/[0.08] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">Ticket Detail</CardTitle>
            <CardDescription className="text-white/45">
              Full thread, context, and workflow controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-20 text-white/50">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading detail...
              </div>
            ) : !selectedTicket ? (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/25" />
                <p className="text-sm text-white/55">Select a ticket to view the conversation.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                        {selectedTicket.publicId || selectedTicket.id}
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">{selectedTicket.subject}</h2>
                      <p className="mt-2 text-sm text-white/55 whitespace-pre-wrap">
                        {selectedTicket.description || "No description provided."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={supportStatusTone(selectedTicket.status)}>
                        {formatSupportLabel(selectedTicket.status)}
                      </Badge>
                      <Badge className={supportPriorityTone(selectedTicket.priority)}>
                        {formatSupportLabel(selectedTicket.priority)}
                      </Badge>
                      <Badge className="border-white/15 bg-white/5 text-white/70">
                        {formatSupportLabel(selectedTicket.category)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">Requester</p>
                      <p className="mt-2 text-sm font-medium text-white">{selectedTicket.requester?.name}</p>
                      <p className="text-xs text-white/45">{selectedTicket.requester?.email || "No email"}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {formatSupportLabel(selectedTicket.requesterType)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-white/35">Timeline</p>
                      <p className="mt-2 text-xs text-white/55">Created: {formatSupportDateTime(selectedTicket.createdAt)}</p>
                      <p className="text-xs text-white/55">Updated: {formatSupportDateTime(selectedTicket.updatedAt)}</p>
                      {selectedTicket.resolvedAt && (
                        <p className="text-xs text-white/55">Resolved: {formatSupportDateTime(selectedTicket.resolvedAt)}</p>
                      )}
                      {selectedTicket.closedAt && (
                        <p className="text-xs text-white/55">Closed: {formatSupportDateTime(selectedTicket.closedAt)}</p>
                      )}
                    </div>
                  </div>

                  {selectedMeta.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedMeta.map((item) => (
                        <Badge key={`${item.label}-${item.value}`} className="border-white/15 bg-white/5 text-white/70">
                          {item.label}: {item.value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {isStaff && (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <Card className="border-white/[0.08] bg-white/[0.02]">
                      <CardHeader>
                        <CardTitle className="text-base text-white">Assignment</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-white/70">Assigned user</Label>
                          <Input
                            value={assignmentForm.assignedToUserId}
                            onChange={(event) =>
                              setAssignmentForm((prev) => ({
                                ...prev,
                                assignedToUserId: event.target.value,
                              }))
                            }
                            className="border-white/[0.08] bg-white/[0.03] text-white"
                            placeholder="User id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">Team role</Label>
                          <Input
                            value={assignmentForm.assignedTeamRole}
                            onChange={(event) =>
                              setAssignmentForm((prev) => ({
                                ...prev,
                                assignedTeamRole: event.target.value,
                              }))
                            }
                            className="border-white/[0.08] bg-white/[0.03] text-white"
                            placeholder="ADMIN"
                          />
                        </div>
                        <Button onClick={handleAssignmentUpdate} disabled={submitting}>
                          <Shield className="h-4 w-4" />
                          Save assignment
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-white/[0.08] bg-white/[0.02]">
                      <CardHeader>
                        <CardTitle className="text-base text-white">Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label className="text-white/70">Status</Label>
                          <Select
                            value={statusForm.status}
                            onValueChange={(value) => setStatusForm((prev) => ({ ...prev, status: value }))}
                          >
                            <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORT_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {formatSupportLabel(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white/70">Resolution code</Label>
                          <Input
                            value={statusForm.resolutionCode}
                            onChange={(event) =>
                              setStatusForm((prev) => ({
                                ...prev,
                                resolutionCode: event.target.value,
                              }))
                            }
                            className="border-white/[0.08] bg-white/[0.03] text-white"
                            placeholder="Required before close"
                          />
                        </div>
                        <Button onClick={handleStatusUpdate} disabled={submitting}>
                          <Clock3 className="h-4 w-4" />
                          Update status
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-white/60" />
                    <h3 className="text-base font-semibold text-white">Conversation</h3>
                  </div>
                  <div className="space-y-3">
                    {selectedTicket.messages.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-5 text-sm text-white/50">
                        No replies yet.
                      </div>
                    ) : (
                      selectedTicket.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`rounded-xl border p-4 ${
                            message.isInternal
                              ? "border-amber-500/20 bg-amber-500/10"
                              : "border-white/[0.08] bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-white">{message.author?.name || "Support"}</p>
                            <Badge
                              className={
                                message.isInternal
                                  ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                                  : "border-white/15 bg-white/5 text-white/70"
                              }
                            >
                              {formatSupportLabel(message.messageType)}
                            </Badge>
                            <span className="text-xs text-white/40">{formatSupportDateTime(message.createdAt)}</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">
                            {message.body || "No content"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {!isStaff && (
                  <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Reply</CardTitle>
                      <CardDescription className="text-white/45">
                        {selectedTicket.status === "CLOSED"
                          ? "Closed tickets cannot receive new requester replies."
                          : "Reply in-thread and staff will see the update in the queue."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={replyBody}
                        onChange={(event) => setReplyBody(event.target.value)}
                        className="min-h-[120px] border-white/[0.08] bg-white/[0.03] text-white"
                        placeholder="Add more context or answer the support team."
                        disabled={selectedTicket.status === "CLOSED"}
                      />
                      <Button onClick={handleReply} disabled={submitting || selectedTicket.status === "CLOSED"}>
                        <Send className="h-4 w-4" />
                        Send reply
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {isStaff && (
                  <Card className="border-white/[0.08] bg-white/[0.02]">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Internal Note</CardTitle>
                      <CardDescription className="text-white/45">
                        Internal notes stay hidden from the requester.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={internalNoteBody}
                        onChange={(event) => setInternalNoteBody(event.target.value)}
                        className="min-h-[120px] border-white/[0.08] bg-white/[0.03] text-white"
                        placeholder="Add triage notes, handoff context, or internal observations."
                      />
                      <Button onClick={handleInternalNote} disabled={submitting}>
                        <AlertCircle className="h-4 w-4" />
                        Add internal note
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {!isStaff && (
        <>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl rounded-2xl border-white/[0.08] bg-[#0e0e18] p-0 text-white sm:w-full">
              <DialogHeader className="border-b border-white/[0.06] px-4 py-4 sm:px-6">
                <DialogTitle className="text-white">Create Ticket</DialogTitle>
                <DialogDescription className="text-white/45">
                  Share the issue once and track replies from the same thread.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[calc(100dvh-10rem)] overflow-y-auto px-4 py-4 sm:px-6">
                <form onSubmit={handleCreateTicket} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-white/70">Subject</Label>
                    <Input
                      value={requestForm.subject}
                      onChange={(event) => handleRequestFormChange("subject", event.target.value)}
                      className="border-white/[0.08] bg-white/[0.03] text-white"
                      placeholder="Describe the issue briefly"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Category</Label>
                    <Select value={requestForm.category} onValueChange={(value) => handleRequestFormChange("category", value)}>
                      <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {formatSupportLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Priority</Label>
                    <Select value={requestForm.priority} onValueChange={(value) => handleRequestFormChange("priority", value)}>
                      <SelectTrigger className="border-white/[0.08] bg-white/[0.03] text-white">
                        <SelectValue placeholder="Choose priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_PRIORITIES.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {formatSupportLabel(priority)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Booking ID</Label>
                    <Input
                      value={requestForm.bookingId}
                      onChange={(event) => handleRequestFormChange("bookingId", event.target.value)}
                      className="border-white/[0.08] bg-white/[0.03] text-white"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Event ID</Label>
                    <Input
                      value={requestForm.eventId}
                      onChange={(event) => handleRequestFormChange("eventId", event.target.value)}
                      className="border-white/[0.08] bg-white/[0.03] text-white"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-white/70">Description</Label>
                    <Textarea
                      value={requestForm.description}
                      onChange={(event) => handleRequestFormChange("description", event.target.value)}
                      className="min-h-[160px] border-white/[0.08] bg-white/[0.03] text-white"
                      placeholder="Explain what happened, what you expected, and any IDs or timeline that can help."
                    />
                  </div>
                  <DialogFooter className="gap-2 lg:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.08]"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create ticket
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl rounded-2xl border-white/[0.08] bg-[#0e0e18] p-0 text-white sm:w-full">
              <DialogHeader className="border-b border-white/[0.06] px-4 py-4 sm:px-6">
                <DialogTitle className="text-white">Ticket Details</DialogTitle>
                <DialogDescription className="text-white/45">
                  Review the full thread and continue the conversation from here.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto px-4 py-4 sm:px-6">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-20 text-white/50">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading detail...
                  </div>
                ) : !selectedTicket ? (
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                    <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/25" />
                    <p className="text-sm text-white/55">Select a ticket to view the conversation.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {requesterDetailContent}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default SupportWorkspace;
