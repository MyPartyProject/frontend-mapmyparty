export const formatSupportLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Unknown";

export const supportStatusTone = (status) => {
  switch (status) {
    case "OPEN":
      return "border-blue-500/25 bg-blue-500/10 text-blue-300";
    case "IN_PROGRESS":
      return "border-amber-500/25 bg-amber-500/10 text-amber-300";
    case "WAITING_FOR_USER":
      return "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-300";
    case "RESOLVED":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
    case "CLOSED":
      return "border-slate-500/25 bg-slate-500/10 text-slate-300";
    default:
      return "border-white/15 bg-white/5 text-white/70";
  }
};

export const supportPriorityTone = (priority) => {
  switch (priority) {
    case "URGENT":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "HIGH":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";
    case "MEDIUM":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "LOW":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-white/15 bg-white/5 text-white/70";
  }
};

export const formatSupportDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};
