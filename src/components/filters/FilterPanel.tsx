import { useFilters } from "@/hooks/use-filters";
import { useLanguage } from "@/hooks/use-language";
import type { CategoryCount } from "@/lib/schedule/filters";
import { FilterBadge } from "./FilterBadge";

interface FilterPanelProps {
  /** Every category present in the feed, most common first. */
  counts: readonly CategoryCount[];
}

/**
 * The expandable filter drawer under the header: every event type as a
 * coloured badge, split into SHOWING and HIDING. Both rows wrap — the panel
 * never scrolls sideways.
 */
export function FilterPanel({ counts }: FilterPanelProps) {
  const { hidden, toggle } = useFilters();
  const { t } = useLanguage();
  const label = (category: string) =>
    t.categoryLabels[category] ?? category.replace(/-/g, " ").toUpperCase();

  const showing = counts.filter((c) => !hidden.has(c.category));
  const hiding = counts.filter((c) => hidden.has(c.category));

  return (
    <div className="border-b-2 border-ink bg-paper px-3 py-2">
      <Row title={t.showing}>
        {showing.map((c) => (
          <FilterBadge
            key={c.category}
            category={c.category}
            label={label(c.category)}
            count={c.count}
            hidden={false}
            onToggle={toggle}
          />
        ))}
      </Row>
      <Row title={t.hiding}>
        {hiding.length === 0 ? (
          <span className="text-[11px] uppercase tracking-[0.05em] text-ink-mid">
            {t.noneHidden}
          </span>
        ) : (
          hiding.map((c) => (
            <FilterBadge
              key={c.category}
              category={c.category}
              label={label(c.category)}
              count={c.count}
              hidden
              onToggle={toggle}
            />
          ))
        )}
      </Row>
    </div>
  );
}

function Row({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start gap-1.5 py-1">
      <span className="w-[72px] shrink-0 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mid">
        {title}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
