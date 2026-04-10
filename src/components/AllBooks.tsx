import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { Book, Translatable } from "../types";
import { t } from "../types";
import { fetchBooks } from "../api/index";

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

            const svgColor = theme === "dark" ? "#6B0F0F" : "#8B1A1A";
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="320">
              <rect width="100%" height="100%" fill="${svgColor}" />
              <text x="50%" y="50%" fill="white" font-family="'Tiro Devanagari', serif" font-size="20" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${entry.titleNp}</text>
            </svg>`;
            const svgURI = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

            return (
              <Link
                key={entry._id}
                to={`/books/${entry._id}`}
                className="book-card horizontal-card--list"
                style={{ display: "block", textDecoration: "none" }}
              >
                <div className="book-card__cover">
                  <img src={svgURI} alt={entry.titleNp} />
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
