import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, buildUrl } from "@/config/api";
import OTPVerificationModal from "@/components/OTPVerificationModal";
import { useAuth } from "@/contexts/AuthContext";
import { requestPasswordReset } from "@/services/authService";
import { fetchSession, resetSessionCache } from "@/utils/auth";
import {
  PASSWORD_REQUIREMENTS_TEXT,
  isStrongPassword,
} from "@/utils/passwordRules";
import {
  PHONE_INPUT_PROPS,
  normalizeTenDigitPhoneNumber,
  sanitizeTenDigitPhoneInput,
} from "@/utils/phone";
import Logo from "../assets/android-chrome-192x192.png";

const EMPTY_LOGIN_FORM = {
  email: "",
  password: "",
};

const EMPTY_SIGNUP_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const AUTH_ERROR_MESSAGES = {
  google_auth_failed: "Google authentication failed. Please try again.",
  rate_limit: "Too many authentication attempts. Please wait a few minutes.",
  security_error: "Security verification failed. Please try again.",
};

const normalizeUserType = (value) => {
  if (value === "user" || value === "organizer") {
    return value;
  }

  return null;
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: contextLogin } = useAuth();
  const redirectTarget = searchParams.get("redirect") || "";

  const [userType, setUserType] = useState(() =>
    normalizeUserType(searchParams.get("type")),
  );
  const [isLogin, setIsLogin] = useState(
    () => searchParams.get("mode") !== "signup",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(
    () => searchParams.get("forgot") === "true",
  );
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [pendingSignupType, setPendingSignupType] = useState(null);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const initialEmail = searchParams.get("email") || "";
  const [loginForm, setLoginForm] = useState({
    ...EMPTY_LOGIN_FORM,
    email: initialEmail,
  });
  const [signupForm, setSignupForm] = useState({
    ...EMPTY_SIGNUP_FORM,
    email: initialEmail,
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(initialEmail);

  useEffect(() => {
    if (searchParams.get("reset") !== "success") {
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    const selectedType = normalizeUserType(searchParams.get("type"));
    navigate(
      selectedType
        ? `/auth?mode=login&type=${selectedType}`
        : "/auth?mode=login",
      { replace: true },
    );
  }, [navigate, searchParams]);

  useEffect(() => {
    const errorCode = searchParams.get("error");
    if (!errorCode) {
      return;
    }

    toast.error(
      AUTH_ERROR_MESSAGES[errorCode] ||
        "Authentication failed. Please try again.",
    );

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("error");
    nextParams.delete("message");
    nextParams.set("mode", "login");

    const nextQuery = nextParams.toString();
    navigate(nextQuery ? `/auth?${nextQuery}` : "/auth?mode=login", {
      replace: true,
    });
  }, [navigate, searchParams]);

  const getDashboardPath = (type) =>
    type === "organizer" ? "/organizer/dashboard-v2" : "/dashboard";

  const getPostAuthDestination = (type) =>
    redirectTarget || getDashboardPath(type);

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setShowForgotPassword(false);
    setForgotPasswordSent(false);
  };

  const handleTabChange = (value) => {
    const nextIsLogin = value === "login";
    setIsLogin(nextIsLogin);

    if (!nextIsLogin) {
      setShowForgotPassword(false);
      setForgotPasswordSent(false);
    }
  };

  const handleLoginSubmit = async (event, type) => {
    event.preventDefault();

    const email = loginForm.email.trim();
    const password = loginForm.password;
    const role = type === "organizer" ? "ORGANIZER" : "USER";

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setIsLoading(true);

      await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      });

      resetSessionCache();
      const session = await fetchSession(true);

      if (!session?.isAuthenticated) {
        throw new Error("Login succeeded but session validation failed");
      }

      contextLogin(session);
      toast.success("Logged in successfully!");

      navigate(getPostAuthDestination(type), { replace: true });
    } catch (error) {
      toast.error(error?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (event, type) => {
    event.preventDefault();

    const role = type === "organizer" ? "ORGANIZER" : "USER";
    const name = signupForm.name.trim();
    const email = signupForm.email.trim();
    const phoneDigits = normalizeTenDigitPhoneNumber(signupForm.phone);
    const password = signupForm.password;

    if (!name || !email || !phoneDigits || !password) {
      toast.error("Please fill all fields");
      return;
    }

    if (!phoneDigits) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    try {
      setIsLoading(true);

      await apiFetch("auth/send-signup-otp", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone: phoneDigits,
          password,
          role,
        }),
      });

      setOtpEmail(email);
      setPendingSignupType(type);
      setShowOtpModal(true);
      toast.success("Verification code sent to your email!");
    } catch (error) {
      toast.error(error?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();

    const email = forgotPasswordEmail.trim();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsLoading(true);

      const response = await requestPasswordReset(
        email,
        userType === "organizer" ? "ORGANIZER" : "USER",
      );

      setForgotPasswordSent(true);
      setLoginForm((current) => ({ ...current, email }));
      toast.success(
        response?.message || "Password reset email sent successfully",
      );
    } catch (error) {
      toast.error(error?.message || "Unable to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (redirectTarget) {
      sessionStorage.setItem("postAuthRedirect", redirectTarget);
    } else {
      sessionStorage.removeItem("postAuthRedirect");
    }

    window.location.href = buildUrl("/api/auth/google");
  };

  const handleOtpVerificationSuccess = async () => {
    const signupType = pendingSignupType;

    setShowOtpModal(false);
    setOtpEmail("");
    setPendingSignupType(null);

    resetSessionCache();
    const session = await fetchSession(true);

    if (!session?.isAuthenticated) {
      toast.error(
        "Signup succeeded but session validation failed. Please try logging in.",
      );
      return;
    }

    contextLogin(session);
    toast.success("Account created successfully!");
    navigate(getPostAuthDestination(signupType), { replace: true });
  };

  const handleOtpModalClose = () => {
    setShowOtpModal(false);
  };

  const forgotPasswordDescription =
    userType === "organizer"
      ? "Send a secure reset link to the organizer account linked to this email."
      : "Send a secure reset link to the attendee account linked to this email.";

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-card text-foreground flex items-center justify-center p-3 sm:p-4">
        <Button
          variant="ghost"
          className="absolute top-4 left-4 h-9 rounded-xl border border-border/60 bg-card/70 px-3 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-xl border border-border/60 bg-card/80 flex items-center justify-center shadow-[var(--shadow-card)]">
                <img src={Logo} alt="MapMyParty" className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2.5">
              Welcome to{" "}
              <span className="text-foreground">
                MapMyParty
              </span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Your ultimate destination for discovering, creating, and managing
              unforgettable events
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <Card
              className="group cursor-pointer rounded-2xl border border-border/60 bg-card/80 hover:border-accent/40 hover:bg-card transition-all duration-300 shadow-[var(--shadow-card)]"
              onClick={() => handleUserTypeSelect("user")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/25 via-secondary/20 to-accent/20 border border-border/60 flex items-center justify-center mx-auto mb-4 group-hover:border-accent/40 transition-colors">
                  <User className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  I&apos;m an Attendee
                </h2>
                <p className="text-muted-foreground text-sm mb-3.5">
                  Discover and book tickets to amazing events near you
                </p>
                <div className="flex items-center justify-center gap-2 text-accent font-medium text-sm">
                  <span>Explore Events</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="group cursor-pointer rounded-2xl border border-border/60 bg-card/80 hover:border-accent/40 hover:bg-card transition-all duration-300 shadow-[var(--shadow-card)]"
              onClick={() => handleUserTypeSelect("organizer")}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/25 via-secondary/20 to-accent/20 border border-border/60 flex items-center justify-center mx-auto mb-4 group-hover:border-accent/40 transition-colors">
                  <Building2 className="w-7 h-7 text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  I&apos;m an Organizer
                </h2>
                <p className="text-muted-foreground text-sm mb-3.5">
                  Create and manage your own events with ease
                </p>
                <div className="flex items-center justify-center gap-2 text-accent font-medium text-sm">
                  <span>Start Creating</span>
                  <ArrowLeft className="w-4 h-4 rotate-180" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card text-foreground flex items-center justify-center p-3 sm:p-4">
      <Button
        variant="ghost"
        className="absolute top-4 left-4 h-9 rounded-xl border border-border/60 bg-card/70 px-3 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
        onClick={() => setUserType(null)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="w-full max-w-[22rem] sm:max-w-sm">
        <Card className="rounded-2xl border border-border/60 bg-card/85 shadow-[var(--shadow-elegant)] backdrop-blur">
          <CardHeader className="text-center pb-4 pt-5">
            <div className="flex items-center justify-center gap-2 mb-3.5">
              <div className="w-12 h-12 rounded-xl border border-border/60 bg-background/70 flex items-center justify-center">
                <img src={Logo} alt="MapMyParty" className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-foreground">
              {userType === "organizer" ? "Organizer" : "Attendee"} Account
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm mt-1">
              {isLogin
                ? "Welcome back! Sign in to continue"
                : "Create your account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Tabs
              value={isLogin ? "login" : "signup"}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4 h-9 rounded-lg border border-border/60 bg-muted/80 p-1">
                <TabsTrigger
                  value="login"
                  className="rounded-md text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-md text-xs sm:text-sm font-medium text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-3.5 mt-0">
                {showForgotPassword ? (
                  <div className="space-y-3.5">
                    <div className="rounded-xl border border-border/60 bg-background/70 p-3.5">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                        <Mail className="h-4 w-4 text-accent" />
                        Password recovery
                      </div>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        {forgotPasswordDescription}
                      </p>
                    </div>

                    {forgotPasswordSent ? (
                      <div className="space-y-3.5">
                        <div className="rounded-xl border border-accent/35 bg-accent/10 p-3.5 text-xs sm:text-sm text-accent">
                          If this email is registered, a reset link is on its
                          way. Use the newest link within 10 minutes.
                        </div>
                        <Button
                          type="button"
                          className="w-full h-9 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/85"
                          onClick={() => setForgotPasswordSent(false)}
                        >
                          Send Another Link
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full border border-border/50 bg-card/30 text-muted-foreground hover:bg-card hover:text-foreground"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordSent(false);
                          }}
                        >
                          Back to Login
                        </Button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleForgotPasswordSubmit}
                        className="space-y-3.5"
                      >
                        <div className="space-y-2">
                          <Label
                            htmlFor="forgot-email"
                            className="text-muted-foreground text-xs sm:text-sm font-medium"
                          >
                            Email
                          </Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="Enter your account email"
                            value={forgotPasswordEmail}
                            onChange={(event) =>
                              setForgotPasswordEmail(event.target.value)
                            }
                            className="h-9 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-9 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/85"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending Link...
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full border border-border/50 bg-card/30 text-muted-foreground hover:bg-card hover:text-foreground"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotPasswordSent(false);
                          }}
                        >
                          Back to Login
                        </Button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    <form
                      onSubmit={(event) => handleLoginSubmit(event, userType)}
                      className="space-y-3.5"
                    >
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-muted-foreground text-xs sm:text-sm font-medium"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          required
                          value={loginForm.email}
                          onChange={(event) =>
                            setLoginForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="h-9 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-muted-foreground text-xs sm:text-sm font-medium"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            required
                            value={loginForm.password}
                            onChange={(event) =>
                              setLoginForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            }
                            className="h-9 pr-10 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setShowLoginPassword((current) => !current)
                            }
                          >
                            {showLoginPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs sm:text-sm text-accent hover:text-accent/80"
                          onClick={() => {
                            setForgotPasswordEmail(loginForm.email.trim());
                            setShowForgotPassword(true);
                            setForgotPasswordSent(false);
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-9 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/85"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>

                    {userType === "user" ? (
                      <div className="mt-3.5">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/60" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-card px-2 text-muted-foreground text-xs uppercase">
                              Or continue with
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mt-3 h-9 border-border/60 bg-background/70 text-foreground hover:bg-card hover:text-foreground"
                          onClick={handleGoogleLogin}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Sign in with Google
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </TabsContent>

              <TabsContent value="signup" className="space-y-3.5 mt-0">
                <form
                  onSubmit={(event) => handleSignupSubmit(event, userType)}
                  className="space-y-3.5"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-muted-foreground text-xs sm:text-sm font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      required
                      value={signupForm.name}
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="h-9 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-email"
                      className="text-muted-foreground text-xs sm:text-sm font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      required
                      value={signupForm.email}
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="h-9 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-phone"
                      className="text-muted-foreground text-xs sm:text-sm font-medium"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="signup-phone"
                      {...PHONE_INPUT_PROPS}
                      placeholder="10 digit phone number"
                      required
                      value={signupForm.phone}
                      onChange={(event) =>
                        setSignupForm((current) => ({
                          ...current,
                          phone: sanitizeTenDigitPhoneInput(event.target.value),
                        }))
                      }
                      className="h-9 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="signup-password"
                      className="text-muted-foreground text-xs sm:text-sm font-medium"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a password"
                        required
                        value={signupForm.password}
                        onChange={(event) =>
                          setSignupForm((current) => ({
                            ...current,
                            password: event.target.value,
                          }))
                        }
                        className="h-9 pr-10 border-border/60 bg-background/75 text-foreground placeholder:text-muted-foreground focus-visible:border-ring"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setShowSignupPassword((current) => !current)
                        }
                      >
                        {showSignupPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {PASSWORD_REQUIREMENTS_TEXT}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-9 text-sm font-medium mt-1 bg-secondary text-secondary-foreground hover:bg-secondary/85"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>

                {userType === "user" ? (
                  <div className="mt-3.5">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/60" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground text-xs uppercase">
                          Or continue with
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-3 h-9 border-border/60 bg-background/70 text-foreground hover:bg-card hover:text-foreground"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Sign up with Google
                    </Button>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <OTPVerificationModal
          isOpen={showOtpModal}
          onClose={handleOtpModalClose}
          email={otpEmail}
          onVerificationSuccess={handleOtpVerificationSuccess}
          expiryMinutes={10}
        />
      </div>
    </div>
  );
};

export default Auth;
