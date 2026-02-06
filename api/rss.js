import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "gosswiler-rss-bot"
      },
      cache: "no-store"
    });

    const xml = await response.text();

    const $ = cheerio.load(xml, { xmlMode: true });

    const urls = [];

    $("url loc").each((_, el) => {
      const loc = $(el).text();
      if (loc.includes("/blog/")) urls.push(loc);
    });

    if (!urls.length) {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({ ok: true, blogPosts: 0 });
    }

    const items = urls
      .slice(-10)
      .reverse()
      .map(url => `
      <item>
        <title><![CDATA[${url.split("/").filter(Boolean).pop().replace(/-/g," ")}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <pubDate>${new Date().toUTCString()}</pubDate>
        <description><![CDATA[Neuer Blogpost auf gosswiler.com]]></description>
      </item>
    `).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
<title>gosswiler.com Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Neuste Blogposts von gosswiler.com</description>
${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "no-store");

    res.status(200).send(rss);

  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ ok: false, error: e.message });
  }
}
