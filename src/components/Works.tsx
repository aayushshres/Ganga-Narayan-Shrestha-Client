import { useScrollReveal } from "../hooks/useScrollReveal";
import { useAppContext } from "../context/AppContext";
import type { Translatable } from "../types";
import { t } from "../types";
import ArticlesSection from "./ArticlesSection";
import BooksSection from "./BooksSection";
import SongsSection from "./SongsSection";

const sectionLabel: Translatable = { en: "Writing & Thought", np: "लेखन र विचार" };
const sectionTitle: Translatable = { en: "Writings", np: "लेखनहरू" };

export default function Works() {
  const { lang } = useAppContext();
  const headerRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="section" id="writings">
      <div className="section-inner">
        <div className="section-header reveal" ref={headerRef}>
          <p className="section-label">{t(sectionLabel, lang)}</p>
          <h2 className="section-title">{t(sectionTitle, lang)}</h2>
          <hr className="section-rule" />
        </div>
        <ArticlesSection />
        <BooksSection />
        <SongsSection />
      </div>
    </section>
  );
}
