import { fetchSession, resetSessionCache } from "@/utils/auth";

const ONBOARDING_CACHE_TTL = 30 * 1000;

let cachedStatus = null;
let cacheTime = 0;
let cachedUserId = null;
let pendingStatusPromise = null;
let pendingUserId = null;

const hasBankDetailsData = (bankDetails) =>
  Boolean(
    bankDetails?.id ||
      bankDetails?.accountHolder ||
      bankDetails?.accountNumber ||
      bankDetails?.ifscCode ||
      bankDetails?.bankName
  );

const normalizeStatus = (payload = {}) => {
  const organizerProfile = payload?.organizerProfile || payload?.organizer || null;
  const bankDetails = payload?.bankDetails || null;
  const hasOrganizerProfile = Boolean(
    payload?.hasOrganizerProfile ?? organizerProfile?.id
  );
  const hasBankDetails = Boolean(payload?.hasBankDetails ?? hasBankDetailsData(bankDetails));

  return {
    hasOrganizerProfile,
    hasBankDetails,
    completed: Boolean(payload?.completed ?? (hasOrganizerProfile && hasBankDetails)),
    nextStep:
      payload?.nextStep ||
      (hasOrganizerProfile ? (hasBankDetails ? "COMPLETE" : "ADD_BANK_DETAILS") : "CREATE_PROFILE"),
    organizerProfile: hasOrganizerProfile ? organizerProfile : null,
    bankDetails: hasBankDetails ? bankDetails : null,
  };
};

export function clearOrganizerOnboardingCache() {
  cachedStatus = null;
  cacheTime = 0;
  cachedUserId = null;
  pendingStatusPromise = null;
  pendingUserId = null;
  resetSessionCache();
}

export async function fetchOrganizerOnboardingStatus({ forceRefresh = false, userId = null } = {}) {
  if (
    !forceRefresh &&
    userId &&
    cachedUserId === userId &&
    cachedStatus &&
    Date.now() - cacheTime < ONBOARDING_CACHE_TTL
  ) {
    return cachedStatus;
  }

  if (
    !forceRefresh &&
    userId &&
    pendingStatusPromise &&
    pendingUserId === userId
  ) {
    return pendingStatusPromise;
  }

  const requestPromise = (async () => {
    const session = await fetchSession(forceRefresh);
    const organizerProfile = session?.organizer || null;
    const hasOrganizerProfile = Boolean(session?.hasOrganizerProfile ?? organizerProfile?.id);
    const bankDetails = session?.bankDetails || null;
    const hasBankDetails = Boolean(session?.hasBankDetails ?? hasBankDetailsData(bankDetails));

    return normalizeStatus({
      organizer: organizerProfile,
      hasOrganizerProfile,
      bankDetails,
      hasBankDetails,
      completed: hasOrganizerProfile && hasBankDetails,
      nextStep: hasOrganizerProfile
        ? (hasBankDetails ? "COMPLETE" : "ADD_BANK_DETAILS")
        : "CREATE_PROFILE",
    });
  })();

  pendingStatusPromise = requestPromise;
  pendingUserId = userId || null;

  try {
    const status = await requestPromise;
    cachedStatus = status;
    cacheTime = Date.now();
    cachedUserId = userId || null;
    return status;
  } finally {
    if (pendingStatusPromise === requestPromise) {
      pendingStatusPromise = null;
      pendingUserId = null;
    }
  }
}
