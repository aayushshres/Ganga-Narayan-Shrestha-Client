import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { fetchSongs } from "../api/index";
import { extractYouTubeId } from "../utils/youtube";
import type { Song, Translatable } from "../types";
import { t } from "../types";
import HorizontalScroll from "./HorizontalScroll";
import YouTubeModal from "./YouTubeModal";

const songsLabel: Translatable = { en: "Songs", np: "गीतहरू" };
const viewAllSongs: Translatable = { en: "View All Songs →", np: "सबै गीतहरू →" };

const SKELETON_COUNT = 4;

function SongSkeleton() {
  return (
    <div className="media-card horizontal-card">
      <div
        style={{
          width: "100%",
          paddingBottom: "56.25%",
          background: "var(--border-color)",
          borderRadius: "4px",
          position: "relative",
        }}
      />
      <div className="media-card__body">
        <div style={{ width: "80%", height: "14px", borderRadius: "4px", background: "var(--border-color)" }} />
      </div>
    </div>
  );
}

export default function SongsSection() {
  const { lang } = useAppContext();
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs().then(setSongs).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="subsection reveal" ref={sectionRef}>
      <h3 className="subsection-title">{t(songsLabel, lang)}</h3>
      {!loading && songs.length === 0 && (
        <p style={{ color: "var(--text-muted)", padding: "1rem 0" }}>
          {lang === "np" ? "हाल कुनै गीत उपलब्ध छैन।" : "No songs available yet."}
        </p>
      )}
      <HorizontalScroll className="row-wrapper">
        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SongSkeleton key={i} />)
          : songs.map((entry) => {
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
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = thumbFallback;
                      }}
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
      {activeVideo && (
        <YouTubeModal youtubeId={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
