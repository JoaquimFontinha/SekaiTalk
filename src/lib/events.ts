// Types partagés pour le système d'events

export type ActiveEvent = {
  id: string;
  type: "SEASONAL" | "DAILY_INSTANCE";
  title: string;
  description: string;
  poiId: string;
  poiName: string;
  emoji: string;
  color: string;
  xpReward: number;
  questId: string | null;
  lessonId: string | null;
  imageUrl: string | null;
  expiresAt: string; // ISO — fin de l'event (calculé côté serveur)
};

export type EventsResponse = {
  seasonal: ActiveEvent[];
  daily: ActiveEvent[];
};

/** Retourne la date d'expiration formatée de façon lisible */
export function formatExpiry(expiresAt: string, type: "SEASONAL" | "DAILY_INSTANCE"): string {
  const end = new Date(expiresAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return "Terminé";

  if (type === "DAILY_INSTANCE") {
    const h = Math.floor(diffMs / 3_600_000);
    const m = Math.floor((diffMs % 3_600_000) / 60_000);
    if (h > 0) return `encore ${h}h ${m}min`;
    return `encore ${m}min`;
  }

  // Seasonal — affiche la date de fin
  const months = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
  return `jusqu'au ${end.getDate()} ${months[end.getMonth()]}`;
}
