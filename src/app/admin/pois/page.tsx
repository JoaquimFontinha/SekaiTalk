"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface POI {
  id: string;
  cityId: string;
  name: string;
  type: string;
  isActive: boolean;
  city?: { name: string };
}

const POI_TYPES = ["transport","konbini","izakaya","site","market","loisir","shop","restaurant","cafe","hotel","pharmacie","medecin","poste"];

export default function POIsPage() {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterType, setFilterType] = useState("");
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/pois")
      .then((r) => r.json())
      .then((data) => { setPois(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le POI "${name}" ?`)) return;
    const res = await fetch(`/api/admin/pois/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  const cities = Array.from(new Set(pois.map((p) => p.cityId))).sort();
  const filtered = pois.filter((p) =>
    (!filterCity || p.cityId === filterCity) &&
    (!filterType || p.type === filterType)
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">POIs</h1>
        <Link href="/admin/pois/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          + Nouveau POI
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      <div className="flex gap-4 mb-4">
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les villes</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Tous les types</option>
          {POI_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} résultats</span>
      </div>

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ville</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((poi) => (
                <tr key={poi.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{poi.id}</td>
                  <td className="px-4 py-3 text-gray-600">{poi.city?.name ?? poi.cityId}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{poi.name}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{poi.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${poi.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {poi.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/pois/${poi.id}`)}
                      className="text-violet-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(poi.id, poi.name)}
                      className="text-red-500 hover:underline text-xs">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucun POI</div>
          )}
        </div>
      )}
    </div>
  );
}
