import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordWithToken } from "@/services/authService";
import { PASSWORD_REQUIREMENTS_TEXT, isStrongPassword } from "@/utils/passwordRules";
import Logo from "../assets/android-chrome-192x192.png";

const normalizeUserType = (value) => {
  if (value === "user" || value === "organizer") {
    return value;
  }

  return null;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const userType = normalizeUserType(searchParams.get("type"));
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");

    if (!token) {
      setServerError("This reset link is missing a token. Please request a new password reset email.");
      return;
    }

    if (!isStrongPassword(form.password)) {
      setServerError(PASSWORD_REQUIREMENTS_TEXT);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setServerError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPasswordWithToken({
        token,
        newPassword: form.password,
      });

      navigate(
        userType
          ? `/auth?mode=login&reset=success&type=${userType}`
          : "/auth?mode=login&reset=success",
        { replace: true }
      );
    } catch (error) {
      const message = error?.message || "Unable to reset password. Please request a new link.";
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Button
        variant="ghost"
        className="absolute top-6 left-6 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg"
        onClick={() => navigate("/auth")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="w-full max-w-md">
        <Card className="border border-border bg-surface shadow-xl">
          <CardHeader className="text-center pb-5 pt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center border border-border">
                <img src={Logo} alt="MapMyParty" className="w-9 h-9" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Choose a new password for your MapMyParty account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {!token ? (
              <div className="space-y-4 rounded-xl border border-red-500/20 bg-red-500/10 p-5">
                <div className="flex items-center gap-3 text-destructive">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-sm font-medium">This reset link is invalid or incomplete.</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Request a fresh password reset email from the login page and use the newest link.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Go to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <KeyRound className="h-4 w-4 text-destructive" />
                    Password requirements
                  </div>
                  <p className="mt-2 text-muted-foreground">{PASSWORD_REQUIREMENTS_TEXT}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-muted-foreground text-sm font-medium">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a new password"
                      value={form.password}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-red-500 pr-10 h-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-muted-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-muted-foreground text-sm font-medium">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={form.confirmPassword}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-red-500 pr-10 h-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-muted-foreground"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {serverError ? (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-destructive">
                    {serverError}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full h-10 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground hover:bg-surface"
                  onClick={() => navigate("/auth")}
                >
                  Back to login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
