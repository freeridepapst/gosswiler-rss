import { load } from "cheerio";

/**
 * CONFIG
 */
const SITEMAP_URL = "https://www.gosswiler.com/sitemap.xml";
const SITE_TITLE = "Gosswiler Blog";
const SITE_LINK = "https://www.gosswiler.com/blog/";
const SITE_DESCRIPTION = "Latest blog posts from gosswiler.com";
const LANGUAGE = "en";

// Only include posts newer than X days (safety net)
const MAX_AGE_DAYS = 120;
// Max number of items in feed
const MAX_ITEMS = 20;

/**
 * Helpers
 */
function humanizeSlug(slug) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isRecent(dateString) {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return new Date(dateString).getTime() >= cutoff;
}

/**
 * Handler
 */
export default async function handler(req, res) {
  try {
    const response = await fetch(SITEMAP_URL, {
      headers: {
        "User-Agent": "Gosswiler-RSS-Generator/1.0"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sitemap.xml");
    }

    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });

    let posts = [];

    $("url").each((_, el) => {
      const loc = $(el).find("loc").text().trim();
      const lastmod = $(el).find("lastmod").text().trim();

      if (
        loc.startsWith("https://www.gosswiler.com/blog/") &&
        !loc.endsWith("/blog/") &&
        lastmod &&
        isRecent(lastmod)
      ) {
        const slug = loc.split("/").filter(Boolean).pop();

        posts.push({
          url: loc,
          slug,
          title: humanizeSlug(slug),
          lastmod
        });
      }
    });

    if (posts.length === 0) {
      throw new Error("No blog posts found in sitemap");
    }

    // Newest first
    posts.sort(
      (a, b) => new Date(b.lastmod) - new Date(a.lastmod)
    );

    const items = posts.slice(0, MAX_ITEMS).map((p) => `
<item>
  <title><![CDATA[${p.title}]]></title>
  <link>${p.url}</link>
  <guid isPermaLink="true">${p.url}</guid>
  <pubDate>${new Date(p.lastmod).toUTCString()}</pubDate>
  <description><![CDATA[
  New blog post on gosswiler.com — click to read.
  ]]></description>
</item>`).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE_TITLE}</title>
  <link>${SITE_LINK}</link>
  <description>${SITE_DESCRIPTION}</description>
  <language>${LANGUAGE}</language>
  ${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.status(200).send(rss);

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
