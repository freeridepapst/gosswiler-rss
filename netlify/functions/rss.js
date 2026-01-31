export async function handler() {
  const atomUrl = "https://www.gosswiler.com/feed/";
  const atomText = await fetch(atomUrl).then(r => r.text());

  // Minimaler XML-Parser für Node (DOMParser existiert nicht)
  const parseTag = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g");
    const matches = [...xml.matchAll(regex)];
    return matches.map(m => m[1].trim());
  };

  const parseAttribute = (xml, tag, attr) => {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"[^>]*>`, "g");
    const matches = [...xml.matchAll(regex)];
    return matches.map(m => m[1]);
  };

  // Einträge extrahieren
  const entries = atomText.split("<entry>").slice(1).map(e => "<entry>" + e);

  const items = entries.map(entry => {
    const title = parseTag(entry, "title")[0] || "";
    const summary = parseTag(entry, "summary")[0] || "";

    // Link mit rel="alternate"
    const linkMatch = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/);
    const link = linkMatch ? linkMatch[1] : "";

    // Bild aus media:content
    const imageMatch = entry.match(/<media:content[^>]*url="([^"]+)"/);
    const image = imageMatch ? imageMatch[1] : "";

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
        <link>https://www.gosswiler.com/blog/</link>
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
