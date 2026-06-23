import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { t } from "../types";
import type { SocialLink, Translatable } from "../types";
import { fetchSettings } from "../api/index";
import SocialIcon, { PLATFORM_LABELS, socialHref } from "./SocialIcon";

const footerName: Translatable = {
  en: "Ganga Narayan Shrestha",
  np: "गंगानारायण श्रेष्ठ",
};
const footerParty: Translatable = {
  en: "Communist Party of Nepal · Central Committee Member",
  np: "नेपाल कम्युनिस्ट पार्टी · केन्द्रीय कार्यालय सदस्य",
};

const copyright: Translatable = {
  en: "© 2026 All rights reserved.",
  np: "© 2026 All rights reserved.",
};

export default function Footer() {
  const { lang } = useAppContext();
  const [socials, setSocials] = useState<SocialLink[]>([]);

  useEffect(() => {
    fetchSettings()
      .then((s) => setSocials(s.socials.filter((l) => l.url.trim())))
      .catch(() => { /* non-critical */ });
  }, []);

  return (
    <footer className="footer" id="contact">
      <div className="footer-name">{t(footerName, lang)}</div>
      <div className="footer-party">{t(footerParty, lang)}</div>
      {socials.length > 0 && (
        <div className="footer-social">
          {socials.map((link) => (
            <a
              key={link.platform + link.url}
              href={socialHref(link.platform, link.url)}
              {...(link.platform === "email"
                ? {}
                : { target: "_blank", rel: "noopener noreferrer" })}
              className="footer-social__link"
              aria-label={PLATFORM_LABELS[link.platform]}
              title={PLATFORM_LABELS[link.platform]}
            >
              <SocialIcon platform={link.platform} size={20} />
            </a>
          ))}
        </div>
      )}
      <div className="footer-bottom">
        <div className="footer-sickle">☭</div>
        <p className="footer-copy">{t(copyright, lang)}</p>
      </div>
    </footer>
  );
}
