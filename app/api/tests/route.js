import { NextResponse } from "next/server";

let data = []; // ideiglenes memória (később DB)

export async function GET() {
  return NextResponse.json({ tests: data });
}

export async function POST(req) {
  const key = process.env.BOT_API_KEY;
  const auth = req.headers.get("authorization") || "";

  if (!key || auth !== `Bearer ${key}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.username || !body.gamemode || !body.rank) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  data.push({
    username: String(body.username),
    gamemode: String(body.gamemode),
    rank: String(body.rank),
    tester: body.tester ? String(body.tester) : "",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
