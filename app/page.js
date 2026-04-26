'use client';

import { useEffect } from 'react';

// Browser-compatible version (no React/JSX needed)
const DISCORD_INVITE = "https://discord.gg/7fanAQDxaN";

const MODE_LIST = [
  "Összes", "Vanilla", "UHC", "Pot", "NethPot", "SMP",
  "Sword", "Axe", "Mace", "Cart", "Creeper", "DiaSMP",
  "OGVanilla", "ShieldlessUHC", "SpearMace", "SpearElytra",
];

const MODE_ICONS = {
  "Összes": "/images/overall.png", "Vanilla": "/images/vanilla.png",
  "UHC": "/images/uhc.png", "Pot": "/images/pot.png",
  "NethPot": "/images/nethpot.png", "SMP": "/images/smp.png",
  "Sword": "/images/sword.png", "Axe": "/images/axe.png",
  "Mace": "/images/mace.png", "Cart": "/images/cart.png",
  "Creeper": "/images/creeper.png", "DiaSMP": "/images/diasmp.png",
  "OGVanilla": "/images/ogvanilla.png", "ShieldlessUHC": "/images/shieldlessuhc.png",
  "SpearMace": "/images/spear.png", "SpearElytra": "/images/spear.png",
};

const MODE_DISPLAY_MAP = {
  "vanilla": "Vanilla", "uhc": "UHC", "pot": "Pot", "nethpot": "NethPot",
  "smp": "SMP", "sword": "Sword", "axe": "Axe", "mace": "Mace",
  "cart": "Cart", "creeper": "Creeper", "diasmp": "DiaSMP",
  "ogvanilla": "OGVanilla", "shieldlessuhc": "ShieldlessUHC",
  "spearmace": "SpearMace", "spearelytra": "SpearElytra",
};

const RANK_POINTS = { LT5: 1, HT5: 2, LT4: 3, HT4: 4, LT3: 6, HT3: 10, LT2: 16, HT2: 28, LT1: 40, HT1: 60 };

function tierFromRank(rank) {
  if (!rank || typeof rank !== "string") return null;
  const m = rank.match(/([LH]T)([1-5])/i);
  return m ? Number(m[2]) : null;
}

function tierColor(tier) {
   const colors = { 1: "#FFD86B", 2: "#E7EEF8", 3: "#D7A67A", 4: "#B58CFF", 5: "#63B6FF" };
   return colors[tier] || "rgba(255,255,255,0.7)";
}

function isRetiredRank(rank) {
   if (!rank || typeof rank !== "string") return false;
   // Check for pattern: R followed by L or H, then T, then a digit 1-5
   return /^R[LH]T[1-5]$/i.test(rank);
}

function isFullyRetired(entries) {
   return entries.every(entry => isRetiredRank(entry.rank));
}

function safeInt(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function displayMode(mode) {
  return MODE_DISPLAY_MAP[mode?.toLowerCase()] || mode || "";
}

function skinUrl(username) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(username)}/56`;
}

// Global state and DOM refs (set in useEffect)
let tests = [], activeMode = "Összes", query = "", loading = true;
let tabRow, leaderboard, searchInput, yearEl;

// Render tabs
function renderTabs() {
  if (!tabRow) return;
  tabRow.innerHTML = "";
  MODE_LIST.forEach(m => {
    const btn = document.createElement("a");
    btn.className = "tabBtn" + (activeMode === m ? " active" : "");
    btn.onclick = () => { activeMode = m; renderTabs(); fetchData(); };
    if (MODE_ICONS[m]) {
      const img = document.createElement("img");
      img.className = "tabIcon";
      img.src = MODE_ICONS[m];
      img.alt = m;
      img.width = 24;
      img.height = 24;
      btn.appendChild(img);
    }
    const label = document.createElement("strong");
    label.className = "tabLabel";
    label.textContent = m;
    btn.appendChild(label);
    if (activeMode === m) {
      const line = document.createElement("span");
      line.className = "tabActiveLine";
      btn.appendChild(line);
    }
    tabRow.appendChild(btn);
  });
}

// Render leaderboard
function renderLeaderboard() {
  if (!leaderboard) return;
  const rows = tests.map(r => ({
    id: r?.id, username: String(r?.username || "").trim(),
    gamemode: String(r?.gamemode || "").trim(),
    rank: String(r?.rank || "").trim(),
    points: r?.points != null ? safeInt(r.points, 0) : safeInt(RANK_POINTS[String(r?.rank || "").trim()] || 0, 0),
    created_at: r?.created_at ? String(r.created_at) : "",
  })).filter(r => r.username && r.gamemode && r.rank);

  const latestByUserMode = new Map();
  for (const r of rows) {
    const key = `${r.username}__${r.gamemode}`;
    const prev = latestByUserMode.get(key);
    if (!prev) { latestByUserMode.set(key, r); continue; }
    const prevTime = prev.created_at ? Date.parse(prev.created_at) : 0;
    const curTime = r.created_at ? Date.parse(r.created_at) : 0;
    if (curTime > prevTime) latestByUserMode.set(key, r);
    else if (curTime === prevTime && safeInt(r.id, 0) > safeInt(prev.id, 0)) latestByUserMode.set(key, r);
  }

  const latestRows = Array.from(latestByUserMode.values());
  const filteredByMode = activeMode === "Összes" ? latestRows : latestRows.filter(r => r.gamemode.toLowerCase() === activeMode.toLowerCase());

  const byUser = new Map();
  for (const r of filteredByMode) {
    if (!byUser.has(r.username)) byUser.set(r.username, []);
    byUser.get(r.username).push(r);
  }

  const players = Array.from(byUser.entries()).map(([username, entries]) => {
    entries.sort((a, b) => a.gamemode.localeCompare(b.gamemode));
    const total = entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
    return { username, entries, total };
  });

  const q = query.trim().toLowerCase();
  const searched = !q ? players : players.filter(p => p.username.toLowerCase().includes(q));
  searched.sort((a, b) => b.total !== a.total ? b.total - a.total : a.username.localeCompare(b.username));

  if (loading) {
    leaderboard.innerHTML = `<div class="emptyState"><div class="emptyTitle">Betöltés...</div><div class="emptySub">Kérlek várj.</div></div>`;
    return;
  }

  if (searched.length === 0) {
    leaderboard.innerHTML = `<div class="emptyState"><div class="emptyTitle">Nincs adat</div><div class="emptySub">Még nincs mentett teszt eredmény.</div></div>`;
    return;
  }

   leaderboard.innerHTML = searched.map((p, idx) => `
     <div class="playerRow"${isFullyRetired(p.entries) ? ' style="background-color: #800080;"' : ''}>
       <span class="rowNum">${idx + 1}</span>
       <img class="playerSkin" src="${skinUrl(p.username)}" alt="${p.username}" width="44" height="44">
       <span class="playerName">${p.username}</span>
       <span class="rowTiers">
         ${p.entries.map(r => `
           <span class="tierBadge" title="${displayMode(r.gamemode)} ${r.rank} — ${safeInt(RANK_POINTS[r.rank] || r.points, 0)} pont">
             ${MODE_ICONS[displayMode(r.gamemode)] ? `<img class="tierIcon" src="${MODE_ICONS[displayMode(r.gamemode)]}" alt="" width="28" height="28">` : ""}
             <span class="tierLabel">${r.rank}</span>
           </span>
         `).join("")}
       </span>
     </div>
   `).join("");
}

// Fetch data
async function fetchData() {
  loading = true;
  renderLeaderboard();
  try {
    const res = await fetch("/api/tests", { cache: "no-store" });
    const data = await res.json();
    tests = Array.isArray(data?.tests) ? data.tests : [];
  } catch (e) {
    tests = [];
  }
  loading = false;
  renderLeaderboard();
}

export default function Page() {
  useEffect(() => {
    // DOM refs
    tabRow = document.getElementById("tabRow");
    leaderboard = document.getElementById("leaderboard");
    searchInput = document.getElementById("searchInput");
    yearEl = document.getElementById("year");

    document.documentElement.lang = "hu";
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Search handler
    searchInput.addEventListener("input", (e) => {
      query = e.target.value;
      renderLeaderboard();
    });

    // Init
    renderTabs();
    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page">
      <div className="bg"></div>
      <div style={{paddingTop: '1rem'}}></div>
      <header className="navbar">
        <nav className="navInner">
          <a className="navLogo" href="/">NeonTiers</a>
          <ul className="navLinks">
            <li><a className="navLink active" href="/">Főoldal</a></li>
            <li><a className="navLink" href={DISCORD_INVITE} target="_blank">Discord</a></li>
          </ul>
          <span className="searchWrap">
            <input className="searchInput" placeholder="Játékos keresése..." id="searchInput" spellCheck="false" />
            <kbd className="searchKbd">/</kbd>
          </span>
        </nav>
      </header>
      <main className="mainWrap">
        <div className="mainCard">
          <section className="tabRow" id="tabRow"></section>
          <div className="infoBar"><span className="infoText">Ranglista</span></div>
          <div className="colHead">
            <span className="colHash">#</span>
            <span className="colPlayer">Játékos</span>
            <span className="colTiers">Tierek</span>
          </div>
          <div id="leaderboard"></div>
        </div>
      </main>
      <footer className="pageFooter"><div className="footerText">NeonTiers © <span id="year"></span></div></footer>
    </div>
  );
}