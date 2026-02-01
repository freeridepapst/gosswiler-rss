import { load } from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";
    const baseUrl = "https://www.gosswiler.com";

    // 1) Sitemap laden
    const sitemapXml = await fetch(sitemapUrl).then(r => r.text());
    const $xml = load(sitemapXml, { xmlMode: true });

    const blogs = new Map(); // pro Blog-Ordner nur EIN Eintrag

    // 2) Alle <url>-Einträge durchgehen
    $xml("url").each((i, el) => {
      const loc = $xml(el).find("loc").text().trim();
      const lastmod = $xml(el).find("lastmod").text().trim();

      if (!loc.includes("/content/2.blog/")) return;

      // Beispiel: /content/2.blog/56.slug/irgendwas.jpg
      const match = loc.match(/\/2\.blog\/(\d+)\.([^/]+)\//);
      if (!match) return;

      const order = parseInt(match[1], 10);
      const slug = match[2];

      const key = `${order}.${slug}`;

      // Nur den neuesten lastmod pro Blog-Ordner behalten
      if (!blogs.has(key) || new Date(lastmod) > new Date(blogs.get(key).lastmod)) {
        blogs.set(key, {
          order,
          slug,
          imagePath: loc,
          lastmod
        });
      }
    });

    if (blogs.size === 0) {
      throw new Error("No blog entries found in sitemap");
    }

    // 3) Neuester Blog = höchste Nummer
    const newest = [...blogs.values()].sort((a, b) => b.order - a.order)[0];

    const blogUrl = `${baseUrl}/blog/${newest.slug}/`;
    const fallbackImage = newest.imagePath.startsWith("http")
      ? newest.imagePath
      : baseUrl + newest.imagePath;

    // 4) Blog-Seite laden und OG-Meta auslesen
    const blogHtml = await fetch(blogUrl).then(r => r.text());
    const $ = load(blogHtml);

    const ogTitle = $('meta[property="og:title"]').attr("content") || newest.slug;
    const ogDescription = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || fallbackImage;

    const image = ogImage.startsWith("http") ? ogImage : baseUrl + ogImage;

    const pubDate = newest.lastmod
      ? new Date(newest.lastmod).toUTCString()
      : new Date().toUTCString();

    // 5) RSS bauen
    const rss = `
      <rss version="2.0">
        <channel>
          <title><![CDATA[gosswiler.com – Blog]]></title>
          <link>${baseUrl}/blog/</link>
          <description><![CDATA[Neuster Blog von gosswiler.com]]></description>

          <item>
            <title><![CDATA[${ogTitle}]]></title>
            <link>${blogUrl}</link>
            <guid isPermaLink="true">${blogUrl}</guid>
            <pubDate>${pubDate}</pubDate>
            <description><![CDATA[${ogDescription}]]></description>
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
