"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";
import "../admin-theme.css";

const RANKS = [
  { value: "", label: "Rangsorolatlan", points: 0, color: "rgba(255, 255, 255, 0.68)" },
  { value: "LT5", label: "LT5", points: 1, color: "#40384f" },
  { value: "HT5", label: "HT5", points: 2, color: "#6f6389" },
  { value: "LT4", label: "LT4", points: 3, color: "#514764" },
  { value: "HT4", label: "HT4", points: 4, color: "#b7aadf" },
  { value: "LT3", label: "LT3", points: 6, color: "#b36830" },
  { value: "HT3", label: "HT3", points: 10, color: "#dd8849" },
  { value: "LT2", label: "LT2", points: 16, color: "#888d95" },
  { value: "HT2", label: "HT2", points: 28, color: "#a4b3c7" },
  { value: "LT1", label: "LT1", points: 40, color: "#d5b355" },
  { value: "HT1", label: "HT1", points: 60, color: "#ffcf4a" },
  { value: "RLT2", label: "RLT2", points: 16, color: "#8f7cff", retired: true },
  { value: "RHT2", label: "RHT2", points: 28, color: "#8f7cff", retired: true },
  { value: "RLT1", label: "RLT1", points: 40, color: "#8f7cff", retired: true },
  { value: "RHT1", label: "RHT1", points: 60, color: "#8f7cff", retired: true },
];

const RANK_BY_VALUE = RANKS.reduce((acc, r) => {
  acc[r.value] = r;
  return acc;
}, {});

// The database stores rank as a raw ELO number (e.g. 1750) since the
// migration to the ELO system, but some rows may still contain legacy tier
// strings (e.g. "HT3"). This converts either into a tier label like "HT3"
// so the admin panel always displays tiers instead of raw numbers.
function normalizeRankToTier(value) {
  if (value === "" || value === null || value === undefined) return "";
  const strVal = String(value).trim().toUpperCase();
  if (RANK_BY_VALUE[strVal]) return strVal;
  const num = Number(strVal);
  if (Number.isNaN(num)) return "";
  if (num >= 2750) return "HT1";
  if (num >= 2500) return "LT1";
  if (num >= 2250) return "HT2";
  if (num >= 2000) return "LT2";
  if (num >= 1750) return "HT3";
  if (num >= 1500) return "LT3";
  if (num >= 1250) return "HT4";
  if (num >= 1000) return "LT4";
  if (num >= 750) return "HT5";
  if (num >= 500) return "LT5";
  return "";
}

function AdminRankPicker({ value, onChange, disabled = false, onSave }) {
  const [open, setOpen] = useState(false);
  const pickerRef = React.useRef(null);

  const current = RANK_BY_VALUE[normalizeRankToTier(value)] || RANK_BY_VALUE[""];
  const activeRanks = RANKS.filter((r) => !r.retired);
  const retiredRanks = RANKS.filter((r) => r.retired);

  useEffect(() => {
    if (!open || disabled) {
      setOpen(false);
      return;
    }
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, disabled]);

  const handleSelect = (rankValue) => {
    if (!disabled) {
      onChange(rankValue);
    }
    setOpen(false);
  };

  const renderOption = (r) => (
    <button
      type="button"
      key={r.value || "unranked"}
      className={`adminRankOption ${value === r.value ? "selected" : ""}`}
      style={{ "--admin-rank-color": r.color }}
      onClick={() => handleSelect(r.value)}
    >
      <span className="adminRankOptionDot" />
      <span className="adminRankOptionMain">
        <span className="adminRankOptionLabel">{r.label}</span>
        <span className="adminRankOptionMeta">{r.points} pont</span>
      </span>
      {value === r.value && <span className="adminRankOptionCheck">✓</span>}
      {r.retired && <span className="adminRankOptionRetired">Visszavonult</span>}
    </button>
  );

  return (
    <div
      className="adminModeControls"
      ref={pickerRef}
      data-admin-rank-picker="true"
      style={{ position: "relative", zIndex: open ? 200 : 1 }}
    >
      <div className="adminRankPicker">
        <button
          type="button"
          className="adminRankButton"
          style={{ "--admin-rank-color": current.color }}
          onClick={() => !disabled && setOpen((v) => !v)}
          aria-expanded={open && !disabled}
          disabled={disabled}
        >
          <span className="adminRankSwatch" />
          <span className="adminRankButtonText">
            <strong>{current.label}</strong>
            <span>{current.points} pont</span>
          </span>
          <span className="adminRankChevron">{open && !disabled ? "▴" : "▾"}</span>
        </button>

        {open && !disabled && (
          <div className="adminRankMenu">
            <div className="adminRankGroupLabel">Tierek</div>
            {activeRanks.map(renderOption)}
            {retiredRanks.length > 0 && (
              <>
                <div className="adminRankGroupLabel">Visszavonult tierek</div>
                {retiredRanks.map(renderOption)}
              </>
            )}
          </div>
        )}
      </div>

      {onSave && (
        <button
          type="button"
          className="adminSaveButton"
          onClick={onSave}
          title="Mentés"
          aria-label="Mentés"
        >
          ✓
        </button>
      )}

      <style jsx global>{`
        /* ─── Admin Rank Picker (custom v2) ─── */
        .adminModeControls {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          flex: 0 0 auto;
        }

        .adminRankPicker {
          position: relative;
        }

        .adminRankButton {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px 8px 8px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(0, 0, 0, 0.22);
          color: #fff;
          cursor: pointer;
          font-family: Montserrat, inherit;
          min-width: 128px;
          transition: background 0.15s, border-color 0.15s;
        }

        .adminRankButton:hover {
          background: rgba(0, 0, 0, 0.32);
          border-color: rgba(255, 255, 255, 0.16);
        }

        .adminRankButton[disabled],
        .adminRankButton.disabled {
          opacity: 0.42;
          cursor: not-allowed;
          pointer-events: none;
        }

        .adminRankSwatch {
          width: 8px;
          height: 30px;
          border-radius: 5px;
          background: var(--admin-rank-color, #888d95);
          flex: 0 0 auto;
        }

        .adminRankButtonText {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.25;
          min-width: 0;
        }

        .adminRankButtonText strong {
          font-size: 13.5px;
          font-weight: 900;
          letter-spacing: 0.03em;
          color: #fff;
          text-transform: uppercase;
        }

        .adminRankButtonText span {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--admin-rank-color, rgba(255, 255, 255, 0.5));
        }

        .adminRankChevron {
          margin-left: auto;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          flex: 0 0 auto;
        }

        .adminSaveButton {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(120, 200, 150, 0.35);
          background: rgba(80, 200, 140, 0.14);
          color: #7be3ab;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          font-weight: 900;
          flex: 0 0 auto;
          transition: background 0.15s, transform 0.1s;
        }

        .adminSaveButton:hover {
          background: rgba(80, 200, 140, 0.24);
          transform: translateY(-1px);
        }

        .adminRankMenu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          z-index: 50;
          width: 250px;
          box-sizing: border-box;
          background: #14161e;
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
          animation: fadeIn 0.1s ease-out;
          padding: 8px;
          max-height: 360px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .adminRankMenu * {
          box-sizing: border-box;
        }

        .adminRankGroupLabel {
          font-size: 9.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: rgba(255, 255, 255, 0.32);
          padding: 8px 10px 4px;
        }

        .adminRankOption {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 10px;
          background: transparent;
          border: none;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          font-family: Montserrat, inherit;
          text-align: left;
          transition: background 0.12s;
        }

        .adminRankOption:hover {
          background: rgba(255, 255, 255, 0.055);
        }

        .adminRankOption.selected {
          background: rgba(255, 255, 255, 0.09);
        }

        .adminRankOptionDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--admin-rank-color, #888d95);
          flex: 0 0 auto;
        }

        .adminRankOptionMain {
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          min-width: 0;
        }

        .adminRankOptionLabel {
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.02em;
          color: #fff;
        }

        .adminRankOptionMeta {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--admin-rank-color, rgba(255, 255, 255, 0.45));
        }

        .adminRankOptionCheck {
          font-size: 12px;
          color: #7be3ab;
          flex: 0 0 auto;
        }

        .adminRankOptionRetired {
          margin-left: auto;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 3px 7px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          color: #b7aadf;
          flex: 0 0 auto;
        }
      `}</style>
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

function getPointsForRating(rating) {
  const TIER_TO_RATING = { LT5:500, HT5:750, LT4:1000, HT4:1250, LT3:1500, HT3:1750, LT2:2000, HT2:2250, LT1:2500, HT1:2750 };
  let value;
  if (typeof rating === "string") {
    const key = rating.trim().toUpperCase();
    if (TIER_TO_RATING[key] !== undefined) value = TIER_TO_RATING[key];
    else value = Number(rating);
  } else {
    value = Number(rating);
  }
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
  const [confirmState, setConfirmState] = useState(null);

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
      // These two requests are independent of each other, so run them in
      // parallel instead of waiting for /api/admin/check to fully finish
      // before even starting the /api/tests fetch — this is what made the
      // dashboard feel slow to load.
      const [checkRes, testsData] = await Promise.all([
        fetch("/api/admin/check"),
        fetch("/api/tests", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      if (!checkRes.ok) {
        router.push("/admin");
        return;
      }
      const data = await checkRes.json();
      if (data.role) setAdminRole(String(data.role).toLowerCase());
      if (data.admin_name) setAdminName(String(data.admin_name));
      setTests(Array.isArray(testsData?.tests) ? testsData.tests : []);
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
      const res = await fetch("/api/tests", { cache: "no-store" });
      const data = await res.json();
      const nextTests = Array.isArray(data?.tests) ? data.tests : [];
      setTests(nextTests);
      return nextTests;
    } catch (err) {
      console.error("Failed to load tests:", err);
      return tests;
    }
  };

  const safeInt = (n, fallback = 0) => {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
  };

  const findBestRank = (ranks) => {
    const rankOrder = ["HT1","LT1","HT2","LT2","HT3","LT3","HT4","LT4","HT5","LT5",""];
    const tierRanks = ranks.map((r) => normalizeRankToTier(r));
    for (const r of rankOrder) {
      if (tierRanks.includes(r)) return r;
    }
    return tierRanks[0] || "";
  };

  const getStats = () => {
    const uniquePlayers = new Set(tests.map((t) => String(t.username).trim().toLowerCase())).size;
    const totalTiers = tests.length;
    return { uniquePlayers, totalTiers };
  };

    const getPlayerData = (username, includeUntested = false, testsOverride = null) => {
     const cleanName = String(username || "").trim();
     const sourceTests = testsOverride || tests;
     const playerTests = sourceTests.filter((t) => String(t?.username || "").trim().toLowerCase() === cleanName.toLowerCase());
     if (playerTests.length === 0 && !includeUntested) return null;

      const mapped = playerTests.map((t) => {
        return {
          gamemode: t.gamemode,
          uuid: t.uuid || null,
          rank: t.rank || "",
          retired: t.retired === true,
          points: t.points || 0,
          id: t.id,
          created_at: t.created_at || null,
        };
      });
      let entries = [...mapped];

      // Always include every gamemode so none are hidden
      const testedModes = new Set(entries.map((e) => e.gamemode.toLowerCase()));
      for (const mode of MODE_OPTIONS) {
        if (!testedModes.has(mode.toLowerCase())) {
          entries.push({
            gamemode: mode,
            rank: "",
            retired: false,
            points: 0,
            id: null,
            created_at: null,
            isUntested: true,
          });
        }
      }

      const totalPoints = entries.reduce((sum, e) => sum + safeInt(getPointsForRating(e.rank), 0), 0);
     const bestRank = findBestRank(entries.map((e) => e.rank));

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
      const points = getPointsForRating(entry.rank);
      const payload = {
        username: selectedPlayer.username,
        gamemode: entry.gamemode,
        rank: entry.rank,
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

      const freshTests = await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested, freshTests);
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
      if (field === "rank") {
        entries[index] = {
          ...current,
          rank: value,
          points: getPointsForRating(value),
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

const freshTests = await loadTests();
      const refreshed = getPlayerData(selectedPlayer.username, showUntested, freshTests);
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

      const isUuidInput = (value) => {
        const raw = String(value || "").replace(/-/g, "").trim();
        return /^[0-9a-fA-F]{32}$/.test(raw);
      };

      let targetNewName = null;
      let currentMojangName = null;

      if (selectedPlayer.uuid) {
        const res = await fetch(`/api/mojang?uuid=${selectedPlayer.uuid.replace(/-/g, "")}`);
        if (res.ok) {
          const data = await res.json();
          currentMojangName = data.name;
        }
      }

      if (currentMojangName) {
        targetNewName = currentMojangName;
      } else if (newNameInput.trim()) {
        if (isUuidInput(newNameInput)) {
          const uuidRes = await fetch(`/api/mojang?uuid=${newNameInput.replace(/-/g, "")}`);
          if (uuidRes.ok) {
            const uuidData = await uuidRes.json();
            targetNewName = uuidData.name;
          }
        } else {
          targetNewName = newNameInput.trim();
        }
      }

      if (!targetNewName) {
        setToast({ type: "error", text: "Adj meg egy érvényes játékosnevet vagy UUID-t!" });
        return;
      }

      if (targetNewName === currentName) {
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
  // ── Add player with a default rating (500) in every gamemode ──
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
              rank: "LT5",
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
          details: { modes: MODE_OPTIONS.length, rank: "LT5", uuid },
        }),
      });

      await loadTests();
      setShowAddPlayerModal(false);
      setNewPlayerName("");
      setToast({ type: "ok", text: `${username} hozzáadva minden gamemode-hoz LT5 rankkel.` });
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

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="adminDashboard admin-panel">
        <div className="loadingState">Betöltés...</div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="adminDashboard admin-panel">

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
            <p className="modalSubtitle">Minden gamemode-hoz 500 pontot kap.</p>
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

      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

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
                    {adminRole !== "regulator" && (
                      <button className="pdRemoveBtn" onClick={handleRemovePlayer}>
                        Eltávolítás
                      </button>
                    )}
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
                  const displayRank = entry.rank || "";
                  const displayPoints = getPointsForRating(displayRank);

                  return (
                    <div key={`${entry.gamemode}-${entry.id}`} className={`tierEntryCard ${isRetired ? "retired" : ""} ${isUntested ? "untested" : ""}`}>
                      <div className="tierModeCircle">
                        {MODE_ICONS[entry.gamemode] && (
                          <img src={MODE_ICONS[entry.gamemode]} alt={entry.gamemode} className="tierModeCircleImg" />
                        )}
                        <span className="tierModeCircleLabel">{entry.gamemode}</span>
                      </div>

                      <div className="tierEntryControls">
                        <AdminRankPicker
                          value={displayRank}
                          onChange={(rank) => updateEntryField(index, "rank", rank)}
                          disabled={isRetired}
                          onSave={() => handleSaveEntry(entry)}
                        />
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
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 16px 24px;
          background: rgba(11, 14, 20, 0.94);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          max-width: 1480px;
          margin: 0 auto;
        }

        .navbarLeft {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 0 0 auto;
        }

        .navbarTitle {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .navbarLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          flex: 1;
          min-width: 240px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .navbarLink {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          color: rgba(255, 255, 255, 0.72);
          text-decoration: none;
          font-weight: 800;
          font-size: 13px;
          border-radius: 999px;
          transition: color 0.18s ease, background 0.18s ease, transform 0.18s ease;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .navbarLink:hover,
        .navbarLink.active {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .adminUserBadge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
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
          gap: 14px;
        }

        .headerStat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 10px 22px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(143, 124, 255, 0.14), rgba(143, 124, 255, 0.03));
          border: 1px solid rgba(143, 124, 255, 0.25);
          box-shadow: 0 6px 20px rgba(143, 124, 255, 0.12);
        }

        .headerStatValue {
          font-size: 26px;
          font-weight: 900;
          background: linear-gradient(90deg, #fff, #cfc6ff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
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
          background: #d64747;
          border: 1px solid rgba(214, 71, 71, 0.7);
          border-radius: 6px;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logoutBtn:hover {
          background: #c23f3f;
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
          display: grid;
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
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .searchContainer:focus-within {
          border-color: rgba(143, 124, 255, 0.6);
          box-shadow: 0 0 0 3px rgba(143, 124, 255, 0.15);
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
          gap: 6px;
          max-height: 260px;
          overflow-y: auto;
          padding: 4px 0;
        }

        .searchResultItem {
          text-align: left;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
          font-family: inherit;
          font-size: 14px;
        }

        .searchResultItem:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(2px);
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
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          flex-shrink: 0;
          box-shadow: 0 6px 18px rgba(74, 222, 128, 0.25);
        }

        .addPlayerBtn:hover {
          background: #22c55e;
          box-shadow: 0 8px 22px rgba(74, 222, 128, 0.4);
          transform: translateY(-1px);
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
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tierEntryCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          min-width: 0;
          transition: background 0.18s ease, border-color 0.18s ease;
        }

        .tierEntryCard:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.14);
        }

        .tierEntryCard.retired {
          opacity: 0.6;
          border-style: dashed;
        }

        .tierEntryModeInfo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .tierEntryMode {
          font-size: 13px;
          font-weight: 800;
        }

        .tierEntryControls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 0;
          flex: 0 0 auto;
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

        .adminNavbar,
        .adminHeader,
        .adminContent,
        .searchSection,
        .playerDetailsSection,
        .tierEntryCard {
          animation: none;
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
          flex-direction: column;
          gap: 10px;
        }

        .tierEntryCard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 16px;
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          width: 100%;
          box-sizing: border-box;
          position: relative;
        }

        .tierEntryCard:hover {
          border-color: rgba(143, 124, 255, 0.3);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
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

