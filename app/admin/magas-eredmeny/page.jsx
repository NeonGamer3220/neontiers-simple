"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TIER_FIELDS = ["LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
const RANK_ORDER = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];

const MODE_OPTIONS = [
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
  "Stick Fight",
  "Trident",
];

const MODE_ICONS = {
  Vanilla: "/images/vanilla.png",
  UHC: "/images/uhc.png",
  Pot: "/images/pot.png",
  NethPot: "/images/nethpot.png",
  SMP: "/images/smp.png",
  Sword: "/images/sword.png",
  Axe: "/images/axe.png",
  Mace: "/images/mace.png",
  Cart: "/images/cart.png",
  Creeper: "/images/creeper.png",
  DiaSMP: "/images/diasmp.png",
  OGVanilla: "/images/ogvanilla.png",
  ShieldlessUHC: "/images/shieldlessuhc.png",
  SpearMace: "/images/spear.png",
  SpearElytra: "/images/spear.png",
  "Stick Fight": "/images/stickfight.png",
  Trident: "/images/trident.png",
};

const MODE_COLORS = {
  Vanilla: "#f8d04a",
  UHC: "#ff6b6b",
  Pot: "#7ee2ff",
  NethPot: "#b17cff",
  SMP: "#4edd8d",
  Sword: "#ffb86c",
  Axe: "#f06d6d",
  Mace: "#d17dff",
  Cart: "#74c0ff",
  Creeper: "#54d06b",
  DiaSMP: "#33d7c7",
  OGVanilla: "#f9b636",
  ShieldlessUHC: "#ff8f7a",
  SpearMace: "#a47cff",
  SpearElytra: "#55c4ea",
  "Stick Fight": "#65ffb6",
  Trident: "#4fa7ff",
};

function modeColor(mode) {
  return MODE_COLORS[mode] || "#ffffff";
}

function findBestRank(ranks) {
  for (const rank of RANK_ORDER) {
    if (ranks.includes(rank)) return rank;
  }
  return ranks[0] || "N/A";
}

const TIER_COLORS = {
  HT1: "#d5b355",
  LT1: "#d5b355",
  HT2: "#a4b3c7",
  LT2: "#a4b3c7",
  HT3: "#dd8849",
  LT3: "#dd8849",
  HT4: "#b7aadf",
  LT4: "#b7aadf",
  HT5: "#6f6389",
  LT5: "#6f6389",
};

function tierColor(tier) {
  return TIER_COLORS[tier] || "#ffffff";
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function AdminHighscorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [gamemode, setGamemode] = useState("");
  const [result, setResult] = useState("");
  const [testedTier, setTestedTier] = useState("");
  const [discordName, setDiscordName] = useState("");
  const [fightNotes, setFightNotes] = useState({
    LT3: "",
    HT3: "",
    LT2: "",
    HT2: "",
    LT1: "",
    HT1: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      await loadTests();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadTests = async () => {
    try {
      const res = await fetch("/api/tests");
      const data = await res.json();
      setTests(Array.isArray(data?.tests) ? data.tests : []);
    } catch (err) {
      console.error("Failed to load tests:", err);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    if (!value) {
      setSuggestions([]);
      return;
    }

    const uniquePlayers = [...new Set(tests.map((test) => test.username))];
    setSuggestions(
      uniquePlayers
        .filter((username) => username.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8)
    );
  };

  const selectPlayer = (username) => {
    const playerTests = tests.filter((test) => test.username.toLowerCase() === username.toLowerCase());
    if (playerTests.length === 0) return;

    const totalPoints = playerTests.reduce((sum, test) => sum + Number(test.points || 0), 0);
    const bestRank = findBestRank(playerTests.map((test) => test.rank));

    setSelectedPlayer({
      username,
      totalPoints,
      bestRank,
    });
    setTestedTier(bestRank);
    setGamemode("");
    setResult("");
    setFightNotes({ LT3: "", HT3: "", LT2: "", HT2: "", LT1: "", HT1: "" });
    setSearchQuery("");
    setSuggestions([]);
  };

  const handleNoteChange = (tier, value) => {
    setFightNotes((prev) => ({ ...prev, [tier]: value }));
  };

  const handleSave = async () => {
    if (!selectedPlayer) return;
    if (!gamemode) {
      alert("Kérlek válassz játékmódot.");
      return;
    }

    const filledNotes = TIER_FIELDS.some((tier) => fightNotes[tier].trim().length > 0);
    const isHighTier = testedTier.startsWith("HT3") || testedTier.startsWith("HT2") || testedTier.startsWith("HT1");

    if (isHighTier && !filledNotes) {
      alert("HT3 vagy magasabb tiernél legalább egy magas eredmény mezőt ki kell tölteni.");
      return;
    }

try {
       const res = await fetch("/api/high-score-save", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           username: selectedPlayer.username,
           gamemode,
           tested_tier: testedTier,
           result: result || "Sikeres",
           fight_notes: fightNotes,
           discord_name: discordName || undefined,
         }),
       });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Hiba a mentés során");
        return;
      }

      alert("Magas eredmény mentve!" + (data.notification_created ? " Bot értesítés kész." : ""));
    } catch (err) {
      alert("Hálózati hiba");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="highscorePage">
        <div className="loadingState">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="highscorePage">
      <header className="adminNavbar">
        <div className="navbarLeft">
          <h1 className="navbarTitle">Admin Panel</h1>
        </div>
<nav className="navbarLinks">
           <a href="/" className="navbarLink">Publikus</a>
           <a href="/admin/dashboard" className="navbarLink">Játékos Kezelő</a>
           <a href="/admin/magas-eredmeny" className="navbarLink active">Magas Eredmény Kezelés</a>
           <a href="/admin/logs" className="navbarLink">Log</a>
         </nav>
        <button className="logoutBtn" onClick={handleLogout}>
          Kijelentkezés
        </button>
      </header>

      <main className="highscoreContent">
        <section className="highscoreHeaderCard">
          <div className="highscoreSearchRow">
            <div className="searchContainer">
              <label className="searchLabel">Játékos kiválasztása</label>
              <input
                type="text"
                className="searchInput"
                placeholder="Keresés játékos név szerint..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="headerNote">A magas eredmény szerkesztése előtt válassz játékost.</div>
          </div>
          {suggestions.length > 0 && (
            <div className="suggestionsBox">
              {suggestions.map((username) => (
                <button key={username} className="suggestionItem" onClick={() => selectPlayer(username)}>
                  {username}
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedPlayer ? (
          <section className="highscoreCard">
            <div className="highscoreTopBar">
              <div>
                <h2 className="playerTitle">{selectedPlayer.username}</h2>
                <div className="playerMeta">
                  {gamemode && MODE_ICONS[gamemode] && (
                    <img src={MODE_ICONS[gamemode]} alt={gamemode} className="modeIconSmall" />
                  )}
                  {selectedPlayer.bestRank} · {selectedPlayer.totalPoints} pont
                </div>
              </div>
              <button className="saveButton" onClick={handleSave}>
                Mentés
              </button>
            </div>

            <div className="highscoreBody">
              <div className="highscoreForm">
                <div className="highscoreFormRow">
                  <div className="inputGroup">
                    <label>Eredmény</label>
                    <input
                      type="text"
                      value={result}
                      onChange={(e) => setResult(e.target.value)}
                      placeholder="Sikeres"
                    />
                  </div>
                  <div className="inputGroup">
                    <label>Discord Név (opcionális)</label>
                    <input
                      type="text"
                      value={discordName}
                      onChange={(e) => setDiscordName(e.target.value)}
                      placeholder="Discord neve"
                    />
                  </div>
                  <div className="inputGroup">
                    <label>Tesztelt Tier</label>
                    <div className="tierSelectRow">
                      <select
                        className="modeSelect tierSelect"
                        value={testedTier}
                        onChange={(e) => setTestedTier(e.target.value)}
                      >
                        <option value="">Válassz tiert...</option>
                        {Object.keys(TIER_COLORS).map((tier) => (
                          <option key={tier} value={tier} style={{ color: tierColor(tier) }}>
                            {tier}
                          </option>
                        ))}
                      </select>
                      {testedTier && (
                        <span
                          className="tierPreviewBadge"
                          style={{
                            borderColor: tierColor(testedTier),
                            color: tierColor(testedTier),
                            background: hexToRgba(tierColor(testedTier), 0.18),
                          }}
                        >
                          {testedTier}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="inputGroup">
                    <label>Játékmód</label>
                    <select
                      className="modeSelect"
                      value={gamemode}
                      onChange={(e) => setGamemode(e.target.value)}
                      style={{ color: modeColor(gamemode) }}
                    >
                      <option value="" style={{ color: "#ffffff" }}>
                        Válassz játékmódot...
                      </option>
                      {MODE_OPTIONS.map((mode) => (
                        <option key={mode} value={mode} style={{ color: modeColor(mode) }}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="fightGrid">
                  {TIER_FIELDS.map((tier) => (
                    <div key={tier} className="fightGroup">
                      <label>{tier} FIGHTOK</label>
                      <textarea
                        value={fightNotes[tier]}
                        onChange={(e) => handleNoteChange(tier, e.target.value)}
                        placeholder={`nyert 4-1 Ellenfél\nvesztett 2-4 Ellenfél`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <aside className="highscoreSidebar">
                <div className="sidebarTitle">Magas eredmény adatai</div>
                <p>HT3 vagy afeletti tierhez legalább egy magas eredmény mezőt ki kell tölteni.</p>
                <p>Az itt megadott jegyzetek segítenek a Discord bot és a tier adminisztrátorok számára.</p>
              </aside>
            </div>
          </section>
        ) : (
          <section className="emptyState">
            <div className="emptyTitle">Válassz játékost a magas eredmény szerkesztéséhez</div>
            <div className="emptySub">Használd a keresőt, hogy kiválaszd a megfelelő játékost.</div>
          </section>
        )}
      </main>

      <style jsx>{`
        .highscorePage {
          min-height: 100vh;
          background: var(--bg, #0b0e14);
          color: var(--text, #ffffffee);
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .adminNavbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 22px;
          background: rgba(11, 14, 20, 0.88);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          max-width: 1480px;
          margin: 0 auto;
          gap: 20px;
        }

        .navbarLeft {
          flex: 0 0 auto;
        }

        .navbarTitle {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        .navbarLinks {
          flex: 1;
          display: flex;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .navbarLink {
          padding: 10px 20px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .navbarLink:hover {
          color: #fff;
        }

        .navbarLink.active {
          color: #fff;
          border-bottom-color: #c41e3a;
        }

        .logoutBtn {
          padding: 10px 20px;
          background: rgba(196, 30, 58, 0.85);
          border: 1px solid rgba(196, 30, 58, 0.5);
          border-radius: 8px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }

        .highscoreContent {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 20px 60px;
          display: grid;
          gap: 24px;
        }

        .highscoreHeaderCard {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 22px;
          display: grid;
          gap: 16px;
        }

        .highscoreSearchRow {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .searchContainer {
          flex: 1 1 320px;
          display: grid;
          gap: 10px;
        }

        .searchLabel {
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-weight: 600;
        }

        .searchInput {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          outline: none;
          font-size: 14px;
        }

        .searchInput::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        .headerNote {
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          flex: 0 0 auto;
          min-width: 220px;
        }

        .suggestionsBox {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
        }

        .suggestionItem {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #fff;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          font-family: inherit;
        }

        .suggestionItem:hover {
          background: rgba(255, 255, 255, 0.09);
          transform: translateY(-1px);
        }

        .highscoreCard {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 24px;
          padding: 28px;
          display: grid;
          gap: 24px;
        }

        .highscoreTopBar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .playerTitle {
          font-size: 24px;
          margin: 0 0 6px;
        }

        .playerMeta {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .saveButton {
          padding: 14px 24px;
          border-radius: 14px;
          background: rgba(196, 30, 58, 0.95);
          border: none;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .saveButton:hover {
          background: rgba(196, 30, 58, 1);
        }

        .highscoreBody {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
        }

        .highscoreForm {
          display: grid;
          gap: 18px;
        }

        .highscoreFormRow {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .inputGroup {
          display: grid;
          gap: 10px;
        }

        .inputGroup label {
          color: rgba(255, 255, 255, 0.75);
          font-size: 13px;
          font-weight: 700;
        }

        .inputGroup input,
        .inputGroup select,
        .fightGroup textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          padding: 14px 16px;
          font-size: 14px;
          outline: none;
          min-height: 48px;
          resize: vertical;
          font-family: inherit;
        }

        .modeSelect {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-size: 14px;
          outline: none;
          font-family: inherit;
          appearance: none;
        }

        .tierSelectRow {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .tierSelect {
          flex: 1;
        }

        .tierPreviewBadge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 92px;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid;
          font-weight: 700;
          font-size: 13px;
          background: rgba(255, 255, 255, 0.08);
        }

        .modeIconSmall {
          width: 24px;
          height: 24px;
          margin-right: 10px;
          vertical-align: middle;
        }

        .playerMeta {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.7);
        }

        .playerMeta img {
          width: 24px;
          height: 24px;
        }

        .fightGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .fightGroup {
          display: grid;
          gap: 10px;
        }

        .fightGroup label {
          color: rgba(255, 255, 255, 0.75);
          font-size: 13px;
          font-weight: 700;
        }

        .fightGroup textarea {
          min-height: 118px;
          line-height: 1.6;
        }

        .highscoreSidebar {
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 22px;
          display: grid;
          gap: 14px;
          min-height: 320px;
        }

        .sidebarTitle {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        .highscoreSidebar p {
          margin: 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 14px;
          line-height: 1.75;
        }

        .emptyState {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 32px;
          text-align: center;
        }

        .emptyTitle {
          font-size: 20px;
          margin: 0 0 10px;
        }

        .emptySub {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .loadingState {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        @media (max-width: 940px) {
          .highscoreBody {
            grid-template-columns: 1fr;
          }

          .highscoreFormRow {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .adminNavbar {
            flex-direction: column;
            align-items: stretch;
          }

          .navbarLinks {
            flex-wrap: wrap;
          }

          .highscoreSearchRow {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}
