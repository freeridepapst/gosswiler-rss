import { XMLParser } from "fast-xml-parser";

export default async function handler(req, res) {
  try {
    const SITEMAP = "https://www.gosswiler.com/sitemap.xml";

    const response = await fetch(SITEMAP, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Sitemap fetch failed");
    }

    const xml = await response.text();

    const parser = new XMLParser();
    const parsed = parser.parse(xml);

    let urls = parsed?.urlset?.url || [];

    if (!Array.isArray(urls)) urls = [urls];

    const blogPosts = urls
      .filter(u => u.loc.includes("/blog/"))
      .map(u => ({
        url: u.loc,
        lastmod: u.lastmod || new Date().toISOString()
      }))
      .sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod))
      .slice(0, 15);

    if (!blogPosts.length) {
      return res.status(200).json({
        ok: false,
        error: "No blog entries found",
        sitemapCount: urls.length
      });
    }

    const items = blogPosts.map(post => `
<item>
  <title>${post.url.split("/").filter(Boolean).pop().replace(/-/g," ")}</title>
  <link>${post.url}</link>
  <guid>${post.url}</guid>
  <pubDate>${new Date(post.lastmod).toUTCString()}</pubDate>
  <description>New blog post on gosswiler.com</description>
</item>
`).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts</description>
${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml");
    res.setHeader("Cache-Control", "no-store");

    res.status(200).send(rss);

  } catch (err) {
    console.error("RSS ERROR:", err);

    res.status(200).json({
      ok: false,
      message: err.message
    });
  }
}
