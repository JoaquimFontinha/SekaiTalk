"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  pseudo?: string;
  isAdmin: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleToggleAdmin = async (user: User) => {
    if (toggling) return;
    setToggling(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    });
    if (res.ok) {
      setUsers((us) => us.map((u) => u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u));
    } else {
      setError("Erreur lors de la mise à jour");
    }
    setToggling(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pseudo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Inscrit le</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{user.pseudo || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={toggling === user.id}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors disabled:opacity-50 ${
                        user.isAdmin ? "bg-violet-600" : "bg-gray-300"
                      }`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        user.isAdmin ? "translate-x-5" : "translate-x-1"
                      }`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucun utilisateur</div>
          )}
        </div>
      )}
    </div>
  );
}
