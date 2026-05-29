"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Choice { id?: string; text: string; isCorrect: boolean; order: number; }
interface Task { id?: string; order: number; instruction: string; aiContext: string; suggestions: any; choices: Choice[]; expanded?: boolean; isNew?: boolean; }
interface Quest { id: string; poiId: string; title: string; description?: string; order: number; xpReward: number; isActive: boolean; vocab: any; tasks: Task[]; }
interface POI { id: string; name: string; cityId: string; }

export default function EditQuestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ poiId: "", title: "", description: "", order: 1, xpReward: 50, isActive: true });
  const [vocabJson, setVocabJson] = useState("[]");
  const [vocabError, setVocabError] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = () => {
    Promise.all([
      fetch(`/api/admin/quests/${params.id}`).then((r) => r.json()),
      fetch("/api/admin/pois").then((r) => r.json()),
    ]).then(([q, ps]) => {
      setQuest(q);
      setPois(ps);
      setForm({ poiId: q.poiId, title: q.title, description: q.description ?? "", order: q.order, xpReward: q.xpReward, isActive: q.isActive });
      setVocabJson(JSON.stringify(q.vocab ?? [], null, 2));
      setTasks((q.tasks ?? []).map((t: Task) => ({ ...t, expanded: false })));
      setLoading(false);
    }).catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, [params.id]);

  const handleSaveQuest = async () => {
    try { JSON.parse(vocabJson); setVocabError(""); } catch { setVocabError("JSON invalide"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/quests/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, vocab: JSON.parse(vocabJson) }),
    });
    setSaving(false);
    if (!res.ok) setError("Erreur lors de la sauvegarde");
  };

  const toggleTask = (idx: number) => {
    setTasks((ts) => ts.map((t, i) => i === idx ? { ...t, expanded: !t.expanded } : t));
  };

  const handleSaveTask = async (task: Task, idx: number) => {
    const { id, isNew, expanded, choices, ...data } = task;
    let res;
    if (isNew) {
      res = await fetch(`/api/admin/quests/${params.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      res = await fetch(`/api/admin/quests/${params.id}/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    if (!res.ok) { setError("Erreur lors de la sauvegarde de la tâche"); return; }
    const savedTask = await res.json();

    // Save choices
    if (choices && choices.length > 0) {
      await fetch(`/api/admin/quests/${params.id}/tasks/${savedTask.id}/choices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(choices.map((c, i) => ({ text: c.text, isCorrect: c.isCorrect, order: i }))),
      });
    }
    load();
  };

  const handleDeleteTask = async (task: Task) => {
    if (task.isNew) { setTasks((ts) => ts.filter((t) => t !== task)); return; }
    if (!confirm("Supprimer cette tâche ?")) return;
    await fetch(`/api/admin/quests/${params.id}/tasks/${task.id}`, { method: "DELETE" });
    load();
  };

  const addTask = () => {
    const maxOrder = tasks.length ? Math.max(...tasks.map((t) => t.order)) + 1 : 1;
    setTasks((ts) => [...ts, { order: maxOrder, instruction: "", aiContext: "", suggestions: [], choices: [{ text: "", isCorrect: true, order: 0 },{ text: "", isCorrect: false, order: 1 }], expanded: true, isNew: true }]);
  };

  const updateTask = (idx: number, field: string, value: any) => {
    setTasks((ts) => ts.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const updateChoice = (tIdx: number, cIdx: number, field: string, value: any) => {
    setTasks((ts) => ts.map((t, i) => i !== tIdx ? t : {
      ...t,
      choices: t.choices.map((c, j) => {
        if (j !== cIdx) return field === "isCorrect" && value ? { ...c, isCorrect: false } : c;
        return { ...c, [field]: value };
      }),
    }));
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/admin/quests")} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Éditeur de quête</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {/* Quest metadata */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Métadonnées</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">POI</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.poiId} onChange={(e) => setForm({ ...form, poiId: e.target.value })}>
            {pois.map((p) => <option key={p.id} value={p.id}>[{p.cityId}] {p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[["order","Ordre"],["xpReward","XP"]].map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: parseInt(e.target.value) })} />
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Actif
        </label>

        {/* Vocab */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vocabulaire (JSON)</label>
          <textarea rows={6} className={`w-full border rounded-lg px-3 py-2 text-xs font-mono ${vocabError ? "border-red-400" : "border-gray-300"}`}
            value={vocabJson} onChange={(e) => { setVocabJson(e.target.value); setVocabError(""); }} />
          {vocabError && <p className="text-red-500 text-xs mt-1">{vocabError}</p>}
        </div>

        <button onClick={handleSaveQuest} disabled={saving}
          className="bg-violet-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? "Enregistrement..." : "Sauvegarder la quête"}
        </button>
      </div>

      {/* Tasks */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Tâches ({tasks.length})</h2>
        <button onClick={addTask}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          + Ajouter une tâche
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task, idx) => (
          <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleTask(idx)}>
              <span className="text-xs font-bold text-white bg-violet-500 rounded px-1.5 py-0.5">{idx + 1}</span>
              <p className="flex-1 text-sm text-gray-700 truncate">{task.instruction || "Nouvelle tâche"}</p>
              <span className="text-xs text-gray-400">{task.choices?.length ?? 0} choix</span>
              <span className="text-gray-400 text-xs">{task.expanded ? "▲" : "▼"}</span>
            </div>

            {task.expanded && (
              <div className="border-t border-gray-100 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Instruction</label>
                  <input className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    value={task.instruction} onChange={(e) => updateTask(idx, "instruction", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contexte IA (aiContext)</label>
                  <textarea rows={3} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                    value={task.aiContext} onChange={(e) => updateTask(idx, "aiContext", e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Choix (un seul correct)</label>
                  {task.choices.map((c, cIdx) => (
                    <div key={cIdx} className="flex gap-2 mb-2 items-center">
                      <input type="radio" checked={c.isCorrect}
                        onChange={() => updateChoice(idx, cIdx, "isCorrect", true)} />
                      <input className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        value={c.text} onChange={(e) => updateChoice(idx, cIdx, "text", e.target.value)} />
                      {task.choices.length > 2 && (
                        <button onClick={() => updateTask(idx, "choices", task.choices.filter((_, j) => j !== cIdx))}
                          className="text-red-400 text-xs">✕</button>
                      )}
                    </div>
                  ))}
                  {task.choices.length < 4 && (
                    <button onClick={() => updateTask(idx, "choices", [...task.choices, { text: "", isCorrect: false, order: task.choices.length }])}
                      className="text-violet-600 text-xs hover:underline">+ Ajouter un choix</button>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => handleSaveTask(task, idx)}
                    className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-violet-700">
                    Sauvegarder
                  </button>
                  <button onClick={() => handleDeleteTask(task)}
                    className="border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50">
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="text-center text-gray-400 py-8 bg-white border border-gray-200 rounded-xl">
            Aucune tâche
          </div>
        )}
      </div>
    </div>
  );
}
