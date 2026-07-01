import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRole) {
      return Response.json(
        { error: "Szerver konfigurációs hiba" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    const { admin_name, admin_password } = await req.json();

    if (!admin_name || !admin_password) {
      return Response.json(
        { error: "Admin név és jelszó szükséges" },
        { status: 400 }
      );
    }

    // Query admins table
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("admin_name", admin_name)
      .single();

    if (error || !data) {
      return Response.json(
        { error: "Helytelen admin név vagy jelszó" },
        { status: 401 }
      );
    }

    // Check password
    if (data.admin_password !== admin_password) {
      return Response.json(
        { error: "Helytelen admin név vagy jelszó" },
        { status: 401 }
      );
    }

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", JSON.stringify({ admin_name: data.admin_name, role: String(data.role || "owner").toLowerCase() }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Insert audit record for admin login (best-effort)
    try {
      const sup = createClient(supabaseUrl, supabaseServiceRole, { auth: { persistSession: false } });
      await sup.from("audit_logs").insert({
        admin_name: data.admin_name,
        action: "admin_login",
        target_username: null,
        gamemode: null,
        old_rank: null,
        new_rank: null,
        old_points: null,
        new_points: null,
        details: null,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to write admin_login audit:", e?.message || e);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    return Response.json(
      { error: "Szerver hiba" },
      { status: 500 }
    );
  }
}
