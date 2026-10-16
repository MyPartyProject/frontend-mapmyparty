const GST_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const isValidGstFormat = (value) => !value || GST_FORMAT.test(value.trim().toUpperCase());
