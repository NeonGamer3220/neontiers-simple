import React from "react";

// Very small, purpose-built markdown renderer for the static docs content
// (rules, privacy policy). Supports: #, ##, ### headers, "•"/"-" bullet
// lists, **bold**, and `inline code`. Not a general-purpose parser — just
// enough for the fixed strings in docsContent.js.

function renderInline(text, keyPrefix) {
  const parts = [];
  let remaining = text;
  let idx = 0;

  const pattern = /(\*\*(.+?)\*\*|`(.+?)`)/;

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
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul className="mdList" key={`ul-${blocks.length}`}>
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInline(item, `li-${blocks.length}-${i}`)}</li>
          ))}
        </ul>
      );
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
      blocks.push(
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
      );
      i = j - 1;
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(<h3 className="mdH3" key={i}>{renderInline(line.slice(4), `h3-${i}`)}</h3>);
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(<h2 className="mdH2" key={i}>{renderInline(line.slice(3), `h2-${i}`)}</h2>);
      continue;
    }
    if (line.startsWith("# ")) {
      flushList();
      blocks.push(<h1 className="mdH1" key={i}>{renderInline(line.slice(2), `h1-${i}`)}</h1>);
      continue;
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      continue;
    }
    if (/^\*(.+)\*$/.test(line) && !line.startsWith("**")) {
      flushList();
      blocks.push(<p className="mdItalic" key={i}>{line.slice(1, -1)}</p>);
      continue;
    }

    flushList();
    blocks.push(<p className="mdP" key={i}>{renderInline(line, `p-${i}`)}</p>);
  }

  flushList();
  return blocks;
}
