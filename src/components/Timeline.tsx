import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { timelineData } from "../data/timeline";
import { t } from "../types";
import type { Translatable } from "../types";

const sectionLabel: Translatable = { en: "A Life of Struggle & Service", np: "संघर्ष र सेवाको जीवन" };
const sectionTitle: Translatable = { en: "Biography & Timeline", np: "जीवनी र समयरेखा" };

function TimelineEntryCard({ entry }: { entry: (typeof timelineData)[number] }) {
  const ref = useScrollReveal<HTMLDivElement>();
  const { lang } = useAppContext();

  return (
    <div className="timeline-entry" ref={ref}>
      <div className="timeline-dot"></div>
      {/* <div className="timeline-year">{t(entry.year, lang)}</div> */}
      <h3 className="timeline-heading">{t(entry.heading, lang)}</h3>
      <p className="timeline-desc">{t(entry.description, lang)}</p>
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
