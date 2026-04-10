import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { Song, Translatable } from "../types";
import { t } from "../types";
import { fetchSongs } from "../api/index";
import YouTubeModal from "./YouTubeModal";

const pageTitle: Translatable = { en: "All Songs", np: "सबै गीतहरू" };

export default function AllSongs() {
  const { lang } = useAppContext();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const navigate = useNavigate();

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
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
        ) : (
          songs.map((entry) => {
            const thumbUrl = `https://img.youtube.com/vi/${entry.youtubeId}/hqdefault.jpg`;
            return (
              <div key={entry._id} className="media-card horizontal-card--list">
                <button
                  className="media-card__thumb-btn"
                  onClick={() => setActiveVideo(entry.youtubeId)}
                  aria-label={`Play: ${entry.title}`}
                >
                  <img
                    className="media-card__thumb"
                    src={thumbUrl}
                    alt={entry.title}
                    loading="lazy"
                  />
                  <span className="media-card__play" aria-hidden="true">▶</span>
                </button>
                <div className="media-card__body">
                  <h4 className="media-card__title">{entry.title}</h4>
                </div>
              </div>
            );
          })
        )}
      </div>

      {activeVideo && (
        <YouTubeModal
          youtubeId={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}
