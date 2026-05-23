"use client";

import { useEffect, useState } from "react";
import { Pencil, Check, X } from "lucide-react";

type GoalData = {
  dailyGoalMinutes: number;
  weeklyMinutes: number;
  todayMinutes: number;
  activeDays: boolean[];
};

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const PRESETS = [5, 10, 15, 20, 25, 30];

const R = 40;
const C = 2 * Math.PI * R;

export default function MonObjectif() {
  const [data, setData] = useState<GoalData | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/user/goal")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setData(d); setDraft(d.dailyGoalMinutes); } })
      .catch(() => {});
  }, []);

  const goalMin = data?.dailyGoalMinutes ?? 10;
  const weeklyGoal = goalMin * 7;
  const weeklyMin = data?.weeklyMinutes ?? 0;
  const todayMin = data?.todayMinutes ?? 0;
  const activeDays = data?.activeDays ?? Array(7).fill(false);
  const percent = Math.min(100, weeklyGoal > 0 ? (weeklyMin / weeklyGoal) * 100 : 0);
  const done = percent >= 100;

  const save = async () => {
    const clamped = Math.min(30, Math.max(5, draft));
    setSaving(true);
    try {
      const res = await fetch("/api/user/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoalMinutes: clamped }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(d => d ? { ...d, dailyGoalMinutes: updated.dailyGoalMinutes } : d);
        setDraft(clamped);
      }
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  return (
    <div className="px-7 pt-7 pb-7 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mon Objectif</span>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-violet-400 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={save} disabled={saving} className="text-green-500 hover:text-green-600 disabled:opacity-50">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => { setEditing(false); setDraft(goalMin); }} className="text-gray-400 hover:text-red-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        /* ── Edit mode ── */
        <div className="flex flex-col items-center gap-4 py-1">
          <span className="text-xs text-gray-500">Minutes par jour</span>
          <div className="flex items-center gap-5">
            <button
              onClick={() => setDraft(d => Math.max(5, d - 5))}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-violet-100 text-xl font-bold text-gray-600 hover:text-violet-600 flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="text-4xl font-black text-violet-600 w-14 text-center tabular-nums">{draft}</span>
            <button
              onClick={() => setDraft(d => Math.min(30, d + 5))}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-violet-100 text-xl font-bold text-gray-600 hover:text-violet-600 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
          <div className="flex gap-1.5">
            {PRESETS.map(v => (
              <button
                key={v}
                onClick={() => setDraft(v)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  draft === v
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">min 5 · max 30 minutes</span>
        </div>
      ) : (
        /* ── Display mode ── */
        <div className="flex flex-col items-center gap-4">
          {/* Progress ring */}
          <div className="relative" style={{ width: 96, height: 96 }}>
            <svg width={96} height={96} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={48} cy={48} r={R} fill="none" stroke="#f3f4f6" strokeWidth={7} />
              <circle
                cx={48} cy={48} r={R}
                fill="none"
                stroke={done ? "#10b981" : "#7c3aed"}
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - percent / 100)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
              <span className="text-xl font-black text-gray-800 tabular-nums leading-none">{weeklyMin}</span>
              <span className="text-[10px] text-gray-400 leading-none">/ {weeklyGoal} min</span>
            </div>
          </div>

          <span className="text-xs text-gray-500 -mt-1">Cette semaine · {goalMin} min/jour</span>

          {/* Day dots */}
          <div className="flex gap-2">
            {DAY_LABELS.map((d, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  activeDays[i] ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                {activeDays[i] ? "✓" : d}
              </div>
            ))}
          </div>

          {/* Today's progress */}
          <div className="w-full rounded-xl bg-violet-50 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-600 font-medium">Aujourd'hui</span>
            <span className="text-xs font-black text-violet-600 tabular-nums">
              {todayMin} / {goalMin} min
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
