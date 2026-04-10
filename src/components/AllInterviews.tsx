import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { Interview, Translatable } from "../types";
import { t } from "../types";
import { fetchInterviews } from "../api/index";
import { extractYouTubeId } from "../utils/youtube";
import YouTubeModal from "./YouTubeModal";

const pageTitle: Translatable = { en: "All Interviews", np: "सबै अन्तर्वार्ताहरू" };

export default function AllInterviews() {
  const { lang } = useAppContext();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews()
      .then(setInterviews)
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
          interviews.map((entry) => {
            const vid = extractYouTubeId(entry.youtubeId);
            const thumbUrl = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
            const thumbFallback = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
            return (
              <div key={entry._id} className="media-card horizontal-card--list">
                <button
                  className="media-card__thumb-btn"
                  onClick={() => setActiveVideo(vid)}
                  aria-label={`Play: ${entry.title}`}
                >
                  <img
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
                  <p className="media-card__meta">{entry.channel}</p>
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
