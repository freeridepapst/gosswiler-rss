import { parseStringPromise } from "xml2js";
import { load } from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";
    const baseUrl = "https://www.gosswiler.com";

    // 1) Sitemap laden
    const xml = await fetch(sitemapUrl).then(r => r.text());

    // 2) XML korrekt parsen (xml2js ignoriert Namespaces automatisch)
    const parsed = await parseStringPromise(xml);

    // 3) Alle URL-Einträge extrahieren
    const urls = parsed.urlset.url;

    // 4) Nur Blog-URLs filtern
    const blogs = urls
      .map(u => ({
        loc: u.loc[0],
        lastmod: u.lastmod ? u.lastmod[0] : null
      }))
      .filter(u => u.loc.includes("/blog/") && u.loc !== `${baseUrl}/blog/`);

    if (blogs.length === 0) {
      throw new Error("No blog entries found in sitemap");
    }

    // 5) Neuester Blog nach lastmod
    blogs.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const newest = blogs[0];

    // 6) Blog-Seite laden
    const blogHtml = await fetch(newest.loc).then(r => r.text());
    const $ = load(blogHtml);

    // 7) OG-Meta auslesen
    const title = $('meta[property="og:title"]').attr("content") || "Neuster Blog";
    const description = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || "";
    const image = ogImage.startsWith("http") ? ogImage : baseUrl + ogImage;

    const pubDate = newest.lastmod
      ? new Date(newest.lastmod).toUTCString()
      : new Date().toUTCString();

    // 8) RSS erzeugen
    const rss = `
      <rss version="2.0">
        <channel>
          <title><![CDATA[gosswiler.com – Blog]]></title>
          <link>${baseUrl}/blog/</link>
          <description><![CDATA[Neuster Blog von gosswiler.com]]></description>

          <item>
            <title><![CDATA[${title}]]></title>
            <link>${newest.loc}</link>
            <guid isPermaLink="true">${newest.loc}</guid>
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
