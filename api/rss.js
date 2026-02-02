import fetch from "node-fetch";
import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const r = await fetch(sitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const xml = await r.text();

    const $ = cheerio.load(xml, {
      xmlMode: true
    });

    const entries = [];

    $("url").each((_, el) => {
      const loc = $(el).find("loc").text();
      const lastmod = $(el).find("lastmod").text();

      if (loc.includes("/blog/")) {
        entries.push({ loc, lastmod });
      }
    });

    res.status(200).json({
      totalUrls: $("url").length,
      blogPosts: entries.length,
      sample: entries.slice(0, 5)
    });

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
