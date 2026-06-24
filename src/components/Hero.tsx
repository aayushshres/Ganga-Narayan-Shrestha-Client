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
  en: "Justice, equality, liberty, and fraternity — not as aspirations, but as the very foundation of my politics.",
  np: "न्याय, समानता, स्वतन्त्रता र भातृत्व — यी केवल आदर्श होइनन्, यिनै मेरो राजनीतिको जग हुन्।",
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
            src={`${import.meta.env.BASE_URL}portrait.png`}
            alt="कम्रेड गंगानारायण श्रेष्ठ — Comrade Ganga Narayan Shrestha"
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
