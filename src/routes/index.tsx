import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayHeading } from "@/components/schedule/DayHeading";
import { DetailSheet } from "@/components/schedule/DetailSheet";
import { DayTabs } from "@/components/schedule/DayTabs";
import { OtherVenues } from "@/components/schedule/OtherVenues";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLog } from "@/components/schedule/ScheduleLog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHelsinkiNow } from "@/hooks/use-helsinki-now";
import { fetchLiveSchedule, getSnapshotSchedule } from "@/lib/api/assembly-graphql";
import { formatTime, isoDate } from "@/lib/schedule/time";
import type { EventItem } from "@/lib/schedule/types";

/** Most columns the responsive CSS can ever show (see .schedule-cols). */
const MAX_GRID_COLUMNS = 8;

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
          "Every Assembly Summer 2026 stage on one dense TV-listings page. 210 events, 14 locations, 4 days.",
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
  const [focusedDay, setFocusedDay] = useState(schedule.days[0].id);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const day of schedule.days) map.set(day.date, []);
    for (const event of schedule.events) {
      map.get(isoDate(event.start))?.push(event);
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

  // Scroll-spy: the day tab follows the timeline instead of switching it.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-day-id]"),
    );
    const observer = new IntersectionObserver(
      () => {
        const top = root.getBoundingClientRect().top;
        const current =
          sections.find((s) => s.getBoundingClientRect().bottom > top + 8) ??
          sections.at(-1);
        if (current?.dataset.dayId) setFocusedDay(current.dataset.dayId);
      },
      { root, threshold: [0, 0.01, 1] },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [schedule.days, isMobile]);

  const scrollToDay = (dayId: string) => {
    setFocusedDay(dayId);
    navigate({ to: ".", search: { day: dayId }, replace: true });
    const root = scrollRef.current;
    const target = root?.querySelector<HTMLElement>(
      `[data-day-id="${dayId}"]`,
    );
    if (root && target) {
      root.scrollTo({
        top: root.scrollTop + target.getBoundingClientRect().top -
          root.getBoundingClientRect().top,
        behavior: "smooth",
      });
    }
  };

  // Deep link (?day=) and first paint both land on the right day, once.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current) return;
    const target =
      schedule.days.find((d) => d.id === search.day) ??
      schedule.days.find((d) => d.date === now?.date);
    if (!target) return;
    landed.current = true;
    const root = scrollRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-day-id="${target.id}"]`);
    if (root && el) {
      root.scrollTop =
        root.scrollTop + el.getBoundingClientRect().top -
        root.getBoundingClientRect().top;
      setFocusedDay(target.id);
    }
  }, [schedule.days, search.day, now?.date]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b-2 border-ink px-3 py-2 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold uppercase leading-none tracking-[0.08em]">
            Assyguide
          </h1>
          <p className="mt-0.5 truncate text-[11px] uppercase tracking-[0.06em] text-ink-mid">
            Assembly {schedule.eventTitle} · {schedule.eventLocation}
          </p>
        </div>
        <DayTabs
          days={schedule.days}
          activeId={focusedDay}
          onSelect={scrollToDay}
        />
      </header>

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
