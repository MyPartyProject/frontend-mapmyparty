import { buildUrl } from "@/config/api";

let sessionPromise = null;
let cachedSession = null;
let sessionCacheTime = 0;
let isRefreshing = false;
let refreshSubscribers = [];

// Keep this short so organizer onboarding/session state refreshes quickly.
const SESSION_CACHE_TTL = 60 * 1000;

const UNAUTHENTICATED_SESSION = {
  isAuthenticated: false,
  user: null,
  role: null,
};

function clearSessionStorageHints() {
  sessionStorage.removeItem("isAuthenticated");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("userType");
  sessionStorage.removeItem("userProfile");
  sessionStorage.removeItem("userName");
  sessionStorage.removeItem("userEmail");
  sessionStorage.removeItem("userPhone");
  sessionStorage.removeItem("authProvider");
  sessionStorage.removeItem("hasPassword");
}

function subscribeToRefresh(callback) {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(success) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

function normalizeSessionResponse(data) {
  const payload = data?.data || data || {};
  const user = payload?.user || data?.user || null;

  if (!user) {
    return UNAUTHENTICATED_SESSION;
  }

  const role = (
    payload?.role ||
    data?.role ||
    user?.role ||
    "USER"
  )
    .toString()
    .toUpperCase();

  const organizer =
    payload?.organizer ||
    payload?.organizerProfile ||
    data?.organizer ||
    data?.organizerProfile ||
    null;

  const bankDetails = payload?.bankDetails || data?.bankDetails || null;
  const normalizedUser = user
    ? {
        ...user,
        role,
        authProvider: user.authProvider || user.provider || null,
      }
    : null;

  return {
    isAuthenticated: true,
    user: normalizedUser,
    role,
    organizer,
    hasOrganizerProfile: Boolean(payload?.hasOrganizerProfile ?? organizer?.id),
    hasBankDetails: Boolean(payload?.hasBankDetails ?? bankDetails?.id),
    isBankVerified: Boolean(payload?.isBankVerified ?? bankDetails?.verificationStatus === "VERIFIED"),
    bankVerificationStatus: payload?.bankVerificationStatus || bankDetails?.verificationStatus || null,
    bankVerificationRequired: Boolean(payload?.bankVerificationRequired ?? (bankDetails?.id && bankDetails?.verificationStatus !== "VERIFIED")),
    bankDetails,
    onboarding: payload?.onboarding || data?.onboarding || null,
    organizerWarning: payload?.organizerWarning || data?.organizerWarning || null,
  };
}

function syncSessionStorage(session) {
  try {
    if (session?.isAuthenticated) {
      sessionStorage.setItem("isAuthenticated", "true");
      if (session.role) {
        sessionStorage.setItem("role", session.role);
      }
      if (session.user?.type) {
        sessionStorage.setItem("userType", session.user.type);
      }
      if (session.user) {
        sessionStorage.setItem("userProfile", JSON.stringify(session.user));
      }
      if (session.user?.authProvider || session.user?.provider) {
        sessionStorage.setItem("authProvider", session.user.authProvider || session.user.provider);
      }
      if (session.user?.hasPassword !== undefined) {
        sessionStorage.setItem("hasPassword", session.user.hasPassword ? "true" : "false");
      }
      if (session.user?.name) {
        sessionStorage.setItem("userName", session.user.name);
      }
      if (session.user?.email) {
        sessionStorage.setItem("userEmail", session.user.email);
      }
      if (session.user?.phone) {
        sessionStorage.setItem("userPhone", session.user.phone);
      }
    } else {
      clearSessionStorageHints();
    }
  } catch {
    // sessionStorage is a UI hint only.
  }
}

export async function tryRefreshToken() {
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeToRefresh(resolve);
    });
  }

  isRefreshing = true;

  try {
    const refreshRes = await fetch(buildUrl("auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    const success = refreshRes.ok;
    notifyRefreshSubscribers(success);
    return success;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    notifyRefreshSubscribers(false);
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function fetchSessionInternal(forceRefresh = false) {
  const endpoint = forceRefresh ? "auth/me?force=true" : "auth/me";

  let res;
  try {
    res = await fetch(buildUrl(endpoint), {
      method: "GET",
      credentials: "include",
    });
  } catch (networkError) {
    console.error("Network error fetching session:", networkError);
    throw new Error("Network error: Unable to verify session");
  }

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      res = await fetch(buildUrl(endpoint), {
        method: "GET",
        credentials: "include",
      });
    } else {
      return UNAUTHENTICATED_SESSION;
    }
  }

  if (res.status === 401) {
    return UNAUTHENTICATED_SESSION;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch session: ${res.status}`);
  }

  const data = await res.json().catch(() => ({}));
  return normalizeSessionResponse(data);
}

export async function fetchSession(forceRefresh = false) {
  if (forceRefresh) {
    resetSessionCache();
  }

  if (cachedSession && Date.now() - sessionCacheTime < SESSION_CACHE_TTL) {
    return cachedSession;
  }

  if (!sessionPromise) {
    sessionPromise = fetchSessionInternal(forceRefresh)
      .then((session) => {
        cachedSession = session;
        sessionCacheTime = Date.now();
        syncSessionStorage(session);
        return session;
      })
      .catch((error) => {
        cachedSession = null;
        sessionCacheTime = 0;
        throw error;
      })
      .finally(() => {
        sessionPromise = null;
      });
  }

  return sessionPromise;
}

export function getCachedSession() {
  if (cachedSession && Date.now() - sessionCacheTime < SESSION_CACHE_TTL) {
    return cachedSession;
  }

  try {
    const isAuth = sessionStorage.getItem("isAuthenticated") === "true";
    if (isAuth) {
      const role = (sessionStorage.getItem("role") || "USER").toUpperCase();
      const profileRaw = sessionStorage.getItem("userProfile");
      const user = profileRaw ? JSON.parse(profileRaw) : null;
      return {
        isAuthenticated: true,
        user: user ? { ...user, role } : null,
        role,
      };
    }
  } catch {
    // Ignore parse/storage errors.
  }

  return null;
}

export function clearSessionData() {
  clearSessionStorageHints();
  localStorage.removeItem("userProfile");
  resetSessionCache();
}

export function resetSessionCache() {
  sessionPromise = null;
  cachedSession = null;
  sessionCacheTime = 0;
}

export function isAuthenticated() {
  if (cachedSession && Date.now() - sessionCacheTime < SESSION_CACHE_TTL) {
    return Boolean(cachedSession.isAuthenticated);
  }

  return sessionStorage.getItem("isAuthenticated") === "true";
}
