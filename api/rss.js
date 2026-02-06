import posts from "../posts.json" assert { type: "json" };

export default function handler(req, res) {

  const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${p.link}</link>
      <guid>${p.link}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[New blog post on gosswiler.com]]></description>
    </item>
  `).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest posts from gosswiler.com</description>
<language>de</language>
${items}
</channel>
</rss>`;

  res.setHeader("Content-Type", "application/xml");
  res.status(200).send(rss);
}
