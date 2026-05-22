"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lesson {
  id: string;
  poiId: string;
  title: string;
  stepCount: number;
  poiName: string;
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = () => {
    setLoading(true);
    fetch("/api/admin/lessons")
      .then((r) => r.json())
      .then((data) => { setLessons(data); setLoading(false); })
      .catch(() => { setError("Erreur de chargement"); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer la leçon "${title}" ?`)) return;
    const res = await fetch(`/api/admin/lessons/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Erreur lors de la suppression");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Leçons</h1>
        <Link href="/admin/lessons/new"
          className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700">
          + Nouvelle leçon
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">POI</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Titre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Étapes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-gray-500">{lesson.poiId}</div>
                    <div className="text-gray-700 text-xs mt-0.5">{lesson.poiName !== lesson.poiId ? lesson.poiName : ""}</div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{lesson.title}</td>
                  <td className="px-4 py-3">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">{lesson.stepCount} étapes</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => router.push(`/admin/lessons/${lesson.id}`)}
                      className="text-violet-600 hover:underline text-xs">Modifier</button>
                    <button onClick={() => handleDelete(lesson.id, lesson.title)}
                      className="text-red-500 hover:underline text-xs">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {lessons.length === 0 && (
            <div className="text-center text-gray-400 py-8">Aucune leçon</div>
          )}
        </div>
      )}
    </div>
  );
}
