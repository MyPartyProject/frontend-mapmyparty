import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, Building2, CreditCard, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/config/api";
import {
  clearOrganizerOnboardingCache,
  fetchOrganizerOnboardingStatus,
} from "@/services/organizerOnboardingService";
import {
  deleteOrganizerLogoUpload,
  ORGANIZER_LOGO_HELP_TEXT,
  uploadOrganizerLogo,
  validateOrganizerLogoFile,
} from "@/services/organizerLogoService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  PHONE_INPUT_PROPS,
  normalizeTenDigitPhoneNumber,
  sanitizeTenDigitPhoneInput,
} from "@/utils/phone";

const buildProfileDefaults = (user, profile = null) => ({
  name: profile?.name || user?.name || "",
  description: profile?.description || "",
  contact: sanitizeTenDigitPhoneInput(profile?.contact || user?.phone || ""),
  email: profile?.email || user?.email || "",
  state: profile?.state || "",
  address: profile?.address || "",
  gstNumber: profile?.gstNumber || "",
  logo: profile?.logo || "",
});

const buildBankDefaults = (bank = null) => ({
  accountHolder: bank?.accountHolder || "",
  accountNumber: bank?.accountNumber || "",
  ifscCode: bank?.ifscCode || "",
  bankName: bank?.bankName || "",
  branchName: bank?.branchName || "",
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
  const [requestingVerification, setRequestingVerification] = useState(false);

  const [profileForm, setProfileForm] = useState(() => buildProfileDefaults(user));
  const [bankForm, setBankForm] = useState(() => buildBankDefaults());
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const logoInputRef = useRef(null);
  const verificationPollRef = useRef(false);

  const currentStep = useMemo(() => {
    if (!status) return "profile";
    if (!status.hasOrganizerProfile) return "profile";
    if (!status.hasBankDetails) return "bank";
    if (!status.isBankVerified) return "verify";
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

        if (nextStatus.completed && nextStatus.isBankVerified) {
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

  const applyVerificationStatus = useCallback(
    async (payload = {}) => {
      const data = payload?.data || payload || {};
      const nextBankDetails = data.bankDetails || {};
      const nextVerificationStatus =
        data.bankVerificationStatus ||
        nextBankDetails.verificationStatus ||
        status?.bankVerificationStatus ||
        null;
      const nextIsBankVerified = Boolean(
        data.isBankVerified ?? nextVerificationStatus === "VERIFIED"
      );

      setStatus((current) => {
        if (!current) return current;
        return {
          ...current,
          bankDetails: current.bankDetails
            ? { ...current.bankDetails, ...nextBankDetails }
            : nextBankDetails,
          isBankVerified: nextIsBankVerified,
          bankVerificationStatus: nextVerificationStatus,
          bankVerificationRequired:
            data.bankVerificationRequired ?? (current.hasBankDetails && !nextIsBankVerified),
          financialReadiness:
            data.financialReadiness ||
            (nextIsBankVerified ? "READY" : "BANK_VERIFICATION_REQUIRED"),
        };
      });

      if (Object.keys(nextBankDetails).length > 0) {
        setBankForm(buildBankDefaults(nextBankDetails));
      }

      if (nextVerificationStatus === "VERIFIED") {
        toast.success("Bank verification completed successfully");
        clearOrganizerOnboardingCache();
        await refreshStatus(true);
      } else if (
        nextVerificationStatus === "FAILED" &&
        status?.bankVerificationStatus !== "FAILED"
      ) {
        toast.error(nextBankDetails.verificationFailureReason || "Bank verification failed");
        clearOrganizerOnboardingCache();
      }
    },
    [refreshStatus, status?.bankVerificationStatus]
  );

  useEffect(() => {
    if (currentStep !== "verify" || !status?.hasBankDetails || status?.isBankVerified) {
      return undefined;
    }

    let cancelled = false;

    const pollVerificationStatus = async () => {
      if (verificationPollRef.current || cancelled) return;
      verificationPollRef.current = true;
      try {
        const response = await apiFetch("organizer/me/bank-details/verification/status", {
          method: "GET",
        });
        if (!cancelled) {
          await applyVerificationStatus(response);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.message || "Failed to refresh bank verification status");
        }
      } finally {
        verificationPollRef.current = false;
      }
    };

    const intervalId = window.setInterval(pollVerificationStatus, 10000);
    pollVerificationStatus();

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    applyVerificationStatus,
    currentStep,
    status?.bankVerificationStatus,
    status?.hasBankDetails,
    status?.isBankVerified,
  ]);

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const onProfileInputChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await validateOrganizerLogoFile(file);
      const nextPreview = URL.createObjectURL(file);
      setLogoFile(file);
      setLogoPreview(nextPreview);
      setProfileForm((prev) => ({ ...prev, logo: "" }));
    } catch (error) {
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      setLogoFile(null);
      setLogoPreview("");
      toast.error(error?.message || "Choose a valid organizer logo.");
    }
  };

  const clearLogoSelection = () => {
    setLogoFile(null);
    setLogoPreview("");
    setProfileForm((prev) => ({ ...prev, logo: "" }));
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
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

    const contact = profileForm.contact?.trim()
      ? normalizeTenDigitPhoneNumber(profileForm.contact)
      : undefined;
    if (profileForm.contact?.trim() && !contact) {
      toast.error("Contact number must be exactly 10 digits.");
      return;
    }

    const payload = {
      name,
      description: profileForm.description?.trim() || undefined,
      contact,
      email: profileForm.email?.trim() || undefined,
      state: profileForm.state?.trim() || undefined,
      address: profileForm.address?.trim() || undefined,
      gstNumber: profileForm.gstNumber?.trim() || undefined,
    };

    setSavingProfile(true);
    try {
      const createResponse = await apiFetch("organizer/me/profile", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const createdOrganizer = createResponse?.data || createResponse || {};

      if (logoFile && createdOrganizer?.id) {
        let uploadedLogoStorageKey = null;
        try {
          const logoUpload = await uploadOrganizerLogo(createdOrganizer.id, logoFile);
          uploadedLogoStorageKey = logoUpload.storageKey || logoUpload.key || logoUpload.publicId;

          await apiFetch("organizer/me/profile", {
            method: "PATCH",
            body: JSON.stringify({
              logo: logoUpload.url,
              logoStorageKey: uploadedLogoStorageKey,
            }),
          });

          clearLogoSelection();
          toast.success("Organizer profile created with logo");
        } catch (logoError) {
          if (uploadedLogoStorageKey) {
            await deleteOrganizerLogoUpload(uploadedLogoStorageKey).catch(() => {});
          }
          clearLogoSelection();
          toast.error(
            `Organizer profile created, but logo upload failed: ${
              logoError?.message || "Please add it later from profile settings."
            }`
          );
        }
      } else {
        if (logoFile) {
          clearLogoSelection();
          toast.error("Organizer profile created, but logo upload failed. Please add it later from profile settings.");
        } else {
          toast.success("Organizer profile created");
        }
      }

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
      !bankForm.bankName.trim() ||
      !bankForm.branchName.trim()
    ) {
      toast.error("All bank detail fields are required");
      return;
    }

    const payload = {
      accountHolder: bankForm.accountHolder.trim(),
      accountNumber: bankForm.accountNumber.trim(),
      ifscCode: bankForm.ifscCode.trim().toUpperCase(),
      bankName: bankForm.bankName.trim(),
      branchName: bankForm.branchName.trim(),
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

  const handleRequestBankVerification = async () => {
    if (requestingVerification) return;
    setRequestingVerification(true);
    try {
      const response = await apiFetch("organizer/me/bank-details/verification/request", {
        method: "POST",
      });
      toast.success(response?.message || "Bank verification requested");
      clearOrganizerOnboardingCache();
      await applyVerificationStatus(response);
    } catch (error) {
      toast.error(error?.message || "Failed to request bank verification");
    } finally {
      setRequestingVerification(false);
    }
  };

  const selectedLogoPreview = logoPreview || profileForm.logo;

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-red-400" />
          <span className="text-sm text-muted-foreground">Preparing organizer onboarding...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Organizer Onboarding</p>
          <h1 className="text-2xl sm:text-3xl font-bold">Complete setup to continue</h1>
          <p className="text-sm text-muted-foreground">
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
              status?.isBankVerified
                ? "border-emerald-400/40 bg-emerald-500/10"
                : status?.hasBankDetails
                  ? "border-amber-400/40 bg-amber-500/10"
                  : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              Bank Details
            </div>
            <p className="text-xs text-white/60 mt-1">
              {status?.isBankVerified ? "Verified" : status?.hasBankDetails ? "Verification required" : "Required"}
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
                  <Label htmlFor="org-logo">Logo</Label>
                  <div className="flex flex-col sm:flex-row gap-4 rounded-lg border border-white/10 bg-[#070b14] p-4">
                    <div className="h-24 w-24 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedLogoPreview ? (
                        <img
                          src={selectedLogoPreview}
                          alt="Organizer logo preview"
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-white/35" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        ref={logoInputRef}
                        id="org-logo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleLogoSelection}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => logoInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </Button>
                        {selectedLogoPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={clearLogoSelection}
                            className="gap-2 border-white/15 bg-transparent text-white hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-white/55">{ORGANIZER_LOGO_HELP_TEXT}</p>
                    </div>
                  </div>
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
                      {...PHONE_INPUT_PROPS}
                      value={profileForm.contact}
                      onChange={(e) => onProfileInputChange("contact", sanitizeTenDigitPhoneInput(e.target.value))}
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
                <Button type="submit" disabled={savingProfile} className="w-full">
                  {savingProfile ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {logoFile ? "Saving profile and logo..." : "Saving profile..."}
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
                <div className="space-y-2">
                  <Label htmlFor="bank-branch-name">Branch Name</Label>
                  <Input
                    id="bank-branch-name"
                    value={bankForm.branchName}
                    onChange={(e) => onBankInputChange("branchName", e.target.value)}
                    className="bg-[#070b14] border-white/15 text-white"
                    required
                  />
                </div>
                <Button type="submit" disabled={savingBank} className="w-full">
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

        {currentStep === "verify" && (
          <Card className="bg-[#0b101d] border-white/10 text-white animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-amber-300" />
                Verify Bank Account
              </CardTitle>
              <CardDescription className="text-white/60">
                Your bank details are saved. Verification keeps payout releases protected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Current status</p>
                <p className="mt-2 text-lg font-semibold">{status?.bankVerificationStatus || "UNVERIFIED"}</p>
                {status?.bankDetails?.verificationFailureReason && (
                  <p className="mt-2 text-sm text-red-300">{status.bankDetails.verificationFailureReason}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={handleRequestBankVerification}
                  disabled={requestingVerification || status?.bankVerificationStatus === "VERIFICATION_IN_PROGRESS"}
                  className="flex-1"
                >
                  {requestingVerification ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting...
                    </span>
                  ) : status?.bankVerificationStatus === "VERIFICATION_IN_PROGRESS" ? (
                    "Verification In Progress"
                  ) : (
                    "Verify Bank Account"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={finishOnboarding}
                  className="border-white/15 bg-transparent text-white hover:bg-white/10"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrganizerOnboarding;
