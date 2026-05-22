"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCityPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    id: "", name: "", nameJp: "", centerLat: 35.0, centerLng: 135.0,
    zoom: 14, pitch: 60, bearing: -20.0, levelRequired: 1,
    use3DMap: false, isActive: true, mapImage: "", mapBoundsJson: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.id || !form.name) { setError("ID et nom sont requis"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) router.push("/admin/cities");
    else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Nouvelle ville</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID (unique, slug)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ex: tokyo" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom japonais</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.nameJp} onChange={(e) => setForm({ ...form, nameJp: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude centre</label>
            <input type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.centerLat} onChange={(e) => setForm({ ...form, centerLat: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude centre</label>
            <input type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.centerLng} onChange={(e) => setForm({ ...form, centerLng: parseFloat(e.target.value) })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.zoom} onChange={(e) => setForm({ ...form, zoom: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pitch</label>
            <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.pitch} onChange={(e) => setForm({ ...form, pitch: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bearing</label>
            <input type="number" step="0.1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.bearing} onChange={(e) => setForm({ ...form, bearing: parseFloat(e.target.value) })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Niveau requis</label>
          <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.levelRequired} onChange={(e) => setForm({ ...form, levelRequired: parseInt(e.target.value) })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image carte (URL)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.mapImage} onChange={(e) => setForm({ ...form, mapImage: e.target.value })} placeholder="/images/..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bounds carte (JSON)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-xs"
            value={form.mapBoundsJson} onChange={(e) => setForm({ ...form, mapBoundsJson: e.target.value })}
            placeholder='{"latMax":0,"latMin":0,"lngMin":0,"lngMax":0}' />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.use3DMap}
              onChange={(e) => setForm({ ...form, use3DMap: e.target.checked })} />
            Carte 3D
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Actif
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={handleSave} disabled={saving}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? "Création..." : "Créer"}
        </button>
        <button onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </div>
  );
}
