import { useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw, Settings2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchPlatformConfig, savePlatformConfig } from "@/services/adminService";

const emptyForm = {
  name: "",
  registeredAddress: "",
  state: "",
  city: "",
  pincode: "",
  platformFeeConfig: "",
  gstNumber: "",
};

const normalizeConfig = (config = {}) => ({
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
      const config = await fetchPlatformConfig();
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

    try {
      const payload = {
        name: form.name.trim(),
        registeredAddress: form.registeredAddress.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        platformFeeConfig: Number(form.platformFeeConfig),
        gstNumber: form.gstNumber.trim() || "",
      };

      const saved = await savePlatformConfig(payload);
      const normalized = normalizeConfig(saved || payload);
      setForm(normalized);
      setInitialForm(normalized);
      toast.success("Platform configuration updated.");
    } catch (saveError) {
      const message = saveError.message || "Failed to save platform configuration.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

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
          <Button variant="outline" size="sm" onClick={() => loadConfig({ silent: true })} disabled={refreshing || saving}>
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
              {error ? (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform name</Label>
                  <Input
                    id="platform-name"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="MapMyParty"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-fee-percent">Platform fee percent</Label>
                  <Input
                    id="platform-fee-percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.platformFeeConfig}
                    onChange={(event) => handleChange("platformFeeConfig", event.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Applied to buyer platform charges during booking checkout.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-address">Registered address</Label>
                <Textarea
                  id="platform-address"
                  value={form.registeredAddress}
                  onChange={(event) => handleChange("registeredAddress", event.target.value)}
                  placeholder="Registered business address"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="platform-city">City</Label>
                  <Input
                    id="platform-city"
                    value={form.city}
                    onChange={(event) => handleChange("city", event.target.value)}
                    placeholder="Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-state">State</Label>
                  <Input
                    id="platform-state"
                    value={form.state}
                    onChange={(event) => handleChange("state", event.target.value)}
                    placeholder="Delhi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform-pincode">Pincode</Label>
                  <Input
                    id="platform-pincode"
                    value={form.pincode}
                    onChange={(event) => handleChange("pincode", event.target.value)}
                    placeholder="110001"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platform-gst">GST number</Label>
                  <Input
                    id="platform-gst"
                    value={form.gstNumber}
                    onChange={(event) => handleChange("gstNumber", event.target.value.toUpperCase())}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-sm text-muted-foreground">
                  {hasChanges ? "Unsaved changes are pending." : "Configuration is up to date."}
                </p>
                <Button type="submit" disabled={saving || !hasChanges}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save config"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoterPlatformConfig;
