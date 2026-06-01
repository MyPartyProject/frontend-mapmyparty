const RUPEE_SYMBOL = "\u20B9";
const MOJIBAKE_RUPEE = "\u00E2\u201A\u00B9";

const inrNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});
const rupeeAmountPattern = new RegExp(
  `^(From\\s+)?${RUPEE_SYMBOL}\\s*([0-9,]+(?:\\.[0-9]+)?)$`,
  "i"
);

export const formatIndianRupee = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;

  return `${RUPEE_SYMBOL}${inrNumberFormatter.format(amount)}`;
};

export const formatEventPriceLabel = (value, { prefix = "" } = {}) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  if (amount <= 0) return "Free";

  const formattedAmount = formatIndianRupee(amount);
  return prefix ? `${prefix} ${formattedAmount}` : formattedAmount;
};

export const normalizePriceLabel = (label) => {
  if (typeof label !== "string") return null;

  const normalizedLabel = label
    .trim()
    .replaceAll(MOJIBAKE_RUPEE, RUPEE_SYMBOL)
    .replace(/\bINR\s*/gi, RUPEE_SYMBOL)
    .replace(/\bRs\.?\s*/gi, RUPEE_SYMBOL);

  if (!normalizedLabel) return null;
  if (/^free$/i.test(normalizedLabel)) return "Free";

  const amountMatch = normalizedLabel.match(rupeeAmountPattern);
  if (!amountMatch) return normalizedLabel;

  const amount = Number(amountMatch[2].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return normalizedLabel;

  const prefix = amountMatch[1] ? "From" : "";
  return formatEventPriceLabel(amount, { prefix });
};
