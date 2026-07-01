"use client";

import React, { useEffect, useMemo, useState } from "react";

const STAGE_LABELS = {
  alap: "Alap",
  logikai: "Logikai",
  nyelvtani: "Nyelvtani",
  helyzeti: "Helyzeti",
  completed: "Befejezett",
};

export default function FelmeresPage() {
  const [surveyName, setSurveyName] = useState("");
  const [surveyCode, setSurveyCode] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [survey, setSurvey] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCode, setNextCode] = useState("");
  const [stageValidated, setStageValidated] = useState(false);
  const [stageAnswers, setStageAnswers] = useState({});
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const onBlur = () => {
      if (response?.id) {
        fetch("/api/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "track", response_id: response.id, event: "blur" }),
        });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && response?.id) {
        fetch("/api/surveys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "track", response_id: response.id, event: "hide" }),
        });
      }
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [response]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stageQuestions = useMemo(() => {
    if (!survey?.questions) return [];
    return survey.questions.filter((q) => String(q.stage || "").toLowerCase() === String(response?.current_stage || survey?.questions?.[0]?.stage || "alap").toLowerCase());
  }, [survey, response]);

  const currentStage = response?.current_stage || "alap";
  const isCompleted = currentStage === "completed";

  const getStageDisplayName = (stage) => STAGE_LABELS[stage] || stage;

  const showStageCodeEntry = !isCompleted && response && response.current_stage !== "alap" && !stageValidated;

  const showQuestions = response && !isCompleted && (response.current_stage === "alap" || stageValidated);

  const handleStartSurvey = async () => {
    setError("");
    if (!surveyName.trim() || !surveyCode.trim() || !participantName.trim()) {
      setError("Töltsd ki a felmérés nevét, kódját és a kitöltő nevét!");
      return;
    }

    setLoading(true);
    try {
      const listRes = await fetch(`/api/surveys?name=${encodeURIComponent(surveyName.trim())}&code=${encodeURIComponent(surveyCode.trim())}`);
      const listData = await listRes.json();
      if (!listRes.ok) {
        setError(listData.error || "Felmérés nem található");
        setLoading(false);
        return;
      }

      const surveyData = listData.survey;
      if (!surveyData) {
        setError("Felmérés nem található");
        setLoading(false);
        return;
      }

      setSurvey(surveyData);
      const startRes = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", survey_id: surveyData.id, participant_name: participantName.trim() }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) {
        setError(startData.error || "Felmérés indítása sikertelen");
        setLoading(false);
        return;
      }

      setResponse(startData.response);
      setStageValidated(startData.response?.current_stage === "alap");
      setStageAnswers({});
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Hálózati hiba");
      setLoading(false);
    }
  };

  const handleValidateStage = async () => {
    if (!nextCode.trim()) {
      setError("Add meg a megfelelő kódot a folytatáshoz!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate_stage", response_id: response.id, stage: response.current_stage, code: nextCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Helytelen kód");
        setLoading(false);
        return;
      }
      setStageValidated(true);
      setNextCode("");
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Hálózati hiba");
      setLoading(false);
    }
  };

  const handleSubmitStage = async () => {
    setError("");
    const answers = { ...stageAnswers };
    const missingAnswers = stageQuestions.some((question) => {
      const key = String(question.key || question.question || question.id || "").trim();
      return key && (answers[key] === undefined || answers[key] === null || String(answers[key]).trim() === "");
    });
    if (missingAnswers) {
      setError("Töltsd ki az összes kérdést a folytatáshoz");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", response_id: response.id, stage: response.current_stage, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Beküldés sikertelen");
        setLoading(false);
        return;
      }
      setResponse(data.response);
      setStageValidated(false);
      setStageAnswers({});
      setError("");
      setToast({ type: "ok", text: data.response.current_stage === "completed" ? "Felmérés vége!" : "Sikeresen továbbléptél" });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Hálózati hiba");
      setLoading(false);
    }
  };

  const handleAnswerChange = (key, value) => {
    setStageAnswers((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="felmeresPage">
      <main className="felmeresContent">
        <header className="felmeresHeader">
          <h1>NeonTiers Felmérés</h1>
          <p>Regulatorok csak a jogosultságuk szerint tölthetik ki a felmérést.</p>
        </header>

        {!response && (
          <section className="felmeresForm">
            <input className="felmeresInput" value={surveyName} onChange={(e) => setSurveyName(e.target.value)} placeholder="Felmérés neve" />
            <input className="felmeresInput" value={surveyCode} onChange={(e) => setSurveyCode(e.target.value)} placeholder="Felmérés kódja" />
            <input className="felmeresInput" value={participantName} onChange={(e) => setParticipantName(e.target.value)} placeholder="Kitöltő neve" />
            <button className="felmeresButton" onClick={handleStartSurvey} disabled={loading}>Felmérés indítása</button>
            {error && <div className="felmeresError">{error}</div>}
          </section>
        )}

        {response && !isCompleted && (
          <section className="felmeresStageCard">
            <h2>{getStageDisplayName(currentStage)} szakasz</h2>
            <p>Kitöltő: {response.participant_name}</p>
            <p>Felmérés: {survey?.name}</p>
            {showStageCodeEntry && (
              <div className="codeEntry">
                <p>Adj meg egy kódot a folytatáshoz:</p>
                <input className="felmeresInput" value={nextCode} onChange={(e) => setNextCode(e.target.value)} placeholder={`Add meg a ${getStageDisplayName(currentStage)} kódot`} />
                <button className="felmeresButton" onClick={handleValidateStage} disabled={loading}>Kód ellenőrzése</button>
              </div>
            )}
            {showQuestions && (
              <div className="questionsBlock">
                {stageQuestions.length === 0 ? (
                  <div className="emptyState">Nincsenek kérdések ehhez a szakaszhoz.</div>
                ) : (
                  stageQuestions.map((question, index) => {
                    const key = String(question.key || question.question || index).trim();
                    return (
                      <div key={key} className="questionRow">
                        <label>{question.question || question.text || `Kérdés ${index + 1}`}</label>
                        <textarea
                          className="felmeresTextarea"
                          rows={4}
                          value={stageAnswers[key] || ""}
                          onChange={(e) => handleAnswerChange(key, e.target.value)}
                        />
                      </div>
                    );
                  })
                )}
                <button className="felmeresButton" onClick={handleSubmitStage} disabled={loading}>Következő</button>
              </div>
            )}
            {error && <div className="felmeresError">{error}</div>}
          </section>
        )}

        {response && isCompleted && (
          <section className="felmeresCompleteCard">
            <h2>Felmérés befejezve</h2>
            <p>Köszönjük a kitöltést!</p>
            <p>Kitöltő: {response.participant_name}</p>
            <p>Felmérés: {survey?.name}</p>
            <div className="summaryBox">
              <p>Oldalelhagyások száma: {response.left_page_count || 0}</p>
              <p>Utolsó szakasz: {getStageDisplayName(response.current_stage)}</p>
              <p>Befejezés ideje: {response.completed_at ? new Date(response.completed_at).toLocaleString("hu-HU") : "-"}</p>
            </div>
          </section>
        )}
      </main>

      {toast && <div className={`toast ${toast.type === "error" ? "toastError" : "toastOk"}`}>{toast.text}</div>}

      <style jsx>{`
        .felmeresPage { min-height: 100vh; background: #02040f; color: #fff; font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; padding: 28px; }
        .felmeresContent { max-width: 860px; margin: 0 auto; display: grid; gap: 24px; }
        .felmeresHeader { display: grid; gap: 12px; }
        .felmeresHeader h1 { margin: 0; font-size: 32px; }
        .felmeresHeader p { margin: 0; color: rgba(255,255,255,0.7); }
        .felmeresForm, .felmeresStageCard, .felmeresCompleteCard { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; display: grid; gap: 16px; }
        .felmeresInput, .felmeresTextarea { width: 100%; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: #fff; padding: 14px 16px; font-size: 14px; resize: vertical; }
        .felmeresButton { width: fit-content; padding: 12px 20px; background: #d64747; border: none; border-radius: 12px; color: #fff; font-weight: 800; cursor: pointer; }
        .felmeresButton:hover { background: #c93f3f; }
        .codeEntry { display: grid; gap: 12px; }
        .questionsBlock { display: grid; gap: 20px; }
        .questionRow { display: grid; gap: 10px; }
        .questionRow label { font-weight: 700; }
        .emptyState { padding: 18px; border-radius: 14px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.72); }
        .felmeresError { color: #ffcdd2; background: rgba(214,71,71,0.18); border: 1px solid rgba(214,71,71,0.35); padding: 12px 14px; border-radius: 12px; }
        .summaryBox { display: grid; gap: 10px; background: rgba(255,255,255,0.04); padding: 16px; border-radius: 14px; }
        .toast { position: fixed; bottom: 20px; right: 20px; padding: 14px 16px; border-radius: 14px; z-index: 999; font-weight: 700; }
        .toastError { background: rgba(214,71,71,0.92); }
        .toastOk { background: rgba(52,211,153,0.95); color: #000; }
      `}</style>
    </div>
  );
}
