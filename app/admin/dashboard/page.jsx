"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TIER_RANKS = [
  { value: "HT1", color: "#d5b355" },
  { value: "LT1", color: "#d5b355" },
  { value: "HT2", color: "#a4b3c7" },
  { value: "LT2", color: "#a4b3c7" },
  { value: "HT3", color: "#dd8849" },
  { value: "LT3", color: "#dd8849" },
  { value: "HT4", color: "#b7aadf" },
  { value: "LT4", color: "#b7aadf" },
  { value: "HT5", color: "#6f6389" },
  { value: "LT5", color: "#6f6389" },
  { value: "Unranked", color: "#888d95" },
];

function TierSelect({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selectedColor = TIER_RANKS.find(r => r.value === value)?.color || "#888d95";

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="tierSelectCompact tierSelectWithOptions"
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className="tierSelectButton"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        style={{
          width: "100%",
          minWidth: 0,
          padding: "5px 8px",
          fontSize: "11.5px",
          fontWeight: 800,
          borderRadius: "6px",
          border: `1.5px solid ${disabled ? "rgba(255,255,255,0.1)" : selectedColor}`,
          background: disabled ? "rgba(255,255,255,0.02)" : selectedColor + "22",
          color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
          fontFamily: "Montserrat, inherit",
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          transition: "all 0.15s",
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ opacity: 0.6 }}>▶</span> {value}
      </button>
      {open && !disabled && (
        <div className="tierOptionsDropdown">
          {TIER_RANKS.map((rank) => {
            const isActive = rank.value === value;
            return (
            <div
              key={rank.value}
              className="tierOptionItem"
              onClick={() => {
                onChange(rank.value);
                setOpen(false);
              }}
              style={{
                background: isActive ? rank.color + "33" : "rgba(255,255,255,0.03)",
                color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                fontWeight: isActive ? 800 : 600,
                fontSize: "11.5px",
                padding: "6px 10px",
                cursor: "pointer",
                fontFamily: "Montserrat, inherit",
                transition: "all 0.1s",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: rank.color, marginRight: "6px", fontSize: "10px" }}>◆</span>
              {rank.value}
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}

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

const RANK_POINTS = {
  LT5:  1,
  HT5:  2,
  LT4:  3,
  HT4:  4,
  LT3:  6,
  HT3: 10,
  LT2: 16,
  HT2: 28,
  LT1: 40,
  HT1: 60,
  Unranked: 0,
};

const MODE_ICONS = {
  "Vanilla":    "/images/vanilla.png",
  "UHC":        "/images/uhc.png",
  "Pot":        "/images/pot.png",
  "NethPot":    "/images/nethpot.png",
  "SMP":        "/images/smp.png",
  "Sword":      "/images/sword.png",
  "Axe":        "/images/axe.png",
  "Mace":       "/images/mace.png",
"Cart":      "/images/cart.png",
  "Creeper":   "/images/creeper.png",
  "DiaSMP":    "/images/diasmp.png",
  "OGVanilla": "/images/ogvanilla.png",
  "ShieldlessUHC": "/images/shieldlessuhc.png",
  "SpearMace": "/images/spear.png",
  "SpearElytra":  "/images/spear.png",
  "Stick Fight":  "/images/stickfight.png",
  "Trident":   "/images/trident.png",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedPlayers, setSearchedPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [editStates, setEditStates] = useState({});
  const [showUntested, setShowUntested] = useState(true);
  const [toast, setToast] = useState(null); // { text, type }
  const [selectedPlayerUUID, setSelectedPlayerUUID] = useState("");
  const [newNameInput, setNewNameInput] = useState("");
  const [bannedUntil, setBannedUntil] = useState(null);   // ISO date string or null
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banDays, setBanDays] = useState("");

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

  // Auto-dismiss toast after 2 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

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

  const getPlayerData = (username, includeUntested = false) => {
    const playerTests = tests.filter((t) => t.username.toLowerCase() === username.toLowerCase());
    if (playerTests.length === 0 && !includeUntested) return null;

    const entries = playerTests.map((t) => ({
      gamemode: t.gamemode,
      rank: t.rank,
      points: t.points || 0,
      id: t.id,
      created_at: t.created_at || null,
    }));

    // Include untested gamemodes
    if (includeUntested) {
      const testedModes = new Set(entries.map((e) => e.gamemode.toLowerCase()));
      for (const mode of MODE_OPTIONS) {
        if (!testedModes.has(mode.toLowerCase())) {
          entries.push({
            gamemode: mode,
            rank: "Unranked",
            points: 0,
            id: null,
            created_at: null,
            isUntested: true,
          });
        }
      }
    }

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

  const selectPlayer = async (username) => {
    const playerData = getPlayerData(username, showUntested);
    if (playerData) {
      setSelectedPlayer(playerData);
      setNewNameInput("");
      setBanDays("");
      setBanModalOpen(false);
      // fetch ban data
      try {
        const res = await fetch(`/api/ban?username=${encodeURIComponent(username)}`);
        if (res.ok) {
          const banData = await res.json();
          if (banData?.banned && banData?.expires_at) {
            const exp = new Date(banData.expires_at);
            if (exp > new Date()) setBannedUntil(banData.expires_at);
            else { setBannedUntil(null); await fetch("/api/ban", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) }); }
          } else {
            setBannedUntil(null);
          }
        }
      } catch { setBannedUntil(null); }
    }
    setSearchQuery("");
    setSearchedPlayers([]);
  };

  const handleSaveEntry = async (entry) => {
    try {
      // Build payload - only include id if it's a valid positive number
      const payload = {
        username: selectedPlayer.username,
        gamemode: entry.gamemode,
        rank: entry.rank,
        points: Number(entry.points || 0),
      };
      // Only add id if it's a valid number (not null/undefined)
      const entryId = Number(entry.id);
      if (Number.isFinite(entryId) && entryId > 0) {
        payload.id = entryId;
      }
      
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

       if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", text: data.error || "Hiba a mentés során" });
        return;
      }

      // Log this action to audit trail
      // Server-side audit logging will record this action (admin cookie used)

      await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested);
      setSelectedPlayer(refreshed);
      setToast({ type: "ok", text: "Mentve!" });
    } catch (err) {
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const updateEntryField = (index, field, value) => {
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      const current = entries[index];
      entries[index] = {
        ...current,
        [field]: field === "points" ? Number(value) : value,
        ...(field === "rank" ? { points: RANK_POINTS[value] ?? 0 } : {}),
      };
      return { ...prev, entries };
    });
  };

const toggleRetired = (index) => {
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      const entry = { ...entries[index] };
      const isCurrentlyRetired = entry.rank.startsWith("R");
      
      if (isCurrentlyRetired) {
        // Remove "R" prefix to unretire
        entry.rank = entry.rank.slice(1);
      } else {
        // Add "R" prefix to retire
        entry.rank = "R" + entry.rank;
      }
      
      entries[index] = entry;
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
       setToast({ type: "error", text: "Hiba a törlés során" });
        return;
      }

      // Log this action to audit trail
      // Server-side audit logging will record this action (admin cookie used)

      await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested);
      setSelectedPlayer(refreshed);
      setToast({ type: "ok", text: "Törölve!" });
    } catch (err) {
      setToast({ type: "error", text: "Hálózati hiba" });
    }
   };

  // ── UUID & name refresh from Mojang ──
  useEffect(() => {
    if (!selectedPlayer) return;
    const ac = new AbortController();
    fetch(`/api/mojang?username=${encodeURIComponent(selectedPlayer.username)}`, { signal: ac.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setSelectedPlayerUUID(formatUUID(d.id)); })
      .catch(() => {});
    return () => ac.abort();
  }, [selectedPlayer]);

  function formatUUID(raw) {
    const clean = raw.replace(/-/g, "");
    return `${clean.slice(0,8)}-${clean.slice(8,12)}-${clean.slice(12,16)}-${clean.slice(16,20)}-${clean.slice(20)}`;
  }

const handleRefreshName = async () => {
    if (!newNameInput.trim()) { setToast({ type: "error", text: "Addj meg egy érvényes játékosnevet!" }); return; }
    try {
      const res = await fetch(`/api/mojang?username=${encodeURIComponent(newNameInput.trim())}`);
      if (!res.ok) { setToast({ type: "error", text: "Nem található a játékos a Mojang adatbázisában." }); return; }
      const data = await res.json();
      setToast({ type: "ok", text: `Név frissítve: ${data.name}` });
      const refreshed = getPlayerData(data.name, showUntested);
      setSelectedPlayer(refreshed);
      setNewNameInput("");
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };

  // ── Ban / Unban ──
  const openBanModal = () => setBanModalOpen(true);

  const confirmBan = async () => {
    if (!banDays || isNaN(Number(banDays)) || Number(banDays) < 1) {
      setToast({ type: "error", text: "Add meg érvényes napszámot!" });
      return;
    }
    try {
      const until = new Date();
      until.setDate(until.getDate() + Number(banDays));
      await fetch("/api/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: selectedPlayer.username, banned_until: until.toISOString() }),
      });
      setBannedUntil(until.toISOString());
      setBanModalOpen(false);
      setBanDays("");
      setToast({ type: "ok", text: `${banDays} napra kitiltva.` });
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };

  const handleUnban = async () => {
    try {
      await fetch("/api/ban", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: selectedPlayer.username }) });
      setBannedUntil(null);
      setToast({ type: "ok", text: "Kitiltás feloldva." });
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };

  // ── Remove player (from main site, keep DB) ──
  const handleRemovePlayer = async () => {
    if (!confirm(`Biztos hogy eltávolítod "${selectedPlayer.username}" játékosadatát a weboldalról?`)) return;
    if (!confirm("Ez a művelet nem vonható vissza. Folytatod?")) return;
    try {
      await fetch("/api/admin/remove-player", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: selectedPlayer.username }) });
      await loadTests();
      setSelectedPlayer(null);
      setToast({ type: "ok", text: "Játékos eltávolítva a weboldalról." });
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
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

  // ── computed ──
  const bannedDaysLeft = bannedUntil
    ? Math.max(0, Math.ceil((new Date(bannedUntil) - new Date()) / 86400000))
    : 0;

  return (
    <div className="adminDashboard">

      {/* Ban confirmation modal */}
      {banModalOpen && (
        <div className="banModalOverlay" onClick={() => setBanModalOpen(false)}>
          <div className="banModal" onClick={(e) => e.stopPropagation()}>
            <h3 className="banModalTitle">Kitiltás</h3>
            <p className="banModalText">Hány napra szeretnéd kitiltani <b>{selectedPlayer?.username}</b>?</p>
            <input
              type="number"
              className="pdNameInput"
              placeholder="Napok száma…"
              value={banDays}
              onChange={(e) => setBanDays(e.target.value)}
              min="1"
            />
            <div className="banModalBtns">
              <button className="pdBanBtn" onClick={confirmBan}>Kitiltás</button>
              <button className="pdCancelBtn" onClick={() => { setBanModalOpen(false); setBanDays(""); }}>Mégse</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}
        >
          {toast.text}
        </div>
      )}

      <header className="adminNavbar">
        <div className="navbarLeft">
          <h1 className="navbarTitle">Admin Panel</h1>
        </div>
        <nav className="navbarLinks">
          <a href="/" className="navbarLink">Publikus</a>
          <a href="/admin/dashboard" className="navbarLink active">Főoldal</a>
          <a href="/admin/magas-eredmeny" className="navbarLink">Magas Eredmény Kezelés</a>
          <a href="/admin/logs" className="navbarLink">Log</a>
        </nav>
        <button className="logoutBtn" onClick={handleLogout}>
          Kijelentkezés
        </button>
      </header>

      <header className="adminHeader">
         <div className="headerLeft">
           <p className="headerSubtitle">Áttekintés</p>
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
              {/* ─── HEAD + NAME + UUID ─── */}
              <div className="pdRow pdRowHead">
                <img
                  src={`https://mc-heads.net/avatar/${encodeURIComponent(selectedPlayer.username)}/96`}
                  alt={selectedPlayer.username}
                  className="playerDetailsSkin"
                />
                <div className="pdNameBlock">
                  <h2 className="playerDetailsName">{selectedPlayer.username}</h2>
                  <span className="pdUuid">{selectedPlayerUUID || "Minecraft UUID betöltése…"}</span>
                  <div className="pdNameRefresh">
                    <input
                      type="text"
                      className="pdNameInput"
                      placeholder="Minecraft név frissítése…"
                      value={newNameInput}
                      onChange={(e) => setNewNameInput(e.target.value)}
                    />
                    <button className="pdRefreshBtn" onClick={handleRefreshName}>
                      Név frissítése
                    </button>
                  </div>
                  <div className="pdActionBtns">
                    {bannedUntil ? (
                       <button className="pdUnbanBtn" onClick={handleUnban}>
                         Feloldás
                       </button>
                    ) : (
                       <button className="pdBanBtn" onClick={openBanModal}>
                         Kitiltás
                       </button>
                    )}
                    <button className="pdRemoveBtn" onClick={handleRemovePlayer}>
                      Eltávolítás
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── STAT BUBBLES ─── */}
              <div className="pdRow pdBubbles">
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Összpont</span>
                  <span className="pdBubbleValue">{selectedPlayer.totalPoints}</span>
                </div>
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Tesztelt módok</span>
                  <span className="pdBubbleValue">{selectedPlayer.totalModes}</span>
                </div>
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Legjobb Tier</span>
                  <span className="pdBubbleValue tierBadgeInline">{selectedPlayer.bestRank}</span>
                </div>
                <div className={`pdBubble ${bannedUntil ? "pdBubbleBan" : ""}`}>
                  <span className="pdBubbleLabel">Globális Állapot</span>
                  <span className="pdBubbleValue">{bannedUntil ? `Kitiltva ${bannedDaysLeft} napra` : "Aktív"}</span>
                </div>
              </div>
            </div>

            {/* ─── GAMEMODE TIER MANAGEMENT ─── */}
            <div className="playerTiersSection">
              <div className="tiersSectionHeader">
                <h3 className="tiersSectionTitle">Játékmódok</h3>
                <span className="tiersSubtitle">Tier kezelés admin joggal.</span>
                {selectedPlayer && (
                  <button
                    className={`toggleUntestedBtn ${showUntested ? 'active' : ''}`}
                    onClick={() => {
                      setShowUntested(!showUntested);
                      if (selectedPlayer) {
                        const refreshed = getPlayerData(selectedPlayer.username, !showUntested);
                        setSelectedPlayer(refreshed);
                      }
                    }}
                    title="Mutasd a tesztelt nélküli módokat is"
                  >
                    {showUntested ? 'Elrejt' : 'Mutat'} teszt nélküli
                  </button>
                )}
              </div>
              <div className="playerTiersList">
                {selectedPlayer.entries.map((entry, index) => {
                  const isRetired = entry.rank.startsWith("R");
                  const isUntested = entry.isUntested;
                  const displayRank = isRetired ? entry.rank.slice(1) : entry.rank;

                  return (
                    <div key={`${entry.gamemode}-${entry.id}`} className={`tierEntryCard ${isRetired ? "retired" : ""} ${isUntested ? "untested" : ""}`}>
                      {/* circular icon + name */}
                      <div className="tierModeCircle">
                        {MODE_ICONS[entry.gamemode] && (
                          <img src={MODE_ICONS[entry.gamemode]} alt={entry.gamemode} className="tierModeCircleImg" />
                        )}
                        <span className="tierModeCircleLabel">{entry.gamemode}</span>
                      </div>

                      {/* tier selector */}
                      <div className="tierEntryControls">
                        <TierSelect
                          value={displayRank}
                          onChange={(rank) => updateEntryField(index, "rank", rank)}
                          disabled={isRetired}
                        />

                        <input
                          type="number"
                          value={entry.points}
                          onChange={(e) => updateEntryField(index, "points", e.target.value)}
                          className="tierInputCompact"
                          disabled={isRetired}
                        />

                        <label className="retireCheckbox" title={isRetired ? "Aktív" : "Retire"}>
                          <input
                            type="checkbox"
                            checked={isRetired}
                            onChange={() => toggleRetired(index)}
                          />
                          <span className="checkboxLabel">{isRetired ? "↻" : "⊕"}</span>
                        </label>

                        <button
                          className="saveEntryBtnCompact"
                          onClick={() => handleSaveEntry(entry)}
                          title="Mentés"
                        >
                          💾
                        </button>
                      </div>
                    </div>
                  );
                })}
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

        .adminNavbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: rgba(11, 14, 20, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .navbarLink {
          padding: 10px 20px;
          color: rgba(255, 255, 255, 0.65);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          background: none;
          border: none;
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
          transition: transform 0.18s ease, opacity 0.18s ease;
          transform: translateY(0);
          opacity: 1;
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
          border-radius: 10px;
          padding: 10px 12px;
          display: grid;
          gap: 0;
          transition: background 0.15s, transform 0.12s;
        }

        .tierEntryCard:hover { transform: translateY(-3px); background: rgba(255,255,255,0.06); }

        .tierEntryCard.retired {
          opacity: 0.6;
          background: rgba(255, 255, 255, 0.02);
        }

        .tierEntryCompact {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
          align-items: center;
        }

        .tierEntryModeInfo {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tierEntryMode {
          font-size: 13px;
          font-weight: 700;
        }

        .tierEntryControls {
          display: grid;
          grid-template-columns: 70px 60px 36px 36px;
          gap: 8px;
          align-items: center;
        }

        .tierInputCompact {
          padding: 6px 8px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-family: inherit;
          outline: none;
          transition: all 0.15s;
          flex: 1;
        }

        .tierInputCompact:focus {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }

        .tierInputCompact:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tierSelectWithOptions .tierSelectButton {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .tierOptionsDropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          background: #0b0d16;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          z-index: 30;
          overflow: hidden;
          box-shadow: 0 8px 32px #0000005c;
          min-width: 120px;
        }

        .tierOptionItem {
          padding: 7px 12px;
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .tierOptionItem:last-child {
          border-bottom: none;
        }

        .tierOptionItem:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .retireCheckbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          height: 30px;
        }

        .retireCheckbox input {
          display: none;
        }

        .checkboxLabel {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          transition: all 0.2s;
          font-size: 14px;
          user-select: none;
        }

        .retireCheckbox input:checked ~ .checkboxLabel {
          background: rgba(196, 30, 58, 0.2);
          border-color: rgba(196, 30, 58, 0.5);
          color: #ff6b6b;
        }

        .saveEntryBtnCompact {
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid rgba(40, 167, 69, 0.4);
          background: rgba(40, 167, 69, 0.15);
          color: #fff;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.15s;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .saveEntryBtnCompact:hover:not(:disabled) {
          background: rgba(40, 167, 69, 0.3);
          border-color: rgba(40, 167, 69, 0.6);
        }

        .saveEntryBtnCompact:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .adminNavbar {
          animation: slideInLeft 0.3s ease-out;
        }

        .adminHeader {
          animation: slideInLeft 0.4s ease-out;
        }

        .adminContent {
          animation: fadeIn 0.4s ease-out;
        }

        .searchSection {
          animation: fadeIn 0.5s ease-out;
        }

        .playerDetailsSection {
          animation: fadeIn 0.3s ease-out;
        }

        .tierEntryCard {
          animation: fadeIn 0.3s ease-out;
        }

        .navbarLink {
          position: relative;
        }

        .navbarLink::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #c41e3a;
          transition: width 0.3s ease;
        }

        .navbarLink:hover::after {
          width: 100%;
        }

        .searchResultItem {
          animation: fadeIn 0.2s ease-out;
        }

        .searchInput:focus {
          animation: pulse 0.5s ease-out;
        }

        button:not(:disabled):active {
          transform: scale(0.98);
          transition: transform 0.1s;
        }

        .tierInputCompact:focus {
          box-shadow: 0 0 0 2px rgba(196, 30, 58, 0.2);
        }

        .retireCheckbox:hover .checkboxLabel {
          border-color: rgba(196, 30, 58, 0.4);
          background: rgba(196, 30, 58, 0.1);
        }

        .tiersSectionHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .toggleUntestedBtn {
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggleUntestedBtn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .toggleUntestedBtn.active {
          background: rgba(79, 167, 255, 0.2);
          border-color: rgba(79, 167, 255, 0.5);
          color: #4fa7ff;
        }

        .tierEntryCard.untested {
          opacity: 0.6;
          background: rgba(255, 255, 255, 0.02);
          border-style: dashed;
        }

        .tierEntryCard.untested:hover {
          opacity: 0.8;
        }

        .tierEntryMode {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .untestedBadge {
           font-size: 10px;
          background: rgba(79, 167, 255, 0.3);
          color: #4fa7ff;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
        }

        /* Toast notification */
        .toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          animation: toastSlideIn 0.3s ease-out;
          box-shadow: 0 12px 40px #0000006e;
          pointer-events: none;
        }

        .toastOk {
          background: rgba(35, 165, 90, 0.92);
        }

        .toastError {
          background: rgba(196, 30, 58, 0.92);
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.92);
          }
           to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ─── Player card ─── */
        .playerDetailsCard {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pdRow {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .pdRowHead {
          gap: 20px;
        }

        .pdNameBlock {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .playerDetailsName {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
        }

        .pdUuid {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          font-family: monospace;
          letter-spacing: 0.04em;
        }

        .pdNameRefresh {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .pdNameInput {
          padding: 7px 12px;
          font-size: 13px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-family: inherit;
          outline: none;
          min-width: 200px;
          transition: border-color 0.15s;
        }

        .pdNameInput:focus {
          border-color: rgba(255,255,255,0.25);
        }

        .pdRefreshBtn {
          padding: 7px 16px;
          border-radius: 8px;
          border: none;
          background: rgba(196,30,58,0.85);
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .pdRefreshBtn:hover {
          background: rgba(196,30,58,1);
        }

        .pdActionBtns {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .pdBanBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          background: rgba(196,30,58,0.85);
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .pdBanBtn:hover {
          background: rgba(196,30,58,1);
        }

        .pdUnbanBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
          color: #fff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .pdUnbanBtn:hover {
          background: rgba(255,255,255,0.12);
        }

        .pdRemoveBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid rgba(196,30,58,0.5);
          background: rgba(196,30,58,0.15);
          color: #ff6b6b;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .pdRemoveBtn:hover {
          background: rgba(196,30,58,0.25);
          border-color: rgba(196,30,58,0.8);
        }

        /* ─── Stat bubbles ─── */
        .pdBubbles {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .pdBubble {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 18px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 100px;
        }

        .pdBubbleLabel {
          font-size: 10.5px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .pdBubbleValue {
          font-size: 20px;
          font-weight: 800;
        }

        .pdBubbleBan {
          border-color: rgba(196,30,58,0.5);
          background: rgba(196,30,58,0.12);
        }

        .pdBubbleBan .pdBubbleValue {
          color: #ff6b6b;
        }

        .tierBadgeInline {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 16px;
        }

        /* ─── Gamemode circles ─── */
        .playerTiersList {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .tierEntryCard {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 16px;
          border-radius: 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          transition: border-color 0.15s, background 0.15s;
          min-width: 220px;
        }

        .tierEntryCard:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
        }

        .tierEntryCard.retired {
          opacity: 0.55;
          border-style: dashed;
        }

        .tierModeCircle {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          margin-right: 10px;
        }

        .tierModeCircleImg {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          padding: 5px;
          object-fit: contain;
        }

        .tierModeCircleLabel {
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          white-space: nowrap;
        }

        .tiersSectionHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .tiersSubtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          margin: 0;
        }

        /* ─── Ban modal ─── */
        .banModalOverlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        .banModal {
          background: #111620;
          border: 1px solid rgba(196,30,58,0.4);
          border-radius: 16px;
          padding: 28px;
          width: 380px;
          max-width: 90vw;
          box-shadow: 0 24px 80px #000000b0;
          animation: modalSlideIn 0.22s ease-out;
        }

        .banModalTitle {
          margin: 0 0 10px 0;
          font-size: 20px;
          font-weight: 800;
          color: #ff6b6b;
        }

        .banModalText {
          margin: 0 0 18px 0;
          font-size: 14px;
          color: rgba(255,255,255,0.75);
        }

        .banModalBtns {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ─── Misc cleanups ─── */
        .playerDetailsSkin { border-radius: 50%; }
        .closeDetailsBtn { flex-shrink: 0; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
