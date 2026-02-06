import { load } from "cheerio";

export default async function handler(req, res) {
  try {
    const FEED_URL = "https://www.gosswiler.com/feed/";

    const r = await fetch(FEED_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/xml"
      }
    });

    if (!r.ok) {
      return res.status(500).json({ ok: false, error: "Could not load atom feed" });
    }

    const xml = await r.text();

    const $ = load(xml, { xmlMode: true });

    const entries = $("entry");

    if (!entries.length) {
      return res.status(500).json({ ok: false, error: "No entries in atom feed" });
    }

    const items = [];

    entries.each((i, el) => {
      if (i >= 20) return false; // reicht für Brevo

      const title = $(el).find("title").text();
      const link = $(el).find("link").attr("href");
      const date = $(el).find("updated").text();

      if (!link.includes("/blog/")) return;

      items.push(`
<item>
<title><![CDATA[${title}]]></title>
<link>${link}</link>
<guid>${link}</guid>
<pubDate>${new Date(date).toUTCString()}</pubDate>
<description><![CDATA[New blog post on gosswiler.com — click to read.]]></description>
</item>
`);
    });

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts from gosswiler.com</description>
${items.join("")}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(rss);

  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
