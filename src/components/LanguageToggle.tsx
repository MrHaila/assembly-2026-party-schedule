import { useLanguage } from "@/hooks/use-language";
import { LANGUAGES, type Language } from "@/lib/i18n/language";

const LABELS: Record<Language, string> = { fi: "FI", en: "EN" };

/**
 * Two-state segmented switch. Deliberately not a generic component: it takes
 * no props, so it can only ever render the app's language choice, in the app's
 * reverse-video active style.
 */
export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      role="group"
      aria-label={t.language}
      className="flex shrink-0 border border-ink"
    >
      {LANGUAGES.map((code) => {
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            className={`px-2 py-1 text-[12px] font-bold uppercase tracking-[0.08em] transition-colors duration-100 ${
              active ? "press-invert bg-ink text-paper" : "press bg-paper text-ink"
            }`}
          >
            {LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
