import { load } from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (RSS Generator)"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sitemap");
    }

    const xml = await response.text();
    const $ = load(xml, { xmlMode: true });

    const posts = [];

    $("url").each((_, el) => {
      const loc = $(el).find("loc").text();
      const lastmod = $(el).find("lastmod").text();

      if (
        loc.startsWith("https://www.gosswiler.com/blog/") &&
        !loc.endsWith("/blog/")
      ) {
        posts.push({
          url: loc,
          lastmod: lastmod || new Date().toISOString()
        });
      }
    });

    if (posts.length === 0) {
      throw new Error("No blog posts found in sitemap");
    }

    // newest first
    posts.sort(
      (a, b) => new Date(b.lastmod) - new Date(a.lastmod)
    );

    const rssItems = posts
      .slice(0, 20)
      .map(
        (p) => `
<item>
  <title>${p.url.split("/").filter(Boolean).pop().replace(/-/g, " ")}</title>
  <link>${p.url}</link>
  <guid>${p.url}</guid>
  <pubDate>${new Date(p.lastmod).toUTCString()}</pubDate>
  <description>New blog post on gosswiler.com</description>
</item>`
      )
      .join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Gosswiler Blog</title>
  <link>https://www.gosswiler.com/blog/</link>
  <description>Latest blog posts from gosswiler.com</description>
  <language>en</language>
  ${rssItems}
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
