"use client";

import Link from "next/link";
import "./informaciok.css";

export default function Informaciok() {
  return (
    <div className="infoPage">
      <div className="infoBackdrop" />
      <main className="infoCard">
        <Link href="/" className="infoBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Vissza
        </Link>

        <h1>Információ</h1>

        <p className="infoText">
          A <strong>NeonTiers</strong> a magyar Minecraft PvP közösség ranglistája.
          Minden felmérés a teszterek segítségével történik, így a rangsor a
          legpontosabb adatokon alapul.
        </p>
        <p className="infoText">
          Válaszd ki a játékmódot a füleken - Összes, Vanilla, UHC, Pot, Sword,
          Axe, Mace és sok más - és tekintsd meg a játékosok pontszámait és
          rangjaikat. A ranglista a legmagasabbra értékesített eredmények
          alapján készül, így mindig a legfrissebb adatokat látod.
        </p>

        <h2 className="infoSub">API</h2>
        <div className="endpoint">
          <span className="method">GET</span>
          <span className="path">/api/tests</span>
          <span className="desc">Összes felmérés listázása</span>
        </div>
        <div className="endpoint">
          <span className="method">GET</span>
          <span className="path">/api/mojang/{"{username}"}</span>
          <span className="desc">Játékos UUID lekérdezése a Mojang API-ból</span>
        </div>

        <footer>
          © {new Date().getFullYear()} NeonTiers
        </footer>
      </main>

    </div>
  );
}