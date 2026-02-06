export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml?nocache=1";

    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/xml"
      }
    });

    const xml = await response.text();

    // extract all loc entries (ignore lastmod completely)
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map(m => m[1].trim())
      .filter(u => u.includes("/blog/") && u !== "https://www.gosswiler.com/blog/");

    if (!urls.length) throw new Error("No blog posts");

    // newest is LAST in imagevuex sitemap
    const newest = urls[urls.length - 1];

    const title = newest
      .split("/")
      .filter(Boolean)
      .pop()
      .replace(/-/g, " ");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog post</description>

<item>
<title><![CDATA[${title}]]></title>
<link>${newest}</link>
<guid>${newest}</guid>
<description><![CDATA[New blog post on gosswiler.com]]></description>
</item>

</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml");
    res.setHeader("Cache-Control", "no-store");

    res.status(200).send(rss);

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
