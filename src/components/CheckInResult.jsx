import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, QrCode } from "lucide-react";

const CheckInResult = ({ result, onScanNext, onClose }) => {
  if (!result) return null;

  const { type, data, error } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-background p-6 shadow-2xl shadow-black/5 space-y-4">
        {type === "success" && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-lg font-bold text-success">Checked In</h3>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xl font-semibold text-foreground">{data.attendeeName}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{data.ticketType}</span>
                <span className="h-1 w-1 rounded-full bg-muted" />
                <span>Qty {data.quantity}</span>
              </div>
            </div>
          </>
        )}

        {type === "already_checked_in" && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-3">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-lg font-bold text-warning">Already Checked In</h3>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-xl font-semibold text-foreground">{data.attendeeName}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>{data.ticketType}</span>
                <span className="h-1 w-1 rounded-full bg-muted" />
                <span>Qty {data.quantity}</span>
              </div>
              {data.checkedInAt && (
                <p className="text-xs text-warning">
                  Checked in at{" "}
                  {new Intl.DateTimeFormat("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(data.checkedInAt))}
                </p>
              )}
            </div>
          </>
        )}

        {type === "error" && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-400/30 flex items-center justify-center mb-3">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-destructive">Check-in Failed</h3>
            </div>
            <p className="text-sm text-destructive text-center">{error}</p>
          </>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onScanNext}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 border border-border hover:border-emerald-300/40 transition text-sm font-medium flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4" />
            Scan Next
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-muted border border-border hover:bg-muted transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInResult;
