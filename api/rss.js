export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml?nocache=1";

    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (RSS Bot)",
        "Accept": "application/xml,text/xml"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Sitemap fetch failed");
    }

    const xml = await response.text();

    if (!xml.includes("<urlset")) {
      throw new Error("Invalid XML (Cloudflare page)");
    }

    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map(m => m[1])
      .filter(u => u.includes("/blog/") && !u.match(/\.(jpg|png|webp)$/));

    if (!urls.length) {
      throw new Error("No blog entries found");
    }

    const items = urls.slice(0, 20).map(link => {
      const slug = link.split("/").filter(Boolean).pop().replace(/-/g, " ");

      return `
<item>
<title><![CDATA[${slug}]]></title>
<link>${link}</link>
<guid>${link}</guid>
<description><![CDATA[New blog post on gosswiler.com — click to read.]]></description>
</item>`;
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts from gosswiler.com</description>
${items.join("\n")}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml");
    res.status(200).send(rss);

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
