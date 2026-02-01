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

      if (!loc.includes("/content/2.blog/")) return;

      // Beispiel: /content/2.blog/56.30-tage-sizilien-roadtrip/16-2.jpg
      const match = loc.match(/\/2\.blog\/(\d+)\.([^/]+)\//);
      if (!match) return;

      const order = parseInt(match[1], 10);
      const slug = match[2];

      const folderKey = `${order}.${slug}`;

      blogs.push({
        folderKey,
        order,
        slug,
        imagePath: loc,
        lastmod: lastmod || null
      });
    });

    if (blogs.length === 0) {
      throw new Error("No blog entries found in sitemap");
    }

    // 3) Neuester Blog: höchste Nummer
    blogs.sort((a, b) => b.order - a.order);
    const newest = blogs[0];

    const blogUrl = `${baseUrl}/blog/${newest.slug}/`;
    const fallbackImage = newest.imagePath.startsWith("http")
      ? newest.imagePath
      : baseUrl + newest.imagePath;

    // 4) Blog-Seite laden und OG-Meta auslesen
    const blogHtml = await fetch(blogUrl).then(r => r.text());
    const $ = load(blogHtml);

    const ogTitle = $('meta[property="og:title"]').attr("content") || "";
    const ogDescription = $('meta[property="og:description"]').attr("content") || "";
    const ogImage = $('meta[property="og:image"]').attr("content") || fallbackImage;

    const title = ogTitle || newest.slug;
    const description = ogDescription || "";
    const image = ogImage.startsWith("http") ? ogImage : baseUrl + ogImage;

    const pubDate = newest.lastmod
      ? new Date(newest.lastmod).toUTCString()
      : new Date().toUTCString();

    // 5) RSS bauen (nur ein Item: neuester Blog)
    const rss = `
      <rss version="2.0">
        <channel>
          <title><![CDATA[gosswiler.com – Blog]]></title>
          <link>${baseUrl}/blog/</link>
          <description><![CDATA[Neuster Blog von gosswiler.com]]></description>

          <item>
            <title><![CDATA[${title}]]></title>
            <link>${blogUrl}</link>
            <guid isPermaLink="true">${blogUrl}</guid>
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
