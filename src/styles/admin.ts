import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  padding: "0.75rem",
  borderRadius: "4px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  width: "100%",
  fontFamily: "var(--font-body)",
  fontSize: "1rem",
  boxSizing: "border-box",
};

export const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "0.4rem",
  fontWeight: "bold",
};
