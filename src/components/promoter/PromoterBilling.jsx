import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader,
  RefreshCw,
  Search,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminBankDetails } from "@/hooks/useAdminBankDetails";
import { manuallyRejectAdminBank, manuallyVerifyAdminBank } from "@/services/adminService";

const statusOptions = ["ALL", "UNVERIFIED", "VERIFICATION_IN_PROGRESS", "VERIFIED", "FAILED"];

const PromoterBilling = () => {
  const { items, filters, loading, isFetching, error, updateFilters, refresh } = useAdminBankDetails();
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const stats = useMemo(
    () => ({
      total: items.length,
      verified: items.filter((item) => item.verificationStatus === "VERIFIED").length,
      blocked: items.filter((item) => item.verificationStatus === "FAILED").length,
      pending: items.filter((item) => ["UNVERIFIED", "VERIFICATION_IN_PROGRESS"].includes(item.verificationStatus)).length,
    }),
    [items]
  );

  const handleManualVerify = async (bankId) => {
    setUpdatingId(bankId);
    try {
      await manuallyVerifyAdminBank(bankId, {
        reviewNotes: reviewDrafts[bankId]?.reviewNotes || "",
      });
      toast.success("Bank account verified.");
      refresh();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to verify bank account.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualReject = async (bankId) => {
    const note = reviewDrafts[bankId]?.reviewNotes?.trim();
    if (!note) {
      toast.error("Add a review note before rejecting.");
      return;
    }

    setUpdatingId(bankId);
    try {
      await manuallyRejectAdminBank(bankId, {
        reason: note,
        reviewNotes: note,
      });
      toast.success("Bank account rejected.");
      refresh();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to reject bank account.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Billing & Bank Review</h2>
          <p className="text-muted-foreground">Review organizer bank readiness before settlements are released.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Records</p><p className="mt-1 text-2xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Verified</p><p className="mt-1 text-2xl font-semibold text-emerald-500">{stats.verified}</p></CardContent></Card>
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending review</p><p className="mt-1 text-2xl font-semibold text-amber-500">{stats.pending}</p></CardContent></Card>
        <Card className="bg-card/70 border-border/60"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Blocked</p><p className="mt-1 text-2xl font-semibold text-destructive">{stats.blocked}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search organizer, bank, IFSC..."
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
              <p className="font-semibold text-destructive">Error loading bank details</p>
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
              <CardContent className="py-12 text-center text-muted-foreground">No bank records found.</CardContent>
            </Card>
          ) : (
            items.map((bank) => (
              <Card key={bank.id} className="bg-card/70 border-border/60">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {bank.organizer?.name || "Unknown organizer"}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {bank.organizer?.email || "No organizer email"} · {bank.organizer?.owner?.name || "No owner"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={bank.verificationStatus === "VERIFIED" ? "success" : bank.verificationStatus === "FAILED" ? "destructive" : "outline"}>
                        {bank.verificationStatus}
                      </Badge>
                      {bank.organizer?.isVerified && <Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" /> Organizer verified</Badge>}
                      {bank.organizer?.isSuspended && <Badge variant="destructive">Organizer suspended</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground flex items-center gap-2"><WalletCards className="h-4 w-4" /> Bank</p>
                      <p className="font-semibold">{bank.bankName}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">Branch</p>
                      <p className="font-semibold">{bank.branchName}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">Account holder</p>
                      <p className="font-semibold">{bank.accountHolder}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">Account number</p>
                      <p className="font-semibold">{bank.accountNumber}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                      <p className="text-xs text-muted-foreground">IFSC</p>
                      <p className="font-semibold">{bank.ifscCode}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <Textarea
                      placeholder="Review notes or rejection reason"
                      value={reviewDrafts[bank.id]?.reviewNotes ?? bank.reviewNotes ?? ""}
                      onChange={(event) =>
                        setReviewDrafts((current) => ({
                          ...current,
                          [bank.id]: {
                            ...current[bank.id],
                            reviewNotes: event.target.value,
                          },
                        }))
                      }
                    />
                    <div className="flex flex-wrap gap-2 md:flex-col">
                      <Button
                        onClick={() => handleManualVerify(bank.id)}
                        disabled={updatingId === bank.id || bank.verificationStatus === "VERIFIED"}
                        className="gap-2"
                      >
                        {updatingId === bank.id ? <Loader className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Verify
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleManualReject(bank.id)}
                        disabled={updatingId === bank.id}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                  {(bank.verificationMethod || bank.verifiedAt || bank.verificationFailureReason) && (
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Method</p>
                        <p className="font-semibold">{bank.verificationMethod || "Not recorded"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Verified at</p>
                        <p className="font-semibold">
                          {bank.verifiedAt ? new Date(bank.verifiedAt).toLocaleDateString("en-IN") : "Not verified"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card/80 p-3">
                        <p className="text-xs text-muted-foreground">Failure reason</p>
                        <p className="font-semibold">{bank.verificationFailureReason || "None"}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PromoterBilling;
