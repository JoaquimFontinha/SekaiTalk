export type POIType = "station" | "konbini" | "izakaya" | "temple" | "market" | "landmark";

export type POI = {
  id: string;
  name: string;
  type: POIType;
  lat: number;
  lng: number;
};

export type CityData = {
  name: string;
  center: [number, number];
  zoom: number;
  pois: POI[];
  mapImage?: string; // chemin vers une carte illustrée (remplace Leaflet si défini)
  // bornes géo de l'image illustrée pour le mapping lat/lng → %
  mapBounds?: { latMax: number; latMin: number; lngMin: number; lngMax: number };
};

const cities: Record<string, CityData> = {
  tokyo: {
    name: "Tokyo",
    center: [35.6762, 139.6903],
    zoom: 14,
    mapImage: "/maps/tokyo.png",
    mapBounds: { latMax: 35.754, latMin: 35.600, lngMin: 139.679, lngMax: 139.830 },
    pois: [
      { id: "shinjuku-station", name: "Gare de Shinjuku",  type: "station",  lat: 35.6896, lng: 139.7006 },
      { id: "shibuya-station",  name: "Gare de Shibuya",   type: "station",  lat: 35.6580, lng: 139.7016 },
      { id: "tokyo-station",    name: "Tokyo Station",      type: "station",  lat: 35.6812, lng: 139.7671 },
      { id: "konbini-shinjuku", name: "Konbini Shinjuku",   type: "konbini",  lat: 35.6940, lng: 139.7036 },
      { id: "konbini-shibuya",  name: "Konbini Shibuya",    type: "konbini",  lat: 35.6596, lng: 139.7028 },
      { id: "golden-gai",       name: "Golden Gai",         type: "izakaya",  lat: 35.6933, lng: 139.7024 },
      { id: "omoide-yokocho",   name: "Omoide Yokochō",     type: "izakaya",  lat: 35.6905, lng: 139.6988 },
      { id: "sensoji",          name: "Senso-ji",            type: "temple",   lat: 35.7148, lng: 139.7967 },
      { id: "meiji-jingu",      name: "Meiji Jingū",         type: "temple",   lat: 35.6763, lng: 139.6993 },
      { id: "ameyoko",          name: "Marché Ameyoko",      type: "market",   lat: 35.7080, lng: 139.7742 },
      { id: "tsukiji",          name: "Marché Tsukiji",      type: "market",   lat: 35.6654, lng: 139.7707 },
      { id: "tokyo-tower",      name: "Tour de Tokyo",       type: "landmark", lat: 35.6586, lng: 139.7454 },
      { id: "skytree",          name: "Tokyo Skytree",       type: "landmark", lat: 35.7101, lng: 139.8107 },
    ],
  },

  osaka: {
    name: "Osaka",
    center: [34.6937, 135.5023],
    zoom: 14,
    pois: [
      { id: "namba-station",    name: "Gare de Namba",       type: "station",  lat: 34.6623, lng: 135.5019 },
      { id: "umeda-station",    name: "Gare d'Umeda",        type: "station",  lat: 34.7028, lng: 135.4958 },
      { id: "konbini-namba",    name: "Konbini Namba",        type: "konbini",  lat: 34.6670, lng: 135.5030 },
      { id: "dotonbori",        name: "Dōtonbori",            type: "izakaya",  lat: 34.6686, lng: 135.5016 },
      { id: "shinsekai",        name: "Shinsekai",            type: "izakaya",  lat: 34.6514, lng: 135.5063 },
      { id: "osaka-castle",     name: "Château d'Osaka",      type: "landmark", lat: 34.6873, lng: 135.5262 },
      { id: "kuromon-market",   name: "Marché Kuromon",       type: "market",   lat: 34.6648, lng: 135.5083 },
      { id: "sumiyoshi",        name: "Sumiyoshi Taisha",     type: "temple",   lat: 34.6132, lng: 135.4933 },
    ],
  },

  kyoto: {
    name: "Kyoto",
    center: [35.0116, 135.7681],
    zoom: 14,
    pois: [
      { id: "kyoto-station",    name: "Gare de Kyoto",        type: "station",  lat: 34.9859, lng: 135.7588 },
      { id: "fushimi-inari",    name: "Fushimi Inari",        type: "temple",   lat: 34.9671, lng: 135.7727 },
      { id: "kinkakuji",        name: "Kinkaku-ji",           type: "temple",   lat: 35.0394, lng: 135.7292 },
      { id: "ginkakuji",        name: "Ginkaku-ji",           type: "temple",   lat: 35.0270, lng: 135.7982 },
      { id: "nishiki-market",   name: "Marché Nishiki",       type: "market",   lat: 35.0054, lng: 135.7659 },
      { id: "gion-izakaya",     name: "Izakaya de Gion",      type: "izakaya",  lat: 35.0039, lng: 135.7764 },
      { id: "konbini-kyoto",    name: "Konbini",               type: "konbini",  lat: 35.0088, lng: 135.7595 },
      { id: "nijo-castle",      name: "Château Nijō",          type: "landmark", lat: 35.0142, lng: 135.7481 },
    ],
  },
};

export default cities;
