const rawEnvBase = import.meta.env.VITE_API_BASE_URL;
const hostedDefault = "https://mapmyparty.com/api";
const localDefault = "http://localhost:9090/api";

// AWS deployed
// const hostedDefault = "https://api.mapmyparty.com/api";
// const localDefault = "https://api.mapmyparty.com/api";

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

let isRefreshing = false;
let refreshSubscribers = [];
let authFailureHandler = null;

function subscribeToRefresh(callback) {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(success) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

function isRefreshRequest(url) {
  return String(url).includes("/auth/refresh");
}

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve) => subscribeToRefresh(resolve));
  }

  isRefreshing = true;

  try {
    const response = await fetch(buildUrl("auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    const ok = response.ok;
    notifyRefreshSubscribers(ok);
    return ok;
  } catch (error) {
    notifyRefreshSubscribers(false);
    return false;
  } finally {
    isRefreshing = false;
  }
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

function emitAuthEvent(name, detail = null) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function setAuthFailureHandler(handler) {
  authFailureHandler = typeof handler === "function" ? handler : null;
}

export async function customFetch(url, options = {}, retrying = false) {
  const { headers = {}, body, ...otherOptions } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(url, {
    credentials: "include",
    headers: isFormData
      ? { ...headers }
      : {
          "Content-Type": "application/json",
          ...headers,
        },
    body,
    ...otherOptions,
  });

  if (response.status === 401 && !retrying && !isRefreshRequest(url)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      emitAuthEvent("auth:token-refreshed");
      return customFetch(url, options, true);
    }

    emitAuthEvent("auth:refresh-failed");
    emitAuthEvent("auth:logout", { reason: "refresh_failed" });
    if (authFailureHandler) {
      authFailureHandler();
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

export async function apiFetch(path, { headers = {}, ...options } = {}) {
  const url = /^https?:/i.test(path) ? path : buildUrl(path);
  const response = await customFetch(url, { headers, ...options });

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
