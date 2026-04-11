import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { t } from "../types";
import type { Translatable } from "../types";

const brand: Translatable = { en: "GANGA NARAYAN SHRESTHA", np: "गंगानारायण श्रेष्ठ" };

const navItems: { href: string; label: Translatable }[] = [
  { href: "#hero",       label: { en: "Home",       np: "गृहपृष्ठ" } },
  { href: "#timeline",   label: { en: "Biography",  np: "जीवनी" } },
  { href: "#writings",   label: { en: "Writings",   np: "लेखनहरू" } },
  { href: "#interviews", label: { en: "Interviews", np: "अन्तर्वार्ताहरू" } },
  { href: "#contact",    label: { en: "Contact",    np: "सम्पर्क" } },
];

export default function Navbar() {
  const { theme, lang, setTheme, setLang } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const navbar = document.getElementById('navbar');
      if (navbar && !navbar.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Navbar scroll shadow
  useEffect(() => {
    const navbar = document.getElementById("navbar");
    const onScroll = () => {
      if (!navbar) return;
      navbar.style.boxShadow = window.pageYOffset > 100 ? "var(--shadow)" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const toggleLang = () => setLang(lang === "np" ? "en" : "np");

  return (
    <nav className="navbar" id="navbar">
      <div className="nav-brand">
        <span>{t(brand, lang)}</span>
      </div>

      <ul className={`nav-links${menuOpen ? " open" : ""}`} id="navLinks">
        {navItems.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                const el = document.querySelector(item.href);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t(item.label, lang)}
            </a>
          </li>
        ))}
      </ul>

      <div className="nav-controls">
        <button
          className="toggle-btn"
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
          {theme === "dark" ? "☀️" : "🌙"}
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
