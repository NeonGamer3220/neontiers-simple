import { cookies } from "next/headers";

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
      // legacy session format, just return basic auth
    }

    return Response.json({ 
      authenticated: true, 
      admin_name: adminData?.admin_name || null,
      role: adminData?.role || "owner"
    });
  } catch (err) {
    return Response.json(
      { error: "Auth check failed" },
      { status: 401 }
    );
  }
}
