import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DetailSheet } from "@/components/schedule/DetailSheet";
import { DayTabs } from "@/components/schedule/DayTabs";
import { OtherVenues } from "@/components/schedule/OtherVenues";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLog } from "@/components/schedule/ScheduleLog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHelsinkiNow } from "@/hooks/use-helsinki-now";
import { fetchLiveSchedule, getSnapshotSchedule } from "@/lib/api/assembly-graphql";
import {
  DAY_LENGTH_MIN,
  DAY_START_MIN,
  formatTime,
  isoDate,
} from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";

export const Route = createFileRoute("/")({
  validateSearch: (search) => ({
    day: typeof search.day === "string" ? search.day : undefined,
  }),
  head: () => ({
    meta: [
      { title: "ASSYGUIDE — Assembly Summer 2026 Schedule" },
      {
        name: "description",
        content:
          "What's on now, what's next, and what you're about to miss — every Assembly Summer 2026 stage on one dense TV-listings page.",
      },
      {
        property: "og:title",
        content: "ASSYGUIDE — Assembly Summer 2026 Schedule",
      },
      {
        property: "og:description",
        content:
          "Every Assembly Summer 2026 stage on one dense TV-listings page. 210 events, 14 venues, 4 days.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssyguidePage,
});

function AssyguidePage() {
  // Snapshot paints instantly; the live endpoint refreshes stale-while-
  // revalidate. On failure the snapshot silently stays (retry: 1).
  const { data: schedule } = useQuery({
    queryKey: ["schedule", "summer26"],
    queryFn: ({ signal }) => fetchLiveSchedule(signal),
    initialData: getSnapshotSchedule,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const now = useHelsinkiNow();
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<EventItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeDay =
    schedule.days.find((d) => d.id === search.day) ??
    schedule.days.find((d) => d.date === now?.date) ??
    schedule.days[0];

  const dayEvents = useMemo(
    () => schedule.events.filter((e) => isoDate(e.start) === activeDay.date),
    [schedule.events, activeDay.date],
  );
  const venueById = useMemo(
    () => new Map(schedule.venues.map((v) => [v.slug, v] as const)),
    [schedule.venues],
  );
  const gridVenues = schedule.venues.filter((v) => v.tier === "grid");
  const otherVenues = schedule.venues.filter((v) => v.tier === "other");

  // Auto-scroll the grid to ~now when viewing the current day.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isMobile || !now || now.date !== activeDay.date) return;
    if (now.minutes < DAY_START_MIN) return;
    const ratio = Math.max(
      0,
      (now.minutes - DAY_START_MIN - 45) / DAY_LENGTH_MIN,
    );
    el.scrollTop = ratio * el.scrollHeight;
  }, [activeDay.date, isMobile, now]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink px-3 py-2">
        <div>
          <h1 className="text-[18px] font-bold uppercase leading-none tracking-[0.08em]">
            Assyguide
          </h1>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-ink-mid">
            Assembly {schedule.eventTitle} · {schedule.eventLocation}
          </p>
        </div>
        <DayTabs
          days={schedule.days}
          activeId={activeDay.id}
          onSelect={(day) => navigate({ to: ".", search: { day } })}
        />
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {isMobile ? (
          <ScheduleLog
            day={activeDay}
            events={dayEvents}
            venueById={venueById}
            now={now}
            onOpen={setSelected}
          />
        ) : (
          <>
            <ScheduleGrid
              day={activeDay}
              venues={gridVenues}
              events={dayEvents}
              now={now}
              onOpen={setSelected}
            />
            <OtherVenues
              venues={otherVenues}
              events={dayEvents}
              onOpen={setSelected}
            />
          </>
        )}
      </div>

      <footer className="border-t border-rule bg-paper px-3 py-1 text-[10px] uppercase tracking-[0.05em] text-ink-mid">
        Data as of {isoDate(schedule.fetchedAt)}{" "}
        {formatTime(schedule.fetchedAt)} · {schedule.events.length} events ·
        Source assembly.org
      </footer>

      <DetailSheet
        event={selected}
        venueById={venueById}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
