"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";
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
      <div className="adminPage admin-panel">
        <div className="loadingScreen">
          <div className="loadingBox">
            <div className="loaderCircle" />
            <p>Betöltés...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adminPage admin-panel">
      {toast && <div className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}>{toast.text}</div>}

      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <main className="adminContent">
        <section className="staffSection">
          <div className="staffHeader">
            <div>
              <h2 className="staffSectionTitle">Staff fiókok</h2>
              <p className="staffSectionSubtitle">Itt hozhatsz létre, szerkeszthetsz és törölhetsz admin fiókokat.</p>
            </div>
            <div className="staffStats">
              <span>{staffList.length} fiók</span>
            </div>
          </div>

          <div className="staffList">
            {staffList.length === 0 ? (
              <div className="emptyStateCard">Nincs még létrehozott staff fiók.</div>
            ) : (
              staffList.map((staff) => {
                const normalizedRole = String(staff.role || "").toLowerCase();
                return (
                  <div key={staff.id} className="staffItem">
                    <div className="staffInfo">
                      <span className="staffName">{staff.admin_name}</span>
                      <span className={`staffRole staffRole-${normalizedRole}`}>
                        {normalizedRole.toUpperCase()}
                      </span>
                    </div>
                    <div className="staffActions">
                      <button
                        className="staffBtn staffBtnEdit"
                        onClick={() => {
                          setEditingStaffId(staff.id);
                          setAdminUsername(staff.admin_name);
                          setAdminRoleInput(staff.role);
                          setAdminPassword("");
                        }}
                      >
                        Szerkesztés
                      </button>
                      <button
                        className="staffBtn staffBtnDelete"
                        onClick={() => handleDeleteStaff(staff.id, staff.admin_name)}
                      >
                        Törlés
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="staffForm">
            <h3 className="formTitle">{editingStaffId ? "Staff szerkesztése" : "Új staff hozzáadása"}</h3>
            <div className="formRow">
              <label>Staff név</label>
              <input
                type="text"
                className="formInput"
                placeholder="Felhasználónév"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
              />
            </div>
            <div className="formRow">
              <label>Jelszó</label>
              <input
                type="password"
                className="formInput"
                placeholder="Jelszó"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
            <div className="formRow">
              <label>Jogosultság</label>
              <select className="formInput" value={adminRoleInput} onChange={(e) => setAdminRoleInput(e.target.value)}>
                <option value="regulator">Regulator</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="formActions">
              {editingStaffId && (
                <button className="secondaryBtn" onClick={resetForm}>Mégse</button>
              )}
              <button className="primaryBtn" onClick={handleSaveStaff}>{editingStaffId ? "Mentés" : "Létrehozás"}</button>
            </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .adminPage {
          min-height: 100vh;
          background: #0b0e14;
          color: #fff;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .loadingScreen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px;
          background: linear-gradient(180deg, rgba(11, 14, 20, 0.9), #0b0e14);
        }

        .loadingBox {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 28px 32px;
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }

        .loaderCircle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 6px solid rgba(255,255,255,0.12);
          border-top-color: #d64747;
          animation: spin 1s linear infinite;
        }

        .loadingBox p {
          margin: 0;
          font-size: 16px;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.88);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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

        .logoutBtn,
        .primaryBtn,
        .secondaryBtn {
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          border: none;
          min-width: 120px;
        }

        .logoutBtn,
        .primaryBtn {
          background: #d64747;
          color: #fff;
        }

        .secondaryBtn {
          background: rgba(255,255,255,0.08);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .primaryBtn:hover,
        .logoutBtn:hover,
        .secondaryBtn:hover {
          transform: translateY(-1px);
        }

        .adminContent {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 20px;
          display: grid;
          gap: 24px;
        }

        .staffSection {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 28px;
          display: grid;
          gap: 26px;
        }

        .staffHeader {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
        }

        .staffSectionTitle {
          font-size: 26px;
          font-weight: 800;
          margin: 0;
        }

        .staffSectionSubtitle {
          margin: 8px 0 0;
          color: rgba(255,255,255,0.65);
          font-size: 14px;
        }

        .staffStats {
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          font-weight: 700;
        }

        .staffList {
          display: grid;
          gap: 12px;
        }

        .staffItem {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 18px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
        }

        .staffInfo {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .staffName {
          font-weight: 700;
          font-size: 15px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .staffRole {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(196, 30, 58, 0.18);
          color: #c41e3a;
        }

        .staffRole-owner {
          background: rgba(213, 179, 85, 0.2);
          color: #d5b355;
        }

        .staffActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .staffBtn {
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          border: none;
          min-width: 110px;
        }

        .staffBtnEdit {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        .staffBtnDelete {
          background: rgba(214,71,71,0.22);
          color: #d64747;
        }

        .staffForm {
          display: grid;
          gap: 18px;
          padding: 24px;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .formTitle {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .formRow {
          display: grid;
          gap: 8px;
        }

        .formRow label {
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .formInput,
        .staffForm select {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-size: 14px;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }

        .formInput:focus,
        .staffForm select:focus {
          border-color: #d64747;
          box-shadow: 0 0 0 3px rgba(214,71,71,0.16);
        }

        .formActions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .emptyStateCard {
          padding: 24px;
          border-radius: 20px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          text-align: center;
          color: rgba(255,255,255,0.75);
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
          animation: toastSlideIn 0.3s ease-out;
          box-shadow: 0 12px 40px rgba(0,0,0,0.45);
          pointer-events: none;
        }

        .toastOk { background: rgba(52, 211, 153, 0.95); }
        .toastError { background: rgba(214, 71, 71, 0.95); }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 820px) {
          .staffSection {
            padding: 20px;
          }

          .staffItem {
            flex-direction: column;
            align-items: stretch;
          }

          .staffActions {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
