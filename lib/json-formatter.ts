import yaml from "js-yaml";

export type FormatMode = "format" | "minify" | "yaml";

export interface FormatOptions {
  indentSize: number;
  useTabs: boolean;
  sortKeys: boolean;
  stripTrailingComma: boolean;
}

export interface FormatResult {
  success: boolean;
  output: string;
  error?: { message: string; line: number; col: number };
  stats: { size: number; lines: number; depth: number; keyCount: number };
}

export interface HighlightToken {
  text: string;
  color: string;
}

function getDepth(obj: unknown, current: number = 0): number {
  if (obj !== null && typeof obj === "object") {
    const children = Array.isArray(obj) ? obj : Object.values(obj as Record<string, unknown>);
    if (children.length === 0) return current;
    return Math.max(current, ...children.map((v) => getDepth(v, current + 1)));
  }
  return current;
}

function countKeys(obj: unknown): number {
  if (obj === null || typeof obj !== "object") return 0;
  if (Array.isArray(obj)) return obj.reduce<number>((sum, v) => sum + countKeys(v), 0);
  const o = obj as Record<string, unknown>;
  return Object.keys(o).length + Object.values(o).reduce<number>((sum, v) => sum + countKeys(v), 0);
}

function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  const o = obj as Record<string, unknown>;
  return Object.keys(o)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = sortObjectKeys(o[key]);
        return acc;
      },
      {} as Record<string, unknown>,
    );
}

function cleanupInput(raw: string): string {
  return raw
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

export function formatJSON(raw: string, mode: FormatMode, opts: FormatOptions): FormatResult {
  try {
    const cleaned = opts.stripTrailingComma ? cleanupInput(raw) : raw.trim();
    let parsed: unknown = JSON.parse(cleaned);

    if (opts.sortKeys) {
      parsed = sortObjectKeys(parsed);
    }

    let output: string;
    if (mode === "minify") {
      output = JSON.stringify(parsed);
    } else if (mode === "yaml") {
      output = yaml.dump(parsed, { indent: opts.indentSize, noRefs: true, lineWidth: -1 });
    } else {
      const indent = opts.useTabs ? "\t" : opts.indentSize;
      output = JSON.stringify(parsed, null, indent);
    }

    const depth = getDepth(parsed);
    const keyCount = countKeys(parsed);

    return {
      success: true,
      output,
      stats: {
        size: new TextEncoder().encode(output).length,
        lines: output.split("\n").length,
        depth,
        keyCount,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const lineCol = extractLineCol(msg, raw);
    return {
      success: false,
      output: msg,
      error: {
        message: msg,
        line: lineCol.line,
        col: lineCol.col,
      },
      stats: { size: 0, lines: 0, depth: 0, keyCount: 0 },
    };
  }
}

function extractLineCol(msg: string, raw: string): { line: number; col: number } {
  const m = msg.match(/position\s+(\d+)/i);
  if (m) {
    const pos = parseInt(m[1], 10);
    const before = raw.slice(0, pos);
    const line = before.split("\n").length;
    const lastNewline = before.lastIndexOf("\n");
    const col = pos - lastNewline;
    return { line, col };
  }
  return { line: 0, col: 0 };
}

export function tokenizeJSON(json: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let i = 0;

  while (i < json.length) {
    // Whitespace
    if (/^\s/.test(json[i])) {
      const start = i;
      while (i < json.length && /\s/.test(json[i])) i++;
      tokens.push({ text: json.slice(start, i), color: "" });
      continue;
    }

    // Key strings: "..." followed by optional whitespace then :
    if (json[i] === '"') {
      const strStart = i;
      i++;
      while (i < json.length) {
        if (json[i] === "\\") {
          i += 2;
        } else if (json[i] === '"') {
          i++;
          break;
        } else {
          i++;
        }
      }
      // Check if this string is a key (followed by :)
      let j = i;
      while (j < json.length && /\s/.test(json[j])) j++;
      if (j < json.length && json[j] === ":") {
        tokens.push({ text: json.slice(strStart, i), color: "text-cyan-300" });
        continue;
      } else {
        tokens.push({ text: json.slice(strStart, i), color: "text-lime-300" });
        continue;
      }
    }

    // Numbers
    if (/[-0-9]/.test(json[i])) {
      const start = i;
      if (json[i] === "-") i++;
      while (i < json.length && /[0-9]/.test(json[i])) i++;
      if (i < json.length && json[i] === ".") {
        i++;
        while (i < json.length && /[0-9]/.test(json[i])) i++;
      }
      if (i < json.length && /[eE]/.test(json[i])) {
        i++;
        if (i < json.length && /[+-]/.test(json[i])) i++;
        while (i < json.length && /[0-9]/.test(json[i])) i++;
      }
      tokens.push({ text: json.slice(start, i), color: "text-amber-300" });
      continue;
    }

    // Keywords
    if (/[a-zA-Z]/.test(json[i])) {
      const start = i;
      while (i < json.length && /[a-zA-Z]/.test(json[i])) i++;
      const word = json.slice(start, i);
      if (word === "true" || word === "false" || word === "null") {
        tokens.push({ text: word, color: "text-fuchsia-300" });
      } else {
        tokens.push({ text: word, color: "" });
      }
      continue;
    }

    // Single characters
    const ch = json[i];
    if (ch === "{" || ch === "}" || ch === "[" || ch === "]") {
      tokens.push({ text: ch, color: "text-white/80" });
    } else if (ch === ":" || ch === ",") {
      tokens.push({ text: ch, color: "text-white/30" });
    } else {
      tokens.push({ text: ch, color: "" });
    }
    i++;
  }

  return tokens;
}