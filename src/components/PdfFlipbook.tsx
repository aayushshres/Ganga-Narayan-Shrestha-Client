import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const RENDER_WIDTH = 2000; // full page raster width (sharp when zoomed)
const THUMB_WIDTH = 150; // thumbnail raster width
const TWO_PAGE_MIN_WIDTH = 820; // viewport width to switch to a two-page spread

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

const touchDistance = (touches: TouchList) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

// Group page indices into spreads. Cover sits alone; the rest pair up.
function buildSpreads(numPages: number, twoPage: boolean): number[][] {
  if (numPages <= 0) return [];
  if (!twoPage) return Array.from({ length: numPages }, (_, i) => [i]);
  const spreads: number[][] = [[0]];
  for (let i = 1; i < numPages; i += 2) {
    spreads.push(i + 1 < numPages ? [i, i + 1] : [i]);
  }
  return spreads;
}

// ── Lazily-rendered thumbnail (renders only once scrolled near view) ──────────
function Thumb({
  index,
  url,
  active,
  onVisible,
  onClick,
}: {
  index: number;
  url?: string;
  active: boolean;
  onVisible: (i: number) => void;
  onClick: (i: number) => void;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          onVisible(index);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [index, onVisible]);

  return (
    <button
      ref={ref}
      onClick={() => onClick(index)}
      style={{
        flex: "0 0 auto",
        width: "70px",
        height: "96px",
        padding: 0,
        background: "rgba(255,255,255,0.08)",
        border: active
          ? "2px solid var(--crimson)"
          : "1px solid rgba(255,255,255,0.2)",
        borderRadius: "3px",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
      }}
      aria-label={`पृष्ठ ${index + 1}`}
    >
      {url ? (
        <img
          src={url}
          alt={`${index + 1}`}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          fontSize: "0.7rem",
          padding: "0 4px",
        }}
      >
        {index + 1}
      </span>
    </button>
  );
}

export default function PdfFlipbook({ url, title, onClose }: PdfFlipbookProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());
  const thumbRenderingRef = useRef<Set<number>>(new Set());
  const anchorPageRef = useRef(0);

  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pageUrls, setPageUrls] = useState<Record<number, string>>({});
  const [thumbUrls, setThumbUrls] = useState<Record<number, string>>({});

  const [twoPage, setTwoPage] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth >= TWO_PAGE_MIN_WIDTH,
  );
  const [spreadIdx, setSpreadIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [showThumbs, setShowThumbs] = useState(false);
  const [jumpStr, setJumpStr] = useState("1");

  const spreads = useMemo(
    () => buildSpreads(numPages, twoPage),
    [numPages, twoPage],
  );

  const stateRef = useRef({ spreadIdx, spreadsLen: spreads.length, zoom, pan });
  stateRef.current = { spreadIdx, spreadsLen: spreads.length, zoom, pan };
  const urlsRef = useRef(pageUrls);
  urlsRef.current = pageUrls;

  const goToSpread = useCallback((idx: number) => {
    const max = stateRef.current.spreadsLen - 1;
    const next = Math.min(max, Math.max(0, idx));
    setSpreadIdx(next);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const jumpToPage = useCallback(
    (page: number) => {
      const found = spreads.findIndex((sp) => sp.includes(page));
      if (found >= 0) goToSpread(found);
    },
    [spreads, goToSpread],
  );

  const renderPage = useCallback(async (n: number) => {
    if (n < 0 || !pdfRef.current || n >= pdfRef.current.numPages) return;
    if (urlsRef.current[n] || renderingRef.current.has(n)) return;
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
      /* a single page failing shouldn't kill the viewer */
    } finally {
      renderingRef.current.delete(n);
    }
  }, []);

  const renderThumb = useCallback(async (n: number) => {
    if (n < 0 || !pdfRef.current || n >= pdfRef.current.numPages) return;
    if (thumbRenderingRef.current.has(n)) return;
    thumbRenderingRef.current.add(n);
    try {
      const page = await pdfRef.current.getPage(n + 1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setThumbUrls((prev) => ({ ...prev, [n]: dataUrl }));
    } catch {
      /* ignore */
    } finally {
      thumbRenderingRef.current.delete(n);
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
      task.destroy();
      pdfRef.current = null;
    };
  }, [url]);

  // Switch one/two-page layout on resize, keeping the same page anchored.
  useEffect(() => {
    const onResize = () =>
      setTwoPage(window.innerWidth >= TWO_PAGE_MIN_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const anchor = anchorPageRef.current;
    const found = spreads.findIndex((sp) => sp.includes(anchor));
    if (found >= 0) setSpreadIdx(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twoPage]);

  // Keep the anchor page + jump input in sync with the current spread.
  useEffect(() => {
    const sp = spreads[spreadIdx];
    if (sp) {
      anchorPageRef.current = sp[0];
      setJumpStr(String(sp[0] + 1));
    }
  }, [spreadIdx, spreads]);

  // Render the current spread's pages and the immediate neighbours.
  useEffect(() => {
    if (!numPages) return;
    [spreadIdx - 1, spreadIdx, spreadIdx + 1].forEach((s) => {
      spreads[s]?.forEach((p) => renderPage(p));
    });
  }, [spreadIdx, spreads, numPages, renderPage]);

  // Keyboard: ← / → flip, ↑ / ↓ pan when zoomed, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        goToSpread(stateRef.current.spreadIdx - 1);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        goToSpread(stateRef.current.spreadIdx + 1);
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
  }, [onClose, goToSpread]);

  // Touch gestures: swipe to flip (zoom 1), pinch to zoom, one-finger pan zoomed.
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
        const z = clampZoom(g.startZoom * (touchDistance(e.touches) / g.startDist));
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
          goToSpread(stateRef.current.spreadIdx + (dx < 0 ? 1 : -1));
        }
      }
      if (e.touches.length === 0) g.mode = "none";
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [goToSpread]);

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
    minWidth: "44px",
    height: "40px",
    padding: "0 0.6rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
    fontSize: "1.2rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const cur = spreads[spreadIdx] ?? [0];

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <button onClick={onClose} style={closeBtnStyle} aria-label="बन्द गर्नुहोस्">
        ✕
      </button>

      {error ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
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
              maxWidth: twoPage ? "1100px" : "640px",
              overflow: "hidden",
              touchAction: "none",
              perspective: "2000px",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "100%",
                transform: `translateX(calc(${-spreadIdx * 100}% + ${dragX}px))`,
                transition: animating
                  ? "transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)"
                  : "none",
                transformStyle: "preserve-3d",
              }}
            >
              {spreads.map((sp, i) => {
                const offset = i - spreadIdx;
                const near = Math.abs(offset) <= 1;
                // Subtle "page turn" tilt: neighbours hinge away from centre.
                const rotateY = offset === 0 ? 0 : offset < 0 ? 22 : -22;
                const originX =
                  offset < 0 ? "right" : offset > 0 ? "left" : "center";
                return (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 100%",
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      transform: `rotateY(${rotateY}deg)`,
                      transformOrigin: `${originX} center`,
                      transition: animating
                        ? "transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)"
                        : "none",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        gap: "2px",
                        alignItems: "center",
                        justifyContent: "center",
                        transform:
                          offset === 0
                            ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
                            : "none",
                        transition: "transform 0.08s linear",
                        willChange: "transform",
                      }}
                    >
                      {sp.map((p) =>
                        near && pageUrls[p] ? (
                          <img
                            key={p}
                            src={pageUrls[p]}
                            alt={`${p + 1}`}
                            draggable={false}
                            style={{
                              maxWidth: sp.length === 2 ? "50%" : "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                              boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
                              userSelect: "none",
                            }}
                          />
                        ) : near ? (
                          <span key={p} style={{ color: "rgba(255,255,255,0.5)" }}>
                            …
                          </span>
                        ) : null,
                      )}
                    </div>
                    {/* depth shadow over turned (non-current) spreads */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        background: "rgba(0,0,0,0.55)",
                        opacity: offset === 0 ? 0 : 0.5,
                        transition: "opacity 0.4s ease",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {showThumbs && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                width: "100%",
                maxWidth: "1100px",
                padding: "0.6rem 0.2rem",
                marginTop: "0.5rem",
              }}
            >
              {Array.from({ length: numPages }).map((_, i) => (
                <Thumb
                  key={i}
                  index={i}
                  url={thumbUrls[i]}
                  active={cur.includes(i)}
                  onVisible={renderThumb}
                  onClick={(p) => {
                    jumpToPage(p);
                    setShowThumbs(false);
                  }}
                />
              ))}
            </div>
          )}

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
              style={{ ...controlBtnStyle, opacity: spreadIdx === 0 ? 0.4 : 1 }}
              onClick={() => goToSpread(spreadIdx - 1)}
              disabled={spreadIdx === 0}
              aria-label="अघिल्लो पृष्ठ"
            >
              ←
            </button>

            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              <input
                value={jumpStr}
                onChange={(e) => setJumpStr(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const p = parseInt(jumpStr, 10) - 1;
                    if (!Number.isNaN(p)) jumpToPage(Math.min(numPages - 1, Math.max(0, p)));
                  }
                }}
                onBlur={() => setJumpStr(String(cur[0] + 1))}
                inputMode="numeric"
                aria-label="पृष्ठ नम्बर"
                style={{
                  width: "3rem",
                  textAlign: "center",
                  padding: "0.3rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "0.95rem",
                }}
              />
              <span style={{ whiteSpace: "nowrap" }}>/ {numPages}</span>
            </span>

            <button
              style={{
                ...controlBtnStyle,
                opacity: spreadIdx >= spreads.length - 1 ? 0.4 : 1,
              }}
              onClick={() => goToSpread(spreadIdx + 1)}
              disabled={spreadIdx >= spreads.length - 1}
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
            <button
              style={{
                ...controlBtnStyle,
                fontSize: "1rem",
                background: showThumbs ? "#9c7b1f" : "var(--crimson)",
              }}
              onClick={() => setShowThumbs((s) => !s)}
              aria-label="पृष्ठहरूको सूची"
              title="Thumbnails"
            >
              ▦
            </button>
          </div>
        </>
      )}
    </div>
  );
}
