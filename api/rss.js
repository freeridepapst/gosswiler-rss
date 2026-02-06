export default async function handler(req, res) {
  try {
    const url = "https://www.gosswiler.com/sitemap.xml";

    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*"
      }
    });

    const text = await r.text();

    const locs = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

    res.status(200).json({
      ok: true,
      httpStatus: r.status,
      textSample: text.slice(0, 500),
      locCount: locs.length,
      first10: locs.slice(0, 10),
      last10: locs.slice(-10)
    });

  } catch (e) {
    res.status(200).json({
      ok: false,
      error: e.message
    });
  }
}
