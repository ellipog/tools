export type MatchMode = "romance" | "friendship" | "rivalry" | "business";
export type AlgorithmId = "classic-sum" | "letter-bond" | "zodiac-guess" | "fibonacci" | "vowel-dance";

export interface SubScore {
  label: string;
  value: number;
}

export interface MatchResult {
  score: number;
  subScores: SubScore[];
  tagline: string;
  algorithm: AlgorithmId;
  mode: MatchMode;
}

export interface AlgorithmFn {
  id: AlgorithmId;
  label: string;
  compute: (nameA: string, nameB: string) => { score: number; raw: number[] };
}

export const SUBSCORE_LABELS: Record<MatchMode, string[]> = {
  romance: ["passion", "trust", "chemistry", "chaos"],
  friendship: ["loyalty", "humor", "vibe", "weirdness"],
  rivalry: ["power", "cunning", "intensity", "respect"],
  business: ["synergy", "innovation", "grit", "vision"],
};
