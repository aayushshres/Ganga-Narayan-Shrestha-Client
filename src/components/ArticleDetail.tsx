import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSmartBack } from "../hooks/useSmartBack";
import { useAppContext } from "../context/AppContext";
import { fetchArticle } from "../api/index";
import { formatPostDate } from "../utils/formatDate";
import { categoryColorMap, categoryLabelMap } from "../utils/article";
import { usePageMeta } from "../hooks/usePageMeta";
import type { PageMeta } from "../hooks/usePageMeta";
import DOMPurify from "dompurify";
import type { Article } from "../types";
import { IconArrowLeft } from "./icons";
import ShareButton from "./ShareButton";

const SITE_TITLE = "गंगानारायण श्रेष्ठ — Ganga Narayan Shrestha";
const API_URL = import.meta.env.VITE_API_URL as string;

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang } = useAppContext();
  const goBack = useSmartBack("/all-articles");

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setPageMeta(null);
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

  useEffect(() => {
    if (!id || !article) return;
    fetch(`${API_URL}/meta/article/${id}`)
      .then((r) => r.json())
      .then((data: PageMeta) => setPageMeta(data))
      .catch(() => { /* non-critical — OG tags just won't be injected */ });
  }, [id, article]);

  usePageMeta(pageMeta);

  if (loading) {
    return (
      <div className="detail-page">
        <button onClick={goBack} className="detail-page__back" aria-label="back"><IconArrowLeft /></button>
        <p style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          {lang === "np" ? "लोड हुँदैछ..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="detail-page">
        <button onClick={goBack} className="detail-page__back" aria-label="back"><IconArrowLeft /></button>
        <h1 className="detail-page__title">
          {lang === "np" ? "पृष्ठ भेटिएन" : "Page Not Found"}
        </h1>
      </div>
    );
  }

  const categoryLabel = categoryLabelMap[article.category] ?? { en: article.category, np: article.category };

  return (
    <div className="detail-page">
      <button onClick={goBack} className="detail-page__back" aria-label="back"><IconArrowLeft /></button>
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
      <div
        style={{
          marginTop: "3rem",
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid var(--border-light)",
          paddingTop: "2rem",
        }}
      >
        <ShareButton title={article.title} text={article.excerpt} lang={lang} iconOnly tooltipPosition="bottom" />
      </div>
    </div>
  );
}
