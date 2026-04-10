import { useAppContext } from "../context/AppContext";
import { t } from "../types";
import type { Translatable } from "../types";

const footerName: Translatable = {
  en: "Ganga Narayan Shrestha",
  np: "गंगानारायण श्रेष्ठ",
};
const footerParty: Translatable = {
  en: "Communist Party of Nepal · Central Committee Member",
  np: "नेपाल कम्युनिस्ट पार्टी · केन्द्रीय कार्यालय सदस्य",
};

const email = "ganga.nshrestha@gmail.com";

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: "22",
  height: "22",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const socialLinks = [
  {
    label: "Email",
    href: `mailto:${email}`,
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    icon: (
      <svg {...iconProps}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://www.x.com",
    icon: (
      <svg {...iconProps}>
        <path d="M4 4 20 20M20 4 4 20" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com",
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <polygon points="10 9 15 12 10 15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const copyright: Translatable = {
  en: "© 2026 All rights reserved.",
  np: "© 2026 All rights reserved.",
};

export default function Footer() {
  const { lang } = useAppContext();

  return (
    <footer className="footer" id="contact">
      <div className="footer-name">{t(footerName, lang)}</div>
      <div className="footer-party">{t(footerParty, lang)}</div>
      <div className="footer-social">
        {socialLinks.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            {...(href.startsWith("mailto:")
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            className="footer-social__link"
            aria-label={label}
          >
            {icon}
          </a>
        ))}
      </div>
      <div className="footer-bottom">
        <div className="footer-sickle">☭</div>
        <p className="footer-copy">{t(copyright, lang)}</p>
      </div>
    </footer>
  );
}
