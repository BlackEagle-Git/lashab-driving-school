"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, BookOpen, CheckCircle2, ChevronRight, CircleHelp, GraduationCap,
  Languages, Mail, MapPin, Navigation, Phone, PlayCircle, ShieldCheck, Sparkles,
  Target, TrafficCone, Trophy, Users, Zap,
} from "lucide-react";

/** Social glyphs drawn by hand: lucide ships no brand icons. */
function FacebookIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21.9v-8.1h2.7l.4-3.2h-3.1V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8v8.1a9 9 0 0 0 3.4 0Z" /></svg>;
}
function InstagramIcon({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.4" /><circle cx="12" cy="12" r="3.9" /><circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" /></svg>;
}
function BrandLogo({ className = "", size = 48 }: { className?: string; size?: number }) {
  return <img src="/logo.jpg" alt="Lashab Auto-école" className={className} width={size} height={size} style={{ objectFit: "cover", display: "block" }} />;
}

type Lang = "fr" | "ar";

const PHONE_DISPLAY = "0557 29 71 79";
const PHONE_HREF = "tel:+213557297179";
const FACEBOOK = "https://www.facebook.com/p/Lashab-Auto-%C3%A9cole-SBA-100063959774015/";
const INSTAGRAM = "https://www.instagram.com/lashab_autoecole/";
const MAPS = "https://www.google.com/maps/place/Lashab+Auto-%C3%A9cole+%D9%85%D8%AF%D8%B1%D8%B3%D8%A9+%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D9%82%D8%A9+%D9%84%D8%B5%D9%87%D8%A8%E2%80%AD/data=!4m2!3m1!1s0x0:0x5ca4c1f3b49e2be2";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("fr");
  useEffect(() => { const saved = localStorage.getItem("lashab-language"); if (saved === "ar") setLang("ar"); }, []);
  const t = (fr: string, ar: string) => (lang === "ar" ? ar : fr);
  const flip = (lang === "ar");

  const facts = [
    { icon: ShieldCheck, value: "1986", label: "Depuis", labelAr: "منذ", note: "année de fondation", noteAr: "سنة التأسيس" },
    { icon: TrafficCone, value: "169", label: "Panneaux", labelAr: "إشارة", note: "signalisation complète", noteAr: "كامل علامات المرور" },
    { icon: PlayCircle, value: "50", label: "Scénarios", labelAr: "موقف", note: "animations 3D", noteAr: "محاكاة ثلاثية الأبعاد" },
    { icon: Trophy, value: "7", label: "Niveaux", labelAr: "مستوى", note: "du panneau au permis", noteAr: "من الإشارة إلى الرخصة" },
  ];

  return <div className={`landing ${flip ? "arabic" : ""}`} dir={flip ? "rtl" : "ltr"}>

    <header className="lp-nav">
      <a href="/" className="lp-brand" aria-label="Lashab Auto-école"><BrandLogo className="lp-brand-logo" size={42} /><span className="lp-brand-text"><strong>LASHAB<i>.</i></strong><small>AUTO-ÉCOLE · SBA</small></span></a>
      <nav className="lp-links">
        <a href="#apropos">{t("L'auto-école", "المدرسة")}</a>
        <a href="#application">{t("Application", "التطبيق")}</a>
        <a href="#formations">{t("Formations", "التكوينات")}</a>
        <a href="#contact">{t("Contact", "اتصل بنا")}</a>
      </nav>
      <div className="lp-nav-actions">
        <button className="lp-lang" onClick={() => setLang(flip ? "fr" : "ar")} aria-label="Changer de langue"><Languages size={16} /><span>{flip ? "FR" : "العربية"}</span></button>
        <a className="lp-call" href={PHONE_HREF}><Phone size={15} /><span>{PHONE_DISPLAY}</span></a>
      </div>
    </header>

    <section className="lp-hero">
      <div className="lp-hero-photo" />
      <div className="lp-hero-scrim" />
      <div className="lp-hero-inner">
        <span className="lp-kicker"><Sparkles size={14} /> {t("ÉCOLE DE CONDUITE · SIDI BEL ABBÈS", "مدرسة للسياقة · سيدي بلعباس")}</span>
        <h1>{t("Votre permis commence ici.", "رخصتك تبدأ من هنا.")}<br /><em>{t("Depuis 1986.", "منذ 1986.")}</em></h1>
        <p>{t(
          "Lashab Auto-école vous accompagne du premier panneau jusqu'au jour de l'examen : code de la route, priorités et scénarios animés, en français et en arabe.",
          "تدعمك مدرسة لشاب للسياقة من أول إشارة إلى يوم الامتحان: قانون السير والأوليات والمحاكاة المتحركة، باللغتين العربية والفرنسية."
        )}</p>
        <div className="lp-hero-cta">
          <a className="lp-primary" href="/app">{t("Commencer l'entraînement", "ابدأ التدريب")} <ArrowRight size={18} /></a>
          <a className="lp-ghost" href={PHONE_HREF}><Phone size={16} fill="currentColor" /> {t("Appelez-nous", "اتصل بنا")}</a>
        </div>
        <ul className="lp-trust">
          <li><CheckCircle2 size={16} /> {t("Moniteurs agréés", "مدرّبون معتمدون")}</li>
          <li><CheckCircle2 size={16} /> {t("Code en 2 langues", "القانون بلغتين")}</li>
          <li><CheckCircle2 size={16} /> {t("Suivi personnalisé", "متابعة خاصة")}</li>
        </ul>
      </div>
      <div className="lp-scroll">{t("Découvrir", "اكتشف")} <ChevronRight size={15} /></div>
    </section>

    <section className="lp-facts">
      {facts.map(f => <div key={f.label} className="lp-fact">
        <span className="lp-fact-icon"><f.icon size={20} /></span>
        <div><strong>{f.value}</strong><span>{t(f.label, f.labelAr)}</span><small>{t(f.note, f.noteAr)}</small></div>
      </div>)}
    </section>

    <section className="lp-section" id="apropos">
      <div className="lp-split">
        <div className="lp-copy">
          <span className="lp-eyebrow">{t("L'AUTO-ÉCOLE", "المدرسة")}</span>
          <h2>{t("Une adresse reconnue à Sidi Bel Abbès.", "عنوان معروف في سيدي بلعباس.")}</h2>
          <p>{t(
            "Depuis près de quarante ans, Lashab Auto-école forme les conducteurs de Sidi Bel Abbès et de sa région. Notre méthode reste simple : comprendre la signalisation, maîtriser les priorités, puis conduire avec confiance.",
            "منذ نحو أربعين سنة، تدرب مدرسة لشاب السائقين في سيدي بلعباس ومحيطها. طريقتنا بسيطة: فهم علامات المرور، إتقان الأوليات، ثم القيادة بثقة."
          )}</p>
          <div className="lp-points">
            {[
              [t("Formation au code de la route", "تكوين في قانون السير"), t("Panorama complet des panneaux, en français et en arabe.", "عرض كامل للإشارات بالفرنسية والعربية.")],
              [t("Priorités et cas particuliers", "الأوليات والحالات الخاصة"), t("Leçon par leçon, avec des cas de carrefour détaqués.", "درس بعد درس مع حالات تقاطع مفصّلة.")],
              [t("Suivi des progrès", "متابعة التقدم"), t("Votre score, vos panneaux maîtrisés, votre rythme.", "نتيجتك وإشاراتك المتقنة ووتيرتك الخاصة.")],
            ].map(([title, desc], i) => <div key={i} className="lp-point">
              <span>{i + 1}</span><div><strong>{title}</strong><small>{desc}</small></div>
            </div>)}
          </div>
        </div>
        <div className="lp-photo-stack" aria-label={t("Séance de conduite avec un moniteur", "حصة قيادة مع مدرّب")}>
          <img src="/image-pratique.jpg" alt={t("Leçon pratique de conduite", "درس عملي لتعلم القيادة")} className="lp-photo-main" />
          <img src="/img.webp" alt="" aria-hidden="true" className="lp-photo-sub" />
          <div className="lp-photo-badge"><GraduationCap size={20} /><strong>{t("Depuis 1986", "منذ 1986")}</strong><small>{t("Sidi Bel Abbès · Algérie", "سيدي بلعباس · الجزائر")}</small></div>
        </div>
      </div>
    </section>

    <section className="lp-section lp-app" id="application">
      <div className="lp-app-head">
        <div>
          <span className="lp-eyebrow">{t("LA PLATEFORME D'ENTRAÎNEMENT", "منصة التدريب")}</span>
          <h2>{t("Apprenez le code autrement.", "تعلم قانون السير بطريقة أخرى.")}</h2>
        </div>
        <a className="lp-outline" href="/app">{t("Ouvrir l'application", "افتح التطبيق")} <ArrowRight size={16} /></a>
      </div>
      <div className="lp-app-grid">
        <div className="lp-app-panel">
          <h3><BookOpen size={18} /> {t("Niveau 1 · Les panneaux", "المستوى 1 · الإشارات")}</h3>
          <p>{t("169 panneaux en 6 familles : danger, interdiction, obligation, priorité, indication et fin d'interdiction.", "169 إشارة في 6 عائلات: الخطر، المنع، الإجبار، الأسبقية، الإرشاد ونهاية المنع.")}</p>
          <div className="lp-sign-row">
            {["/signs/A1a.svg", "/signs/regulatory--no-entry.svg", "/signs/regulatory--roundabout.svg", "/signs/regulatory--priority-road.svg", "/signs/information--parking.svg"].map(src => <img key={src} src={src} alt="" />)}
          </div>
        </div>
        <div className="lp-app-panel lp-panel-dark">
          <h3><PlayCircle size={18} /> {t("Niveaux 2 à 6 · Les scénarios", "المستويات 2 إلى 6 · المواقف")}</h3>
          <p>{t("50 mises en situation animées en 3D : feux, giratoires, priorités, ordre de passage. L'animation se met en pause et vous décidez.", "50 محاكاة متحركة في 3D: إشارات ضوئية، مدار، أولويات، ترتيب المرور. يتوقف المشهد وتأتي الدورة إليك.")}</p>
          <div className="lp-scene-preview">
            <span className="lp-scene-road" />
            <span className="lp-scene-car car-a">A</span>
            <span className="lp-scene-car car-b">B</span>
            <span className="lp-scene-car car-c">C</span>
          </div>
          <small className="lp-scene-note">{t("Ordre de passage : B → A → C", "ترتيب المرور: B → A → C")}</small>
        </div>
        <div className="lp-app-panel">
          <h3><Target size={18} /> {t("Niveau 7 · Examen blanc", "المستوى 7 · اختبار تجريبي")}</h3>
          <p>{t("Vingt questions dans les conditions réelles, un résultat immédiat et des conseils pour progresser.", "عشرون سؤالاً في ظروف حقيقية، ونتيجة فورية ونصائح للتقدم.")}</p>
          <div className="lp-score">
            <div className="lp-score-ring"><strong>18<small>/20</small></strong></div>
            <ul><li><CheckCircle2 size={14} /> {t("Priorités maîtrisées", "الأوليات متقنة")}</li><li><CheckCircle2 size={14} /> {t("Signalisation complète", "العلامات كاملة")}</li><li className="todo"><CircleHelp size={14} /> {t("Distance de sécurité", "مسافة الأمان")}</li></ul>
          </div>
        </div>
      </div>
    </section>

    <section className="lp-section" id="formations">
      <span className="lp-eyebrow">{t("NOS FORMATIONS", "تكويناتنا")}</span>
      <h2 className="lp-center-h">{t("Tout ce qu'il faut pour passer le permis.", "كل ما تحتاجه لاجتياز الرخصة.")}</h2>
      <div className="lp-services">
        {[
          { icon: BookOpen, fr: "Code de la route", ar: "قانون السير", df: "Théorie complète : signalisation, priorités, cas particuliers et examen blanc.", da: "نظري كامل: العلامات، الأوليات، الحالات الخاصة والاختبار التجريبي." },
          { icon: Navigation, fr: "Conduite pratique", ar: "القيادة التطبيقية", df: "Séances individuelles avec moniteur, sur itinéraires d'examen.", da: "حصص فردية مع مدرّب على مسارات الامتحان." },
          { icon: Users, fr: "Permis toutes catégories", ar: "رخص لجميع الفئات", df: "Formations pour les catégories A, B, C, D et les autres catégories, avec un accompagnement jusqu'à l'examen pratique.", da: "تكوين لجميع الفئات A وB وC وD والفئات الأخرى، مع مرافقة كاملة إلى غاية الامتحان التطبيقي." },
          { icon: Zap, fr: "Code accéléré", ar: "مكثّف", df: "Formules intensives pour un passage rapide du code.", da: "صيغ مكثفة لاجتياز القانون بسرعة." },
        ].map(s => <article key={s.fr} className="lp-service">
          <span className="lp-service-icon"><s.icon size={21} /></span>
          <h3>{t(s.fr, s.ar)}</h3>
          <p>{t(s.df, s.da)}</p>
          <a href={PHONE_HREF}>{t("Se renseigner", "اعرف المزيد")} <ArrowRight size={14} /></a>
        </article>)}
      </div>
    </section>

    <section className="lp-section lp-contact" id="contact">
      <div className="lp-contact-card">
        <div className="lp-contact-copy">
          <span className="lp-eyebrow">{t("CONTACT", "اتصل بنا")}</span>
          <h2>{t("Prêt à prendre le volant ?", "هل أنت مستعد لقيادة السيارة؟")}</h2>
          <p>{t("Appelez-nous, passez nous voir, ou suivez-nous sur les réseaux. Nous vous répondons dans la journée.", "اتصل بنا، زرنا أو تابعنا على شبكات التواصل. سنرد عليك خلال اليوم.")}</p>
          <div className="lp-contact-list">
            <a href={PHONE_HREF} className="lp-contact-row"><span><Phone size={18} /></span><div><small>{t("Téléphone", "الهاتف")}</small><strong dir="ltr">{PHONE_DISPLAY}</strong></div><ChevronRight size={17} /></a>
            <a href={MAPS} target="_blank" rel="noopener noreferrer" className="lp-contact-row"><span><MapPin size={18} /></span><div><small>{t("Adresse", "العنوان")}</small><strong>{t("Cité Macta 1, Sidi Bel Abbès", "cité المقطعة 1، سيدي بلعباس")}</strong></div><ChevronRight size={17} /></a>
            <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" className="lp-contact-row"><span><FacebookIcon size={18} /></span><div><small>Facebook</small><strong>{t("Lashab Auto-école SBA", "مدرسة لشاب للسياقة")}</strong></div><ChevronRight size={17} /></a>
            <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="lp-contact-row"><span><InstagramIcon size={18} /></span><div><small>Instagram</small><strong dir="ltr">@lashab_autoecole</strong></div><ChevronRight size={17} /></a>
          </div>
        </div>
        <div className="lp-contact-side">
          <a href={PHONE_HREF} className="lp-big-call"><Phone size={22} fill="currentColor" /><span>{t("Appelez maintenant", "اتصل الآن")}</span><strong dir="ltr">{PHONE_DISPLAY}</strong></a>
          <a href="/app" className="lp-big-app"><Sparkles size={20} /><span>{t("Tester le code gratuitement", "جرّب القانون مجاناً")}</span><ArrowRight size={17} /></a>
          <p className="lp-hours">{t("Du samedi au jeudi · Sidi Bel Abbès", "من السبت إلى الخميس · سيدي بلعباس")}</p>
        </div>
      </div>
    </section>

    <footer className="lp-footer">
      <div className="lp-footer-brand"><BrandLogo className="lp-brand-logo lp-brand-logo-small" size={36} /><span><strong>LASHAB<i>.</i></strong><small>{t("Auto-école · Sidi Bel Abbès", "مدرسة السياقة · سيدي بلعباس")}</small></span></div>
      <div className="lp-footer-links">
        <a href="#apropos">{t("L'auto-école", "المدرسة")}</a>
        <a href="#application">{t("Application", "التطبيق")}</a>
        <a href={MAPS} target="_blank" rel="noopener noreferrer"><MapPin size={14} /> {t("Itinéraire", "الموقع")}</a>
        <a href={PHONE_HREF}><Mail size={14} /> {PHONE_DISPLAY}</a>
      </div>
      <p>© {new Date().getFullYear()} Lashab Auto-école · Sidi Bel Abbès · {t("Tous droits réservés", "كل الحقوق محفوظة")}</p>
    </footer>
  </div>;
}
