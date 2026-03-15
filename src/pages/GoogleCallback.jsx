import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { fetchSession, resetSessionCache } from "@/utils/auth";
import { useAuth } from "@/contexts/AuthContext";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const error = searchParams.get("error");
        const success = searchParams.get("success");

        if (error || success === "false") {
          console.error("Google OAuth error:", error);
          toast.error("Google authentication was cancelled or failed");
          navigate("/auth", { replace: true });
          return;
        }

        // Backend already handled the OAuth callback and set cookies.
        // Fetch the current session to validate and get user data.
        resetSessionCache();
        const session = await fetchSession(true);

        if (!session?.isAuthenticated) {
          toast.error("Authentication failed: session not found");
          navigate("/auth", { replace: true });
          return;
        }

        // Populate auth context
        contextLogin(session);

        // Check for pending booking from event page
        const pendingRaw = sessionStorage.getItem('pendingBooking');
        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw);
            const isRecent = Date.now() - pending.timestamp < 30 * 60 * 1000;
            if (isRecent && pending.returnUrl) {
              toast.success("Google authentication successful!");
              window.location.href = `${pending.returnUrl}?resumeBooking=true`;
              return;
            }
          } catch { /* ignore parse errors, fall through to default redirect */ }
          sessionStorage.removeItem('pendingBooking');
        }

        const postAuthRedirect = sessionStorage.getItem("postAuthRedirect");
        if (postAuthRedirect) {
          sessionStorage.removeItem("postAuthRedirect");
          toast.success("Google authentication successful!");
          navigate(postAuthRedirect, { replace: true });
          return;
        }

        const role = (session.user?.role || "USER").toUpperCase();
        const redirectPath =
          role === "ORGANIZER"
            ? "/organizer/dashboard-v2"
            : role === "PROMOTER"
              ? "/promoter/dashboard"
              : "/dashboard";

        toast.success("Google authentication successful!");
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error("Google OAuth callback error:", err);
        toast.error(err?.message || "Google authentication failed");
        navigate("/auth", { replace: true });
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-primary-glow">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-foreground mx-auto mb-4" />
        <p className="text-primary-foreground text-lg">
          Completing Google sign in...
        </p>
      </div>
    </div>
  );
};

export default GoogleCallback;
