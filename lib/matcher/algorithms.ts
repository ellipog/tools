import type { AlgorithmFn } from "./types";

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalize(n: number): number {
  return Math.max(0, Math.min(99, n));
}

export const ALGORITHMS: AlgorithmFn[] = [
  {
    id: "classic-sum",
    label: "Classic Sum",
    compute(nameA, nameB) {
      const sumA = [...nameA].reduce((s, c) => s + c.charCodeAt(0), 0);
      const sumB = [...nameB].reduce((s, c) => s + c.charCodeAt(0), 0);
      const total = sumA + sumB;
      const score = total % 100;
      const halfA = [...nameA]
        .slice(0, Math.ceil(nameA.length / 2))
        .reduce((s, c) => s + c.charCodeAt(0), 0);
      const halfB = [...nameB]
        .slice(0, Math.ceil(nameB.length / 2))
        .reduce((s, c) => s + c.charCodeAt(0), 0);
      return {
        score,
        raw: [
          halfA % 100,
          halfB % 100,
          (sumA * sumB) % 100,
          (sumA + sumB * 7) % 100,
        ].map(normalize),
      };
    },
  },
  {
    id: "letter-bond",
    label: "Letter Bond",
    compute(nameA, nameB) {
      const a = nameA.toLowerCase();
      const b = nameB.toLowerCase();
      const setA = new Set(a);
      const setB = new Set(b);
      const shared = [...setA].filter((l) => setB.has(l));
      const union = new Set([...setA, ...setB]);
      const score = Math.round(
        (shared.length / Math.max(union.size, 1)) * 100,
      );
      const vowelsA = [...a].filter((c) => "aeiou".includes(c));
      const vowelsB = [...b].filter((c) => "aeiou".includes(c));
      const sharedV = vowelsA.filter((v) => vowelsB.includes(v));
      const vowelScore =
        vowelsA.length || vowelsB.length
          ? Math.round(
              (sharedV.length /
                Math.max(Math.max(vowelsA.length, vowelsB.length), 1)) *
                100,
            )
          : 50;
      return {
        score,
        raw: [
          setA.size
            ? Math.round((shared.length / setA.size) * 100)
            : 50,
          setB.size
            ? Math.round((shared.length / setB.size) * 100)
            : 50,
          vowelScore,
          Math.round(
            (1 -
              Math.abs(nameA.length - nameB.length) /
                Math.max(nameA.length, nameB.length, 1)) *
              100,
          ),
        ].map(normalize),
      };
    },
  },
  {
    id: "zodiac-guess",
    label: "Zodiac Guess",
    compute(nameA, nameB) {
      const signIndex = (n: string) =>
        (n.length * (n.charCodeAt(0) || 1)) % 12;
      const sA = signIndex(nameA);
      const sB = signIndex(nameB);

      const element = (i: number) => Math.floor(i / 3);
      const modality = (i: number) => i % 3;
      const polarity = (i: number) => i % 2;

      let base = 50;
      if (element(sA) === element(sB)) base += 25;
      if (modality(sA) === modality(sB)) base += 10;
      if (polarity(sA) !== polarity(sB)) base += 10;

      const score = Math.min(99, base);

      const sameSign = sA === sB ? 90 : 10;
      const elMatch = element(sA) === element(sB) ? 80 : 20;
      const modMatch = modality(sA) === modality(sB) ? 70 : 30;
      const polMatch = polarity(sA) !== polarity(sB) ? 75 : 25;

      return {
        score,
        raw: [sameSign, elMatch, modMatch, polMatch].map(normalize),
      };
    },
  },
  {
    id: "fibonacci",
    label: "Fibonacci",
    compute(nameA, nameB) {
      const seed = hashCode(nameA + nameB) % 50 + 1;
      const fib = [seed, seed];
      for (let i = 2; i < 20; i++) {
        fib[i] = (fib[i - 1] + fib[i - 2]) % 100;
      }
      const score = fib[fib.length - 1];
      return {
        score,
        raw: [
          fib[5] % 100,
          fib[10] % 100,
          fib[15] % 100,
          (seed * 7) % 100,
        ].map(normalize),
      };
    },
  },
  {
    id: "vowel-dance",
    label: "Vowel Dance",
    compute(nameA, nameB) {
      const a = nameA.toLowerCase();
      const b = nameB.toLowerCase();
      const vowels = (s: string) => [...s].filter((c) => "aeiou".includes(c));
      const consonants = (s: string) =>
        [...s].filter((c) => /[a-z]/.test(c) && !"aeiou".includes(c));
      const vA = vowels(a);
      const vB = vowels(b);
      const cA = consonants(a);
      const cB = consonants(b);

      const maxV = Math.max(vA.length, vB.length);
      const vSim =
        maxV === 0
          ? 100
          : Math.round(
              (1 - Math.abs(vA.length - vB.length) / maxV) * 100,
            );
      const maxC = Math.max(cA.length, cB.length);
      const cSim =
        maxC === 0
          ? 100
          : Math.round(
              (1 - Math.abs(cA.length - cB.length) / maxC) * 100,
            );
      const ratioA =
        a.length > 0
          ? Math.round((vA.length / a.length) * 100)
          : 50;
      const ratioB =
        b.length > 0
          ? Math.round((vB.length / b.length) * 100)
          : 50;
      const ratioSim = Math.round(
        (1 - Math.abs(ratioA - ratioB) / 100) * 100,
      );

      const firstLast =
        a[0] === b[0] || a[a.length - 1] === b[b.length - 1] ? 80 : 30;

      const raw = [vSim, cSim, ratioSim, firstLast];
      const score = Math.round(raw.reduce((s, v) => s + v, 0) / raw.length);

      return { score, raw: raw.map(normalize) };
    },
  },
];

export function getAlgorithm(id: string): AlgorithmFn {
  return ALGORITHMS.find((a) => a.id === id) ?? ALGORITHMS[0];
}

export function pickRandomAlgorithm(): AlgorithmFn {
  return ALGORITHMS[Math.floor(Math.random() * ALGORITHMS.length)];
}
