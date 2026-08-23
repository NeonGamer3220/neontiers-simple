"use client";

// The admin panel is a single-page app from here: AdminShell renders the
// navbar plus whichever tab is active (Dashboard/Applications/Staff), all
// client-side, without page reloads. This route just mounts it and sends
// the person back to the login screen if their session ever drops.
import React from "react";
import { useRouter } from "next/navigation";
import AdminShell from "../_components/AdminShell";

export default function AdminDashboardPage() {
  const router = useRouter();
  return <AdminShell onLoggedOut={() => router.push("/admin")} />;
}
