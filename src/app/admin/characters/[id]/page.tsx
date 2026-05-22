"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Appearance { id: string; poiId: string; locationContext?: string; }
interface POI { id: string; name: string; cityId: string; }

export default function EditCharacterPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", nameJp: "", role: "", image: "", voiceId: "",
    systemPrompt: "", greetingMessage: "", greetingTranslation: "",
    isFriendable: false, isActive: true,
  });
  const [greetingWordsJson, setGreetingWordsJson] = useState("[]");
  const [appearances, setAppearances] = useState<Appearance[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [newPoiId, setNewPoiId] = useState("");
  const [newContext, setNewContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    Promise.all([
      fetch(`/api/admin/characters/${params.id}`).then((r) => r.json()),
      fetch("/api/admin/pois").then((r) => r.json()),
    ]).then(([c, ps]) => {
      setForm({
        name: c.name ?? "",
        nameJp: c.nameJp ?? "",
        role: c.role ?? "",
        image: c.image ?? "",
        voiceId: c.voiceId ?? "",
        systemPrompt: c.systemPrompt ?? "",
        greetingMessage: c.greetingMessage ?? "",
        greetingTranslation: c.greetingTranslation ?? "",
        isFriendable: c.isFriendable ?? false,
        isActive: c.isActive ?? true,
      });
      setGreetingWordsJson(JSON.stringify(c.greetingWords ?? [], null, 2));
      setAppearances(c.appearances ?? []);
      setPois(ps);
      setLoading(false);
    }).catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, [params.id]);

  const handleSave = async () => {
    let greetingWords;
    try { greetingWords = JSON.parse(greetingWordsJson); } catch { setError("greetingWords JSON invalide"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/characters/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, greetingWords }),
    });
    setSaving(false);
    if (!res.ok) setError("Erreur lors de la sauvegarde");
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
      setForm((f) => ({ ...f, image: url }));
    }
    setUploading(false);
  };

  const handleAddAppearance = async () => {
    if (!newPoiId) return;
    const res = await fetch(`/api/admin/characters/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_appearance", poiId: newPoiId, locationContext: newContext }),
    });
    if (res.ok) { setNewPoiId(""); setNewContext(""); load(); }
    else setError("Erreur lors de l'ajout");
  };

  const handleRemoveAppearance = async (poiId: string) => {
    await fetch(`/api/admin/characters/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_appearance", poiId }),
    });
    load();
  };

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Modifier le personnage — {params.id}</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID (lecture seule)</label>
          <input readOnly className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-mono text-gray-500"
            value={params.id} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[["name","Nom"],["nameJp","Nom japonais"],["role","Rôle"],["voiceId","ElevenLabs Voice ID"]].map(([k,l]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={(form as any)[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image (URL)</label>
          <div className="flex gap-2">
            <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <label className="bg-gray-100 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-200">
              {uploading ? "..." : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          {form.image && <img src={form.image} alt="" className="mt-2 h-16 w-16 object-cover rounded-full border border-gray-200" />}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea rows={6} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message d&apos;accueil</label>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.greetingMessage} onChange={(e) => setForm({ ...form, greetingMessage: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Traduction accueil</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={form.greetingTranslation} onChange={(e) => setForm({ ...form, greetingTranslation: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Greeting Words (JSON)</label>
          <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
            value={greetingWordsJson} onChange={(e) => setGreetingWordsJson(e.target.value)} />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isFriendable}
              onChange={(e) => setForm({ ...form, isFriendable: e.target.checked })} />
            isFriendable (mémoire activée)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Actif
          </label>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {/* Appearances */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Apparitions dans les lieux</h2>

        {appearances.map((a) => (
          <div key={a.poiId} className="flex items-start gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="font-mono text-xs text-gray-700">{a.poiId}</div>
              {a.locationContext && <div className="text-xs text-gray-500 mt-1">{a.locationContext}</div>}
            </div>
            <button onClick={() => handleRemoveAppearance(a.poiId)}
              className="text-red-400 hover:text-red-600 text-xs">Retirer</button>
          </div>
        ))}

        <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-600">Ajouter une apparition</h3>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={newPoiId} onChange={(e) => setNewPoiId(e.target.value)}>
            <option value="">Choisir un POI...</option>
            {pois.filter((p) => !appearances.find((a) => a.poiId === p.id)).map((p) => (
              <option key={p.id} value={p.id}>[{p.cityId}] {p.name}</option>
            ))}
          </select>
          <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Contexte du lieu (optionnel)" value={newContext} onChange={(e) => setNewContext(e.target.value)} />
          <button onClick={handleAddAppearance}
            className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700">
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
