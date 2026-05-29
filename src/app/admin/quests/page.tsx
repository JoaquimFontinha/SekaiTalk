"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Quest {
  id: string;
  poiId: string;
  title: string;
  order: number;
  xpReward: number;
  taskCount: number;
  isActive: boolean;
}

export default function QuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPoi, setFilterPoi] = useState("");
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/quests")
      .then((r) => r.json())
      .then((data) => { setQuests(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer la quête "${title}" ?`)) return;
    const res = await fetch(`/api/admin/quests/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  const pois = Array.from(new Set(quests.map((q) => q.poiId))).sort();
  const filtered = quests.filter((q) => !filterPoi || q.poiId === filterPoi);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quêtes</h1>
        <Link href="/admin/quests/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          + Nouvelle quête
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="flex gap-4 mb-4">
        <select value={filterPoi} onChange={(e) => setFilterPoi(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous les POIs</option>
          {pois.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} quêtes</span>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ordre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tâches</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">XP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quest) => (
                <tr key={quest.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{quest.poiId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{quest.title}</td>
                  <td className="px-4 py-3 text-gray-600">{quest.order}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{quest.taskCount}</span>
                  </td>
                  <td className="px-4 py-3 text-yellow-600">{quest.xpReward} XP</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${quest.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {quest.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/quests/${quest.id}`)}
                      className="text-violet-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(quest.id, quest.title)}
                      className="text-red-500 hover:underline text-xs">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucune quête</div>
          )}
        </div>
      )}
    </div>
  );
}
