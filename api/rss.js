export default async function handler(req, res) {
  try {
    const SITEMAP = "https://www.gosswiler.com/sitemap.xml";

    const response = await fetch(SITEMAP, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error("Could not load sitemap");
    }

    const xml = await response.text();

    // extract <loc> + <lastmod>
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/g)]
      .map(m => ({
        url: m[1],
        date: m[2]
      }))
      .filter(e => e.url.includes("/blog/"))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    if (!urls.length) {
      throw new Error("No blog entries found");
    }

    const items = urls.map(post => `
<item>
<title>${post.url.split("/").filter(Boolean).pop().replace(/-/g, " ")}</title>
<link>${post.url}</link>
<guid>${post.url}</guid>
<pubDate>${new Date(post.date).toUTCString()}</pubDate>
<description>New blog post on gosswiler.com</description>
</item>
`).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts</description>
<language>de</language>
${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml");
    res.setHeader("Cache-Control", "no-store");

    res.status(200).send(rss);

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
