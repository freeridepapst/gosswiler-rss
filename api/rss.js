import RSS from "rss";
import { XMLParser } from "fast-xml-parser";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  try {
    console.log("RSS generation started");

    // Disable ALL caching
    res.setHeader("Cache-Control", "no-store");

    const sitemapUrl = "https://www.gosswiler.com/sitemap.xml";

    const sitemapResponse = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "gosswiler-rss",
        "Cache-Control": "no-cache",
      },
    });

    if (!sitemapResponse.ok) {
      throw new Error("Failed to fetch sitemap");
    }

    const xml = await sitemapResponse.text();

    const parser = new XMLParser();
    const sitemap = parser.parse(xml);

    const urls =
      sitemap?.urlset?.url
        ?.map((u) => u.loc)
        ?.filter((u) => u.includes("/blog/")) || [];

    console.log("Found blog URLs:", urls.length);

    if (!urls.length) {
      return res.status(200).json({
        ok: false,
        error: "No blog entries found",
      });
    }

    const feed = new RSS({
      title: "Gosswiler Blog",
      description: "Latest blog posts from gosswiler.com",
      site_url: "https://www.gosswiler.com",
      feed_url: "https://gosswiler-rss.vercel.app/api/rss",
      language: "de",
    });

    for (const url of urls.slice(0, 20)) {
      try {
        feed.item({
          title: url.split("/").filter(Boolean).pop().replace(/-/g, " "),
          url,
          guid: url,
          description: "New blog post on gosswiler.com",
          date: new Date(),
        });
      } catch (itemError) {
        console.log("Item error:", url);
      }
    }

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(feed.xml({ indent: true }));
  } catch (e) {
    console.error("RSS ERROR:", e);

    return res.status(200).json({
      ok: false,
      error: e.message,
    });
  }
}
