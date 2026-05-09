type Box = { name: string; latMin: number; latMax: number; lngMin: number; lngMax: number };

// Ordered smallest → largest so the most specific area wins on first match
const NEIGHBORHOODS: Box[] = [
  // ── Sub-districts ─────────────────────────────────────────────────────────
  { name: "Kabukichō",     latMin: 35.692, latMax: 35.698, lngMin: 139.700, lngMax: 139.707 },
  { name: "Takeshita",     latMin: 35.668, latMax: 35.672, lngMin: 139.701, lngMax: 139.706 },
  { name: "Omotesandō",    latMin: 35.664, latMax: 35.670, lngMin: 139.706, lngMax: 139.716 },
  { name: "Akihabara",     latMin: 35.697, latMax: 35.703, lngMin: 139.769, lngMax: 139.776 },
  { name: "Tsukiji",       latMin: 35.664, latMax: 35.670, lngMin: 139.764, lngMax: 139.773 },
  { name: "Asakusa",       latMin: 35.710, latMax: 35.718, lngMin: 139.793, lngMax: 139.802 },
  { name: "Roppongi",      latMin: 35.660, latMax: 35.666, lngMin: 139.727, lngMax: 139.735 },
  { name: "Daikanyama",    latMin: 35.647, latMax: 35.653, lngMin: 139.699, lngMax: 139.705 },
  { name: "Nakameguro",    latMin: 35.640, latMax: 35.647, lngMin: 139.696, lngMax: 139.705 },
  { name: "Shimokitazawa", latMin: 35.659, latMax: 35.664, lngMin: 139.666, lngMax: 139.673 },
  { name: "Koenji",        latMin: 35.703, latMax: 35.708, lngMin: 139.648, lngMax: 139.656 },
  { name: "Kagurazaka",    latMin: 35.701, latMax: 35.706, lngMin: 139.737, lngMax: 139.744 },
  { name: "Yanaka",        latMin: 35.720, latMax: 35.726, lngMin: 139.764, lngMax: 139.773 },
  { name: "Odaiba",        latMin: 35.620, latMax: 35.632, lngMin: 139.773, lngMax: 139.790 },
  { name: "Marunouchi",    latMin: 35.677, latMax: 35.687, lngMin: 139.759, lngMax: 139.770 },
  { name: "Nihonbashi",    latMin: 35.680, latMax: 35.689, lngMin: 139.770, lngMax: 139.782 },
  { name: "Ryōgoku",       latMin: 35.695, latMax: 35.705, lngMin: 139.792, lngMax: 139.800 },
  // ── Main districts ────────────────────────────────────────────────────────
  { name: "Shinjuku",      latMin: 35.683, latMax: 35.700, lngMin: 139.690, lngMax: 139.714 },
  { name: "Shibuya",       latMin: 35.654, latMax: 35.668, lngMin: 139.694, lngMax: 139.710 },
  { name: "Harajuku",      latMin: 35.667, latMax: 35.675, lngMin: 139.699, lngMax: 139.707 },
  { name: "Ginza",         latMin: 35.668, latMax: 35.677, lngMin: 139.759, lngMax: 139.773 },
  { name: "Ueno",          latMin: 35.706, latMax: 35.720, lngMin: 139.768, lngMax: 139.780 },
  { name: "Ikebukuro",     latMin: 35.726, latMax: 35.736, lngMin: 139.706, lngMax: 139.720 },
  { name: "Ebisu",         latMin: 35.644, latMax: 35.652, lngMin: 139.710, lngMax: 139.720 },
];

export function getNeighborhood(lat: number, lng: number): string {
  return NEIGHBORHOODS.find(
    n => lat >= n.latMin && lat <= n.latMax && lng >= n.lngMin && lng <= n.lngMax
  )?.name ?? "";
}
