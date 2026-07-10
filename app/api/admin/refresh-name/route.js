// app/api/admin/refresh-name/route.js
// Looks up a player's CURRENT Minecraft name straight from Mojang's session
// server using their UUID (UUIDs never change, so this is always accurate
// even after an in-game name change nobody told the site about).
// If the linked_accounts row doesn't have a stored UUID yet, we resolve it
// once from the currently-stored name and save it for next time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || !session.value) return null;
  try {
    return JSON.parse(session.value);
  } catch {
    return null;
  }
}

export async function POST(req) {
  if (!supabase) return json({ error: "Supabase nincs konfigurálva" }, 500);

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Érvénytelen JSON" }, 400);
  }

  const id = body.id;
  if (!id) return json({ error: "id kötelező (linked_accounts sor id-ja)" }, 400);

  const { data: row, error: fetchErr } = await supabase
    .from("linked_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!row) return json({ error: "Nincs ilyen linked_accounts sor" }, 404);

  let uuid = row.minecraft_uuid ? String(row.minecraft_uuid).replace(/-/g, "") : "";

  // Ha még nincs elmentve a UUID, most feloldjuk a jelenleg tárolt név alapján
  // (ez az utolsó alkalom, hogy névvel kell keresnünk — utána már UUID-vel dolgozunk).
  if (!uuid) {
    if (!row.minecraft_name) {
      return json({ error: "Nincs se UUID, se minecraft_name ehhez a sorhoz" }, 400);
    }
    try {
      const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(row.minecraft_name)}`);
      if (!res.ok) return json({ error: `Mojang nem találta a(z) "${row.minecraft_name}" nevű játékost` }, 404);
      const data = await res.json();
      uuid = String(data.id || "").replace(/-/g, "");
      if (!uuid) return json({ error: "Mojang válasz nem tartalmazott UUID-t" }, 502);
    } catch (e) {
      return json({ error: `Mojang lekérdezési hiba: ${e.message}` }, 502);
    }
  }

  // Most a UUID alapján lekérjük a JELENLEGI nevet (ez mindig friss, akárhányszor
  // nevezte át magát a játékos Mojang oldalon).
  let currentName = "";
  try {
    const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
    if (!res.ok) return json({ error: "Mojang nem találta ezt a UUID-t (törölt/megszűnt fiók?)" }, 404);
    const data = await res.json();
    currentName = data.name || "";
    if (!currentName) return json({ error: "Mojang válasz nem tartalmazott nevet" }, 502);
  } catch (e) {
    return json({ error: `Mojang lekérdezési hiba: ${e.message}` }, 502);
  }

  const changed = currentName.toLowerCase() !== String(row.minecraft_name || "").toLowerCase();

  const { error: updateErr } = await supabase
    .from("linked_accounts")
    .update({ minecraft_uuid: uuid, minecraft_name: currentName })
    .eq("id", id);

  if (updateErr) return json({ error: updateErr.message }, 500);

  return json({
    ok: true,
    changed,
    oldName: row.minecraft_name || null,
    newName: currentName,
    uuid,
  });
}
