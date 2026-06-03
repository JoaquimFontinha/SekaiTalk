export type GuidageTheme = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  poiIds: string[];
};

/** Niveau JLPT par POI : 5=N5, 4=N4, 3=N3 */
export const POI_JLPT_LEVEL: Record<string, 5 | 4 | 3> = {
  // Transport
  "jr-shinjuku":              5,
  "haneda-airport":           4,
  "tokyo-station-shinkansen": 4,
  // Hébergement
  "nine-hours-shinjuku":      4,
  "grand-hyatt-tokyo":        3,
  // Vie quotidienne
  "7eleven-shinjuku":         5,
  "familymart-shibuya":       5,
  "lawson-harajuku":          5,
  "matsumoto-kiyoshi-akiba":  3,
  "tokyo-central-post":       3,
  // Manger & Boire
  "starbucks-shibuya":        5,
  "mcdonalds-shibuya":        5,
  "asahi-super-dry-hall":     4,
  // Shopping
  "loft-shibuya":             4,
  "shibuya-109":              4,
  "donquijote-shibuya":       4,
  "yodobashi-akiba":          3,
  "lumine-est-shinjuku":      4,
  // Culture
  "tokyo-skytree":            4,
  "tokyo-tower":              4,
  "meiji-jingu":              3,
  "sensoji":                  3,
  "tokyo-national-museum":    3,
  "tokyo-metro-theatre":      3,
  "big-echo-kabukicho":       4,
  "at-home-cafe-akihabara":   4,
  "keio-hospital":            3,
};

export const CITY_GUIDAGE: Record<string, GuidageTheme[]> = {
  tokyo: [
    {
      id: "theme-transport",
      title: "Premier pas à Tokyo",
      emoji: "✈️",
      description: "Arriver, se repérer et se déplacer dans la capitale",
      poiIds: ["jr-shinjuku", "haneda-airport", "tokyo-station-shinkansen"],
    },
    {
      id: "theme-hotel",
      title: "Se loger",
      emoji: "🏨",
      description: "Trouver et gérer son hébergement à Tokyo",
      poiIds: ["nine-hours-shinjuku", "grand-hyatt-tokyo"],
    },
    {
      id: "theme-quotidien",
      title: "La vie quotidienne",
      emoji: "🏪",
      description: "Konbinis, pharmacie et services essentiels",
      poiIds: ["7eleven-shinjuku", "familymart-shibuya", "lawson-harajuku", "matsumoto-kiyoshi-akiba", "tokyo-central-post"],
    },
    {
      id: "theme-food",
      title: "Manger & Boire",
      emoji: "🍜",
      description: "Commander et profiter de la gastronomie tokyoïte",
      poiIds: ["starbucks-shibuya", "mcdonalds-shibuya", "asahi-super-dry-hall"],
    },
    {
      id: "theme-shopping",
      title: "Shopping",
      emoji: "🛍️",
      description: "Naviguer dans les boutiques et centres commerciaux",
      poiIds: ["loft-shibuya", "shibuya-109", "donquijote-shibuya", "yodobashi-akiba", "lumine-est-shinjuku"],
    },
    {
      id: "theme-culture",
      title: "Découvrir Tokyo",
      emoji: "⛩️",
      description: "Tourisme, culture, santé et divertissements",
      poiIds: [
        "tokyo-skytree", "tokyo-tower", "big-echo-kabukicho", "at-home-cafe-akihabara",
        "meiji-jingu", "sensoji", "tokyo-national-museum", "tokyo-metro-theatre", "keio-hospital",
      ],
    },
  ],
};
