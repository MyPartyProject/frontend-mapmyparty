export const sanitizeTenDigitPhoneInput = (value) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(2, 12);
  }

  return digits.slice(0, 10);
};

export const isTenDigitPhoneNumber = (value) => /^\d{10}$/.test(String(value || ""));

export const normalizeTenDigitPhoneNumber = (value) => {
  const digits = sanitizeTenDigitPhoneInput(value);
  return isTenDigitPhoneNumber(digits) ? digits : null;
};

export const PHONE_INPUT_PROPS = {
  type: "tel",
  inputMode: "numeric",
  pattern: "[0-9]{10}",
  maxLength: 10,
};
