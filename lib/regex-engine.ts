export interface RegexMatch {
  index: number;
  length: number;
  groups: (string | undefined)[];
  groupNames: (string | undefined)[];
}

export interface RegexResult {
  isValid: boolean;
  error?: string;
  matches: RegexMatch[];
  matchCount: number;
  groupCount: number;
  namedGroups: string[];
  elapsed: number;
  replacement?: string;
}

export interface TextSegment {
  text: string;
  isMatch: boolean;
  matchIndex?: number;
}

export const PRESETS = [
  { label: "Email", pattern: "[\\w.-]+@[\\w.-]+\\.\\w+", flags: "g", description: "user@example.com" },
  { label: "URL", pattern: "https?://[\\w./%-]+", flags: "g", description: "https://example.com" },
  { label: "Phone", pattern: "\\+?\\d{1,4}[\\s-]?\\(?\\d{1,4}\\)?[\\s-]?\\d{1,4}[\\s-]?\\d{1,9}", flags: "g", description: "+1 555-123-4567" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", description: "192.168.1.1" },
  { label: "Date ISO", pattern: "\\d{4}-\\d{2}-\\d{2}", flags: "g", description: "2026-06-11" },
  { label: "Hex Color", pattern: "#[0-9a-fA-F]{3,8}\\b", flags: "g", description: "#ff00aa" },
];

export function testRegex(
  pattern: string,
  flags: string,
  testStr: string,
  replacement?: string,
): RegexResult {
  if (!pattern) {
    return {
      isValid: true,
      matches: [],
      matchCount: 0,
      groupCount: 0,
      namedGroups: [],
      elapsed: 0,
    };
  }

  try {
    const start = performance.now();
    const re = new RegExp(pattern, flags);
    const matches: RegexMatch[] = [];
    let match: RegExpExecArray | null;
    let groupCount = 0;
    const namedGroups: string[] = [];
    const seenGroups = new Set<string>();

    while ((match = re.exec(testStr)) !== null) {
      const groups: (string | undefined)[] = [];
      for (let gi = 1; gi < match.length; gi++) {
        groups.push(match[gi]);
      }

      if (match.groups) {
        for (const name of Object.keys(match.groups)) {
          if (!seenGroups.has(name)) {
            seenGroups.add(name);
            namedGroups.push(name);
          }
        }
      }

      groupCount = Math.max(groupCount, match.length - 1);
      matches.push({
        index: match.index,
        length: match[0].length,
        groups,
        groupNames: Array.from({ length: match.length - 1 }, (_, i) => `$${i + 1}`),
      });

      if (!re.global && !re.sticky) break;
    }

    const elapsed = performance.now() - start;
    let replacementResult: string | undefined;
    if (replacement !== undefined && replacement !== "") {
      const re2 = new RegExp(pattern, flags.includes("g") ? flags : "g" + flags);
      replacementResult = testStr.replace(re2, replacement);
    }

    return {
      isValid: true,
      matches,
      matchCount: matches.length,
      groupCount,
      namedGroups,
      elapsed: Math.round(elapsed * 100) / 100,
      replacement: replacementResult,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      error: msg,
      matches: [],
      matchCount: 0,
      groupCount: 0,
      namedGroups: [],
      elapsed: 0,
    };
  }
}

export function segmentText(text: string, matches: RegexMatch[]): TextSegment[] {
  if (!text || matches.length === 0) {
    return [{ text, isMatch: false }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (let mi = 0; mi < matches.length; mi++) {
    const m = matches[mi];
    if (m.index > cursor) {
      segments.push({ text: text.slice(cursor, m.index), isMatch: false });
    }
    segments.push({ text: text.slice(m.index, m.index + m.length), isMatch: true, matchIndex: mi });
    cursor = m.index + m.length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }

  return segments;
}

const MATCH_COLORS = [
  "bg-green-500/20",
  "bg-blue-500/20",
  "bg-yellow-500/20",
  "bg-purple-500/20",
  "bg-pink-500/20",
];

export function getMatchColor(index: number): string {
  return MATCH_COLORS[index % MATCH_COLORS.length];
}