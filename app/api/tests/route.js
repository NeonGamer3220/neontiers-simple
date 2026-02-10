import { NextResponse } from "next/server";

// Optional: Vercel KV (recommended for persistence on Vercel)
// Install: npm i @vercel/kv
let kv: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  kv = require("@vercel/kv").kv;
} catch {
  kv = null;
}

type Mode =
  | "Vanilla"
  | "UHC"
  | "Pot"
  | "NethPot"
  | "SMP"
  | "Sword"
  | "Axe"
  | "Mace"
  | "Cart"
  | "Creeper"
  | "DiaSMP"
  | "OGVanilla"
  | "ShieldlessUHC"
  | "SpearMace"
  | "SpearElytra";

type Rank = "Unranked" | "LT5" | "HT5" | "LT4" | "HT4" | "LT3" | "HT3";

type TestRow = {
  username: string;   // Minecraft név (skinhez is)
  testerId: string;   // Discord user id (aki tesztelte)
  testerTag?: string; // opcionális, ha küldöd
  mode: Mode;
  rank: Rank;
  timestamp: number;
};

type PlayerRecord = {
  username: string;
  testsByMode: Partial<Record<Mode, TestRow>>; // gamemode-onként csak 1 (legutóbbi)
  points: number; // összpont: csak a testsByMode-ban lévő legutolsók pontjai
  updatedAt: number;
};

const MODE_LIST: Mode[] = [
  "Vanilla",
  "UHC",
  "Pot",
  "NethPot",
  "SMP",
  "Sword",
  "Axe",
  "Mace",
  "Cart",
  "Creeper",
  "DiaSMP",
  "OGVanilla",
  "ShieldlessUHC",
  "SpearMace",
  "SpearElytra",
];

const RANK_LIST: Rank[] = ["Unranked", "LT5", "HT5", "LT4", "HT4", "LT3", "HT3"];

const POINTS: Record<Rank, number> = {
  Unranked: 0,
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 5,
  HT3: 8,
};

function normUsername(u: string) {
  return u.trim();
}

function computePoints(rec: PlayerRecord): number {
  let sum = 0;
  for (const m of MODE_LIST) {
    const t = rec.testsByMode[m];
    if (t) sum += POINTS[t.rank] ?? 0;
  }
  return sum;
}

const KV_KEY = "neontiers:players:v1";

/**
 * Storage:
 * - If KV is available -> persistent (GOOD)
 * - Else -> in-memory (ONLY for local dev; NOT reliable on Vercel)
 */
function getMemStore(): Record<string, PlayerRecord> {
  const g = globalThis as any;
  if (!g.__NEONTIERS_MEM_STORE__) g.__NEONTIERS_MEM_STORE__ = {};
  return g.__NEONTIERS_MEM_STORE__;
}

async function loadAll(): Promise<Record<string, PlayerRecord>> {
  if (kv) {
    const data = await kv.get(KV_KEY);
    return (data as Record<string, PlayerRecord>) ?? {};
  }
  return getMemStore();
}

async function saveAll(all: Record<string, PlayerRecord>): Promise<void> {
  if (kv) {
    await kv.set(KV_KEY, all);
    return;
  }
  const mem = getMemStore();
  for (const k of Object.keys(mem)) delete mem[k];
  Object.assign(mem, all);
}

function authOk(req: Request): boolean {
  const apiKey = process.env.BOT_API_KEY || process.env.WEBSITE_API_KEY || "";
  if (!apiKey) return true; // ha nincs beállítva, engedjük (fejlesztéshez)
  const header = req.headers.get("authorization") || "";
  // Expected: "Bearer <BOT_API_KEY>"
  return header === `Bearer ${apiKey}`;
}

export async function GET() {
  try {
    const all = await loadAll();
    const players = Object.values(all)
      .sort((a, b) => b.points - a.points || b.updatedAt - a.updatedAt);

    return NextResponse.json({
      tests: players,
      storage: kv ? "kv" : "memory",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!authOk(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    const username = normUsername(String(body.username ?? ""));
    const mode = String(body.gamemode ?? body.mode ?? "");
    const rank = String(body.rank ?? "");
    const testerId = String(body.tester_id ?? body.testerId ?? body.tester ?? "");
    const testerTag = body.tester_tag ? String(body.tester_tag) : undefined;

    if (!username || !mode || !rank) {
      return NextResponse.json(
        { error: "Missing username/mode/rank" },
        { status: 400 }
      );
    }

    if (!MODE_LIST.includes(mode as Mode)) {
      return NextResponse.json({ error: "Invalid gamemode" }, { status: 400 });
    }
    if (!RANK_LIST.includes(rank as Rank)) {
      return NextResponse.json({ error: "Invalid rank" }, { status: 400 });
    }

    const all = await loadAll();
    const key = username.toLowerCase();

    const now = Date.now();

    const existing: PlayerRecord =
      all[key] ?? {
        username,
        testsByMode: {},
        points: 0,
        updatedAt: now,
      };

    const m = mode as Mode;

    // previous rank (automatikus)
    const prevRank: Rank = existing.testsByMode[m]?.rank ?? "Unranked";

    // Update only latest per mode
    const newRow: TestRow = {
      username,
      testerId,
      testerTag,
      mode: m,
      rank: rank as Rank,
      timestamp: now,
    };

    existing.username = username; // keep original casing
    existing.testsByMode[m] = newRow;
    existing.updatedAt = now;
    existing.points = computePoints(existing);

    all[key] = existing;
    await saveAll(all);

    return NextResponse.json({
      ok: true,
      username: existing.username,
      mode: m,
      previous_rank: prevRank,
      new_rank: newRow.rank,
      points_total: existing.points,
      points_delta: (POINTS[newRow.rank] ?? 0) - (POINTS[prevRank] ?? 0),
      storage: kv ? "kv" : "memory",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
