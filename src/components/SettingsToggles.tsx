import type { CSSProperties } from "react";
import { useAppContext } from "../context/AppContext";
import { IconSun, IconMoon } from "./icons";

// Theme toggle, reused on the admin login page and dashboard.
// `color="white"` suits placement on the crimson admin header.
export default function SettingsToggles({
  color = "var(--text-secondary)",
}: {
  color?: string;
}) {
  const { theme, setTheme } = useAppContext();

  const btn: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "38px",
    height: "38px",
    padding: "0 0.6rem",
    background: "transparent",
    border: `1px solid ${color === "white" ? "rgba(255,255,255,0.6)" : "var(--border-color)"}`,
    borderRadius: "6px",
    color,
    cursor: "pointer",
    fontSize: "1.05rem",
    lineHeight: 1,
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        style={btn}
        aria-label="Toggle theme"
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
      </button>
    </div>
  );
}
