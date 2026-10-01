import React from "react";
import { progressPercent } from "@/lib/progress";

const AnalyticsProgressBar = ({
  value = 0,
  trackClassName = "",
  fillClassName = "",
  trackStyle,
  fillStyle,
  label = "Progress",
  className = "",
  heightClassName = "h-2",
}) => {
  const unavailable = value == null || !Number.isFinite(Number(value));
  const percent = progressPercent(value);

  return (
    <div
      data-analytics-progress
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={unavailable ? undefined : percent}
      aria-valuetext={unavailable ? "Unavailable" : undefined}
      className={`w-full overflow-hidden rounded-full ${heightClassName} ${trackClassName} ${className}`.trim()}
      style={{ backgroundColor: "var(--chart-progress-track)", ...trackStyle }}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${fillClassName}`.trim()}
        style={{
          backgroundColor: "hsl(var(--primary-cta))",
          ...fillStyle,
          width: `${percent}%`,
          minWidth: percent > 0 ? "1px" : 0,
        }}
      />
    </div>
  );
};

export default AnalyticsProgressBar;
