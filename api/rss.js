import { load } from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";
    const baseUrl = "https://www.gosswiler.com";

    // 1) Sitemap laden
    const sitemapXml = await fetch(sitemapUrl).then(r => r.text());
    const $xml = load(sitemapXml, { xmlMode: true });

    const blogs = [];

    // 2) Alle <url>-Einträge durchgehen
    $xml("url").each((i, el) => {
      const loc = $xml(el).find("loc").text().trim();
      const lastmod = $xml(el).find("lastmod").text().trim();

      // Nur echte Blog-Seiten
      if (!loc.includes("/blog/")) return;

      blogs.push({
        url: loc,
        lastmod: lastmod || null
      });
    });

    if (blogs.length === 0) {
      throw new Error("No blog entries found in sitemap");
    }

    // 3) Neuester Blog nach lastmod
    blogs.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const newest = blogs[0];

    // 4) Blog-Seite laden
    const blogHtml = await fetch(newest.url).then(r => r.text());
    const $ = load(blogHtml);

    // 5) OG-Meta auslesen
    const title = $('meta[property="og:title"]').attr("content") || "Neuster Blog";
    const description = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    const image = ogImage.startsWith("http") ? ogImage : baseUrl + ogImage;

    const pubDate = newest.lastmod
      ? new Date(newest.lastmod).toUTCString()
      : new Date().toUTCString();

    // 6) RSS erzeugen
    const rss = `
      <rss version="2.0">
        <channel>
          <title><![CDATA[gosswiler.com – Blog]]></title>
          <link>${baseUrl}/blog/</link>
          <description><![CDATA[Neuster Blog von gosswiler.com]]></description>

          <item>
            <title><![CDATA[${title}]]></title>
            <link>${newest.url}</link>
            <guid isPermaLink="true">${newest.url}</guid>
            <pubDate>${pubDate}</pubDate>
            <description><![CDATA[${description}]]></description>
            <enclosure url="${image}" type="image/jpeg" />
          </item>

        </channel>
      </rss>
    `;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(rss.trim());
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
}
