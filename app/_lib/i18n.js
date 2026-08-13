"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LangContext = createContext({ lang: "hu", setLang: () => {}, t: (k) => k });

// Scoped translation dictionary — covers the shared navbar/search/empty-state
// strings used on the homepage and player profile pages. Not a full-site
// translation (the tier/test data itself, admin panel, and Discord messages
// stay Hungarian by design), but this is the extension point: add more keys
// here as more UI gets wired through t().
const DICT = {
  hu: {
    search_placeholder: "Játékos keresése...",
    nav_leaderboard: "Rangsor",
    nav_docs: "Dokumentáció",
    nav_info: "Információk",
    nav_discord: "Discord",
    back_to_leaderboard: "← Vissza a rangsorhoz",
    loading: "Betöltés...",
    no_test_results: "Nincs teszt eredmény",
    points_suffix: "pont",
    modes_suffix: "mód",
    compare_player: "Játékos összehasonlítása",
    compare_another: "Másik összehasonlítás",
    compare_placeholder: "Játékos neve...",
    view_full_profile: "Teljes profil és fejlődés megtekintése →",
    position_label: "Pozíció",
    no_chart_data: "Nincs elég adat a grafikonhoz.",
  },
  en: {
    search_placeholder: "Search for a player...",
    nav_leaderboard: "Leaderboard",
    nav_docs: "Docs",
    nav_info: "Info",
    nav_discord: "Discord",
    back_to_leaderboard: "← Back to leaderboard",
    loading: "Loading...",
    no_test_results: "No test results",
    points_suffix: "points",
    modes_suffix: "modes",
    compare_player: "Compare with a player",
    compare_another: "Compare with someone else",
    compare_placeholder: "Player name...",
    view_full_profile: "View full profile & progress →",
    position_label: "Position",
    no_chart_data: "Not enough data for a chart yet.",
  },
};

const STORAGE_KEY = "neontiers_lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState("hu");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "hu") setLangState(saved);
    } catch {
      // localStorage unavailable (private mode etc.) — silently keep default
    }
  }, []);

  const setLang = (next) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const t = useMemo(() => {
    const dict = DICT[lang] || DICT.hu;
    return (key) => dict[key] ?? DICT.hu[key] ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle({ className = "" }) {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      className={`langToggleBtn ${className}`}
      onClick={() => setLang(lang === "hu" ? "en" : "hu")}
      title={lang === "hu" ? "Switch to English" : "Váltás magyarra"}
      aria-label="Toggle language"
    >
      {lang === "hu" ? "🇭🇺 HU" : "🇬🇧 EN"}
      <style jsx>{`
        .langToggleBtn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.85);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }
        .langToggleBtn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </button>
  );
}
