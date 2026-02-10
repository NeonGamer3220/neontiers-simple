import { NextResponse } from "next/server";

/**
 * In-memory store
 * (Vercelen stateless, de most EZ a cél – később DB)
 */
let tests: {
  username: string;
  tester: string;
  gamemode: string;
  tier: string;
  points: number;
  timestamp: number;
}[] = [];

/**
 * Tier → pont
 */
function tierToPoints(tier: string): number {
  if (tier.startsWith("HT")) return 8;
  if (tier.startsWith("LT")) return 5;
  return 0;
}

/**
 * GET – weboldal lekéri az adatokat
 */
export async function GET() {
  return NextResponse.json({ tests });
}

/**
 * POST – Discord bot küldi a tesztet
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, tester, gamemode, tier } = body;

    if (!username || !tester || !gamemode || !tier) {
      return NextResponse.json(
        { error: "Missing username/tester/gamemode/tier" },
        { status: 400 }
      );
    }

    const points = tierToPoints(tier);

    /**
     * 🔥 FONTOS RÉSZ 🔥
     * Ha ugyanarra a gamemode-ra már van eredmény:
     * → TÖRÖLJÜK
     */
    tests = tests.filter(
      (t) => !(t.username === username && t.gamemode === gamemode)
    );

    /**
     * ÚJ (LEGUTOLSÓ) EREDMÉNY BETÉTELE
     */
    tests.push({
      username,
      tester,
      gamemode,
      tier,
      points,
      timestamp: Date.now(),
    });

    return NextResponse.json({
      success: true,
      saved: {
        username,
        tester,
        gamemode,
        tier,
        points,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 500 }
    );
  }
}
