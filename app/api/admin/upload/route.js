// app/api/admin/upload/route.js
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { rateLimit, rateLimitResponse } from "../../../_lib/rateLimit";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const EXT_BY_TYPE = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

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

// POST multipart/form-data with a "file" field. Uploads to the public
// "ban-evidence" Supabase Storage bucket (see
// sql/create_storage_ban_evidence.sql) and returns { url }.
export async function POST(req) {
  const limited = rateLimit(req, "admin-upload", { limit: 15, windowMs: 60_000 });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  if (!supabase) return json({ error: "Supabase nincs konfigurálva" }, 500);

  const admin = await requireAdmin();
  if (!admin) return json({ error: "Nincs bejelentkezve" }, 401);
  const role = String(admin.role || "").toLowerCase();
  if (role !== "owner") return json({ error: "Csak az Owner rang jogosult képet feltölteni" }, 403);

  let form;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Érvénytelen form adat" }, 400);
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return json({ error: "Hiányzó fájl" }, 400);
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return json({ error: "Csak PNG, JPG, WEBP vagy GIF kép tölthető fel" }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "A fájl mérete legfeljebb 8MB lehet" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = EXT_BY_TYPE[file.type] || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("ban-evidence")
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadErr) return json({ error: uploadErr.message }, 500);

  const { data: pub } = supabase.storage.from("ban-evidence").getPublicUrl(path);

  return json({ ok: true, url: pub?.publicUrl || null, path });
}
