import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import * as pdfjsLib from "pdfjs-dist";

// Point pdf.js at its worker. Vite bundles the worker via the import.meta.url URL.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfFlipbookProps {
  url: string;
  title: string;
  onClose: () => void;
}

// Minimal shape of the imperative handle exposed by react-pageflip's ref.
interface PageFlipApi {
  flip: (page: number) => void;
  flipNext: () => void;
  flipPrev: () => void;
}
interface FlipBookRef {
  pageFlip: () => PageFlipApi;
}

const PAGE_WIDTH = 420;
const PAGE_HEIGHT = 560;
const RENDER_SCALE = 1.5;

export default function PdfFlipbook({ url, title, onClose }: PdfFlipbookProps) {
  const flipBook = useRef<FlipBookRef | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const ready = pages.length > 0 && loaded >= total && total > 0;

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Render every PDF page to an offscreen canvas, collect data URLs.
  useEffect(() => {
    let cancelled = false;
    const rendered: string[] = [];

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        setTotal(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: RENDER_SCALE });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          rendered.push(canvas.toDataURL("image/jpeg", 0.85));
          if (cancelled) return;
          setLoaded(i);
        }

        if (!cancelled) setPages(rendered);
      } catch {
        if (!cancelled) {
          setError("PDF लोड गर्न सकिएन। कृपया पछि प्रयास गर्नुहोस्।");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // Once pages are mounted in the flipbook, start at the first page.
  useEffect(() => {
    if (ready) {
      flipBook.current?.pageFlip().flip(0);
    }
  }, [ready]);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  };

  const closeBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    fontSize: "1.3rem",
    cursor: "pointer",
    lineHeight: 1,
    zIndex: 1001,
  };

  const controlBtnStyle: React.CSSProperties = {
    background: "var(--crimson)",
    color: "white",
    border: "none",
    padding: "0.5rem 1.2rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontSize: "1rem",
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <button onClick={onClose} style={closeBtnStyle} aria-label="बन्द गर्नुहोस्">
        ✕
      </button>

      {error ? (
        <p style={{ color: "white", textAlign: "center", maxWidth: "420px" }}>
          {error}
        </p>
      ) : !ready ? (
        <div style={{ color: "white", textAlign: "center", width: "320px" }}>
          <p style={{ marginBottom: "0.75rem" }}>
            पृष्ठहरू लोड हुँदैछ... {loaded}/{total || "?"}
          </p>
          <div
            style={{
              height: "8px",
              width: "100%",
              background: "rgba(255,255,255,0.2)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: total ? `${(loaded / total) * 100}%` : "0%",
                background: "var(--crimson)",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* @ts-expect-error react-pageflip's typings mark every setting as required */}
          <HTMLFlipBook
            ref={flipBook}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            showCover={true}
            mobileScrollSupport={true}
            drawShadow={true}
            flippingTime={700}
            maxShadowOpacity={0.5}
            onFlip={(e: { data: number }) => setCurrentPage(e.data)}
          >
            {pages.map((src, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={src}
                  alt={`पृष्ठ ${i + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>
            ))}
          </HTMLFlipBook>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginTop: "1.25rem",
              color: "white",
            }}
          >
            <button
              style={controlBtnStyle}
              onClick={() => flipBook.current?.pageFlip().flipPrev()}
            >
              ← अघिल्लो
            </button>
            <span style={{ minWidth: "120px", textAlign: "center" }}>
              पृष्ठ {currentPage + 1} / {pages.length}
            </span>
            <button
              style={controlBtnStyle}
              onClick={() => flipBook.current?.pageFlip().flipNext()}
            >
              अर्को →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
