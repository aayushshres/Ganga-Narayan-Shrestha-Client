import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { fetchBook } from "../api/index";
import type { Book } from "../types";
import BookCover from "./BookCover";

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { lang, theme } = useAppContext();
  const navigate = useNavigate();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
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

  if (notFound || !book) {
    return (
      <div className="detail-page">
        <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
        <h1 className="detail-page__title">
          {lang === "np" ? "पृष्ठ भेटिएन" : "Page Not Found"}
        </h1>
      </div>
    );
  }

  const yearDisplay = lang === "np" ? `${book.yearBs} बि.सं.` : `${book.yearBs} BS`;

  return (
    <div className="detail-page">
      <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
        <div style={{ width: "180px", height: "260px" }}>
          <BookCover titleNp={book.titleNp} theme={theme} coverImage={book.coverImage} />
        </div>
      </div>
      <h1 className="detail-page__title">{book.titleNp}</h1>
      <p className="detail-page__subtitle">{book.typeEn}</p>
      <p style={{ textAlign: "center", marginTop: "1rem", color: "var(--text-muted)" }}>
        {yearDisplay}
      </p>
    </div>
  );
}
