import { useNavigate, useLocation } from "react-router-dom";

// Back navigation that survives direct landings (shared links, new tab, refresh).
// If the user reached this page by navigating within the app, go back in
// history; otherwise there's nothing useful to go back to, so go to a sensible
// parent page instead of leaving the site.
export function useSmartBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    // The very first entry of a session has key "default" (no in-app history).
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };
}
