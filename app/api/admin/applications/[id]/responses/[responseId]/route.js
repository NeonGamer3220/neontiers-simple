// app/api/admin/applications/[id]/responses/[responseId]/route.js
// Owner-only: delete a single submitted application response.

import { cookies } from "next/headers";
import { getSupabaseAdmin, readSession } from "../../../../_lib/session";
import { permissions } from "../../../../../../_lib/roles";

export const dynamic = "force-dynamic";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function requireOwner() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore);
  if (!session || session.pending || !session.passkey_verified) {
    return { error: json({ error: "Not authenticated" }, 401) };
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return { error: json({ error: "Missing Supabase env" }, 500) };

  let role = session.role ? String(session.role).toLowerCase() : "owner";
  const { data } = await supabase
    .from("admins")
    .select("role")
    .eq("admin_name", session.admin_name)
    .maybeSingle();
  if (data?.role) role = String(data.role).toLowerCase();

  if (!permissions.canDeleteApplicationResponse(role)) {
    return { error: json({ error: "Hozzáférés megtagadva ehhez" }, 403) };
  }
  return { supabase };
}

export async function DELETE(req, { params }) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id, responseId } = params || {};

  const { error } = await supabase
    .from("application_responses")
    .delete()
    .eq("id", responseId)
    .eq("form_id", id);

  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
}
