import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchBooks,
  createBook,
  updateBook,
  deleteBook,
  reorderBooks,
  uploadBookPdf,
  deleteBookPdf,
} from "../api/index";
import type { Book, BookFormData } from "../types";
import { inputStyle, labelStyle } from "../styles/admin";
import { ExpandableCell } from "./ExpandableCell";
import { uploadToImgbb } from "../lib/imgbb";

const coverPreviewStyle: React.CSSProperties = {
  width: "100px",
  height: "140px",
  objectFit: "cover",
  borderRadius: "4px",
  border: "1px solid var(--border-color)",
  marginTop: "0.75rem",
};

export default function BooksPage() {
  const { isAuthenticated } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [titleNp, setTitleNp] = useState("");
  const [typeEn, setTypeEn] = useState("");
  const [yearBs, setYearBs] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatus, setPdfStatus] = useState("");

  const [isReordering, setIsReordering] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BookFormData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [isRemovingPdf, setIsRemovingPdf] = useState(false);

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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleEditCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEditCoverFile(file);
    setEditCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleAdd = async () => {
    if (!isAuthenticated || !titleNp || !typeEn || !yearBs) return;
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    try {
      let coverImage: string | undefined;
      if (coverFile) {
        setIsUploading(true);
        coverImage = await uploadToImgbb(coverFile);
        setIsUploading(false);
      }

      const data: BookFormData = {
        titleNp,
        typeEn,
        yearBs,
        order: 0,
        ...(coverImage ? { coverImage } : {}),
      };

      const newBook = await createBook(data);

      if (pdfFile) {
        setPdfStatus("PDF अपलोड हुँदैछ...");
        await uploadBookPdf(newBook._id, pdfFile);
        setPdfStatus("");
      }

      setSubmitSuccess("पुस्तक सफलतापूर्वक थपियो!");
      setTitleNp("");
      setTypeEn("");
      setYearBs("");
      setCoverFile(null);
      setCoverPreview(null);
      setPdfFile(null);
      loadBooks();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err: unknown) {
      setIsUploading(false);
      setPdfStatus("");
      setSubmitError((err as Error).message || "PDF अपलोड गर्दा त्रुटि भयो");
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
      coverImage: b.coverImage,
      pdfUrl: b.pdfUrl,
    });
    setEditCoverFile(null);
    setEditCoverPreview(b.coverImage ?? null);
    setEditPdfFile(null);
  };

  const handleRemovePdf = async () => {
    if (!editId) return;
    if (!window.confirm("यो PDF हटाउने?")) return;
    setIsRemovingPdf(true);
    try {
      const updated = await deleteBookPdf(editId);
      setEditData((prev) => ({ ...prev, pdfUrl: undefined }));
      setBooks((prev) => prev.map((b) => (b._id === editId ? updated : b)));
    } catch (err: unknown) {
      alert((err as Error).message || "PDF हटाउँदा त्रुटि भयो");
    } finally {
      setIsRemovingPdf(false);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...books];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setBooks(next);
    setIsReordering(true);
    try {
      await reorderBooks(next.map((b) => b._id));
    } catch {
      setBooks(books); // revert on failure
    } finally {
      setIsReordering(false);
    }
  };

  const handleSave = async () => {
    if (!editId) return;
    setIsSaving(true);
    try {
      let updatedData = { ...editData };
      if (editCoverFile) {
        const coverImage = await uploadToImgbb(editCoverFile);
        updatedData = { ...updatedData, coverImage };
      }
      let updated = await updateBook(editId, updatedData);

      if (editPdfFile) {
        setPdfStatus("PDF अपलोड हुँदैछ...");
        updated = await uploadBookPdf(editId, editPdfFile);
        setPdfStatus("");
      }

      setBooks(books.map((b) => (b._id === editId ? updated : b)));
      setEditId(null);
      setEditCoverFile(null);
      setEditCoverPreview(null);
      setEditPdfFile(null);
    } catch (err: unknown) {
      setPdfStatus("");
      alert((err as Error).message || "PDF अपलोड गर्दा त्रुटि भयो");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.5rem" }}>
        नयाँ पुस्तक पोस्ट गर्नुहोस्
      </h2>

      <div className="admin-form-card">
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>शीर्षक</label>
          <input
            type="text"
            style={inputStyle}
            value={titleNp}
            onChange={(e) => setTitleNp(e.target.value)}
            placeholder="e.g. मेरो यात्रा"
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
          <label style={labelStyle}>पुस्तक कभर (ऐच्छिक)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            style={{ ...inputStyle, cursor: "pointer" }}
          />
          {coverPreview && (
            <img
              src={coverPreview}
              alt="Cover preview"
              style={coverPreviewStyle}
            />
          )}
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>पुस्तक PDF (ऐच्छिक)</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            style={{ ...inputStyle, cursor: "pointer" }}
          />
          {pdfFile && (
            <p style={{ marginTop: "0.5rem", color: "var(--text-muted)" }}>
              📄 {pdfFile.name}
            </p>
          )}
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          {pdfStatus && (
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              {pdfStatus}
            </p>
          )}
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
            disabled={isSubmitting || isUploading}
            style={{
              background: "var(--crimson)",
              color: "white",
              border: "none",
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              cursor: isSubmitting || isUploading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
            }}
          >
            {isUploading
              ? "अपलोड हुँदैछ..."
              : isSubmitting
                ? "थप्दैछ..."
                : "पोस्ट गर्नुहोस्"}
          </button>
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "1.5rem" }}>
        पुस्तकहरू
      </h2>

      {loading ? (
        <p>लोड हुँदैछ...</p>
      ) : (
        <div className="admin-table-wrap">
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
            {books.map((b, index) =>
              editId === b._id ? (
                <tr key={b._id}>
                  <td
                    colSpan={3}
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <div className="admin-form-grid">
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
                          placeholder="e.g. मेरो यात्रा"
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
                          placeholder="e.g. Poetry Collection"
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
                          placeholder="e.g. २०८०"
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>पुस्तक कभर (ऐच्छिक)</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleEditCoverChange}
                          style={{ ...inputStyle, cursor: "pointer" }}
                        />
                        {editCoverPreview && (
                          <img
                            src={editCoverPreview}
                            alt="Cover preview"
                            style={coverPreviewStyle}
                          />
                        )}
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>पुस्तक PDF</label>
                        {editData.pdfUrl ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <span style={{ color: "green" }}>📄 PDF अपलोड भएको छ</span>
                            <button
                              type="button"
                              onClick={handleRemovePdf}
                              disabled={isRemovingPdf}
                              style={{
                                padding: "0.3rem 0.8rem",
                                background: "#D32F2F",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: isRemovingPdf ? "not-allowed" : "pointer",
                                fontSize: "0.85rem",
                              }}
                            >
                              {isRemovingPdf ? "हट्दैछ..." : "PDF हटाउनुहोस्"}
                            </button>
                          </div>
                        ) : (
                          <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                            कुनै PDF छैन
                          </p>
                        )}
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => setEditPdfFile(e.target.files?.[0] ?? null)}
                          style={{ ...inputStyle, cursor: "pointer" }}
                        />
                        {editPdfFile && (
                          <p style={{ marginTop: "0.5rem", color: "var(--text-muted)" }}>
                            📄 {editPdfFile.name}{" "}
                            {editData.pdfUrl ? "(प्रतिस्थापन गरिनेछ)" : ""}
                          </p>
                        )}
                        {pdfStatus && (
                          <p style={{ marginTop: "0.5rem", color: "var(--text-muted)" }}>
                            {pdfStatus}
                          </p>
                        )}
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
                          onClick={() => {
                            setEditId(null);
                            setEditCoverFile(null);
                            setEditCoverPreview(null);
                            setEditPdfFile(null);
                          }}
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
                    <ExpandableCell text={b.titleNp} />
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    <ExpandableCell text={b.typeEn} />
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
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0 || isReordering || !!editId}
                      title="माथि सार्नुहोस्"
                      style={{
                        padding: "0.4rem 0.6rem",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        cursor: index === 0 || isReordering || !!editId ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        opacity: index === 0 ? 0.35 : 1,
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMove(index, "down")}
                      disabled={index === books.length - 1 || isReordering || !!editId}
                      title="तल सार्नुहोस्"
                      style={{
                        padding: "0.4rem 0.6rem",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        cursor: index === books.length - 1 || isReordering || !!editId ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        opacity: index === books.length - 1 ? 0.35 : 1,
                      }}
                    >
                      ↓
                    </button>
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
        </div>
      )}
    </div>
  );
}
