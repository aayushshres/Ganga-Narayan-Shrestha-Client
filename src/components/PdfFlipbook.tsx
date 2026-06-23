import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
// Rasterise each page wide enough to stay sharp when zoomed in. Only a few
// pages are ever rendered at once (current ± 1), so this stays cheap.
const RENDER_WIDTH = 2000;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

const touchDistance = (touches: TouchList) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

export default function PdfFlipbook({ url, title, onClose }: PdfFlipbookProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());

  const [numPages, setNumPages] = useState(0);
  const [current, setCurrent] = useState(0);
  const [pageUrls, setPageUrls] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(true);

  // Live mirrors for the native gesture/key listeners.
  const stateRef = useRef({ numPages, current, zoom, pan });
  stateRef.current = { numPages, current, zoom, pan };
  const urlsRef = useRef(pageUrls);
  urlsRef.current = pageUrls;

  const goTo = useCallback((n: number) => {
    const max = stateRef.current.numPages - 1;
    const next = Math.min(max, Math.max(0, n));
    setCurrent(next);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const renderPage = useCallback(async (n: number) => {
    if (n < 0 || n >= stateRef.current.numPages) return;
    if (urlsRef.current[n] || renderingRef.current.has(n) || !pdfRef.current) {
      return;
    }
    renderingRef.current.add(n);
    try {
      const page = await pdfRef.current.getPage(n + 1);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(RENDER_WIDTH / base.width, MAX_ZOOM);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setPageUrls((prev) => ({ ...prev, [n]: dataUrl }));
    } catch {
      /* a single page failing shouldn't kill the whole viewer */
    } finally {
      renderingRef.current.delete(n);
    }
  }, []);

  // Load the document once.
  useEffect(() => {
    let cancelled = false;
    const task = pdfjsLib.getDocument({ url });
    task.promise
      .then((pdf) => {
        if (cancelled) return;
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
      })
      .catch(() => {
        if (!cancelled) setError("PDF लोड गर्न सकिएन। कृपया पछि प्रयास गर्नुहोस्।");
      });
    return () => {
      cancelled = true;
      // Destroying the loading task tears down the document + worker transport.
      task.destroy();
      pdfRef.current = null;
    };
  }, [url]);

  // Render the current page and its immediate neighbours.
  useEffect(() => {
    if (!numPages) return;
    renderPage(current);
    renderPage(current + 1);
    renderPage(current - 1);
  }, [current, numPages, renderPage]);

  // Keyboard: ← / → flip, ↑ / ↓ pan when zoomed, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        goTo(stateRef.current.current - 1);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        goTo(stateRef.current.current + 1);
        e.preventDefault();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        if (stateRef.current.zoom > 1) {
          const d = e.key === "ArrowUp" ? 40 : -40;
          setPan((p) => ({ ...p, y: p.y + d }));
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goTo]);

  // Touch gestures: horizontal swipe to flip (at zoom 1), pinch to zoom,
  // one-finger pan while zoomed. No competing library, so this is simple.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const g = {
      mode: "none" as "none" | "swipe" | "pinch" | "pan",
      startX: 0,
      startY: 0,
      startDist: 0,
      startZoom: 1,
      startPanX: 0,
      startPanY: 0,
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        g.mode = "pinch";
        g.startDist = touchDistance(e.touches);
        g.startZoom = stateRef.current.zoom;
      } else if (e.touches.length === 1) {
        if (stateRef.current.zoom > 1) {
          g.mode = "pan";
          g.startX = e.touches[0].clientX;
          g.startY = e.touches[0].clientY;
          g.startPanX = stateRef.current.pan.x;
          g.startPanY = stateRef.current.pan.y;
        } else {
          g.mode = "swipe";
          g.startX = e.touches[0].clientX;
          setAnimating(false);
        }
      }
    };

    const onMove = (e: TouchEvent) => {
      if (g.mode === "pinch" && e.touches.length >= 2) {
        const ratio = touchDistance(e.touches) / g.startDist;
        const z = clampZoom(g.startZoom * ratio);
        setZoom(z);
        if (z === 1) setPan({ x: 0, y: 0 });
      } else if (g.mode === "pan" && e.touches.length === 1) {
        setPan({
          x: g.startPanX + (e.touches[0].clientX - g.startX),
          y: g.startPanY + (e.touches[0].clientY - g.startY),
        });
      } else if (g.mode === "swipe" && e.touches.length === 1) {
        setDragX(e.touches[0].clientX - g.startX);
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (g.mode === "swipe") {
        const width = el.clientWidth || 1;
        const dx = e.changedTouches[0].clientX - g.startX;
        setAnimating(true);
        setDragX(0);
        if (Math.abs(dx) > width * 0.18) {
          goTo(stateRef.current.current + (dx < 0 ? 1 : -1));
        }
      }
      if (e.touches.length === 0) g.mode = "none";
    };

    // touch-action:none (set in CSS) lets us own the gestures without
    // needing preventDefault on passive listeners.
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [goTo]);

  const setZoomTo = (next: number) => {
    const z = clampZoom(next);
    setZoom(z);
    if (z === 1) setPan({ x: 0, y: 0 });
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
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
    width: "44px",
    height: "40px",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontSize: "1.2rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <button onClick={onClose} style={closeBtnStyle} aria-label="बन्द गर्नुहोस्">
        ✕
      </button>

      {error ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p style={{ color: "white", textAlign: "center", maxWidth: "420px" }}>
            {error}
          </p>
        </div>
      ) : !numPages ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          पृष्ठहरू लोड हुँदैछ...
        </div>
      ) : (
        <>
          <div
            ref={viewportRef}
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              width: "100%",
              maxWidth: "900px",
              overflow: "hidden",
              touchAction: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "100%",
                transform: `translateX(calc(${-current * 100}% + ${dragX}px))`,
                transition: animating ? "transform 0.3s ease" : "none",
              }}
            >
              {Array.from({ length: numPages }).map((_, i) => {
                const near = Math.abs(i - current) <= 1;
                return (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 100%",
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform:
                          i === current
                            ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                            : "none",
                        transition: "transform 0.08s linear",
                        willChange: "transform",
                      }}
                    >
                      {near && pageUrls[i] ? (
                        <img
                          src={pageUrls[i]}
                          alt={`${i + 1}`}
                          draggable={false}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
                            userSelect: "none",
                          }}
                        />
                      ) : near ? (
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>…</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginTop: "1rem",
              color: "white",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <button
              style={{ ...controlBtnStyle, opacity: zoom <= MIN_ZOOM ? 0.4 : 1 }}
              onClick={() => setZoomTo(zoom - 0.5)}
              disabled={zoom <= MIN_ZOOM}
              aria-label="सानो बनाउनुहोस्"
              title="Zoom out"
            >
              −
            </button>
            <button
              style={{ ...controlBtnStyle, opacity: current === 0 ? 0.4 : 1 }}
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              aria-label="अघिल्लो पृष्ठ"
            >
              ←
            </button>
            <span style={{ minWidth: "72px", textAlign: "center" }}>
              {current + 1} / {numPages}
            </span>
            <button
              style={{
                ...controlBtnStyle,
                opacity: current >= numPages - 1 ? 0.4 : 1,
              }}
              onClick={() => goTo(current + 1)}
              disabled={current >= numPages - 1}
              aria-label="अर्को पृष्ठ"
            >
              →
            </button>
            <button
              style={{ ...controlBtnStyle, opacity: zoom >= MAX_ZOOM ? 0.4 : 1 }}
              onClick={() => setZoomTo(zoom + 0.5)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="ठूलो बनाउनुहोस्"
              title="Zoom in"
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}
