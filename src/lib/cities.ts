export type POIType = "station" | "konbini" | "izakaya" | "temple" | "market" | "landmark";

export type POI = {
  id: string;
  name: string;
  type: POIType;
  lat: number;
  lng: number;
  image?: string;
  description?: string;
};

export type CityData = {
  name: string;
  center: [number, number];
  zoom: number;
  pois: POI[];
  levelRequired: number;
  use3DMap?: boolean;
  mapImage?: string;
  mapBounds?: { latMax: number; latMin: number; lngMin: number; lngMax: number };
};

const cities: Record<string, CityData> = {
  tokyo: {
    name: "Tokyo",
    center: [35.6762, 139.6903],
    zoom: 14,
    levelRequired: 1,
    use3DMap: true,
    pois: [
      {
        id: "shinjuku-station", name: "Gare de Shinjuku", type: "station",
        lat: 35.6896, lng: 139.7006,
        description: "La gare la plus fréquentée au monde avec plus de 3 millions de voyageurs par jour. Un labyrinthe de 200 sorties où les locaux mémorisent la leur dès l'enfance. Les panneaux en japonais changent de couleur selon les lignes — rouge, vert, jaune — apprenez à les lire avant d'entrer.",
      },
      {
        id: "shibuya-station", name: "Gare de Shibuya", type: "station",
        lat: 35.6580, lng: 139.7016,
        description: "La célèbre traversée Scramble Crossing se trouve à quelques pas — plus de 2 500 personnes traversent simultanément à chaque feu vert. Hachikō, le chien fidèle qui attendait son maître décédé chaque jour pendant 9 ans, a sa statue juste à la sortie ouest.",
      },
      {
        id: "tokyo-station", name: "Tokyo Station", type: "station",
        lat: 35.6812, lng: 139.7671,
        description: "Inaugurée en 1914, sa façade en brique rouge restaurée est un symbole de l'ère Meiji. Dans ses sous-sols se cachent les meilleures ramen alley de la ville et une incroyable galerie marchande. C'est ici que partent les Shinkansen pour tout le Japon.",
      },
      {
        id: "konbini-shinjuku", name: "Konbini Shinjuku", type: "konbini",
        lat: 35.6940, lng: 139.7036,
        description: "Les konbini japonais redéfinissent le concept de commodité : onigiri fraîchement préparés, œufs à la coque marinés dans la soja, café torréfié à la minute, desserts sophistiqués. Ouverts 24h/24, ils sont le QG des noctambules de Kabukichō.",
      },
      {
        id: "konbini-shibuya", name: "Konbini Shibuya", type: "konbini",
        lat: 35.6596, lng: 139.7028,
        description: "Idéalement placé pour observer le flux humain du Scramble. Les konbini de Shibuya voient défiler une clientèle internationale unique — touristes désorientés, lycéens branchés, sararimen pressés. Le melon pan chaud du matin est un rituel local.",
      },
      {
        id: "golden-gai", name: "Golden Gai", type: "izakaya",
        lat: 35.6933, lng: 139.7024,
        description: "200 minuscules bars serrés dans 6 ruelles obscures, chacun pouvant accueillir 5 à 8 personnes. Né dans l'après-guerre, Golden Gai a failli être rasé dans les années 80 — ses propriétaires l'ont défendu physiquement. C'est aujourd'hui l'un des endroits les plus authentiques de Tokyo.",
      },
      {
        id: "omoide-yokocho", name: "Omoide Yokochō", type: "izakaya",
        lat: 35.6905, lng: 139.6988,
        description: "\"L'allée des souvenirs\" — yakitoris qui fument, sararimen en cravate desserrée, lanternes rouges dans la nuit. Ce passage étroit à deux pas de la gare de Shinjuku a survécu à la modernisation en refusant de changer. Venez après 20h pour l'atmosphère.",
      },
      {
        id: "sensoji", name: "Senso-ji", type: "temple",
        lat: 35.7148, lng: 139.7967,
        description: "Le plus ancien temple de Tokyo, fondé en 645 après J.-C. selon la légende. La porte Kaminarimon avec sa lanterne rouge géante de 670 kg est l'image la plus photographiée du Japon. Arrivez tôt le matin pour voir le temple avant la foule et sentir l'encens du sanctuaire.",
      },
      {
        id: "meiji-jingu", name: "Meiji Jingū", type: "temple",
        lat: 35.6763, lng: 139.6993,
        description: "Un sanctuaire shinto entouré d'une forêt artificielle de 70 000 arbres — 365 espèces venues de tout le Japon, plantées en 1920 par des bénévoles. En plein cœur de Tokyo, le silence y est presque total. Dédié à l'Empereur Meiji, il attire 3 millions de visiteurs le 1er janvier.",
      },
      {
        id: "ameyoko", name: "Marché Ameyoko", type: "market",
        lat: 35.7080, lng: 139.7742,
        description: "Né du marché noir d'après-guerre sous les arcades du métro d'Ueno, Ameyoko est aujourd'hui le marché populaire de Tokyo. Poissons séchés, vêtements de marque à prix cassés, cosmétiques, épices rares — tout s'y négocie. L'ambiance est à son comble la veille du Nouvel An.",
      },
      {
        id: "tsukiji", name: "Marché Tsukiji", type: "market",
        lat: 35.6654, lng: 139.7707,
        description: "Si le marché intérieur aux poissons a déménagé à Toyosu, le marché extérieur reste l'un des meilleurs endroits de Tokyo pour manger des sushi à 6h du matin. Couteaux artisanaux, œufs de tamagoyaki, thés rares — les boutiques transmettent leur savoir-faire depuis des générations.",
      },
      {
        id: "tokyo-tower", name: "Tour de Tokyo", type: "landmark",
        lat: 35.6586, lng: 139.7454,
        image: "/images/pois/tokyo-tower.jpg",
        description: "Inaugurée en 1958, la Tour de Tokyo dépasse de 13 mètres la Tour Eiffel dont elle s'inspire. Peinte en orange et blanc pour la signalisation aérienne, elle reste le symbole romantique de Tokyo. Par temps clair, on aperçoit le Mont Fuji depuis ses observatoires à 150 et 250 mètres.",
      },
      {
        id: "skytree", name: "Tokyo Skytree", type: "landmark",
        lat: 35.7101, lng: 139.8107,
        description: "La plus haute structure du Japon (634 m). Le chiffre 634 se lit \"Musashi\" en japonais — le nom de l'ancienne province qui couvrait Tokyo. Les deux plateformes d'observation à 350 m et 450 m offrent une vue à 360° sur l'agglomération de 37 millions d'habitants.",
      },
    ],
  },

  osaka: {
    name: "Osaka",
    center: [34.6937, 135.5023],
    zoom: 14,
    levelRequired: 2,
    pois: [
      { id: "namba-station",  name: "Gare de Namba",    type: "station",  lat: 34.6623, lng: 135.5019 },
      { id: "umeda-station",  name: "Gare d'Umeda",     type: "station",  lat: 34.7028, lng: 135.4958 },
      { id: "konbini-namba",  name: "Konbini Namba",    type: "konbini",  lat: 34.6670, lng: 135.5030 },
      { id: "dotonbori",      name: "Dōtonbori",         type: "izakaya",  lat: 34.6686, lng: 135.5016 },
      { id: "shinsekai",      name: "Shinsekai",         type: "izakaya",  lat: 34.6514, lng: 135.5063 },
      { id: "osaka-castle",   name: "Château d'Osaka",  type: "landmark", lat: 34.6873, lng: 135.5262 },
      { id: "kuromon-market", name: "Marché Kuromon",   type: "market",   lat: 34.6648, lng: 135.5083 },
      { id: "sumiyoshi",      name: "Sumiyoshi Taisha", type: "temple",   lat: 34.6132, lng: 135.4933 },
    ],
  },

  kyoto: {
    name: "Kyoto",
    center: [35.0116, 135.7681],
    zoom: 14,
    levelRequired: 3,
    pois: [
      { id: "kyoto-station",  name: "Gare de Kyoto",   type: "station",  lat: 34.9859, lng: 135.7588 },
      { id: "fushimi-inari",  name: "Fushimi Inari",   type: "temple",   lat: 34.9671, lng: 135.7727 },
      { id: "kinkakuji",      name: "Kinkaku-ji",       type: "temple",   lat: 35.0394, lng: 135.7292 },
      { id: "ginkakuji",      name: "Ginkaku-ji",       type: "temple",   lat: 35.0270, lng: 135.7982 },
      { id: "nishiki-market", name: "Marché Nishiki",  type: "market",   lat: 35.0054, lng: 135.7659 },
      { id: "gion-izakaya",   name: "Izakaya de Gion", type: "izakaya",  lat: 35.0039, lng: 135.7764 },
      { id: "konbini-kyoto",  name: "Konbini",          type: "konbini",  lat: 35.0088, lng: 135.7595 },
      { id: "nijo-castle",    name: "Château Nijō",     type: "landmark", lat: 35.0142, lng: 135.7481 },
    ],
  },
};

export default cities;
