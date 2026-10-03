import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import "./StartupLoader.css";

export default function StartupLoader({ duration = 1500, onDone }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setLeaving(true), Math.max(300, duration - 350));
    const hideTimer = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [duration, onDone]);

  if (!visible) return null;

  return (
    <div className={`startup-loader ${leaving ? "startup-loader--leaving" : ""}`} aria-label="Loading AIForge">
      <div className="startup-loader__grid" />
      <div className="startup-loader__orb startup-loader__orb--one" />
      <div className="startup-loader__orb startup-loader__orb--two" />

      <div className="startup-loader__content">
        <div className="startup-loader__mark">
          <div className="startup-loader__ring startup-loader__ring--outer" />
          <div className="startup-loader__ring startup-loader__ring--inner" />
          <div className="startup-loader__core">
            <Sparkles size={25} strokeWidth={1.8} />
          </div>
        </div>

        <div className="startup-loader__brand">AIForge</div>
        <div className="startup-loader__status">
          <span className="startup-loader__dot" />
          Initializing your AI workspace
          <span className="startup-loader__dots" aria-hidden="true">...</span>
        </div>

        <div className="startup-loader__progress">
          <span />
        </div>
      </div>
    </div>
  );
}
