import React from "react";

const clampPercent = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(100, Math.max(0, numeric));
};

const AnalyticsProgressBar = ({
  value = 0,
  trackClassName = "",
  fillClassName = "",
  trackStyle,
  fillStyle,
  minVisiblePercent = 0,
  className = "",
  heightClassName = "h-2",
}) => {
  const percent = clampPercent(value);
  const width = percent > 0 ? Math.max(percent, minVisiblePercent) : 0;

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${heightClassName} ${trackClassName} ${className}`.trim()}
      style={trackStyle}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${fillClassName}`.trim()}
        style={{
          width: `${width}%`,
          ...fillStyle,
        }}
      />
    </div>
  );
};

export default AnalyticsProgressBar;
