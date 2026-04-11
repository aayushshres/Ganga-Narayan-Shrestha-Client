import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { fetchBooks } from "../api/index";
import type { Book, Translatable } from "../types";
import { t } from "../types";
import HorizontalScroll from "./HorizontalScroll";
import BookCover from "./BookCover";

const booksLabel: Translatable = { en: "Published Books", np: "प्रकाशित पुस्तकहरू" };
const viewAllBooks: Translatable = { en: "View All Books →", np: "सबै पुस्तकहरू हेर्नुहोस् →" };

const SKELETON_COUNT = 4;

function BookSkeleton() {
  return (
    <div className="book-card horizontal-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div
        className="book-card__cover"
        style={{ width: "140px", height: "200px", background: "var(--border-color)", borderRadius: "4px" }}
      />
      <div style={{ width: "80%", height: "14px", borderRadius: "4px", background: "var(--border-color)" }} />
      <div style={{ width: "60%", height: "12px", borderRadius: "4px", background: "var(--border-light)" }} />
    </div>
  );
}

export default function BooksSection() {
  const { lang, theme } = useAppContext();
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks().then(setBooks).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="subsection reveal" ref={sectionRef}>
      <h3 className="subsection-title">{t(booksLabel, lang)}</h3>
      {!loading && books.length === 0 && (
        <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
          {lang === "np" ? "हाल कुनै पुस्तक उपलब्ध छैन।" : "No books available yet."}
        </p>
      )}
      <HorizontalScroll className="row-wrapper">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <BookSkeleton key={i} />)
          : books.map((entry) => {
              const yearDisplay = lang === "np" ? `${entry.yearBs} बि.सं.` : `${entry.yearBs} BS`;
              return (
                <Link
                  key={entry._id}
                  to={`/books/${entry._id}`}
                  className="book-card horizontal-card"
                  draggable={false}
                >
                  <div className="book-card__cover">
                    <BookCover titleNp={entry.titleNp} theme={theme} coverImage={entry.coverImage} />
                  </div>
                  <h4 className="book-card__title">{entry.titleNp}</h4>
                  <p className="book-card__type">{entry.typeEn}</p>
                  <p className="book-card__year">{yearDisplay}</p>
                </Link>
              );
            })}
      </HorizontalScroll>
      <div className="row-footer">
        <Link to="/all-books" className="row-link">
          {t(viewAllBooks, lang)}
        </Link>
      </div>
    </div>
  );
}
