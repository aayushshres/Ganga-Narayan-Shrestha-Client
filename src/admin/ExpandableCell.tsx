import { useState } from "react";

export function ExpandableCell({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <span
      onClick={() => setExpanded((e) => !e)}
      title={expanded ? undefined : text}
      className={`admin-expandable${expanded ? " expanded" : ""}`}
    >
      {text}
    </span>
  );
}
