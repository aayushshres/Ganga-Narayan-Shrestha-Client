import { useEffect } from "react";

// Injects a <script type="application/ld+json"> structured-data block while the
// component is mounted and removes it on unmount. Search engines use this for
// rich results (article bylines, breadcrumbs, etc.). Pass null to inject nothing.
export function useJsonLd(data: object | null): void {
  useEffect(() => {
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [data]);
}
