"use client";

import React, { useMemo, useState } from "react";
import { RANK_ORDER, rankOrderValue, rankBadgeColor, eloRankLabel } from "../_lib/tiers";

// Lightweight dependency-free SVG line chart plotting tier progress over
// time for one gamemode. `history` = rank_history rows for a single mode,
// oldest first: [{ rank, points, created_at, retired }, ...]
export default function RankHistoryChart({ history, height = 220 }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const width = 640;
  const padX = 36;
  const padY = 22;

  const points = useMemo(() => {
    const rows = (history || []).filter((h) => rankOrderValue(h.rank) !== -1);
    if (rows.length === 0) return [];
    const maxVal = RANK_ORDER.length;
    const minVal = 1;
    const n = rows.length;
    return rows.map((h, i) => {
      const x = n === 1 ? width / 2 : padX + (i / (n - 1)) * (width - padX * 2);
      const v = rankOrderValue(h.rank);
      const norm = (v - minVal) / (maxVal - minVal || 1);
      const y = padY + (1 - norm) * (height - padY * 2);
      return { x, y, ...h };
    });
  }, [history, height]);

  if (points.length === 0) {
    return <div className="rhcEmpty">Nincs elég adat a grafikonhoz.</div>;
  }

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const lastColor = rankBadgeColor(points[points.length - 1].rank, points[points.length - 1].retired);

  return (
    <div className="rhcWrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="rhcSvg" preserveAspectRatio="xMidYMid meet">
        {/* Gridlines for readability */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="#ffffff12"
            strokeWidth="1"
          />
        ))}
        <path d={path} fill="none" stroke={lastColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => {
          const color = rankBadgeColor(p.rank, p.retired);
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoverIdx === i ? 6 : 4}
                fill={color}
                stroke="#0b0d11"
                strokeWidth="2"
                style={{ cursor: "pointer", transition: "r 0.1s" }}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          );
        })}
      </svg>
      {hoverIdx !== null && points[hoverIdx] && (
        <div
          className="rhcTooltip"
          style={{ left: `${(points[hoverIdx].x / width) * 100}%` }}
        >
          <strong style={{ color: rankBadgeColor(points[hoverIdx].rank, points[hoverIdx].retired) }}>
            {points[hoverIdx].retired ? `R${eloRankLabel(points[hoverIdx].rank)}` : eloRankLabel(points[hoverIdx].rank)}
          </strong>
          <span>{new Date(points[hoverIdx].created_at).toLocaleDateString("hu-HU")}</span>
        </div>
      )}

      <style jsx>{`
        .rhcWrap {
          position: relative;
          width: 100%;
        }
        .rhcSvg {
          width: 100%;
          height: auto;
          display: block;
        }
        .rhcEmpty {
          padding: 24px 12px;
          text-align: center;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
        }
        .rhcTooltip {
          position: absolute;
          top: -6px;
          transform: translate(-50%, -100%);
          background: #11161ffa;
          border: 1px solid #ffffff1f;
          border-radius: 10px;
          padding: 6px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 12px 28px #00000060;
        }
        .rhcTooltip span {
          color: var(--muted);
          font-size: 10px;
        }
        @media (max-width: 760px) {
          .rhcWrap {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
