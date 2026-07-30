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
}

const FI: Strings = {
  appTagline: "Assembly",
  scheduleDay: "Ohjelmapäivä",
  allDay: "Koko päivän",
  otherLocations: "Muut sijainnit",
  now: "Nyt",
  estimated: "arvio",
  dataAsOf: "Tiedot",
  events: "tapahtumaa",
  source: "Lähde",
  close: "Sulje",
  time: "Aika",
  location: "Paikka",
  type: "Tyyppi",
  sharp: "tasan",
  noEndTime: "(päättymisaikaa ei julkaistu)",
  watch: "Katso",
  officialPage: "Virallinen sivu",
  language: "Kieli",
};

const EN: Strings = {
  appTagline: "Assembly",
  scheduleDay: "Schedule day",
  allDay: "All day",
  otherLocations: "Other locations",
  now: "Now",
  estimated: "estimated",
  dataAsOf: "Data as of",
  events: "events",
  source: "Source",
  close: "Close",
  time: "Time",
  location: "Location",
  type: "Type",
  sharp: "sharp",
  noEndTime: "(no end time published)",
  watch: "Watch",
  officialPage: "Official page",
  language: "Language",
};

const DICTIONARIES: Record<Language, Strings> = { fi: FI, en: EN };

export function stringsFor(language: Language): Strings {
  return DICTIONARIES[language];
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
