export type Age = { years: number; months: number; days: number; hours: number; minutes: number; seconds: number };

export function calcAge(birth: Date, now: Date): Age {
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  let hours = now.getHours() - birth.getHours();
  let minutes = now.getMinutes() - birth.getMinutes();
  let seconds = now.getSeconds() - birth.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours < 0) { hours += 24; days--; }
  if (days < 0) {
    const prev = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prev; months--;
  }
  if (months < 0) { months += 12; years--; }

  return { years, months, days, hours, minutes, seconds };
}

export function totalDays(birth: Date, now: Date): number {
  return Math.floor((now.getTime() - birth.getTime()) / 86400000);
}

export function nextBirthday(birth: Date, now: Date): { days: number; date: string } {
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next <= now) next.setFullYear(next.getFullYear() + 1);
  const days = Math.ceil((next.getTime() - now.getTime()) / 86400000);
  return { days, date: next.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) };
}

export function nextBirthdayCountdown(birth: Date, now: Date): { days: number; hours: number; minutes: number; seconds: number } {
  const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (next <= now) next.setFullYear(next.getFullYear() + 1);
  const diff = Math.max(0, next.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function zodiac(month: number, day: number): string {
  const signs = [
    { name: "Capricorn", end: 119 }, { name: "Aquarius", end: 218 },
    { name: "Pisces", end: 320 }, { name: "Aries", end: 419 },
    { name: "Taurus", end: 520 }, { name: "Gemini", end: 620 },
    { name: "Cancer", end: 722 }, { name: "Leo", end: 822 },
    { name: "Virgo", end: 922 }, { name: "Libra", end: 1022 },
    { name: "Scorpio", end: 1121 }, { name: "Sagittarius", end: 1221 },
    { name: "Capricorn", end: 1231 },
  ];
  const md = month * 100 + day;
  for (const s of signs) { if (md <= s.end) return s.name; }
  return "Capricorn";
}

export function dayOfWeek(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export function birthSeason(month: number, day: number): string {
  const md = month * 100 + day;
  if (md >= 320 && md < 620) return "Spring";
  if (md >= 620 && md < 922) return "Summer";
  if (md >= 922 && md < 1221) return "Fall";
  return "Winter";
}

const CHINESE_ZODIAC = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];

export function chineseZodiac(year: number): string {
  return CHINESE_ZODIAC[(year - 4) % 12];
}

export function totalAge(birth: Date, now: Date): { totalMonths: number; totalWeeks: number; totalDays: number; totalHours: number; totalMinutes: number; totalSeconds: number } {
  const diffMs = now.getTime() - birth.getTime();
  const totalS = Math.floor(diffMs / 1000);
  return {
    totalMonths: Math.floor(totalS / (86400 * 30.44)),
    totalWeeks: Math.floor(totalS / (86400 * 7)),
    totalDays: Math.floor(totalS / 86400),
    totalHours: Math.floor(totalS / 3600),
    totalMinutes: Math.floor(totalS / 60),
    totalSeconds: totalS,
  };
}

export function planetAges(daysAlive: number): Record<string, number> {
  return {
    Mercury: daysAlive / 87.97,
    Venus: daysAlive / 224.7,
    Mars: daysAlive / 686.97,
    Jupiter: daysAlive / 4332.8,
    Saturn: daysAlive / 10759,
    Uranus: daysAlive / 30687,
    Neptune: daysAlive / 60190,
  };
}

export function lifeProgress(years: number, lifeExpectancy: number = 80): number {
  return Math.min(100, (years / lifeExpectancy) * 100);
}

export function upcomingMilestones(birth: Date, now: Date, lifeExpectancy: number = 80): { label: string; targetDate: Date; daysUntil: number }[] {
  const results: { label: string; targetDate: Date; daysUntil: number }[] = [];
  const age = calcAge(birth, now);

  for (let y = age.years + 1; y <= age.years + 5; y++) {
    const target = new Date(birth);
    target.setFullYear(birth.getFullYear() + y);
    if (target <= now) continue;
    const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
    results.push({ label: `Age ${y}`, targetDate: target, daysUntil: days });
  }

  const totalDaysNum = totalDays(birth, now);
  for (const d of [10000, 20000, 30000, 40000, 50000]) {
    if (totalDaysNum < d) {
      const target = new Date(birth.getTime() + d * 86400000);
      const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
      if (days > 0 && days <= 365 * 5) {
        results.push({ label: `${d.toLocaleString("en-US")} days`, targetDate: target, daysUntil: days });
      }
    }
  }

  const totalHoursNum = Math.floor((now.getTime() - birth.getTime()) / 3600000);
  for (const h of [100000, 500000, 1000000]) {
    if (totalHoursNum < h) {
      const target = new Date(birth.getTime() + h * 3600000);
      const days = Math.ceil((target.getTime() - now.getTime()) / 86400000);
      if (days > 0 && days <= 365 * 5) {
        results.push({ label: `${h.toLocaleString("en-US")} hours`, targetDate: target, daysUntil: days });
      }
    }
  }

  const lifeEnd = new Date(birth);
  lifeEnd.setFullYear(birth.getFullYear() + lifeExpectancy);
  const daysToLife = Math.ceil((lifeEnd.getTime() - now.getTime()) / 86400000);
  if (daysToLife > 0 && daysToLife <= 365 * 5) {
    results.push({ label: "Life expectancy", targetDate: lifeEnd, daysUntil: daysToLife });
  }

  results.sort((a, b) => a.daysUntil - b.daysUntil);
  return results.slice(0, 5);
}

export function absurdStats(daysAlive: number, years: number): Record<string, number> {
  return {
    breaths: Math.round(daysAlive * 86400 * 0.27),
    blinks: Math.round(daysAlive * 86400 * 0.25),
    foodKg: Math.round(daysAlive * 2),
    steps: Math.round(daysAlive * 7500),
    movies: Math.round(daysAlive / 7),
    cupsOfCoffee: Math.round(years * 365 * 2),
    laughsMinutes: Math.round(daysAlive * 2),
  };
}

const GENERATIONS = [
  { label: "Silent", start: 1928, end: 1945 },
  { label: "Boomer", start: 1946, end: 1964 },
  { label: "Gen X", start: 1965, end: 1980 },
  { label: "Millennial", start: 1981, end: 1996 },
  { label: "Gen Z", start: 1997, end: 2012 },
  { label: "Gen Alpha", start: 2013, end: 2025 },
];

export function generation(year: number): { label: string; range: string } {
  for (const g of GENERATIONS) {
    if (year >= g.start && year <= g.end) return { label: g.label, range: `${g.start}–${g.end}` };
  }
  return { label: "Unknown", range: "" };
}

export function animalYears(years: number): { dog: number; cat: number } {
  const first = 15, second = 9, ea = 4;
  const calc = (y: number) => y <= 1 ? first : y === 2 ? first + second : first + second + (y - 2) * ea;
  return { dog: calc(years), cat: calc(years) };
}

export function lifeWeeks(years: number, lifeExpectancy: number = 80): { lived: number; remaining: number; total: number } {
  const lived = Math.round(years * 52.177);
  const total = Math.round(lifeExpectancy * 52.177);
  return { lived, remaining: Math.max(0, total - lived), total };
}
