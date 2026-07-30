import { useEffect, useState } from "react";
import { helsinkiNow } from "@/lib/schedule/time";

export type HelsinkiNow = { date: string; minutes: number } | null;

/**
 * Helsinki wall clock, ticking once a minute.
 * Returns null until mounted — SSR renders without the now-bar, the client
 * draws it after hydration, so there is never a hydration mismatch.
 */
export function useHelsinkiNow(intervalMs = 60_000): HelsinkiNow {
  const [now, setNow] = useState<HelsinkiNow>(null);
  useEffect(() => {
    setNow(helsinkiNow());
    const id = setInterval(() => setNow(helsinkiNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
