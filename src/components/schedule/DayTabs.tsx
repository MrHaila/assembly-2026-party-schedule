import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useLanguage } from "@/hooks/use-language";
import { dayShortLabel } from "@/lib/i18n/strings";
import type { Day } from "@/lib/schedule/types";

interface DayTabsProps {
  days: readonly Day[];
  activeId: string;
  onSelect: (dayId: string) => void;
}

/** Day shortcuts. Scrolls the timeline; rendered by the shared toggle. */
export function DayTabs({ days, activeId, onSelect }: DayTabsProps) {
  const { language, t } = useLanguage();
  return (
    <SegmentedToggle
      semantics="tabs"
      label={t.scheduleDay}
      activeId={activeId}
      onSelect={onSelect}
      options={days.map((day) => ({
        id: day.id,
        label: dayShortLabel(day, language),
      }))}
    />
  );
}
