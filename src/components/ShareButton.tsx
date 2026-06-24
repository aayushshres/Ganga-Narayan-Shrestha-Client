import { useState } from "react";
import type { Lang } from "../types";
import { IconShare } from "./icons";

// Shares the current page URL (which produces a rich Open Graph preview when
// pasted into Twitter/Substack/Slack/etc). Uses the native share sheet when
// available, otherwise copies the link to the clipboard with feedback.
export default function ShareButton({
  title,
  text,
  lang,
  iconOnly = false,
  tooltipPosition = "top",
}: {
  title: string;
  text?: string;
  lang: Lang;
  iconOnly?: boolean;
  tooltipPosition?: "top" | "bottom";
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const label = lang === "np" ? "सेयर गर्नुहोस्" : "Share";
  const copiedLabel = lang === "np" ? "लिंक कपी भयो!" : "Link copied!";

  if (iconOnly) {
    return (
      <span style={{ position: "relative", display: "inline-flex" }}>
        <button
          onClick={handleShare}
          aria-label={label}
          title={label}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            background: copied ? "var(--crimson)" : "transparent",
            color: copied ? "white" : "var(--crimson)",
            border: "1px solid var(--crimson)",
            cursor: "pointer",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          <IconShare size={18} />
        </button>
        {copied && (
          <span
            role="status"
            style={{
              position: "absolute",
              ...(tooltipPosition === "bottom"
                ? { top: "calc(100% + 8px)" }
                : { bottom: "calc(100% + 8px)" }),
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--crimson)",
              color: "white",
              padding: "0.35rem 0.7rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            {copiedLabel}
          </span>
        )}
      </span>
    );
  }

  return (
    <button
      onClick={handleShare}
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.6rem 1.4rem",
        background: copied ? "var(--crimson)" : "transparent",
        color: copied ? "white" : "var(--crimson)",
        border: "1px solid var(--crimson)",
        borderRadius: "6px",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        fontSize: "1rem",
        transition: "background 0.15s ease, color 0.15s ease",
      }}
    >
      <IconShare size={18} />
      {copied ? copiedLabel : label}
    </button>
  );
}
