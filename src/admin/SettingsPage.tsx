import { useEffect, useState } from "react";
import { fetchSettings, updateSocials } from "../api/index";
import type { SocialLink, SocialPlatform } from "../types";
import { inputStyle } from "../styles/admin";
import SocialIcon, { PLATFORM_LABELS } from "../components/SocialIcon";

const PLATFORMS: SocialPlatform[] = [
  "email",
  "facebook",
  "instagram",
  "x",
  "youtube",
  "tiktok",
  "linkedin",
  "whatsapp",
  "website",
];

const PLACEHOLDER: Record<SocialPlatform, string> = {
  email: "ganga.nshrestha@gmail.com",
  facebook: "https://facebook.com/...",
  instagram: "https://instagram.com/...",
  x: "https://x.com/...",
  youtube: "https://youtube.com/@...",
  tiktok: "https://tiktok.com/@...",
  linkedin: "https://linkedin.com/in/...",
  whatsapp: "https://wa.me/9779...",
  website: "https://...",
};

export default function SettingsPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings()
      .then((s) => setLinks(s.socials))
      .catch((e) => setError((e as Error).message || "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<SocialLink>) =>
    setLinks((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const addRow = () => setLinks((prev) => [...prev, { platform: "facebook", url: "" }]);
  const removeRow = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    setLinks((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const cleaned = links
        .map((l) => ({ ...l, url: l.url.trim() }))
        .filter((l) => l.url);
      const res = await updateSocials(cleaned);
      setLinks(res.socials);
      setSuccess("सामाजिक लिङ्कहरू सुरक्षित गरियो!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError((e as Error).message || "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const btn = (bg: string): React.CSSProperties => ({
    padding: "0.5rem 1.2rem",
    background: bg,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  });

  return (
    <div>
      <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "0.5rem" }}>
        सामाजिक सञ्जाल लिङ्कहरू
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        फुटरमा देखिने सामाजिक सञ्जालका लिङ्कहरू व्यवस्थापन गर्नुहोस्।
      </p>

      {loading ? (
        <p>लोड हुँदैछ...</p>
      ) : (
        <div className="admin-form-card" style={{ display: "block" }}>
          {links.map((link, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  width: "40px",
                  height: "40px",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--crimson)",
                  flex: "0 0 auto",
                }}
              >
                <SocialIcon platform={link.platform} size={22} />
              </span>
              <select
                value={link.platform}
                onChange={(e) =>
                  update(i, { platform: e.target.value as SocialPlatform })
                }
                style={{ ...inputStyle, width: "auto", flex: "0 0 auto" }}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={link.url}
                onChange={(e) => update(i, { url: e.target.value })}
                placeholder={PLACEHOLDER[link.platform]}
                style={{ ...inputStyle, flex: "1 1 240px", minWidth: "200px" }}
              />
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                title="माथि"
                style={{ ...btn("var(--bg-secondary)"), color: "var(--text-primary)", border: "1px solid var(--border-color)", opacity: i === 0 ? 0.4 : 1 }}
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === links.length - 1}
                title="तल"
                style={{ ...btn("var(--bg-secondary)"), color: "var(--text-primary)", border: "1px solid var(--border-color)", opacity: i === links.length - 1 ? 0.4 : 1 }}
              >
                ↓
              </button>
              <button onClick={() => removeRow(i)} title="हटाउनुहोस्" style={btn("#D32F2F")}>
                ✕
              </button>
            </div>
          ))}

          {links.length === 0 && (
            <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
              कुनै लिङ्क छैन। तल थप्नुहोस्।
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={addRow}
              style={{ ...btn("var(--bg-secondary)"), color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
            >
              + लिङ्क थप्नुहोस्
            </button>
            <button onClick={handleSave} disabled={saving} style={btn("var(--crimson)")}>
              {saving ? "सुरक्षित हुँदैछ..." : "सुरक्षित गर्नुहोस्"}
            </button>
          </div>

          {success && <p style={{ color: "green", marginTop: "1rem" }}>{success}</p>}
          {error && <p style={{ color: "#D32F2F", marginTop: "1rem" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
