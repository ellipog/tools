import SunCalc from "suncalc";
import { getTimezoneCoords } from "./timezone-coords";

export interface OverlapResult {
  startHour: number;
  endHour: number;
  zones: string[];
}

export interface TimezoneInfo {
  id: string;
  offset: number;
  offsetLabel: string;
  abbreviation: string;
}

export function getAllTimezones(): string[] {
  return Intl.supportedValuesOf("timeZone");
}

export function getTimezoneInfo(tz: string, date: Date): TimezoneInfo {
  const offset = getOffset(tz, date);
  const offsetLabel = formatOffsetLabel(offset);
  const abbreviation = getAbbreviation(tz, date);
  return { id: tz, offset, offsetLabel, abbreviation };
}

export function getOffset(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const offsetPart = parts.find((p) => p.type === "timeZoneName");
  return parseOffset(offsetPart?.value ?? "UTC");
}

export function formatOffsetLabel(offsetHours: number): string {
  if (offsetHours === 0) return "UTC";
  const sign = offsetHours > 0 ? "+" : "";
  const hours = Math.floor(Math.abs(offsetHours));
  const minutes = Math.abs(offsetHours) % 1 * 60;
  return `UTC${sign}${hours}${minutes ? `:${minutes.toString().padStart(2, "0")}` : ""}`;
}

export function parseOffset(str: string): number {
  if (str === "UTC" || str === "GMT") return 0;
  const cleaned = str.replace("GMT", "").replace("UTC", "");
  const sign = cleaned.startsWith("+") ? 1 : -1;
  const num = cleaned.replace(/[+-]/, "");
  const parts = num.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return sign * (hours + minutes / 60);
}

function getAbbreviation(tz: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: tz,
    timeZoneName: "short",
  }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
}

export function formatTime(tz: string, date: Date, hour12: boolean): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12,
  }).format(date);
}

export function formatDate(tz: string, date: Date): string {
  return new Intl.DateTimeFormat("en", {
    timeZone: tz,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getSunriseSunset(tz: string, date: Date): { sunrise: number; sunset: number } | null {
  const coords = getTimezoneCoords(tz);
  if (!coords) return null;

  const times = SunCalc.getTimes(date, coords.lat, coords.lng);
  const offset = getOffset(tz, date);

  const sunriseUTC = times.sunrise.getUTCHours() + times.sunrise.getUTCMinutes() / 60;
  const sunsetUTC = times.sunset.getUTCHours() + times.sunset.getUTCMinutes() / 60;

  return {
    sunrise: normalizeHour(sunriseUTC + offset),
    sunset: normalizeHour(sunsetUTC + offset),
  };
}

export function findOverlap(
  zones: string[],
  date: Date,
  businessStart: number,
  businessEnd: number,
): OverlapResult[] {
  if (zones.length < 2) return [];

  const ranges = zones.map((tz) => {
    const offset = getOffset(tz, date);
    const utcStart = businessStart - offset;
    const utcEnd = businessEnd - offset;
    return { tz, utcStart, utcEnd };
  });

  const allBoundaries = ranges.flatMap((r) => [r.utcStart, r.utcEnd]).sort((a, b) => a - b);
  const results: OverlapResult[] = [];

  for (let i = 0; i < allBoundaries.length - 1; i++) {
    const start = allBoundaries[i];
    const end = allBoundaries[i + 1];
    if (end - start < 0.01) continue;

    const overlapping = ranges.filter((r) => r.utcStart <= start + 0.01 && r.utcEnd >= end - 0.01);
    if (overlapping.length === zones.length) {
      results.push({
        startHour: start,
        endHour: end,
        zones: overlapping.map((r) => r.tz),
      });
    }
  }

  return results;
}

export function isDST(tz: string, date: Date): boolean {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  return getOffset(tz, date) !== getOffset(tz, jan) || getOffset(tz, date) !== getOffset(tz, jul);
}

export function normalizeHour(hour: number): number {
  return ((hour % 24) + 24) % 24;
}
