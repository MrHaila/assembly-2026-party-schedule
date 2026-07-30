import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AssemblyMark } from "@/components/AssemblyMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";

import { DayHeading } from "@/components/schedule/DayHeading";
import { DetailSheet } from "@/components/schedule/DetailSheet";

import { OtherVenues } from "@/components/schedule/OtherVenues";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLog } from "@/components/schedule/ScheduleLog";
import { NextUp } from "@/components/schedule/NextUp";
import { useFavourites } from "@/hooks/use-favourites";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHelsinkiNow } from "@/hooks/use-helsinki-now";
import { useNow } from "@/hooks/use-now";
import { useLanguage } from "@/hooks/use-language";
import { fetchLiveSchedule, getSnapshotSchedule } from "@/lib/api/assembly-graphql";
import { formatRelativeTime } from "@/lib/i18n/strings";
import { nextUpFavourites } from "@/lib/schedule/favourites";
import { scheduleDate, toScheduleTime } from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";

/** Most columns the responsive CSS can ever show (see .schedule-cols). */
const MAX_GRID_COLUMNS = 8;

export const Route = createFileRoute("/")({
  validateSearch: (search) => ({
    day: typeof search.day === "string" ? search.day : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assembly Schedule" },
      {
        name: "description",
        content:
          "The better party schedule viewer for Assembly Summer 2026.",
      },
      {
        property: "og:title",
        content: "Assembly Schedule",
      },
      {
        property: "og:description",
        content:
          "The better party schedule viewer for Assembly Summer 2026.",
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

  const { t, language } = useLanguage();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  // Schedule time: the day rolls over at 05:00, so 02:00 Saturday is still
  // "Friday, 1560 minutes" for every placement decision below.
  const wallNow = useHelsinkiNow();
  const now = useMemo(
    () => (wallNow ? toScheduleTime(wallNow) : null),
    [wallNow],
  );
  const nowFooter = useNow();
  const { favourites } = useFavourites();
  // Departure board: the next favourites still running or yet to start.
  const nextUp = useMemo(
    () =>
      nowFooter
        ? nextUpFavourites(schedule.events, favourites, nowFooter)
        : [],
    [schedule.events, favourites, nowFooter],
  );
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<EventItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focusedDay, setFocusedDay] = useState(schedule.days[0].id);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const day of schedule.days) map.set(day.date, []);
    for (const event of schedule.events) {
      map.get(scheduleDate(event.start))?.push(event);
    }
    return map;
  }, [schedule.events, schedule.days]);

  const venueById = useMemo(
    () => new Map(schedule.venues.map((v) => [v.slug, v] as const)),
    [schedule.venues],
  );
  // Busiest locations earn the columns; the rest are always list-only.
  const gridVenues = schedule.venues.slice(0, MAX_GRID_COLUMNS);
  const otherVenues = schedule.venues.slice(MAX_GRID_COLUMNS);

  // First paint lands on "now", placed ~20% down the viewport so a little
  // past stays visible above what is coming up.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current) return;
    const root = scrollRef.current;
    if (!root) return;

    const marker = root.querySelector<HTMLElement>("[data-now-marker]");
    if (marker) {
      landed.current = true;
      root.scrollTop =
        root.scrollTop + marker.getBoundingClientRect().top -
        root.getBoundingClientRect().top - root.clientHeight * 0.2;
      return;
    }

    const target = schedule.days.find((d) => d.date === now?.date);
    if (!target) return;
    landed.current = true;
    const el = root.querySelector<HTMLElement>(`[data-day-id="${target.id}"]`);
    if (el) {
      root.scrollTop =
        root.scrollTop + el.getBoundingClientRect().top -
        root.getBoundingClientRect().top;
    }
  }, [schedule.days, now?.date]);


  return (
    <div className="flex h-dvh flex-col">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b-2 border-ink px-3 py-2 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <AssemblyMark size={24} />
          <h1 className="truncate text-[18px] font-bold uppercase leading-none tracking-[0.08em]">
            Assembly Summer '26
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
        </div>

      </header>

      <NextUp entries={nextUp} venueById={venueById} onOpen={setSelected} />


      <div
        ref={scrollRef}
        className="schedule-scroll min-h-0 flex-1 overflow-auto"
      >
        {schedule.days.map((day) => {
          const dayEvents = eventsByDay.get(day.date) ?? [];
          return (
            <section key={day.id} data-day-id={day.id}>
              <DayHeading
                day={day}
                ongoing={dayEvents.filter((e) => e.kind === "ongoing")}
                onOpen={setSelected}
              />
              {isMobile ? (
                <ScheduleLog
                  day={day}
                  events={dayEvents}
                  venueById={venueById}
                  now={now}
                  onOpen={setSelected}
                />
              ) : (
                <>
                  <ScheduleGrid
                    day={day}
                    venues={gridVenues}
                    events={dayEvents}
                    now={now}
                    onOpen={setSelected}
                  />
                  <OtherVenues
                    venues={otherVenues}
                    gridVenues={gridVenues}
                    events={dayEvents}
                    onOpen={setSelected}
                  />
                </>
              )}
            </section>
          );
        })}
        <SiteFooter />
      </div>

      <footer className="border-t border-rule bg-paper text-ink-mid">
        <div className="px-3 py-1 text-[10px] uppercase tracking-[0.05em]">
          {t.lastUpdated}{" "}
          {nowFooter
            ? formatRelativeTime(language, schedule.fetchedAt, nowFooter)
            : "–"}{" "}
          · {schedule.events.length} {t.events}
        </div>
      </footer>

      <DetailSheet
        event={selected}
        venueById={venueById}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
