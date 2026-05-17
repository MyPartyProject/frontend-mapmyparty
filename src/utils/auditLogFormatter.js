const EMPTY_VALUE = "\u2014";

const FIELD_LABELS = {
  verificationStatus: "Verification Status",
  verifiedByRole: "Verified By Role",
  verificationMethod: "Verification Method",
  reviewedByUserId: "Reviewed By",
  verifiedByUserId: "Verified By",
  verifiedAt: "Verified At",
  reviewedAt: "Reviewed At",
  reviewNotes: "Review Notes",
  rejectionReason: "Rejection Reason",
  adminNotes: "Admin Notes",
  isSuspended: "Suspended",
  amountCents: "Amount",
};

const HIDDEN_FIELD_NAMES = new Set(["updatedAt"]);

const SUCCESS_VALUES = new Set(["VERIFIED", "APPROVED", "PROCESSED", "COMPLETED", "ACTIVE", "SUCCESS"]);
const DANGER_VALUES = new Set(["FAILED", "REJECTED", "DECLINED", "SUSPENDED", "CANCELLED", "ERROR"]);
const WARNING_VALUES = new Set(["PENDING", "REQUESTED", "UNVERIFIED", "IN_REVIEW", "PROCESSING", "RETRY"]);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const parsePayload = (payload) => {
  if (typeof payload !== "string") return payload;

  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

const stableStringify = (value) => {
  if (value === undefined) return "undefined";
  if (!isPlainObject(value)) return JSON.stringify(value);

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = value[key];
        return accumulator;
      }, {})
  );
};

const splitKey = (key) =>
  String(key || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean);

export const formatAuditLabel = (path) => {
  const key = Array.isArray(path) ? path[path.length - 1] : path;
  const exactKey = Array.isArray(path) ? path.join(".") : key;

  if (FIELD_LABELS[exactKey]) return FIELD_LABELS[exactKey];
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];

  return splitKey(key)
    .map((part) => {
      const upper = part.toUpperCase();
      if (upper === "ID" || upper === "URL" || upper === "IP" || upper === "IFSC" || upper === "OTP") {
        return upper;
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
};

const isIsoDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) &&
  !Number.isNaN(new Date(value).getTime());

const formatEnumValue = (value) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

export const formatAuditValue = (value, key = "") => {
  const parsedValue = parsePayload(value);

  if (parsedValue === null || parsedValue === undefined || parsedValue === "") {
    return EMPTY_VALUE;
  }

  if (typeof parsedValue === "boolean") {
    return parsedValue ? "Yes" : "No";
  }

  if (typeof parsedValue === "number") {
    if (/amountCents$/i.test(key)) {
      return (parsedValue / 100).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });
    }
    return parsedValue.toLocaleString("en-IN");
  }

  if (Array.isArray(parsedValue)) {
    if (parsedValue.length === 0) return EMPTY_VALUE;
    return parsedValue.map((item) => formatAuditValue(item, key)).join(", ");
  }

  if (isPlainObject(parsedValue)) {
    const fieldCount = Object.keys(parsedValue).length;
    return fieldCount ? `${fieldCount} field${fieldCount === 1 ? "" : "s"}` : EMPTY_VALUE;
  }

  const stringValue = String(parsedValue);

  if (isIsoDate(stringValue)) {
    return new Date(stringValue).toLocaleString("en-IN");
  }

  if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(stringValue) || /^[A-Z][A-Z0-9_ -]+$/.test(stringValue)) {
    return formatEnumValue(stringValue);
  }

  return stringValue;
};

export const getAuditValueTone = (value) => {
  const parsedValue = parsePayload(value);
  const normalized = String(parsedValue || "").trim().toUpperCase();

  if (SUCCESS_VALUES.has(normalized)) return "success";
  if (DANGER_VALUES.has(normalized)) return "danger";
  if (WARNING_VALUES.has(normalized)) return "warning";
  return "neutral";
};

const flattenPayload = (payload, prefix = []) => {
  const parsedPayload = parsePayload(payload);

  if (!isPlainObject(parsedPayload)) {
    return prefix.length ? [{ path: prefix, value: parsedPayload }] : [];
  }

  return Object.entries(parsedPayload).flatMap(([key, value]) => {
    const nextPath = [...prefix, key];

    if (HIDDEN_FIELD_NAMES.has(key)) return [];

    if (isPlainObject(value) && Object.keys(value).length > 0) {
      return flattenPayload(value, nextPath);
    }

    return [{ path: nextPath, value }];
  });
};

const toFieldMap = (payload) =>
  flattenPayload(payload).reduce((accumulator, field) => {
    accumulator[field.path.join(".")] = field;
    return accumulator;
  }, {});

const formatActionTitle = (action) => {
  if (!action) return "Audit activity";
  return formatEnumValue(String(action).replace(/[.:/]+/g, "_"));
};

const buildSummary = (changes) => {
  if (changes.length === 0) {
    return "No field-level changes were recorded for this action.";
  }

  if (changes.length === 1) {
    const change = changes[0];
    return `${change.label} changed from ${change.beforeLabel} to ${change.afterLabel}.`;
  }

  const labels = changes.slice(0, 3).map((change) => change.label).join(", ");
  const suffix = changes.length > 3 ? ` and ${changes.length - 3} more` : "";
  return `${changes.length} fields changed: ${labels}${suffix}.`;
};

export const buildAuditChangeSet = (log) => {
  const beforeMap = toFieldMap(log?.before);
  const afterMap = toFieldMap(log?.after);
  const fieldKeys = Array.from(new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]));

  const changes = fieldKeys
    .map((fieldKey) => {
      const beforeField = beforeMap[fieldKey];
      const afterField = afterMap[fieldKey];
      const beforeValue = beforeField?.value;
      const afterValue = afterField?.value;

      if (stableStringify(beforeValue) === stableStringify(afterValue)) {
        return null;
      }

      const path = afterField?.path || beforeField?.path || fieldKey.split(".");

      return {
        key: fieldKey,
        label: formatAuditLabel(path),
        beforeValue,
        afterValue,
        beforeLabel: formatAuditValue(beforeValue, fieldKey),
        afterLabel: formatAuditValue(afterValue, fieldKey),
        beforeTone: getAuditValueTone(beforeValue),
        afterTone: getAuditValueTone(afterValue),
      };
    })
    .filter(Boolean);

  return {
    title: formatActionTitle(log?.action),
    summary: buildSummary(changes),
    changes,
  };
};
