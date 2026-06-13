"use server";

export async function getUrlMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        // This tells the website you're a "real" browser
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Access denied (Status ${response.status}). The site might be blocking automated requests.`,
      };
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";
    let charset = "utf-8";
    const charsetMatch = contentType.match(/charset=([\w-]+)/i);
    if (charsetMatch) charset = charsetMatch[1];

    const decoder = new TextDecoder(charset);
    const html = decoder.decode(buffer);

    // 2. Parse Structured Data (JSON-LD) - The Gold Standard for Modern Web
    const jsonLdData = extractJsonLd(html);

    // 3. Parse Meta Tags safely (handles attribute order variations)
    const metaTags = extractMetaTags(html);

    // 4. TITLE: Priority -> JSON-LD > OpenGraph > Twitter > <title> fallback
    let title =
      jsonLdData.title ||
      metaTags["og:title"] ||
      metaTags["twitter:title"] ||
      metaTags["citation_title"] ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
      "";

    // 5. AUTHORS: Priority -> JSON-LD > Meta Tags
    let author =
      jsonLdData.author ||
      metaTags["article:author"] ||
      metaTags["author"] ||
      metaTags["byl"] || // Common NYT/News tag
      metaTags["citation_author"] ||
      metaTags["sailthru.author"] ||
      "";

    // 6. SOURCE: Priority -> JSON-LD > OpenGraph > Domain
    const siteName =
      jsonLdData.publisher ||
      metaTags["og:site_name"] ||
      metaTags["citation_publisher"] ||
      metaTags["publisher"] ||
      new URL(url).hostname.replace(/^www\./, "");

    // 7. YEAR: Priority -> JSON-LD > Published Time > URL Structure
    const rawDate =
      jsonLdData.date ||
      metaTags["article:published_time"] ||
      metaTags["citation_publication_date"] ||
      metaTags["pubdate"] ||
      metaTags["date"] ||
      "";

    // Stop blindly matching \d{4} in the HTML. Extract strictly from valid dates or URL.
    let year = extractYearFromDate(rawDate);
    if (!year) {
      // Fallback: Check if the URL has a year in it (e.g., /2023/10/article)
      const urlYearMatch = url.match(/\/(19|20)\d{2}\//);
      if (urlYearMatch) year = urlYearMatch[1] + urlYearMatch[0].slice(3, 5);
    }

    return {
      success: true,
      data: {
        title: decodeAndClean(title),
        authors: decodeAndClean(author),
        source: decodeAndClean(siteName),
        year: year || null,
        url: url,
        retrievedFrom: "runen.no",
      },
    };
  } catch (error) {
    console.error("Scraper Error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to parse metadata",
    };
  }
}

// --- HELPER FUNCTIONS ---

/**
 * Extracts schema.org structured data. This is massively more accurate than meta tags
 * for authors, dates, and titles because it is machine-readable and standard across the web.
 */
function extractJsonLd(html: string) {
  const result = { title: "", author: "", date: "", publisher: "" };
  const regex =
    /<script type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        // Yoast SEO and others often wrap their JSON-LD in a @graph array
        const graph = item["@graph"] || [item];

        for (const node of graph) {
          const type = node["@type"];
          // Target article-like structured data
          if (
            type === "Article" ||
            type === "NewsArticle" ||
            type === "BlogPosting" ||
            type === "WebPage"
          ) {
            if (node.headline && !result.title) result.title = node.headline;
            if (node.datePublished && !result.date)
              result.date = node.datePublished;
            if (node.publisher?.name && !result.publisher)
              result.publisher = node.publisher.name;

            // Authors can be objects or arrays of objects
            if (node.author) {
              const authors = Array.isArray(node.author)
                ? node.author
                : [node.author];
              result.author = authors
                .map((a: any) => a.name)
                .filter(Boolean)
                .join(", ");
            }
          }
        }
      }
    } catch (e) {
      // Ignore JSON parse errors from malformed scripts
    }
  }
  return result;
}

/**
 * Safely extracts meta tags regardless of attribute order.
 * `<meta name="author" content="John">` and `<meta content="John" name="author">` both work.
 */
function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  // Matches <meta name="..." content="...">
  const regex1 =
    /<meta[^>]+(?:name|property)=["']([^"']+)["'][^>]+content=["']([^"']+)["']/gi;
  // Matches <meta content="..." name="...">
  const regex2 =
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']([^"']+)["']/gi;

  let match;
  while ((match = regex1.exec(html)) !== null)
    meta[match[1].toLowerCase()] = match[2];
  while ((match = regex2.exec(html)) !== null)
    meta[match[2].toLowerCase()] = match[1];

  return meta;
}

/**
 * Validates a date string and extracts the year, ensuring we don't return
 * random 4-digit numbers as years.
 */
function extractYearFromDate(dateString: string): string {
  if (!dateString) return "";

  // Try native date parsing
  const dateObj = new Date(dateString);
  if (!isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    // Sanity check: Ensure the year makes sense for the internet era
    if (year >= 1990 && year <= new Date().getFullYear() + 1) {
      return year.toString();
    }
  }

  // Fallback: Look for ISO-like dates (e.g., 2023-10-15) directly in the string
  const isoMatch = dateString.match(/\b(19|20)\d{2}\b/);
  return isoMatch ? isoMatch[0] : "";
}

/**
 * Enhanced HTML entity decoder that also trims and removes extra whitespace.
 */
function decodeAndClean(text: string): string {
  if (!text) return "";

  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&nbsp;": " ",
    "&mdash;": "—",
    "&ndash;": "–",
    "&#39;": "'",
    "&aelig;": "æ",
    "&AElig;": "Æ",
    "&oslash;": "ø",
    "&Oslash;": "Ø",
    "&aring;": "å",
    "&Aring;": "Å",
  };

  let cleaned = text.replace(/&[a-z\d#]+;/gi, (match) => {
    // Handle standard entities
    if (entities[match]) return entities[match];

    // Handle numeric entities like &#160; or &#x00A0;
    if (match.startsWith("&#x")) {
      return String.fromCharCode(parseInt(match.slice(3, -1), 16));
    } else if (match.startsWith("&#")) {
      return String.fromCharCode(parseInt(match.slice(2, -1), 10));
    }
    return match;
  });

  // Remove excessive spaces, newlines, and tabs often found in scraped titles
  return cleaned.replace(/\s+/g, " ").trim();
}
