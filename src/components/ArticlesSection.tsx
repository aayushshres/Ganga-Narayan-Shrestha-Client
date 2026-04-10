import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { fetchArticles } from "../api/index";
import { formatPostDate } from "../utils/formatDate";
import { categoryColorMap, categoryLabelMap } from "../utils/article";
import type { Article, Translatable } from "../types";
import { t } from "../types";
import HorizontalScroll from "./HorizontalScroll";

const articlesLabel: Translatable = { en: "Articles & Literature", np: "लेख तथा साहित्य" };
const viewAllArticles: Translatable = { en: "View All →", np: "सबै हेर्नुहोस् →" };

const SKELETON_COUNT = 4;

function ArticleSkeleton() {
  return (
    <div
      className="latest-card horizontal-card"
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "160px" }}
    >
      <div style={{ width: "60px", height: "22px", borderRadius: "4px", background: "var(--border-color)" }} />
      <div style={{ width: "80%", height: "18px", borderRadius: "4px", background: "var(--border-color)" }} />
      <div style={{ width: "100%", height: "14px", borderRadius: "4px", background: "var(--border-light)" }} />
      <div style={{ width: "70%", height: "14px", borderRadius: "4px", background: "var(--border-light)" }} />
    </div>
  );
}

export default function ArticlesSection() {
  const { lang } = useAppContext();
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles({ limit: 10 })
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="subsection reveal" ref={sectionRef}>
      <h3 className="subsection-title">{t(articlesLabel, lang)}</h3>
      {!loading && articles.length === 0 && (
        <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
          {lang === "np" ? "हाल कुनै लेख उपलब्ध छैन।" : "No articles available yet."}
        </p>
      )}
      <HorizontalScroll className="row-wrapper">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <ArticleSkeleton key={i} />)
          : articles.map((entry) => {
              const badge = t(
                categoryLabelMap[entry.category] ?? { en: entry.category, np: entry.category },
                lang,
              );
              return (
                <Link
                  key={entry._id}
                  to={`/articles/${entry._id}`}
                  className="latest-card horizontal-card"
                  draggable={false}
                >
                  <span className={`latest-card__badge ${categoryColorMap[entry.category]}`}>
                    {badge}
                  </span>
                  <h4 className="latest-card__title">{entry.title}</h4>
                  <p className="latest-card__excerpt">{entry.excerpt}</p>
                  <p className="latest-card__date">{formatPostDate(entry.createdAt, lang)}</p>
                </Link>
              );
            })}
      </HorizontalScroll>
      <div className="row-footer">
        <Link to="/all-articles" className="row-link">
          {t(viewAllArticles, lang)}
        </Link>
      </div>
    </div>
  );
}
