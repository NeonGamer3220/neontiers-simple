import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const filePath = path.join(process.cwd(), "data.json");

const RANK_POINTS = {
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 5,
  HT3: 6,
  LT2: 7,
  HT2: 8,
  LT1: 9,
  HT1: 10
};

function readData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ tests: [] }, null, 2));
  }

  const raw = fs.readFileSync(filePath);
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, gamemode, rank } = body;

    if (!username || !gamemode || !rank) {
      return NextResponse.json(
        { error: "Missing username/gamemode/rank" },
        { status: 400 }
      );
    }

    const data = readData();

    // 🔥 csak az utolsó maradjon ugyanabból a gamemode-ból
    data.tests = data.tests.filter(
      (t) => !(t.username === username && t.gamemode === gamemode)
    );

    data.tests.push({
      username,
      gamemode,
      rank,
      points: RANK_POINTS[rank] || 0,
      timestamp: Date.now()
    });

    writeData(data);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
