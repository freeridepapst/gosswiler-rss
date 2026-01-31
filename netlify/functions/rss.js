import { parseStringPromise } from "xml2js";

export async function handler() {
  const atomUrl = "https://www.gosswiler.com/feed/";
  const atomText = await fetch(atomUrl).then(r => r.text());

  // ATOM → JS-Objekt
  const atom = await parseStringPromise(atomText);

  const entries = atom.feed.entry || [];

  const items = entries.map(entry => {
    const title = entry.title?.[0] || "";
    const summary = entry.summary?.[0] || "";
    const link = entry.link?.find(l => l.$.rel === "alternate")?.$.href || "";
    const image = entry["media:content"]?.[0]?.$.url || "";

    return `
      <item>
        <title><![CDATA[${title}]]></title>
        <link>${link}</link>
        <description><![CDATA[${summary}]]></description>
        <enclosure url="${image}" type="image/jpeg" />
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
