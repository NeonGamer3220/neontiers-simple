import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_session");
    return Response.json({ success: true });
  } catch (err) {
    return Response.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
