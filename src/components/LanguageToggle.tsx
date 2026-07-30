import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useLanguage } from "@/hooks/use-language";
import { LANGUAGES, type Language } from "@/lib/i18n/language";

const LABELS: Record<Language, string> = { fi: "FI", en: "EN" };

/**
 * Language switch. Takes no props so it can only ever render the app's
 * language choice, through the shared SegmentedToggle.
 */
export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <SegmentedToggle
      semantics="switch"
      label={t.language}
      activeId={language}
      onSelect={(id) => setLanguage(id as Language)}
      options={LANGUAGES.map((code) => ({ id: code, label: LABELS[code] }))}
    />
  );
}
