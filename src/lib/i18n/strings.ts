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
  pastEvent: string;
  allDay: string;
  otherLocations: string;
  now: string;
  nowBeforeDay: string;
  nowAfterEvent: string;
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
  filters: string;
  showing: string;
  hiding: string;
  noneHidden: string;
  themes: string;
  themesHint: string;
  themeActive: string;
  themeComingSoon: string;
  /** Display names per category slug; missing slugs fall back to the slug. */
  categoryLabels: Record<string, string>;
}

const FI: Strings = {
  appTagline: "Assembly",
  pastEvent: "Mennyt",
  allDay: "Koko päivän",
  otherLocations: "Muut sijainnit",
  now: "Nyt",
  nowBeforeDay: "Päivä ei ole vielä alkanut",
  nowAfterEvent: "Tapahtuma on päättynyt",
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
  filters: "Suodattimet",
  showing: "Näytetään",
  hiding: "Piilotettu",
  noneHidden: "Valitse piilotettavat tapahtumatyypit",
  themes: "Teemat",
  themesHint: "Valitse ohjelman ulkoasu",
  themeActive: "Käytössä",
  themeComingSoon: "Tulossa",
  categoryLabels: {
    expo: "Expo",
    gaming: "Pelit",
    esports: "Esports",
    byoc: "BYOC",
    "lan-fi": "LAN",
    lan: "LAN",
    osallistu: "Osallistu",
    creators: "Creators",
    viihde: "Viihde",
    musiikki: "Musiikki",
    tanssi: "Tanssi",
    demoscene: "Demoscene",
    "k-weekxassembly": "K-Week",
    "k-pop": "K-Pop",
    kids: "Lapset",
    cosplay: "Cosplay",
    mainstage: "Päälava",
    general: "Muu",
  },
};

const EN: Strings = {
  appTagline: "Assembly",
  pastEvent: "Past event",
  allDay: "All day",
  otherLocations: "Other locations",
  now: "Now",
  nowBeforeDay: "Day has not started yet",
  nowAfterEvent: "Event has ended",
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
  filters: "Filters",
  showing: "Showing",
  hiding: "Hiding",
  noneHidden: "Select event types to hide them",
  themes: "Themes",
  themesHint: "Pick how the schedule looks",
  themeActive: "Active",
  themeComingSoon: "Coming soon",
  categoryLabels: {
    expo: "Expo",
    gaming: "Gaming",
    esports: "Esports",
    byoc: "BYOC",
    "lan-fi": "LAN",
    lan: "LAN",
    osallistu: "Take part",
    creators: "Creators",
    viihde: "Entertainment",
    musiikki: "Music",
    tanssi: "Dance",
    demoscene: "Demoscene",
    "k-weekxassembly": "K-Week",
    "k-pop": "K-Pop",
    kids: "Kids",
    cosplay: "Cosplay",
    mainstage: "Main stage",
    general: "Other",
  },
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

/**
 * Weekday + date label for a raw ISO timestamp: "SATURDAY 1st" / "LAUANTAI 1.8.".
 * Used where a bare "12:00–13:00" would be ambiguous (the detail sheet).
 */
export function isoDayLabel(iso: string, language: Language): string {
  const date = iso.slice(0, 10);
  const index = new Date(`${date}T12:00:00Z`).getUTCDay();
  const dayOfMonth = Number(date.slice(8, 10));
  const month = Number(date.slice(5, 7));
  const name = WEEKDAYS[language][index].toUpperCase();
  return language === "fi"
    ? `${name} ${dayOfMonth}.${month}.`
    : `${name} ${ordinal(dayOfMonth)}`;
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
