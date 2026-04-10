import { useEffect, useRef, useCallback } from "react";

interface YouTubeModalProps {
  youtubeId: string;
  onClose: () => void;
}

export default function YouTubeModal({ youtubeId, onClose }: YouTubeModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Focus trap: keep focus inside the modal
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    // Prevent background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Listen for Escape
    document.addEventListener("keydown", handleKeyDown);

    // Auto-focus close button
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="yt-modal" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="yt-modal__container">
        <button
          className="yt-modal__close"
          ref={closeRef}
          onClick={onClose}
          aria-label="Close video"
        >
          ✕
        </button>
        <div className="yt-modal__aspect">
          <iframe
            className="yt-modal__iframe"
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
