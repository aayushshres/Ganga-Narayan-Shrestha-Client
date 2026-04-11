import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { Book, Translatable } from "../types";
import { t } from "../types";
import { fetchBooks } from "../api/index";
import BookCover from "./BookCover";

const pageTitle: Translatable = { en: "All Published Books", np: "सबै प्रकाशित पुस्तकहरू" };

export default function AllBooks() {
  const { lang, theme } = useAppContext();
  const navigate = useNavigate();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks()
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="detail-page">
      <button onClick={() => navigate(-1)} className="detail-page__back">←</button>
      <h1 className="detail-page__title">{t(pageTitle, lang)}</h1>

      <div className="media-grid latest-list--full">
        {loading ? (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            {lang === "np" ? "लोड हुँदैछ..." : "Loading..."}
          </p>
        ) : books.length === 0 ? (
          <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            {lang === "np" ? "हाल कुनै पुस्तक उपलब्ध छैन।" : "No books available yet."}
          </p>
        ) : (
          books.map((entry) => {
            const yearDisplay =
              lang === "np"
                ? `${entry.yearBs} बि.सं.`
                : `${entry.yearBs} BS`;

            return (
              <Link
                key={entry._id}
                to={`/books/${entry._id}`}
                className="book-card horizontal-card--list"
                style={{ display: "block", textDecoration: "none" }}
              >
                <div className="book-card__cover">
                  <BookCover titleNp={entry.titleNp} theme={theme} coverImage={entry.coverImage} />
                </div>
                <h4 className="book-card__title" style={{ marginTop: "1rem" }}>{entry.titleNp}</h4>
                <p className="book-card__type">{entry.typeEn}</p>
                <p className="book-card__year">{yearDisplay}</p>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
