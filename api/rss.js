export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      throw new Error("Could not load sitemap");
    }

    const xml = await response.text();

    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map(m => m[1])
      .filter(u => u.includes("/blog/") && !u.endsWith("/blog/"));

    if (!urls.length) {
      return res.json({ ok: false, error: "No blog posts" });
    }

    // newest last
    const latest = urls[urls.length - 1];

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts</description>

<item>
<title>New blog post</title>
<link>${latest}</link>
<guid>${latest}</guid>
<description>New blog post on gosswiler.com</description>
</item>

</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml");
    res.send(rss);

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
