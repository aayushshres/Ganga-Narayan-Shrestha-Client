import type { Translatable } from "../types";

export const categoryColorMap: Record<string, string> = {
  article: "latest-card__badge--article",
  literature: "latest-card__badge--literature",
};

export const categoryLabelMap: Record<string, Translatable> = {
  article: { en: "Article", np: "लेख" },
  literature: { en: "Literature", np: "साहित्य" },
};
