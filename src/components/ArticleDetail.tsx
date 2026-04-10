import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchArticle } from "../api/index";
import { formatPostDate } from "../utils/formatDate";
import { categoryColorMap, categoryLabelMap } from "../utils/article";
import DOMPurify from "dompurify";
import type { Article } from "../types";

const SITE_TITLE = "गंगानारायण श्रेष्ठ — Ganga Narayan Shrestha";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useAppContext();
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    fetchArticle(id)
      .then((data) => {
        setArticle(data);
        document.title = data.title;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    return () => {
      document.title = SITE_TITLE;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="detail-page">
        <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
        <p style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          {lang === "np" ? "लोड हुँदैछ..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="detail-page">
        <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
        <h1 className="detail-page__title">
          {lang === "np" ? "पृष्ठ भेटिएन" : "Page Not Found"}
        </h1>
      </div>
    );
  }

  const categoryLabel = categoryLabelMap[article.category] ?? { en: article.category, np: article.category };

  return (
    <div className="detail-page">
      <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
      <div style={{ textAlign: "center" }}>
        <span className={`latest-card__badge ${categoryColorMap[article.category]}`}>
          {lang === "np" ? categoryLabel.np : categoryLabel.en}
        </span>
      </div>
      <h1 className="detail-page__title">{article.title}</h1>
      <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
        {formatPostDate(article.createdAt, lang)}
      </p>
      <div
        className="detail-page__body"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
      />
      <div style={{ marginTop: "3rem", textAlign: "center", borderTop: "1px solid var(--border-light)", paddingTop: "2rem" }}>
        <button
          onClick={async () => {
            const shareData = {
              title: article.title,
              text: article.excerpt,
              url: window.location.href,
            };
            if (navigator.share) {
              try { await navigator.share(shareData); } catch { /* cancelled */ }
            } else {
              await navigator.clipboard.writeText(window.location.href);
              setShareFeedback(true);
              setTimeout(() => setShareFeedback(false), 2000);
            }
          }}
          style={{
            padding: "0.75rem 1.5rem",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: "1rem",
            transition: "background 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "var(--border-light)")}
          onMouseOut={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
        >
          {shareFeedback
            ? (lang === "np" ? "लिंक कपी भयो!" : "Link copied!")
            : (lang === "np" ? "सेयर गर्नुहोस्" : "Share")}
        </button>
      </div>
    </div>
  );
}
