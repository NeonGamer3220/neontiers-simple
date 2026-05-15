"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPlayers, setSearchedPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

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

  const safeInt = (n, fallback = 0) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  };

  const findBestRank = (ranks) => {
    const rankOrder = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];
    for (const r of rankOrder) {
      if (ranks.includes(r)) return r;
    }
    return ranks[0] || "N/A";
  };

  const getStats = () => {
    const uniquePlayers = new Set(tests.map((t) => String(t.username).trim().toLowerCase())).size;
    const totalTiers = tests.length;
    return { uniquePlayers, totalTiers };
  };

  const getPlayerData = (username) => {
    const playerTests = tests.filter((t) => t.username.toLowerCase() === username.toLowerCase());
    if (playerTests.length === 0) return null;

    const entries = playerTests.map((t) => ({
      gamemode: t.gamemode,
      rank: t.rank,
      points: t.points || 0,
      id: t.id,
      created_at: t.created_at || null,
    }));

    const totalPoints = entries.reduce((sum, e) => sum + safeInt(e.points, 0), 0);
    const bestRank = findBestRank(entries.map((e) => e.rank));

    return {
      username,
      entries,
      totalPoints,
      bestRank,
      totalModes: entries.length,
      modes: entries.map((e) => e.gamemode),
    };
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length === 0) {
      setSearchedPlayers([]);
      return;
    }

    const uniquePlayers = [...new Set(tests.map((t) => t.username))];
    const filtered = uniquePlayers.filter((p) => p.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

    setSearchedPlayers(filtered);
  };

  const selectPlayer = (username) => {
    const playerData = getPlayerData(username);
    if (playerData) {
      setSelectedPlayer(playerData);
    }
    setSearchQuery("");
    setSearchedPlayers([]);
  };

  const handleSaveEntry = async (entry) => {
    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedPlayer.username,
          gamemode: entry.gamemode,
          rank: entry.rank,
          points: Number(entry.points || 0),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Hiba a mentés során");
        return;
      }

      await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username);
      setSelectedPlayer(refreshed);
      alert("Mentve!");
    } catch (err) {
      alert("Hálózati hiba");
    }
  };

  const updateEntryField = (index, field, value) => {
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      entries[index] = {
        ...entries[index],
        [field]: field === "points" ? Number(value) : value,
      };
      return { ...prev, entries };
    });
  };

  const handleDeleteEntry = async (gamemode) => {
    if (!confirm(`Biztos hogy törlöd a "${gamemode}" tesztet?`)) return;

    try {
      const res = await fetch("/api/tests/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: selectedPlayer.username,
          gamemode: gamemode,
        }),
      });

      if (!res.ok) {
        alert("Hiba a törlés során");
        return;
      }

      await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username);
      setSelectedPlayer(refreshed);
      alert("Törölve!");
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
      <div className="adminDashboard">
        <div className="loadingState">Betöltés...</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="adminDashboard">
      <header className="adminHeader">
        <div className="headerLeft">
          <h1 className="headerTitle">Admin Panel</h1>
          <p className="headerSubtitle">Teszt eredmények kezelése</p>
        </div>
        <div className="headerStats">
          <div className="headerStat">
            <span className="headerStatValue">{stats.uniquePlayers}</span>
            <span className="headerStatLabel">Játékos</span>
          </div>
          <div className="headerStat">
            <span className="headerStatValue">{stats.totalTiers}</span>
            <span className="headerStatLabel">Tier</span>
          </div>
        </div>
        <button className="logoutBtn" onClick={handleLogout}>
          Kijelentkezés
        </button>
      </header>

      <main className="adminContent">
        <div className="searchSection">
          <div className="searchContainer">
            <svg className="searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="searchInput"
              placeholder="Játékos keresése..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          {searchedPlayers.length > 0 && (
            <div className="searchResults">
              {searchedPlayers.map((player) => (
                <button key={player} className="searchResultItem" onClick={() => selectPlayer(player)}>
                  {player}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedPlayer && (
          <div className="playerDetailsSection">
            <button className="closeDetailsBtn" onClick={() => setSelectedPlayer(null)}>
              ✕ Bezárás
            </button>

            <div className="playerDetailsCard">
              <div className="playerDetailsHeader">
                <img
                  src={`https://mc-heads.net/avatar/${encodeURIComponent(selectedPlayer.username)}/96`}
                  alt={selectedPlayer.username}
                  className="playerDetailsSkin"
                />
                <div className="playerDetailsInfo">
                  <h2 className="playerDetailsName">{selectedPlayer.username}</h2>
                  <div className="playerDetailsStats">
                    <div className="playerDetailStat">
                      <span className="detailLabel">Összes pont</span>
                      <span className="detailValue">{selectedPlayer.totalPoints}</span>
                    </div>
                    <div className="playerDetailStat">
                      <span className="detailLabel">Legjobb Tier</span>
                      <span className="detailValue">{selectedPlayer.bestRank}</span>
                    </div>
                    <div className="playerDetailStat">
                      <span className="detailLabel">Tesztelt módok</span>
                      <span className="detailValue">{selectedPlayer.totalModes}</span>
                    </div>
                    <div className="playerDetailStat">
                      <span className="detailLabel">Módok</span>
                      <span className="detailValue tierModes">{selectedPlayer.modes.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="playerTiersSection">
                <h3 className="tiersSectionTitle">Tierek szerkesztése</h3>
                <div className="playerTiersList">
                  {selectedPlayer.entries.map((entry, index) => (
                    <div key={`${entry.gamemode}-${entry.id}`} className="tierEntryCard">
                      <div className="tierEntryHeader">
                        <div>
                          <div className="tierEntryMode">{entry.gamemode}</div>
                          {entry.created_at && (
                            <div className="tierEntryCreated">Mentve: {new Date(entry.created_at).toLocaleString()}</div>
                          )}
                        </div>
                      </div>

                      <div className="tierEditorRow">
                        <label className="tierLabel">
                          Rang
                          <select
                            value={entry.rank}
                            onChange={(e) => updateEntryField(index, "rank", e.target.value)}
                            className="tierSelect"
                          >
                            <option value="HT1">HT1</option>
                            <option value="LT1">LT1</option>
                            <option value="HT2">HT2</option>
                            <option value="LT2">LT2</option>
                            <option value="HT3">HT3</option>
                            <option value="LT3">LT3</option>
                            <option value="HT4">HT4</option>
                            <option value="LT4">LT4</option>
                            <option value="HT5">HT5</option>
                            <option value="LT5">LT5</option>
                            <option value="Unranked">Unranked</option>
                          </select>
                        </label>
                        <label className="tierLabel">
                          Pont
                          <input
                            type="number"
                            value={entry.points}
                            onChange={(e) => updateEntryField(index, "points", e.target.value)}
                            className="tierInput"
                          />
                        </label>
                      </div>

                      <div className="tierEntryActions">
                        <button className="saveEntryBtn" onClick={() => handleSaveEntry(entry)}>
                          💾 Mentés
                        </button>
                        <button className="deleteEntryBtn" onClick={() => handleDeleteEntry(entry.gamemode)}>
                          🗑️ Törlés
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .adminDashboard {
          min-height: 100vh;
          background: var(--bg, #0b0e14);
          color: var(--text, #fffffff0);
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .adminHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 20px;
          background: rgba(11, 14, 20, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 1480px;
          margin: 0 auto;
          gap: 30px;
        }

        .headerLeft {
          flex: 1;
        }

        .headerTitle {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .headerSubtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .headerStats {
          display: flex;
          gap: 20px;
        }

        .headerStat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .headerStatValue {
          font-size: 24px;
          font-weight: 700;
        }

        .headerStatLabel {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }

        .logoutBtn {
          padding: 10px 20px;
          background: rgba(196, 30, 58, 0.8);
          border: 1px solid rgba(196, 30, 58, 0.5);
          border-radius: 6px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logoutBtn:hover {
          background: rgba(196, 30, 58, 1);
        }

        .adminContent {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 20px;
          display: grid;
          gap: 30px;
        }

        .searchSection {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .searchContainer {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px;
        }

        .searchIcon {
          width: 20px;
          height: 20px;
          color: rgba(255, 255, 255, 0.65);
          flex-shrink: 0;
        }

        .searchInput {
          width: 100%;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 15px;
          outline: none;
        }

        .searchInput::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .searchResults {
          display: grid;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .searchResultItem {
          text-align: left;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          font-size: 14px;
        }

        .searchResultItem:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .playerDetailsSection {
          background: rgba(11, 14, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px;
          display: grid;
          gap: 20px;
        }

        .closeDetailsBtn {
          align-self: flex-end;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .closeDetailsBtn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .playerDetailsCard {
          display: grid;
          gap: 24px;
        }

        .playerDetailsHeader {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .playerDetailsSkin {
          width: 96px;
          height: 96px;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
        }

        .playerDetailsInfo {
          flex: 1;
        }

        .playerDetailsName {
          font-size: 28px;
          margin: 0 0 12px 0;
          font-weight: 700;
        }

        .playerDetailsStats {
          display: grid;
          gap: 10px;
        }

        .playerDetailStat {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          background: rgba(255, 255, 255, 0.04);
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }

        .detailLabel {
          color: rgba(255, 255, 255, 0.65);
          font-weight: 600;
        }

        .detailValue {
          font-weight: 700;
          color: #fff;
          text-align: right;
        }

        .tierModes {
          word-break: break-word;
          text-align: right;
        }

        .playerTiersSection {
          display: grid;
          gap: 14px;
        }

        .tiersSectionTitle {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .playerTiersList {
          display: grid;
          gap: 14px;
        }

        .tierEntryCard {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 18px;
          display: grid;
          gap: 12px;
        }

        .tierEntryHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tierEntryMode {
          font-size: 16px;
          font-weight: 700;
        }

        .tierEntryCreated {
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          margin-top: 4px;
        }

        .tierEditorRow {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .tierLabel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: rgba(255, 255, 255, 0.65);
          font-size: 13px;
          font-weight: 600;
        }

        .tierSelect,
        .tierInput {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .tierSelect option {
          color: #000;
        }

        .tierEntryActions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .saveEntryBtn,
        .deleteEntryBtn {
          padding: 12px 18px;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          font-size: 14px;
        }

        .saveEntryBtn {
          background: rgba(40, 167, 69, 0.85);
        }

        .saveEntryBtn:hover {
          background: rgba(40, 167, 69, 1);
        }

        .deleteEntryBtn {
          background: rgba(196, 30, 58, 0.85);
        }

        .deleteEntryBtn:hover {
          background: rgba(196, 30, 58, 1);
        }

        .loadingState {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}
