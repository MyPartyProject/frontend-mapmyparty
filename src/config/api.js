const rawEnvBase = import.meta.env.VITE_API_BASE_URL;
const hostedDefault = "https://api.mapmyparty.com/api";
const localDefault = "http://localhost:9090/api";

export const API_BASE_URL = `${(rawEnvBase || (import.meta.env.DEV ? localDefault : hostedDefault))
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "")}/api`;

if (import.meta.env.DEV && !rawEnvBase) {
  console.warn(`VITE_API_BASE_URL is not set. Using default: ${localDefault}`);
}

export function buildUrl(path = "") {
  let cleanPath = String(path).replace(/^\/+/, "");

  if (
    API_BASE_URL.endsWith("/api") &&
    (cleanPath === "api" || cleanPath.startsWith("api/"))
  ) {
    cleanPath = cleanPath.replace(/^api\/?/, "");
  }

  return `${API_BASE_URL}/${cleanPath}`;
}

let refreshPromise = null;
let authFailureHandler = null;

function isRefreshRequest(url) {
  return String(url).includes("/auth/refresh");
}

function emitAuthEvent(name, detail = null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildUrl("auth/refresh"), {
        method: "POST",
        credentials: "include",
      });

      const ok = response.ok;
      if (ok) {
        emitAuthEvent("auth:token-refreshed");
      }
      return ok;
    } catch (error) {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function parseErrorMessage(status, errorData = {}) {
  return (
    errorData.errorMessage ||
    errorData.message ||
    errorData.error ||
    `HTTP ${status}: Request failed`
  );
}

async function parseErrorBody(response) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    return text ? { message: text } : {};
  } catch {
    return {};
  }
}

export function setAuthFailureHandler(handler) {
  authFailureHandler = typeof handler === "function" ? handler : null;
}

export async function customFetch(url, options = {}, retrying = false) {
  const {
    headers = {},
    body,
    skipAuthRefresh = false,
    suppressAuthFailure = false,
    ...otherOptions
  } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(url, {
    ...otherOptions,
    credentials: "include",
    headers: isFormData
      ? { ...headers }
      : {
          "Content-Type": "application/json",
          ...headers,
        },
    body,
  });

  if (response.status === 401 && !retrying && !skipAuthRefresh && !isRefreshRequest(url)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return customFetch(url, options, true);
    }

    if (!suppressAuthFailure) {
      emitAuthEvent("auth:refresh-failed");
      emitAuthEvent("auth:logout", { reason: "refresh_failed" });
      if (authFailureHandler) {
        authFailureHandler();
      }
    }
  }

  if (!response.ok) {
    const errorData = await parseErrorBody(response);

    if (response.status === 500 && import.meta.env.DEV) {
      console.error("API 500:", url, errorData);
    }

    const error = new Error(parseErrorMessage(response.status, errorData));
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response;
}

let financeAuthorizationHandler = null;
export const setFinanceAuthorizationHandler = (handler) => { financeAuthorizationHandler = handler; };
export async function apiFetch(path, { headers = {}, ...options } = {}) {
  const url = /^https?:/i.test(path) ? path : buildUrl(path);
  const pathname = new URL(url, window.location.origin).pathname;
  const method = (options.method || 'GET').toUpperCase();
  const platformConfigSave = /\/api\/(admin|promoter)\/platform\/config$/.test(pathname) && ['POST', 'PUT'].includes(method);
  const finance = !platformConfigSave && /\/(payouts|payout-config|bank-details|balance-adjustments|finance|refunds|finance-access|finance-approvals)(\/|$)|\/platform\/config|\/gst-verification$/.test(pathname);
  if (pathname.startsWith('/api/admin/') && finance && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !headers['x-finance-authorization']) {
    if (!financeAuthorizationHandler) throw new Error('Open the finance dashboard to authorize this action');
    const requiresApproval = !platformConfigSave && /\/(bank-details|balance-adjustments|payout-config|refunds)(\/|$)|\/platform\/config|\/gst-verification$|\/finance\/(disputes|events)/.test(pathname);
    headers = { ...headers, ...await financeAuthorizationHandler({ method, path: pathname, payload: options.body ? JSON.parse(options.body) : {}, requiresApproval }) };
  }
  const response = await customFetch(url, { headers, ...options });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function getFilenameFromContentDisposition(value) {
  if (!value) return null;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ""));
    } catch {
      return utf8Match[1].replace(/^"|"$/g, "");
    }
  }

  const filenameMatch = /filename="?([^"]+)"?/i.exec(value);
  return filenameMatch?.[1] || null;
}

export async function downloadFile(path, fallbackFileName = "download", options = {}) {
  const url = /^https?:/i.test(path) ? path : buildUrl(path);
  const response = await customFetch(url, {
    method: "GET",
    ...options,
  });

  const blob = await response.blob();
  const fileName =
    getFilenameFromContentDisposition(response.headers.get("content-disposition")) ||
    fallbackFileName;

  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);

  return { fileName };
}
