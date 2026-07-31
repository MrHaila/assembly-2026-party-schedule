import { useLanguage } from "@/hooks/use-language";
import { formatDayMinutes } from "@/lib/schedule/time";

interface NowRailProps {
  /** Day minutes of the current schedule time. */
  minutes: number;
  /** Why the clock is not inside a day: waiting for it, or past the end. */
  variant: "before" | "after";
}

/**
 * The standalone now-rule, used whenever the clock falls outside every day
 * window. Same red language as the in-grid bar so the eye reads them as one
 * indicator that simply moved.
 */
export function NowRail({ minutes, variant }: NowRailProps) {
  const { t } = useLanguage();
  return (
    <div
      data-now-marker
      className="flex items-center gap-2 border-y-2 border-spot bg-spot/10 px-3 py-1"
    >
      <span className="tnum bg-spot px-1 text-[10px] font-bold uppercase leading-[14px] tracking-[0.05em] text-paper">
        {t.now} {formatDayMinutes(minutes)}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-spot">
        {variant === "before" ? t.nowBeforeDay : t.nowAfterEvent}
      </span>
    </div>
  );
}
