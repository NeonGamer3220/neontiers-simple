// Proxy for Mojang UUID / name lookup to avoid CORS in the browser.
// Mojang profile data (name <-> UUID) rarely changes, so we cache
// aggressively both on Vercel's edge/CDN and in Next's fetch cache —
// this is what makes repeated "refresh name" clicks on the same player
// near-instant instead of round-tripping to Mojang every time.
export const revalidate = 3600;

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const username = (sp.get("username") || "").trim();
  const uuid = (sp.get("uuid") || "").trim().replace(/-/g, "");

  const CACHE_HEADERS = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  };

  try {
    if (uuid && uuid.length === 32) {
      const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, {
        headers: { "Accept": "application/json" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: CACHE_HEADERS });
      const data = await res.json();
      return new Response(JSON.stringify({ id: data.id, name: data.name }), { status: 200, headers: CACHE_HEADERS });
    }

    if (!username) return new Response(JSON.stringify({ error: "username or uuid required" }), { status: 400, headers: CACHE_HEADERS });

    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: CACHE_HEADERS });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers: CACHE_HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CACHE_HEADERS });
  }
}
