import { useAppContext } from "../context/AppContext";
import { t } from "../types";
import type { Translatable } from "../types";

const footerName: Translatable = { en: "Ganga Narayan Shrestha", np: "गंगानारायण श्रेष्ठ" };
const footerParty: Translatable = {
  en: "Communist Party of Nepal · Central Committee Member",
  np: "नेपाल कम्युनिस्ट पार्टी · केन्द्रीय कार्यालय सदस्य",
};

const contactLines: Translatable[] = [
  { en: "ganga.nshrestha@gmail.com", np: "ganga.nshrestha@gmail.com" },
];

const copyright: Translatable = { en: "© 2026 All rights reserved.", np: "© २०२६ सर्वाधिकार सुरक्षित।" };

export default function Footer() {
  const { lang } = useAppContext();

  return (
    <footer className="footer" id="contact">
      <div className="footer-name">{t(footerName, lang)}</div>
      <div className="footer-party">{t(footerParty, lang)}</div>
      <div className="footer-contact">
        {contactLines.map((line, i) => (
          <span key={i}>
            {t(line, lang)}
            {i < contactLines.length - 1 && <br />}
          </span>
        ))}
      </div>
      <div className="footer-bottom">
        <div className="footer-sickle">☭</div>
        <p className="footer-copy">{t(copyright, lang)}</p>
      </div>
    </footer>
  );
}
