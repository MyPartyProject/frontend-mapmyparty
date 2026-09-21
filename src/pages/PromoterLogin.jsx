import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/config/api";
import { resetSessionCache, fetchSession } from "@/utils/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPathForRole } from "@/utils/roleRedirect";
import Logo from "../assets/android-chrome-192x192.png";

const PromoterLogin = () => {
  const navigate = useNavigate();
  const { login: contextLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const email = form.querySelector("#email")?.value?.trim();
    const password = form.querySelector("#password")?.value;

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setIsLoading(true);

      await apiFetch("auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role: "ADMIN" }),
      });

      resetSessionCache();

      const session = await fetchSession(true);

      if (!session?.isAuthenticated) {
        throw new Error("Login succeeded but session validation failed");
      }

      contextLogin(session);

      toast.success("Logged in successfully!");
      navigate(getDashboardPathForRole(session.user?.role || "ADMIN"), { replace: true });
    } catch (err) {
      toast.error(err?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="border border-border bg-surface shadow-xl">
          <CardHeader className="text-center pb-5 pt-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-14 h-14 bg-surface rounded-xl flex items-center justify-center border border-border">
                <img src={Logo} alt="MapMyParty" className="w-9 h-9" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-red-500" />
              <CardTitle className="text-3xl font-bold text-foreground">
                Promoter Login
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground text-sm mt-1">
              Sign in to access the promoter dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-red-500 h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="border-border bg-surface text-foreground placeholder:text-muted-foreground focus:border-red-500 pr-10 h-10 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-10 text-sm font-medium mt-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <p className="text-center text-muted-foreground text-xs mt-6">
              Promoter accounts are created by the platform administrator.
              <br />
              Contact your admin if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromoterLogin;
