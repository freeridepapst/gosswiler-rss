export async function handler() {
  const apiUrl =
    "https://api.rss2json.com/v1/api.json?rss_url=https://www.gosswiler.com/feed/";

  const json = await fetch(apiUrl).then(r => r.json());

  if (!json.items) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "Feed konnte nicht geladen werden."
    };
  }

  const items = json.items.map(item => {
    const title = item.title || "";
    const link = item.link || "";
    const description = item.description || "";
    const image = item.thumbnail || "";
    const pubDate = item.pubDate || new Date().toUTCString();
    const guid = item.guid || link;

    return `
      <item>
        <title><![CDATA[${title}]]></title>
        <link>${link}</link>
        <guid isPermaLink="true">${guid}</guid>
        <pubDate>${pubDate}</pubDate>
        <description><![CDATA[${description}]]></description>
        ${image ? `<enclosure url="${image}" type="image/jpeg" />` : ""}
      </item>
    `;
  }).join("");

  const rss = `
    <rss version="2.0">
      <channel>
        <title><![CDATA[${json.feed.title}]]></title>
        <link>${json.feed.link}</link>
        <description><![CDATA[${json.feed.description}]]></description>
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
