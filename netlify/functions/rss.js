export async function handler() {
  const atomUrl = "https://www.gosswiler.com/feed/";
  const atomText = await fetch(atomUrl).then(r => r.text());

  const parser = new DOMParser();
  const atom = parser.parseFromString(atomText, "text/xml");
  const entries = [...atom.getElementsByTagName("entry")];

  const items = entries.map(entry => {
    const title = entry.getElementsByTagName("title")[0]?.textContent || "";
    const summary = entry.getElementsByTagName("summary")[0]?.textContent || "";
    const link = entry.querySelector('link[rel="alternate"]')?.getAttribute("href") || "";
    const image = entry.getElementsByTagName("media:content")[0]?.getAttribute("url") || "";

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
