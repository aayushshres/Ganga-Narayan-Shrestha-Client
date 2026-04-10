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

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ── Articles ──────────────────────────────────────────────
export function fetchArticles(params?: { category?: string; q?: string }): Promise<Article[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== "all") qs.set("category", params.category);
  if (params?.q) qs.set("q", params.q);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<Article[]>(`${BASE}/articles${query}`);
}

export function fetchArticle(id: string): Promise<Article> {
  return request<Article>(`${BASE}/articles/${id}`);
}

export function createArticle(data: ArticleFormData, token: string): Promise<Article> {
  return request<Article>(`${BASE}/articles`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateArticle(id: string, data: Partial<ArticleFormData>, token: string): Promise<Article> {
  return request<Article>(`${BASE}/articles/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function deleteArticle(id: string, token: string): Promise<void> {
  return request<void>(`${BASE}/articles/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Books ─────────────────────────────────────────────────
export function fetchBooks(): Promise<Book[]> {
  return request<Book[]>(`${BASE}/books`);
}

export function fetchBook(id: string): Promise<Book> {
  return request<Book>(`${BASE}/books/${id}`);
}

export function createBook(data: BookFormData, token: string): Promise<Book> {
  return request<Book>(`${BASE}/books`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateBook(id: string, data: Partial<BookFormData>, token: string): Promise<Book> {
  return request<Book>(`${BASE}/books/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function deleteBook(id: string, token: string): Promise<void> {
  return request<void>(`${BASE}/books/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Interviews ────────────────────────────────────────────
export function fetchInterviews(): Promise<Interview[]> {
  return request<Interview[]>(`${BASE}/interviews`);
}

export function fetchInterview(id: string): Promise<Interview> {
  return request<Interview>(`${BASE}/interviews/${id}`);
}

export function createInterview(data: InterviewFormData, token: string): Promise<Interview> {
  return request<Interview>(`${BASE}/interviews`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateInterview(id: string, data: Partial<InterviewFormData>, token: string): Promise<Interview> {
  return request<Interview>(`${BASE}/interviews/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function deleteInterview(id: string, token: string): Promise<void> {
  return request<void>(`${BASE}/interviews/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Songs ─────────────────────────────────────────────────
export function fetchSongs(): Promise<Song[]> {
  return request<Song[]>(`${BASE}/songs`);
}

export function fetchSong(id: string): Promise<Song> {
  return request<Song>(`${BASE}/songs/${id}`);
}

export function createSong(data: SongFormData, token: string): Promise<Song> {
  return request<Song>(`${BASE}/songs`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateSong(id: string, data: Partial<SongFormData>, token: string): Promise<Song> {
  return request<Song>(`${BASE}/songs/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export function deleteSong(id: string, token: string): Promise<void> {
  return request<void>(`${BASE}/songs/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Auth + Images ─────────────────────────────────────────
export async function login(username: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function uploadImage(formData: FormData, token: string): Promise<{ url: string }> {
  return request<{ url: string }>(`${BASE}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}
