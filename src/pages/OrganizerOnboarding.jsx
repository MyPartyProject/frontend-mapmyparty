import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";
import {
  clearOrganizerOnboardingCache,
  fetchOrganizerOnboardingStatus,
} from "@/services/organizerOnboardingService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const buildProfileDefaults = (user, profile = null) => ({
  name: profile?.name || user?.name || "",
  description: profile?.description || "",
  contact: profile?.contact || user?.phone || "",
  email: profile?.email || user?.email || "",
  state: profile?.state || "",
  address: profile?.address || "",
  gstNumber: profile?.gstNumber || "",
});

const buildBankDefaults = (bank = null) => ({
  accountHolder: bank?.accountHolder || "",
  accountNumber: bank?.accountNumber || "",
  ifscCode: bank?.ifscCode || "",
  bankName: bank?.bankName || "",
});

const OrganizerOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshAuth } = useAuth();
  const redirectPath = searchParams.get("redirect") || "/organizer/dashboard";

  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const [profileForm, setProfileForm] = useState(() => buildProfileDefaults(user));
  const [bankForm, setBankForm] = useState(() => buildBankDefaults());

  const currentStep = useMemo(() => {
    if (!status) return "profile";
    if (!status.hasOrganizerProfile) return "profile";
    if (!status.hasBankDetails) return "bank";
    return "complete";
  }, [status]);

  const finishOnboarding = useCallback(async () => {
    clearOrganizerOnboardingCache();
    await refreshAuth();
    navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath, refreshAuth]);

  const refreshStatus = useCallback(
    async (forceRefresh = true) => {
      setLoadingStatus(true);
      try {
        const nextStatus = await fetchOrganizerOnboardingStatus({ forceRefresh, userId: user?.id });
        setStatus(nextStatus);
        setProfileForm(buildProfileDefaults(user, nextStatus.organizerProfile));
        setBankForm(buildBankDefaults(nextStatus.bankDetails));

        if (nextStatus.completed) {
          await finishOnboarding();
        }
      } catch (error) {
        toast.error(error?.message || "Failed to check organizer onboarding status");
      } finally {
        setLoadingStatus(false);
      }
    },
    [finishOnboarding, user]
  );

  useEffect(() => {
    refreshStatus(true);
  }, [refreshStatus]);

  const onProfileInputChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const onBankInputChange = (field, value) => {
    setBankForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrganizerProfile = async (event) => {
    event.preventDefault();
    if (savingProfile) return;

    const name = profileForm.name.trim();
    if (!name) {
      toast.error("Organizer name is required");
      return;
    }

    const payload = {
      name,
      description: profileForm.description?.trim() || undefined,
      contact: profileForm.contact?.trim() || undefined,
      email: profileForm.email?.trim() || undefined,
      state: profileForm.state?.trim() || undefined,
      address: profileForm.address?.trim() || undefined,
      gstNumber: profileForm.gstNumber?.trim() || undefined,
    };

    setSavingProfile(true);
    try {
      await apiFetch("organizer/me/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Organizer profile created");
      clearOrganizerOnboardingCache();
      await refreshStatus(true);
    } catch (error) {
      if (error?.status === 409) {
        clearOrganizerOnboardingCache();
        await refreshStatus(true);
        return;
      }
      toast.error(error?.message || "Failed to create organizer profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveBankDetails = async (event) => {
    event.preventDefault();
    if (savingBank) return;

    if (
      !bankForm.accountHolder.trim() ||
      !bankForm.accountNumber.trim() ||
      !bankForm.ifscCode.trim() ||
      !bankForm.bankName.trim()
    ) {
      toast.error("All bank detail fields are required");
      return;
    }

    const payload = {
      accountHolder: bankForm.accountHolder.trim(),
      accountNumber: bankForm.accountNumber.trim(),
      ifscCode: bankForm.ifscCode.trim().toUpperCase(),
      bankName: bankForm.bankName.trim(),
    };

    setSavingBank(true);
    try {
      await apiFetch("organizer/me/bank-details", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Bank details saved");
      clearOrganizerOnboardingCache();
      await refreshStatus(true);
    } catch (error) {
      if (error?.status === 409) {
        clearOrganizerOnboardingCache();
        await refreshStatus(true);
        return;
      }
      toast.error(error?.message || "Failed to save bank details");
    } finally {
      setSavingBank(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-[#040712] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-red-400" />
          <span className="text-sm text-white/80">Preparing organizer onboarding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040712] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Organizer Onboarding</p>
          <h1 className="text-2xl sm:text-3xl font-bold">Complete setup to continue</h1>
          <p className="text-sm text-white/70">
            Step 1: Create organizer profile. Step 2: Add bank details.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl border p-3 ${
              status?.hasOrganizerProfile ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="w-4 h-4" />
              Organizer Profile
            </div>
            <p className="text-xs text-white/60 mt-1">
              {status?.hasOrganizerProfile ? "Completed" : "Required"}
            </p>
          </div>
          <div
            className={`rounded-xl border p-3 ${
              status?.hasBankDetails ? "border-emerald-400/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              Bank Details
            </div>
            <p className="text-xs text-white/60 mt-1">
              {status?.hasBankDetails ? "Completed" : "Required"}
            </p>
          </div>
        </div>

        {currentStep === "profile" && (
          <Card className="bg-[#0b101d] border-white/10 text-white">
            <CardHeader>
              <CardTitle>Create Organizer Profile</CardTitle>
              <CardDescription className="text-white/60">
                This must be completed before accessing organizer features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateOrganizerProfile}>
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organizer Name</Label>
                  <Input
                    id="org-name"
                    value={profileForm.name}
                    onChange={(e) => onProfileInputChange("name", e.target.value)}
                    className="bg-[#070b14] border-white/15 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-description">Description</Label>
                  <Textarea
                    id="org-description"
                    value={profileForm.description}
                    onChange={(e) => onProfileInputChange("description", e.target.value)}
                    className="bg-[#070b14] border-white/15 text-white min-h-[90px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-contact">Contact Number</Label>
                    <Input
                      id="org-contact"
                      value={profileForm.contact}
                      onChange={(e) => onProfileInputChange("contact", e.target.value)}
                      className="bg-[#070b14] border-white/15 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Business Email</Label>
                    <Input
                      id="org-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => onProfileInputChange("email", e.target.value)}
                      className="bg-[#070b14] border-white/15 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-state">State</Label>
                    <Input
                      id="org-state"
                      value={profileForm.state}
                      onChange={(e) => onProfileInputChange("state", e.target.value)}
                      className="bg-[#070b14] border-white/15 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-gst">GST Number</Label>
                    <Input
                      id="org-gst"
                      value={profileForm.gstNumber}
                      onChange={(e) => onProfileInputChange("gstNumber", e.target.value.toUpperCase())}
                      className="bg-[#070b14] border-white/15 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-address">Address</Label>
                  <Textarea
                    id="org-address"
                    value={profileForm.address}
                    onChange={(e) => onProfileInputChange("address", e.target.value)}
                    className="bg-[#070b14] border-white/15 text-white min-h-[70px]"
                  />
                </div>
                <Button type="submit" disabled={savingProfile} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {savingProfile ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving profile...
                    </span>
                  ) : (
                    "Create Organizer Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentStep === "bank" && (
          <Card className="bg-[#0b101d] border-white/10 text-white">
            <CardHeader>
              <CardTitle>Add Bank Details</CardTitle>
              <CardDescription className="text-white/60">
                Add payout details to finish organizer onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSaveBankDetails}>
                <div className="space-y-2">
                  <Label htmlFor="bank-account-holder">Account Holder Name</Label>
                  <Input
                    id="bank-account-holder"
                    value={bankForm.accountHolder}
                    onChange={(e) => onBankInputChange("accountHolder", e.target.value)}
                    className="bg-[#070b14] border-white/15 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-account-number">Account Number</Label>
                    <Input
                      id="bank-account-number"
                      value={bankForm.accountNumber}
                      onChange={(e) => onBankInputChange("accountNumber", e.target.value)}
                      className="bg-[#070b14] border-white/15 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-ifsc">IFSC Code</Label>
                    <Input
                      id="bank-ifsc"
                      value={bankForm.ifscCode}
                      onChange={(e) => onBankInputChange("ifscCode", e.target.value.toUpperCase())}
                      className="bg-[#070b14] border-white/15 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    value={bankForm.bankName}
                    onChange={(e) => onBankInputChange("bankName", e.target.value)}
                    className="bg-[#070b14] border-white/15 text-white"
                    required
                  />
                </div>
                <Button type="submit" disabled={savingBank} className="w-full bg-red-600 hover:bg-red-700 text-white">
                  {savingBank ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving bank details...
                    </span>
                  ) : (
                    "Save Bank Details"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerOnboarding;
