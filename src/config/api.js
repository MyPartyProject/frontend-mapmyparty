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
let challengePromise = null;

const CLEARANCE_STORAGE_KEY = "mmp_browser_clearance";
const CLEARANCE_HEADER = "x-browser-clearance";
const TURNSTILE_ACTION = "mapmyparty_access";

function readStoredClearance() {
  if (typeof localStorage === "undefined") return "";
  try {
    const parsed = JSON.parse(localStorage.getItem(CLEARANCE_STORAGE_KEY) || "null");
    if (!parsed?.token || !parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(CLEARANCE_STORAGE_KEY);
      return "";
    }
    return parsed.token;
  } catch {
    return "";
  }
}

function storeClearance(token, expiresInSeconds) {
  localStorage.setItem(
    CLEARANCE_STORAGE_KEY,
    JSON.stringify({
      token,
      expiresAt: Date.now() + Number(expiresInSeconds || 3600) * 1000,
    }),
  );
}

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Security check is only available in the browser"));
  }
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Security check failed to load")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.turnstile = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Security check failed to load"));
    document.head.appendChild(script);
  });
}

function presentTurnstileChallenge() {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    return Promise.reject(new Error("Security check is not configured"));
  }

  return new Promise((resolve, reject) => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "mmp-challenge-title");
    dialog.style.cssText = "position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.55);padding:16px;";
    dialog.innerHTML = `
      <div style="width:min(420px,100%);background:#fff;color:#0f172a;border-radius:16px;padding:20px;box-shadow:0 20px 50px rgba(0,0,0,.25);">
        <h2 id="mmp-challenge-title" style="margin:0 0 8px;font-size:18px;">Confirm you are using a browser</h2>
        <p id="mmp-challenge-message" style="margin:0 0 16px;font-size:14px;">Complete the security check to continue. Your form entries stay on this page.</p>
        <div id="mmp-turnstile-slot"></div>
        <p id="mmp-challenge-timer" style="min-height:20px;margin:12px 0 0;font-size:13px;"></p>
        <button type="button" id="mmp-challenge-cancel" style="margin-top:12px;">Cancel</button>
      </div>
    `;
    document.body.appendChild(dialog);
    const previousFocus = document.activeElement;
    let settled = false;
    let widgetId = null;
    let cooldownTimer = null;

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      if (cooldownTimer) window.clearInterval(cooldownTimer);
      if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
      dialog.remove();
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      callback();
    };

    dialog.querySelector("#mmp-challenge-cancel").addEventListener("click", () => {
      finish(() => reject(new Error("Security check cancelled")));
    });

    loadTurnstileScript()
      .then(() => {
        widgetId = window.turnstile.render(dialog.querySelector("#mmp-turnstile-slot"), {
          sitekey: siteKey,
          action: TURNSTILE_ACTION,
          callback: async (token) => {
            try {
              const response = await customFetch(buildUrl("auth/challenge/verify"), {
                method: "POST",
                skipChallenge: true,
                body: JSON.stringify({ token, action: TURNSTILE_ACTION, attemptId: crypto.randomUUID() }),
              });
              const payload = await response.json();
              if (!payload?.clearance) throw new Error("Security check could not be confirmed");
              storeClearance(payload.clearance, payload.expiresIn);
              const retryAfter = Number(payload.retryAfter || 0);
              if (retryAfter > 0) {
                const timer = dialog.querySelector("#mmp-challenge-timer");
                let remaining = retryAfter;
                timer.textContent = `Continuing in ${remaining}s`;
                cooldownTimer = window.setInterval(() => {
                  remaining -= 1;
                  timer.textContent = remaining > 0 ? `Continuing in ${remaining}s` : "";
                  if (remaining <= 0) finish(() => resolve(payload.clearance));
                }, 1000);
                return;
              }
              finish(() => resolve(payload.clearance));
            } catch (error) {
              const timer = dialog.querySelector("#mmp-challenge-timer");
              const wait = Number(error?.retryAfter || error?.data?.retryAfter || 0);
              timer.textContent = error?.message || "Security check failed";
              if (wait > 0) {
                let remaining = wait;
                cooldownTimer = window.setInterval(() => {
                  remaining -= 1;
                  timer.textContent = remaining > 0 ? `Retry available in ${remaining}s` : error?.message || "";
                  if (remaining <= 0 && window.turnstile && widgetId !== null) window.turnstile.reset(widgetId);
                }, 1000);
              } else if (window.turnstile && widgetId !== null) {
                window.turnstile.reset(widgetId);
              }
            }
          },
        });
      })
      .catch((error) => finish(() => reject(error)));
  });
}

export function requestBrowserChallenge() {
  if (challengePromise) return challengePromise;
  challengePromise = presentTurnstileChallenge().finally(() => {
    challengePromise = null;
  });
  return challengePromise;
}

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

export async function customFetch(url, options = {}, retrying = false, challengeRetried = false) {
  const {
    headers = {},
    body,
    skipAuthRefresh = false,
    suppressAuthFailure = false,
    skipChallenge = false,
    skipClearance = false,
    ...otherOptions
  } = options;
  const isFormData = body instanceof FormData;
  const clearance = skipClearance ? "" : readStoredClearance();

  const response = await fetch(url, {
    ...otherOptions,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(clearance ? { [CLEARANCE_HEADER]: clearance } : {}),
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

    if (
      response.status === 429
      && errorData.reason === "challenge_required"
      && !skipChallenge
      && !challengeRetried
    ) {
      await requestBrowserChallenge();
      return customFetch(url, options, retrying, true);
    }

    const error = new Error(parseErrorMessage(response.status, errorData));
    error.status = response.status;
    error.data = errorData;
    error.reason = errorData.reason;
    error.retryAfter = Number(errorData.retryAfter || response.headers.get("Retry-After") || 0);
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
