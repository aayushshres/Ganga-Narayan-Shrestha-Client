import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  reorderInterviews,
} from "../api/index";
import type { Interview, InterviewFormData } from "../types";
import { inputStyle, labelStyle } from "../styles/admin";

export default function InterviewsPage() {
  const { isAuthenticated } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState("");
  const [youtubeId, setYoutubeId] = useState("");

  const [isReordering, setIsReordering] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<InterviewFormData>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadInterviews = () => {
    setLoading(true);
    fetchInterviews()
      .then(setInterviews)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleAdd = async () => {
    if (!isAuthenticated || !title || !channel || !youtubeId) return;
    setSubmitError("");
    setSubmitSuccess("");
    setIsSubmitting(true);

    const data: InterviewFormData = { title, channel, youtubeId, order: 0 };
    try {
      await createInterview(data);
      setSubmitSuccess("अन्तर्वार्ता सफलतापूर्वक थपियो!");
      setTitle("");
      setChannel("");
      setYoutubeId("");
      loadInterviews();
      setTimeout(() => setSubmitSuccess(""), 3000);
    } catch (err: unknown) {
      setSubmitError((err as Error).message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("यो अन्तर्वार्ता मेट्ने?")) return;
    try {
      await deleteInterview(id);
      setInterviews(interviews.filter((i) => i._id !== id));
    } catch (err: unknown) {
      alert((err as Error).message || "Unknown error");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const next = [...interviews];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setInterviews(next);
    setIsReordering(true);
    try {
      await reorderInterviews(next.map((i) => i._id));
    } catch {
      setInterviews(interviews);
    } finally {
      setIsReordering(false);
    }
  };

  const startEdit = (i: Interview) => {
    setEditId(i._id);
    setEditData({
      title: i.title,
      channel: i.channel,
      youtubeId: i.youtubeId,
      order: i.order,
    });
  };

  const handleSave = async () => {
    if (!editId) return;
    setIsSaving(true);
    try {
      const updated = await updateInterview(editId, editData);
      setInterviews(interviews.map((i) => (i._id === editId ? updated : i)));
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
        नयाँ अन्तर्वार्ता पोस्ट गर्नुहोस्
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
            placeholder="e.g. राजनीतिक परिस्थितिबारे अन्तर्वार्ता"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>च्यानल</label>
          <input
            type="text"
            style={inputStyle}
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="e.g. Himalaya TV"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>YouTube ID</label>
          <input
            type="text"
            style={inputStyle}
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
            placeholder="e.g. dQw4w9WgXcQ"
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
        अन्तर्वार्ताहरू
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
                च्यानल
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
            {interviews.map((i, index) =>
              editId === i._id ? (
                <tr key={i._id}>
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
                          value={editData.title ?? ""}
                          onChange={(e) =>
                            setEditData({ ...editData, title: e.target.value })
                          }
                          placeholder="e.g. राजनीतिक परिस्थितिबारे अन्तर्वार्ता"
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>च्यानल</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editData.channel ?? ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              channel: e.target.value,
                            })
                          }
                          placeholder="e.g. Himalaya TV"
                        />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>YouTube ID</label>
                        <input
                          type="text"
                          style={inputStyle}
                          value={editData.youtubeId ?? ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              youtubeId: e.target.value,
                            })
                          }
                          placeholder="e.g. dQw4w9WgXcQ"
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
                <tr key={i._id}>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    {i.title}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid var(--border-light)",
                    }}
                  >
                    {i.channel}
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
                      disabled={index === interviews.length - 1 || isReordering || !!editId}
                      title="तल सार्नुहोस्"
                      style={{
                        padding: "0.4rem 0.6rem",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        cursor: index === interviews.length - 1 || isReordering || !!editId ? "not-allowed" : "pointer",
                        fontSize: "0.9rem",
                        opacity: index === interviews.length - 1 ? 0.35 : 1,
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => startEdit(i)}
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
                      onClick={() => handleDelete(i._id)}
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
            {interviews.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  style={{ padding: "2rem", textAlign: "center" }}
                >
                  कुनै अन्तर्वार्ता भेटिएन।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
