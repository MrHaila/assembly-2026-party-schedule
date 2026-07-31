import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AssemblyMark } from "@/components/AssemblyMark";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SiteFooter } from "@/components/SiteFooter";

import { DayHeading } from "@/components/schedule/DayHeading";
import { DetailSheet } from "@/components/schedule/DetailSheet";
import { DayTabs } from "@/components/schedule/DayTabs";
import { OtherVenues } from "@/components/schedule/OtherVenues";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleLog } from "@/components/schedule/ScheduleLog";
import { NextUp } from "@/components/schedule/NextUp";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavourites } from "@/hooks/use-favourites";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHelsinkiNow } from "@/hooks/use-helsinki-now";
import { useNow } from "@/hooks/use-now";
import { useLanguage } from "@/hooks/use-language";
import { useSchedule } from "@/hooks/use-schedule";
import { usePrefetchDetails } from "@/hooks/use-event-detail";
import { fetchScheduleListCached } from "@/lib/api/schedule-server";
import { formatRelativeTime } from "@/lib/i18n/strings";
import { nextUpFavourites } from "@/lib/schedule/favourites";
import { scheduleDate, toScheduleTime } from "@/lib/schedule/time";
import type { ScheduleData, EventItem } from "@/lib/schedule/types";

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
  // Fetch the timeline on the server (from the server-held cache) so the HTML
  // ships with data — the page hydrates without a loading skeleton.
  loader: () => fetchScheduleListCached(),
  component: AssyguidePage,
});

/** Header chrome shared by every state, so the shell never flashes empty. */
function Chrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b-2 border-ink px-3 py-2 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <AssemblyMark size={24} />
          <h1 className="truncate text-[18px] font-bold uppercase leading-none tracking-[0.08em]">
            Assembly Summer '26
          </h1>
        </div>
        <LanguageToggle />
      </header>
      {children}
    </div>
  );
}

/**
 * The route now fetches live on load — nothing is bundled — so it owns three
 * states: loading skeleton, error+retry (no snapshot to fall back on), and the
 * schedule itself. Schedule-dependent hooks live in ScheduleView so they only
 * run once `schedule` exists.
 */
function AssyguidePage() {
  const { t } = useLanguage();
  // Seeded from the loader's server-cached data → not pending on first paint.
  // The skeleton below only appears on the rare path where seed data is absent
  // (e.g. a client-side navigation whose loader is still resolving).
  const initial = Route.useLoaderData();
  const query = useSchedule(initial);

  if (query.isPending) {
    return (
      <Chrome>
        <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3">
          <span className="sr-only">{t.loading}</span>
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Chrome>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Chrome>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm text-ink-mid">{t.loadFailed}</p>
          <button
            onClick={() => query.refetch()}
            className="border-2 border-ink px-4 py-2 text-sm font-bold uppercase tracking-[0.06em] hover:bg-ink hover:text-paper"
          >
            {t.retry}
          </button>
        </div>
      </Chrome>
    );
  }

  return <ScheduleView schedule={query.data} />;
}

function ScheduleView({ schedule }: { schedule: ScheduleData }) {
  const { t, language } = useLanguage();
  const prefetchDetails = usePrefetchDetails();
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

  // Warm the detail cache for whatever day-sections are on screen, so a click
  // is a cache hit instead of a spinner. Called 1 s after scrolling settles
  // (below) and on the initial/​language-swap paint. React Query skips
  // already-cached ids; the batch loader collapses the rest into one request.
  const warmVisible = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const rootRect = root.getBoundingClientRect();
    const ids: number[] = [];
    for (const section of root.querySelectorAll<HTMLElement>("[data-day-id]")) {
      const rect = section.getBoundingClientRect();
      const onScreen = rect.bottom > rootRect.top && rect.top < rootRect.bottom;
      if (!onScreen) continue;
      const day = schedule.days.find((d) => d.id === section.dataset.dayId);
      const events = day ? (eventsByDay.get(day.date) ?? []) : [];
      for (const event of events) ids.push(event.id);
    }
    if (ids.length) prefetchDetails(ids, language);
  }, [schedule.days, eventsByDay, prefetchDetails, language]);

  // Scroll-spy: the day tab follows the timeline instead of switching it.
  // A scroll listener (not IntersectionObserver) — IO only fires when a
  // threshold is crossed, so a smooth scroll could settle after the last
  // callback and leave the tab one day behind.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-day-id]"),
    );
    let frame = 0;
    let idle = 0;
    const sync = () => {
      frame = 0;
      const top = root.getBoundingClientRect().top;
      const current =
        sections.find((s) => s.getBoundingClientRect().bottom > top + 8) ??
        sections.at(-1);
      if (current?.dataset.dayId) setFocusedDay(current.dataset.dayId);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(sync);
      // Debounce: warm details only once scrolling has been still for 1 s, so
      // a fast fling past ten days doesn't fire ten prefetch batches.
      if (idle) clearTimeout(idle);
      idle = window.setTimeout(warmVisible, 1000);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => {
      root.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (idle) clearTimeout(idle);
    };
  }, [schedule.days, isMobile, warmVisible]);

  // Warm the first screen on load and re-warm the current view after a
  // language swap (details are cached per language).
  useEffect(() => {
    const timer = window.setTimeout(warmVisible, 300);
    return () => clearTimeout(timer);
  }, [warmVisible]);


  const scrollToDay = (dayId: string) => {
    setFocusedDay(dayId);
    const root = scrollRef.current;
    const target = root?.querySelector<HTMLElement>(
      `[data-day-id="${dayId}"]`,
    );
    // Scroll BEFORE the router state change: navigate() re-renders the tree,
    // which used to interrupt (and silently drop) the smooth scroll, so the
    // first click only moved the tab and a second click was needed.
    if (root && target) {
      root.scrollTo({
        top: root.scrollTop + target.getBoundingClientRect().top -
          root.getBoundingClientRect().top,
        behavior: "smooth",
      });
    }
    navigate({ to: ".", search: { day: dayId }, replace: true });
  };

  // First paint lands on the deep link (?day=), otherwise on "now" placed
  // ~20% down the viewport so a little past stays visible above upcoming.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current) return;
    const root = scrollRef.current;
    if (!root) return;

    const deepLinked = schedule.days.find((d) => d.id === search.day);
    if (!deepLinked) {
      const marker = root.querySelector<HTMLElement>("[data-now-marker]");
      if (marker) {
        landed.current = true;
        root.scrollTop =
          root.scrollTop + marker.getBoundingClientRect().top -
          root.getBoundingClientRect().top - root.clientHeight * 0.2;
        return;
      }
    }

    const target =
      deepLinked ?? schedule.days.find((d) => d.date === now?.date);
    if (!target) return;
    landed.current = true;
    const el = root.querySelector<HTMLElement>(`[data-day-id="${target.id}"]`);
    if (el) {
      root.scrollTop =
        root.scrollTop + el.getBoundingClientRect().top -
        root.getBoundingClientRect().top;
      setFocusedDay(target.id);
    }
  }, [schedule.days, search.day, now?.date]);

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
          <DayTabs
            days={schedule.days}
            activeId={focusedDay}
            onSelect={scrollToDay}
          />
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
