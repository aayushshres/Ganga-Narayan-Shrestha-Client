import { useMemo } from "react";
import type { Theme } from "../types";

interface BookCoverProps {
  titleNp: string;
  theme: Theme;
}

export default function BookCover({ titleNp, theme }: BookCoverProps) {
  const svgURI = useMemo(() => {
    const color = theme === "dark" ? "#6B0F0F" : "#8B1A1A";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="320"><rect width="100%" height="100%" fill="${color}" /><text x="50%" y="50%" fill="white" font-family="'Tiro Devanagari', serif" font-size="20" text-anchor="middle" dominant-baseline="middle" font-weight="bold">${titleNp}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [titleNp, theme]);

  return <img src={svgURI} alt={titleNp} draggable={false} />;
}
