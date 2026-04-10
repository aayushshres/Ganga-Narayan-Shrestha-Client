import { useRef, useState, useEffect } from "react";
import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasAnimated = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // use a 2px buffer for rounding errors
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
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
    <div className="horizontal-scroll-wrapper">
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
        >
          ‹
        </button>
      )}
      
      {canScrollRight && (
        <button 
          className="scroll-arrow scroll-arrow-right" 
          onClick={slideRight}
          aria-label="Scroll right"
        >
          ›
        </button>
      )}

      <div
        ref={containerRef}
        className={`horizontal-scroll ${className}`}
        onMouseDown={startDragging}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={onDrag}
        onScroll={checkScroll}
      >
        {children}
      </div>
    </div>
  );
}
