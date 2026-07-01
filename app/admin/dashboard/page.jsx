"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TIER_RANKS = [
  { value: 500, color: "#6f6389" },
  { value: 750, color: "#6f6389" },
  { value: 1000, color: "#514764" },
  { value: 1250, color: "#b7aadf" },
  { value: 1500, color: "#dd8849" },
  { value: 1750, color: "#dd8849" },
  { value: 2000, color: "#888d95" },
  { value: 2250, color: "#a4b3c7" },
  { value: 2500, color: "#a4b3c7" },
  { value: 2750, color: "#d5b355" },
  { value: 0, color: "#888d95" },
];

function TierSelect({ value, onChange, disabled = false }) {
  const selectedColor = TIER_RANKS.find(r => r.value === value)?.color || "#888d95";

  const handleInputChange = (e) => {
    const val = Number(e.target.value);
    if (Number.isFinite(val) && val >= 0) {
      onChange(val);
    }
  };

  return (
    <div
      className="tierSelectCompact tierSelectWithOptions"
      style={{ position: "relative" }}
    >
      <input
        type="number"
        className="tierInputCompact"
        disabled={disabled}
        value={value}
        onChange={handleInputChange}
        min="0"
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
          cursor: disabled ? "not-allowed" : "text",
          textAlign: "left",
          transition: "all 0.15s",
          letterSpacing: "0.02em",
        }}
      />
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
  500: 1, 750: 2, 1000: 3, 1250: 4,
  1500: 6, 1750: 10, 2000: 16, 2250: 22, 2500: 28, 2750: 34,
  0: 0,
};

const RANK_POINT_RANGES = [
  { min: 0, max: 499, points: 0 },
  { min: 500, max: 749, points: 1 },
  { min: 750, max: 999, points: 2 },
  { min: 1000, max: 1249, points: 3 },
  { min: 1250, max: 1499, points: 4 },
  { min: 1500, max: 1749, points: 6 },
  { min: 1750, max: 1999, points: 10 },
  { min: 2000, max: 2249, points: 16 },
  { min: 2250, max: 2499, points: 22 },
  { min: 2500, max: 2749, points: 28 },
  { min: 2750, max: Infinity, points: 34 },
];

function getPointsForElo(elo) {
  const value = Number(elo);
  if (!Number.isFinite(value) || value < 0) return 0;
  const range = RANK_POINT_RANGES.find((item) => value >= item.min && value <= item.max);
  return range ? range.points : 0;
}

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
  const [showUntested, setShowUntested] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedPlayerUUID, setSelectedPlayerUUID] = useState("");
  const [newNameInput, setNewNameInput] = useState("");
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("regulator");
  const [editingStaffId, setEditingStaffId] = useState(null);

  const showConfirm = (message) => new Promise((resolve) => {
    setConfirmState({ message, resolve });
  });

  const handleConfirm = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };


  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (data.role) setAdminRole(String(data.role).toLowerCase());
      if (data.admin_name) setAdminName(String(data.admin_name));
      await loadTests();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (adminRole === "owner") {
      loadStaff();
    }
  }, [adminRole]);

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
    const rankOrder = [500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 0];
    for (const r of rankOrder) {
      if (ranks.includes(r)) return r;
    }
    return ranks[0] || 0;
  };

  const getStats = () => {
    const uniquePlayers = new Set(tests.map((t) => String(t.username).trim().toLowerCase())).size;
    const totalTiers = tests.length;
    return { uniquePlayers, totalTiers };
  };

   const getPlayerData = (username, includeUntested = false) => {
    const cleanName = String(username || "").trim();
    const playerTests = tests.filter((t) => String(t?.username || "").trim().toLowerCase() === cleanName.toLowerCase());
    if (playerTests.length === 0 && !includeUntested) return null;

const entries = playerTests.map((t) => ({
        gamemode: t.gamemode,
        uuid: t.uuid || null,
        elo: t.elo != null ? Number(t.elo) : 0,
        rank: t.elo != null ? Number(t.elo) : 0,
        retired: t.retired === true,
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
              elo: 0,
              rank: 0,
              retired: false,
              points: 0,
              id: null,
              created_at: null,
              isUntested: true,
            });
         }
       }
     }

     const totalPoints = entries.reduce((sum, e) => sum + safeInt(getPointsForElo(e.elo), 0), 0);
     const bestRank = findBestRank(entries.map((e) => e.elo));

      const firstUuid = playerTests.find((t) => t.uuid)?.uuid || null;

     return {
       username,
       uuid: firstUuid,
       entries,
       totalPoints,
       bestRank,
       totalModes: entries.length,
       modes: entries.map((e) => e.gamemode),
     };
  };

   const handleSearch = (query) => {
     setSearchQuery(query);
     if (query.trim().length === 0) {
       setSearchedPlayers([]);
       return;
     }

     const uniquePlayers = [...new Set(tests.map((t) => String(t?.username || "").trim()))];
     const filtered = uniquePlayers.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 10);

     setSearchedPlayers(filtered);
   };

  const selectPlayer = async (username) => {
    const playerData = getPlayerData(username, showUntested);
    if (playerData) {
      setSelectedPlayer(playerData);
      setNewNameInput("");
    }
    setSearchQuery("");
    setSearchedPlayers([]);
  };

const handleSaveEntry = async (entry) => {
    try {
      const points = getPointsForElo(entry.elo);
      const payload = {
        username: selectedPlayer.username,
        gamemode: entry.gamemode,
        earned_elo: entry.elo,
        points,
        retired: entry.retired === true,
      };
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
      if (field === "elo") {
        const elo = value;
        entries[index] = {
          ...current,
          elo,
          rank: elo,
          points: getPointsForElo(elo),
        };
      } else {
        entries[index] = { ...current, [field]: value };
      }
      return { ...prev, entries };
    });
  };

const toggleRetired = (index) => {
    setSelectedPlayer((prev) => {
      if (!prev) return prev;
      const entries = [...prev.entries];
      const entry = { ...entries[index] };
      entry.retired = !entry.retired;
      entries[index] = entry;
      return { ...prev, entries };
    });
  };

  const handleDeleteEntry = async (gamemode) => {
    const ok = await showConfirm(`Biztos hogy törlöd a "${gamemode}" tesztet?`);
    if (!ok) return;

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
    if (!selectedPlayer) return;
    try {
      const currentName = selectedPlayer.username;

      // Look up current name via UUID if available, else use manual input
      let currentMojangName = null;
      if (selectedPlayer.uuid) {
        const res = await fetch(`/api/mojang?uuid=${selectedPlayer.uuid.replace(/-/g, "")}`);
        if (res.ok) {
          const data = await res.json();
          currentMojangName = data.name;
        }
      }

      const targetNewName = currentMojangName || (newNameInput.trim() || null);

      if (!targetNewName) {
        setToast({ type: "error", text: "Addj meg egy érvényes játékosnevet, vagy add hozzá a UUID-t!" });
        return;
      }

      if (targetNewName === currentName && !currentMojangName) {
        setToast({ type: "error", text: "Az új név megegyezik a jelenlegivel." });
        return;
      }

      // Call rename API to transfer tiers from old name to new name
      const renameRes = await fetch("/api/tests/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldName: currentName,
          newName: targetNewName,
        }),
      });
      const renameData = await renameRes.json();
      if (!renameRes.ok) {
        setToast({ type: "error", text: renameData.error || "Hiba a név megváltoztatásakor" });
        return;
      }

      setToast({ type: "ok", text: `Név megváltoztatva: ${currentName} → ${targetNewName}` });
      await loadTests();
      setNewNameInput("");
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };

  // ── Remove player (from main site, keep DB) ──
  // ── Add player with 500 ELO in every gamemode ──
  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      setToast({ type: "error", text: "Add meg a játékos nevét!" });
      return;
    }
    const username = newPlayerName.trim();
    let uuid = null;
    try {
      const mojangRes = await fetch(`/api/mojang?username=${encodeURIComponent(username)}`);
      if (mojangRes.ok) {
        const mojangData = await mojangRes.json();
        uuid = mojangData.id || null;
      }
    } catch { /* ignore Mojang errors, add without UUID */ }

    try {
      await Promise.all(
        MODE_OPTIONS.map((mode) =>
          fetch("/api/tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              uuid,
              gamemode: mode,
              elo: 500,
              points: 1,
              retired: false,
            }),
          })
        )
      );

      await fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "player_add",
          target_username: username,
          details: { modes: MODE_OPTIONS.length, elo: 500, uuid },
        }),
      });

      await loadTests();
      setShowAddPlayerModal(false);
      setNewPlayerName("");
      setToast({ type: "ok", text: `${username} hozzáadva minden gamemode-hoz 500 ELO-val.` });
    } catch (err) {
      setToast({ type: "error", text: err.message || "Hiba a játékos létrehozása során" });
    }
  };

  const handleRemovePlayer = async () => {
    const ok1 = await showConfirm(`Biztos hogy eltávolítod "${selectedPlayer.username}" játékosadatát a weboldalról?`);
    if (!ok1) return;
    const ok2 = await showConfirm("Ez a művelet nem vonható vissza. Folytatod?");
    if (!ok2) return;
    try {
      await fetch("/api/admin/remove-player", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: selectedPlayer.username }) });
      await loadTests();
      setSelectedPlayer(null);
      setToast({ type: "ok", text: "Játékos eltávolítva a weboldalról." });
    } catch { setToast({ type: "error", text: "Hálózati hiba" }); }
  };

  const loadStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff?action=list");
      if (!res.ok) return;
      const data = await res.json();
      setStaffList(Array.isArray(data?.staff) ? data.staff : []);
    } catch (err) {
      console.error("Failed to load staff:", err);
    }
  };

  const handleSaveStaff = async () => {
    if (!newStaffName.trim()) {
      setToast({ type: "error", text: "Add meg a staff nevét!" });
      return;
    }
    try {
      const payload = {
        action: editingStaffId ? "update" : "create",
        admin_name: newStaffName.trim(),
        admin_password: newStaffPassword,
        role: newStaffRole,
      };
      if (editingStaffId) payload.id = editingStaffId;

      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a staff mentése során" });
        return;
      }

      await loadStaff();
      setNewStaffName("");
      setNewStaffPassword("");
      setNewStaffRole("regulator");
      setEditingStaffId(null);
      setToast({ type: "ok", text: editingStaffId ? "Staff frissítve!" : "Staff létrehozva!" });
    } catch {
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const handleDeleteStaff = async (id, name) => {
    const ok = await showConfirm(`Biztos hogy törlöd a "${name}" staff fiókot?`);
    if (!ok) return;
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a törlés során" });
        return;
      }
      await loadStaff();
      setToast({ type: "ok", text: "Staff törölve!" });
    } catch {
      setToast({ type: "error", text: "Hálózati hiba" });
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

      {/* Toast notification */}
      {toast && (
        <div
          className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}
        >
          {toast.text}
        </div>
      )}

      {showAddPlayerModal && (
        <div className="modalOverlay" onClick={() => setShowAddPlayerModal(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Új játékos hozzáadása</h3>
            <p className="modalSubtitle">Minden gamemode-hoz 500 ELO-t kap.</p>
            <input
              type="text"
              className="modalInput"
              placeholder="Minecraft név..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPlayer();
                if (e.key === "Escape") setShowAddPlayerModal(false);
              }}
            />
            <div className="modalActions">
              <button className="modalBtn modalBtnCancel" onClick={() => setShowAddPlayerModal(false)}>
                Mégse
              </button>
              <button className="modalBtn modalBtnConfirm" onClick={handleAddPlayer}>
                Hozzáadás
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState && (
        <div className="modalOverlay" onClick={() => handleConfirm(false)}>
          <div className="modalContent modalSmall" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Megerősítés</h3>
            <p className="modalSubtitle">{confirmState.message}</p>
            <div className="modalActions">
              <button className="modalBtn modalBtnCancel" onClick={() => handleConfirm(false)}>
                Mégse
              </button>
              <button className="modalBtn modalBtnConfirm" onClick={() => handleConfirm(true)}>
                Igen
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="adminNavbar">
        <div className="navbarLeft">
          <h1 className="navbarTitle">NeonTiers Admin Panel</h1>
        </div>
        <nav className="navbarLinks">
          <a href="/" className="navbarLink">Publikus</a>
          <a href="/admin/dashboard" className="navbarLink active">Játékos kezelő</a>
          {adminRole === "owner" && (
            <a href="/admin/logs" className="navbarLink">Logok</a>
          )}
        </nav>
        <div className="adminUserBadge">
          <span>{adminName || "Admin"}</span>
          <strong>{adminRole ? adminRole.toUpperCase() : "OWNER"}</strong>
        </div>
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
          <button className="addPlayerBtn" onClick={() => setShowAddPlayerModal(true)}>
            + Új játékos
          </button>

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

      {adminRole === "owner" && (
          <section className="staffSection">
            <h2 className="staffSectionTitle">Staff fiókok</h2>
            <p className="staffSectionSubtitle">Csak Owner férhető hozzá ehhez a szekcióhoz.</p>

            <div className="staffList">
              {staffList.map((s) => {
                const normalizedRole = String(s.role || "").toLowerCase();
                return (
                  <div key={s.id} className="staffItem">
                    <div className="staffInfo">
                      <span className="staffName">{s.admin_name}</span>
                      <span className={`staffRole staffRole-${normalizedRole}`}>
                        {normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)}
                      </span>
                    </div>
                    <div className="staffActions">
                      <button
                        className="staffBtn staffBtnEdit"
                        onClick={() => {
                          setEditingStaffId(s.id);
                          setNewStaffName(s.admin_name);
                          setNewStaffRole(s.role);
                          setNewStaffPassword("");
                        }}
                      >
                        Szerkesztés
                      </button>
                      <button
                        className="staffBtn staffBtnDelete"
                        onClick={() => handleDeleteStaff(s.id, s.admin_name)}
                      >
                        Törlés
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="staffForm">
              <h4 className="staffFormTitle">{editingStaffId ? "Staff szerkesztése" : "Új staff hozzáadása"}</h4>
              <input
                type="text"
                className="modalInput"
                placeholder="Staff név..."
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
              />
              <input
                type="text"
                className="modalInput"
                placeholder="Jelszó..."
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
              />
              <select
                className="modalInput"
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value)}
              >
                <option value="regulator">Regulator</option>
                <option value="owner">Owner</option>
              </select>
              <div className="modalActions">
                {editingStaffId && (
                  <button
                    className="modalBtn modalBtnCancel"
                    onClick={() => {
                      setEditingStaffId(null);
                      setNewStaffName("");
                      setNewStaffPassword("");
                      setNewStaffRole("regulator");
                    }}
                  >
                    Mégse
                  </button>
                )}
                <button className="modalBtn modalBtnConfirm" onClick={handleSaveStaff}>
                  {editingStaffId ? "Mentés" : "Létrehozás"}
                </button>
              </div>
            </div>
          </section>
        )}

        {selectedPlayer && (
          <div className="playerDetailsSection">
            <button className="closeDetailsBtn" onClick={() => setSelectedPlayer(null)}>
              ✕ Bezárás
            </button>

            <div className="playerDetailsCard">
              {/* ─── HEAD + NAME + UUID ─── */}
              <div className="pdRow pdRowHead">
                <img
                  src={
                    selectedPlayer.uuid
                      ? `https://mc-heads.net/avatar/${selectedPlayer.uuid.replace(/-/g, "")}/96`
                      : `https://mc-heads.net/avatar/${encodeURIComponent(selectedPlayer.username)}/96`
                  }
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
                <div className="pdBubble">
                  <span className="pdBubbleLabel">Globális Állapot</span>
                  <span className="pdBubbleValue">Aktív</span>
                </div>
              </div>
            </div>

            {/* ─── GAMEMODE TIER MANAGEMENT ─── */}
            <div className="playerTiersSection">
<div className="tiersSectionHeader">
                <h3 className="tiersSectionTitle">Játékmódok</h3>
                <span className="tiersSubtitle">Tier kezelés admin joggal.</span>
</div>
              {/*.adminTiersList */}
              <div className="playerTiersList">
                {selectedPlayer.entries.map((entry, index) => {
                  const isRetired = entry.retired === true;
                  const isUntested = entry.isUntested;
                  const displayRank = entry.elo || 0;
                  const displayPoints = getPointsForElo(displayRank);

                  return (
                    <div key={`${entry.gamemode}-${entry.id}`} className={`tierEntryCard ${isRetired ? "retired" : ""} ${isUntested ? "untested" : ""}`}>
                      <div className="tierModeCircle">
                        {MODE_ICONS[entry.gamemode] && (
                          <img src={MODE_ICONS[entry.gamemode]} alt={entry.gamemode} className="tierModeCircleImg" />
                        )}
                        <span className="tierModeCircleLabel">{entry.gamemode}</span>
                      </div>

                      <div className="tierEntryControls">
                        <TierSelect
                          value={displayRank}
                          onChange={(elo) => updateEntryField(index, "elo", elo)}
                          disabled={isRetired}
                        />
                        <span className="tierPointsBadge">{displayPoints} pont</span>

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
          font-weight: 800;
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
          font-weight: 800;
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

        .adminUserBadge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }

        .adminUserBadge span {
          opacity: 0.75;
        }

        .adminUserBadge strong {
          color: #4ade80;
          text-transform: uppercase;
          letter-spacing: 0.05em;
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
          font-weight: 800;
        }

        .headerStatLabel {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 800;
        }

        .logoutBtn {
          padding: 10px 20px;
          background: rgba(196, 30, 58, 0.8);
          border: 1px solid rgba(196, 30, 58, 0.5);
          border-radius: 6px;
          color: #fff;
          font-weight: 800;
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

        .addPlayerBtn {
          padding: 10px 18px;
          background: #4ade80;
          color: #000;
          border: none;
          border-radius: 10px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .addPlayerBtn:hover {
          background: #22c55e;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modalContent {
          background: #0f1117;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 28px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
        }

        .modalTitle {
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
        }

        .modalSubtitle {
          margin: 0 0 18px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }

        .modalInput {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          outline: none;
          box-sizing: border-box;
        }

        .modalInput:focus {
          border-color: #4ade80;
        }

        .modalActions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
          justify-content: flex-end;
        }

        .modalBtn {
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          border: none;
          transition: background 0.2s;
        }

        .modalBtnCancel {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .modalBtnCancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .modalBtnConfirm {
          background: #4ade80;
          color: #000;
        }

        .modalBtnConfirm:hover {
          background: #22c55e;
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
          font-weight: 800;
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
          font-weight: 800;
        }

        .detailValue {
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 800;
        }

.tierEntryControls {
           display: grid;
           grid-template-columns: 80px 70px 36px 36px;
           gap: 8px;
           align-items: center;
         }

        .tierPointsBadge {
           display: inline-flex;
           align-items: center;
           justify-content: center;
           min-width: 60px;
           padding: 4px 8px;
           font-size: 11px;
           font-weight: 800;
           border-radius: 6px;
           background: rgba(255, 255, 255, 0.06);
           border: 1px solid rgba(255, 255, 255, 0.12);
           color: rgba(255, 255, 255, 0.8);
           text-align: center;
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
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 800;
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
          font-weight: 800;
          color: #fff;
          animation: toastSlideIn 0.3s ease-out;
          box-shadow: 0 12px 40px #0000006e;
          pointer-events: none;
        }

        .toastOk {
          background: rgba(35, 165, 90, 0.92);
        }

        .toastError {
          background: rgba(214, 71, 71, 0.92);
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
          background: #d64747;
          color: #fff;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .pdRefreshBtn:hover {
          background: #c93f3f;
        }

        .pdActionBtns {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .pdRemoveBtn {
          padding: 8px 18px;
          border-radius: 8px;
          border: 1px solid rgba(214,71,71,0.7);
          background: rgba(214,71,71,0.15);
          color: #f3a3a3;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .pdRemoveBtn:hover {
          background: rgba(214,71,71,0.28);
          border-color: rgba(214,71,71,0.95);
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
          font-weight: 800;
          color: rgba(255,255,255,0.55);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .pdBubbleValue {
          font-size: 20px;
          font-weight: 800;
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
          font-weight: 800;
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

         /* ─── Staff Section ─── */
         .staffSection {
           background: rgba(255,255,255,0.04);
           border: 1px solid rgba(255,255,255,0.1);
           border-radius: 16px;
           padding: 24px;
           display: flex;
           flex-direction: column;
           gap: 16px;
         }

         .staffSectionTitle {
           font-size: 18px;
           font-weight: 800;
           margin: 0;
         }

         .staffSectionSubtitle {
           font-size: 13px;
           color: rgba(255,255,255,0.6);
           margin: 0 0 8px 0;
         }

         .staffList {
           display: flex;
           flex-direction: column;
           gap: 10px;
         }

         .staffItem {
           display: flex;
           justify-content: space-between;
           align-items: center;
           padding: 12px 16px;
           background: rgba(255,255,255,0.04);
           border: 1px solid rgba(255,255,255,0.08);
           border-radius: 12px;
         }

         .staffInfo {
           display: flex;
           align-items: center;
           gap: 12px;
         }

         .staffName {
           font-weight: 600;
           font-size: 15px;
         }

         .staffRole {
           font-size: 11px;
           font-weight: 800;
           text-transform: uppercase;
           padding: 4px 8px;
           border-radius: 6px;
           background: rgba(196, 30, 58, 0.2);
           color: #c41e3a;
         }

         .staffRole-owner {
           background: rgba(213, 179, 85, 0.2);
           color: #d5b355;
         }

         .staffActions {
           display: flex;
           gap: 8px;
         }

         .staffBtn {
           padding: 6px 12px;
           font-size: 12px;
           font-weight: 600;
           border: none;
           border-radius: 6px;
           cursor: pointer;
         }

         .staffBtnEdit {
           background: rgba(255,255,255,0.1);
           color: #fff;
         }

         .staffBtnDelete {
           background: rgba(214, 71, 71, 0.25);
           color: #d64747;
         }

         .staffForm {
           display: flex;
           flex-direction: column;
           gap: 12px;
           padding-top: 16px;
           border-top: 1px solid rgba(255,255,255,0.08);
         }

         .staffFormTitle {
           font-size: 14px;
           font-weight: 700;
           margin: 0;
         }

         .staffSectionBtn {
           background: rgba(196, 30, 58, 0.15);
           color: #c41e3a;
           border: 1px solid rgba(196, 30, 58, 0.3);
           border-radius: 8px;
           font-weight: 600;
         }

         .staffSectionBtn:hover {
           background: rgba(196, 30, 58, 0.25);
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
