"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface POI { id: string; name: string; cityId: string; }

export default function NewQuestPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    poiId: "", title: "", description: "", order: 1, xpReward: 50, isActive: true,
  });
  const [pois, setPois] = useState<POI[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/pois").then((r) => r.json()).then(setPois);
  }, []);

  const handleSave = async () => {
    if (!form.poiId || !form.title) { setError("POI et titre sont requis"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/quests/${data.id}`);
    } else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
    }
  };

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Nouvelle quête</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">POI</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.poiId} onChange={(e) => setForm({ ...form, poiId: e.target.value })}>
            <option value="">Choisir un POI...</option>
            {pois.map((p) => (
              <option key={p.id} value={p.id}>[{p.cityId}] {p.name}</option>
            ))}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">XP</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: parseInt(e.target.value) })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Actif
        </label>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} disabled={saving}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? "Création..." : "Créer et éditer"}
        </button>
        <button onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </div>
  );
}
