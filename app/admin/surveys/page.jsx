"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminSurveysPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [surveys, setSurveys] = useState([]);
  const [name, setName] = useState("");
  const [surveyCode, setSurveyCode] = useState("");
  const [logicCode, setLogicCode] = useState("");
  const [grammarCode, setGrammarCode] = useState("");
  const [situationalCode, setSituationalCode] = useState("");
  const [duration, setDuration] = useState(180);
  const [questionsText, setQuestionsText] = useState("");
  const [parsedQuestionsPreview, setParsedQuestionsPreview] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const parseQuestionsText = (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore invalid JSON and try line-based parse
    }

    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const match = line.match(/^([^:|]+)\s*[:|]\s*(.+)$/);
        const stage = match ? match[1].trim().toLowerCase() : "alap";
        const question = match ? match[2].trim() : line;
        return {
          stage,
          question,
          key: `q${index + 1}`,
        };
      });
  };

  useEffect(() => {
    const preview = parseQuestionsText(questionsText);
    if (preview.length > 0) {
      setParsedQuestionsPreview(JSON.stringify(preview, null, 2));
    } else {
      setParsedQuestionsPreview("");
    }
  }, [questionsText]);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/admin/check");
      if (!res.ok) {
        router.push("/admin");
        return;
      }
      const data = await res.json();
      if (String(data.role || "").toLowerCase() !== "owner") {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      await loadSurveys();
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadSurveys = async () => {
    try {
      const res = await fetch("/api/admin/surveys?action=list");
      if (!res.ok) throw new Error("Failed to load surveys");
      const data = await res.json();
      setSurveys(Array.isArray(data?.surveys) ? data.surveys : []);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", text: "Felmérések betöltése sikertelen" });
    }
  };

  const resetForm = () => {
    setSelectedSurvey(null);
    setName("");
    setSurveyCode("");
    setLogicCode("");
    setGrammarCode("");
    setSituationalCode("");
    setDuration(180);
    setQuestionsText("");
  };

  const handleEditSurvey = (survey) => {
    setSelectedSurvey(survey);
    setName(survey.name || "");
    setSurveyCode(survey.survey_code || "");
    setLogicCode(survey.logic_code || "");
    setGrammarCode(survey.grammar_code || "");
    setSituationalCode(survey.situational_code || "");
    setDuration(Number(survey.basic_duration_seconds) || 180);
    setQuestionsText(JSON.stringify(survey.questions || [], null, 2));
  };

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateSurvey = async () => {
    if (!name.trim() || !surveyCode.trim() || !logicCode.trim() || !grammarCode.trim() || !situationalCode.trim() || !questionsText.trim()) {
      showToast("error", "Töltsd ki az összes mezőt a felmérés létrehozásához");
      return;
    }

    const questions = parseQuestionsText(questionsText);
    if (questions.length === 0) {
      showToast("error", "Adj meg legalább egy kérdést JSON-formátumban vagy soronként");
      return;
    }

    const payload = {
      action: selectedSurvey ? "update" : "create",
      name: name.trim(),
      survey_code: surveyCode.trim(),
      logic_code: logicCode.trim(),
      grammar_code: grammarCode.trim(),
      situational_code: situationalCode.trim(),
      basic_duration_seconds: Number(duration) || 180,
      questions,
    };

    if (selectedSurvey) {
      payload.id = selectedSurvey.id;
    }

    try {
      const res = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || (selectedSurvey ? "Felmérés frissítése sikertelen" : "Felmérés létrehozása sikertelen"));
        return;
      }
      showToast("ok", selectedSurvey ? "Felmérés frissítve" : "Felmérés létrehozva");
      resetForm();
      await loadSurveys();
    } catch (err) {
      console.error(err);
      showToast("error", "Hálózati hiba");
    }
  };

  const handleDeleteSurvey = async (id) => {
    if (!confirm("Biztosan törlöd ezt a felmérést?")) return;
    try {
      const res = await fetch("/api/admin/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Törlés sikertelen");
        return;
      }
      showToast("ok", "Felmérés törölve");
      await loadSurveys();
    } catch (err) {
      console.error(err);
      showToast("error", "Hálózati hiba");
    }
  };

  if (loading) {
    return <div className="adminPage">Betöltés...</div>;
  }

  if (unauthorized) {
    return <div className="adminPage">Csak Owner jogosultsággal használható ez az oldal.</div>;
  }

  return (
    <div className="adminPage">
      {toast && <div className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}>{toast.text}</div>}

      <header className="adminNavbar">
        <div className="navbarLeft">
          <h1 className="navbarTitle">NeonTiers Admin Panel</h1>
        </div>
        <nav className="navbarLinks">
          <a href="/" className="navbarLink">Publikus</a>
          <a href="/admin/dashboard" className="navbarLink">Játékos kezelő</a>
          <a href="/admin/surveys" className="navbarLink active">Felmérések</a>
          <a href="/admin/logs" className="navbarLink">Logok</a>
        </nav>
      </header>

      <main className="adminContent">
        <section className="surveySection">
          <h2>Felmérés létrehozása</h2>
          <div className="surveyForm">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Felmérés neve" className="surveyInput" />
            <input value={surveyCode} onChange={(e) => setSurveyCode(e.target.value)} placeholder="Felmérés kódja" className="surveyInput" />
            <input value={logicCode} onChange={(e) => setLogicCode(e.target.value)} placeholder="Logikai kód" className="surveyInput" />
            <input value={grammarCode} onChange={(e) => setGrammarCode(e.target.value)} placeholder="Nyelvtani kód" className="surveyInput" />
            <input value={situationalCode} onChange={(e) => setSituationalCode(e.target.value)} placeholder="Helyzeti kód" className="surveyInput" />
            <div className="durationRow">
              <label className="durationLabel">Alap időkeret (másodpercben)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="surveyInput" min="10" />
            </div>
            <textarea
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              placeholder='Kérdések soronként: alap: Mi a neved? vagy teljes JSON tömb'
              className="surveyTextarea"
              rows="8"
            />
            <div className="inputHint">Használhatod a gyors soros alakot vagy adhatod meg közvetlenül JSON-ként.</div>
            <div className="previewLabel">Automatikus JSON konverzió:</div>
            <pre className="jsonPreview">{parsedQuestionsPreview || "Írd be a kérdéseket a JSON előnézethez."}</pre>
            <div className="formActionRow">
              <button className="surveyButton" onClick={handleCreateSurvey}>{selectedSurvey ? "Változtatások mentése" : "Felmérés mentése"}</button>
              {selectedSurvey && (
                <button className="surveyCancelBtn" onClick={resetForm} type="button">Mégse</button>
              )}
            </div>
          </div>
        </section>

        <section className="surveyListSection">
          <h2>Meglévő felmérések</h2>
          <div className="surveyList">
            {surveys.length === 0 && <div>Nincs létrehozott felmérés</div>}
            {surveys.map((survey) => (
              <div key={survey.id} className="surveyCard">
                <div>
                  <strong>{survey.name}</strong>
                  <div className="surveyMeta">ID: {survey.id} • {survey.basic_duration_seconds}s</div>
                </div>
                <div className="surveyActions">
                  <button className="surveyEditBtn" onClick={() => handleEditSurvey(survey)}>Szerkesztés</button>
                  <button className="surveyDeleteBtn" onClick={() => handleDeleteSurvey(survey.id)}>Törlés</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .adminPage { min-height: 100vh; background: #0b0e14; color: #fff; }
        .adminNavbar { display:flex; align-items:center; gap:20px; padding:18px 24px; background: rgba(11,14,20,0.85); border-bottom:1px solid rgba(255,255,255,0.08); }
        .navbarTitle { margin:0; font-size:18px; font-weight:800; }
        .navbarLinks { display:flex; gap:14px; }
        .navbarLink { color: rgba(255,255,255,0.75); text-decoration:none; font-weight:700; }
        .navbarLink.active, .navbarLink:hover { color: #fff; }
        .adminContent { max-width: 1180px; margin: 24px auto; padding: 0 24px; display:grid; gap:32px; }
        .surveySection, .surveyListSection { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; }
        .surveyForm { display:grid; gap:14px; }
        .surveyInput, .surveyTextarea { width:100%; border:1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color:#fff; padding:12px 14px; border-radius:10px; font-family:inherit; }
        .surveyButton { width:fit-content; padding:12px 20px; border:none; border-radius:10px; background:#d64747; color:#fff; font-weight:800; cursor:pointer; }
        .surveyCancelBtn { padding:12px 20px; border:1px solid rgba(255,255,255,0.18); border-radius:10px; background:transparent; color:#fff; font-weight:700; cursor:pointer; }
        .formActionRow { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .durationRow { display:flex; flex-direction:column; gap:6px; }
        .durationLabel { color: rgba(255,255,255,0.75); font-size:13px; font-weight:700; }
        .inputHint { color: rgba(148, 163, 184, 0.8); font-size:13px; margin-top:-4px; margin-bottom:8px; }
        .previewLabel { color: rgba(255,255,255,0.75); font-size:13px; font-weight:700; margin-top:8px; }
        .jsonPreview { width:100%; min-height:140px; margin:0; padding:14px 16px; border-radius:12px; background: rgba(15,23,42,0.95); border:1px solid rgba(255,255,255,0.08); color:#d1d5db; font-size:13px; overflow:auto; white-space:pre-wrap; word-break:break-word; }
        .surveyList { display:grid; gap:14px; }
        .surveyCard { display:flex; justify-content:space-between; align-items:center; gap:14px; padding:16px 18px; background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:16px; }
        .surveyActions { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .surveyEditBtn { padding:10px 16px; border:1px solid rgba(255,255,255,0.18); border-radius:10px; background: rgba(37, 99, 235, 0.12); color:#93c5fd; cursor:pointer; }
        .surveyDeleteBtn { background: rgba(214,71,71,0.22); border:none; color:#d64747; padding:10px 16px; border-radius:10px; cursor:pointer; }
        .surveyMeta { color: rgba(255,255,255,0.55); font-size:13px; margin-top:6px; }
        .toast { position:fixed; bottom:24px; right:24px; background: rgba(0,0,0,0.8); color:#fff; padding:14px 18px; border-radius:14px; z-index:999; }
        .toastError { background: rgba(214,71,71,0.95); }
        .toastOk { background: rgba(52, 211, 153, 0.95); }
      `}</style>
    </div>
  );
}
