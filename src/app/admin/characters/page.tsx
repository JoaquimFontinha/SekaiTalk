"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Character {
  id: string;
  name: string;
  nameJp: string;
  role: string;
  isFriendable: boolean;
  isActive: boolean;
  appearances: { poiId: string }[];
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/characters")
      .then((r) => r.json())
      .then((data) => { setCharacters(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer le personnage "${name}" ?`)) return;
    const res = await fetch(`/api/admin/characters/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Personnages</h1>
        <Link href="/admin/characters/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          + Nouveau personnage
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Amical</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lieux</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actif</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.nameJp}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{c.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${c.isFriendable ? "text-green-600" : "text-gray-400"}`}>
                      {c.isFriendable ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.appearances?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${c.isActive ? "text-green-600" : "text-gray-400"}`}>
                      {c.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/characters/${c.id}`)}
                      className="text-violet-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(c.id, c.name)}
                      className="text-red-500 hover:underline text-xs">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {characters.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucun personnage</div>
          )}
        </div>
      )}
    </div>
  );
}
