import { useState, useEffect, lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useSmartBack } from "../hooks/useSmartBack";
import { useAppContext } from "../context/AppContext";
import { fetchBook } from "../api/index";
import { usePageMeta } from "../hooks/usePageMeta";
import type { PageMeta } from "../hooks/usePageMeta";
import type { Book } from "../types";
import BookCover from "./BookCover";
import { IconArrowLeft, IconBook, IconDownload } from "./icons";
import ShareButton from "./ShareButton";

const PdfFlipbook = lazy(() => import("./PdfFlipbook"));

const API_URL = import.meta.env.VITE_API_URL as string;

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, theme } = useAppContext();
  const goBack = useSmartBack("/all-books");

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageMeta, setPageMeta] = useState<PageMeta | null>(null);
  const [showFlipbook, setShowFlipbook] = useState(false);
  const [dlHover, setDlHover] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    setPageMeta(null);
    fetchBook(id)
      .then((data) => {
        setBook(data);
        document.title = data.titleNp;
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    return () => {
      document.title = "गंगानारायण श्रेष्ठ — Ganga Narayan Shrestha";
    };
  }, [id]);

  useEffect(() => {
    if (!id || !book) return;
    fetch(`${API_URL}/meta/book/${id}`)
      .then((r) => r.json())
      .then((data: PageMeta) => setPageMeta(data))
      .catch(() => {
        /* non-critical */
      });
  }, [id, book]);

  usePageMeta(pageMeta);

  const handleDownload = async () => {
    if (!book?.pdfUrl) return;
    try {
      const res = await fetch(book.pdfUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${book.titleNp}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fallback: let the browser handle it directly.
      window.open(book.pdfUrl, "_blank", "noopener");
    }
  };

  if (loading) {
    return (
      <div className="detail-page">
        <button
          onClick={goBack}
          className="detail-page__back"
          aria-label="back"
        >
          <IconArrowLeft />
        </button>
        <p
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          {lang === "np" ? "लोड हुँदैछ..." : "Loading..."}
        </p>
      </div>
    );
  }

  if (notFound || !book) {
    return (
      <div className="detail-page">
        <button
          onClick={goBack}
          className="detail-page__back"
          aria-label="back"
        >
          <IconArrowLeft />
        </button>
        <h1 className="detail-page__title">
          {lang === "np" ? "पृष्ठ भेटिएन" : "Page Not Found"}
        </h1>
      </div>
    );
  }

  const yearDisplay =
    lang === "np" ? `${book.yearBs} वि.सं.` : `${book.yearBs} BS`;

  return (
    <div className="detail-page">
      <button
        onClick={goBack}
        className="detail-page__back"
        aria-label="back"
      >
        <IconArrowLeft />
      </button>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        <div style={{ width: "180px", height: "260px" }}>
          <BookCover
            titleNp={book.titleNp}
            theme={theme}
            coverImage={book.coverImage}
          />
        </div>
      </div>
      <h1 className="detail-page__title">{book.titleNp}</h1>
      <p className="detail-page__subtitle">{book.typeEn}</p>
      <p
        style={{
          textAlign: "center",
          marginTop: "1rem",
          color: "var(--text-muted)",
        }}
      >
        {yearDisplay}
      </p>

      {book.pdfUrl ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "1.5rem",
            }}
          >
            <button
              onClick={() => setShowFlipbook(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--crimson)",
                color: "white",
                border: "none",
                padding: "0.75rem 2rem",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "1.05rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              }}
            >
              <IconBook size={18} />
              {lang === "np" ? "पुस्तक पढ्नुहोस्" : "Read Book"}
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <ShareButton title={book.titleNp} lang={lang} iconOnly tooltipPosition="bottom" />
            <button
              onClick={handleDownload}
              onMouseEnter={() => setDlHover(true)}
              onMouseLeave={() => setDlHover(false)}
              title={lang === "np" ? "डाउनलोड" : "Download"}
              aria-label={lang === "np" ? "डाउनलोड" : "Download"}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                background: dlHover ? "var(--crimson)" : "transparent",
                color: dlHover ? "white" : "var(--crimson)",
                border: "1px solid var(--crimson)",
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              <IconDownload size={18} />
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "2rem",
          }}
        >
          <ShareButton title={book.titleNp} lang={lang} iconOnly />
        </div>
      )}

      {showFlipbook && book.pdfUrl && (
        <Suspense fallback={null}>
          <PdfFlipbook
            url={book.pdfUrl}
            title={book.titleNp}
            onClose={() => setShowFlipbook(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
