// Script to insert sample test data into Supabase tests table
// Uses the Supabase REST API directly with service_role key.

const fs = require('fs');
const path = require('path');

// Load .env file manually
function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        env[key] = value;
      }
    });
    return env;
  }
  return {};
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const endpoint = `${SUPABASE_URL}/rest/v1/tests`;

// Rank points mapping (same as server)
const RANK_POINTS = {
  LT5: 1,
  HT5: 2,
  LT4: 3,
  HT4: 4,
  LT3: 6,
  HT3: 10,
  LT2: 16,
  HT2: 28,
  LT1: 40,
  HT1: 60,
  Unranked: 0,
};

const gamemodes = [
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
  "Stickfight",
];

const ranks = Object.keys(RANK_POINTS).filter(r => r !== "Unranked"); // exclude Unranked for sample data

// Fetch current max id to avoid collisions
async function getMaxId() {
  try {
    const url = `${SUPABASE_URL}/rest/v1/tests?select=id&order=id.desc&limit=1`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!res.ok) {
      // If table doesn't exist or other error, assume 0
      return 0;
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return parseInt(data[0].id, 10) || 0;
    }
    return 0;
  } catch (err) {
    console.error('Error fetching max id, assuming 0:', err.message);
    return 0;
  }
}

// Insert via REST API
async function insertData() {
  const maxId = await getMaxId();
  console.log(`Current max id: ${maxId}`);

  // Generate 4 players per gamemode (total 64)
  const rows = [];
  gamemodes.forEach((mode, i) => {
    for (let j = 1; j <= 4; j++) {
      const rank = ranks[(i * 4 + (j - 1)) % ranks.length];
      const username = `Player${mode}${j}`;
      rows.push({
        id: maxId + rows.length + 1,
        username,
        gamemode: mode,
        rank,
        points: RANK_POINTS[rank],
        created_at: new Date().toISOString(),
      });
    }
  });

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(rows),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Successfully inserted ${data.length} rows.`);
    } else {
      const err = await response.json();
      console.error(`Error ${response.status}:`, JSON.stringify(err, null, 2));
      console.log(`Successfully inserted 0 rows.`);
    }
  } catch (error) {
    console.error('Network or unexpected error:', error);
    console.log(`Successfully inserted 0 rows.`);
  }
}

insertData();
