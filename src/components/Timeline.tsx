import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { timelineData } from "../data/timeline";
import { t } from "../types";
import type { Lang, Translatable } from "../types";

const sectionLabel: Translatable = { en: "A Life of Struggle & Service", np: "संघर्ष र सेवाको जीवन" };
const sectionTitle: Translatable = { en: "Biography & Timeline", np: "जीवनी र समयरेखा" };

const MAX_LINES = 4;

// Clamps a paragraph to 4 lines, revealing a bilingual show more/less toggle
// only when the text actually overflows.
function ClampedDesc({ text, lang }: { text: string; lang: Lang }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      // Measure against the clamped height regardless of current state.
      const clampedMax =
        parseFloat(getComputedStyle(el).lineHeight) * MAX_LINES + 1;
      setOverflowing(el.scrollHeight > clampedMax);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  const clampStyle: React.CSSProperties = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitLineClamp: MAX_LINES,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      };

  return (
    <>
      <p ref={ref} className="timeline-desc" style={clampStyle}>
        {text}
      </p>
      {overflowing && (
        <button
          type="button"
          className="show-more-btn"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded
            ? lang === "np"
              ? "कम हेर्नुहोस्"
              : "Show less"
            : lang === "np"
              ? "थप हेर्नुहोस्"
              : "Show more"}
        </button>
      )}
    </>
  );
}

function TimelineEntryCard({ entry }: { entry: (typeof timelineData)[number] }) {
  const ref = useScrollReveal<HTMLDivElement>();
  const { lang } = useAppContext();

  return (
    <div className="timeline-entry" ref={ref}>
      <div className="timeline-dot"></div>
      {/* <div className="timeline-year">{t(entry.year, lang)}</div> */}
      <h3 className="timeline-heading">{t(entry.heading, lang)}</h3>
      <ClampedDesc text={t(entry.description, lang)} lang={lang} />
    </div>
  );
}

export default function Timeline() {
  const { lang } = useAppContext();
  const headerRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="section timeline-section" id="timeline">
      <div className="section-inner">
        <div className="section-header reveal" ref={headerRef}>
          <p className="section-label">{t(sectionLabel, lang)}</p>
          <h2 className="section-title">{t(sectionTitle, lang)}</h2>
          <hr className="section-rule" />
        </div>

        <div className="timeline">
          {timelineData.map((entry) => (
            <TimelineEntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </section>
  );
}
