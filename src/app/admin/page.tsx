"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  cities: number;
  pois: number;
  lessons: number;
  quests: number;
  characters: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/cities").then((r) => r.json()),
      fetch("/api/admin/pois").then((r) => r.json()),
      fetch("/api/admin/lessons").then((r) => r.json()),
      fetch("/api/admin/quests").then((r) => r.json()),
      fetch("/api/admin/characters").then((r) => r.json()),
    ])
      .then(([cities, pois, lessons, quests, characters]) => {
        setStats({
          cities: Array.isArray(cities) ? cities.length : 0,
          pois: Array.isArray(pois) ? pois.length : 0,
          lessons: Array.isArray(lessons) ? lessons.length : 0,
          quests: Array.isArray(quests) ? quests.length : 0,
          characters: Array.isArray(characters) ? characters.length : 0,
        });
      })
      .catch(() => setError("Erreur lors du chargement des statistiques"));
  }, []);

  const cards = [
    { label: "Villes", value: stats?.cities, href: "/admin/cities", icon: "🏙", color: "bg-blue-50 border-blue-200" },
    { label: "POIs", value: stats?.pois, href: "/admin/pois", icon: "📍", color: "bg-green-50 border-green-200" },
    { label: "Leçons", value: stats?.lessons, href: "/admin/lessons", icon: "🎓", color: "bg-yellow-50 border-yellow-200" },
    { label: "Quêtes", value: stats?.quests, href: "/admin/quests", icon: "📜", color: "bg-purple-50 border-purple-200" },
    { label: "Personnages", value: stats?.characters, href: "/admin/characters", icon: "🧑", color: "bg-pink-50 border-pink-200" },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bienvenue dans le panneau d&apos;administration SekaiTalk.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`border rounded-xl p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow ${card.color}`}
          >
            <span className="text-3xl">{card.icon}</span>
            <span className="text-3xl font-bold text-gray-800">
              {stats ? card.value : "—"}
            </span>
            <span className="text-sm text-gray-600">{card.label}</span>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-gray-700 mb-4">Accès rapide</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/admin/cities/new", label: "Nouvelle ville" },
          { href: "/admin/pois/new", label: "Nouveau POI" },
          { href: "/admin/lessons/new", label: "Nouvelle leçon" },
          { href: "/admin/quests/new", label: "Nouvelle quête" },
          { href: "/admin/characters/new", label: "Nouveau personnage" },
          { href: "/admin/export", label: "Export / Import" },
          { href: "/admin/users", label: "Gérer les admins" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            {link.label} →
          </Link>
        ))}
      </div>
    </div>
  );
}
