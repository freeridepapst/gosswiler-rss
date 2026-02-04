export default async function handler(req, res) {
  // HARD disable all caching (critical for Brevo)
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const xml = await fetch(sitemapUrl).then(r => r.text());

    // extract URLs + lastmod from sitemap
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>[\s\S]*?<lastmod>(.*?)<\/lastmod>/g)]
      .map(m => ({
        url: m[1],
        lastmod: m[2]
      }))
      .filter(x => x.url.includes("/blog/") && !x.url.endsWith("/blog/"));

    if (!urls.length) throw new Error("No blog entries found");

    // newest first
    urls.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));

    const items = urls.slice(0, 20).map(post => {
      const slug = post.url.split("/").filter(Boolean).pop();
      const title = slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());

      return `
<item>
  <title><![CDATA[${title}]]></title>
  <link>${post.url}</link>
  <guid isPermaLink="true">${post.url}</guid>
  <pubDate>${new Date(post.lastmod).toUTCString()}</pubDate>
  <description><![CDATA[New blog post on gosswiler.com — click to read.]]></description>
</item>`;
    }).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts from gosswiler.com</description>
<language>en</language>
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
