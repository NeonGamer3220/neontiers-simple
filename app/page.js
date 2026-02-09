"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [tests, setTests] = useState([]);

  useEffect(() => {
    fetch("/api/tests")
      .then(res => res.json())
      .then(data => setTests(data.tests || []));
  }, []);

  return (
    <main style={{ padding: 40, color: "white", fontFamily: "sans-serif" }}>
      <h1>NeonTiers</h1>

      {tests.length === 0 && <p>Nincs teszt adat</p>}

      {tests.map((t, i) => (
        <div key={i} style={{
          marginTop: 20,
          padding: 20,
          border: "1px solid #444",
          borderRadius: 10
        }}>
          <b>{t.username}</b><br />
          Gamemode: {t.gamemode}<br />
          Rank: {t.rank}<br />
          Tester: {t.tester}
        </div>
      ))}
    </main>
  );
}
