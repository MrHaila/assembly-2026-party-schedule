import { barSwatches, SWATCH_CLASS } from "@/lib/schedule/categories";

interface CategoryBarProps {
  /** Normalized category slugs from EventItem.categories. */
  categories: readonly string[];
  /** Starred by the visitor — collapses the bar to solid gold. */
  favourite: boolean;
}

/**
 * The thick left edge every event surface carries: one colour per category,
 * stacked evenly top-to-bottom, gold when favourited. The only place category
 * colour is ever drawn — components must not invent their own edges.
 *
 * The parent must be `relative`; the host is responsible for the matching
 * left padding so text never sits under the bar.
 */
export function CategoryBar({ categories, favourite }: CategoryBarProps) {
  const swatches = barSwatches(categories, favourite);

  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-[3px] flex-col overflow-hidden"
    >
      {swatches.map((swatch) => (
        <span key={swatch} className={`flex-1 ${SWATCH_CLASS[swatch]}`} />
      ))}
    </span>
  );
}
