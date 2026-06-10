export type POIType = "transport" | "konbini" | "izakaya" | "site" | "market" | "loisir" | "shop" | "restaurant" | "cafe" | "hotel" | "pharmacie" | "medecin" | "poste" | "school";

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
      // ── École SekaiTalk ────────────────────────────────────────────────────
      {
        id: "ecole-sekaitalk-tokyo", name: "École SekaiTalk", type: "school",
        lat: 35.6598, lng: 139.7440,
        description: "L'école de langue de SekaiTalk à Tokyo. Cours de japonais, grammaire, flashcards et examens.",
      },
      // ── TEST (konbini avec quête) ───────────────────────────────────────────
      {
        id: "konbini-shinjuku", name: "TEST — Konbini Shinjuku", type: "konbini",
        lat: 35.6940, lng: 139.7036,
        description: "Les konbini japonais redéfinissent le concept de commodité : onigiri fraîchement préparés, œufs à la coque marinés dans la soja, café torréfié à la minute, desserts sophistiqués. Ouverts 24h/24, ils sont le QG des noctambules de Kabukichō.",
      },
      // ── Transport ──────────────────────────────────────────────────────────
      {
        id: "jr-shinjuku", name: "Gare JR Shinjuku", type: "transport",
        lat: 35.6896, lng: 139.7006,
        description: "La gare la plus fréquentée au monde avec plus de 3 millions de voyageurs par jour. Un labyrinthe de 200 sorties où les locaux mémorisent la leur dès l'enfance. Les panneaux changent de couleur selon les lignes JR — rouge Chūō, vert Yamanote, jaune Sōbu.",
      },
      {
        id: "tokyo-station-shinkansen", name: "Gare de Tokyo — Shinkansen", type: "transport",
        lat: 35.6812, lng: 139.7671,
        description: "Inaugurée en 1914, sa façade en brique rouge est un symbole de l'ère Meiji. C'est d'ici que partent les Shinkansen pour tout le Japon — Osaka en 2h30, Kyoto en 2h15. Les quais du Tokaido Shinkansen sont parmi les plus animés du monde.",
      },

      // ── Konbinis ──────────────────────────────────────────────────────────
      {
        id: "7eleven-shinjuku", name: "7-Eleven Kabukichō", type: "konbini",
        lat: 35.6940, lng: 139.7050,
        description: "7-Eleven (セブン-イレブン) est la chaîne de konbini la plus présente au Japon avec plus de 21 000 boutiques. Leur café fraîchement torréfié, leurs sandwichs et leur ATM international en font une étape incontournable.",
      },
      {
        id: "familymart-shibuya", name: "FamilyMart Shibuya", type: "konbini",
        lat: 35.6601, lng: 139.6981,
        description: "FamilyMart (ファミリーマート) se reconnaît à son jingle d'entrée emblématique. Ses onigiri chauds, ses desserts saisonniers et sa gamme de plats préparés en font l'une des trois grandes chaînes de konbini japonaises.",
      },
      {
        id: "lawson-harajuku", name: "Lawson Harajuku", type: "konbini",
        lat: 35.6703, lng: 139.7025,
        description: "Lawson (ローソン) se distingue par ses Uchi Café desserts haut de gamme et ses produits Natural Lawson. Le konbini de proximité idéal après une session shopping à Takeshita-dori ou Omotesando.",
      },
      // ── Shops ─────────────────────────────────────────────────────────────
      {
        id: "donquijote-shibuya", name: "Mega Don Quijote Shibuya", type: "shop",
        lat: 35.6604, lng: 139.6963,
        description: "Don Quijote (ドン・キホーテ), surnommé \"Donki\", est le temple du shopping nocturne japonais. Sur plusieurs étages labyrinthiques, on y trouve tout : cosmétiques, snacks, électronique, costumes... Ouvert jusqu'à 5h du matin.",
      },
      {
        id: "loft-shibuya", name: "Loft Shibuya", type: "shop",
        lat: 35.6604, lng: 139.6972,
        description: "Loft est la référence japonaise pour la papeterie créative, les gadgets de design et les articles de maison originaux. L'enseigne Shibuya s'étend sur plusieurs niveaux dans le quartier d'Udagawacho.",
      },
      {
        id: "shibuya-109", name: "SHIBUYA109", type: "shop",
        lat: 35.6594, lng: 139.6988,
        description: "Le cylindre blanc de Shibuya est depuis 1979 le sanctuaire de la mode gyaru et des tendances jeunes japonaises. Ses 100 boutiques renouvellent leurs collections chaque saison. Le nom vient de \"10\" et \"9\" qui se lisent \"TO\" et \"KYU\" en japonais.",
      },
      {
        id: "yodobashi-akiba", name: "Yodobashi-Akiba", type: "shop",
        lat: 35.7000, lng: 139.7727,
        description: "Yodobashi-Akiba est le plus grand magasin d'électronique du monde sur un seul site, avec 9 étages dédiés à l'informatique, la photo, l'audio et les jeux vidéo. Au cœur d'Akihabara, le paradis de l'électronique à Tokyo.",
      },
      {
        id: "lumine-est-shinjuku", name: "Lumine Est Shinjuku", type: "shop",
        lat: 35.6897, lng: 139.7009,
        description: "Lumine Est est le centre commercial connecté directement à la sortie est de la gare de Shinjuku. Ses 8 étages proposent mode, cosmétiques et restauration, avec une clientèle majoritairement féminine et jeune.",
      },
      // ── Restaurants ───────────────────────────────────────────────────────
      {
        id: "mcdonalds-shibuya", name: "McDonald's Shibuya", type: "restaurant",
        lat: 35.6598, lng: 139.6993,
        description: "Le McDonald's japonais (マクドナルド) n'est pas celui de chez vous. Ici on trouve le Teriyaki Burger, le Tsukimi Burger saisonnier et des portions différentes. Un point de repère universel pour se réorienter dans le quartier.",
      },
      // ── Cafés ─────────────────────────────────────────────────────────────
      {
        id: "starbucks-shibuya", name: "Starbucks Shibuya Scramble", type: "cafe",
        lat: 35.6595, lng: 139.7003,
        description: "Le Starbucks le plus instagrammé de Tokyo, avec vue directe sur le Scramble Crossing depuis son balcon du 2e étage. Situé dans le bâtiment Q-Front (Tsutaya), il accueille des centaines de clients par heure aux heures de pointe.",
      },
      // ── Hôtels ────────────────────────────────────────────────────────────
      {
        id: "nine-hours-shinjuku", name: "Nine Hours Shinjuku-North", type: "hotel",
        lat: 35.6963, lng: 139.7044,
        description: "Nine Hours est la chaîne de capsule hôtels design par excellence au Japon. Chaque capsule est une œuvre minimaliste avec literie premium, éclairage programmable et insonorisation soignée. L'expérience quintessentielle du logement urbain japonais.",
      },
      {
        id: "grand-hyatt-tokyo", name: "Grand Hyatt Tokyo", type: "hotel",
        lat: 35.6641, lng: 139.7307,
        description: "Le Grand Hyatt Tokyo trône au cœur de Roppongi Hills, l'un des quartiers les plus chics de la capitale. Ses 387 chambres et suites, ses 8 restaurants et son spa en font la référence du luxe hôtelier tokyoïte.",
      },
      // ── Pharmacie ─────────────────────────────────────────────────────────
      {
        id: "matsumoto-kiyoshi-akiba", name: "Matsumoto Kiyoshi Akihabara", type: "pharmacie",
        lat: 35.6987, lng: 139.7712,
        description: "Matsumoto Kiyoshi (マツモトキヨシ) est la pharmacie-droguerie la plus connue du Japon, reconnaissable à son logo jaune et noir. En plus des médicaments OTC, on y trouve cosmétiques, soins et vitamines à des prix imbattables.",
      },
      // ── Médecin ───────────────────────────────────────────────────────────
      {
        id: "keio-hospital", name: "Hôpital Keio University", type: "medecin",
        lat: 35.6863, lng: 139.7199,
        description: "L'Hôpital Universitaire Keio (慶應義塾大学病院) à Shinanomachi est l'un des plus réputés du Japon. Il dispose d'un service d'interprétation médicale pour les patients étrangers et traite chaque année plus de 400 000 consultations externes.",
      },
      // ── Poste ─────────────────────────────────────────────────────────────
      {
        id: "tokyo-central-post", name: "Bureau de Poste Central de Tokyo", type: "poste",
        lat: 35.6804, lng: 139.7678,
        description: "Le Bureau de Poste Central de Tokyo (東京中央郵便局), juste en face de la sortie ouest de Tokyo Station, est ouvert 24h/24 pour l'envoi de colis. Japan Post propose aussi des services bancaires et des boîtes de rangement temporaire.",
      },
      // ── Sites ─────────────────────────────────────────────────────────────
      {
        id: "tokyo-skytree", name: "Tokyo Skytree", type: "site",
        lat: 35.7101, lng: 139.8107,
        description: "La plus haute structure du Japon (634 m). Le chiffre 634 se lit \"Musashi\" en japonais — le nom de l'ancienne province. Les deux plateformes d'observation à 350 m et 450 m offrent une vue à 360° sur l'agglomération de 37 millions d'habitants.",
      },
      {
        id: "tokyo-tower", name: "Tour de Tokyo", type: "site",
        lat: 35.6586, lng: 139.7454,
        image: "/images/pois/tokyo-tower.jpg",
        description: "Inaugurée en 1958, la Tour de Tokyo dépasse de 13 mètres la Tour Eiffel dont elle s'inspire. Peinte en orange et blanc pour la signalisation aérienne, elle reste le symbole romantique de Tokyo. Par temps clair, on aperçoit le Mont Fuji depuis ses observatoires.",
      },
      {
        id: "meiji-jingu", name: "Meiji Jingū", type: "site",
        lat: 35.6763, lng: 139.6993,
        description: "Un sanctuaire shinto entouré d'une forêt artificielle de 70 000 arbres — 365 espèces venues de tout le Japon, plantées en 1920 par des bénévoles. En plein cœur de Tokyo, le silence y est presque total. Dédié à l'Empereur Meiji.",
      },
      {
        id: "sensoji", name: "Sensō-ji", type: "site",
        lat: 35.7148, lng: 139.7967,
        description: "Le plus ancien temple de Tokyo, fondé en 645 selon la légende. La porte Kaminarimon avec sa lanterne rouge géante de 670 kg est l'image la plus photographiée du Japon. Arrivez tôt le matin pour voir le temple avant la foule et sentir l'encens du sanctuaire.",
      },
      {
        id: "tokyo-national-museum", name: "Tokyo National Museum", type: "site",
        lat: 35.7188, lng: 139.7764,
        description: "Le plus grand musée du Japon, fondé en 1872 dans le parc d'Ueno. Ses 110 000 œuvres couvrent l'art japonais, asiatique et archéologique sur plusieurs bâtiments. Le Honkan (bâtiment principal) est un chef-d'œuvre de l'architecture Meiji.",
      },
      {
        id: "asahi-super-dry-hall", name: "Asahi Super Dry Hall", type: "izakaya",
        lat: 35.7102, lng: 139.8021,
        description: "L'iconique bâtiment en or de la brasserie Asahi, connu pour sa \"flamme dorée\" (ou la \"poo dorée\" selon les habitants d'Asakusa). Le Super Dry Hall en dessous propose la bière Asahi directement à la source avec vue sur la Sumida et la Skytree.",
      },
      {
        id: "tokyo-metro-theatre", name: "Tokyo Metropolitan Theatre", type: "site",
        lat: 35.7296, lng: 139.7107,
        description: "La Tokyo Gei-Jutsu Gekijō (東京芸術劇場) à Ikebukuro est la plus grande salle de spectacle de la capitale. Avec ses 2 000 places, son grand orgue de 8 000 tuyaux et son architecture des années 90, elle accueille opéras, concerts symphoniques et pièces de théâtre.",
      },
      // ── Loisirs ───────────────────────────────────────────────────────────
      {
        id: "big-echo-kabukicho", name: "Big Echo Kabukichō", type: "loisir",
        lat: 35.6940, lng: 139.7027,
        description: "Big Echo (ビッグエコー) est l'une des plus grandes chaînes de karaoke au Japon. Dans le quartier de Kabukichō, le bâtiment reste ouvert toute la nuit. Les salles privatives accueillent de 2 à 20 personnes avec catalogue de milliers de chansons japonaises et internationales.",
      },
      {
        id: "at-home-cafe-akihabara", name: "@home café Akihabara", type: "loisir",
        lat: 35.6991, lng: 139.7741,
        description: "@home café (@ほぉ～むカフェ) est la chaîne de maid café la plus connue d'Akihabara, installée au 5e et 6e étage du Don Quijote Akihabara. Les serveuses en tablier de soubrette accueillent les clients avec \"Okaerinasaimase, goshujin-sama!\" (Bienvenue à la maison, maître!).",
      },
    ],
  },

  osaka: {
    name: "Osaka",
    center: [34.6937, 135.5023],
    zoom: 14,
    levelRequired: 2,
    pois: [
      { id: "namba-station",  name: "Gare de Namba",    type: "transport",  lat: 34.6623, lng: 135.5019 },
      { id: "umeda-station",  name: "Gare d'Umeda",     type: "transport",  lat: 34.7028, lng: 135.4958 },
      { id: "konbini-namba",  name: "Konbini Namba",    type: "konbini",  lat: 34.6670, lng: 135.5030 },
      { id: "dotonbori",      name: "Dōtonbori",         type: "izakaya",  lat: 34.6686, lng: 135.5016 },
      { id: "shinsekai",      name: "Shinsekai",         type: "izakaya",  lat: 34.6514, lng: 135.5063 },
      { id: "osaka-castle",   name: "Château d'Osaka",  type: "site", lat: 34.6873, lng: 135.5262 },
      { id: "kuromon-market", name: "Marché Kuromon",   type: "market",   lat: 34.6648, lng: 135.5083 },
      { id: "sumiyoshi",      name: "Sumiyoshi Taisha", type: "site",   lat: 34.6132, lng: 135.4933 },
    ],
  },

  kyoto: {
    name: "Kyoto",
    center: [35.0116, 135.7681],
    zoom: 14,
    levelRequired: 3,
    pois: [
      { id: "kyoto-station",  name: "Gare de Kyoto",   type: "transport",  lat: 34.9859, lng: 135.7588 },
      { id: "fushimi-inari",  name: "Fushimi Inari",   type: "site",   lat: 34.9671, lng: 135.7727 },
      { id: "kinkakuji",      name: "Kinkaku-ji",       type: "site",   lat: 35.0394, lng: 135.7292 },
      { id: "ginkakuji",      name: "Ginkaku-ji",       type: "site",   lat: 35.0270, lng: 135.7982 },
      { id: "nishiki-market", name: "Marché Nishiki",  type: "market",   lat: 35.0054, lng: 135.7659 },
      { id: "gion-izakaya",   name: "Izakaya de Gion", type: "izakaya",  lat: 35.0039, lng: 135.7764 },
      { id: "konbini-kyoto",  name: "Konbini",          type: "konbini",  lat: 35.0088, lng: 135.7595 },
      { id: "nijo-castle",    name: "Château Nijō",     type: "site", lat: 35.0142, lng: 135.7481 },
    ],
  },

  // ── Coming soon ────────────────────────────────────────────────────────────
  nara:      { name: "Nara",      center: [34.6851, 135.8048], zoom: 14, levelRequired: 99, pois: [] },
  hiroshima: { name: "Hiroshima", center: [34.3853, 132.4553], zoom: 14, levelRequired: 99, pois: [] },
  sapporo:   { name: "Sapporo",   center: [43.0618, 141.3545], zoom: 14, levelRequired: 99, pois: [] },
  nikko:     { name: "Nikkō",     center: [36.7198, 139.6982], zoom: 14, levelRequired: 99, pois: [] },
  nagoya:    { name: "Nagoya",    center: [35.1815, 136.9066], zoom: 14, levelRequired: 99, pois: [] },
  fukuoka:   { name: "Fukuoka",   center: [33.5904, 130.4017], zoom: 14, levelRequired: 99, pois: [] },
  beppu:     { name: "Beppu",     center: [33.2840, 131.4914], zoom: 14, levelRequired: 99, pois: [] },
};

export default cities;
