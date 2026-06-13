export const SETS = {
  upper: {
    chars: "ABCDEFGHJKLMNPQRSTUVWXYZ",
    ambiguousExcluded: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  },
  lower: {
    chars: "abcdefghjkmnpqrstuvwxyz",
    ambiguousExcluded: "abcdefghjkmnpqrstuvwxyz",
  },
  digits: {
    chars: "23456789",
    ambiguousExcluded: "23456789",
  },
  symbols: {
    chars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambiguousExcluded: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
} as const;

type SetKey = keyof typeof SETS;

function getCharPool(sets: Record<SetKey, boolean>, excludeAmbiguous: boolean): string {
  return (Object.keys(SETS) as SetKey[])
    .filter((k) => sets[k])
    .map((k) => (excludeAmbiguous ? SETS[k].ambiguousExcluded : SETS[k].chars))
    .join("");
}

export interface PasswordResult {
  password: string;
  strength: "weak" | "medium" | "strong" | "very-strong";
  entropy: number;
}

export function generatePassword(
  length: number,
  sets: Record<SetKey, boolean>,
  excludeAmbiguous: boolean,
): PasswordResult {
  const pool = getCharPool(sets, excludeAmbiguous);
  const poolSize = pool.length;

  const entropy = Math.round(length * Math.log2(poolSize) * 10) / 10;

  let strength: PasswordResult["strength"];
  if (entropy < 30) strength = "weak";
  else if (entropy < 50) strength = "medium";
  else if (entropy < 80) strength = "strong";
  else strength = "very-strong";

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const passwordChars = Array.from(array).map((v) => pool[v % poolSize]);

  const enabledSets = (Object.keys(sets) as SetKey[]).filter((k) => sets[k]);
  for (const key of enabledSets) {
    const validChars = excludeAmbiguous ? SETS[key].ambiguousExcluded : SETS[key].chars;
    if (!passwordChars.some((c) => validChars.includes(c))) {
      const idx = Math.floor(Math.random() * length);
      passwordChars[idx] = validChars[Math.floor(Math.random() * validChars.length)];
    }
  }

  return {
    password: passwordChars.join(""),
    strength,
    entropy,
  };
}

export function getStrengthColor(strength: PasswordResult["strength"]): string {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "medium":
      return "bg-orange-500";
    case "strong":
      return "bg-yellow-500";
    case "very-strong":
      return "bg-green-500";
  }
}

export function getStrengthBarWidth(entropy: number): number {
  return Math.min(Math.round((entropy / 120) * 100), 100);
}
