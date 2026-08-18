"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

function CustomSelect({ value, options, onChange, placeholder = "Válassz..." }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="jfSelect" ref={ref}>
      <button type="button" className="jfSelectBtn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className={value ? "" : "jfSelectPlaceholder"}>{value || placeholder}</span>
        <span className="jfSelectChevron">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="jfSelectMenu">
          {options.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`jfSelectItem ${opt === value ? "selected" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
              {opt === value && <span className="jfSelectCheck">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JelentkezesPage() {
  const params = useParams();
  const slug = params?.slug;

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [discordName, setDiscordName] = useState("");
  const [availability, setAvailability] = useState("");
  const [answers, setAnswers] = useState({});
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/applications/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error || "Nem található jelentkezés");
          setLoading(false);
          return;
        }
        setForm(data.form);
        const initAnswers = {};
        for (const q of data.form.questions || []) {
          initAnswers[q.id] = q.type === "checkbox" ? [] : "";
        }
        setAnswers(initAnswers);
        setLoading(false);
      } catch (err) {
        setLoadError("Hálózati hiba történt");
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const setAnswer = (id, val) => setAnswers((a) => ({ ...a, [id]: val }));
  const toggleCheckboxOption = (id, opt) =>
    setAnswers((a) => {
      const cur = Array.isArray(a[id]) ? a[id] : [];
      const next = cur.includes(opt) ? cur.filter((v) => v !== opt) : [...cur, opt];
      return { ...a, [id]: next };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!discordName.trim()) {
      setSubmitError("A Discord felhasználóneved megadása kötelező");
      return;
    }
    if (!availability.trim()) {
      setSubmitError("Add meg, mikor tudunk beszélni");
      return;
    }
    for (const q of form.questions || []) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (q.type === "checkbox") {
        if (!Array.isArray(val) || val.length === 0) {
          setSubmitError(`"${q.label}" kitöltése kötelező`);
          return;
        }
      } else if (!String(val || "").trim()) {
        setSubmitError(`"${q.label}" kitöltése kötelező`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discord_name: discordName.trim(),
          availability: availability.trim(),
          answers,
          website,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "A beküldés sikertelen");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError("Hálózati hiba történt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="jfPage">
      <div className="jfBackdrop" />
      <main className="jfCard">
        <Link href="/" className="jfBack">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Vissza
        </Link>

        {loading && <div className="jfState">Betöltés...</div>}

        {!loading && loadError && <div className="jfState jfStateError">{loadError}</div>}

        {!loading && !loadError && form && !submitted && (
          <>
            <h1 className="jfTitle">Jelentkezés — {form.title}</h1>
            <p className="jfIntro">
              Ez az űrlap csak az elérhetőségedet kéri be. A tényleges kérdések a szóbeli beszélgetésen
              jönnek, ezért itt csak azt töltsd ki, hogy kivel és mikor tudunk beszélni. A pozíció magyar
              nyelvű.
            </p>

            <form onSubmit={handleSubmit} className="jfForm">
              <section className="jfSection">
                <h2 className="jfSectionTitle">Kapcsolat</h2>
                <p className="jfSectionNote">
                  Ezek alapján keresünk meg. Az elírt Discord név miatt nem tudunk elérni, ezért nézd át.
                </p>

                <div className="jfField">
                  <label className="jfLabel">
                    Discord felhasználónév <span className="jfRequired">*</span>
                  </label>
                  <input
                    type="text"
                    className="jfInput"
                    placeholder="pl. felhasznalo.nev"
                    value={discordName}
                    onChange={(e) => setDiscordName(e.target.value)}
                  />
                </div>

                <div className="jfField">
                  <label className="jfLabel">
                    Mikor tudunk veled beszélni? <span className="jfRequired">*</span>
                  </label>
                  <textarea
                    className="jfInput jfTextarea"
                    placeholder="pl. hétköznap 16-20 óra között, hétvégén egész nap"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    rows={3}
                  />
                </div>
              </section>

              {(form.questions || []).length > 0 && (
                <section className="jfSection">
                  <h2 className="jfSectionTitle">Kérdések</h2>
                  {(form.questions || []).map((q) => (
                    <div className="jfField" key={q.id}>
                      <label className="jfLabel">
                        {q.label} {q.required && <span className="jfRequired">*</span>}
                      </label>

                      {q.type === "text" && (
                        <input
                          type="text"
                          className="jfInput"
                          value={answers[q.id] || ""}
                          onChange={(e) => setAnswer(q.id, e.target.value)}
                        />
                      )}

                      {q.type === "select" && (
                        <CustomSelect
                          value={answers[q.id] || ""}
                          options={q.options || []}
                          onChange={(val) => setAnswer(q.id, val)}
                        />
                      )}

                      {q.type === "checkbox" && (
                        <div className="jfCheckboxGroup">
                          {(q.options || []).map((opt) => {
                            const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt);
                            return (
                              <button
                                type="button"
                                key={opt}
                                className={`jfCheckbox ${checked ? "checked" : ""}`}
                                onClick={() => toggleCheckboxOption(q.id, opt)}
                              >
                                <span className="jfCheckboxBox">{checked && "✓"}</span>
                                <span>{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* Honeypot — hidden from real users */}
              <div className="jfHp" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {submitError && <div className="jfError">{submitError}</div>}

              <button type="submit" className="jfSubmit" disabled={submitting}>
                {submitting ? "Küldés..." : "Jelentkezés beküldése"}
              </button>
            </form>
          </>
        )}

        {!loading && submitted && (
          <div className="jfState jfStateOk">
            <h1 className="jfTitle">Köszönjük a jelentkezést!</h1>
            <p className="jfIntro">Megkapjuk az adataidat, és Discordon fogunk jelentkezni időpont-egyeztetés céljából.</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        .jfPage {
          min-height: 100vh;
          position: relative;
          background: #05060a;
          color: #fff;
          font-family: inherit;
          font-weight: 800;
          display: flex;
          justify-content: center;
          padding: 48px 20px 80px;
        }
        .jfBackdrop {
          position: fixed;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(143, 124, 255, 0.14), transparent 40%),
            radial-gradient(circle at bottom right, rgba(214, 71, 71, 0.1), transparent 35%);
          pointer-events: none;
        }
        .jfCard {
          position: relative;
          width: 100%;
          max-width: 680px;
          background: rgba(15, 16, 22, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
        }
        .jfBack {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 26px;
        }
        .jfBack:hover {
          color: #fff;
        }
        .jfState {
          text-align: center;
          padding: 40px 0;
          color: rgba(255, 255, 255, 0.7);
        }
        .jfStateError {
          color: #ffb4b4;
          font-weight: 700;
        }
        .jfTitle {
          font-size: 26px;
          font-weight: 900;
          margin: 0 0 12px;
        }
        .jfIntro {
          font-size: 14.5px;
          line-height: 1.65;
          color: rgba(255, 255, 255, 0.68);
          margin: 0 0 28px;
        }
        .jfForm {
          display: grid;
          gap: 26px;
        }
        .jfSection {
          display: grid;
          gap: 16px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .jfSection:first-child {
          border-top: none;
          padding-top: 0;
        }
        .jfSectionTitle {
          margin: 0;
          font-size: 15px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #d7d0ff;
        }
        .jfSectionNote {
          margin: -8px 0 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        .jfField {
          display: grid;
          gap: 8px;
        }
        .jfLabel {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
        }
        .jfRequired {
          color: #ff8f8f;
        }
        .jfInput {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 13px 15px;
          font-size: 14.5px;
          font-family: inherit;
        }
        .jfInput:focus {
          outline: none;
          border-color: #8f7cff;
          background: rgba(255, 255, 255, 0.08);
        }
        .jfTextarea {
          resize: vertical;
        }
        .jfSelect {
          position: relative;
        }
        .jfSelectBtn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 13px 15px;
          font-size: 14.5px;
          font-family: inherit;
          cursor: pointer;
        }
        .jfSelectBtn:hover {
          border-color: rgba(255, 255, 255, 0.26);
        }
        .jfSelectPlaceholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .jfSelectChevron {
          color: rgba(255, 255, 255, 0.5);
        }
        .jfSelectMenu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #100f16;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          overflow-y: auto;
          max-height: 260px;
          z-index: 30;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.5);
        }
        .jfSelectItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 14px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }
        .jfSelectItem:last-child {
          border-bottom: none;
        }
        .jfSelectItem:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .jfSelectItem.selected {
          background: rgba(143, 124, 255, 0.14);
          color: #d7d0ff;
        }
        .jfSelectCheck {
          color: #8f7cff;
          font-weight: 900;
        }
        .jfCheckboxGroup {
          display: grid;
          gap: 8px;
        }
        .jfCheckbox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          font-size: 14px;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
        }
        .jfCheckbox:hover {
          border-color: rgba(255, 255, 255, 0.26);
        }
        .jfCheckbox.checked {
          border-color: rgba(143, 124, 255, 0.55);
          background: rgba(143, 124, 255, 0.12);
        }
        .jfCheckboxBox {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          font-size: 13px;
          font-weight: 900;
          color: #8f7cff;
        }
        .jfCheckbox.checked .jfCheckboxBox {
          border-color: #8f7cff;
          background: rgba(143, 124, 255, 0.2);
        }
        .jfHp {
          position: absolute;
          left: -9999px;
          top: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        .jfError {
          padding: 12px 14px;
          background: rgba(248, 113, 113, 0.14);
          border: 1px solid rgba(248, 113, 113, 0.28);
          border-radius: 12px;
          color: #fecaca;
          font-size: 13px;
          font-weight: 700;
        }
        .jfSubmit {
          padding: 15px 20px;
          background: linear-gradient(135deg, #8f7cff, #6f5cd6);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-family: inherit;
          font-weight: 900;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 12px 30px rgba(143, 124, 255, 0.3);
        }
        .jfSubmit:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .jfSubmit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .jfStateOk {
          padding: 20px 0;
        }

        @media (max-width: 560px) {
          .jfCard {
            padding: 28px 22px;
          }
        }
      `}</style>
    </div>
  );
}
