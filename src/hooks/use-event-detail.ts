import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { loadEventDetail } from "@/lib/api/schedule-client";
import type { Language } from "@/lib/i18n/language";
import type { EventDetail } from "@/lib/schedule/types";

const ONE_HOUR = 60 * 60_000;

/**
 * Query options for one event body in one language. Shared by the on-demand
 * hook and the prefetch warmer so both hit the exact same cache key — a click
 * on a warmed event is a pure cache read. The batch loader (in schedule-client)
 * coalesces whatever concurrent fetches these trigger into single requests.
 */
function detailQueryOptions(id: number, language: Language) {
  return {
    queryKey: ["detail", id, language] as const,
    queryFn: (): Promise<EventDetail> => loadEventDetail(id, language),
    staleTime: ONE_HOUR,
    gcTime: ONE_HOUR,
  };
}

/** On-demand body for the open event. Disabled while no event is selected. */
export function useEventDetail(id: number | null, language: Language) {
  return useQuery({
    ...detailQueryOptions(id ?? 0, language),
    enabled: id != null,
  });
}

/**
 * Warm the cache for a set of events in one language. Already-cached (fresh)
 * ids are skipped by React Query; the rest fan into one batched request.
 */
export function prefetchDetails(
  queryClient: QueryClient,
  ids: readonly number[],
  language: Language,
): void {
  for (const id of ids) {
    void queryClient.prefetchQuery(detailQueryOptions(id, language));
  }
}

export function usePrefetchDetails() {
  const queryClient = useQueryClient();
  return useCallback(
    (ids: readonly number[], language: Language) =>
      prefetchDetails(queryClient, ids, language),
    [queryClient],
  );
}
