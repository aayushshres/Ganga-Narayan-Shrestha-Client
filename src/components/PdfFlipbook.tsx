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
const ZOOM_PRESETS = [1, 1.25, 1.5, 2, 2.5, 3]; // 100% – 300%

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

// ── Icons (stroke = currentColor so they inherit button colour) ───────────────
const svgProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const IconChevronLeft = () => (
  <svg {...svgProps}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = () => (
  <svg {...svgProps}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconClose = () => (
  <svg {...svgProps}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconGrid = () => (
  <svg {...svgProps}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconOnePage = () => (
  <svg {...svgProps}>
    <rect x="7" y="4" width="10" height="16" rx="1.5" />
  </svg>
);
const IconTwoPage = () => (
  <svg {...svgProps}>
    <rect x="3" y="4" width="8" height="16" rx="1.5" />
    <rect x="13" y="4" width="8" height="16" rx="1.5" />
  </svg>
);

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

  const [autoWide, setAutoWide] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth >= TWO_PAGE_MIN_WIDTH,
  );
  // null = follow screen size; true/false = explicit user choice via the toggle.
  const [manualTwoPage, setManualTwoPage] = useState<boolean | null>(null);
  const twoPage = manualTwoPage ?? autoWide; // pages per spread
  const wide = autoWide; // real screen width → thumbnail placement

  const [spreadIdx, setSpreadIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  // Pan is applied imperatively (no re-render per move) for smoothness.
  const panValRef = useRef({ x: 0, y: 0 });
  const panLayerRef = useRef<HTMLDivElement | null>(null);
  const [dragX, setDragX] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [showThumbs, setShowThumbs] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [jumpStr, setJumpStr] = useState("1");

  const spreads = useMemo(
    () => buildSpreads(numPages, twoPage),
    [numPages, twoPage],
  );

  const stateRef = useRef({ spreadIdx, spreadsLen: spreads.length, zoom });
  stateRef.current = { spreadIdx, spreadsLen: spreads.length, zoom };
  const urlsRef = useRef(pageUrls);
  urlsRef.current = pageUrls;

  // Bound the pan so the page edges can't be dragged past the viewport edges
  // (no "infinite canvas"). Limit = half the overflow on each axis.
  const clampPanXY = useCallback((x: number, y: number) => {
    const vp = viewportRef.current;
    const el = panLayerRef.current;
    if (!vp || !el) return { x, y };
    const imgs = el.querySelectorAll("img");
    if (!imgs.length) return { x, y };
    let contentW = 0;
    let contentH = 0;
    imgs.forEach((img, i) => {
      const r = img.getBoundingClientRect();
      contentW += r.width + (i > 0 ? 2 : 0); // 2px flex gap between pages
      contentH = Math.max(contentH, r.height);
    });
    const maxX = Math.max(0, (contentW - vp.clientWidth) / 2);
    const maxY = Math.max(0, (contentH - vp.clientHeight) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  // Imperatively move the current page (no React re-render → smooth panning).
  const livePan = useCallback(
    (x: number, y: number) => {
      const c = clampPanXY(x, y);
      panValRef.current = c;
      const el = panLayerRef.current;
      if (el) el.style.transform = `translate(${c.x}px, ${c.y}px)`;
    },
    [clampPanXY],
  );
  const resetPan = useCallback(() => {
    panValRef.current = { x: 0, y: 0 };
    const el = panLayerRef.current;
    if (el) el.style.transform = "translate(0px, 0px)";
  }, []);

  const goToSpread = useCallback(
    (idx: number) => {
      const max = stateRef.current.spreadsLen - 1;
      const next = Math.min(max, Math.max(0, idx));
      setSpreadIdx(next);
      setZoom(1);
      resetPan();
    },
    [resetPan],
  );

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
      setAutoWide(window.innerWidth >= TWO_PAGE_MIN_WIDTH);
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
          livePan(panValRef.current.x, panValRef.current.y + d);
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goToSpread, livePan]);

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
          g.startPanX = panValRef.current.x;
          g.startPanY = panValRef.current.y;
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
        if (z === 1) resetPan();
      } else if (g.mode === "pan" && e.touches.length === 1) {
        livePan(
          g.startPanX + (e.touches[0].clientX - g.startX),
          g.startPanY + (e.touches[0].clientY - g.startY),
        );
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
    // numPages so listeners (re)attach once the viewport actually mounts.
  }, [goToSpread, numPages, livePan, resetPan]);

  // Trackpad: ctrl+wheel (pinch) zooms; two-finger scroll pans while zoomed.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const z = clampZoom(stateRef.current.zoom - e.deltaY * 0.012);
        setZoom(z);
        if (z === 1) resetPan();
        return;
      }
      if (stateRef.current.zoom > 1) {
        e.preventDefault();
        livePan(
          panValRef.current.x - e.deltaX,
          panValRef.current.y - e.deltaY,
        );
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [numPages, livePan, resetPan]);

  // Re-clamp the pan whenever the zoom changes (zooming out shrinks the bounds).
  useEffect(() => {
    livePan(panValRef.current.x, panValRef.current.y);
  }, [zoom, livePan]);

  // System font so the page-number input and the "/ N" label match.
  const numFont = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

  const applyZoom = (z: number) => {
    const zz = clampZoom(z);
    setZoom(zz);
    if (zz === 1) resetPan();
    setShowZoomMenu(false);
  };

  // When zoomed, give the page the whole screen and float the controls on top.
  const zoomed = zoom > 1;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: zoomed ? 0 : "1rem",
  };

  const closeBtnStyle: React.CSSProperties = {
    position: "fixed",
    top: "1rem",
    right: "1rem",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(4px)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "42px",
    height: "42px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    zIndex: 1002,
  };

  const controlBtnStyle: React.CSSProperties = {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "var(--crimson)",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
  };

  const cur = spreads[spreadIdx] ?? [0];

  const thumbItems = Array.from({ length: numPages }).map((_, i) => (
    <Thumb
      key={i}
      index={i}
      url={thumbUrls[i]}
      active={cur.includes(i)}
      onVisible={renderThumb}
      onClick={(p) => jumpToPage(p)}
    />
  ));

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <button onClick={onClose} style={closeBtnStyle} aria-label="बन्द गर्नुहोस्">
        <IconClose />
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
            style={{
              flex: "1 1 auto",
              minHeight: 0,
              width: "100%",
              maxWidth: zoomed ? "none" : wide ? "1260px" : "640px",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              alignItems: "stretch",
            }}
          >
            {wide && showThumbs && (
              <div
                style={{
                  flex: "0 0 auto",
                  width: "104px",
                  height: "100%",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  paddingRight: "4px",
                }}
              >
                {thumbItems}
              </div>
            )}
            <div
              ref={viewportRef}
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                minWidth: 0,
                maxWidth: zoomed ? "none" : twoPage ? "1100px" : "640px",
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
                      ref={offset === 0 ? panLayerRef : null}
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        gap: "2px",
                        alignItems: "center",
                        justifyContent: "center",
                        // Pan only — zoom is applied to the image layout size
                        // (below) so the browser resamples from the hi-res
                        // source instead of upscaling a small rasterised layer.
                        // Updated imperatively during gestures; no transition
                        // so the page tracks the pointer 1:1.
                        transform:
                          offset === 0
                            ? `translate(${panValRef.current.x}px, ${panValRef.current.y}px)`
                            : "none",
                        willChange: "transform",
                      }}
                    >
                      {sp.map((p) => {
                        const z = offset === 0 ? zoom : 1;
                        const wPct = (sp.length === 2 ? 50 : 100) * z;
                        return near && pageUrls[p] ? (
                          <img
                            key={p}
                            src={pageUrls[p]}
                            alt={`${p + 1}`}
                            draggable={false}
                            style={{
                              maxWidth: `${wPct}%`,
                              maxHeight: `${100 * z}%`,
                              boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
                              userSelect: "none",
                            }}
                          />
                        ) : near ? (
                          <span key={p} style={{ color: "rgba(255,255,255,0.5)" }}>
                            …
                          </span>
                        ) : null;
                      })}
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
          </div>

          {!wide && showThumbs && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                width: "100%",
                maxWidth: "640px",
                padding: "0.6rem 0.2rem",
                marginTop: "0.5rem",
              }}
            >
              {thumbItems}
            </div>
          )}

          <div
            style={
              zoomed
                ? {
                    position: "absolute",
                    bottom: "1rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    color: "white",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    zIndex: 1001,
                    background: "rgba(0,0,0,0.55)",
                    padding: "0.5rem 0.9rem",
                    borderRadius: "999px",
                    backdropFilter: "blur(4px)",
                  }
                : {
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    marginTop: "1rem",
                    color: "white",
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }
            }
          >
            <button
              style={{
                ...controlBtnStyle,
                opacity: spreadIdx === 0 ? 0.4 : 1,
                cursor: spreadIdx === 0 ? "default" : "pointer",
              }}
              onClick={() => goToSpread(spreadIdx - 1)}
              disabled={spreadIdx === 0}
              aria-label="अघिल्लो पृष्ठ"
            >
              <IconChevronLeft />
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
                  height: "44px",
                  textAlign: "center",
                  padding: "0 0.3rem",
                  borderRadius: "22px",
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "0.95rem",
                  fontFamily: numFont,
                }}
              />
              <span style={{ whiteSpace: "nowrap", fontFamily: numFont, fontSize: "0.95rem" }}>
                / {numPages}
              </span>
            </span>

            <button
              style={{
                ...controlBtnStyle,
                opacity: spreadIdx >= spreads.length - 1 ? 0.4 : 1,
                cursor: spreadIdx >= spreads.length - 1 ? "default" : "pointer",
              }}
              onClick={() => goToSpread(spreadIdx + 1)}
              disabled={spreadIdx >= spreads.length - 1}
              aria-label="अर्को पृष्ठ"
            >
              <IconChevronRight />
            </button>
            <button
              style={controlBtnStyle}
              onClick={() => setManualTwoPage(!twoPage)}
              aria-label="एक वा दुई पाना"
              title={twoPage ? "एक पाना देखाउनुहोस्" : "दुई पाना देखाउनुहोस्"}
            >
              {twoPage ? <IconOnePage /> : <IconTwoPage />}
            </button>
            <button
              style={{
                ...controlBtnStyle,
                background: showThumbs ? "#9c7b1f" : "var(--crimson)",
              }}
              onClick={() => setShowThumbs((s) => !s)}
              aria-label="पृष्ठहरूको सूची"
              title="Thumbnails"
            >
              <IconGrid />
            </button>

            {/* Zoom level: shows %, click for a preset menu (100% = reset). */}
            <div style={{ position: "relative", display: "inline-flex" }}>
              <button
                style={{
                  ...controlBtnStyle,
                  width: "auto",
                  minWidth: "62px",
                  padding: "0 0.7rem",
                  borderRadius: "22px",
                  fontFamily: numFont,
                  fontSize: "0.9rem",
                }}
                onClick={() => setShowZoomMenu((s) => !s)}
                aria-label="जुम स्तर"
                title="Zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              {showZoomMenu && (
                <>
                  <div
                    onClick={() => setShowZoomMenu(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 1001 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "rgba(20,20,20,0.97)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                      padding: "4px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      zIndex: 1002,
                      boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
                    }}
                  >
                    {ZOOM_PRESETS.map((z) => (
                      <button
                        key={z}
                        onClick={() => applyZoom(z)}
                        style={{
                          background:
                            Math.abs(zoom - z) < 0.001
                              ? "var(--crimson)"
                              : "transparent",
                          color: "white",
                          border: "none",
                          borderRadius: "5px",
                          padding: "0.4rem 1.2rem",
                          cursor: "pointer",
                          fontFamily: numFont,
                          fontSize: "0.9rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
