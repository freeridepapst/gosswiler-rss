import fetch from "node-fetch";
import { XMLParser } from "fast-xml-parser";

const SITE = "https://www.gosswiler.com";
const SITEMAP = `${SITE}/sitemap.xml`;

export default async function handler(req, res) {
  try {
    const parser = new XMLParser();

    async function loadSitemap(url) {
      const xml = await fetch(url).then(r => r.text());
      return parser.parse(xml);
    }

    // Load main sitemap
    const root = await loadSitemap(SITEMAP);

    let urls = [];

    // Case 1: sitemap index
    if (root.sitemapindex?.sitemap) {
      for (const sm of root.sitemapindex.sitemap) {
        const child = await loadSitemap(sm.loc);
        if (child.urlset?.url) {
          urls.push(...child.urlset.url.map(u => u.loc));
        }
      }
    }

    // Case 2: plain sitemap
    if (root.urlset?.url) {
      urls.push(...root.urlset.url.map(u => u.loc));
    }

    // Filter blog posts
    const blogPosts = urls.filter(u =>
      u.includes("/blog/")
    );

    if (!blogPosts.length) {
      throw new Error("No blog entries found");
    }

    blogPosts.sort((a, b) => new Date(b) - new Date(a));

    const items = blogPosts.slice(0, 10).map(url => `
<item>
<title>${url.split("/").filter(Boolean).pop().replace(/-/g," ")}</title>
<link>${url}</link>
<guid>${url}</guid>
</item>
`).join("");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>Gosswiler Blog</title>
<link>${SITE}</link>
<description>Latest blog posts</description>
${items}
</channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(rss);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}
