import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (!session || !session.value) {
      return Response.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    let adminData = null;
    try {
      const parsed = JSON.parse(session.value);
      adminData = parsed;
    } catch (e) {
      // legacy session format
    }

    let role = adminData?.role ? String(adminData.role).toLowerCase() : "owner";

    if (supabase && adminData?.admin_name) {
      const { data } = await supabase
        .from("admins")
        .select("role")
        .eq("admin_name", adminData.admin_name)
        .maybeSingle();
      if (data?.role) role = String(data.role).toLowerCase();
    }

    return Response.json({
      authenticated: true,
      admin_name: adminData?.admin_name || null,
      role
    });
  } catch (err) {
    return Response.json(
      { error: "Auth check failed" },
      { status: 401 }
    );
  }
}
