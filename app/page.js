export const dynamic = "force-dynamic";
export const revalidate = 0;

function tierFromRank(rank) {
  if (!rank) return 0;

  if (rank.includes("1")) return 1;
  if (rank.includes("2")) return 2;
  if (rank.includes("3")) return 3;
  if (rank.includes("4")) return 4;
  if (rank.includes("5")) return 5;

  return 0;
}

export default async function Page() {
  const res = await fetch("http://localhost:3000/api/tests", {
  cache: "no-store"
});

  const data = await res.json();
  const tests = data.tests || [];

  const grouped = {};

  tests.forEach(t => {
    if (!grouped[t.username]) grouped[t.username] = [];
    grouped[t.username].push(t);
  });

  const players = Object.keys(grouped).map(username => {
    const modes = {};
    let totalPoints = 0;

    grouped[username].forEach(test => {
      modes[test.gamemode] = test;
    });

    Object.values(modes).forEach(m => {
      totalPoints += m.points;
    });

    return {
      username,
      modes: Object.values(modes),
      points: totalPoints
    };
  });

  players.sort((a, b) => b.points - a.points);

  return (
    <div className="container">
      <h1 className="title">NeonTiers</h1>
      <h2 className="subtitle">Ranglista</h2>

      {players.map((p, i) => (
        <div className="card" key={p.username}>
          <div className="left">
            <div className="rank-number">{i + 1}.</div>
            <div>
              <div className="player-name">{p.username}</div>
              <div className="badges">
                {p.modes.map(m => (
                  <div
                    key={m.gamemode}
                    className={`tag tier-${tierFromRank(m.rank)}`}
                  >
                    {m.gamemode} {m.rank}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="points">
            <div className="points-value">{p.points}</div>
            <div className="points-label">PONT</div>
          </div>
        </div>
      ))}
    </div>
  );
}
