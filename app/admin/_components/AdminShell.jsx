"use client";

import React, { useEffect, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import DashboardTab from "../_tabs/DashboardTab";
import ApplicationsTab from "../_tabs/ApplicationsTab";
import StaffTab from "../_tabs/StaffTab";
import { permissions } from "../../_lib/roles";
import "../admin-theme.css";

/**
 * The authenticated admin panel: a single page with client-side tab
 * switching instead of separate /admin/dashboard, /admin/applications,
 * /admin/staff/[name] routes. Logs (owner-only) are embedded directly
 * inside the Dashboard tab rather than being their own tab, and the
 * high-test manager only exists as the quick-panel already built into
 * the Dashboard's player editor — see DashboardTab.jsx.
 *
 * Only mounted by app/admin/page.jsx once the login+passkey flow has
 * succeeded. Does its own /api/admin/check on mount to resolve
 * adminName/adminRole for display and role-gating tabs; if that check
 * ever fails (expired session, logged out elsewhere), it hands control
 * back to the login form via onLoggedOut.
 */
export default function AdminShell({ onLoggedOut }) {
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | applications | staff
  const [viewedStaffName, setViewedStaffName] = useState("");
  const [returnToTab, setReturnToTab] = useState("dashboard"); // tab to go back to when leaving the staff view

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        onLoggedOut?.();
        return;
      }
      const data = await res.json();
      setAdminRole(String(data.role || "").toLowerCase());
      setAdminName(String(data.admin_name || ""));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOwner = adminRole === "owner";
  const canViewApplications = permissions.canViewApplications(adminRole);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    onLoggedOut?.();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewStaff = (name) => {
    setReturnToTab(activeTab === "staff" ? returnToTab : activeTab);
    setViewedStaffName(name);
    setActiveTab("staff");
  };

  const handleViewOwnProfile = () => handleViewStaff(adminName);

  const handleBackFromStaff = () => setActiveTab(returnToTab);

  if (loading) {
    return (
      <div className="ashLoadingPage admin-panel">
        <div className="ashSpinner" />
        <style jsx>{`
          .ashLoadingPage {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #090b11;
          }
          .ashSpinner {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid rgba(143, 124, 255, 0.2);
            border-top-color: #8f7cff;
            animation: ashSpin 0.8s linear infinite;
          }
          @keyframes ashSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Non-owners/admins can't reach the applications tab even if activeTab
  // was left in that state (e.g. role changed mid-session) — fall back
  // to dashboard.
  const effectiveTab = activeTab === "applications" && !canViewApplications ? "dashboard" : activeTab;

  return (
    <div className="admin-panel">
      <AdminNavbar
        adminName={adminName}
        adminRole={adminRole}
        activeTab={effectiveTab}
        onTabChange={handleTabChange}
        onViewOwnProfile={handleViewOwnProfile}
        onLogout={handleLogout}
        canViewApplications={canViewApplications}
      />

      {effectiveTab === "dashboard" && (
        <DashboardTab adminRole={adminRole} adminName={adminName} onViewStaff={handleViewStaff} />
      )}
      {effectiveTab === "applications" && canViewApplications && <ApplicationsTab adminRole={adminRole} />}
      {effectiveTab === "staff" && (
        <StaffTab staffName={viewedStaffName} viewerName={adminName} onBack={handleBackFromStaff} />
      )}
    </div>
  );
}
