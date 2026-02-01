import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const url = "https://www.gosswiler.com/blog/";

  const html = await fetch(url).then(r => r.text());
  const $ = cheerio.load(html);

  // Alle Blog-Einträge aus dem Menü extrahieren
  const items = [];

  $('li[data-options]').each((i, el) => {
    const data = $(el).attr("data-options") || "";
    const link = $(el).find("a").attr("href");

    // title:
    const titleMatch = data.match(/title:(.*?);/);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // description:
    const descMatch = data.match(/description:(.*?);/s);
    const description = descMatch ? descMatch[1].trim() : "";

    // preview image:
    const previewMatch = data.match(/preview:(.*?);/);
    const preview = previewMatch ? previewMatch[1].trim() : "";

    // Datum aus dem Slug extrahieren (z. B. 56.30-tage-sizilien-roadtrip)
    // Format: /content/2.blog/56.xyz/  → 56 = Reihenfolge
    const orderMatch = preview.match(/\/2\.blog\/(\d+)\./);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 0;

    items.push({
      title,
      description,
      link: "https://www.gosswiler.com" + link,
      image: "https://www.gosswiler.com" + preview,
      order
    });
  });

  // Neuester Blog = höchster "order"-Wert
  const newest = items.sort((a, b) => b.order - a.order)[0];

  const rss = `
    <rss version="2.0">
      <channel>
        <title><![CDATA[gosswiler.com – Blog]]></title>
        <link>https://www.gosswiler.com/blog/</link>
        <description><![CDATA[Neuste Blogs von gosswiler.com]]></description>

        <item>
          <title><![CDATA[${newest.title}]]></title>
          <link>${newest.link}</link>
          <guid isPermaLink="true">${newest.link}</guid>
          <pubDate>${new Date().toUTCString()}</pubDate>
          <description><![CDATA[${newest.description}]]></description>
          <enclosure url="${newest.image}" type="image/jpeg" />
        </item>

      </channel>
    </rss>
  `;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(rss);
}
