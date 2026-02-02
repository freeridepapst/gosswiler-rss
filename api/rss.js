import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const response = await fetch(sitemapUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const xml = await response.text();

    const $ = cheerio.load(xml, { xmlMode: true });

    const entries = [];

    $("url").each((_, el) => {
      const loc = $(el).find("loc").text();
      const lastmod = $(el).find("lastmod").text();

      if (loc.includes("/blog/")) {
        entries.push({ loc, lastmod });
      }
    });

    res.status(200).json({
      ok: true,
      totalUrls: $("url").length,
      blogPosts: entries.length,
      sample: entries.slice(0, 3)
    });

  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      stack: err.stack
    });
  }
}
