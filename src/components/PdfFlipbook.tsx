import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

const touchDistance = (touches: TouchList) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

export default function PdfFlipbook({ url, title, onClose }: PdfFlipbookProps) {
  const flipBook = useRef<FlipBookRef | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Coarse pointer ⇒ touch device. Used to lighten the flip animation.
  const [isMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
  );

  const ready = pages.length > 0 && loaded >= total && total > 0;

  // Mirror zoom/pan into refs so the native gesture listeners read live values.
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const panRef = useRef(pan);
  panRef.current = pan;

  const setZoomTo = (next: number) => {
    const z = clampZoom(next);
    setZoom(z);
    if (z === 1) setPan({ x: 0, y: 0 });
  };

  // Stable handlers + page elements so zoom/pan re-renders don't churn
  // react-pageflip's internals (which would re-run updateFromHtml each frame).
  const handleInit = useCallback(
    () => flipBook.current?.pageFlip()?.flip(0),
    [],
  );
  const handleFlip = useCallback(
    (e: { data: number }) => setCurrentPage(e.data),
    [],
  );
  const pageElements = useMemo(
    () =>
      pages.map((src, i) => (
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
            alt={`${i + 1}`}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>
      )),
    [pages],
  );

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
    // Cap the device-pixel-ratio so we don't render needlessly huge bitmaps,
    // which is the main cause of janky flips on mobile.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    (async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        setTotal(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          // Render roughly at the on-screen page size × dpr, capped to keep
          // canvases small enough to flip smoothly on low-end devices.
          let scale = (PAGE_WIDTH * dpr) / base.width;
          if (base.width * scale > 1100) scale = 1100 / base.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          rendered.push(canvas.toDataURL("image/jpeg", 0.82));
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

  // Pinch-to-zoom and one-finger pan (while zoomed) on touch devices.
  // Listeners run in the capture phase so they can intercept gestures before
  // react-pageflip's own touch handling, while leaving single-finger swipes at
  // zoom = 1 untouched so page-flipping still works.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || !ready) return;

    const gesture = {
      mode: "none" as "none" | "pinch" | "pan",
      startDist: 0,
      startZoom: 1,
      startX: 0,
      startY: 0,
      startPanX: 0,
      startPanY: 0,
    };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        gesture.mode = "pinch";
        gesture.startDist = touchDistance(e.touches);
        gesture.startZoom = zoomRef.current;
        e.preventDefault();
        e.stopPropagation();
      } else if (e.touches.length === 1 && zoomRef.current > 1) {
        gesture.mode = "pan";
        gesture.startX = e.touches[0].clientX;
        gesture.startY = e.touches[0].clientY;
        gesture.startPanX = panRef.current.x;
        gesture.startPanY = panRef.current.y;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onMove = (e: TouchEvent) => {
      if (gesture.mode === "pinch" && e.touches.length >= 2) {
        const ratio = touchDistance(e.touches) / gesture.startDist;
        setZoomTo(gesture.startZoom * ratio);
        e.preventDefault();
        e.stopPropagation();
      } else if (gesture.mode === "pan" && e.touches.length === 1) {
        setPan({
          x: gesture.startPanX + (e.touches[0].clientX - gesture.startX),
          y: gesture.startPanY + (e.touches[0].clientY - gesture.startY),
        });
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) gesture.mode = "none";
    };

    el.addEventListener("touchstart", onStart, { capture: true, passive: false });
    el.addEventListener("touchmove", onMove, { capture: true, passive: false });
    el.addEventListener("touchend", onEnd, { capture: true });
    return () => {
      el.removeEventListener("touchstart", onStart, { capture: true });
      el.removeEventListener("touchmove", onMove, { capture: true });
      el.removeEventListener("touchend", onEnd, { capture: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <div
            ref={viewportRef}
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              touchAction: zoom > 1 ? "none" : "pan-y",
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: "transform 0.05s linear",
                willChange: "transform",
              }}
            >
              {/* @ts-expect-error react-pageflip's typings mark every setting as required */}
              <HTMLFlipBook
                ref={flipBook}
                width={PAGE_WIDTH}
                height={PAGE_HEIGHT}
                showCover={true}
                mobileScrollSupport={true}
                drawShadow={!isMobile}
                flippingTime={isMobile ? 450 : 700}
                maxShadowOpacity={0.5}
                useMouseEvents={zoom === 1}
                startPage={0}
                onInit={handleInit}
                onFlip={handleFlip}
              >
                {pageElements}
              </HTMLFlipBook>
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
              style={controlBtnStyle}
              onClick={() => flipBook.current?.pageFlip()?.flipPrev()}
              aria-label="अघिल्लो पृष्ठ"
            >
              ←
            </button>
            <span style={{ minWidth: "72px", textAlign: "center" }}>
              {currentPage + 1} / {pages.length}
            </span>
            <button
              style={controlBtnStyle}
              onClick={() => flipBook.current?.pageFlip()?.flipNext()}
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
