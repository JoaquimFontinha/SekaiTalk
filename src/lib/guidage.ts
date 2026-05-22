export type GuidageTheme = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  poiIds: string[];
};

export const CITY_GUIDAGE: Record<string, GuidageTheme[]> = {
  tokyo: [
    {
      id: "theme-transport",
      title: "Premier pas à Tokyo",
      emoji: "✈️",
      description: "Arriver, se repérer et se déplacer dans la capitale",
      poiIds: ["haneda-airport", "tokyo-station-shinkansen", "jr-shinjuku"],
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
        "tokyo-skytree", "tokyo-tower", "meiji-jingu", "sensoji",
        "tokyo-national-museum", "tokyo-metro-theatre",
        "big-echo-kabukicho", "at-home-cafe-akihabara", "keio-hospital",
      ],
    },
  ],
};
