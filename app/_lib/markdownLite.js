import React from "react";

// Very small, purpose-built markdown renderer for the static docs content
// (rules, privacy policy). Supports: #, ##, ### headers, "•"/"-" bullet
// lists, **bold**, and `inline code`. Not a general-purpose parser — just
// enough for the fixed strings in docsContent.js.

const TIER_COLORS = {
  LT5: "#40384f", HT5: "#6f6389",
  LT4: "#514764", HT4: "#b7aadf",
  LT3: "#b36830", HT3: "#dd8849",
  LT2: "#888d95", HT2: "#a4b3c7",
  LT1: "#d5b355", HT1: "#f87171",
};

const TIER_PATTERN = /\b(LT[1-5]|HT[1-5])\b/;

function renderInline(text, keyPrefix) {
  const parts = [];
  let remaining = text;
  let idx = 0;

  const pattern = /(\*\*(.+?)\*\*|`(.+?)`|\b(?:LT[1-5]|HT[1-5])\b)/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match) {
      parts.push(<React.Fragment key={`${keyPrefix}-${idx++}`}>{remaining}</React.Fragment>);
      break;
    }
    const before = remaining.slice(0, match.index);
    if (before) {
      parts.push(<React.Fragment key={`${keyPrefix}-${idx++}`}>{before}</React.Fragment>);
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={`${keyPrefix}-${idx++}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<code key={`${keyPrefix}-${idx++}`} className="mdInlineCode">{match[3]}</code>);
    } else if (TIER_PATTERN.test(match[0])) {
      const color = TIER_COLORS[match[0]] || "#94a3b8";
      parts.push(
        <span
          key={`${keyPrefix}-${idx++}`}
          className="mdTierBadge"
          style={{ background: `${color}38`, color }}
        >
          {match[0]}
        </span>
      );
    }
    remaining = remaining.slice(match.index + match[0].length);
  }

  return parts;
}

function isTableRow(line) {
  return line.startsWith("|") && line.endsWith("|") && line.length > 1;
}

function isTableDivider(line) {
  if (!isTableRow(line)) return false;
  const cells = line.slice(1, -1).split("|");
  return cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c));
}

function parseTableRow(line) {
  return line
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
}

export function renderMarkdownLite(text) {
  const lines = text.split("\n");
  // Each raw entry: { type, el } — type lets us post-process/group blocks
  // (e.g. grouping consecutive "### heading" + table + italic subsections
  // into a card grid) without re-parsing rendered React elements.
  const raw = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      raw.push({
        type: "list",
        el: (
          <ul className="mdList" key={`ul-${raw.length}`}>
            {listBuffer.map((item, i) => (
              <li key={i}>{renderInline(item, `li-${raw.length}-${i}`)}</li>
            ))}
          </ul>
        ),
      });
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      flushList();
      continue;
    }

    // Table: a row line immediately followed by a divider line ( |---|---| )
    if (isTableRow(line) && lines[i + 1] && isTableDivider(lines[i + 1].trim())) {
      flushList();
      const header = parseTableRow(line);
      const bodyRows = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j].trim())) {
        bodyRows.push(parseTableRow(lines[j].trim()));
        j++;
      }
      raw.push({
        type: "table",
        el: (
          <div className="mdTableWrap" key={`table-${i}`}>
            <table className="mdTable">
              <thead>
                <tr>
                  {header.map((h, hi) => (
                    <th key={hi}>{renderInline(h, `th-${i}-${hi}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{renderInline(cell, `td-${i}-${ri}-${ci}`)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      });
      i = j - 1;
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      raw.push({ type: "h3", el: <h3 className="mdH3" key={i}>{renderInline(line.slice(4), `h3-${i}`)}</h3> });
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      raw.push({ type: "h2", el: <h2 className="mdH2" key={i}>{renderInline(line.slice(3), `h2-${i}`)}</h2> });
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      raw.push({ type: "h1", el: <h1 className="mdH1" key={i}>{renderInline(line.slice(2), `h1-${i}`)}</h1> });
      continue;
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      continue;
    }
    if (/^\*(.+)\*$/.test(line) && !line.startsWith("**")) {
      flushList();
      raw.push({ type: "italic", el: <p className="mdItalic" key={i}>{line.slice(1, -1)}</p> });
      continue;
    }

    flushList();
    raw.push({ type: "p", el: <p className="mdP" key={i}>{renderInline(line, `p-${i}`)}</p> });
  }

  flushList();

  // Group consecutive "### heading" runs (heading + everything up to the
  // next heading/end) into cards. If there are 2+ such groups in a row,
  // lay them out as a grid instead of a plain vertical stack.
  const blocks = [];
  let i = 0;
  while (i < raw.length) {
    if (raw[i].type !== "h3") {
      blocks.push(raw[i].el);
      i++;
      continue;
    }

    const groups = [];
    while (i < raw.length && raw[i].type === "h3") {
      const groupItems = [raw[i].el];
      i++;
      while (i < raw.length && raw[i].type !== "h3") {
        groupItems.push(raw[i].el);
        i++;
      }
      groups.push(groupItems);
    }

    if (groups.length >= 2) {
      blocks.push(
        <div className="mdResultsGrid" key={`grid-${blocks.length}`}>
          {groups.map((g, gi) => (
            <div className="mdResultCard" key={gi}>{g}</div>
          ))}
        </div>
      );
    } else {
      groups.forEach((g) => blocks.push(...g));
    }
  }

  return blocks;
}
