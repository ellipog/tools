import { diffLines, diffWords, diffChars, type Change } from "diff";

export type DiffGranularity = "line" | "word" | "char";

export type DiffMode = "side-by-side" | "unified" | "inline";

export interface DiffOptions {
  ignoreWhitespace: boolean;
  caseSensitive: boolean;
}

export interface DiffStats {
  added: number;
  removed: number;
  changed: number;
  similarity: number;
}

export interface DiffResult {
  changes: Change[];
  stats: DiffStats;
}

export interface SideBySideLine {
  left: { text: string; type: "add" | "rem" | "same" | "empty" };
  right: { text: string; type: "add" | "rem" | "same" | "empty" };
}

export interface UnifiedLine {
  prefix: " " | "+" | "-";
  text: string;
}

export interface InlineWord {
  text: string;
  type: "add" | "rem" | "same";
}

export interface InlineLine {
  prefix: " " | "+" | "-";
  text: string;
  words?: InlineWord[];
}

function preprocess(text: string, opts: DiffOptions): string {
  let t = text;
  if (!opts.caseSensitive) t = t.toLowerCase();
  if (opts.ignoreWhitespace) {
    t = t.replace(/[ \t]+/g, " ").replace(/^\s+|\s+$/gm, "").trimEnd();
  }
  return t;
}

export function computeDiff(
  oldText: string,
  newText: string,
  granularity: DiffGranularity,
  opts: DiffOptions,
): DiffResult {
  const a = preprocess(oldText, opts);
  const b = preprocess(newText, opts);

  let changes: Change[];
  switch (granularity) {
    case "line":
      changes = diffLines(a, b);
      break;
    case "word":
      changes = diffWords(a, b);
      break;
    case "char":
      changes = diffChars(a, b);
      break;
  }

  const added = changes
    .filter((c) => c.added)
    .reduce((sum, c) => sum + (c.count ?? 0), 0);
  const removed = changes
    .filter((c) => c.removed)
    .reduce((sum, c) => sum + (c.count ?? 0), 0);
  const unchanged = changes
    .filter((c) => !c.added && !c.removed)
    .reduce((sum, c) => sum + (c.count ?? 0), 0);
  const total = added + removed + unchanged;
  const similarity = total > 0 ? Math.round((unchanged / total) * 100) : 100;

  return {
    changes,
    stats: { added, removed, changed: Math.min(added, removed), similarity },
  };
}

export function toSideBySide(changes: Change[]): SideBySideLine[] {
  const lines: SideBySideLine[] = [];
  for (const change of changes) {
    const vals = change.value.split("\n");
    const last = vals.pop()!;
    for (const v of vals) {
      if (change.added) {
        lines.push({
          left: { text: "", type: "empty" },
          right: { text: v, type: "add" },
        });
      } else if (change.removed) {
        lines.push({
          left: { text: v, type: "rem" },
          right: { text: "", type: "empty" },
        });
      } else {
        lines.push({
          left: { text: v, type: "same" },
          right: { text: v, type: "same" },
        });
      }
    }
  }
  return lines;
}

export function toUnified(changes: Change[]): UnifiedLine[] {
  const lines: UnifiedLine[] = [];
  for (const change of changes) {
    const vals = change.value.split("\n");
    const last = vals.pop()!;
    for (const v of vals) {
      if (change.added) {
        lines.push({ prefix: "+", text: v });
      } else if (change.removed) {
        lines.push({ prefix: "-", text: v });
      } else {
        lines.push({ prefix: " ", text: v });
      }
    }
  }
  return lines;
}

export function toInline(changes: Change[]): InlineLine[] {
  const lines: InlineLine[] = [];
  for (const change of changes) {
    const vals = change.value.split("\n");
    const last = vals.pop()!;
    for (const v of vals) {
      if (change.added || change.removed) {
        const wordChanges = diffWords(
          change.removed ? v : "",
          change.added ? v : "",
        );
        const words: InlineWord[] = [];
        for (const wc of wordChanges) {
          if (wc.added) words.push({ text: wc.value, type: "add" });
          else if (wc.removed) words.push({ text: wc.value, type: "rem" });
          else words.push({ text: wc.value, type: "same" });
        }
        lines.push({
          prefix: change.added ? "+" : "-",
          text: v,
          words,
        });
      } else {
        lines.push({ prefix: " ", text: v });
      }
    }
  }
  return lines;
}

export function formatPatch(changes: Change[]): string {
  return changes
    .flatMap((c) => {
      const prefix = c.added ? "+" : c.removed ? "-" : " ";
      return c.value
        .split("\n")
        .slice(0, -1)
        .map((line) => `${prefix}${line}`);
    })
    .join("\n");
}