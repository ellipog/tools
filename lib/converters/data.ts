import yaml from "js-yaml";

export const DATA_SOURCE_FORMATS = ["json", "csv", "yaml", "xml"] as const;
export const DATA_TARGET_FORMATS = ["json", "csv", "yaml", "xml", "sql"] as const;
export type DataSourceFormat = (typeof DATA_SOURCE_FORMATS)[number];
export type DataTargetFormat = (typeof DATA_TARGET_FORMATS)[number];

export interface DataOptions {
  delimiter?: string;
  hasHeader?: boolean;
  indent?: number;
  tableName?: string;
}

export interface ColumnStats {
  name: string;
  type: "string" | "number" | "boolean" | "null" | "mixed";
  nullCount: number;
}

export interface DataStats {
  rowCount: number;
  columns: ColumnStats[];
}

export function convertData(
  content: string,
  sourceFormat: DataSourceFormat,
  targetFormat: DataTargetFormat,
  options?: DataOptions,
): string {
  if (sourceFormat === targetFormat) {
    return sourceFormat === "json" ? formatJson(content, options?.indent) : content;
  }

  const parsed = parseSource(content, sourceFormat);
  return serializeTarget(parsed, targetFormat, options);
}

export function getDataStats(content: string, format: DataSourceFormat): DataStats {
  const parsed = parseSource(content, format);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  if (arr.length === 0) return { rowCount: 0, columns: [] };

  const keys = new Set<string>();
  for (const row of arr) {
    if (row && typeof row === "object") {
      Object.keys(row as Record<string, unknown>).forEach((k) => keys.add(k));
    }
  }

  const columns: ColumnStats[] = Array.from(keys).map((key) => {
    const values = arr.map((r) => (r as Record<string, unknown>)[key]);
    const nullCount = values.filter((v) => v === null || v === undefined || v === "").length;
    const nonNullTypes = new Set(values.filter((v) => v !== null && v !== undefined && v !== "").map((v) => typeof v));
    let type: ColumnStats["type"] = "string";
    if (nonNullTypes.size === 0) type = "null";
    else if (nonNullTypes.size === 1) {
      const t = nonNullTypes.values().next().value;
      if (t === "number") type = "number";
      else if (t === "boolean") type = "boolean";
      else type = "string";
    } else type = "mixed";
    return { name: key, type, nullCount };
  });

  return { rowCount: arr.length, columns };
}

function parseSource(content: string, format: DataSourceFormat): unknown {
  switch (format) {
    case "json":
      return JSON.parse(content);
    case "csv":
      return parseCsv(content);
    case "yaml":
      return yaml.load(content);
    case "xml":
      return parseXmlToObj(content);
  }
}

function serializeTarget(
  data: unknown,
  format: DataTargetFormat,
  options?: DataOptions,
): string {
  switch (format) {
    case "json":
      return formatJson(data, options?.indent);
    case "csv":
      return serializeCsv(data, {
        delimiter: options?.delimiter ?? ",",
        hasHeader: options?.hasHeader ?? true,
      });
    case "yaml":
      return yaml.dump(data, { indent: options?.indent ?? 2 });
    case "xml":
      return serializeObjToXml(data);
    case "sql":
      return serializeSql(data, options?.tableName ?? "data");
  }
}

function formatJson(data: unknown, indent = 2): string {
  return JSON.stringify(data, null, indent);
}

function parseCsv(text: string): unknown {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return [];
  const parseLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  };

  const header = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return rows.map((row) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = row[i] ?? "";
    });
    return obj;
  });
}

function serializeCsv(
  data: unknown,
  opts: { delimiter: string; hasHeader: boolean },
): string {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return "";
  const keys = Object.keys(arr[0] as Record<string, unknown>);
  const delim = opts.delimiter;
  const escape = (v: string) => {
    const s = String(v ?? "");
    return s.includes(delim) || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines: string[] = [];
  if (opts.hasHeader) lines.push(keys.map(escape).join(delim));
  for (const row of arr) {
    const r = row as Record<string, unknown>;
    lines.push(keys.map((k) => escape(String(r[k] ?? ""))).join(delim));
  }
  return lines.join("\n");
}

function serializeSql(data: unknown, tableName: string): string {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return `-- empty dataset`;
  const keys = Object.keys(arr[0] as Record<string, unknown>);

  const colTypes = keys.map((key) => {
    const vals = arr.map((r) => (r as Record<string, unknown>)[key]);
    const nonNull = vals.filter((v) => v !== null && v !== undefined && v !== "");
    if (nonNull.every((v) => typeof v === "number" && !Number.isNaN(v))) return `${quoteId(key)} REAL`;
    if (nonNull.every((v) => v === "true" || v === "false" || typeof v === "boolean")) return `${quoteId(key)} INTEGER`;
    return `${quoteId(key)} TEXT`;
  });

  const escapedTable = quoteId(tableName);
  const lines: string[] = [];
  lines.push(`CREATE TABLE IF NOT EXISTS ${escapedTable} (`);
  lines.push(`  ${colTypes.join(",\n  ")}`);
  lines.push(");");
  lines.push("");

  for (const row of arr) {
    const r = row as Record<string, unknown>;
    const vals = keys.map((k) => {
      const v = r[k];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "1" : "0";
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    lines.push(`INSERT INTO ${escapedTable} (${keys.map(quoteId).join(", ")}) VALUES (${vals.join(", ")});`);
  }

  return lines.join("\n");
}

function quoteId(id: string): string {
  return `"${id.replace(/"/g, '""')}"`;
}

function parseXmlToObj(xml: string): unknown {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const root = doc.documentElement;
  return xmlNodeToObj(root);
}

function xmlNodeToObj(node: Element): unknown {
  const obj: Record<string, unknown> = {};
  for (const child of node.children) {
    const key = child.tagName;
    const existing = obj[key];
    const val = child.children.length > 0
      ? xmlNodeToObj(child)
      : child.textContent ?? "";
    if (existing !== undefined) {
      obj[key] = Array.isArray(existing) ? [...existing, val] : [existing, val];
    } else {
      obj[key] = val;
    }
  }
  if (node.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      (obj["@attributes"] as Record<string, string>)[attr.name] = attr.value;
    }
  }
  return Object.keys(obj).length > 0 ? obj : (node.textContent ?? "");
}

function serializeObjToXml(data: unknown): string {
  const serializer = new XMLSerializer();
  const doc = document.implementation.createDocument(null, null, null);
  const root = doc.createElement("root");
  doc.appendChild(root);
  buildXmlNode(doc, root, data);
  return serializer.serializeToString(doc);
}

function buildXmlNode(
  doc: XMLDocument,
  parent: Element,
  data: unknown,
): void {
  if (data === null || data === undefined) return;
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    parent.textContent = String(data);
    return;
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      const child = doc.createElement("item");
      parent.appendChild(child);
      buildXmlNode(doc, child, item);
    }
    return;
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    for (const [key, val] of entries) {
      if (key === "@attributes") continue;
      if (Array.isArray(val)) {
        for (const item of val) {
          const child = doc.createElement(key);
          parent.appendChild(child);
          buildXmlNode(doc, child, item);
        }
      } else {
        const child = doc.createElement(key);
        parent.appendChild(child);
        buildXmlNode(doc, child, val);
      }
    }
  }
}
