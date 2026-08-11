"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";
import AdminDropdown from "../_components/AdminDropdown";
import "../admin-theme.css";

export default function AdminStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [toast, setToast] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRoleInput, setAdminRoleInput] = useState("regulator");
  const [confirmState, setConfirmState] = useState(null);

  const showConfirm = (message) => new Promise((resolve) => setConfirmState({ message, resolve }));
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
      if (String(data.role || "").toLowerCase() !== "owner") {
        router.push("/admin/dashboard");
        return;
      }
      await loadStaff();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const loadStaff = async () => {
    try {
      const res = await fetch("/api/admin/staff?action=list");
      if (!res.ok) throw new Error("Sikertelen betöltés");
      const data = await res.json();
      setStaffList(Array.isArray(data?.staff) ? data.staff : []);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Staff lista betöltése sikertelen" });
    }
  };

  const resetForm = () => {
    setEditingStaffId(null);
    setAdminUsername("");
    setAdminPassword("");
    setAdminRoleInput("regulator");
  };

  const handleSaveStaff = async () => {
    if (!adminUsername.trim()) {
      setToast({ type: "error", text: "Add meg a staff felhasználónevet" });
      return;
    }
    if (!editingStaffId && !adminPassword.trim()) {
      setToast({ type: "error", text: "Add meg a staff jelszavát" });
      return;
    }

    const payload = {
      action: editingStaffId ? "update" : "create",
      admin_name: adminUsername.trim(),
      role: adminRoleInput,
    };
    if (adminPassword.trim()) payload.admin_password = adminPassword.trim();
    if (editingStaffId) payload.id = editingStaffId;

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Staff mentése sikertelen" });
        return;
      }
      await loadStaff();
      setToast({ type: "ok", text: editingStaffId ? "Staff frissítve" : "Staff létrehozva" });
      resetForm();
    } catch (err) {
      console.error(err);
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
        setToast({ type: "error", text: data.error || "Staff törlése sikertelen" });
        return;
      }
      await loadStaff();
      setToast({ type: "ok", text: "Staff törölve" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="stfLoadingPage admin-panel">
        <div className="stfSpinner" />
      </div>
    );
  }

  return (
    <div className="stfPage admin-panel">
      {toast && <div className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}>{toast.text}</div>}

      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <main className="stfContent">
        <header className="stfPageHeader">
          <div>
            <h1>Staff fiókok</h1>
            <p>Hozz létre, szerkessz vagy törölj admin fiókokat.</p>
          </div>
          <span className="stfCount">{staffList.length} fiók</span>
        </header>

        <section className="stfCard">
          <h2 className="stfCardTitle">Fiókok</h2>

          <div className="stfList">
            {staffList.length === 0 ? (
              <div className="stfEmpty">Nincs még létrehozott staff fiók.</div>
            ) : (
              staffList.map((staff) => {
                const normalizedRole = String(staff.role || "").toLowerCase();
                const isEditing = editingStaffId === staff.id;
                return (
                  <div
                    key={staff.id}
                    className={`stfItem clickable ${isEditing ? "editing" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/admin/staff/${encodeURIComponent(staff.admin_name)}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") router.push(`/admin/staff/${encodeURIComponent(staff.admin_name)}`);
                    }}
                    title="Regulátor profil megnyitása"
                  >
                    <img
                      className="stfItemAvatar"
                      src={`https://mc-heads.net/avatar/${encodeURIComponent(staff.admin_name || "MHF_Question")}/40`}
                      alt=""
                      width={38}
                      height={38}
                    />
                    <div className="stfItemInfo">
                      <span className="stfItemName">{staff.admin_name}</span>
                      <span className={`stfItemRole role-${normalizedRole}`}>
                        {normalizedRole === "owner" ? "★ " : ""}
                        {normalizedRole.toUpperCase()}
                      </span>
                    </div>
                    <div className="stfItemActions">
                      <button
                        type="button"
                        className="stfIconBtn edit"
                        title="Szerkesztés"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingStaffId(staff.id);
                          setAdminUsername(staff.admin_name);
                          setAdminRoleInput(staff.role);
                          setAdminPassword("");
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="stfIconBtn delete"
                        title="Törlés"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStaff(staff.id, staff.admin_name);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="stfCard">
          <h2 className="stfCardTitle">{editingStaffId ? "Staff szerkesztése" : "Új staff hozzáadása"}</h2>

          <div className="stfFormGrid">
            <div className="stfField">
              <label className="stfLabel">Staff név</label>
              <input
                type="text"
                className="stfInput"
                placeholder="Felhasználónév"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
            </div>
            <div className="stfField">
              <label className="stfLabel">Jelszó</label>
              <input
                type="password"
                className="stfInput"
                placeholder={editingStaffId ? "Hagyd üresen, ha nem változik" : "Jelszó"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
            <div className="stfField">
              <label className="stfLabel">Jogosultság</label>
              <AdminDropdown
                value={adminRoleInput}
                onChange={setAdminRoleInput}
                options={[
                  { value: "regulator", label: "Regulator", color: "#8f7cff" },
                  { value: "owner", label: "Owner", color: "#d5b355" },
                ]}
              />
            </div>
          </div>

          <div className="stfFormActions">
            {editingStaffId && (
              <button type="button" className="stfBtn stfBtnGhost" onClick={resetForm}>
                Mégse
              </button>
            )}
            <button type="button" className="stfBtn stfBtnPrimary" onClick={handleSaveStaff}>
              {editingStaffId ? "Mentés" : "Létrehozás"}
            </button>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .stfLoadingPage {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #05060a;
        }
        .stfSpinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #8f7cff;
          animation: stfspin 0.8s linear infinite;
        }
        @keyframes stfspin {
          to { transform: rotate(360deg); }
        }
        .stfPage {
          min-height: 100vh;
          background: #05060a;
          color: #fff;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .stfContent {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          display: grid;
          gap: 22px;
        }
        .stfPageHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .stfPageHeader h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 900;
        }
        .stfPageHeader p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }
        .stfCount {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.14);
          border: 1px solid rgba(143, 124, 255, 0.35);
          color: #d7d0ff;
          font-size: 12.5px;
          font-weight: 800;
        }
        .stfCard {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.25);
        }
        .stfCardTitle {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
        }
        .stfList {
          display: grid;
          gap: 10px;
        }
        .stfEmpty {
          padding: 22px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.14);
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13.5px;
        }
        .stfItem {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.025);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .stfItem.clickable {
          cursor: pointer;
        }
        .stfItem:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.04);
        }
        .stfItem.editing {
          border-color: rgba(143, 124, 255, 0.5);
          background: rgba(143, 124, 255, 0.08);
        }
        .stfItemAvatar {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          object-fit: cover;
          image-rendering: pixelated;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
          flex: 0 0 auto;
        }
        .stfItemInfo {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }
        .stfItemName {
          font-weight: 800;
          font-size: 14px;
          color: #fff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .stfItemRole {
          align-self: flex-start;
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          border: 1px solid rgba(143, 124, 255, 0.35);
          color: #d7d0ff;
        }
        .stfItemRole.role-owner {
          background: rgba(213, 179, 85, 0.18);
          border-color: rgba(213, 179, 85, 0.45);
          color: #e8cf8a;
        }
        .stfItemActions {
          display: flex;
          gap: 8px;
          flex: 0 0 auto;
        }
        .stfIconBtn {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }
        .stfIconBtn svg {
          width: 16px;
          height: 16px;
        }
        .stfIconBtn:hover {
          transform: translateY(-1px);
        }
        .stfIconBtn.edit:hover {
          border-color: rgba(143, 124, 255, 0.5);
          background: rgba(143, 124, 255, 0.14);
          color: #d7d0ff;
        }
        .stfIconBtn.delete:hover {
          border-color: rgba(214, 71, 71, 0.5);
          background: rgba(214, 71, 71, 0.16);
          color: #ffb4b4;
        }
        .stfFormGrid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
        }
        .stfField {
          display: grid;
          gap: 8px;
        }
        .stfLabel {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.55);
        }
        .stfInput {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
        }
        .stfInput:focus {
          outline: none;
          border-color: #8f7cff;
        }
        .stfFormActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .stfBtn {
          padding: 12px 22px;
          border-radius: 12px;
          border: none;
          font-weight: 900;
          font-size: 13.5px;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .stfBtnGhost {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.75);
        }
        .stfBtnGhost:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .stfBtnPrimary {
          background: linear-gradient(135deg, #8f7cff, #6f5cd6);
          box-shadow: 0 8px 24px rgba(143, 124, 255, 0.35);
          color: #fff;
        }
        .stfBtnPrimary:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(143, 124, 255, 0.5);
        }
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
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
          pointer-events: none;
        }
        .toastOk { background: rgba(52, 211, 153, 0.95); }
        .toastError { background: rgba(214, 71, 71, 0.95); }

        @media (max-width: 720px) {
          .stfFormGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
