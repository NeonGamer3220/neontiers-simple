export const dynamic = "force-dynamic";

let TESTS = [];

export async function GET() {
  return Response.json({ tests: TESTS });
}

export async function POST(req) {
  const auth = req.headers.get("authorization");

  if (auth !== `Bearer ${process.env.BOT_API_KEY}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  TESTS.push(body);

  return Response.json({ success: true });
}
