import { useEffect, useState } from "react";

/**
 * Wall-clock tick, SSR-safe.
 *
 * Returns `null` until the effect fires after hydration, so the first render
 * never contains a client-specific timestamp and cannot mismatch the server.
 */
export function useNow(intervalMs = 1_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
