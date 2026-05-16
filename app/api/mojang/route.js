// Proxy for Mojang UUID / name lookup to avoid CORS in the browser
export const dynamic = "force-dynamic";

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const username = (sp.get("username") || "").trim();
  if (!username) return new Response(JSON.stringify({ error: "username required" }), { status: 400, headers: { "content-type": "application/json" } });

  try {
    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
