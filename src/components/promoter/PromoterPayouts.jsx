import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader,
  Plus,
  RefreshCw,
  Search,
  Wallet2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminPayouts } from "@/hooks/useAdminPayouts";
import { useOrganizers } from "@/hooks/useOrganizers";
import { createAdminPayout, updateAdminPayoutStatus } from "@/services/adminService";

const statusOptions = ["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"];

const PromoterPayouts = () => {
  const { items, statistics, filters, loading, isFetching, error, updateFilters, refresh } = useAdminPayouts();
  const { organizers } = useOrganizers();
  const [createForm, setCreateForm] = useState({
    organizerId: "",
    amount: "",
    payoutDate: "",
    remarks: "",
  });
  const [statusForm, setStatusForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const totals = useMemo(() => {
    const base = {
      totalAmount: 0,
      totalCount: 0,
      pendingAmount: 0,
      failedAmount: 0,
    };

    statistics.forEach((item) => {
      const amount = Number(item?._sum?.amount || 0);
      const count = Number(item?._count?.id || 0);
      base.totalAmount += amount;
      base.totalCount += count;
      if (item.status === "PENDING") base.pendingAmount = amount;
      if (item.status === "FAILED") base.failedAmount = amount;
    });

    return base;
  }, [statistics]);

  const handleCreatePayout = async (event) => {
    event.preventDefault();
    if (!createForm.organizerId || !createForm.amount) {
      toast.error("Organizer and amount are required.");
      return;
    }

    setIsCreating(true);
    try {
      await createAdminPayout({
        organizerId: createForm.organizerId,
        amount: Number(createForm.amount),
        payoutDate: createForm.payoutDate || null,
        remarks: createForm.remarks.trim(),
      });
      toast.success("Payout created.");
      setCreateForm({
        organizerId: "",
        amount: "",
        payoutDate: "",
        remarks: "",
      });
      refresh();
    } catch (createError) {
      toast.error(createError.message || "Failed to create payout.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (payoutId) => {
    const payload = statusForm[payoutId];
    if (!payload?.status) {
      toast.error("Choose a status first.");
      return;
    }

    setUpdatingId(payoutId);
    try {
      await updateAdminPayoutStatus(payoutId, payload);
      toast.success("Payout status updated.");
      refresh();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update payout.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Payouts</h2>
          <p className="text-muted-foreground">Create settlements, review failures, and move payouts through the pipeline.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/70 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total pipeline</p>
            <p className="mt-1 text-2xl font-semibold">{totals.totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-muted-foreground">{totals.totalCount} payouts</p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-semibold text-amber-500">{totals.pendingAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-muted-foreground">Awaiting release</p>
          </CardContent>
        </Card>
        <Card className="bg-card/70 border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="mt-1 text-2xl font-semibold text-destructive">{totals.failedAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}</p>
            <p className="text-sm text-muted-foreground">Need admin intervention</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/70 border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create payout
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create a payout against an existing organizer and verified bank setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreatePayout}>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={createForm.organizerId}
              onChange={(event) => setCreateForm((current) => ({ ...current, organizerId: event.target.value }))}
            >
              <option value="">Select organizer</option>
              {organizers.map((organizer) => (
                <option key={organizer.id} value={organizer.id}>
                  {organizer.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount"
              value={createForm.amount}
              onChange={(event) => setCreateForm((current) => ({ ...current, amount: event.target.value }))}
            />
            <Input
              type="datetime-local"
              value={createForm.payoutDate}
              onChange={(event) => setCreateForm((current) => ({ ...current, payoutDate: event.target.value }))}
            />
            <div className="md:col-span-2">
              <Textarea
                placeholder="Remarks"
                value={createForm.remarks}
                onChange={(event) => setCreateForm((current) => ({ ...current, remarks: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create payout"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search organizer, bank, remarks..."
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateFilters({ status })}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                filters.status === status
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/60 bg-card/70 text-muted-foreground hover:bg-card"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Error loading payouts</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card className="bg-card/70 border-border/60">
              <CardContent className="py-12 text-center text-muted-foreground">No payouts found.</CardContent>
            </Card>
          ) : (
            items.map((payout) => (
              <Card key={payout.id} className="bg-card/70 border-border/60">
                <CardContent className="p-4 space-y-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{payout.organizer?.name || "Unknown organizer"}</p>
                        <Badge variant={payout.status === "COMPLETED" ? "success" : payout.status === "FAILED" ? "destructive" : "outline"}>
                          {payout.status}
                        </Badge>
                        {payout.organizer?.isSuspended && (
                          <Badge variant="destructive">Organizer suspended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payout.bank_details?.accountHolder || "Unknown account holder"} · {payout.bank_details?.bankName || "No bank"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.bank_details?.ifscCode || "No IFSC"} · Verification {payout.bank_details?.verificationStatus || "Unknown"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-2xl font-semibold text-accent">
                        {Number(payout.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payout.payoutDate ? new Date(payout.payoutDate).toLocaleString("en-IN") : "No payout date"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-2"><Wallet2 className="h-4 w-4" /> User</p>
                      <p className="font-semibold">{payout.user?.name || "N/A"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-2"><Banknote className="h-4 w-4" /> Batch</p>
                      <p className="font-semibold">{payout.providerBatchId || "Not set"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-2"><Clock3 className="h-4 w-4" /> Provider payout</p>
                      <p className="font-semibold">{payout.providerPayoutId || "Not set"}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        {payout.failureReason ? <XCircle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        Notes
                      </p>
                      <p className="font-semibold">{payout.failureReason || payout.remarks || "No remarks"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                    <select
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={statusForm[payout.id]?.status || payout.status}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          [payout.id]: { ...current[payout.id], status: event.target.value },
                        }))
                      }
                    >
                      {["PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="Provider batch id"
                      value={statusForm[payout.id]?.providerBatchId || payout.providerBatchId || ""}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          [payout.id]: { ...current[payout.id], providerBatchId: event.target.value },
                        }))
                      }
                    />
                    <Input
                      placeholder="Failure reason or remarks"
                      value={statusForm[payout.id]?.failureReason || statusForm[payout.id]?.remarks || payout.failureReason || payout.remarks || ""}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          [payout.id]: {
                            ...current[payout.id],
                            failureReason: event.target.value,
                            remarks: event.target.value,
                          },
                        }))
                      }
                    />
                    <Button onClick={() => handleUpdateStatus(payout.id)} disabled={updatingId === payout.id}>
                      {updatingId === payout.id ? "Saving..." : "Update"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PromoterPayouts;
