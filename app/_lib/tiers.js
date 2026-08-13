// app/_lib/tiers.js
// Shared tier/gamemode helpers used across the homepage, player profile,
// and compare pages so the tier math + display logic lives in one place.

export const MODE_ICONS = {
  "Összes": "/images/overall.png",
  "Vanilla": "/images/vanilla.png",
  "UHC": "/images/uhc.png",
  "Pot": "/images/pot.png",
  "NethPot": "/images/nethpot.png",
  "SMP": "/images/smp.png",
  "Sword": "/images/sword.png",
  "Axe": "/images/axe.png",
  "Mace": "/images/mace.png",
  "Cart": "/images/cart.png",
  "Creeper": "/images/creeper.png",
  "DiaSMP": "/images/diasmp.png",
  "OGVanilla": "/images/ogvanilla.png",
  "SpearMace": "/images/spear.png",
  "SpearElytra": "/images/spear.png",
  "ShieldlessUHC": "/images/shieldlessuhc.png",
  "Trident": "/images/trident.png",
};

const MODE_DISPLAY_MAP = {
  "vanilla": "Vanilla", "uhc": "UHC", "pot": "Pot", "nethpot": "NethPot",
  "smp": "SMP", "sword": "Sword", "axe": "Axe", "mace": "Mace",
  "cart": "Cart", "creeper": "Creeper", "diasmp": "DiaSMP",
  "ogvanilla": "OGVanilla", "shieldlessuhc": "ShieldlessUHC",
  "spearmace": "SpearMace", "spearelytra": "SpearElytra",
  "trident": "Trident",
};

export function displayMode(mode) {
  if (!mode) return "";
  const key = mode.toLowerCase().replace(/\s+/g, "");
  return MODE_DISPLAY_MAP[key] || mode || "";
}

const TIER_TO_POINTS = {
  LT5: 1, HT5: 2, LT4: 3, HT4: 4,
  LT3: 6, HT3: 10, LT2: 16, HT2: 22,
  LT1: 40, HT1: 60,
};

export function getPointsForElo(rank) {
  if (typeof rank !== "string") return 0;
  return TIER_TO_POINTS[rank.trim().toUpperCase()] || 0;
}

const TIER_MAP_5 = { LT5: 5, HT5: 5, LT4: 4, HT4: 4, LT3: 3, HT3: 3, LT2: 2, HT2: 2, LT1: 1, HT1: 1 };

export function tierFromRank(rank) {
  if (!rank) return null;
  const val = String(rank).trim().toUpperCase();
  if (val.startsWith("R")) return null;
  if (TIER_MAP_5[val] !== undefined) return TIER_MAP_5[val];
  const num = Number(val);
  if (Number.isNaN(num)) return null;
  if (num >= 2500) return 1;
  if (num >= 2000) return 2;
  if (num >= 1500) return 3;
  if (num >= 1000) return 4;
  if (num >= 500) return 5;
  return null;
}

export function rankBadgeColor(rank, retired = false) {
  if (retired) return "#8f7cff";
  if (!rank) return "#888d95";
  const val = String(rank).trim().toUpperCase();
  const clean = val.startsWith("R") ? val.slice(1) : val;
  const isLT = clean.startsWith("LT");
  const effectiveTier = TIER_MAP_5[clean];
  if (!effectiveTier) return "#888d95";
  switch (effectiveTier) {
    case 1: return "#d5b355";
    case 2: return isLT ? "#888d95" : "#a4b3c7";
    case 3: return isLT ? "#b36830" : "#dd8849";
    case 4: return isLT ? "#514764" : "#b7aadf";
    case 5: return isLT ? "#40384f" : "#6f6389";
    default: return "#888d95";
  }
}

export function eloRankLabel(rank) {
  if (rank === null || rank === undefined || rank === "") return "";
  return String(rank).trim().toUpperCase();
}

export function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(255,255,255,${alpha})`;
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function safeInt(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export function skinUrl(username, uuid) {
  if (uuid && uuid.replace(/-/g, "").length === 32) {
    return `https://mc-heads.net/avatar/${uuid.replace(/-/g, "")}/56`;
  }
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/56`;
}

// Rank order used to plot progress on the chart — lower index = better tier.
// LT/HT within the same numeric tier are both represented, HT ranks above LT.
export const RANK_ORDER = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];

export function rankOrderValue(rank) {
  const val = eloRankLabel(rank);
  const idx = RANK_ORDER.indexOf(val);
  // Higher = better, for easier chart plotting (bottom = worse, top = better)
  return idx === -1 ? -1 : RANK_ORDER.length - idx;
}

// Collapse latest entry per username+gamemode from a raw tests[] array
// (same de-dup logic used on the homepage leaderboard).
export function latestByUserMode(tests) {
  const rows = (Array.isArray(tests) ? tests : [])
    .map((r) => ({
      id: r?.id,
      username: String(r?.username || "").trim(),
      gamemode: String(r?.gamemode || "").trim(),
      uuid: r?.uuid || null,
      rank: r?.rank || null,
      retired: r?.retired === true,
      points: r?.points != null ? safeInt(r.points, 0) : getPointsForElo(r?.rank),
      created_at: r?.created_at ? String(r.created_at) : "",
    }))
    .filter((r) => r.username && r.gamemode && r.rank != null);

  const map = new Map();
  for (const r of rows) {
    const key = `${r.username.toLowerCase()}__${r.gamemode.toLowerCase()}`;
    const prev = map.get(key);
    if (!prev) { map.set(key, r); continue; }
    const prevTime = prev.created_at ? Date.parse(prev.created_at) : 0;
    const curTime = r.created_at ? Date.parse(r.created_at) : 0;
    if (curTime > prevTime) map.set(key, r);
    else if (curTime === prevTime && safeInt(r.id, 0) > safeInt(prev.id, 0)) map.set(key, r);
  }
  return Array.from(map.values());
}

export function entriesForUser(tests, username) {
  const uname = username.trim().toLowerCase();
  return latestByUserMode(tests).filter((r) => r.username.toLowerCase() === uname);
}

export function totalPointsForEntries(entries) {
  return entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
}
