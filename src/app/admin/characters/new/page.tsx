"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCharacterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    id: "", name: "", nameJp: "", role: "", image: "", voiceId: "",
    systemPrompt: "", greetingMessage: "", greetingTranslation: "",
    isFriendable: false, isActive: true,
  });
  const [greetingWordsJson, setGreetingWordsJson] = useState("[]");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!form.id || !form.name) { setError("ID et nom sont requis"); return; }
    let greetingWords;
    try { greetingWords = JSON.parse(greetingWordsJson); } catch { setError("greetingWords JSON invalide"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/characters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, greetingWords }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/characters/${data.id}`);
    } else {
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
      setForm((f) => ({ ...f, image: url }));
    }
    setUploading(false);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="text-2xl font-bold text-gray-800">Nouveau personnage</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID (unique, stable)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
            value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="ex: char-kenji" />
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
          <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
            value={greetingWordsJson} onChange={(e) => setGreetingWordsJson(e.target.value)} />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.isFriendable}
              onChange={(e) => setForm({ ...form, isFriendable: e.target.checked })} />
            isFriendable
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
