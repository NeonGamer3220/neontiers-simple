import { NextResponse } from "next/server";

const data = [];

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
    username: body.username,
    gamemode: body.gamemode,
    rank: body.rank,
    tester: body.tester || "",
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
