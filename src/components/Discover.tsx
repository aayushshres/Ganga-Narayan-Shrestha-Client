import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { fetchInterviews } from "../api/index";
import type { Interview, Translatable } from "../types";
import { t } from "../types";
import HorizontalScroll from "./HorizontalScroll";
import YouTubeModal from "./YouTubeModal";

const sectionTitle: Translatable = { en: "Interviews", np: "अन्तर्वार्ताहरू" };

const viewAllInterviews: Translatable = { en: "View All Interviews →", np: "सबै अन्तर्वार्ता →" };

export default function Discover() {
  const { lang } = useAppContext();
  const headerRef = useScrollReveal<HTMLDivElement>();
  const interviewsRef = useScrollReveal<HTMLDivElement>();

  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    fetchInterviews().then(setInterviews).catch(console.error);
  }, []);

  const handleOpenModal = (e: React.MouseEvent, youtubeId: string) => {
    e.preventDefault();
    setActiveVideo(youtubeId);
  };

  return (
    <section className="section" id="interviews">
      <div className="section-inner">
        <div className="section-header reveal" ref={headerRef}>
          <p className="section-label">{t(sectionTitle, lang)}</p>
          <h2 className="section-title">{t(sectionTitle, lang)}</h2>
          <hr className="section-rule" />
        </div>

        {/* Interviews Subsection */}
        <div className="subsection reveal" ref={interviewsRef}>
          <h3 className="subsection-title">{t(sectionTitle, lang)}</h3>
          <HorizontalScroll className="row-wrapper">
            {interviews.length > 0 && interviews.map((entry) => {
              const thumbUrl = `https://img.youtube.com/vi/${entry.youtubeId}/hqdefault.jpg`;
              return (
                <div key={entry._id} className="media-card horizontal-card">
                  <button
                    className="media-card__thumb-btn"
                    onClick={(e) => handleOpenModal(e, entry.youtubeId)}
                    aria-label={`Play: ${entry.title}`}
                  >
                    <img
                      draggable={false}
                      className="media-card__thumb"
                      src={thumbUrl}
                      alt={entry.title}
                      loading="lazy"
                    />
                    <span className="media-card__play" aria-hidden="true">▶</span>
                  </button>
                  <div className="media-card__body">
                    <h4 className="media-card__title">{entry.title}</h4>
                    <p className="media-card__meta">{entry.channel}</p>
                  </div>
                </div>
              );
            })}
          </HorizontalScroll>
          <div className="row-footer">
            <Link to="/all-interviews" className="row-link">
              {t(viewAllInterviews, lang)}
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
