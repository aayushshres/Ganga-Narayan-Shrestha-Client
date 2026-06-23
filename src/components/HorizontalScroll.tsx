import { useRef, useState, useEffect } from "react";
import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { IconChevronLeft, IconChevronRight } from "./icons";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasAnimated = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  // Vertical centre for the scroll arrows. When the cards lead with a media
  // element (thumbnail / cover) we centre on that instead of the whole card,
  // so the arrows don't drift down into the caption. null ⇒ default 50%.
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  const update = () => {
    const el = containerRef.current;
    const wrap = wrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    // use a 2px buffer for rounding errors
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);

    const firstCard = el.firstElementChild as HTMLElement | null;
    const media = firstCard?.firstElementChild as HTMLElement | null;
    if (wrap && media && media.offsetHeight > 60) {
      const r = media.getBoundingClientRect();
      setArrowTop(r.top - wrap.getBoundingClientRect().top + r.height / 2);
    } else {
      setArrowTop(null);
    }
  };

  useEffect(() => {
    update();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  useEffect(() => {
    if (!hasAnimated.current && containerRef.current) {
      hasAnimated.current = true;
      const el = containerRef.current;
      setTimeout(() => {
        el.scrollBy({ left: 40, behavior: 'smooth' });
        setTimeout(() => el.scrollBy({ left: -40, behavior: 'smooth' }), 400);
      }, 800);
    }
  }, []);

  const slideLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const slideRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  const startDragging = (e: ReactMouseEvent<HTMLDivElement>) => {
    isDown.current = true;
    if (containerRef.current) {
      containerRef.current.classList.add("dragging");
      startX.current = e.pageX - containerRef.current.offsetLeft;
      scrollLeft.current = containerRef.current.scrollLeft;
    }
  };

  const stopDragging = () => {
    isDown.current = false;
    if (containerRef.current) {
      containerRef.current.classList.remove("dragging");
    }
  };

  const onDrag = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!isDown.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="horizontal-scroll-wrapper" ref={wrapperRef}>
      {canScrollLeft && (
        <div className="scroll-fade-left" />
      )}
      {canScrollRight && (
        <div className="scroll-fade-right" />
      )}
      
      {canScrollLeft && (
        <button
          className="scroll-arrow scroll-arrow-left"
          onClick={slideLeft}
          aria-label="Scroll left"
          style={arrowTop != null ? { top: `${arrowTop}px` } : undefined}
        >
          <IconChevronLeft />
        </button>
      )}
      
      {canScrollRight && (
        <button
          className="scroll-arrow scroll-arrow-right"
          onClick={slideRight}
          aria-label="Scroll right"
          style={arrowTop != null ? { top: `${arrowTop}px` } : undefined}
        >
          <IconChevronRight />
        </button>
      )}

      <div
        ref={containerRef}
        className={`horizontal-scroll ${className}`}
        onMouseDown={startDragging}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={onDrag}
        onScroll={update}
      >
        {children}
      </div>
    </div>
  );
}
