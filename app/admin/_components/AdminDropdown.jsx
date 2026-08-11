"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Generic dark-themed custom dropdown for the admin panel.
 *
 * options: [{ value, label, icon?, color?, hint? }]
 */
export default function AdminDropdown({
  value,
  options,
  onChange,
  placeholder = "Válassz...",
  renderLabel,
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div className={`adDropdown ${className} ${disabled ? "disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="adDropdownBtn"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        disabled={disabled}
      >
        {current?.icon && <img src={current.icon} alt="" className="adDropdownBtnIcon" />}
        {current?.color && <span className="adDropdownBtnDot" style={{ background: current.color }} />}
        <span className="adDropdownBtnText">{current ? (renderLabel ? renderLabel(current) : current.label) : placeholder}</span>
        <span className="adDropdownChevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="adDropdownMenu">
          {options.map((o) => (
            <button
              type="button"
              key={o.value}
              className={`adDropdownItem ${o.value === value ? "selected" : ""}`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.icon && <img src={o.icon} alt="" className="adDropdownIcon" />}
              {o.color && <span className="adDropdownDot" style={{ background: o.color }} />}
              <span className="adDropdownItemText">
                <span>{renderLabel ? renderLabel(o) : o.label}</span>
                {o.hint && <span className="adDropdownItemHint">{o.hint}</span>}
              </span>
              {o.value === value && <span className="adDropdownCheck">✓</span>}
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        .adDropdown {
          position: relative;
        }
        .adDropdown.disabled {
          opacity: 0.5;
        }
        .adDropdownBtn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 11px 12px;
          font-size: 14px;
          font-family: inherit;
          cursor: pointer;
          text-align: left;
        }
        .adDropdownBtn:hover {
          border-color: rgba(255, 255, 255, 0.22);
        }
        .adDropdownBtnIcon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          flex: 0 0 auto;
        }
        .adDropdownBtnDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 auto;
        }
        .adDropdownBtnText {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .adDropdownChevron {
          flex: 0 0 auto;
          color: rgba(255, 255, 255, 0.5);
          font-size: 11px;
        }
        .adDropdownMenu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #100f16;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          overflow-y: auto;
          max-height: 300px;
          z-index: 60;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
        }
        .adDropdownItem {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 13.5px;
          text-align: left;
          cursor: pointer;
        }
        .adDropdownItem:last-child {
          border-bottom: none;
        }
        .adDropdownItem:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .adDropdownItem.selected {
          background: rgba(143, 124, 255, 0.14);
          color: #d7d0ff;
        }
        .adDropdownItemText {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .adDropdownItemHint {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }
        .adDropdownIcon {
          width: 18px;
          height: 18px;
          object-fit: contain;
          flex: 0 0 auto;
        }
        .adDropdownDot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex: 0 0 auto;
        }
        .adDropdownCheck {
          margin-left: auto;
          color: #8f7cff;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
}
