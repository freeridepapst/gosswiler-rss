export async function handler() {
  const atomUrl = "https://www.gosswiler.com/feed/";
  const res = await fetch(atomUrl);
  const text = await res.text();

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: `STATUS: ${res.status}\n\nFIRST 2000 CHARS:\n\n` + text.slice(0, 2000)
  };
}
