export async function handler() {
  const rssUrl = "https://www.gosswiler.com/feed/";
  const rssText = await fetch(rssUrl).then(r => r.text());

  // Minimaler XML-Parser
  const extractAll = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g");
    return [...xml.matchAll(regex)].map(m => m[1].trim());
  };

  const extractOne = (xml, tag) => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
  };

  const extractImage = xml => {
    // WordPress liefert oft <media:content url="...">
    const media = xml.match(/<media:content[^>]*url="([^"]+)"/);
    if (media) return media[1];

    // oder im content:encoded ein <img>
    const img = xml.match(/<img[^>]*src="([^"]+)"/);
    if (img) return img[1];

    return "";
  };

  // Alle <item>-Blöcke extrahieren
  const itemsRaw = extractAll(rssText, "item");

  const items = itemsRaw.map(item => {
    const title = extractOne(item, "title");
    const description = extractOne(item, "description");
    const link = extractOne(item, "link");
    const image = extractImage(item);

    return `
      <item>
        <title><![CDATA[${title}]]></title>
        <link>${link}</link>
        <description><![CDATA[${description}]]></description>
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
