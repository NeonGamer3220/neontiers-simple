// app/_lib/highTestShared.js
// Shared helpers for HT3+ tier testing, used by both the standalone
// "Magas Eredmény Kezelő" page and the embedded quick-panel in the player
// kezelő (admin dashboard).

export const LEGACY_MODES = ["Boxing", "Combo", "Bridge", "No Debuff", "OP", "Soup", "Fireball Fight"];
export const MODERN_MODES = [
  "Vanilla", "UHC", "Pot", "NethPot", "SMP",
  "Sword", "Axe", "Mace", "Cart", "Creeper", "DiaSMP",
  "OGVanilla", "ShieldlessUHC", "SpearMace", "SpearElytra", "Trident",
];

export function categoryForGamemode(gamemode) {
  return LEGACY_MODES.includes(gamemode) ? "legacy" : "modern";
}

const FT_MODERN = {
  Vanilla: 4, SMP: 4, Cart: 4, DiaSMP: 4, OGVanilla: 4, NethPot: 4,
  Mace: 4, SpearMace: 4, SpearElytra: 4, Trident: 4,
  Sword: 10, UHC: 10, Pot: 10, Creeper: 10, ShieldlessUHC: 10,
  Axe: 20,
};
const FT_LEGACY = {
  Boxing: 4, Combo: 4, "Fireball Fight": 4, Soup: 4, OP: 4, "No Debuff": 4,
  Bridge: 10,
};

export function getFT(category, gamemode) {
  const map = category === "legacy" ? FT_LEGACY : FT_MODERN;
  return map[gamemode] || null;
}

export function scoreOptionsFor(category, gamemode, won) {
  const ft = getFT(category, gamemode);
  if (!ft) return [];
  const opts = [];
  for (let i = ft - 1; i >= 0; i--) {
    opts.push(won ? `${ft}-${i}` : `${i}-${ft}`);
  }
  return opts;
}

// Tiers that trigger the high-test workflow: HT3 and everything better.
export const HIGH_TIERS = ["HT3", "LT2", "HT2", "LT1", "HT1"];

// Full tier order, worst → best — used to resolve "one tier worse" on a
// failed test (e.g. failed LT2 → HT3, failed HT3 → LT3).
export const ALL_TIERS = ["LT5", "HT5", "LT4", "HT4", "LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];

export function resolveTierFromTest(testedTier, passed) {
  const idx = ALL_TIERS.indexOf(testedTier);
  if (idx === -1) return null;
  if (passed) return testedTier;
  const worseIdx = idx - 1;
  if (worseIdx < 0) return null;
  return ALL_TIERS[worseIdx];
}

let rowIdSeq = 1;
export function makeFightRow(category, gamemode) {
  const won = true;
  const opts = scoreOptionsFor(category, gamemode, won);
  return {
    id: rowIdSeq++,
    won,
    score: opts[0] || "",
    opponent: "",
    comment: "",
  };
}
