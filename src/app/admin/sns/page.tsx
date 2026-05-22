"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SnsConv {
  id: string;
  poiId: string;
  title: string;
  contact: { name: string; avatar: string };
  steps: any[];
  xpReward: number;
  isActive: boolean;
}

export default function SnsPage() {
  const [convs, setConvs] = useState<SnsConv[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPoi, setFilterPoi] = useState("");
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/sns")
      .then(r => r.json())
      .then(data => { setConvs(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer "${title}" ?`)) return;
    const res = await fetch(`/api/admin/sns/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  const pois = Array.from(new Set(convs.map(c => c.poiId))).sort();
  const filtered = convs.filter(c => !filterPoi || c.poiId === filterPoi);

  const choiceCount = (conv: SnsConv) => conv.steps.filter((s: any) => s.from === "you").length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Conversations SNS</h1>
        <Link href="/admin/sns/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          + Nouvelle conversation
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="flex gap-4 mb-4 items-center">
        <select value={filterPoi} onChange={e => setFilterPoi(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous les POIs</option>
          {pois.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-500">{filtered.length} conversation(s)</span>
      </div>

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">POI</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Steps</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Choix</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">XP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(conv => (
                <tr key={conv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{conv.poiId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{conv.title}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="mr-1">{conv.contact.avatar}</span>
                    {conv.contact.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{conv.steps.length}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded text-xs">{choiceCount(conv)}</span>
                  </td>
                  <td className="px-4 py-3 text-yellow-600">{conv.xpReward} XP</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${conv.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {conv.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/sns/${conv.id}`)}
                      className="text-violet-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(conv.id, conv.title)}
                      className="text-red-500 hover:underline text-xs">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucune conversation SNS</div>
          )}
        </div>
      )}
    </div>
  );
}
