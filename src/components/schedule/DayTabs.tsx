import { useLanguage } from "@/hooks/use-language";
import { dayShortLabel } from "@/lib/i18n/strings";
import type { Day } from "@/lib/schedule/types";

interface DayTabsProps {
  days: readonly Day[];
  activeId: string;
  onSelect: (dayId: string) => void;
}

/** Day switcher. Reverse-video active tab, like a newspaper date box. */
export function DayTabs({ days, activeId, onSelect }: DayTabsProps) {
  const { language, t } = useLanguage();
  return (
    <div
      role="tablist"
      aria-label={t.scheduleDay}
      className="flex border border-ink"
    >
      {days.map((day) => {
        const active = day.id === activeId;
        return (
          <button
            key={day.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(day.id)}
            className={`px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.06em] transition-colors duration-100 ${
              active
                ? "bg-ink text-paper"
                : "press bg-paper text-ink"
            }`}
          >
            {dayShortLabel(day, language)}
          </button>
        );
      })}
    </div>
  );
}
