export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";
    const baseUrl = "https://www.gosswiler.com";

    // 1) Sitemap streamen
    const response = await fetch(sitemapUrl);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    const blogs = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Solange vollständige <url>...</url> Blöcke vorhanden sind
      let start, end;
      while (
        (start = buffer.indexOf("<url>")) !== -1 &&
        (end = buffer.indexOf("</url>")) !== -1
      ) {
        const block = buffer.slice(start, end + 6);
        buffer = buffer.slice(end + 6);

        // loc extrahieren
        const locMatch = block.match(/<loc>(.*?)<\/loc>/);
        if (!locMatch) continue;

        const loc = locMatch[1].trim();

        // Nur echte Blog-Seiten (nicht /blog/ selbst)
        if (!loc.includes("/blog/") || loc.endsWith("/blog/")) continue;

        // lastmod extrahieren
        const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);
        const lastmod = lastmodMatch ? lastmodMatch[1].trim() : null;

        blogs.push({ loc, lastmod });
      }
    }

    if (blogs.length === 0) {
      throw new Error("No blog entries found in sitemap");
    }

    // 2) Neuester Blog nach lastmod
    blogs.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));
    const newest = blogs[0];

    // 3) Blog-Seite laden
    const html = await fetch(newest.loc).then(r => r.text());

    // OG-Meta per Regex extrahieren (kein Cheerio nötig)
    const title =
      html.match(/<meta property="og:title" content="(.*?)"/)?.[1] ||
      "Neuster Blog";

    const description =
      html.match(/<meta property="og:description" content="(.*?)"/)?.[1] ||
      "";

    const ogImage =
      html.match(/<meta property="og:image" content="(.*?)"/)?.[1] || "";

    const image = ogImage.startsWith("http")
      ? ogImage
      : baseUrl + ogImage;

    const pubDate = newest.lastmod
      ? new Date(newest.lastmod).toUTCString()
      : new Date().toUTCString();

    // 4) RSS erzeugen
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
