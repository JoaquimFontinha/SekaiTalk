"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface City {
  id: string;
  name: string;
  nameJp: string;
  levelRequired: number;
  use3DMap: boolean;
  isActive: boolean;
  pois: { id: string }[];
}

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/cities")
      .then((r) => r.json())
      .then((data) => { setCities(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la ville "${name}" ?`)) return;
    const res = await fetch(`/api/admin/cities/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Villes</h1>
        <Link
          href="/admin/cities/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          + Nouvelle ville
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Japonais</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Niveau</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">3D</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">POIs</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{city.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{city.name}</td>
                  <td className="px-4 py-3 text-gray-600">{city.nameJp || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      Nv.{city.levelRequired}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {city.use3DMap ? (
                      <span className="text-green-600 text-xs font-medium">Oui</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Non</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{city.pois?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${city.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {city.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/admin/cities/${city.id}`)}
                      className="text-violet-600 hover:underline text-xs"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(city.id, city.name)}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cities.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucune ville</div>
          )}
        </div>
      )}
    </div>
  );
}
