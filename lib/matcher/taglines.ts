import type { MatchMode } from "./types";

type Bucket = "high" | "mid" | "low" | "fail";

const TAGLINES: Record<MatchMode, Record<Bucket, string[]>> = {
  romance: {
    high: [
      "You complete each other's segfaults",
      "Written in the stars",
      "Soulmates with debugging privileges",
      "The universe gave you both the same WiFi password",
    ],
    mid: [
      "There's potential here",
      "The stars are cautiously optimistic",
      "A solid 'maybe' from the cosmos",
      "You're in the same book, different page",
    ],
    low: [
      "Interesting… but not in a good way",
      "The vibes are complicated",
      "Your auras are arguing",
      "This needs work",
    ],
    fail: [
      "Perhaps in another universe",
      "The cosmic WiFi is down",
      "Your stars are in different galaxies",
      "The algorithm says 'next'",
    ],
  },
  friendship: {
    high: [
      "Ride or die. Literally.",
      "Platonic soulmate status unlocked",
      "You'd share fries without being asked",
      "Vibe check: passed",
    ],
    mid: [
      "Solid acquaintance energy",
      "You could be friends if you tried",
      "Maybe grab coffee once",
      "The algorithm senses potential",
    ],
    low: [
      "You'd probably annoy each other",
      "Keep it professional",
      "Mutual tolerance at best",
      "The universe says 'meh'",
    ],
    fail: [
      "Better as strangers",
      "The friend application was denied",
      "Your personalities are on different planets",
      "Hard pass from the cosmos",
    ],
  },
  rivalry: {
    high: [
      "Every hero needs their villain",
      "The Moriarty to your Holmes",
      "A rivalry for the ages",
      "You push each other to greatness",
    ],
    mid: [
      "A worthy opponent",
      "Frenemies at best",
      "You'd compete, maybe gracefully",
      "Casual rivalry energy",
    ],
    low: [
      "Not even worth competing with",
      "No rivalry here — just apathy",
      "You'd lose, but it wouldn't matter",
      "The competition is one-sided",
    ],
    fail: [
      "You're not even in the same league",
      "The universe doesn't care about this matchup",
      "Even the crowd is bored",
      "No contest",
    ],
  },
  business: {
    high: [
      "The startup duo nobody saw coming",
      "Synergy achieved",
      "You'd IPO together",
      "Power couple of the boardroom",
    ],
    mid: [
      "Consultation level achieved",
      "You could co-author a memo",
      "Professional acquaintance status",
      "You'd make a decent focus group",
    ],
    low: [
      "Keep the meetings short",
      "Your workflows are incompatible",
      "Email-only relationship",
      "Synergy: not found",
    ],
    fail: [
      "Liquidate the partnership",
      "Your KPIs are fundamentally opposed",
      "The shareholders voted no",
      "Restructuring recommended",
    ],
  },
};

export function pickTagline(mode: MatchMode, score: number): string {
  const bucket: Bucket =
    score >= 70 ? "high" : score >= 45 ? "mid" : score >= 20 ? "low" : "fail";
  const pool = TAGLINES[mode]?.[bucket] ?? TAGLINES.romance.mid;
  return pool[Math.floor(Math.random() * pool.length)];
}
