// lib/ranks.js

export const MODE_LIST = [
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

export const RANK_LIST = [
  "Unranked",
  "LT5",
  "HT5",
  "LT4",
  "HT4",
  "LT3",
  "HT3",
  "LT2",
  "HT2",
  "LT1",
  "HT1",
];

export const RANK_POINTS = {
  Unranked: 0,
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 6,
  HT3: 8,
  LT2: 10,
  HT2: 12,
  LT1: 14,
  HT1: 18,
};

export function rankPoints(rank) {
  return RANK_POINTS[rank] ?? 0;
}
