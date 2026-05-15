"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [adminName, setAdminName] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      await loadTests();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadTests = async () => {
    try {
      const res = await fetch("/api/tests");
      const data = await res.json();
      setTests(Array.isArray(data?.tests) ? data.tests : []);
    } catch (err) {
      console.error("Failed to load tests:", err);
    }
  };

  const handleDelete = async (testId) => {
    if (!confirm("Biztos vagy benne hogy törlöd ezt a tesztet?")) return;

    try {
      const res = await fetch(`/api/tests/remove/${testId}`, { method: "DELETE" });
      if (res.ok) {
        await loadTests();
        setSelectedTest(null);
      } else {
        alert("Hiba a törlés során");
      }
    } catch (err) {
      alert("Hálózati hiba");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  if (loading) {
    return (
      <div className="adminDashboard">
        <div className="loadingState">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="adminDashboard">
      <header className="adminHeader">
        <div className="headerLeft">
          <h1 className="headerTitle">Admin Panel</h1>
          <p className="headerSubtitle">Teszt eredmények kezelése</p>
        </div>
        <button className="logoutBtn" onClick={handleLogout}>
          Kijelentkezés
        </button>
      </header>

      <main className="adminContent">
        <div className="testsSection">
          <h2 className="sectionTitle">Összes teszt ({tests.length})</h2>
          
          <div className="testsGrid">
            {tests.length === 0 ? (
              <div className="emptyState">Nincs teszt adat</div>
            ) : (
              tests.map((test) => (
                <div
                  key={test.id}
                  className={`testCard ${selectedTest?.id === test.id ? "active" : ""}`}
                  onClick={() => setSelectedTest(test)}
                >
                  <div className="testCardHeader">
                    <h3 className="testCardTitle">{test.username}</h3>
                    <span className="testCardMode">{test.gamemode}</span>
                  </div>
                  <div className="testCardBody">
                    <div className="testStat">
                      <span className="testLabel">Rang</span>
                      <span className="testValue">{test.rank}</span>
                    </div>
                    <div className="testStat">
                      <span className="testLabel">Pontok</span>
                      <span className="testValue">{test.points || 0}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedTest && (
          <div className="detailsSection">
            <h2 className="sectionTitle">Teszt részletei</h2>
            <div className="detailsCard">
              <div className="detailsGrid">
                <div className="detailItem">
                  <span className="detailLabel">Játékos</span>
                  <span className="detailValue">{selectedTest.username}</span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Mód</span>
                  <span className="detailValue">{selectedTest.gamemode}</span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Rang</span>
                  <span className="detailValue">{selectedTest.rank}</span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">Pontok</span>
                  <span className="detailValue">{selectedTest.points || 0}</span>
                </div>
                <div className="detailItem">
                  <span className="detailLabel">ID</span>
                  <span className="detailValue">{selectedTest.id}</span>
                </div>
              </div>

              <div className="detailsActions">
                <button
                  className="deleteBtn"
                  onClick={() => handleDelete(selectedTest.id)}
                >
                  Teszt törlése
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .adminDashboard {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }

        .adminHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 20px;
          background: rgba(11, 14, 20, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 1480px;
          margin: 0 auto;
        }

        .headerLeft {
          flex: 1;
        }

        .headerTitle {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .headerSubtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .logoutBtn {
          padding: 10px 20px;
          background: rgba(196, 30, 58, 0.8);
          border: 1px solid rgba(196, 30, 58, 0.5);
          border-radius: 6px;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logoutBtn:hover {
          background: rgba(196, 30, 58, 1);
        }

        .adminContent {
          max-width: 1480px;
          margin: 0 auto;
          padding: 30px 20px;
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
        }

        @media (max-width: 1024px) {
          .adminContent {
            grid-template-columns: 1fr;
          }
        }

        .testsSection,
        .detailsSection {
          background: rgba(11, 14, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
        }

        .sectionTitle {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .testsGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
          max-height: 600px;
          overflow-y: auto;
        }

        .testCard {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .testCard:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .testCard.active {
          background: rgba(196, 30, 58, 0.15);
          border-color: rgba(196, 30, 58, 0.4);
        }

        .testCardHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .testCardTitle {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
          flex: 1;
        }

        .testCardMode {
          font-size: 11px;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          margin-left: 8px;
        }

        .testCardBody {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .testStat {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .testLabel {
          color: rgba(255, 255, 255, 0.6);
        }

        .testValue {
          font-weight: 600;
        }

        .emptyState {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.5);
        }

        .loadingState {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .detailsCard {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px;
        }

        .detailsGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }

        .detailItem {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 6px;
          font-size: 13px;
        }

        .detailLabel {
          color: rgba(255, 255, 255, 0.6);
        }

        .detailValue {
          font-weight: 600;
          word-break: break-all;
        }

        .detailsActions {
          display: flex;
          gap: 10px;
        }

        .deleteBtn {
          flex: 1;
          padding: 10px 16px;
          background: rgba(196, 30, 58, 0.2);
          border: 1px solid rgba(196, 30, 58, 0.4);
          border-radius: 6px;
          color: #ff6b6b;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .deleteBtn:hover {
          background: rgba(196, 30, 58, 0.3);
          border-color: rgba(196, 30, 58, 0.6);
        }
      `}</style>
    </div>
  );
}
