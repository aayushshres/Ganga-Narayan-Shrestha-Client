import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Theme, Lang, AppContextType } from "../types";

const AppContext = createContext<AppContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function getInitialLang(): Lang {
  const stored = localStorage.getItem("lang");
  if (stored === "en" || stored === "np") return stored;
  return "en";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  // Sync data-theme on <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <AppContext.Provider value={{ theme, lang, setTheme, setLang }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside <AppProvider>");
  return ctx;
}
