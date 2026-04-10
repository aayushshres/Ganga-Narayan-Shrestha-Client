import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchBooks, createBook, updateBook, deleteBook } from "../api/index";
import type { Book, BookFormData } from "../types";
import { inputStyle, labelStyle } from "../styles/admin";

export default function BooksPage() {
  const { isAuthenticated } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [titleNp, setTitleNp] = useState("");
  const [typeEn, setTypeEn] = useState("Poetry Collection");
  const [yearBs, setYearBs] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BookFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadBooks = () => {
    setLoading(true);
    fetchBooks()
      .then(setBooks)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleAdd = async () => {
    if (!isAuthenticated || !titleNp || !typeEn || !yearBs) return;
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    const data: BookFormData = { titleNp, typeEn, yearBs, order: 0 };
    try {
      await createBook(data);
      setSubmitSuccess("पुस्तक सफलतापूर्वक थपियो!");
      setTitleNp("");
      setTypeEn("Poetry Collection");
      setYearBs("");
      loadBooks();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("यो पुस्तक मेट्ने?")) return;
    try {
      await deleteBook(id);
      setBooks(books.filter((b) => b._id !== id));
    } catch (err: unknown) {
      alert((err as Error).message || "Unknown error");
    }
  };

  const startEdit = (b: Book) => {
    setEditId(b._id);
    setEditData({
      titleNp: b.titleNp,
      typeEn: b.typeEn,
      yearBs: b.yearBs,
      order: b.order,
    });
  };

  const handleSave = async () => {
    if (!editId) return;
    setIsSaving(true);
    try {
      const updated = await updateBook(editId, editData);
      setBooks(books.map((b) => (b._id === editId ? updated : b)));
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
        नयाँ पुस्तक पोस्ट गर्नुहोस्
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
            value={titleNp}
            onChange={(e) => setTitleNp(e.target.value)}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>प्रकार</label>
          <input
            type="text"
            style={inputStyle}
            value={typeEn}
            onChange={(e) => setTypeEn(e.target.value)}
            placeholder="e.g. Poetry Collection"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>वर्ष (बि.सं.)</label>
          <input
            type="text"
            style={inputStyle}
            value={yearBs}
            onChange={(e) => setYearBs(e.target.value)}
            placeholder="e.g. २०८०"
          />
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
            disabled={isSubmitting}
            style={{
              background: "var(--crimson)",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
            }}
          >
            {isSubmitting ? "थप्दैछ..." : "पोस्ट गर्नुहोस्"}
          </button>
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.5rem" }}>
        पुस्तकहरू
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
                प्रकार
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
            {books.map((b) =>
              editId === b._id ? (
                <tr key={b._id}>
                  <td
                    colSpan={3}
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
                          value={editData.titleNp ?? ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              titleNp: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>प्रकार</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editData.typeEn ?? ""}
                          onChange={(e) =>
                            setEditData({ ...editData, typeEn: e.target.value })
                          }
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>वर्ष (बि.सं.)</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editData.yearBs ?? ""}
                          onChange={(e) =>
                            setEditData({ ...editData, yearBs: e.target.value })
                          }
                        />
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
                <tr key={b._id}>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                      fontFamily: "var(--font-devanagari)",
                    }}
                  >
                    {b.titleNp}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    {b.typeEn}
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
                      onClick={() => startEdit(b)}
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
                      onClick={() => handleDelete(b._id)}
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
            {books.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{ padding: "2rem", textAlign: "center" }}
                >
                  कुनै पुस्तक भेटिएन।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
