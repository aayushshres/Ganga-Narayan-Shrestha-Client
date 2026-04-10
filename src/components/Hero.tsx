import { useAppContext } from "../context/AppContext";
import { t } from "../types";
import type { Translatable } from "../types";

const party: Translatable = {
  en: "Communist Party of Nepal · Central Committee Member",
  np: "नेपाल कम्युनिस्ट पार्टी · केन्द्रीय कार्यालय सदस्य",
};

const name: Translatable = {
  en: "Ganga Narayan Shrestha",
  np: "गंगानारायण श्रेष्ठ",
};

const title: Translatable = {
  en: "Member of Bagmati Province Assembly · Sindhuli-2, Constituency-2",
  np: "बागमती प्रदेश सभा सदस्य · सिन्धुली-२, निर्वाचन क्षेत्र-२",
};

const quote: Translatable = {
  en: "The struggle of the working people is the foundation of a just society. My life has been dedicated to this truth.",
  np: "श्रमिक जनताको संघर्ष नै न्यायपूर्ण समाजको आधार हो। मेरो जीवन यही सत्यमा समर्पित छ।",
};

export default function Hero() {
  const { lang } = useAppContext();

  return (
    <section className="hero" id="hero">
      <div className="hero-red-panel"></div>
      <div className="hero-accent-bar"></div>
      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-party">{t(party, lang)}</p>
          <h1 className="hero-name">{t(name, lang)}</h1>
          <p className="hero-title">{t(title, lang)}</p>
          <hr className="hero-rule" />
          <p className="hero-quote">{t(quote, lang)}</p>
        </div>
        <div className="hero-image-wrapper">
          <img
            className="hero-image"
            src="/portrait.png"
            alt="कम्रेड गंगानारायण श्रेष्ठ — Comrade Ganga Narayan Shrestha"
          />
        </div>
      </div>
    </section>
  );
}
