import { apiFetch } from "@/config/api";

export async function fetchAdminOrganizers(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });
  const response = await apiFetch(`admin/organizers${query.toString() ? `?${query.toString()}` : ""}`);
  return response.data;
}

export async function fetchAdminOrganizerDetail(id) {
  const response = await apiFetch(`admin/organizers/${id}`);
  return response.data;
}

export async function verifyAdminOrganizer(id) {
  const response = await apiFetch(`admin/organizers/${id}/verify`, {
    method: "PATCH",
  });
  return response.data;
}

export async function unverifyAdminOrganizer(id) {
  const response = await apiFetch(`admin/organizers/${id}/unverify`, {
    method: "PATCH",
  });
  return response.data;
}

export async function updateAdminOrganizerSuspension(id, payload) {
  const response = await apiFetch(`admin/organizers/${id}/suspension`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateAdminUserSuspension(userId, payload) {
  const response = await apiFetch(`admin/users/${userId}/suspension`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminTaskSummary() {
  const response = await apiFetch("admin/tasks/summary");
  return response.data;
}

export async function fetchModerationEventDetail(eventId) {
  const response = await apiFetch(`admin/moderation/events/${eventId}`);
  return response.data;
}

export async function reviewModerationEvent(eventId, payload) {
  const response = await apiFetch(`admin/moderation/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminEvents(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });
  const response = await apiFetch(`admin/events${query.toString() ? `?${query.toString()}` : ""}`);
  return response.data;
}

export async function fetchAdminPayouts(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });
  const response = await apiFetch(`admin/payouts${query.toString() ? `?${query.toString()}` : ""}`);
  return response.data;
}

export async function createAdminPayout(payload) {
  const response = await apiFetch("admin/payouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminPayoutDetail(payoutId) {
  const response = await apiFetch(`admin/payouts/${payoutId}`);
  return response.data;
}

export async function calculateEventPayout(eventId) {
  const response = await apiFetch(`admin/events/${eventId}/payouts/calculate`, {
    method: "POST",
  });
  return response.data;
}

export async function createEventPayout(eventId, payload = {}) {
  const response = await apiFetch(`admin/events/${eventId}/payouts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function approveEventPayout(payoutId, payload = {}) {
  const response = await apiFetch(`admin/payouts/${payoutId}/approve`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function holdEventPayout(payoutId, payload = {}) {
  const response = await apiFetch(`admin/payouts/${payoutId}/hold`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateAdminPayoutStatus(payoutId, payload) {
  const response = await apiFetch(`admin/payouts/${payoutId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminBankDetails(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });
  const response = await apiFetch(`admin/bank-details${query.toString() ? `?${query.toString()}` : ""}`);
  return response.data;
}

export async function updateAdminBankReview(id, payload) {
  const response = await apiFetch(`admin/bank-details/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function manuallyVerifyAdminBank(id, payload = {}) {
  const response = await apiFetch(`admin/bank-details/${id}/verify-manually`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function manuallyRejectAdminBank(id, payload = {}) {
  const response = await apiFetch(`admin/bank-details/${id}/reject-manually`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminRefunds(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });
  const response = await apiFetch(`admin/refunds${query.toString() ? `?${query.toString()}` : ""}`);
  return response.data;
}

export async function updateAdminRefundStatus(refundId, payload) {
  const response = await apiFetch(`admin/refunds/${refundId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminAuditLogs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, value);
    }
  });
  const response = await apiFetch(`admin/audit-logs${query.toString() ? `?${query.toString()}` : ""}`);
  return response.data;
}

export async function fetchPlatformConfig() {
  const response = await apiFetch("admin/platform/config");
  return response.data;
}

export async function savePlatformConfig(payload) {
  const response = await apiFetch("admin/platform/config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function fetchAdminProfile() {
  const response = await apiFetch("admin/me/profile");
  return response.data?.user || response.user || response.data;
}

export async function updateAdminProfile(payload) {
  const response = await apiFetch("admin/me/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return response.data?.user || response.user || response.data;
}
