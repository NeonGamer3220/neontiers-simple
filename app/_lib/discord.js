// app/_lib/discord.js
// Resolves a Discord user ID to a display name via the Discord REST API.
// Requires a bot token (DISCORD_BOT_TOKEN) — any bot that's in a shared
// server with the users works fine, this endpoint only needs public
// user info and doesn't require the bot to share a guild with the user.

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_API = "https://discord.com/api/v10";

export function discordConfigured() {
  return !!DISCORD_BOT_TOKEN;
}

// Small delay helper so we don't slam Discord's rate limit when resolving
// many IDs in a row (global limit is ~50 req/s per bot token).
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetches a single user's display name from Discord.
// Returns "" on failure (deleted user, bad token, rate-limited, etc.)
// so callers can just skip/leave it blank rather than crash.
export async function fetchDiscordUsername(discordId) {
  if (!DISCORD_BOT_TOKEN || !discordId) return "";

  try {
    const res = await fetch(`${DISCORD_API}/users/${encodeURIComponent(discordId)}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      cache: "no-store",
    });

    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      const retryAfter = Math.ceil((body?.retry_after || 1) * 1000);
      await sleep(retryAfter);
      return fetchDiscordUsername(discordId);
    }

    if (!res.ok) return "";

    const data = await res.json();
    // global_name is the new "display name"; username is the unique @handle.
    // Prefer global_name when set, it's what people recognize; fall back to username.
    const name = data.global_name || data.username || "";
    return name ? String(name).trim() : "";
  } catch {
    return "";
  }
}

// Resolves a batch of Discord IDs sequentially with a small delay between
// calls to stay well under Discord's rate limit. Returns a Map<id, username>
// (only successful resolutions are included).
export async function resolveDiscordUsernames(ids, { delayMs = 25 } = {}) {
  const results = new Map();
  if (!DISCORD_BOT_TOKEN) return results;

  const uniqueIds = [...new Set(ids.filter(Boolean))];

  for (const id of uniqueIds) {
    const name = await fetchDiscordUsername(id);
    if (name) results.set(id, name);
    if (delayMs) await sleep(delayMs);
  }

  return results;
}
