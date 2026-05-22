"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StepType = "INTRO" | "PRONUNCIATION" | "TRUE_FALSE" | "CHOOSE_ANSWER" | "COMPLETE_WORD" | "MATCH_PAIRS" | "CULTURE_NOTE";

interface Step {
  id: string;
  order: number;
  type: StepType;
  data: any;
}

interface Lesson {
  id: string;
  poiId: string;
  title: string;
  description?: string;
  steps: Step[];
}

const STEP_TYPES: StepType[] = ["INTRO","PRONUNCIATION","TRUE_FALSE","CHOOSE_ANSWER","COMPLETE_WORD","MATCH_PAIRS","CULTURE_NOTE"];

const STEP_LABELS: Record<StepType, string> = {
  INTRO: "Introduction",
  PRONUNCIATION: "Prononciation",
  TRUE_FALSE: "Vrai / Faux",
  CHOOSE_ANSWER: "QCM",
  COMPLETE_WORD: "Compléter",
  MATCH_PAIRS: "Associations",
  CULTURE_NOTE: "Note culturelle",
};

function defaultData(type: StepType): any {
  switch (type) {
    case "INTRO": return { word: "", kana: "", romaji: "", translation: "", example: "" };
    case "PRONUNCIATION": return { word: "", kana: "", romaji: "", translation: "", hint: "" };
    case "TRUE_FALSE": return { statement: "", isTrue: true, explanation: "", word: "" };
    case "CHOOSE_ANSWER": return { question: "", translation: "", explanation: "", choices: [{ text: "", subtext: "", isCorrect: true },{ text: "", subtext: "", isCorrect: false },{ text: "", subtext: "", isCorrect: false }] };
    case "COMPLETE_WORD": return { question: "", prefix: "", suffix: "", answer: "", choices: ["","","",""], explanation: "", translation: "" };
    case "MATCH_PAIRS": return { pairs: [{ left: "", right: "" },{ left: "", right: "" },{ left: "", right: "" },{ left: "", right: "" }] };
    case "CULTURE_NOTE": return { title: "", text: "", vocab: [{ word: "", kana: "", translation: "" }] };
  }
}

function StepEditor({ step, lessonId, onSaved, onCancel }: {
  step: Partial<Step> & { isNew?: boolean };
  lessonId: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<any>(step.data ?? defaultData(step.type as StepType));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    let res;
    if (step.isNew) {
      res = await fetch(`/api/admin/lessons/${lessonId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: step.type, data, order: step.order ?? 0 }),
      });
    } else {
      res = await fetch(`/api/admin/lessons/${lessonId}/steps/${step.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: step.type, data, order: step.order }),
      });
    }
    setSaving(false);
    if (res.ok) onSaved();
    else setError("Erreur lors de l'enregistrement");
  };

  const type = step.type as StepType;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{STEP_LABELS[type]}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm">✕ Fermer</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm">{error}</div>}

      {(type === "INTRO" || type === "PRONUNCIATION") && (
        <div className="grid grid-cols-2 gap-3">
          {["word","kana","romaji","translation","example","hint"].filter(k => type === "INTRO" ? ["word","kana","romaji","translation","example"].includes(k) : ["word","kana","romaji","translation","hint"].includes(k)).map(k => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{k}</label>
              <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={data[k] ?? ""} onChange={(e) => setData({ ...data, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      {type === "TRUE_FALSE" && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Affirmation</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.statement ?? ""} onChange={(e) => setData({ ...data, statement: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Réponse</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={data.isTrue === true} onChange={() => setData({ ...data, isTrue: true })} />
                Vrai
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={data.isTrue === false} onChange={() => setData({ ...data, isTrue: false })} />
                Faux
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Explication</label>
            <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.explanation ?? ""} onChange={(e) => setData({ ...data, explanation: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mot (optionnel)</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.word ?? ""} onChange={(e) => setData({ ...data, word: e.target.value })} />
          </div>
        </>
      )}

      {type === "CHOOSE_ANSWER" && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.question ?? ""} onChange={(e) => setData({ ...data, question: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Traduction (optionnel)</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.translation ?? ""} onChange={(e) => setData({ ...data, translation: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Explication</label>
            <textarea rows={2} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.explanation ?? ""} onChange={(e) => setData({ ...data, explanation: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Choix (un seul correct)</label>
            {(data.choices ?? []).map((c: any, i: number) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <input type="radio" checked={c.isCorrect} onChange={() => setData({
                  ...data, choices: data.choices.map((ch: any, j: number) => ({ ...ch, isCorrect: i === j }))
                })} />
                <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Texte"
                  value={c.text ?? ""} onChange={(e) => setData({ ...data, choices: data.choices.map((ch: any, j: number) => j === i ? { ...ch, text: e.target.value } : ch) })} />
                <input className="w-32 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Sous-texte"
                  value={c.subtext ?? ""} onChange={(e) => setData({ ...data, choices: data.choices.map((ch: any, j: number) => j === i ? { ...ch, subtext: e.target.value } : ch) })} />
                {data.choices.length > 2 && (
                  <button onClick={() => setData({ ...data, choices: data.choices.filter((_: any, j: number) => j !== i) })} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                )}
              </div>
            ))}
            {data.choices?.length < 4 && (
              <button onClick={() => setData({ ...data, choices: [...data.choices, { text: "", subtext: "", isCorrect: false }] })}
                className="text-violet-600 text-xs hover:underline">+ Ajouter un choix</button>
            )}
          </div>
        </>
      )}

      {type === "COMPLETE_WORD" && (
        <>
          {["question","prefix","suffix","answer","explanation","translation"].map(k => (
            <div key={k}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{k}</label>
              <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                value={data[k] ?? ""} onChange={(e) => setData({ ...data, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Choix (3-4 options)</label>
            {(data.choices ?? []).map((c: string, i: number) => (
              <div key={i} className="flex gap-2 mb-1">
                <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  value={c} onChange={(e) => setData({ ...data, choices: data.choices.map((ch: string, j: number) => j === i ? e.target.value : ch) })} />
                {data.choices.length > 2 && (
                  <button onClick={() => setData({ ...data, choices: data.choices.filter((_: any, j: number) => j !== i) })} className="text-red-400 text-xs">✕</button>
                )}
              </div>
            ))}
            {data.choices?.length < 4 && (
              <button onClick={() => setData({ ...data, choices: [...data.choices, ""] })}
                className="text-violet-600 text-xs hover:underline">+ Ajouter</button>
            )}
          </div>
        </>
      )}

      {type === "MATCH_PAIRS" && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">4 paires (gauche ↔ droite)</label>
          {(data.pairs ?? []).map((p: any, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Japonais"
                value={p.left ?? ""} onChange={(e) => setData({ ...data, pairs: data.pairs.map((pr: any, j: number) => j === i ? { ...pr, left: e.target.value } : pr) })} />
              <span className="self-center text-gray-400">↔</span>
              <input className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Français"
                value={p.right ?? ""} onChange={(e) => setData({ ...data, pairs: data.pairs.map((pr: any, j: number) => j === i ? { ...pr, right: e.target.value } : pr) })} />
            </div>
          ))}
        </div>
      )}

      {type === "CULTURE_NOTE" && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
            <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.title ?? ""} onChange={(e) => setData({ ...data, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Texte</label>
            <textarea rows={4} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
              value={data.text ?? ""} onChange={(e) => setData({ ...data, text: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Vocabulaire illustratif</label>
            {(data.vocab ?? []).map((v: any, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Mot JP"
                  value={v.word ?? ""} onChange={(e) => setData({ ...data, vocab: data.vocab.map((vv: any, j: number) => j === i ? { ...vv, word: e.target.value } : vv) })} />
                <input className="w-28 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Kana"
                  value={v.kana ?? ""} onChange={(e) => setData({ ...data, vocab: data.vocab.map((vv: any, j: number) => j === i ? { ...vv, kana: e.target.value } : vv) })} />
                <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm" placeholder="Traduction"
                  value={v.translation ?? ""} onChange={(e) => setData({ ...data, vocab: data.vocab.map((vv: any, j: number) => j === i ? { ...vv, translation: e.target.value } : vv) })} />
                <button onClick={() => setData({ ...data, vocab: data.vocab.filter((_: any, j: number) => j !== i) })} className="text-red-400 text-xs">✕</button>
              </div>
            ))}
            <button onClick={() => setData({ ...data, vocab: [...(data.vocab ?? []), { word: "", kana: "", translation: "" }] })}
              className="text-violet-600 text-xs hover:underline">+ Ajouter un mot</button>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? "Enregistrement..." : "Enregistrer l'étape"}
        </button>
        <button onClick={onCancel} className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </div>
  );
}

export default function LessonEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingStep, setEditingStep] = useState<(Partial<Step> & { isNew?: boolean }) | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const load = () => {
    fetch(`/api/admin/lessons/${params.id}`)
      .then((r) => r.json())
      .then((data: Lesson) => {
        setLesson(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setLoading(false);
      })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, [params.id]);

  const handleSaveHeader = async () => {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/lessons/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    setSaving(false);
    if (!res.ok) setError("Erreur lors de la sauvegarde");
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("Supprimer cette étape ?")) return;
    const res = await fetch(`/api/admin/lessons/${params.id}/steps/${stepId}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  const handleMoveStep = async (stepId: string, direction: "up" | "down") => {
    if (!lesson) return;
    const steps = [...lesson.steps].sort((a, b) => a.order - b.order);
    const idx = steps.findIndex((s) => s.id === stepId);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === steps.length - 1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const newSteps = [...steps];
    const tmp = newSteps[idx].order;
    newSteps[idx] = { ...newSteps[idx], order: newSteps[swapIdx].order };
    newSteps[swapIdx] = { ...newSteps[swapIdx], order: tmp };
    await fetch(`/api/admin/lessons/${params.id}/steps/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSteps.map((s) => ({ id: s.id, order: s.order }))),
    });
    load();
  };

  const handleAddStep = (type: StepType) => {
    setShowAddMenu(false);
    const maxOrder = lesson?.steps.length ? Math.max(...lesson.steps.map((s) => s.order)) + 1 : 1;
    setEditingStep({ type, isNew: true, order: maxOrder, data: defaultData(type) });
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;
  if (!lesson) return <div className="p-8 text-red-500">Leçon introuvable</div>;

  const sortedSteps = [...lesson.steps].sort((a, b) => a.order - b.order);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/admin/lessons")} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Éditeur de leçon</h1>
        <span className="text-sm text-gray-400">— {lesson.poiId}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button onClick={handleSaveHeader} disabled={saving}
          className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? "Enregistrement..." : "Sauvegarder le titre"}
        </button>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Étapes ({sortedSteps.length})</h2>
        <div className="relative">
          <button onClick={() => setShowAddMenu(!showAddMenu)}
            className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
            + Ajouter une étape
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[180px]">
              {STEP_TYPES.map((t) => (
                <button key={t} onClick={() => handleAddStep(t)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-700">
                  {STEP_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {sortedSteps.map((step, idx) => (
          <div key={step.id}>
            <div className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${editingStep?.id === step.id ? "border-violet-300" : "border-gray-200"}`}>
              <div className="flex flex-col gap-1 mt-0.5">
                <button onClick={() => handleMoveStep(step.id, "up")} disabled={idx === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▲</button>
                <button onClick={() => handleMoveStep(step.id, "down")} disabled={idx === sortedSteps.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs leading-none">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white bg-violet-500 rounded px-1.5 py-0.5">{idx + 1}</span>
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">{STEP_LABELS[step.type]}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {step.data?.word || step.data?.question || step.data?.statement || step.data?.title || "—"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditingStep(editingStep?.id === step.id ? null : step)}
                  className="text-violet-600 hover:underline text-xs">Modifier</button>
                <button onClick={() => handleDeleteStep(step.id)}
                  className="text-red-500 hover:underline text-xs">Suppr.</button>
              </div>
            </div>

            {editingStep && editingStep.id === step.id && (
              <StepEditor
                step={editingStep}
                lessonId={params.id}
                onSaved={() => { setEditingStep(null); load(); }}
                onCancel={() => setEditingStep(null)}
              />
            )}
          </div>
        ))}

        {sortedSteps.length === 0 && (
          <div className="text-center text-gray-400 py-8 bg-white border border-gray-200 rounded-xl">
            Aucune étape — cliquez sur &quot;Ajouter une étape&quot; pour commencer
          </div>
        )}
      </div>

      {/* New step editor (bottom) */}
      {editingStep?.isNew && (
        <StepEditor
          step={editingStep}
          lessonId={params.id}
          onSaved={() => { setEditingStep(null); load(); }}
          onCancel={() => setEditingStep(null)}
        />
      )}
    </div>
  );
}
