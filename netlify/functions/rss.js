export async function handler() {
  const atomUrl = "https://www.gosswiler.com/feed/";
  const atomText = await fetch(atomUrl).then(r => r.text());

  // Entfernt Namespaces wie <entry xmlns="...">
  const cleanXml = atomText.replace(/xmlns(:\w+)?="[^"]*"/g, "");

  // Alle <entry> Blöcke extrahieren
  const entries = cleanXml.split("<entry>").slice(1).map(e => "<entry>" + e);

  const extractTag = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  };

  const extractLink = xml => {
    const match = xml.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/);
    return match ? match[1] : "";
  };

  const extractImage = xml => {
    const media = xml.match(/<media:content[^>]*url="([^"]+)"/);
    if (media) return media[1];

    const thumb = xml.match(/<media:thumbnail[^>]*url="([^"]+)"/);
    if (thumb) return thumb[1];

    return "";
  };

  const items = entries.map(entry => {
    const title = extractTag(entry, "title");
    const summary = extractTag(entry, "summary");
    const link = extractLink(entry);
    const image = extractImage(entry);

    return `
      <item>
        <title><![CDATA[${title}]]></title>
        <link>${link}</link>
        <description><![CDATA[${summary}]]></description>
        ${image ? `<enclosure url="${image}" type="image/jpeg" />` : ""}
      </item>
    `;
  }).join("");

  const rss = `
    <rss version="2.0">
      <channel>
        <title>Gosswiler Blog</title>
        <link>https://www.gosswiler.com/</link>
        <description>Automatischer RSS Feed für Brevo</description>
        ${items}
      </channel>
    </rss>
  `;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/xml" },
    body: rss
  };
}
