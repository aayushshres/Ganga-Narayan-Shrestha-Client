import type { Lang } from "../types";

/** "Friday, April 10, 2026 · 2:30 PM"  /  "शुक्रबार, अप्रिल १०, २०२६, दोपहर २:३०" */
export function formatPostDate(isoString: string, lang: Lang): string {
  const date = new Date(isoString);
  const locale = lang === "np" ? "ne-NP" : "en-US";
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
