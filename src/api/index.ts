import type {
  Article,
  ArticleFormData,
  Book,
  BookFormData,
  Interview,
  InterviewFormData,
  Song,
  SongFormData,
} from "../types";

const BASE = import.meta.env.VITE_API_URL || "/api";

let _token: string | null = null;
export function setToken(t: string | null): void {
  _token = t;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const authHeaders: Record<string, string> = _token
    ? { Authorization: `Bearer ${_token}` }
    : {};
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: { ...authHeaders, ...(options?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || `Request failed: ${res.status}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const json = (body: unknown): RequestInit => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// ── Articles ──────────────────────────────────────────────
export function fetchArticles(params?: {
  category?: string;
  q?: string;
}): Promise<Article[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== "all")
    qs.set("category", params.category);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<Article[]>(`${BASE}/articles${query}`);
}

export function fetchArticle(id: string): Promise<Article> {
  return request<Article>(`${BASE}/articles/${id}`);
}

export function createArticle(data: ArticleFormData): Promise<Article> {
  return request<Article>(`${BASE}/articles`, {
    method: "POST",
    ...json(data),
  });
}

export function updateArticle(
  id: string,
  data: Partial<ArticleFormData>,
): Promise<Article> {
  return request<Article>(`${BASE}/articles/${id}`, {
    method: "PUT",
    ...json(data),
  });
}

export function deleteArticle(id: string): Promise<void> {
  return request<void>(`${BASE}/articles/${id}`, { method: "DELETE" });
}

// ── Books ─────────────────────────────────────────────────
export function fetchBooks(): Promise<Book[]> {
  return request<Book[]>(`${BASE}/books`);
}

export function fetchBook(id: string): Promise<Book> {
  return request<Book>(`${BASE}/books/${id}`);
}

export function createBook(data: BookFormData): Promise<Book> {
  return request<Book>(`${BASE}/books`, { method: "POST", ...json(data) });
}

export function updateBook(
  id: string,
  data: Partial<BookFormData>,
): Promise<Book> {
  return request<Book>(`${BASE}/books/${id}`, { method: "PUT", ...json(data) });
}

export function deleteBook(id: string): Promise<void> {
  return request<void>(`${BASE}/books/${id}`, { method: "DELETE" });
}

// ── Interviews ────────────────────────────────────────────
export function fetchInterviews(): Promise<Interview[]> {
  return request<Interview[]>(`${BASE}/interviews`);
}

export function fetchInterview(id: string): Promise<Interview> {
  return request<Interview>(`${BASE}/interviews/${id}`);
}

export function createInterview(data: InterviewFormData): Promise<Interview> {
  return request<Interview>(`${BASE}/interviews`, {
    method: "POST",
    ...json(data),
  });
}

export function updateInterview(
  id: string,
  data: Partial<InterviewFormData>,
): Promise<Interview> {
  return request<Interview>(`${BASE}/interviews/${id}`, {
    method: "PUT",
    ...json(data),
  });
}

export function deleteInterview(id: string): Promise<void> {
  return request<void>(`${BASE}/interviews/${id}`, { method: "DELETE" });
}

// ── Songs ─────────────────────────────────────────────────
export function fetchSongs(): Promise<Song[]> {
  return request<Song[]>(`${BASE}/songs`);
}

export function fetchSong(id: string): Promise<Song> {
  return request<Song>(`${BASE}/songs/${id}`);
}

export function createSong(data: SongFormData): Promise<Song> {
  return request<Song>(`${BASE}/songs`, { method: "POST", ...json(data) });
}

export function updateSong(
  id: string,
  data: Partial<SongFormData>,
): Promise<Song> {
  return request<Song>(`${BASE}/songs/${id}`, { method: "PUT", ...json(data) });
}

export function deleteSong(id: string): Promise<void> {
  return request<void>(`${BASE}/songs/${id}`, { method: "DELETE" });
}

// ── Auth ──────────────────────────────────────────────────
export function login(
  username: string,
  password: string,
): Promise<{ username: string; token: string }> {
  return request<{ username: string; token: string }>(`${BASE}/auth/login`, {
    method: "POST",
    ...json({ username, password }),
  });
}

export function logout(): Promise<void> {
  return request<void>(`${BASE}/auth/logout`, { method: "POST" });
}

export function getMe(): Promise<{ username: string }> {
  return request<{ username: string }>(`${BASE}/auth/me`);
}

export function uploadImage(formData: FormData): Promise<{ url: string }> {
  return request<{ url: string }>(`${BASE}/upload/image`, {
    method: "POST",
    body: formData,
  });
}
