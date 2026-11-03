export const getInitials = (name, email) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length) {
    return (Array.from(parts[0])[0] + (parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : "")).toUpperCase();
  }
  return (Array.from(String(email || "").trim())[0] || "U").toUpperCase();
};
