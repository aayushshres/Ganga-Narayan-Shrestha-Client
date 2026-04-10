import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { Article, Translatable } from "../types";
import { t } from "../types";
import { fetchArticles } from "../api/index";
import { formatPostDate } from "../utils/formatDate";

const pageTitle: Translatable = { en: "All Articles & Literature", np: "सबै लेख तथा साहित्य" };

const categoryColorMap: Record<string, string> = {
  article: "latest-card__badge--article",
  literature: "latest-card__badge--literature",
};

const categoryLabelMap: Record<string, Translatable> = {
  article: { en: "Article", np: "लेख" },
  literature: { en: "Literature", np: "साहित्य" },
};

export default function AllArticles() {
  const { lang } = useAppContext();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    const params: { category?: string; q?: string } = {};
    if (category !== "all") params.category = category;
    if (debouncedQuery.trim().length >= 2) params.q = debouncedQuery;
    fetchArticles(params)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedQuery, category]);

  return (
    <div className="detail-page">
      <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
      <h1 className="detail-page__title">{t(pageTitle, lang)}</h1>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { id: "all", en: "All", np: "सबै" },
          { id: "article", en: "Article", np: "लेख" },
          { id: "literature", en: "Literature", np: "साहित्य" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "20px",
              border: category === cat.id ? "none" : "1px solid var(--border-color)",
              background: category === cat.id ? "var(--crimson)" : "var(--bg-card)",
              color: category === cat.id ? "white" : "var(--text-primary)",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
            }}
          >
            {lang === "np" ? cat.np : cat.en}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto 3rem auto" }}>
        <input
          type="text"
          placeholder={lang === "np" ? "खोज्नुहोस्..." : "Search..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            fontSize: "1rem",
            fontFamily: "var(--font-body)",
          }}
        />
      </div>

      <div className="latest-list latest-list--full">
        {loading ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            {lang === "np" ? "लोड हुँदैछ..." : "Loading..."}
          </p>
        ) : entries.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            {lang === "np" ? "कुनै नतिजा भेटिएन" : "No results found"}
          </p>
        ) : (
          entries.map((entry) => {
            const badge = t(categoryLabelMap[entry.category] ?? { en: entry.category, np: entry.category }, lang);
            return (
              <Link key={entry._id} to={`/articles/${entry._id}`} className="latest-card horizontal-card--list">
                <span className={`latest-card__badge ${categoryColorMap[entry.category]}`}>
                  {badge}
                </span>
                <h3 className="latest-card__title">{entry.title}</h3>
                <p className="latest-card__excerpt">{entry.excerpt}</p>
                <p className="latest-card__date">{formatPostDate(entry.createdAt, lang)}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
