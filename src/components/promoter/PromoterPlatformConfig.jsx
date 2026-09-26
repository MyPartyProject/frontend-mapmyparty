import IndiaLocationFields from "@/components/IndiaLocationFields";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Settings2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchPlatformConfig, savePlatformConfig } from "@/services/adminService";

import { apiFetch, buildUrl } from "@/config/api";
import { uploadTempImage } from "@/services/eventService";

const emptyForm = {
  logoStorageKey: null,
  logoUrl: "",
  name: "",
  registeredAddress: "",
  state: "",
  city: "",
  pincode: "",
  platformFeeConfig: "",
  gstNumber: "",
};

const normalizeConfig = (config = {}) => ({
  logoStorageKey: config.logoStorageKey || null,
  logoUrl: config.logoUrl || "",
  name: config.name || "",
  registeredAddress: config.registeredAddress || "",
  state: config.state || "",
  city: config.city || "",
  pincode: config.pincode || "",
  platformFeeConfig:
    config.platformFeeConfig === null || config.platformFeeConfig === undefined
      ? ""
      : String(config.platformFeeConfig),
  gstNumber: config.gstNumber || "",
});

const PromoterPlatformConfig = () => {
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [defaultLogoUrl, setDefaultLogoUrl] = useState("");

  const hasChanges = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm],
  );

  const loadConfig = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const defaults = (await apiFetch("admin/platform/config/defaults")).data;
      setDefaultLogoUrl(defaults.logoUrl);
      setIsNew(false);
      setFieldErrors({});
      const config = await fetchPlatformConfig().catch((loadError) => {
        if (loadError.status !== 404) throw loadError;
        setIsNew(true);
        return defaults;
      });
      const normalized = normalizeConfig(config || {});
      setForm(normalized);
      setInitialForm(normalized);
    } catch (loadError) {
      if (loadError?.status === 404) {
        setForm(emptyForm);
        setInitialForm(emptyForm);
      } else {
        setError(loadError.message || "Failed to load platform configuration.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      const payload = {
        logoStorageKey: form.logoStorageKey,
        name: form.name.trim(),
        registeredAddress: form.registeredAddress.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        platformFeeConfig: Number(form.platformFeeConfig),
        gstNumber: form.gstNumber.trim() || "",
      };

      const changes = isNew ? payload : Object.fromEntries(
        Object.entries(payload).filter(([key, value]) =>
          key === "platformFeeConfig" ? value !== Number(initialForm[key]) : value !== initialForm[key]),
      );
      if (!Object.keys(changes).length) {
        setForm(initialForm);
        return;
      }
      const saved = await savePlatformConfig(changes);
      setIsNew(false);
      const normalized = normalizeConfig(saved || payload);
      setForm(normalized);
      setInitialForm(normalized);
      toast.success("Platform configuration updated.");
    } catch (saveError) {
      setFieldErrors(saveError.data?.fieldErrors || {});
      const message = saveError.message || "Failed to save platform configuration.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
        throw new Error("Choose a PNG or JPEG logo, maximum 2 MB.");
      }
      const uploaded = await uploadTempImage(file, "PLATFORM_LOGO", "shared");
      setForm((current) => ({ ...current, logoStorageKey: uploaded.key, logoUrl: uploaded.url }));
    } catch (uploadError) {
      setError(uploadError.message || "Logo upload failed. Try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };
  const logoSrc = form.logoUrl?.startsWith("/") ? buildUrl(form.logoUrl) : form.logoUrl;

  return (
    <div className="space-y-6">
      <Card className="bg-card/70 border-border/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Settings2 className="h-5 w-5" />
              Platform Config
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage platform identity, billing metadata, and the buyer-facing platform fee percentage.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadConfig({ silent: true })} disabled={refreshing || saving || uploading}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
              Loading platform configuration...
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <fieldset disabled={saving || uploading} className="space-y-6">
              {error ? (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="platform-logo">Promoter logo</Label>
                {logoSrc && <img src={logoSrc} alt="Promoter logo preview" className="h-24 w-40 rounded border bg-white object-contain p-2" />}
                <Input id="platform-logo" type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} />
                <p className="text-xs text-muted-foreground" role="status">{uploading ? "Uploading logo?" : "PNG or JPEG, maximum 2 MB. Save changes to apply your uploaded logo."}</p>
                <Button type="button" variant="outline" onClick={() => setForm((current) => ({ ...current, logoStorageKey: null, logoUrl: defaultLogoUrl }))}>Use default logo</Button>
                {fieldErrors.logoStorageKey && <p role="alert" className="text-sm text-destructive">{fieldErrors.logoStorageKey}</p>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Full legal name</Label>
                  <Input
                    id="platform-name"
                    aria-invalid={Boolean(fieldErrors.name)}
                    required
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="MapMyParty"
                  />
                  {fieldErrors.name && <p role="alert" className="text-sm text-destructive">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-fee-percent">Platform fee percent</Label>
                  <Input
                    id="platform-fee-percent"
                    aria-invalid={Boolean(fieldErrors.platformFeeConfig)}
                    required
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.platformFeeConfig}
                    onChange={(event) => handleChange("platformFeeConfig", event.target.value)}
                    placeholder="8"
                  />
                  {fieldErrors.platformFeeConfig && <p role="alert" className="text-sm text-destructive">{fieldErrors.platformFeeConfig}</p>}
                  <p className="text-xs text-muted-foreground">
                    Applied to buyer platform charges during booking checkout.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-address">Registered address</Label>
                <Textarea
                  id="platform-address"
                    aria-invalid={Boolean(fieldErrors.registeredAddress)}
                    required
                  value={form.registeredAddress}
                  onChange={(event) => handleChange("registeredAddress", event.target.value)}
                  placeholder="Registered business address"
                  rows={4}
                />
                  {fieldErrors.registeredAddress && <p role="alert" className="text-sm text-destructive">{fieldErrors.registeredAddress}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <IndiaLocationFields idPrefix="platform" state={form.state} city={form.city}
                  onChange={(location) => setForm((current) => ({ ...current, ...location }))}
                  required disabled={saving || uploading} errors={fieldErrors} />
                <div className="space-y-2">
                  <Label htmlFor="platform-pincode">Pincode</Label>
                  <Input
                    id="platform-pincode"
                    aria-invalid={Boolean(fieldErrors.pincode)}
                    required
                    value={form.pincode}
                    onChange={(event) => handleChange("pincode", event.target.value)}
                    placeholder="110001"
                  />
                  {fieldErrors.pincode && <p role="alert" className="text-sm text-destructive">{fieldErrors.pincode}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-gst">GSTIN</Label>
                  <Input
                    id="platform-gst"
                    aria-invalid={Boolean(fieldErrors.gstNumber)}
                    value={form.gstNumber}
                    onChange={(event) => handleChange("gstNumber", event.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                  />
                  {fieldErrors.gstNumber && <p role="alert" className="text-sm text-destructive">{fieldErrors.gstNumber}</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-sm text-muted-foreground">
                  {isNew || hasChanges ? "Unsaved changes are pending." : "Configuration is up to date."}
                </p>
                <Button type="submit" disabled={saving || uploading || (!isNew && !hasChanges)}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save config"}
                </Button>
              </div>
              </fieldset>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoterPlatformConfig;
