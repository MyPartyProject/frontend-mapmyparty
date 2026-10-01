export const nonNegativeNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
};

export const progressPercent = (value, total = 100) => {
  const denominator = nonNegativeNumber(total);
  return denominator > 0 ? Math.min(100, nonNegativeNumber(value) / denominator * 100) : 0;
};
