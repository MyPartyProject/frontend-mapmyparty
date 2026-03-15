export const PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_REQUIREMENTS_TEXT =
  "Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&).";

export function isStrongPassword(password) {
  return PASSWORD_PATTERN.test(password || "");
}
