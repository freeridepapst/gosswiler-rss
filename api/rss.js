import cheerio from "cheerio";

export default async function handler(req, res) {
  const url = "https://www.gosswiler.com/blog/";

  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const html = await r.text();

  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(html.substring(0, 3000));
}
