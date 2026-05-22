"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SnsConv {
  id: string; poiId: string; title: string; context: string;
  xpReward: number; isActive: boolean;
  contact: any; steps: any[];
}

function defaultConv(): SnsConv {
  return {
    id: "", poiId: "", title: "", context: "",
    xpReward: 30, isActive: true,
    contact: { name: "", handle: "", avatar: "💬", image: "", relation: "Ami(e)" },
    steps: [],
  };
}

export default function EditSnsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === "new";

  const [form, setForm] = useState<SnsConv>(defaultConv());
  const [contactJson, setContactJson] = useState("{}");
  const [stepsJson, setStepsJson] = useState("[]");
  const [jsonError, setJsonError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) {
      const empty = defaultConv();
      setContactJson(JSON.stringify(empty.contact, null, 2));
      setStepsJson(JSON.stringify(empty.steps, null, 2));
      return;
    }
    fetch(`/api/admin/sns/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setForm(data);
        setContactJson(JSON.stringify(data.contact, null, 2));
        setStepsJson(JSON.stringify(data.steps, null, 2));
        setLoading(false);
      })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  }, [params.id, isNew]);

  const handleSave = async () => {
    let contact, steps;
    try { contact = JSON.parse(contactJson); } catch { setJsonError("contact JSON invalide"); return; }
    try { steps = JSON.parse(stepsJson); } catch { setJsonError("steps JSON invalide"); return; }
    setJsonError("");
    setSaving(true); setError("");

    const body = { ...form, contact, steps };
    const url  = isNew ? "/api/admin/sns" : `/api/admin/sns/${params.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { setError("Erreur lors de la sauvegarde"); return; }
    router.push("/admin/sns");
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;

  const f = (field: keyof SnsConv, val: any) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push("/admin/sns")} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">{isNew ? "Nouvelle conversation SNS" : "Éditer la conversation"}</h1>
      </div>

      {error    && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}
      {jsonError && <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-3 mb-4">{jsonError}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Métadonnées</h2>

        {isNew && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID (ex: sns-konbini-shinjuku)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              value={form.id} onChange={e => f("id", e.target.value)} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">POI ID</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              value={form.poiId} onChange={e => f("poiId", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.xpReward} onChange={e => f("xpReward", parseInt(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.title} onChange={e => f("title", e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contexte (affiché à l'intro)</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.context} onChange={e => f("context", e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={e => f("isActive", e.target.checked)} />
          Actif
        </label>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Contact (JSON)</h2>
        <p className="text-xs text-gray-400 mb-2">
          Champs : <code>name</code>, <code>handle</code>, <code>avatar</code> (emoji), <code>image</code> (chemin optionnel), <code>relation</code>
        </p>
        <textarea rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
          value={contactJson} onChange={e => { setContactJson(e.target.value); setJsonError(""); }} />
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">Steps (JSON)</h2>
          <button
            onClick={() => {
              const exampleStep = [
                { id: "t1", from: "them", jp: "...", romaji: "...", fr: "..." },
                { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
                  { id: "y1a", jp: "...", romaji: "...", fr: "...", correct: true },
                  { id: "y1b", jp: "...", romaji: "...", fr: "...", correct: false, feedback: "..." },
                  { id: "y1c", jp: "...", romaji: "...", fr: "...", correct: false, feedback: "..." },
                ]},
              ];
              setStepsJson(JSON.stringify(exampleStep, null, 2));
            }}
            className="text-xs text-violet-600 hover:underline"
          >
            Insérer un exemple
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-2">
          Chaque step : <code>id</code>, <code>from</code> ("them"|"you"), <code>jp</code>, <code>romaji</code>, <code>fr</code>.
          Steps "you" ont un tableau <code>choices</code> avec <code>correct: true/false</code> et <code>feedback?</code>.
        </p>
        <textarea
          rows={24}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
          value={stepsJson}
          onChange={e => { setStepsJson(e.target.value); setJsonError(""); }}
        />
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-violet-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
        {saving ? "Enregistrement..." : isNew ? "Créer" : "Sauvegarder"}
      </button>
    </div>
  );
}
