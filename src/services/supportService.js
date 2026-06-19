import { apiFetch } from "@/config/api";

export const SUPPORT_CATEGORIES = [
  "BOOKING_PAYMENT",
  "REFUND",
  "TICKET_ACCESS",
  "CHECKIN",
  "EVENT_LISTING",
  "ORGANIZER_PROFILE",
  "PAYOUT_BANK",
  "ACCOUNT_ACCESS",
  "TECHNICAL_BUG",
  "OTHER",
];

export const SUPPORT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const SUPPORT_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CLOSED",
];

const getPayload = (response) => response?.data ?? response ?? {};

const normalizeListResponse = (response) => {
  const payload = getPayload(response);
  const items =
    payload?.items ||
    payload?.tickets ||
    payload?.results ||
    (Array.isArray(payload) ? payload : []);

  return {
    items: Array.isArray(items) ? items : [],
    total:
      payload?.total ??
      payload?.count ??
      payload?.pagination?.total ??
      (Array.isArray(items) ? items.length : 0),
    page: payload?.page ?? payload?.pagination?.page ?? 1,
    limit: payload?.limit ?? payload?.pagination?.limit ?? (Array.isArray(items) ? items.length : 0),
    raw: payload,
  };
};

const withQuery = (path, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.append(key, String(value));
  });
  return query.size ? `${path}?${query.toString()}` : path;
};

export async function createSupportTicket(payload) {
  const response = await apiFetch("support/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return getPayload(response);
}

export async function fetchMySupportTickets(params = {}) {
  const response = await apiFetch(withQuery("support/tickets/me", params), {
    method: "GET",
  });
  return normalizeListResponse(response);
}

export async function fetchMySupportTicketDetail(ticketId) {
  const response = await apiFetch(`support/tickets/${ticketId}`, { method: "GET" });
  return getPayload(response);
}

export async function replyToMySupportTicket(ticketId, payload) {
  const response = await apiFetch(`support/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return getPayload(response);
}

export async function fetchAdminSupportQueue(payload = {}) {
  const response = await apiFetch("admin/support/tickets/query", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeListResponse(response);
}

export async function fetchAdminSupportTicketDetail(ticketId) {
  const response = await apiFetch(`admin/support/tickets/${ticketId}`, { method: "GET" });
  return getPayload(response);
}

export async function updateAdminSupportTicketStatus(ticketId, payload) {
  const response = await apiFetch(`admin/support/tickets/${ticketId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return getPayload(response);
}

export async function assignAdminSupportTicket(ticketId, payload) {
  const response = await apiFetch(`admin/support/tickets/${ticketId}/assign`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return getPayload(response);
}

export async function addAdminSupportInternalNote(ticketId, payload) {
  const response = await apiFetch(`admin/support/tickets/${ticketId}/internal-notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return getPayload(response);
}

export async function fetchAdminSupportHistory(ticketId) {
  const response = await apiFetch(`admin/support/tickets/${ticketId}/history`, { method: "GET" });
  return getPayload(response);
}

export async function fetchAdminSupportSummary() {
  const response = await apiFetch("admin/support/summary", { method: "GET" });
  return getPayload(response);
}
