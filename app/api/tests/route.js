import { NextResponse } from "next/server"

const API_KEY = process.env.BOT_API_KEY

let tests = []

function calculatePoints(rank) {
  const map = {
    "LT1": 1,
    "LT2": 3,
    "LT3": 5,
    "HT1": 6,
    "HT2": 7,
    "HT3": 8,
    "HT4": 10
  }

  return map[rank] || 0
}

export async function GET() {
  return NextResponse.json({ tests })
}

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization")

    if (!auth || auth !== `Bearer ${API_KEY}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const { username, tester, gamemode, rank } = body

    if (!username || !gamemode || !rank) {
      return NextResponse.json(
        { error: "Missing username/gamemode/rank" },
        { status: 400 }
      )
    }

    // 🔥 Csak az utolsó gamemode maradhat
    tests = tests.filter(
      (t) => !(t.username === username && t.gamemode === gamemode)
    )

    tests.push({
      username,
      tester,
      gamemode,
      rank,
      points: calculatePoints(rank)
    })

    return NextResponse.json({
      success: true
    })

  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
