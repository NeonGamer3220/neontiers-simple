// Friendly, human-readable labels for every audit action this site writes.
// Anything not listed here still gets a readable fallback instead of a raw
// snake_case slug like "admin_login_password_step".
export const ACTION_LABELS = {
  tier_save: "Mentés",
  tier_delete: "Törlés",
  tier_manual_set: "Kézi tier beállítás",
  player_remove: "Játékos eltávolítás",
  player_add: "Játékos hozzáadása",
  player_rename: "Név változtatás",
  admin_login: "Bejelentkezés",
  admin_login_password_step: "Bejelentkezés (jelszó lépés)",
  admin_login_passkey_step: "Bejelentkezés (passkey lépés)",
  admin_passkey_failed: "Sikertelen passkey próbálkozás",
  passkey_registered: "Passkey beállítva",
  high_score_save: "Magas eredmény",
  ban_issued: "Kitiltás",
  ban_lifted: "Kitiltás feloldva",
  staff_create: "Regulátor létrehozva",
  staff_update: "Regulátor módosítva",
  staff_delete: "Regulátor törölve",
};

export const ACTION_META = {
  tier_save: { icon: "✓", color: "#4ade80" },
  tier_delete: { icon: "✕", color: "#f87171" },
  tier_manual_set: { icon: "✎", color: "#38bdf8" },
  player_remove: { icon: "🗑", color: "#f87171" },
  player_add: { icon: "＋", color: "#4ade80" },
  player_rename: { icon: "✎", color: "#38bdf8" },
  admin_login: { icon: "🔑", color: "#8f7cff" },
  admin_login_password_step: { icon: "🔒", color: "#8f7cff" },
  admin_login_passkey_step: { icon: "🔓", color: "#8f7cff" },
  admin_passkey_failed: { icon: "⚠", color: "#f87171" },
  passkey_registered: { icon: "🔐", color: "#4ade80" },
  high_score_save: { icon: "🏆", color: "#fbbf24" },
  ban_issued: { icon: "🚫", color: "#f87171" },
  ban_lifted: { icon: "♻", color: "#4ade80" },
  staff_create: { icon: "＋", color: "#4ade80" },
  staff_update: { icon: "✎", color: "#38bdf8" },
  staff_delete: { icon: "🗑", color: "#f87171" },
};

export function actionLabelFor(action) {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  // Fallback: turn any unmapped snake_case action into readable words
  // instead of showing the raw slug.
  return String(action || "")
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function actionMetaFor(action) {
  return ACTION_META[action] || { icon: "•", color: "#94a3b8" };
}
