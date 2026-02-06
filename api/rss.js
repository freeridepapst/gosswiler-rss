export default async function handler(req, res) {
  try {
    const BLOG_INDEX = "https://www.gosswiler.com/blog/";

    const html = await fetch(BLOG_INDEX, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    }).then(r => r.text());

    // grab blog links
    const matches = [...html.matchAll(/href="(\/blog\/[^"]+\/)"/g)];

    const urls = [...new Set(matches.map(m => "https://www.gosswiler.com" + m[1]))]
      .filter(u => !u.endsWith("/blog/"))
      .slice(0, 15);

    if (!urls.length) throw new Error("No blog links");

    const items = urls.map(url => `
      <item>
        <title><![CDATA[${url.split("/").slice(-2, -1)[0].replace(/-/g," ")}]]></title>
        <link>${url}</link>
        <guid>${url}</guid>
        <description><![CDATA[New blog post on gosswiler.com — click to read.]]></description>
      </item>
    `).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>https://www.gosswiler.com/blog/</link>
<description>Latest blog posts from gosswiler.com</description>
${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(rss);

  } catch (err) {
    res.status(500).json({ ok:false, error: err.message });
  }
}
