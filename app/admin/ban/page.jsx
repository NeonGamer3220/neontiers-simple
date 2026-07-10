"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";
import "../admin-theme.css";

const DURATION_OPTIONS = [
  { value: "1d", label: "1 nap", days: 1 },
  { value: "3d", label: "3 nap", days: 3 },
  { value: "1w", label: "1 hét", days: 7 },
  { value: "2w", label: "2 hét", days: 14 },
  { value: "1m", label: "1 hónap", days: 30 },
  { value: "3m", label: "3 hónap", days: 90 },
  { value: "6m", label: "6 hónap", days: 180 },
  { value: "1y", label: "1 év", days: 365 },
  { value: "perm", label: "Végleges (örökre)", days: null },
];

export default function BanManagerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState("");
  const [adminName, setAdminName] = useState("");
  const [toast, setToast] = useState(null);

  const [playerQuery, setPlayerQuery] = useState("");
  const [playerResults, setPlayerResults] = useState([]);
  const [playerSearching, setPlayerSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerBoxOpen, setPlayerBoxOpen] = useState(false);
  const playerBoxRef = useRef(null);

  const [uuid, setUuid] = useState("");
  const [uuidLoading, setUuidLoading] = useState(false);

  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("6m");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      const role = String(data.role || "").toLowerCase();
      if (role) setAdminRole(role);
      if (data.admin_name) setAdminName(String(data.admin_name));

      if (role !== "owner") {
        router.push("/admin/dashboard");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

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

  // UUID lekérése a kiválasztott játékos Minecraft neve alapján
  useEffect(() => {
    if (!selectedPlayer?.minecraftName) {
      setUuid("");
      return;
    }
    let cancelled = false;
    setUuidLoading(true);
    setUuid("");
    (async () => {
      try {
        const res = await fetch(`/api/mojang?username=${encodeURIComponent(selectedPlayer.minecraftName)}`);
        const data = await res.json();
        if (!cancelled && data?.id) {
          const raw = String(data.id).replace(/-/g, "");
          const formatted = `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
          setUuid(formatted);
        }
      } catch {
        // némán elnyeljük, a UUID nem kötelező
      } finally {
        if (!cancelled) setUuidLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPlayer]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const handleSelectPlayer = (p) => {
    setSelectedPlayer(p);
    setPlayerQuery(p.minecraftName);
    setPlayerBoxOpen(false);
  };

  const durationInfo = DURATION_OPTIONS.find((d) => d.value === duration) || DURATION_OPTIONS[0];

  const canSave = !!selectedPlayer && reason.trim().length > 0 && !saving;

  const previewMessage = useMemo(() => {
    if (!selectedPlayer) return "";
    const header = `<@${selectedPlayer.discordId || "..."}> - \`${selectedPlayer.minecraftName}\`${uuid ? ` (\`${uuid}\`)` : ""}`;
    const reasonBlock = (reason.trim() || "...")
      .split("\n")
      .map((l) => `> ${l.trim()}`)
      .join("\n");
    const lejaratText = durationInfo.days ? `${durationInfo.label} múlva` : "Sosem (végleges)";
    return [header, reasonBlock, `**Lejárat:** ${lejaratText}`].join("\n\n");
  }, [selectedPlayer, uuid, reason, durationInfo]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: selectedPlayer,
          uuid,
          reason,
          duration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Hiba a mentés során" });
        setSaving(false);
        return;
      }
      setToast({ type: "ok", text: "Ban elküldve! A bot hamarosan kiküldi Discordra." });
      setReason("");
      setSelectedPlayer(null);
      setPlayerQuery("");
      setUuid("");
      setDuration("6m");
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
      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <main className="htContent">
        <header className="htPageHeader">
          <div>
            <h1>Ban Kezelő</h1>
            <p>Válaszd ki a játékost, add meg az indoklást, és a bot automatikusan kiküldi a Discord csatornára.</p>
          </div>
        </header>

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
              <span className="htPlayerChipDiscord">
                {uuidLoading ? "UUID betöltése..." : uuid ? `UUID: ${uuid}` : "UUID nem található"}
              </span>
              <button type="button" className="htPlayerChipClear" onClick={() => { setSelectedPlayer(null); setPlayerQuery(""); setUuid(""); }}>
                ×
              </button>
            </div>
          )}
        </section>

        <section className="htCard">
          <h2 className="htCardTitle">Ban adatai</h2>

          <div className="htTopGrid banTopGrid">
            <div className="htField">
              <label className="htLabel">Időtartam</label>
              <select className="htInput htSelect" value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="htField">
            <label className="htLabel">Indoklás</label>
            <textarea
              className="htInput htTextarea"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Miért kapja a bant a játékos?"
            />
          </div>
        </section>

        <section className="htCard htPreviewCard">
          <h2 className="htCardTitle">Előnézet</h2>
          <div className="htDiscordBubble">
            <div className="htDiscordHeader">
              <div className="htDiscordAvatar banAvatar">NT</div>
              <div className="htDiscordMeta">
                <span className="htDiscordBotName">
                  NeonTiers Bot <span className="htDiscordBotTag">BOT</span>
                </span>
                <span className="htDiscordChannel">#ban-log</span>
              </div>
            </div>
            <pre className="htPreviewBox">
              {previewMessage || "Válassz ki egy játékost és írj indoklást az előnézethez."}
            </pre>
          </div>
          <div className="htSaveRow">
            <span className="htSaveTarget">
              Küldés ide: <strong>Ban Log</strong> Discord csatorna
            </span>
            <button type="button" className="htSaveBtn banSaveBtn" disabled={!canSave} onClick={handleSave}>
              {saving ? "Küldés..." : "Ban kiküldése"}
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
        .htCardTitle {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
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
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(214, 71, 71, 0.14);
          border: 1px solid rgba(214, 71, 71, 0.4);
          font-size: 13px;
        }
        .htPlayerChipMc {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          color: #ffd7d7;
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
        .banTopGrid {
          grid-template-columns: 1fr;
          max-width: 320px;
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
          border-color: #d64747;
        }
        .htSelect {
          appearance: none;
        }
        .htTextarea {
          resize: vertical;
          min-height: 90px;
          line-height: 1.5;
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
        .banAvatar {
          background: linear-gradient(135deg, #d64747, #8f2020);
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
          color: #ff9d9d;
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
        .banSaveBtn {
          background: linear-gradient(135deg, #d64747, #a12e2e);
          box-shadow: 0 8px 24px rgba(214, 71, 71, 0.35);
        }
        .banSaveBtn:hover:not(:disabled) {
          box-shadow: 0 10px 30px rgba(214, 71, 71, 0.5);
        }
        .htSaveBtn:hover:not(:disabled) {
          transform: translateY(-1px);
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

        @media (max-width: 720px) {
          .htTopGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
