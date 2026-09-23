import { useEffect, useState } from "react";
import "./IntroLoader.css";

const INTRO_TIMING_MS = Object.freeze({
  standard: Object.freeze({
    backgroundReveal: 300,
    logoRevealDelay: 300,
    logoRevealDuration: 600,
    exitStart: 1800,
    exitDuration: 600,
  }),
  reduced: Object.freeze({
    backgroundReveal: 100,
    logoRevealDelay: 0,
    logoRevealDuration: 100,
    exitStart: 450,
    exitDuration: 200,
  }),
});

const createTimingStyles = (timing) => ({
  "--intro-background-duration": `${timing.backgroundReveal}ms`,
  "--intro-logo-delay": `${timing.logoRevealDelay}ms`,
  "--intro-logo-duration": `${timing.logoRevealDuration}ms`,
  "--intro-hold-duration": `${timing.exitStart}ms`,
  "--intro-exit-duration": `${timing.exitDuration}ms`,
});

const INTRO_TIMING_STYLES = Object.freeze({
  standard: Object.freeze(createTimingStyles(INTRO_TIMING_MS.standard)),
  reduced: Object.freeze(createTimingStyles(INTRO_TIMING_MS.reduced)),
});

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const IntroLoader = ({ children, enabled, onIntroConsumed }) => {
  const [motionMode] = useState(() =>
    prefersReducedMotion() ? "reduced" : "standard",
  );
  const [phase, setPhase] = useState(() => (enabled ? "playing" : "complete"));
  const timing = INTRO_TIMING_MS[motionMode];
  const timingStyles = INTRO_TIMING_STYLES[motionMode];
  const isActive = phase !== "complete";

  useEffect(() => {
    if (enabled) onIntroConsumed();
  }, [enabled, onIntroConsumed]);

  useEffect(() => {
    if (!isActive) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousScrollbarGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.body.style.overflow = "hidden";

    const exitTimer = window.setTimeout(() => {
      setPhase("exiting");
    }, timing.exitStart);
    const completeTimer = window.setTimeout(() => {
      setPhase("complete");
    }, timing.exitStart + timing.exitDuration);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.scrollbarGutter = previousScrollbarGutter;
    };
  }, [isActive, timing]);

  return (
    <>
      <div
        className={`landing-intro-content ${
          isActive ? "landing-intro-content--hidden" : ""
        } ${phase === "exiting" ? "landing-intro-content--revealing" : ""}`}
        style={timingStyles}
        aria-hidden={isActive ? "true" : undefined}
        inert={isActive ? "" : undefined}
      >
        {children}
      </div>

      {isActive ? (
        <div
          className={[
            "landing-intro-overlay",
            `landing-intro-overlay--${phase}`,
            `landing-intro-overlay--${motionMode}`,
          ].join(" ")}
          style={timingStyles}
          aria-hidden="true"
        >
          <div className="landing-intro-mark">
            <span className="landing-intro-glow" />
            <img
              className="landing-intro-logo"
              src="/logo.png"
              alt=""
              width="986"
              height="975"
              decoding="async"
              fetchpriority="high"
              draggable="false"
              onError={() => setPhase("complete")}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default IntroLoader;
