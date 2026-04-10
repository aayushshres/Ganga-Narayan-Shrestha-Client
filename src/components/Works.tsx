import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { fetchArticles, fetchBooks, fetchSongs } from "../api/index";
import { extractYouTubeId } from "../utils/youtube";
import type { Article, Book, Song, Translatable } from "../types";
import { t } from "../types";
import HorizontalScroll from "./HorizontalScroll";
import YouTubeModal from "./YouTubeModal";

const sectionLabel: Translatable = { en: "Writing & Thought", np: "लेखन र विचार" };
const sectionTitle: Translatable = { en: "Writings", np: "लेखनहरू" };

const articlesLabel: Translatable = { en: "Articles & Literature", np: "लेख तथा साहित्य" };
const booksLabel: Translatable = { en: "Published Books", np: "प्रकाशित पुस्तकहरू" };
const songsLabel: Translatable = { en: "Songs", np: "गीतहरू" };

const viewAllArticles: Translatable = { en: "View All →", np: "सबै हेर्नुहोस् →" };
const viewAllBooks: Translatable = { en: "View All Books →", np: "सबै पुस्तकहरू हेर्नुहोस् →" };
const viewAllSongs: Translatable = { en: "View All Songs →", np: "सबै गीतहरू →" };

const categoryColorMap: Record<string, string> = {
  article: "latest-card__badge--article",
  literature: "latest-card__badge--literature",
};

const categoryLabelMap: Record<string, Translatable> = {
  article: { en: "Article", np: "लेख" },
  literature: { en: "Literature", np: "साहित्य" },
};

export default function Works() {
  const { lang, theme } = useAppContext();
  const headerRef = useScrollReveal<HTMLDivElement>();
  const articlesRef = useScrollReveal<HTMLDivElement>();
  const booksRef = useScrollReveal<HTMLDivElement>();
  const songsRef = useScrollReveal<HTMLDivElement>();

  const [articles, setArticles] = useState<Article[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles().then(setArticles).catch(console.error);
    fetchBooks().then(setBooks).catch(console.error);
    fetchSongs().then(setSongs).catch(console.error);
  }, []);

  return (
    <section className="section" id="writings">
      <div className="section-inner">
        <div className="section-header reveal" ref={headerRef}>
          <p className="section-label">{t(sectionLabel, lang)}</p>
          <h2 className="section-title">{t(sectionTitle, lang)}</h2>
          <hr className="section-rule" />
        </div>

        {/* Articles & Literature Subsection */}
        <div className="subsection reveal" ref={articlesRef}>
          <h3 className="subsection-title">{t(articlesLabel, lang)}</h3>
          <HorizontalScroll className="row-wrapper">
            {articles.length > 0 && articles.map((entry) => {
              const badge = t(categoryLabelMap[entry.category] ?? { en: entry.category, np: entry.category }, lang);
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

        {/* Published Books Subsection */}
        <div className="subsection reveal" ref={booksRef}>
          <h3 className="subsection-title">{t(booksLabel, lang)}</h3>
          <HorizontalScroll className="row-wrapper">
            {books.length > 0 && books.map((entry) => {
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
                  className="book-card horizontal-card"
                  draggable={false}
                >
                  <div className="book-card__cover">
                    <img src={svgURI} alt={entry.titleNp} draggable={false} />
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

        {/* Songs Subsection */}
        <div className="subsection reveal" ref={songsRef}>
          <h3 className="subsection-title">{t(songsLabel, lang)}</h3>
          <HorizontalScroll className="row-wrapper">
            {songs.length > 0 && songs.map((entry) => {
              const vid = extractYouTubeId(entry.youtubeId);
              const thumbUrl = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
              const thumbFallback = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
              return (
                <div key={entry._id} className="media-card horizontal-card">
                  <button
                    className="media-card__thumb-btn"
                    onClick={() => setActiveVideo(vid)}
                    aria-label={`Play: ${entry.title}`}
                  >
                    <img
                      draggable={false}
                      className="media-card__thumb"
                      src={thumbUrl}
                      alt={entry.title}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = thumbFallback; }}
                    />
                    <span className="media-card__play" aria-hidden="true">▶</span>
                  </button>
                  <div className="media-card__body">
                    <h4 className="media-card__title">{entry.title}</h4>
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
          <div className="row-footer">
            <Link to="/all-songs" className="row-link">
              {t(viewAllSongs, lang)}
            </Link>
          </div>
        </div>
      </div>

      {activeVideo && (
        <YouTubeModal
          youtubeId={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </section>
  );
}
