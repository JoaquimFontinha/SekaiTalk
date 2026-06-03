"use client";

import { useState, useEffect } from "react";
import type { GoalResult } from "@/lib/daily-goals";

export function useDailyGoals() {
  const [goals, setGoals]     = useState<GoalResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily-goals")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.goals) setGoals(data.goals); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const doneCount = goals.filter(g => g.done).length;
  return { goals, loading, doneCount };
}
