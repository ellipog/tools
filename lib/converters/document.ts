import { marked } from "marked";

export const DOCUMENT_FORMATS = ["markdown", "html", "txt"] as const;
export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number];

export interface DocStats {
  wordCount: number;
  charCount: number;
  lineCount: number;
  paragraphCount: number;
}

export type CaseMode = "upper" | "lower" | "title" | "sentence" | "camel" | "snake" | "kebab";

export async function convertDocument(
  content: string,
  sourceFormat: DocumentFormat,
  targetFormat: DocumentFormat,
): Promise<string> {
  if (sourceFormat === targetFormat) return content;

  switch (`${sourceFormat}->${targetFormat}`) {
    case "markdown->html":
      return marked.parse(content, { async: false }) as string;
    case "markdown->txt":
      return stripHtml(await convertDocument(content, "markdown", "html"));
    case "html->txt":
      return stripHtml(content);
    case "html->markdown":
      return htmlToMarkdown(content);
    case "txt->html":
      return `<pre>${escapeHtml(content)}</pre>`;
    case "txt->markdown":
      return content;
    default:
      throw new Error(`Unsupported conversion: ${sourceFormat} → ${targetFormat}`);
  }
}

export function getDocStats(text: string): DocStats {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/[\s\n]+/).filter(Boolean) : [];
  return {
    wordCount: words.length,
    charCount: text.length,
    lineCount: text.split("\n").length,
    paragraphCount: trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0,
  };
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "sentence":
      return text.replace(/(^\s*\w)|([.!?]\s*\w)/g, (c) => c.toUpperCase());
    case "camel":
      return text
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^[A-Z]/, (c) => c.toLowerCase());
    case "snake":
      return text
        .replace(/([A-Z])/g, "_$1")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .toLowerCase();
    case "kebab":
      return text
        .replace(/([A-Z])/g, "-$1")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
  }
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(
    `<root>${html}</root>`,
    "text/html",
  );
  return convertNode(doc.body.firstChild ?? doc.body);
}

function convertNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(el.childNodes).map(convertNode).join("");

    switch (tag) {
      case "h1": return `# ${inner}\n\n`;
      case "h2": return `## ${inner}\n\n`;
      case "h3": return `### ${inner}\n\n`;
      case "h4": return `#### ${inner}\n\n`;
      case "h5": return `##### ${inner}\n\n`;
      case "h6": return `###### ${inner}\n\n`;
      case "p": return `${inner}\n\n`;
      case "br": return "\n";
      case "hr": return "---\n\n";
      case "strong":
      case "b": return `**${inner}**`;
      case "em":
      case "i": return `*${inner}*`;
      case "code": return `\`${inner}\``;
      case "pre": return `\`\`\`\n${inner}\n\`\`\`\n\n`;
      case "a": {
        const href = el.getAttribute("href") ?? "";
        return href ? `[${inner}](${href})` : inner;
      }
      case "img": {
        const src = el.getAttribute("src") ?? "";
        const alt = el.getAttribute("alt") ?? "";
        return `![${alt}](${src})`;
      }
      case "ul": return `${inner}\n`;
      case "ol": return `${inner}\n`;
      case "li": {
        const parent = el.parentElement?.tagName.toLowerCase();
        return parent === "ol" ? `1. ${inner}\n` : `- ${inner}\n`;
      }
      case "blockquote": return `> ${inner.trim()}\n\n`;
      default: return inner;
    }
  }
  return "";
}
