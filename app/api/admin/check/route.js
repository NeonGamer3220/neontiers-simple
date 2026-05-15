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

    return Response.json({ authenticated: true });
  } catch (err) {
    return Response.json(
      { error: "Auth check failed" },
      { status: 401 }
    );
  }
}
