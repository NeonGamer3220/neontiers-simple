"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "../_components/AdminNavbar";
import AdminDropdown from "../_components/AdminDropdown";
import "../admin-theme.css";

const TYPE_OPTIONS = [
  { value: "text", label: "Írás", hint: "Szabad szöveges válasz" },
  { value: "select", label: "Opciók", hint: "Egy opció kiválasztása (dropdown)" },
  { value: "checkbox", label: "Checkbox", hint: "Egy vagy több doboz kipipálása" },
];

function typeLabel(type) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label || type;
}

function emptyQuestion() {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "text",
    label: "",
    required: true,
    options: [],
  };
}

function emptySection() {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: "section",
    label: "",
    description: "",
  };
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const [forms, setForms] = useState([]);
  const [view, setView] = useState("list"); // list | builder | responses
  const [editingFormId, setEditingFormId] = useState(null);
  const [busy, setBusy] = useState(false);

  // builder state
  const [bTitle, setBTitle] = useState("");
  const [bSlug, setBSlug] = useState("");
  const [bOpen, setBOpen] = useState(true);
  const [bQuestions, setBQuestions] = useState([]);
  const [slugTouched, setSlugTouched] = useState(false);

  // responses view state
  const [activeForm, setActiveForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [expandedResponseId, setExpandedResponseId] = useState(null);

  const showConfirm = (message) => new Promise((resolve) => setConfirmState({ message, resolve }));
  const handleConfirm = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (data.role) setAdminRole(String(data.role).toLowerCase());
      if (data.admin_name) setAdminName(String(data.admin_name));
      if (String(data.role || "").toLowerCase() !== "owner") {
        router.push("/admin/dashboard");
        return;
      }
      await loadForms();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const loadForms = async () => {
    try {
      const res = await fetch("/api/admin/applications");
      if (!res.ok) throw new Error("Sikertelen betöltés");
      const data = await res.json();
      setForms(Array.isArray(data?.forms) ? data.forms : []);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Jelentkezések betöltése sikertelen" });
    }
  };

  const resetBuilder = () => {
    setEditingFormId(null);
    setBTitle("");
    setBSlug("");
    setBOpen(true);
    setBQuestions([]);
    setSlugTouched(false);
  };

  const openCreateBuilder = () => {
    resetBuilder();
    setView("builder");
  };

  const openEditBuilder = (form) => {
    setEditingFormId(form.id);
    setBTitle(form.title);
    setBSlug(form.slug);
    setBOpen(!!form.is_open);
    setBQuestions(
      (Array.isArray(form.questions) ? form.questions : []).map((q) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : [],
        description: q.description || "",
      }))
    );
    setSlugTouched(true);
    setView("builder");
  };

  const slugify = (str) =>
    String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleTitleChange = (val) => {
    setBTitle(val);
    if (!slugTouched) setBSlug(slugify(val));
  };

  const addQuestion = () => setBQuestions((qs) => [...qs, emptyQuestion()]);
  const addSection = () => setBQuestions((qs) => [...qs, emptySection()]);
  const removeQuestion = (id) => setBQuestions((qs) => qs.filter((q) => q.id !== id));
  const updateQuestion = (id, patch) =>
    setBQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const moveItem = (id, dir) =>
    setBQuestions((qs) => {
      const idx = qs.findIndex((q) => q.id === id);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const addOption = (id) =>
    setBQuestions((qs) => qs.map((q) => (q.id === id ? { ...q, options: [...q.options, ""] } : q)));
  const updateOption = (id, idx, val) =>
    setBQuestions((qs) =>
      qs.map((q) => {
        if (q.id !== id) return q;
        const options = [...q.options];
        options[idx] = val;
        return { ...q, options };
      })
    );
  const removeOption = (id, idx) =>
    setBQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, options: q.options.filter((_, i) => i !== idx) } : q))
    );

  const handleSaveForm = async () => {
    if (!bTitle.trim()) {
      setToast({ type: "error", text: "Add meg a pozíció nevét" });
      return;
    }
    if (!bSlug.trim()) {
      setToast({ type: "error", text: "Add meg a linket (slug)" });
      return;
    }
    for (const q of bQuestions) {
      if (!q.label.trim()) {
        setToast({ type: "error", text: q.type === "section" ? "Minden szekciónak legyen címe" : "Minden kérdésnek legyen szövege" });
        return;
      }
      if (q.type !== "section" && (q.type === "select" || q.type === "checkbox") && q.options.filter((o) => o.trim()).length < 2) {
        setToast({ type: "error", text: `"${q.label}" — legalább 2 opció szükséges` });
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        title: bTitle.trim(),
        slug: bSlug.trim(),
        is_open: bOpen,
        questions: bQuestions.map((q) =>
          q.type === "section"
            ? { id: q.id, type: "section", label: q.label.trim(), description: (q.description || "").trim() }
            : {
                id: q.id,
                type: q.type,
                label: q.label.trim(),
                required: q.required,
                options: q.options.map((o) => o.trim()).filter(Boolean),
              }
        ),
      };

      const res = await fetch(
        editingFormId ? `/api/admin/applications/${editingFormId}` : "/api/admin/applications",
        {
          method: editingFormId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Mentés sikertelen" });
        return;
      }
      await loadForms();
      setToast({ type: "ok", text: editingFormId ? "Jelentkezés frissítve" : "Jelentkezés létrehozva" });
      resetBuilder();
      setView("list");
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteForm = async (form) => {
    const ok = await showConfirm(
      `Biztos hogy törlöd a(z) "${form.title}" jelentkezést? Az összes hozzá tartozó kitöltés is törlődik.`
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/applications/${form.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Törlés sikertelen" });
        return;
      }
      await loadForms();
      setToast({ type: "ok", text: "Jelentkezés törölve" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const toggleOpen = async (form) => {
    try {
      const res = await fetch(`/api/admin/applications/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_open: !form.is_open }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Módosítás sikertelen" });
        return;
      }
      await loadForms();
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const openResponses = async (form) => {
    setActiveForm(form);
    setResponses([]);
    setExpandedResponseId(null);
    setView("responses");
    try {
      const res = await fetch(`/api/admin/applications/${form.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Betöltés sikertelen");
      setActiveForm(data.form);
      setResponses(Array.isArray(data.responses) ? data.responses : []);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Kitöltések betöltése sikertelen" });
    }
  };

  const handleDeleteResponse = async (response) => {
    const ok = await showConfirm(`Biztos hogy törlöd "${response.discord_name}" kitöltését?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/applications/${activeForm.id}/responses/${response.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ type: "error", text: data.error || "Törlés sikertelen" });
        return;
      }
      setResponses((rs) => rs.filter((r) => r.id !== response.id));
      setToast({ type: "ok", text: "Kitöltés törölve" });
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Hálózati hiba" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString("hu-HU", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="japLoadingPage admin-panel">
        <div className="japSpinner" />
      </div>
    );
  }

  return (
    <div className="japPage admin-panel">
      {toast && <div className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}>{toast.text}</div>}

      <AdminNavbar adminName={adminName} adminRole={adminRole} onLogout={handleLogout} />

      <main className="japContent">
        <header className="japPageHeader">
          <div>
            <h1>Jelentkezések</h1>
            <p>Hozz létre jelentkezési űrlapokat rangokhoz, és tekintsd át a beérkezett kitöltéseket.</p>
          </div>
          {view === "list" && (
            <button type="button" className="japBtn japBtnPrimary" onClick={openCreateBuilder}>
              + Új jelentkezés
            </button>
          )}
          {view !== "list" && (
            <button
              type="button"
              className="japBtn japBtnGhost"
              onClick={() => {
                resetBuilder();
                setView("list");
              }}
            >
              ← Vissza a listához
            </button>
          )}
        </header>

        {view === "list" && (
          <section className="japCard">
            <h2 className="japCardTitle">Űrlapok ({forms.length})</h2>
            {forms.length === 0 ? (
              <div className="japEmpty">Még nincs létrehozott jelentkezési űrlap.</div>
            ) : (
              <div className="japFormList">
                {forms.map((form) => (
                  <div key={form.id} className="japFormItem">
                    <div className="japFormInfo">
                      <div className="japFormTitleRow">
                        <span className="japFormTitle">{form.title}</span>
                        <span className={`japBadge ${form.is_open ? "open" : "closed"}`}>
                          {form.is_open ? "Nyitva" : "Zárva"}
                        </span>
                      </div>
                      <a
                        className="japFormLink"
                        href={`/jelentkezes/${form.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        neontiers.hu/jelentkezes/{form.slug}
                      </a>
                      <span className="japFormMeta">
                        {form.response_count} kitöltés · {(form.questions || []).length} egyedi kérdés
                      </span>
                    </div>
                    <div className="japFormActions">
                      <button type="button" className="japBtn japBtnSmall" onClick={() => openResponses(form)}>
                        Kitöltések
                      </button>
                      <button type="button" className="japBtn japBtnSmall" onClick={() => openEditBuilder(form)}>
                        Szerkesztés
                      </button>
                      <button
                        type="button"
                        className="japBtn japBtnSmall japBtnToggle"
                        onClick={() => toggleOpen(form)}
                      >
                        {form.is_open ? "Bezárás" : "Megnyitás"}
                      </button>
                      <button
                        type="button"
                        className="japBtn japBtnSmall japBtnDanger"
                        onClick={() => handleDeleteForm(form)}
                      >
                        Törlés
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {view === "builder" && (
          <section className="japCard">
            <h2 className="japCardTitle">{editingFormId ? "Jelentkezés szerkesztése" : "Új jelentkezés"}</h2>

            <div className="japFormGrid">
              <div className="japField">
                <label className="japLabel">Pozíció neve</label>
                <input
                  type="text"
                  className="japInput"
                  placeholder="pl. Regulátor"
                  value={bTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>
              <div className="japField">
                <label className="japLabel">Link (slug)</label>
                <div className="japSlugRow">
                  <span className="japSlugPrefix">neontiers.hu/jelentkezes/</span>
                  <input
                    type="text"
                    className="japInput"
                    placeholder="regulator"
                    value={bSlug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setBSlug(slugify(e.target.value));
                    }}
                  />
                </div>
              </div>
              <div className="japField">
                <label className="japLabel">Állapot</label>
                <button
                  type="button"
                  className={`japSwitch ${bOpen ? "on" : ""}`}
                  onClick={() => setBOpen((v) => !v)}
                >
                  <span className="japSwitchKnob" />
                  <span className="japSwitchText">{bOpen ? "Nyitva — kitölthető" : "Zárva — nem kitölthető"}</span>
                </button>
              </div>
            </div>

            <div className="japIntroPreview">
              <strong>Rögzített bevezető és Kapcsolat szekció:</strong> minden űrlap ezzel indul — „Ez az űrlap
              csak az elérhetőségedet kéri be. A tényleges kérdések a szóbeli beszélgetésen jönnek, ezért itt
              csak azt töltsd ki, hogy kivel és mikor tudunk beszélni. A pozíció magyar nyelvű.” majd egy
              Kapcsolat szekció, ahol a Discord felhasználónevet és az elérhetőséget kérjük be. Az alábbi
              kérdések és szekciók ez után jelennek meg — pontosan úgy, mint a Kapcsolat, szekciókkal
              csoportosíthatod a kérdéseket, egy szekcióhoz nem kell azonnal kérdést rendelned, és mind a
              kérdések, mind a szekciók sorrendje a nyilakkal állítható.
            </div>

            <div className="japQuestionsHead">
              <h3>Kérdések és szekciók</h3>
              <div className="japQuestionsHeadBtns">
                <button type="button" className="japBtn japBtnSmall" onClick={addSection}>
                  + Szekció hozzáadása
                </button>
                <button type="button" className="japBtn japBtnSmall" onClick={addQuestion}>
                  + Kérdés hozzáadása
                </button>
              </div>
            </div>

            {bQuestions.length === 0 ? (
              <div className="japEmpty">Nincs egyedi kérdés vagy szekció hozzáadva. (Nem kötelező.)</div>
            ) : (
              <div className="japQuestionList">
                {bQuestions.map((q, idx) => {
                  if (q.type === "section") {
                    return (
                      <div key={q.id} className="japSectionCard">
                        <div className="japQuestionTop">
                          <span className="japQuestionIndex">§</span>
                          <input
                            type="text"
                            className="japInput japQuestionLabelInput"
                            placeholder="Szekció címe... (pl. Elérhetőség)"
                            value={q.label}
                            onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                          />
                          <div className="japMoveBtns">
                            <button
                              type="button"
                              className="japIconBtn"
                              title="Mozgatás felfelé"
                              disabled={idx === 0}
                              onClick={() => moveItem(q.id, -1)}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="japIconBtn"
                              title="Mozgatás lefelé"
                              disabled={idx === bQuestions.length - 1}
                              onClick={() => moveItem(q.id, 1)}
                            >
                              ▼
                            </button>
                          </div>
                          <button
                            type="button"
                            className="japIconBtn delete"
                            title="Szekció törlése"
                            onClick={() => removeQuestion(q.id)}
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          className="japInput"
                          placeholder="Rövid leírás / megjegyzés a szekcióhoz (opcionális)"
                          value={q.description || ""}
                          onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
                        />
                        <div className="japSectionHint">
                          Ez egy szekció-elválasztó — az utána következő kérdések ez alá kerülnek, amíg egy
                          másik szekció nem következik. Nem kell hozzá azonnal kérdést felvenni.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={q.id} className="japQuestionCard">
                      <div className="japQuestionTop">
                        <span className="japQuestionIndex">{idx + 1}.</span>
                        <input
                          type="text"
                          className="japInput japQuestionLabelInput"
                          placeholder="Kérdés szövege..."
                          value={q.label}
                          onChange={(e) => updateQuestion(q.id, { label: e.target.value })}
                        />
                        <div className="japMoveBtns">
                          <button
                            type="button"
                            className="japIconBtn"
                            title="Mozgatás felfelé"
                            disabled={idx === 0}
                            onClick={() => moveItem(q.id, -1)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="japIconBtn"
                            title="Mozgatás lefelé"
                            disabled={idx === bQuestions.length - 1}
                            onClick={() => moveItem(q.id, 1)}
                          >
                            ▼
                          </button>
                        </div>
                        <button
                          type="button"
                          className="japIconBtn delete"
                          title="Kérdés törlése"
                          onClick={() => removeQuestion(q.id)}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="japQuestionRow">
                        <div className="japField japFieldGrow">
                          <label className="japLabel">Típus</label>
                          <AdminDropdown
                            value={q.type}
                            onChange={(val) => updateQuestion(q.id, { type: val })}
                            options={TYPE_OPTIONS}
                          />
                        </div>
                        <div className="japField">
                          <label className="japLabel">Kötelező</label>
                          <button
                            type="button"
                            className={`japSwitch small ${q.required ? "on" : ""}`}
                            onClick={() => updateQuestion(q.id, { required: !q.required })}
                          >
                            <span className="japSwitchKnob" />
                            <span className="japSwitchText">{q.required ? "Kötelező" : "Opcionális"}</span>
                          </button>
                        </div>
                      </div>

                      {(q.type === "select" || q.type === "checkbox") && (
                        <div className="japOptionsBox">
                          <label className="japLabel">
                            {q.type === "select" ? "Választható opciók" : "Kipipálható dobozok"}
                          </label>
                          {q.options.length === 0 && (
                            <div className="japOptionsHint">Adj hozzá legalább 2 opciót.</div>
                          )}
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="japOptionRow">
                              <input
                                type="text"
                                className="japInput"
                                placeholder={`Opció #${oi + 1}`}
                                value={opt}
                                onChange={(e) => updateOption(q.id, oi, e.target.value)}
                              />
                              <button
                                type="button"
                                className="japIconBtn delete"
                                onClick={() => removeOption(q.id, oi)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button type="button" className="japBtn japBtnSmall" onClick={() => addOption(q.id)}>
                            + Opció
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="japFormActions">
              <button
                type="button"
                className="japBtn japBtnGhost"
                onClick={() => {
                  resetBuilder();
                  setView("list");
                }}
              >
                Mégse
              </button>
              <button type="button" className="japBtn japBtnPrimary" disabled={busy} onClick={handleSaveForm}>
                {busy ? "Mentés..." : editingFormId ? "Mentés" : "Létrehozás"}
              </button>
            </div>
          </section>
        )}

        {view === "responses" && activeForm && (
          <section className="japCard">
            <h2 className="japCardTitle">
              {activeForm.title} — kitöltések ({responses.length})
            </h2>
            <a className="japFormLink" href={`/jelentkezes/${activeForm.slug}`} target="_blank" rel="noreferrer">
              neontiers.hu/jelentkezes/{activeForm.slug}
            </a>

            {responses.length === 0 ? (
              <div className="japEmpty" style={{ marginTop: 16 }}>
                Még nem érkezett kitöltés.
              </div>
            ) : (
              <div className="japResponseList">
                {responses.map((resp) => {
                  const isOpen = expandedResponseId === resp.id;
                  return (
                    <div key={resp.id} className={`japResponseCard ${isOpen ? "open" : ""}`}>
                      <button
                        type="button"
                        className="japResponseHead"
                        onClick={() => setExpandedResponseId(isOpen ? null : resp.id)}
                      >
                        <div className="japResponseHeadInfo">
                          <span className="japResponseName">{resp.discord_name}</span>
                          <span className="japResponseDate">{formatDate(resp.created_at)}</span>
                        </div>
                        <span className="japChevron">{isOpen ? "▴" : "▾"}</span>
                      </button>

                      {isOpen && (
                        <div className="japResponseBody">
                          <div className="japAnswerRow">
                            <span className="japAnswerQ">Discord felhasználónév</span>
                            <span className="japAnswerA">{resp.discord_name}</span>
                          </div>
                          <div className="japAnswerRow">
                            <span className="japAnswerQ">Mikor tudunk beszélni</span>
                            <span className="japAnswerA">{resp.availability}</span>
                          </div>

                          {(activeForm.questions || []).map((q) => {
                            if (q.type === "section") {
                              return (
                                <div className="japAnswerSectionDivider" key={q.id}>
                                  {q.label}
                                </div>
                              );
                            }
                            const val = resp.answers ? resp.answers[q.id] : undefined;
                            let display;
                            if (q.type === "checkbox") {
                              display =
                                Array.isArray(val) && val.length ? (
                                  <div className="japChipRow">
                                    {val.map((v, i) => (
                                      <span key={i} className="japChip">
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <em className="japAnswerEmpty">nincs válasz</em>
                                );
                            } else {
                              display = val ? (
                                String(val)
                              ) : (
                                <em className="japAnswerEmpty">nincs válasz</em>
                              );
                            }
                            return (
                              <div className="japAnswerRow" key={q.id}>
                                <span className="japAnswerQ">
                                  {q.label}
                                  <span className="japAnswerType"> · {typeLabel(q.type)}</span>
                                </span>
                                <span className="japAnswerA">{display}</span>
                              </div>
                            );
                          })}

                          <div className="japResponseFooter">
                            <button
                              type="button"
                              className="japBtn japBtnSmall japBtnDanger"
                              onClick={() => handleDeleteResponse(resp)}
                            >
                              Kitöltés törlése
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {confirmState && (
        <div className="japConfirmOverlay">
          <div className="japConfirmModal">
            <p>{confirmState.message}</p>
            <div className="japConfirmActions">
              <button type="button" className="japBtn japBtnGhost" onClick={() => handleConfirm(false)}>
                Mégse
              </button>
              <button type="button" className="japBtn japBtnDanger" onClick={() => handleConfirm(true)}>
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .japLoadingPage {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #05060a;
        }
        .japSpinner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.15);
          border-top-color: #8f7cff;
          animation: japspin 0.8s linear infinite;
        }
        @keyframes japspin {
          to { transform: rotate(360deg); }
        }
        .japPage {
          min-height: 100vh;
          background: #05060a;
          color: #fff;
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .japContent {
          max-width: 980px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          display: grid;
          gap: 22px;
        }
        .japPageHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .japPageHeader h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 900;
        }
        .japPageHeader p {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          max-width: 520px;
        }
        .japCard {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02));
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px 26px;
          box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 10px 30px rgba(0, 0, 0, 0.25);
        }
        .japCardTitle {
          margin: 0 0 16px;
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.85);
        }
        .japEmpty {
          padding: 22px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.14);
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          font-size: 13.5px;
        }
        .japFormList {
          display: grid;
          gap: 12px;
        }
        .japFormItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          padding: 16px 18px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.025);
        }
        .japFormInfo {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 220px;
        }
        .japFormTitleRow {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .japFormTitle {
          font-weight: 900;
          font-size: 16px;
        }
        .japBadge {
          font-size: 10.5px;
          font-weight: 900;
          letter-spacing: 0.04em;
          padding: 3px 9px;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .japBadge.open {
          background: rgba(52, 211, 153, 0.16);
          border: 1px solid rgba(52, 211, 153, 0.4);
          color: #7ee9c4;
        }
        .japBadge.closed {
          background: rgba(214, 71, 71, 0.16);
          border: 1px solid rgba(214, 71, 71, 0.4);
          color: #ffb4b4;
        }
        .japFormLink {
          font-size: 12.5px;
          color: #a99bff;
          text-decoration: none;
          word-break: break-all;
        }
        .japFormLink:hover {
          text-decoration: underline;
        }
        .japFormMeta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }
        .japFormActions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .japBtn {
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          font-weight: 900;
          font-size: 13.5px;
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.15s ease, background 0.15s ease;
          font-family: inherit;
        }
        .japBtnSmall {
          padding: 9px 14px;
          font-size: 12.5px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.8);
        }
        .japBtnSmall:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .japBtnToggle:hover {
          border-color: rgba(213, 179, 85, 0.5);
          color: #e8cf8a;
        }
        .japBtnGhost {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.75);
        }
        .japBtnGhost:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .japBtnPrimary {
          background: linear-gradient(135deg, #8f7cff, #6f5cd6);
          box-shadow: 0 8px 24px rgba(143, 124, 255, 0.35);
          color: #fff;
        }
        .japBtnPrimary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 30px rgba(143, 124, 255, 0.5);
        }
        .japBtnPrimary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .japBtnDanger {
          background: rgba(214, 71, 71, 0.16);
          border: 1px solid rgba(214, 71, 71, 0.4);
          color: #ffb4b4;
        }
        .japBtnDanger:hover {
          background: rgba(214, 71, 71, 0.28);
        }
        .japFormGrid {
          display: grid;
          grid-template-columns: 1.2fr 1.4fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
        }
        .japField {
          display: grid;
          gap: 8px;
        }
        .japFieldGrow {
          flex: 1;
        }
        .japLabel {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.55);
        }
        .japInput {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          font-family: inherit;
        }
        .japInput:focus {
          outline: none;
          border-color: #8f7cff;
        }
        .japSlugRow {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .japSlugPrefix {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          white-space: nowrap;
        }
        .japSwitch {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          font-family: inherit;
        }
        .japSwitch.small {
          padding: 9px 12px;
        }
        .japSwitchKnob {
          width: 30px;
          height: 16px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          position: relative;
          flex: 0 0 auto;
          transition: background 0.15s ease;
        }
        .japSwitchKnob::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.15s ease;
        }
        .japSwitch.on .japSwitchKnob {
          background: #34d399;
        }
        .japSwitch.on .japSwitchKnob::after {
          transform: translateX(14px);
        }
        .japSwitchText {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
        }
        .japIntroPreview {
          font-size: 12.5px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.55);
          background: rgba(143, 124, 255, 0.08);
          border: 1px solid rgba(143, 124, 255, 0.22);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 20px;
        }
        .japIntroPreview strong {
          color: #d7d0ff;
        }
        .japQuestionsHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .japQuestionsHeadBtns {
          display: flex;
          gap: 8px;
        }
        .japQuestionsHead h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
        }
        .japQuestionList {
          display: grid;
          gap: 14px;
          margin-bottom: 20px;
        }
        .japQuestionCard {
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
        }
        .japSectionCard {
          border: 1px solid rgba(143, 124, 255, 0.3);
          border-radius: 14px;
          padding: 16px;
          background: rgba(143, 124, 255, 0.06);
          display: grid;
          gap: 10px;
        }
        .japSectionHint {
          font-size: 11.5px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.5;
        }
        .japMoveBtns {
          display: flex;
          gap: 4px;
          flex: 0 0 auto;
        }
        .japMoveBtns .japIconBtn {
          width: 30px;
          height: 30px;
          font-size: 11px;
        }
        .japIconBtn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .japAnswerSectionDivider {
          margin-top: 6px;
          padding: 8px 4px 4px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #d7d0ff;
          border-top: 1px dashed rgba(143, 124, 255, 0.3);
        }
        .japQuestionTop {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .japQuestionIndex {
          font-weight: 900;
          color: rgba(255, 255, 255, 0.4);
        }
        .japQuestionLabelInput {
          flex: 1;
        }
        .japQuestionRow {
          display: flex;
          gap: 14px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .japIconBtn {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.75);
          cursor: pointer;
          flex: 0 0 auto;
        }
        .japIconBtn.delete:hover {
          border-color: rgba(214, 71, 71, 0.5);
          background: rgba(214, 71, 71, 0.16);
          color: #ffb4b4;
        }
        .japOptionsBox {
          display: grid;
          gap: 8px;
          padding-top: 6px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .japOptionsHint {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
        }
        .japOptionRow {
          display: flex;
          gap: 8px;
        }
        .japFormActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .japResponseList {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }
        .japResponseCard {
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }
        .japResponseCard.open {
          border-color: rgba(143, 124, 255, 0.4);
        }
        .japResponseHead {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          color: #fff;
        }
        .japResponseHeadInfo {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 3px;
        }
        .japResponseName {
          font-weight: 800;
          font-size: 14.5px;
        }
        .japResponseDate {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.45);
        }
        .japChevron {
          color: rgba(255, 255, 255, 0.5);
        }
        .japResponseBody {
          padding: 4px 18px 18px;
          display: grid;
          gap: 12px;
        }
        .japAnswerRow {
          display: grid;
          gap: 4px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
        }
        .japAnswerQ {
          font-size: 11.5px;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .japAnswerType {
          text-transform: none;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.32);
        }
        .japAnswerA {
          font-size: 14px;
          color: #f1f1f7;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .japAnswerEmpty {
          color: rgba(255, 255, 255, 0.35);
        }
        .japChipRow {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .japChip {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(143, 124, 255, 0.16);
          border: 1px solid rgba(143, 124, 255, 0.35);
          color: #d7d0ff;
          font-size: 12.5px;
          font-weight: 700;
        }
        .japResponseFooter {
          display: flex;
          justify-content: flex-end;
        }
        .japConfirmOverlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 6, 10, 0.72);
          display: grid;
          place-items: center;
          z-index: 200;
          padding: 20px;
        }
        .japConfirmModal {
          background: #100f16;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 24px;
          max-width: 420px;
          width: 100%;
        }
        .japConfirmModal p {
          margin: 0 0 18px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.5;
        }
        .japConfirmActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 999;
          padding: 14px 22px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          color: #fff;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
          pointer-events: none;
        }
        .toastOk { background: rgba(52, 211, 153, 0.95); }
        .toastError { background: rgba(214, 71, 71, 0.95); }

        @media (max-width: 720px) {
          .japFormGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
