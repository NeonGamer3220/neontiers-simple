"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

import "../admin-theme.css";

const LEGACY_MODES = ["Boxing", "Combo", "Bridge", "No Debuff", "OP", "Soup", "Fireball Fight"];
const MODERN_MODES = [
  "Vanilla", "UHC", "Pot", "NethPot", "SMP",
  "Sword", "Axe", "Mace", "Cart", "Creeper", "DiaSMP",
  "OGVanilla", "ShieldlessUHC", "SpearMace", "SpearElytra", "Trident",
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
  Trident: "/images/trident.png",
  Boxing: "/images/boxing.png",
  Combo: "/images/combo.png",
  Bridge: "/images/bridge.png",
  "No Debuff": "/images/no debuff.png",
  OP: "/images/op.png",
  Soup: "/images/soup.png",
  "Fireball Fight": "/images/fireball fight.png",
};

// "FT" (first-to) counts per gamemode — matches a Modern/Legacy Szabályzat
// gamemode-követelmények táblázatát ("LT3 felett" oszlop, ami a HT3+
// teszteknél irányadó). A pontszám-választó ezekből generálja az opciókat.
const FT_MODERN = {
  Vanilla: 4, SMP: 4, Cart: 4, DiaSMP: 4, OGVanilla: 4, NethPot: 4,
  Mace: 4, SpearMace: 4, SpearElytra: 4, Trident: 4,
  Sword: 10, UHC: 10, Pot: 10, Creeper: 10, ShieldlessUHC: 10,
  Axe: 20,
};
const FT_LEGACY = {
  Boxing: 4, Combo: 4, "Fireball Fight": 4, Soup: 4, OP: 4, "No Debuff": 4,
  Bridge: 10,
};

function getFT(category, gamemode) {
  const map = category === "legacy" ? FT_LEGACY : FT_MODERN;
  return map[gamemode] || null;
}

function scoreOptionsFor(category, gamemode, won) {
  const ft = getFT(category, gamemode);
  if (!ft) return [];
  const opts = [];
  for (let i = ft - 1; i >= 0; i--) {
    opts.push(won ? `${ft}-${i}` : `${i}-${ft}`);
  }
  return opts;
}

const TIER_ORDER = ["LT3", "HT3", "LT2", "HT2", "LT1", "HT1"];
const ALL_TIERS = ["LT5", "HT5", "LT4", "HT4", "LT3", "HT3", "LT2", "HT2", "LT1", "HT1"]; // worst → best

// If a player passes the tier they were tested for, they get that tier.
// If they fail, they get the next tier DOWN (one step worse) — e.g. failed
// LT2 → HT3, failed HT3 → LT3.
function resolveTierFromTest(testedTier, passed) {
  const idx = ALL_TIERS.indexOf(testedTier);
  if (idx === -1) return null;
  if (passed) return testedTier;
  const worseIdx = idx - 1;
  if (worseIdx < 0) return null; // already the lowest tier — nothing worse to give
  return ALL_TIERS[worseIdx];
}

function tierBelow(tier) {
  const i = TIER_ORDER.indexOf(tier);
  if (i <= 0) return tier;
  return TIER_ORDER[i - 1];
}
function tierAbove(tier) {
  const i = TIER_ORDER.indexOf(tier);
  if (i === -1 || i >= TIER_ORDER.length - 1) return tier;
  return TIER_ORDER[i + 1];
}

function presetComments(tier) {
  const below = tierBelow(tier);
  const above = tierAbove(tier);
  return [
    {
      key: "lost25",
      short: "Nem nyerte meg a körök 25%-át",
      text: `nem nyerte meg a körök 25%-át, új tierje: ${below}`,
    },
    {
      key: "won75",
      short: "Megnyerte a körök 75%-át",
      text: `megnyerte a körök 75%-át, új tierje: ${tier}`,
    },
    {
      key: "twoRounds",
      short: `Nincs ${tier}, elég 2 kör`,
      text: `nincs ${tier} ezért ${above} ellen elég 2 kört nyernie.`,
    },
  ];
}

let rowIdSeq = 1;
function makeRow(category, gamemode, tier) {
  const won = true;
  const opts = scoreOptionsFor(category, gamemode, won);
  return {
    id: rowIdSeq++,
    tier,
    won,
    score: opts[0] || "",
    opponent: "",
    opponentQuery: "",
    opponentOpen: false,
    comment: "",
  };
}

// ─── Generic custom dropdown ───
function Dropdown({ value, options, onChange, placeholder = "Válassz...", renderLabel, className = "", disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div className={`htDropdown ${className} ${disabled ? "disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="htDropdownBtn"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        disabled={disabled}
      >
        {current?.icon && <img src={current.icon} alt="" className="htDropdownBtnIcon" />}
        {current?.color && <span className="htDropdownBtnDot" style={{ background: current.color }} />}
        <span className="htDropdownBtnText">{current ? (renderLabel ? renderLabel(current) : current.label) : placeholder}</span>
        <span className="htDropdownChevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="htDropdownMenu">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              className={`htDropdownItem ${o.value === value ? "selected" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.icon && <img src={o.icon} alt="" className="htDropdownIcon" />}
              {o.color && <span className="htDropdownDot" style={{ background: o.color }} />}
              <span>{renderLabel ? renderLabel(o) : o.label}</span>
              {o.value === value && <span className="htDropdownCheck">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// High-test tab — rendered inside AdminShell for any logged-in admin.
export default function HighTestTab() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [category, setCategory] = useState("modern"); // "legacy" | "modern"
  const [testedTier, setTestedTier] = useState("HT3");
  const [gamemode, setGamemode] = useState("");

  const [playerQuery, setPlayerQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [playerSearching, setPlayerSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerBoxOpen, setPlayerBoxOpen] = useState(false);
  const playerBoxRef = useRef(null);

  const [fights, setFights] = useState([]);

  // All known usernames, fetched once, used for opponent-name autocomplete.
  const [knownPlayers, setKnownPlayers] = useState([]);

  const [saving, setSaving] = useState(false);
  const [manualPassed, setManualPassed] = useState(true);
  const [applyTierChange, setApplyTierChange] = useState(true);

  const modeOptions = category === "legacy" ? LEGACY_MODES : MODERN_MODES;

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

  // Fetch the full player list once, for the opponent-name autocomplete.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tests?limit=2000", { cache: "no-store" });
        const data = await res.json();
        const rows = Array.isArray(data?.tests) ? data.tests : [];
        const seen = new Set();
        const names = [];
        for (const r of rows) {
          const name = String(r?.username || "").trim();
          if (!name || seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          names.push(name);
        }
        names.sort((a, b) => a.localeCompare(b));
        setKnownPlayers(names);
      } catch {
        setKnownPlayers([]);
      }
    })();
  }, []);

  const handleSelectPlayer = (p) => {
    setSelectedPlayer(p);
    setPlayerQuery(p.minecraftName);
    setPlayerBoxOpen(false);
  };

  // ─── Fight rows ───
  const addFightRow = (tier) => {
    setFights((prev) => [...prev, makeRow(category, gamemode, tier || testedTier)]);
  };

  const removeFightRow = (id) => {
    setFights((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFight = (id, patch) => {
    setFights((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const next = { ...f, ...patch };
        // If "won" changed, the current score may no longer be valid — reset to the first valid option.
        if (Object.prototype.hasOwnProperty.call(patch, "won")) {
          const opts = scoreOptionsFor(category, gamemode, next.won);
          if (!opts.includes(next.score)) next.score = opts[0] || "";
        }
        return next;
      })
    );
  };

  // When gamemode/category changes, re-validate every row's score.
  useEffect(() => {
    setFights((prev) =>
      prev.map((f) => {
        const opts = scoreOptionsFor(category, gamemode, f.won);
        if (opts.includes(f.score)) return f;
        return { ...f, score: opts[0] || "" };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, gamemode]);

  const gamemodeOptions = useMemo(
    () => [
      { value: "", label: "Válassz gamemode-ot..." },
      ...modeOptions.map((m) => ({ value: m, label: m, icon: MODE_ICONS[m] })),
    ],
    [modeOptions]
  );

  const tierOptions = useMemo(() => TIER_ORDER.map((t) => ({ value: t, label: t })), []);

  const canAddRow = !!gamemode;

  const overallWon = manualPassed;
  const resolvedTier = resolveTierFromTest(testedTier, overallWon);

  const rowsValid =
    fights.length > 0 &&
    fights.every((f) => f.tier && f.score && f.opponent.trim().length > 0);

  const canSave = !!selectedPlayer && !!testedTier && !!gamemode && rowsValid && !saving;

  // Fights grouped by their own tier, in TIER_ORDER — this is what both the
  // preview and the saved payload are built from ("1 sor = 1 fight", de a
  // fightok tier szerint vannak kategorizálva, ahogy a Fightok szekcióban is).
  const fightsByTier = useMemo(() => {
    const map = {};
    for (const t of TIER_ORDER) map[t] = [];
    for (const f of fights) {
      if (map[f.tier]) map[f.tier].push(f);
    }
    return map;
  }, [fights]);

  const previewMessage = useMemo(() => {
    if (!selectedPlayer) return "";
    const resultText = overallWon ? "Sikeres" : "Sikertelen";
    const header = `<@${selectedPlayer.discordId || "..."}> (\`${selectedPlayer.minecraftName}\`) - **${resultText} volt a ${testedTier || "?"} teszten**`;
    const modeLine = gamemode ? `🎮 **${gamemode}**` : "";
    const fightBlocks = TIER_ORDER.filter((t) => fightsByTier[t].some((f) => f.score && f.opponent.trim())).map((t) => {
      const lines = fightsByTier[t]
        .filter((f) => f.score && f.opponent.trim())
        .map((f) => {
          const verb = f.won ? "nyert" : "vesztett";
          const comment = f.comment.trim() ? ` (${f.comment.trim()})` : "";
          return `> ${verb} ${f.score} ${f.opponent.trim()}${comment}`;
        });
      return `**__${t} Fightok:__**\n${lines.join("\n")}`;
    });
    return [header, modeLine, ...fightBlocks].filter(Boolean).join("\n\n");
  }, [selectedPlayer, overallWon, testedTier, gamemode, fightsByTier]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/high-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          testedTier,
          gamemode,
          overallWon,
          player: selectedPlayer,
          fights: fights.map((f) => ({
            tier: f.tier,
            won: f.won,
            score: f.score,
            opponent: f.opponent.trim(),
            comment: f.comment.trim(),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a mentés során" });
        setSaving(false);
        return;
      }

      let tierMsg = "";
      if (applyTierChange) {
        if (!resolvedTier) {
          tierMsg = ` Figyelem: sikertelen ${testedTier} teszt esetén nincs ennél gyengébb tier, a tier NEM változott.`;
        } else {
          try {
            const tierRes = await fetch("/api/admin/set-tier", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: selectedPlayer.minecraftName,
                gamemode,
                rank: resolvedTier,
                retired: false,
              }),
            });
            const tierData = await tierRes.json();
            if (!tierRes.ok) {
              tierMsg = ` Figyelem: a fight mentve, de a tier frissítése sikertelen (${tierData.error || "hiba"}).`;
            } else {
              tierMsg = ` Tier frissítve: ${resolvedTier}.`;
            }
          } catch {
            tierMsg = " Figyelem: a fight mentve, de a tier frissítése hálózati hiba miatt sikertelen.";
          }
        }
      }

      setToast({ type: "ok", text: `Elmentve! A bot hamarosan kiküldi Discordra.${tierMsg}` });
      setFights([]);
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
      <div className="htLoadingPage admin-panel">
        <div className="htSpinner" />
      </div>
    );
  }

  return (
    <div className="htPage admin-panel">
      <main className="htContent">
        <header className="htPageHeader">
          <div>
            <h1>Magas Eredmény Kezelő</h1>
            <p>Rögzítsd egy HT3+ teszt fightjait tier szerint kategorizálva, és automatikusan kiküldjük a megfelelő Discord csatornára.</p>
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
            <h2 className="htCardTitle">Teszt adatai</h2>
            <p className="htCardHint">A "Tesztelt tier" a fejlécben szereplő tier — a fightokat lent, tier szerint csoportosítva add hozzá.</p>
          </div>

          <div className="htTopGrid htTopGrid3">
            <div className="htField">
              <label className="htLabel">Tesztelt tier</label>
              <Dropdown
                value={testedTier}
                options={tierOptions}
                onChange={setTestedTier}
                placeholder="Válassz tiert..."
              />
            </div>

            <div className="htField">
              <label className="htLabel">Gamemode</label>
              <Dropdown
                value={gamemode}
                options={gamemodeOptions}
                onChange={setGamemode}
                placeholder="Válassz gamemode-ot..."
              />
            </div>

            <div className="htField">
              <label className="htLabel">Teszt eredménye</label>
              <button
                type="button"
                className={`htCategoryBtn ${manualPassed ? "active" : ""}`}
                onClick={() => setManualPassed((v) => !v)}
              >
                <span className="htCategoryDot" />
                {manualPassed ? "Sikeres" : "Sikertelen"}
              </button>
            </div>
          </div>

          <div className="htTierChangeRow">
            <label className="htTierChangeToggle">
              <input
                type="checkbox"
                checked={applyTierChange}
                onChange={(e) => setApplyTierChange(e.target.checked)}
              />
              <span>Tier módosítása mentéskor</span>
            </label>
            {applyTierChange && (
              <span className="htTierChangeResult">
                {resolvedTier ? (
                  <>
                    {manualPassed ? "Sikeres" : "Sikertelen"} {testedTier} teszt → kapott tier:{" "}
                    <strong style={{ color: "var(--accent, #8f7cff)" }}>{resolvedTier}</strong>
                  </>
                ) : (
                  <span style={{ color: "#ff9b9b" }}>
                    Sikertelen {testedTier} teszt esetén nincs ennél gyengébb tier — a tier nem fog változni.
                  </span>
                )}
              </span>
            )}
          </div>
        </section>

        <section className="htCard">
          <div className="htCardTitleRow">
            <h2 className="htCardTitle">Fightok</h2>
            <p className="htCardHint">Minden sor egy fight — válaszd ki, melyik tierhez tartozik. Legalább egyet adj hozzá a mentéshez.</p>
          </div>

          {!gamemode && <div className="htWarning">Előbb válassz gamemode-ot, utána tudsz fightokat hozzáadni.</div>}

          {gamemode && (
            <div className="htTierGroups">
              {TIER_ORDER.map((tier) => (
                <div className="htTierGroup" key={tier}>
                  <div className="htTierGroupHead">
                    <span className="htTierGroupBadge">{tier}</span>
                    <span className="htTierGroupTitle">{tier} Fightok</span>
                    <button type="button" className="htTierGroupAdd" onClick={() => addFightRow(tier)}>
                      + Fight
                    </button>
                  </div>

                  {fightsByTier[tier].length === 0 ? (
                    <p className="htTierGroupEmpty">Még nincs fight ehhez a tierhez.</p>
                  ) : (
                    <div className="htFightRows">
                      {fightsByTier[tier].map((f) => {
                        const globalIdx = fights.indexOf(f);
                        return (
                          <FightRow
                            key={f.id}
                            index={globalIdx}
                            fight={f}
                            category={category}
                            gamemode={gamemode}
                            selectedPlayer={selectedPlayer}
                            knownPlayers={knownPlayers}
                            onChange={(patch) => updateFight(f.id, patch)}
                            onRemove={() => removeFightRow(f.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="htCard htPreviewCard">
          <h2 className="htCardTitle">Előnézet</h2>
          <div className="htDiscordBubble">
            <div className="htDiscordHeader">
              <div className="htDiscordAvatar">NT</div>
              <div className="htDiscordMeta">
                <span className="htDiscordBotName">
                  NeonTiers Bot <span className="htDiscordBotTag">BOT</span>
                </span>
                <span className="htDiscordChannel">
                  #{category === "legacy" ? "legacy-eredmenyek" : "modern-eredmenyek"}
                </span>
              </div>
            </div>
            <pre className="htPreviewBox">
              {previewMessage || "Válassz ki egy játékost, gamemode-ot és adj hozzá legalább egy fightot az előnézethez."}
            </pre>
          </div>
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

      <style jsx global>{`
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
          max-width: 1120px;
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
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.25);
          transition: border-color 0.2s ease;
        }
        .htCard:hover {
          border-color: rgba(255, 255, 255, 0.14);
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
        .htCategoryBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 255, 255, 0.2);
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
          background: linear-gradient(135deg, rgba(143, 124, 255, 0.28), rgba(214, 71, 71, 0.14));
          border-color: #8f7cff;
          box-shadow: 0 0 0 1px rgba(143, 124, 255, 0.3), 0 8px 24px rgba(143, 124, 255, 0.28);
        }
        .htCategoryBtn.active .htCategoryDot {
          opacity: 1;
          background: #8f7cff;
          box-shadow: 0 0 10px 2px rgba(143, 124, 255, 0.8);
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
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .htTopGrid3 {
          grid-template-columns: repeat(3, 1fr);
        }
        .htTierChangeRow {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px 20px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .htTierChangeToggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
        }
        .htTierChangeToggle input {
          width: 16px;
          height: 16px;
          accent-color: #8f7cff;
          cursor: pointer;
        }
        .htTierChangeResult {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 600;
        }
        @media (max-width: 760px) {
          .htTopGrid3 {
            grid-template-columns: 1fr;
          }
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
        .htWarning {
          margin-top: 4px;
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(214, 71, 71, 0.16);
          border: 1px solid rgba(214, 71, 71, 0.4);
          color: #ffc9c9;
          font-size: 13px;
          font-weight: 700;
        }

        /* ─── Tier groups ─── */
        .htTierGroups {
          display: grid;
          gap: 16px;
        }
        .htTierGroup {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.02);
          padding: 14px 16px 16px;
        }
        .htTierGroupHead {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .htTierGroupBadge {
          font-size: 11.5px;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(143, 124, 255, 0.18);
          border: 1px solid rgba(143, 124, 255, 0.4);
          color: #d7d0ff;
        }
        .htTierGroupTitle {
          flex: 1;
          font-size: 13px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.85);
        }
        .htTierGroupAdd {
          padding: 6px 12px;
          border-radius: 9px;
          border: 1px dashed rgba(143, 124, 255, 0.45);
          background: rgba(143, 124, 255, 0.08);
          color: #d7d0ff;
          font-weight: 800;
          font-size: 11.5px;
          cursor: pointer;
        }
        .htTierGroupAdd:hover {
          background: rgba(143, 124, 255, 0.16);
        }
        .htTierGroupEmpty {
          margin: 4px 0 2px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
        }

        /* ─── Custom dropdown ─── */
        .htDropdown {
          position: relative;
        }
        .htDropdown.disabled {
          opacity: 0.5;
        }
        .htDropdownBtn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 11px 12px;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
        }
        .htDropdownBtn:hover {
          border-color: rgba(255, 255, 255, 0.22);
        }
        .htDropdownBtnIcon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          flex: 0 0 auto;
        }
        .htDropdownBtnDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 auto;
        }
        .htDropdownBtnText {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .htDropdownChevron {
          flex: 0 0 auto;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }
        .htDropdownMenu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #14161f;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          overflow-y: auto;
          max-height: 280px;
          z-index: 60;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
        }
        .htDropdownItem {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 13.5px;
          text-align: left;
          cursor: pointer;
        }
        .htDropdownItem:last-child {
          border-bottom: none;
        }
        .htDropdownItem:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .htDropdownItem.selected {
          background: rgba(143, 124, 255, 0.14);
          color: #d7d0ff;
        }
        .htDropdownIcon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          flex: 0 0 auto;
        }
        .htDropdownDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 auto;
        }
        .htDropdownCheck {
          margin-left: auto;
          color: #8f7cff;
          font-weight: 900;
        }

        /* ─── Fight rows ─── */
        .htFightRows {
          display: grid;
          gap: 10px;
        }
        .htFightRow {
          position: relative;
          display: grid;
          grid-template-columns: 30px 116px 128px 88px minmax(140px, 1fr) minmax(160px, 1.4fr) 32px;
          grid-template-areas: "idx result player score opponent comment remove";
          gap: 10px;
          align-items: start;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.025);
        }
        .htFightRowIndex {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.4);
        }
        .htFightRowPlayerChip {
          display: flex;
          align-items: center;
          height: 42px;
          padding: 0 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12.5px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.75);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .htFightRowOpponent {
          position: relative;
        }
        .htFightRowOpponentDropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #14161f;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 10px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 70;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.45);
        }
        .htFightRowOpponentItem {
          width: 100%;
          text-align: left;
          padding: 9px 12px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 13px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .htFightRowOpponentItem:last-child {
          border-bottom: none;
        }
        .htFightRowOpponentItem:hover {
          background: rgba(255, 255, 255, 0.07);
        }
        .htFightRowCommentWrap {
          display: grid;
          gap: 6px;
        }
        .htFightPresets {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .htFightPresetBtn {
          padding: 4px 9px;
          border-radius: 999px;
          border: 1px solid rgba(143, 124, 255, 0.35);
          background: rgba(143, 124, 255, 0.1);
          color: #d7d0ff;
          font-size: 10.5px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .htFightPresetBtn:hover {
          background: rgba(143, 124, 255, 0.2);
        }
        .htFightRowRemove {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          width: 32px;
          border-radius: 10px;
          border: 1px solid rgba(214, 71, 71, 0.3);
          background: rgba(214, 71, 71, 0.1);
          color: #ffc9c9;
          font-size: 16px;
          cursor: pointer;
          line-height: 1;
        }
        .htFightRowRemove:hover {
          background: rgba(214, 71, 71, 0.22);
        }

        .htDiscordBubble {
          border-radius: 14px;
          background: #0b0d13;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 16px 16px;
          margin-bottom: 18px;
        }
        .htDiscordHeader {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .htDiscordAvatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #8f7cff, #d64747);
          font-size: 11px;
          font-weight: 900;
          flex: 0 0 auto;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .htDiscordMeta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .htDiscordBotName {
          font-size: 13.5px;
          font-weight: 800;
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .htDiscordBotTag {
          font-size: 9px;
          font-weight: 800;
          background: #5865f2;
          color: #fff;
          padding: 1px 5px;
          border-radius: 4px;
          letter-spacing: 0.03em;
        }
        .htDiscordChannel {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
        }
        .htPreviewBox {
          margin: 0;
          padding: 0;
          background: transparent;
          border: none;
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
          box-shadow: 0 8px 24px rgba(143, 124, 255, 0.35);
          color: #fff;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.15s ease;
        }
        .htSaveBtn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(143, 124, 255, 0.5);
        }
        .htSaveBtn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
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

        @media (max-width: 900px) {
          .htFightRow {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              "idx remove"
              "player player"
              "result score"
              "opponent opponent"
              "comment comment";
          }
        }

        @media (max-width: 720px) {
          .htTopGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function FightRow({ index, fight, category, gamemode, selectedPlayer, knownPlayers, onChange, onRemove }) {
  const scoreOpts = scoreOptionsFor(category, gamemode, fight.won).map((s) => ({ value: s, label: s }));
  const opponentRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (opponentRef.current && !opponentRef.current.contains(e.target)) {
        onChange({ opponentOpen: false });
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opponentMatches = useMemo(() => {
    const q = fight.opponentQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return knownPlayers.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [fight.opponentQuery, knownPlayers]);

  const presets = presetComments(fight.tier);

  return (
    <div className="htFightRow">
      <div className="htFightRowIndex" style={{ gridArea: "idx" }}>#{index + 1}</div>

      <div style={{ gridArea: "result" }}>
        <Dropdown
          value={fight.won ? "won" : "lost"}
          options={[
            { value: "won", label: "Nyert", color: "#34d399" },
            { value: "lost", label: "Vesztett", color: "#d64747" },
          ]}
          onChange={(v) => onChange({ won: v === "won" })}
        />
      </div>

      <div className="htFightRowPlayerChip" style={{ gridArea: "player" }} title="A tesztelt játékos (nem szerkeszthető)">
        {selectedPlayer ? `\`${selectedPlayer.minecraftName}\`` : "Nincs kiválasztva"}
      </div>

      <div style={{ gridArea: "score" }}>
        <Dropdown value={fight.score} options={scoreOpts} onChange={(v) => onChange({ score: v })} placeholder="Eredmény" />
      </div>

      <div className="htFightRowOpponent" style={{ gridArea: "opponent" }} ref={opponentRef}>
        <input
          className="htInput"
          placeholder="Ellenfél neve..."
          value={fight.opponentQuery || fight.opponent}
          onChange={(e) => onChange({ opponentQuery: e.target.value, opponent: e.target.value, opponentOpen: true })}
          onFocus={() => onChange({ opponentOpen: true })}
        />
        {fight.opponentOpen && opponentMatches.length > 0 && (
          <div className="htFightRowOpponentDropdown">
            {opponentMatches.map((name) => (
              <button
                type="button"
                key={name}
                className="htFightRowOpponentItem"
                onClick={() => onChange({ opponent: name, opponentQuery: name, opponentOpen: false })}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="htFightRowCommentWrap" style={{ gridArea: "comment" }}>
        <input
          className="htInput"
          placeholder="Megjegyzés (opcionális)..."
          value={fight.comment}
          onChange={(e) => onChange({ comment: e.target.value })}
        />
        <div className="htFightPresets">
          {presets.map((p) => (
            <button
              type="button"
              key={p.key}
              className="htFightPresetBtn"
              title={p.text}
              onClick={() => onChange({ comment: p.text })}
            >
              {p.short}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="htFightRowRemove" style={{ gridArea: "remove" }} onClick={onRemove} title="Fight törlése">
        ×
      </button>
    </div>
  );
}
