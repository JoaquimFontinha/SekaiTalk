"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type EventRow = {
  id: string;
  type: "SEASONAL" | "DAILY_TEMPLATE" | "DAILY_INSTANCE";
  title: string;
  poiId: string;
  emoji: string;
  color: string;
  xpReward: number;
  isActive: boolean;
  startMonth: number | null; startDay: number | null;
  endMonth: number | null;   endDay: number | null;
  startAt: string | null;
  endAt: string | null;
  questId: string | null;
  lessonId: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  SEASONAL:       { label: "Saisonnier",   color: "#f59e0b" },
  DAILY_TEMPLATE: { label: "Modèle daily", color: "#8b5cf6" },
  DAILY_INSTANCE: { label: "Daily actif",  color: "#10b981" },
};

const MONTHS = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function formatDateRange(ev: EventRow): string {
  if (ev.type === "SEASONAL" && ev.startMonth && ev.endMonth) {
    return `${ev.startDay} ${MONTHS[ev.startMonth]} → ${ev.endDay} ${MONTHS[ev.endMonth]}`;
  }
  if (ev.endAt) {
    const end = new Date(ev.endAt);
    const now  = new Date();
    if (end < now) return "Expiré";
    const h = Math.floor((end.getTime() - now.getTime()) / 3_600_000);
    return `Expire dans ${h}h`;
  }
  return "—";
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "SEASONAL" | "DAILY_TEMPLATE" | "DAILY_INSTANCE">("ALL");

  useEffect(() => {
    fetch("/api/admin/events")
      .then(r => r.ok ? r.json() : [])
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  async function toggleActive(ev: EventRow) {
    await fetch(`/api/admin/events/${ev.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ev.isActive }),
    });
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, isActive: !e.isActive } : e));
  }

  async function deleteEvent(id: string) {
    if (!confirm("Supprimer cet évènement ?")) return;
    setDeleting(id);
    await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
  }

  const filtered = filter === "ALL" ? events : events.filter(e => e.type === filter);
  const grouped: Record<string, EventRow[]> = {};
  for (const ev of filtered) {
    if (!grouped[ev.type]) grouped[ev.type] = [];
    grouped[ev.type].push(ev);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Évènements</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les évènements saisonniers, les modèles daily et les instances actives.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          + Nouvel évènement
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["ALL", "SEASONAL", "DAILY_TEMPLATE", "DAILY_INSTANCE"] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "ALL" ? "Tous" : TYPE_LABELS[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">Aucun évènement</div>
      ) : (
        Object.entries(grouped).map(([type, evs]) => (
          <div key={type}>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: TYPE_LABELS[type]?.color }} />
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                {TYPE_LABELS[type]?.label} ({evs.length})
              </h2>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Évènement</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">POI</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Dates</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Contenu</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {evs.map(ev => (
                    <tr key={ev.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{ev.emoji}</span>
                          <div>
                            <p className="font-semibold text-gray-800">{ev.title}</p>
                            <p className="text-[11px] text-gray-400">{ev.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{ev.poiId}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDateRange(ev)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {ev.questId  && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">Quête</span>}
                          {ev.lessonId && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Leçon</span>}
                          {!ev.questId && !ev.lessonId && <span className="text-[11px] text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(ev)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ev.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {ev.isActive ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">+{ev.xpReward} XP</span>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            disabled={deleting === ev.id}
                            className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            {deleting === ev.id ? "…" : "Supprimer"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
