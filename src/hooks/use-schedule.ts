import { useQuery } from "@tanstack/react-query";
import { fetchScheduleList } from "@/lib/api/schedule-client";
import type { ScheduleData } from "@/lib/schedule/types";

/**
 * The timeline. Seeded from the route loader's server-cached data
 * (`initialData`) so the first paint has real content — no skeleton — then
 * polled every minute while the tab is focused. `initialDataUpdatedAt` is the
 * server fetch stamp: if that data is still fresh (< staleTime) React Query
 * skips the redundant mount refetch; if the server served a slightly stale
 * copy, RQ refreshes once in the background (data is already on screen, so no
 * skeleton either way). Background polling stops on a hidden tab
 * (`refetchIntervalInBackground` default false), sparing the origin.
 */
export function useSchedule(initialData?: ScheduleData) {
  return useQuery({
    queryKey: ["schedule", "summer26"],
    queryFn: ({ signal }) => fetchScheduleList(signal),
    initialData,
    initialDataUpdatedAt: initialData
      ? Date.parse(initialData.fetchedAt) || undefined
      : undefined,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}
