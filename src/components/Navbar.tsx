import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { t } from "../types";
import type { Translatable } from "../types";
import { IconSun, IconMoon } from "./icons";

const brand: Translatable = {
  en: "GANGA NARAYAN SHRESTHA",
  np: "गंगानारायण श्रेष्ठ",
};

const navItems: { href: string; label: Translatable }[] = [
  { href: "#hero", label: { en: "Home", np: "गृहपृष्ठ" } },
  { href: "#timeline", label: { en: "Biography", np: "जीवनी" } },
  { href: "#writings", label: { en: "Writings", np: "लेखनहरू" } },
  { href: "#interviews", label: { en: "Interviews", np: "अन्तर्वार्ताहरू" } },
  { href: "#contact", label: { en: "Contact", np: "सम्पर्क" } },
];

export default function Navbar() {
  const { theme, lang, setTheme, setLang } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const onHome = location.pathname === "/";

  // Section links live on the homepage. From another page, navigate home with
  // the hash so ScrollManager scrolls to the section after it mounts.
  const goToSection = (href: string) => {
    setMenuOpen(false);
    if (onHome) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/" + href);
    }
  };

  const goHome = () => {
    setMenuOpen(false);
    if (onHome) window.scrollTo({ top: 0, behavior: "smooth" });
    else navigate("/");
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const navbar = document.getElementById("navbar");
      if (navbar && !navbar.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Navbar scroll shadow
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const onScroll = () => {
      if (!navbar) return;
      navbar.style.boxShadow =
        window.pageYOffset > 100 ? "var(--shadow)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const toggleLang = () => setLang(lang === "np" ? "en" : "np");

  return (
    <nav className="navbar" id="navbar">
      <div className="nav-brand">
        <span
          role="link"
          tabIndex={0}
          style={{ cursor: "pointer" }}
          onClick={goHome}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") goHome();
          }}
        >
          {t(brand, lang)}
        </span>
      </div>

      <ul className={`nav-links${menuOpen ? " open" : ""}`} id="navLinks">
        {navItems.map((item) => (
          <li key={item.href}>
            <a
              href={onHome ? item.href : `/${item.href}`}
              onClick={(e) => {
                e.preventDefault();
                goToSection(item.href);
              }}
            >
              {t(item.label, lang)}
            </a>
          </li>
        ))}
      </ul>

      <div className="nav-controls">
        <button
          className="toggle-btn theme-toggle"
          id="langToggle"
          aria-label="Toggle language"
          onClick={toggleLang}
        >
          {lang === "np" ? "🇬🇧" : "🇳🇵"}
        </button>

        <button
          className="toggle-btn theme-toggle"
          id="themeToggle"
          aria-label="Toggle theme"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        <button
          className="hamburger"
          id="hamburger"
          aria-label="Menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
