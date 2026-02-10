"use client";

import { useEffect, useMemo, useState } from "react";

const MODES = [
  "Összes",
  "Vanilla","UHC","Pot","NethPot","SMP","Sword","Axe","Mace","Cart","Creeper","DiaSMP","OGVanilla","ShieldlessUHC",
  "SpearMace","SpearElytra",
];

function pill(text) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm">
      {text}
    </span>
  );
}

export default function Page() {
  const [players, setPlayers] = useState([]);
  const [activeMode, setActiveMode] = useState("Összes");
  const [q, setQ] = useState("");

  async function load() {
    const r = await fetch("/api/tests", { cache: "no-store" });
    const j = await r.json();
    setPlayers(j.players || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (players || [])
      .filter((p) => {
        if (!query) return true;
        return String(p.username || "").toLowerCase().includes(query);
      })
      .map((p) => {
        if (activeMode === "Összes") return p;
        const tests = (p.tests || []).filter((t) => t.gamemode === activeMode);
        const points = tests.reduce((sum, t) => sum + rankPoints(t.rank), 0);
        return { ...p, tests, points };
      })
      .filter((p) => (activeMode === "Összes" ? true : (p.tests || []).length > 0))
      .sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [players, activeMode, q]);

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-6">
          <div className="text-4xl font-extrabold">NeonTiers</div>
          <input
            className="w-[420px] max-w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 outline-none"
            placeholder="Játékos keresése"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-7 bg-white/5 border border-white/10 rounded-3xl p-5">
          <div className="flex flex-wrap gap-3">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => setActiveMode(m)}
                className={
                  "px-4 py-2 rounded-full border text-sm transition " +
                  (activeMode === m
                    ? "bg-white/15 border-white/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10")
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between">
          <div className="text-5xl font-extrabold">Ranglista</div>
          <div className="text-white/70">{filtered.length} játékos</div>
        </div>

        <div className="mt-6 space-y-5">
          {filtered.map((p, idx) => (
            <div
              key={p.username}
              className="bg-white/5 border border-white/10 rounded-3xl px-7 py-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="text-2xl font-extrabold w-10">{idx + 1}.</div>
                <div>
                  <div className="text-2xl font-extrabold">{p.username}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(p.tests || []).map((t) =>
                      pill(`${t.gamemode} ${t.rank}`)
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-5xl font-extrabold text-cyan-300">
                  {p.points || 0}
                </div>
                <div className="text-cyan-200 font-semibold tracking-wide">
                  PONT
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-white/70 mt-10">Nincs találat.</div>
          )}
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          background: radial-gradient(circle at 20% 0%, rgba(153, 64, 255, 0.35), transparent 45%),
                      radial-gradient(circle at 70% 35%, rgba(0, 255, 255, 0.20), transparent 55%),
                      #070b16;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }
      `}</style>
    </div>
  );
}

function rankPoints(rank) {
  const map = {
    Unranked: 0,
    LT5: 1, HT5: 2,
    LT4: 3, HT4: 4,
    LT3: 5, HT3: 6,
    LT2: 7, HT2: 8,
    LT1: 9, HT1: 10,
  };
  return map[rank] ?? 0;
}
