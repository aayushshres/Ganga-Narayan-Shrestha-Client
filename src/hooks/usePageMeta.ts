import { useEffect } from "react";

export interface PageMeta {
  title: string;
  description: string;
  ogImageUrl: string;
  canonicalUrl: string;
}

const SITE_NAME = "गंगानारायण श्रेष्ठ";

export function usePageMeta(meta: PageMeta | null): void {
  useEffect(() => {
    if (!meta) return;
    const { title, description, ogImageUrl, canonicalUrl } = meta;

    // document.title is owned by the page component (it resets to the site name
    // on unmount). Setting it here too made the title stick on back navigation.

    const tagDefs = [
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: ogImageUrl },
      { property: "og:url", content: canonicalUrl },
      { property: "twitter:card", content: "summary_large_image" },
      { property: "twitter:title", content: title },
      { property: "twitter:description", content: description },
      { property: "twitter:image", content: ogImageUrl },
    ];

    const created: HTMLMetaElement[] = [];
    const updated: { el: HTMLMetaElement; prev: string }[] = [];

    for (const { property, content } of tagDefs) {
      const existing = document.querySelector<HTMLMetaElement>(
        `meta[property="${property}"]`,
      );
      if (existing) {
        updated.push({ el: existing, prev: existing.getAttribute("content") ?? "" });
        existing.setAttribute("content", content);
      } else {
        const el = document.createElement("meta");
        el.setAttribute("property", property);
        el.setAttribute("content", content);
        document.head.appendChild(el);
        created.push(el);
      }
    }

    return () => {
      for (const el of created) el.remove();
      for (const { el, prev } of updated) el.setAttribute("content", prev);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.title, meta?.description, meta?.ogImageUrl, meta?.canonicalUrl]);
}
