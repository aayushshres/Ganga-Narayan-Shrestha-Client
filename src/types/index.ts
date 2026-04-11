// ── Theme & Language ──────────────────────────────────────
export type Theme = "light" | "dark";
export type Lang = "en" | "np";

// ── Translatable string shape ─────────────────────────────
export interface Translatable {
  en: string;
  np: string;
}

/** Return the correct string for the active language. */
export function t(entry: Translatable, lang: Lang): string {
  return entry[lang];
}

// ── Timeline ──────────────────────────────────────────────
export interface TimelineEntry {
  id: number;
  heading: Translatable;
  description: Translatable;
}

// ── App Context ───────────────────────────────────────────
export interface AppContextType {
  theme: Theme;
  lang: Lang;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
}

// ── MongoDB-backed content types ──────────────────────────
export interface Article {
  _id: string;
  title: string;
  category: "article" | "literature";
  excerpt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  _id: string;
  titleNp: string;
  typeEn: string;
  yearBs: string;
  order: number;
  coverImage?: string;
}

export interface Interview {
  _id: string;
  title: string;
  channel: string;
  youtubeId: string;
  order: number;
}

export interface Song {
  _id: string;
  title: string;
  youtubeId: string;
  order: number;
}

export type ArticleFormData = Omit<Article, "_id" | "createdAt" | "updatedAt">;
export type BookFormData = Omit<Book, "_id">;
export type InterviewFormData = Omit<Interview, "_id">;
export type SongFormData = Omit<Song, "_id">;
