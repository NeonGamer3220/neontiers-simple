// Proxy for Mojang UUID / name lookup to avoid CORS in the browser
export const dynamic = "force-dynamic";

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const username = (sp.get("username") || "").trim();
  const uuid = (sp.get("uuid") || "").trim().replace(/-/g, "");

  try {
    if (uuid && uuid.length === 32) {
      const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, {
        headers: { "Accept": "application/json" },
      });
      if (!res.ok) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
      const data = await res.json();
      return new Response(JSON.stringify({ id: data.id, name: data.name }), { status: 200, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    if (!username) return new Response(JSON.stringify({ error: "username or uuid required" }), { status: 400, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });

    const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}
