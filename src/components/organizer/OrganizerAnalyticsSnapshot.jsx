import { BarChart3, CalendarDays, IndianRupee, RefreshCw } from "lucide-react";

const toTitleCase = (value) => {
  if (!value) return "-";
  return String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(Number(value) || 0);
const formatCurrency = (value) => `INR ${formatNumber(value)}`;

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const KeyValueList = ({ data = {}, emptyLabel = "No data available" }) => {
  const entries = Object.entries(data || {});
  if (!entries.length) {
    return <p className="text-xs text-gray-500 light:text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 text-xs [overflow-wrap:anywhere]">
          <span className="text-gray-400 light:text-muted-foreground">{toTitleCase(label)}</span>
          <span className="font-medium text-white light:text-foreground">{formatNumber(value)}</span>
        </div>
      ))}
    </div>
  );
};

const OrganizerAnalyticsSnapshot = ({ analytics, loading, error, compact = false }) => {
  const period = analytics?.summary?.period || {};
  const byStatus = analytics?.breakdown?.byStatus || {};
  const byCategory = analytics?.breakdown?.byCategory || {};
  const byBookingStatus = analytics?.breakdown?.byBookingStatus || {};
  const byTicketType = analytics?.breakdown?.byTicketType || {};
  const refunds = analytics?.refunds || {};
  const ticketTypeRows = Object.entries(byTicketType || {});

  return (
    <section aria-label="Monthly snapshot analytics" className={`organizer-snapshot ${compact ? "organizer-mobile-analytics p-4" : "p-4 sm:p-5"}`}>
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--snapshot-border)]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400 light:text-muted-foreground">Analytics</p>
          <h4 className="text-base font-semibold">Monthly Snapshot</h4>
          <p className="text-[11px] text-gray-500 mt-1 light:text-muted-foreground">
            {toTitleCase(period?.type || "month")} | {formatDateTime(period?.start)} to {formatDateTime(period?.end)}
          </p>
        </div>
        <BarChart3 className="w-5 h-5 text-gray-300 light:text-muted-foreground" />
      </div>

      {loading ? (
        <div className="mt-6 text-center py-8 text-gray-400 light:text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading analytics snapshot...</p>
        </div>
      ) : error ? (
        <div className="mt-6 rounded-lg border border-gray-800 bg-gray-950 p-4 light:border-border light:bg-surface">
          <p className="text-xs text-gray-400 light:text-muted-foreground">Unable to load analytics</p>
          <p className="text-sm text-white mt-1 light:text-foreground">{error}</p>
        </div>
      ) : (
        <div className={`organizer-snapshot-grid mt-4 ${compact ? "is-compact" : ""}`}>
          <div className="min-w-0 space-y-3">
          <div className="organizer-snapshot-counts grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 light:border-border light:bg-surface">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 light:text-muted-foreground">Event Status Types</p>
              <p className="text-sm font-semibold mt-1">{formatNumber(Object.keys(byStatus).length)}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 light:border-border light:bg-surface">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 light:text-muted-foreground">Ticket Types</p>
              <p className="text-sm font-semibold mt-1">{formatNumber(ticketTypeRows.length)}</p>
            </div>
          </div>

          <div className="organizer-snapshot-breakdown rounded-lg border border-gray-800 bg-gray-950 p-3 light:border-border light:bg-surface">
            <p className="text-xs font-semibold text-white light:text-foreground">Breakdown</p>
            <div className="organizer-breakdown-rows mt-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 light:text-muted-foreground">By Status</p>
                <KeyValueList data={byStatus} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 light:text-muted-foreground">By Category</p>
                <KeyValueList data={byCategory} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 light:text-muted-foreground">By Booking Status</p>
                <KeyValueList data={byBookingStatus} />
              </div>
            </div>
            <div className="organizer-ticket-breakdown mt-3 pt-3 border-t border-[var(--snapshot-border)]">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 mb-2 light:text-muted-foreground">By Ticket Type</p>
              {!ticketTypeRows.length ? (
                <p className="text-xs text-gray-500 light:text-muted-foreground">No ticket type data available</p>
              ) : (
                <div className="space-y-2">
                  {ticketTypeRows.map(([ticketType, values]) => (
                    <div
                      key={ticketType}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-800 px-2 py-2 text-xs light:border-border [overflow-wrap:anywhere]"
                    >
                      <span className="text-gray-300 light:text-muted-foreground">{toTitleCase(ticketType)}</span>
                      <span className="text-gray-400 light:text-muted-foreground">
                        Sold: <span className="text-white light:text-foreground">{formatNumber(values?.ticketsSold)}</span> | Types:{" "}
                        <span className="text-white light:text-foreground">{formatNumber(values?.ticketCount)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          </div>
          <div className="min-w-0 flex flex-col gap-3">
          <div className="organizer-snapshot-refunds rounded-lg border border-gray-800 bg-gray-950 p-3 light:border-border light:bg-surface">
            <p className="text-xs font-semibold text-white flex items-center gap-1 light:text-foreground">
              <IndianRupee className="w-3.5 h-3.5" /> Refunds
            </p>
            {Object.keys(refunds || {}).length === 0 ? (
              <p className="text-xs text-gray-500 mt-2 light:text-muted-foreground">No refunds in selected period.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {Object.entries(refunds).map(([status, values]) => (
                  <div key={status} className="flex flex-wrap items-center justify-between gap-2 text-xs [overflow-wrap:anywhere]">
                    <span className="text-gray-400 light:text-muted-foreground">{toTitleCase(status)}</span>
                    <span className="text-white light:text-foreground">
                      Count {formatNumber(values?.count)} | Amount {formatCurrency((values?.amountCents || 0) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="organizer-snapshot-period -order-1 rounded-lg border border-gray-800 bg-gray-950 p-3 light:border-border light:bg-surface">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 flex items-center gap-1 light:text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" /> Period Summary
            </p>
            <div className="mt-2 text-xs space-y-1">
              <p className="text-gray-400 light:text-muted-foreground">Type: <span className="text-white light:text-foreground">{toTitleCase(period?.type)}</span></p>
              <p className="text-gray-400 light:text-muted-foreground">Start: <span className="text-white light:text-foreground">{formatDateTime(period?.start)}</span></p>
              <p className="text-gray-400 light:text-muted-foreground">End: <span className="text-white light:text-foreground">{formatDateTime(period?.end)}</span></p>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OrganizerAnalyticsSnapshot;
