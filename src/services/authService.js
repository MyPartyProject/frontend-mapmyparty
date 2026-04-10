import { apiFetch } from "@/config/api";

export function requestPasswordReset(email, role) {
  return apiFetch("auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(role ? { email, role } : { email }),
  });
}

export function resetPasswordWithToken({ token, newPassword }) {
  return apiFetch("auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
