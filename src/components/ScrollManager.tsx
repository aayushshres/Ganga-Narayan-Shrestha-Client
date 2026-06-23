import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// Scroll handling on navigation:
// - Back/forward (POP): do nothing — let the browser restore the previous
//   scroll position (so you return to the section you came from, with no
//   "scroll from the top" animation).
// - New navigation (PUSH/REPLACE) with a hash: smooth-scroll to that section.
// - New navigation without a hash: jump to the top instantly (bypassing the
//   global `scroll-behavior: smooth` so pages don't animate-scroll on open).
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType === "POP") return;

    if (hash) {
      requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }, [pathname, hash, navType]);

  return null;
}
