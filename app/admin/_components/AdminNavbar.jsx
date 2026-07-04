"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Shared admin panel navigation bar.
 *
 * Usage:
 * <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />
 */
export default function AdminNavbar({ adminName, adminRole, onLogout }) {
  const pathname = usePathname() || "";
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = String(adminRole || "").toLowerCase();
  const isOwner = role === "owner";

  const links = [
    { href: "/admin/dashboard", label: "Játékos kezelő", show: true },
    { href: "/admin/high-test", label: "Magas Eredmény Kezelő", show: true },
    { href: "/admin/surveys", label: "Felmérések", show: isOwner },
    { href: "/admin/logs", label: "Logok", show: isOwner },
    { href: "/admin/staff", label: "Staff fiókok", show: isOwner },
  ].filter((l) => l.show);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="anAdminNav">
      <div className="anInner">
        <div className="anBrandRow">
          <a href="/admin/dashboard" className="anBrand">
            <span className="anBrandMark">NT</span>
            <span className="anBrandText">
              NeonTiers
              <small>Admin Panel</small>
            </span>
          </a>
          <button
            type="button"
            className="anBurger"
            aria-label="Menü megnyitása"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav className={`anLinks ${mobileOpen ? "open" : ""}`} aria-label="Admin navigáció">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`anLink ${isActive(l.href) ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a href="/" className="anLink anLinkGhost" onClick={() => setMobileOpen(false)}>
            Publikus oldal
          </a>
          <div className="anMobileFooter">
            <div className="anUserBadge">
              <span className="anUserName">{adminName || "Admin"}</span>
              <strong className="anUserRole">{role ? role.toUpperCase() : "OWNER"}</strong>
            </div>
            <button type="button" className="anLogoutBtn" onClick={onLogout}>
              Kijelentkezés
            </button>
          </div>
        </nav>

        <div className="anRight">
          <div className="anUserBadge">
            <span className="anUserName">{adminName || "Admin"}</span>
            <strong className="anUserRole">{role ? role.toUpperCase() : "OWNER"}</strong>
          </div>
          <button type="button" className="anLogoutBtn" onClick={onLogout}>
            Kijelentkezés
          </button>
        </div>
      </div>

      <style jsx>{`
        .anAdminNav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(9, 11, 17, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .anInner {
          max-width: 1520px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .anBrandRow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex: 0 0 auto;
        }
        .anBrand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: #fff;
        }
        .anBrandMark {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8f7cff, #d64747);
          font-weight: 900;
          font-size: 14px;
          letter-spacing: 0.02em;
          flex: 0 0 auto;
        }
        .anBrandText {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          font-weight: 800;
          font-size: 16px;
        }
        .anBrandText small {
          font-weight: 700;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.5);
        }
        .anBurger {
          display: none;
          flex-direction: column;
          gap: 4px;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .anBurger span {
          display: block;
          width: 16px;
          height: 2px;
          background: #fff;
          border-radius: 2px;
        }
        .anLinks {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          flex-wrap: wrap;
        }
        .anLink {
          display: inline-flex;
          align-items: center;
          padding: 9px 14px;
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.68);
          text-decoration: none;
          font-weight: 700;
          font-size: 13px;
          transition: background 0.15s ease, color 0.15s ease;
          white-space: nowrap;
        }
        .anLink:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.06);
        }
        .anLink.active {
          color: #fff;
          background: rgba(143, 124, 255, 0.22);
          box-shadow: inset 0 0 0 1px rgba(143, 124, 255, 0.5);
        }
        .anLinkGhost {
          margin-left: auto;
          color: rgba(255, 255, 255, 0.45);
        }
        .anRight {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 0 0 auto;
        }
        .anUserBadge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.2;
        }
        .anUserName {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
        .anUserRole {
          font-size: 11px;
          letter-spacing: 0.05em;
          color: #b7aadf;
        }
        .anLogoutBtn {
          padding: 9px 16px;
          border-radius: 10px;
          border: 1px solid rgba(214, 71, 71, 0.4);
          background: rgba(214, 71, 71, 0.14);
          color: #ffb4b4;
          font-weight: 800;
          font-size: 12.5px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .anLogoutBtn:hover {
          background: rgba(214, 71, 71, 0.28);
        }
        .anMobileFooter {
          display: none;
        }

        @media (max-width: 920px) {
          .anInner {
            flex-wrap: wrap;
            padding: 12px 16px;
          }
          .anBrandRow {
            width: 100%;
            justify-content: space-between;
          }
          .anBurger {
            display: flex;
          }
          .anRight {
            display: none;
          }
          .anLinks {
            display: none;
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
          .anLinks.open {
            display: flex;
          }
          .anLink {
            width: 100%;
          }
          .anLinkGhost {
            margin-left: 0;
          }
          .anMobileFooter {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-top: 8px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
        }
      `}</style>
    </header>
  );
}
