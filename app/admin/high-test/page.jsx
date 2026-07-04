"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";

const LEGACY_MODES = ["Boxing", "Combo", "Bridge", "No Debuff", "OP", "Soup", "Fireball Fight"];
const MODERN_MODES = [
  "Vanilla", "UHC", "Pot", "NethPot", "SMP",
  "Sword", "Axe", "Mace", "Cart", "Creeper", "DiaSMP",
  "OGVanilla", "ShieldlessUHC", "SpearMace", "SpearElytra", "Stick Fight", "Trident",
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
  Boxing: "/images/boxing.png",
  Combo: "/images/combo.png",
  Bridge: "/images/bridge.png",
  "No Debuff": "/images/no debuff.png",
  OP: "/images/op.png",
  Soup: "/images/soup.png",
  "Fireball Fight": "/images/fireball fight.png",
};

const TIER_ORDER = ["LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
const HIGH_TIER_INDEX = TIER_ORDER.indexOf("HT3");

export default function HighTestManagerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState("");
  const [adminName, setAdminName] = useState("");
  const [toast, setToast] = useState(null);

  const [category, setCategory] = useState("modern"); // "legacy" | "modern"
  const [success, setSuccess] = useState(true);
  const [testedTier, setTestedTier] = useState("HT3");
  const [gamemode, setGamemode] = useState("");
  const [fights, setFights] = useState({ LT3: "", HT3: "", LT2: "", HT2: "", LT1: "", HT1: "" });

  const [playerQuery, setPlayerQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [playerSearching, setPlayerSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerBoxOpen, setPlayerBoxOpen] = useState(false);
  const playerBoxRef = useRef(null);

  const [saving, setSaving] = useState(false);

  const modeOptions = category === "legacy" ? LEGACY_MODES : MODERN_MODES;

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
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    // Reset gamemode when category changes if it no longer fits
    if (gamemode && !modeOptions.includes(gamemode)) {
      setGamemode("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (playerBoxRef.current && !playerBoxRef.current.contains(e.target)) {
        setPlayerBoxOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!playerQuery.trim() || (selectedPlayer && selectedPlayer.minecraftName === playerQuery.trim())) {
      setPlayerResults([]);
      return;
    }
    setPlayerSearching(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/linked-accounts?q=${encodeURIComponent(playerQuery.trim())}`);
        const data = await res.json();
        setPlayerResults(Array.isArray(data?.results) ? data.results : []);
      } catch {
        setPlayerResults([]);
      } finally {
        setPlayerSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [playerQuery, selectedPlayer]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const handleSelectPlayer = (p) => {
    setSelectedPlayer(p);
    setPlayerQuery(p.minecraftName);
    setPlayerBoxOpen(false);
  };

  const handleFightChange = (tier, value) => {
    setFights((prev) => ({ ...prev, [tier]: value }));
  };

  const filledFights = TIER_ORDER.filter((t) => fights[t].trim().length > 0);
  const testedTierIndex = TIER_ORDER.indexOf(testedTier);
  const needsHighResult = testedTierIndex >= HIGH_TIER_INDEX;
  const missingHighResult = needsHighResult && filledFights.length === 0;

  const canSave =
    !!selectedPlayer &&
    !!testedTier &&
    !!gamemode &&
    filledFights.length > 0 &&
    !missingHighResult &&
    !saving;

  const previewMessage = useMemo(() => {
    if (!selectedPlayer) return "";
    const resultText = success ? "Sikeres" : "Sikertelen";
    const header = `<@${selectedPlayer.discordId || "..."}> (\`${selectedPlayer.minecraftName}\`) - **${resultText} volt a ${testedTier || "?"} teszten** ${gamemode ? `🎮 **${gamemode}**` : ""}`;
    const blocks = filledFights.map((t) => {
      const text = fights[t].trim();
      return `**__${t} Fightok:__**\n${text.split("\n").map((l) => `> ${l.trim()}`).join("\n")}`;
    });
    return [header, "", ...blocks].join("\n\n");
  }, [selectedPlayer, success, testedTier, gamemode, fights, filledFights]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/high-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          success,
          testedTier,
          gamemode,
          fights,
          player: selectedPlayer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a mentés során" });
        setSaving(false);
        return;
      }
      setToast({ type: "ok", text: "Elmentve! A bot hamarosan kiküldi Discordra." });
      setFights({ LT3: "", HT3: "", LT2: "", HT2: "", LT1: "", HT1: "" });
      setSelectedPlayer(null);
      setPlayerQuery("");
      setSaving(false);
    } catch (err) {
      setToast({ type: "error", text: "Hálózati hiba" });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="htLoadingPage">
        <div className="htSpinner" />
      </div>
    );
  }

  return (
    <div className="htPage">
      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <main className="htContent">
        <header className="htPageHeader">
          <div>
            <h1>Magas Eredmény Kezelő</h1>
            <p>Rögzítsd egy HT3+ teszt eredményét, és automatikusan kiküldjük a megfelelő Discord csatornára.</p>
          </div>
        </header>

        <section className="htCard htCategoryCard">
          <h2 className="htCardTitle">Kategória</h2>
          <div className="htCategoryRow">
            <button
              type="button"
              className={`htCategoryBtn ${category === "legacy" ? "active" : ""}`}
              onClick={() => setCategory("legacy")}
            >
              <span className="htCategoryDot" />
              Legacy
            </button>
            <button
              type="button"
              className={`htCategoryBtn ${category === "modern" ? "active" : ""}`}
              onClick={() => setCategory("modern")}
            >
              <span className="htCategoryDot" />
              Modern
            </button>
          </div>
        </section>

        <section className="htCard">
          <h2 className="htCardTitle">Játékos</h2>
          <div className="htPlayerSearch" ref={playerBoxRef}>
            <input
              className="htInput"
              placeholder="Minecraft név alapján keresés..."
              value={playerQuery}
              onChange={(e) => {
                setPlayerQuery(e.target.value);
                setSelectedPlayer(null);
                setPlayerBoxOpen(true);
              }}
              onFocus={() => setPlayerBoxOpen(true)}
            />
            {playerBoxOpen && playerQuery.trim() && (
              <div className="htPlayerDropdown">
                {playerSearching && <div className="htPlayerDropdownItem htMuted">Keresés...</div>}
                {!playerSearching && playerResults.length === 0 && (
                  <div className="htPlayerDropdownItem htMuted">Nincs találat</div>
                )}
                {!playerSearching &&
                  playerResults.map((p) => (
                    <button
                      type="button"
                      key={p.id || `${p.minecraftName}-${p.discordId}`}
                      className="htPlayerDropdownItem"
                      onClick={() => handleSelectPlayer(p)}
                    >
                      <strong>{p.minecraftName || "(nincs mc név)"}</strong>
                      <span>{p.discordUsername ? `@${p.discordUsername}` : p.discordId}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
          {selectedPlayer && (
            <div className="htPlayerChip">
              <span className="htPlayerChipMc">`{selectedPlayer.minecraftName}`</span>
              <span className="htPlayerChipDiscord">
                {selectedPlayer.discordUsername ? `@${selectedPlayer.discordUsername}` : `ID: ${selectedPlayer.discordId}`}
              </span>
              <button type="button" className="htPlayerChipClear" onClick={() => { setSelectedPlayer(null); setPlayerQuery(""); }}>
                ×
              </button>
            </div>
          )}
        </section>

        <section className="htCard">
          <div className="htCardTitleRow">
            <h2 className="htCardTitle">Magas eredmény adatai</h2>
            <p className="htCardHint">HT3 vagy afeletti tierhez legalább egy magas eredmény mezőt ki kell tölteni.</p>
          </div>

          <div className="htTopGrid">
            <div className="htField">
              <label className="htLabel">Eredmény</label>
              <div className="htToggleRow">
                <button
                  type="button"
                  className={`htToggleBtn ${success ? "active ok" : ""}`}
                  onClick={() => setSuccess(true)}
                >
                  Sikeres
                </button>
                <button
                  type="button"
                  className={`htToggleBtn ${!success ? "active bad" : ""}`}
                  onClick={() => setSuccess(false)}
                >
                  Sikertelen
                </button>
              </div>
            </div>

            <div className="htField">
              <label className="htLabel">Tesztelt tier</label>
              <select className="htInput htSelect" value={testedTier} onChange={(e) => setTestedTier(e.target.value)}>
                {TIER_ORDER.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="htField">
              <label className="htLabel">Gamemode</label>
              <select className="htInput htSelect" value={gamemode} onChange={(e) => setGamemode(e.target.value)}>
                <option value="">Válassz gamemode-ot...</option>
                {modeOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="htFightsGrid">
            {[["LT3", "HT3"], ["LT2", "HT2"], ["LT1", "HT1"]].map(([left, right]) => (
              <React.Fragment key={left}>
                <div className="htField">
                  <label className="htLabel">{left} Fightok</label>
                  <textarea
                    className="htInput htTextarea"
                    rows={3}
                    value={fights[left]}
                    onChange={(e) => handleFightChange(left, e.target.value)}
                    placeholder={`nyert 4-1 Ellenfél\nvesztett 2-4 Ellenfél`}
                  />
                </div>
                <div className="htField">
                  <label className="htLabel">{right} Fightok</label>
                  <textarea
                    className="htInput htTextarea"
                    rows={3}
                    value={fights[right]}
                    onChange={(e) => handleFightChange(right, e.target.value)}
                    placeholder={`nyert 4-1 Ellenfél\nvesztett 2-4 Ellenfél`}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>

          {missingHighResult && (
            <div className="htWarning">
              HT3 vagy afeletti tierhez legalább egy magas eredmény mezőt ki kell tölteni.
            </div>
          )}
        </section>

        <section className="htCard htPreviewCard">
          <h2 className="htCardTitle">Előnézet</h2>
          <pre className="htPreviewBox">
            {previewMessage || "Válassz ki egy játékost és tölts ki legalább egy Fightok mezőt az előnézethez."}
          </pre>
          <div className="htSaveRow">
            <span className="htSaveTarget">
              Küldés ide: <strong>{category === "legacy" ? "Legacy" : "Modern"}</strong> Discord csatorna
            </span>
            <button type="button" className="htSaveBtn" disabled={!canSave} onClick={handleSave}>
              {saving ? "Mentés..." : "Mentés"}
            </button>
          </div>
        </section>
      </main>

      {toast && (
        <div className={`htToast ${toast.type === "error" ? "htToastError" : "htToastOk"}`}>{toast.text}</div>
      )}

      <style jsx>{`
        .htLoadingPage {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #05060a;
        }
        .htSpinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #8f7cff;
          animation: htspin 0.8s linear infinite;
        }
        @keyframes htspin {
          to { transform: rotate(360deg); }
        }
        .htPage {
          min-height: 100vh;
          background: #05060a;
          color: #fff;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .htContent {
          max-width: 1080px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          display: grid;
          gap: 22px;
        }
        .htPageHeader h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 900;
        }
        .htPageHeader p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }
        .htCard {
          background: rgba(255, 255, 255, 0.035);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 22px 24px;
        }
        .htCardTitleRow {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 18px;
        }
        .htCardTitle {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
        }
        .htCardTitleRow .htCardTitle {
          margin-bottom: 0;
        }
        .htCardHint {
          margin: 0;
          font-size: 12.5px;
          color: rgba(255, 180, 130, 0.85);
        }
        .htCategoryRow {
          display: flex;
          gap: 12px;
        }
        .htCategoryBtn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .htCategoryDot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }
        .htCategoryBtn.active {
          color: #fff;
          background: rgba(143, 124, 255, 0.18);
          border-color: #8f7cff;
        }
        .htCategoryBtn.active .htCategoryDot {
          opacity: 1;
          background: #8f7cff;
        }
        .htPlayerSearch {
          position: relative;
        }
        .htPlayerDropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #14161f;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          overflow: hidden;
          z-index: 30;
          max-height: 260px;
          overflow-y: auto;
        }
        .htPlayerDropdownItem {
          display: flex;
          width: 100%;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: #fff;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
        }
        .htPlayerDropdownItem:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .htPlayerDropdownItem span {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }
        .htMuted {
          color: rgba(255, 255, 255, 0.45);
          cursor: default;
        }
        .htPlayerChip {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          border: 1px solid rgba(143, 124, 255, 0.4);
          font-size: 13px;
        }
        .htPlayerChipMc {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #d7d0ff;
        }
        .htPlayerChipDiscord {
          color: rgba(255, 255, 255, 0.6);
        }
        .htPlayerChipClear {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
        }
        .htTopGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }
        .htField {
          display: grid;
          gap: 8px;
        }
        .htLabel {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.55);
        }
        .htInput {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
        }
        .htInput:focus {
          outline: none;
          border-color: #8f7cff;
        }
        .htSelect {
          appearance: none;
        }
        .htTextarea {
          resize: vertical;
          min-height: 78px;
          line-height: 1.5;
        }
        .htToggleRow {
          display: flex;
          gap: 8px;
        }
        .htToggleBtn {
          flex: 1;
          padding: 12px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
        }
        .htToggleBtn.active.ok {
          background: rgba(52, 211, 153, 0.2);
          border-color: #34d399;
          color: #b8f5dd;
        }
        .htToggleBtn.active.bad {
          background: rgba(214, 71, 71, 0.22);
          border-color: #d64747;
          color: #ffc9c9;
        }
        .htFightsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 20px;
        }
        .htWarning {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(214, 71, 71, 0.16);
          border: 1px solid rgba(214, 71, 71, 0.4);
          color: #ffc9c9;
          font-size: 13px;
          font-weight: 700;
        }
        .htPreviewBox {
          margin: 0 0 18px;
          padding: 16px;
          border-radius: 12px;
          background: #0b0d13;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .htSaveRow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .htSaveTarget {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
        }
        .htSaveTarget strong {
          color: #b7aadf;
        }
        .htSaveBtn {
          padding: 13px 28px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #8f7cff, #6f5cd6);
          color: #fff;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
        }
        .htSaveBtn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .htToast {
          position: fixed;
          bottom: 22px;
          right: 22px;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 800;
          z-index: 999;
          max-width: 320px;
        }
        .htToastOk {
          background: rgba(52, 211, 153, 0.95);
          color: #04241a;
        }
        .htToastError {
          background: rgba(214, 71, 71, 0.95);
          color: #fff;
        }

        @media (max-width: 720px) {
          .htTopGrid {
            grid-template-columns: 1fr;
          }
          .htFightsGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
