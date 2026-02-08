import { NextResponse } from "next/server";

type Row = {
  username: string;
  gamemode: string;
  rank: string;
  tester?: string;
  timestamp?: string;
};

const data: Row[] = []; // ideiglenes memória (később DB)

export async function GET() {
  return NextResponse.json({ tests: data });
}

export async function POST(req: Request) {
  const key = process.env.BOT_API_KEY;
  const auth = req.headers.get("authorization") || "";
  if (!key || auth !== `Bearer ${key}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Partial<Row>;

  if (!body.username || !body.gamemode || !body.rank) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  data.push({
    username: body.username,
    gamemode: body.gamemode,
    rank: body.rank,
    tester: body.tester ?? "",
    timestamp: body.timestamp ?? new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
