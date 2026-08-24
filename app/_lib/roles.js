// app/_lib/roles.js
// Shared staff role hierarchy + permission helpers. Plain JS (no
// server-only or client-only imports) so both API routes and admin
// panel components can import from here and stay in sync.
//
// Hierarchy, low to high: regulator < admin < manager < owner.
// Each role has everything the ones below it have, plus what's listed.
//
//  regulator — base staff access: manage players/tiers/bans, can't
//              grade their own account, no staff/applications access.
//  admin     — regulator, plus: view (not edit) staff accounts below
//              owner rank, view applications + their submitted
//              responses (read-only — can't create/edit/delete forms
//              or responses).
//  manager   — admin, plus: Top teszterek/regulátorok + Teszterek és
//              tesztek panels, toggle the "Tester" flag on a player's
//              gamemode entry, open/close applications for
//              submissions.
//  owner     — full control of everything, including staff accounts
//              of any rank and full application CRUD.

export const ROLES = ["regulator", "admin", "manager", "owner"];

export function normalizeRole(role) {
  const r = String(role || "").trim().toLowerCase();
  return ROLES.includes(r) ? r : "regulator";
}

// True if `role` is at least as senior as `min` in the hierarchy above.
export function roleAtLeast(role, min) {
  const a = ROLES.indexOf(normalizeRole(role));
  const b = ROLES.indexOf(normalizeRole(min));
  if (a === -1 || b === -1) return false;
  return a >= b;
}

export function isOwner(role) {
  return normalizeRole(role) === "owner";
}

// Centralized permission checks so the UI and the API agree on what
// each role can do. Keep this the single source of truth — components
// and routes should call these instead of comparing role strings
// directly, so a role's rules only ever need to change in one place.
export const permissions = {
  // Staff (admin) accounts
  canViewStaffList: (role) => roleAtLeast(role, "admin"),
  // Whether `role` can edit/delete a staff account that itself has `targetRole`.
  canEditStaffAccount: (role, targetRole) => {
    if (isOwner(role)) return true;
    if (!roleAtLeast(role, "admin")) return false;
    // Admin/Manager can manage non-owner accounts only.
    return !isOwner(targetRole);
  },
  canCreateStaffAccount: (role) => isOwner(role),

  // Applications (jelentkezések)
  canViewApplications: (role) => roleAtLeast(role, "admin"),
  canViewApplicationResponses: (role) => roleAtLeast(role, "admin"),
  canToggleApplicationOpen: (role) => roleAtLeast(role, "manager"),
  canCreateApplication: (role) => isOwner(role),
  canEditApplication: (role) => isOwner(role),
  canDeleteApplication: (role) => isOwner(role),
  canDeleteApplicationResponse: (role) => isOwner(role),

  // Dashboard extras
  canViewTesterLeaderboards: (role) => roleAtLeast(role, "manager"), // Top teszterek/regulátorok + Teszterek és tesztek
  canToggleTesterFlag: (role) => roleAtLeast(role, "manager"), // "Tester" checkbox on a gamemode entry

  // Existing regulator-tier permissions, unchanged, just centralized:
  canManageTiers: (role) => roleAtLeast(role, "regulator"),
  canManageBans: (role) => roleAtLeast(role, "regulator"),
};
