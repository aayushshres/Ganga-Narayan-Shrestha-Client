import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import RichTextEditor from "./RichTextEditor";
import {
  fetchArticles,
  fetchArticle,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../api/index";
import type { Article, ArticleFormData } from "../types";
import { inputStyle, labelStyle } from "../styles/admin";

export default function ArticlesPage() {
  const { isAuthenticated } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"article" | "literature">("article");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<"article" | "literature">(
    "article",
  );
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadArticles = () => {
    setLoading(true);
    fetchArticles()
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleAdd = async () => {
    if (!isAuthenticated || !title || !excerpt || !content) return;
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    const data: ArticleFormData = { title, category, excerpt, content };
    try {
      await createArticle(data);
      setSubmitSuccess("लेख सफलतापूर्वक सिर्जना गरियो!");
      setTitle("");
      setCategory("article");
      setExcerpt("");
      setContent("");
      loadArticles();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("यो लेख मेट्ने?")) return;
    try {
      await deleteArticle(id);
      setArticles(articles.filter((a) => a._id !== id));
    } catch (err: unknown) {
      alert((err as Error).message || "Unknown error");
    }
  };

  const startEdit = async (a: Article) => {
    const full = await fetchArticle(a._id).catch(() => a);
    setEditId(full._id);
    setEditTitle(full.title);
    setEditCategory(full.category);
    setEditExcerpt(full.excerpt);
    setEditContent(full.content);
  };

  const handleSave = async () => {
    if (!editId) return;
    setIsSaving(true);
    try {
      const updated = await updateArticle(editId, {
        title: editTitle,
        category: editCategory,
        excerpt: editExcerpt,
        content: editContent,
      });
      setArticles(articles.map((a) => (a._id === editId ? updated : a)));
      setEditId(null);
    } catch (err: unknown) {
      alert((err as Error).message || "Unknown error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.5rem" }}>
        नयाँ लेख पोस्ट गर्नुहोस्
      </h2>

      <div
        style={{
          background: "var(--bg-card)",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          marginBottom: "3rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
        }}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>शीर्षक</label>
          <input
            type="text"
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label style={labelStyle}>श्रेणी</label>
          <select
            style={inputStyle}
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as "article" | "literature")
            }
          >
            <option value="article">लेख</option>
            <option value="literature">साहित्य</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>सारांश</label>
          <textarea
            style={{ ...inputStyle, height: "80px", resize: "vertical" }}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>सामग्री</label>
          <RichTextEditor content={content} onChange={setContent} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          {submitSuccess && (
            <p style={{ color: "green", marginBottom: "1rem" }}>
              {submitSuccess}
            </p>
          )}
          {submitError && (
            <p style={{ color: "#D32F2F", marginBottom: "1rem" }}>
              {submitError}
            </p>
          )}
          <button
            onClick={handleAdd}
            disabled={isSubmitting || !title || !excerpt || !content}
            style={{
              background: "var(--crimson)",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              cursor:
                isSubmitting || !title || !excerpt || !content
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
            }}
          >
            {isSubmitting ? "थप्दैछ..." : "पोस्ट गर्नुहोस्"}
          </button>
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.5rem" }}>
        लेखहरू व्यवस्थापन
      </h2>

      {loading ? (
        <p>लोड हुँदैछ...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead
            style={{ background: "var(--bg-secondary)", textAlign: "left" }}
          >
            <tr>
              <th
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                शीर्षक
              </th>
              <th
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                श्रेणी
              </th>
              <th
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                मिति
              </th>
              <th
                style={{
                  padding: "1rem",
                  borderBottom: "1px solid var(--border-color)",
                  textAlign: "right",
                }}
              >
                कार्यहरू
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) =>
              editId === a._id ? (
                <tr key={a._id}>
                  <td
                    colSpan={4}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                      }}
                    >
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>शीर्षक</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>श्रेणी</label>
                        <select
                          style={inputStyle}
                          value={editCategory}
                          onChange={(e) =>
                            setEditCategory(
                              e.target.value as "article" | "literature",
                            )
                          }
                        >
                          <option value="article">लेख</option>
                          <option value="literature">साहित्य</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>सारांश</label>
                        <textarea
                          style={{
                            ...inputStyle,
                            height: "60px",
                            resize: "vertical",
                          }}
                          value={editExcerpt}
                          onChange={(e) => setEditExcerpt(e.target.value)}
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>सामग्री</label>
                        <RichTextEditor content={editContent} onChange={setEditContent} />
                      </div>
                      <div
                        style={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          gap: "0.5rem",
                        }}
                      >
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          style={{
                            padding: "0.5rem 1.2rem",
                            background: "var(--crimson)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isSaving ? "not-allowed" : "pointer",
                          }}
                        >
                          {isSaving ? "..." : "सुरक्षित गर्नुहोस्"}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          style={{
                            padding: "0.5rem 1.2rem",
                            background: "var(--bg-secondary)",
                            color: "var(--text-primary)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          रद्द गर्नुहोस्
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={a._id}>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    {a.title}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <span
                      style={{
                        background: "var(--crimson)",
                        color: "white",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                      }}
                    >
                      {a.category === "article" ? "लेख" : "साहित्य"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                      textAlign: "right",
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => startEdit(a)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      सम्पादन गर्नुहोस्
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "#D32F2F",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                      }}
                    >
                      डिलिट
                    </button>
                  </td>
                </tr>
              ),
            )}
            {articles.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{ padding: "2rem", textAlign: "center" }}
                >
                  कुनै लेख भेटिएन।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
