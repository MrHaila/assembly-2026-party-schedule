/**
 * UI copy + day labels for both languages.
 *
 * One flat dictionary keyed by a union type: adding a key without translating
 * it is a type error, which is the whole point — no silent English leakage.
 */
import type { Language } from "./language";
import type { Day } from "@/lib/schedule/types";

export interface Strings {
  appTagline: string;
  scheduleDay: string;
  allDay: string;
  otherLocations: string;
  now: string;
  estimated: string;
  lastUpdated: string;
  events: string;
  close: string;
  time: string;
  location: string;
  type: string;
  sharp: string;
  noEndTime: string;
  watch: string;
  officialPage: string;
  language: string;
  addFavourite: string;
  removeFavourite: string;
  nextUp: string;
  thenAfter: string;
  noFavourites: string;
  liveNow: string;
  atLocation: string;
  loading: string;
  loadFailed: string;
  retry: string;
}

const FI: Strings = {
  appTagline: "Assembly",
  scheduleDay: "Ohjelmapäivä",
  allDay: "Koko päivän",
  otherLocations: "Muut sijainnit",
  now: "Nyt",
  estimated: "arvio",
  lastUpdated: "Päivitetty viimeksi",
  events: "tapahtumaa",
  close: "Sulje",
  time: "Aika",
  location: "Paikka",
  type: "Tyyppi",
  sharp: "tasan",
  noEndTime: "(päättymisaikaa ei julkaistu)",
  watch: "Katso",
  officialPage: "Virallinen sivu",
  language: "Kieli",
  addFavourite: "Lisää suosikkeihin",
  removeFavourite: "Poista suosikeista",
  nextUp: "Seuraavaksi",
  thenAfter: "Sitten",
  noFavourites: "Merkitse tapahtumia tähdellä nähdäksesi ne täällä",
  liveNow: "Käynnissä",
  atLocation: "paikassa",
  loading: "Ladataan ohjelmaa…",
  loadFailed: "Ohjelman lataus epäonnistui.",
  retry: "Yritä uudelleen",
};

const EN: Strings = {
  appTagline: "Assembly",
  scheduleDay: "Schedule day",
  allDay: "All day",
  otherLocations: "Other locations",
  now: "Now",
  estimated: "estimated",
  lastUpdated: "Last updated",
  events: "events",
  close: "Close",
  time: "Time",
  location: "Location",
  type: "Type",
  sharp: "sharp",
  noEndTime: "(no end time published)",
  watch: "Watch",
  officialPage: "Official page",
  language: "Language",
  addFavourite: "Add to favourites",
  removeFavourite: "Remove from favourites",
  nextUp: "Next up",
  thenAfter: "Then",
  noFavourites: "Star events to see them here",
  liveNow: "Live now",
  atLocation: "at",
  loading: "Loading the schedule…",
  loadFailed: "The schedule failed to load.",
  retry: "Try again",
};

const DICTIONARIES: Record<Language, Strings> = { fi: FI, en: EN };

export function stringsFor(language: Language): Strings {
  return DICTIONARIES[language];
}

const RELATIVE_UNITS: Record<
  Language,
  {
    second: [string, string];
    minute: [string, string];
    hour: [string, string];
    day: [string, string];
    suffix: string;
    justNow: string;
  }
> = {
  fi: {
    second: ["sekunti", "sekuntia"],
    minute: ["minuutti", "minuuttia"],
    hour: ["tunti", "tuntia"],
    day: ["päivä", "päivää"],
    suffix: "sitten",
    justNow: "juuri nyt",
  },
  en: {
    second: ["second", "seconds"],
    minute: ["minute", "minutes"],
    hour: ["hour", "hours"],
    day: ["day", "days"],
    suffix: "ago",
    justNow: "just now",
  },
};

function quantity(n: number, [singular, plural]: [string, string]): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** "last updated 23 seconds ago" / "päivitetty viimeksi 23 sekuntia sitten". */
export function formatRelativeTime(
  language: Language,
  iso: string,
  now: Date = new Date(),
): string {
  const units = RELATIVE_UNITS[language];
  const seconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(iso).getTime()) / 1_000),
  );
  if (seconds < 5) return units.justNow;
  if (seconds < 60) return `${quantity(seconds, units.second)} ${units.suffix}`;
  if (seconds < 3_600) {
    return `${quantity(Math.floor(seconds / 60), units.minute)} ${units.suffix}`;
  }
  if (seconds < 86_400) {
    return `${quantity(Math.floor(seconds / 3_600), units.hour)} ${units.suffix}`;
  }
  return `${quantity(Math.floor(seconds / 86_400), units.day)} ${units.suffix}`;
}

const WEEKDAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const WEEKDAYS: Record<Language, readonly string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fi: [
    "Sunnuntai",
    "Maanantai",
    "Tiistai",
    "Keskiviikko",
    "Torstai",
    "Perjantai",
    "Lauantai",
  ],
};

const WEEKDAYS_SHORT: Record<Language, readonly string[]> = {
  en: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
  fi: ["SU", "MA", "TI", "KE", "TO", "PE", "LA"],
};

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

function weekdayIndex(day: Pick<Day, "id">): number {
  const index = WEEKDAY_IDS.indexOf(day.id as (typeof WEEKDAY_IDS)[number]);
  return index === -1 ? 0 : index;
}

/** Sticky heading label: "THURSDAY 30th" / "TORSTAI 30.7." */
export function dayLabel(day: Day, language: Language): string {
  const index = weekdayIndex(day);
  const dayOfMonth = Number(day.date.slice(8, 10));
  const month = Number(day.date.slice(5, 7));
  const name = WEEKDAYS[language][index].toUpperCase();
  return language === "fi"
    ? `${name} ${dayOfMonth}.${month}.`
    : `${name} ${ordinal(dayOfMonth)}`;
}

/** Compact tab label: "THU 30" / "TO 30". */
export function dayShortLabel(day: Day, language: Language): string {
  const dayOfMonth = Number(day.date.slice(8, 10));
  return `${WEEKDAYS_SHORT[language][weekdayIndex(day)]} ${dayOfMonth}`;
}

/**
 * Departure-board countdown: "in 24 min" / "24 min kuluttua",
 * "in 1h 23min", "in 2d 3h". Minutes below one read as "<1 min".
 */
export function formatCountdown(language: Language, minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  let body: string;
  if (m < 1) {
    body = "<1 min";
  } else if (m < 60) {
    body = `${m} min`;
  } else if (m < 1440) {
    const h = Math.floor(m / 60);
    const rest = m % 60;
    body = rest === 0 ? `${h} h` : `${h} h ${rest} min`;
  } else {
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const dayUnit = language === "fi" ? "pv" : "d";
    body = h === 0 ? `${d} ${dayUnit}` : `${d} ${dayUnit} ${h} h`;
  }
  return language === "fi" ? `${body} kuluttua` : `in ${body}`;
}
