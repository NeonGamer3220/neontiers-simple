import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const rankPoints = {
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 5,
  HT3: 6,
  LT2: 7,
  HT2: 8,
  LT1: 9,
  HT1: 10,
};

export async function GET() {
  const { data, error } = await supabase
    .from("tests")
    .select("*");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ tests: data });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, gamemode, rank } = body;

    if (!username || !gamemode || !rank) {
      return Response.json(
        { error: "Missing username/gamemode/rank" },
        { status: 400 }
      );
    }

    const points = rankPoints[rank] || 0;

    // upsert: egy játékosnak egy gamemode-ból csak 1 rekord
    const { error } = await supabase
      .from("tests")
      .upsert(
        {
          username,
          gamemode,
          rank,
          points,
          created_at: new Date().toISOString(),
        },
        { onConflict: "username,gamemode" }
      );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
