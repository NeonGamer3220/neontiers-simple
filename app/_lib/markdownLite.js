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

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    if (line === "") {
      flushList();
      return;
    }

    if (line.startsWith("### ")) {
      flushList();
      blocks.push(<h3 className="mdH3" key={i}>{renderInline(line.slice(4), `h3-${i}`)}</h3>);
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      blocks.push(<h2 className="mdH2" key={i}>{renderInline(line.slice(3), `h2-${i}`)}</h2>);
      return;
    }
    if (line.startsWith("# ")) {
      flushList();
      blocks.push(<h1 className="mdH1" key={i}>{renderInline(line.slice(2), `h1-${i}`)}</h1>);
      return;
    }
    if (line.startsWith("• ") || line.startsWith("- ")) {
      listBuffer.push(line.slice(2));
      return;
    }
    if (/^\*(.+)\*$/.test(line) && !line.startsWith("**")) {
      flushList();
      blocks.push(<p className="mdItalic" key={i}>{line.slice(1, -1)}</p>);
      return;
    }

    flushList();
    blocks.push(<p className="mdP" key={i}>{renderInline(line, `p-${i}`)}</p>);
  });

  flushList();
  return blocks;
}
