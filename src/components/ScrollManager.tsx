import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Scroll handling on navigation:
// - Back/forward (POP): do nothing — the browser restores the exact previous
//   scroll position (it waits for layout, so it lands correctly). With the
//   global `scroll-behavior: smooth` removed, that restore is now instant.
// - New navigation with a hash: smooth-scroll to that section.
// - New navigation without a hash: jump to the top.
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === "POP") return;

    if (hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
        else window.scrollTo(0, 0);
      });
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, hash, navType]);

  return null;
}
