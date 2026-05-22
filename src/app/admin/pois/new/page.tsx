"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const POI_TYPES = ["transport","konbini","izakaya","site","market","loisir","shop","restaurant","cafe","hotel","pharmacie","medecin","poste"];

interface City { id: string; name: string; }

export default function NewPOIPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    id: "", cityId: "", name: "", type: "konbini", lat: 35.6762, lng: 139.6903,
    description: "", logoPath: "", isActive: true,
  });
  const [cities, setCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/cities").then((r) => r.json()).then(setCities);
  }, []);

  const handleSave = async () => {
    if (!form.id || !form.cityId || !form.name) { setError("ID, ville et nom sont requis"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/pois", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) router.push("/admin/pois");
    else {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("type", "logos");
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setForm((f) => ({ ...f, logoPath: url }));
    }
    setUploading(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Nouveau POI</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID (unique, slug)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ex: tokyo-mcdonalds-shibuya" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })}>
              <option value="">Choisir une ville...</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {POI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input type="number" step="0.0001" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.lng} onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo (chemin)</label>
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.logoPath} onChange={(e) => setForm({ ...form, logoPath: e.target.value })}
              placeholder="/images/pois/logos/..." />
            <label className="bg-gray-100 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
              {uploading ? "..." : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          {form.logoPath && (
            <img src={form.logoPath} alt="Logo" className="mt-2 h-12 w-12 object-contain border border-gray-200 rounded" />
          )}
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
          {saving ? "Création..." : "Créer"}
        </button>
        <button onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm hover:bg-gray-50">
          Annuler
        </button>
      </div>
    </div>
  );
}
