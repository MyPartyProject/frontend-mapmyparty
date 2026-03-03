import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrganizerOnboardingStatus } from "@/services/organizerOnboardingService";

const ProtectedRoute = ({ children, requiredRole = null, skipOrganizerOnboarding = false }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();
  const redirectTarget = `${location.pathname}${location.search}`;
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);

  const normalizedRequiredRole = requiredRole?.toUpperCase() || null;

  useEffect(() => {
    const shouldCheckOnboarding =
      isAuthenticated &&
      normalizedRequiredRole === "ORGANIZER" &&
      !skipOrganizerOnboarding &&
      !location.pathname.startsWith("/organizer/onboarding");

    if (!shouldCheckOnboarding) {
      setOnboardingStatus(null);
      setOnboardingLoading(false);
      return;
    }

    let isMounted = true;
    setOnboardingStatus(null);
    setOnboardingLoading(true);

    (async () => {
      try {
        const status = await fetchOrganizerOnboardingStatus({ userId: user?.id });
        if (isMounted) {
          setOnboardingStatus(status);
        }
      } catch (error) {
        if (isMounted) {
          setOnboardingStatus({
            hasOrganizerProfile: true,
            hasBankDetails: true,
            completed: true,
            fallbackError: error?.message || "Failed to verify organizer onboarding",
          });
        }
      } finally {
        if (isMounted) {
          setOnboardingLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, location.pathname, normalizedRequiredRole, skipOrganizerOnboarding, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0c1426] to-[#0a0f1a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-red-500/60 border-t-transparent animate-spin" />
          <div className="text-sm text-white/70">Checking your session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Use dedicated login page for promoter/admin class routes.
    if (normalizedRequiredRole === "PROMOTER" || normalizedRequiredRole === "ADMIN") {
      return (
        <Navigate
          to={`/promoter/login?redirect=${encodeURIComponent(redirectTarget)}`}
          replace
        />
      );
    }

    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  if (normalizedRequiredRole) {
    const userRole = (user?.role || "").toString().toUpperCase();
    // App aliases promoter <-> admin in backend role naming.
    const roleAliases = {
      PROMOTER: ["PROMOTER", "ADMIN"],
      ADMIN: ["PROMOTER", "ADMIN"],
      USER: ["USER"],
      ORGANIZER: ["ORGANIZER"],
    };
    const acceptedRoles = roleAliases[normalizedRequiredRole] || [normalizedRequiredRole];

    if (!acceptedRoles.includes(userRole)) {
      console.warn(
        `Role mismatch: required one of [${acceptedRoles.join(", ")}], got "${userRole}"`
      );
      return <Navigate to="/" replace />;
    }
  }

  const requiresOrganizerOnboarding =
    normalizedRequiredRole === "ORGANIZER" &&
    !skipOrganizerOnboarding &&
    !location.pathname.startsWith("/organizer/onboarding");

  if (requiresOrganizerOnboarding && (onboardingLoading || onboardingStatus === null)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0c1426] to-[#0a0f1a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-red-500/60 border-t-transparent animate-spin" />
          <div className="text-sm text-white/70">Checking organizer setup...</div>
        </div>
      </div>
    );
  }

  if (requiresOrganizerOnboarding && onboardingStatus && !onboardingStatus.completed) {
    return (
      <Navigate
        to={`/organizer/onboarding?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
