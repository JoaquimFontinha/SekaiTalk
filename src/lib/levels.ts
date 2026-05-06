// XP thresholds per level (index = level - 1)
export const LEVEL_THRESHOLDS = [0, 150, 400, 800, 1500, 2500] as const;

// Which city slug is unlocked at each level
export const LEVEL_UNLOCKS: Record<number, string> = {
  2: "Osaka",
  3: "Kyoto",
};

export function getLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelInfo(xp: number) {
  const level     = getLevel(xp);
  const xpStart   = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const xpEnd     = LEVEL_THRESHOLDS[level] as number | undefined;
  const xpInLevel = xp - xpStart;
  const xpNeeded  = xpEnd !== undefined ? xpEnd - xpStart : null;
  const percent   = xpNeeded ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
  return { level, xpInLevel, xpNeeded, percent };
}
