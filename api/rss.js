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

    // extract loc + lastmod
    const matches = [...xml.matchAll(
      /<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/g
    )];

    const posts = matches
      .map(m => ({
        url: m[1],
        date: m[2]
      }))
      .filter(p => p.url.match(/\/blog\/.+\//))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!posts.length) throw new Error("No blog posts");

    // ONLY newest post
    const post = posts[0];

    const title = post.url
      .split("/")
      .filter(Boolean)
      .pop()
      .replace(/-/g, " ");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest post</description>

<item>
<title><![CDATA[${title}]]></title>
<link>${post.url}</link>
<guid>${post.url}</guid>
<pubDate>${new Date(post.date).toUTCString()}</pubDate>
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
