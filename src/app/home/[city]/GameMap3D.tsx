"use client";

import { useRef, useCallback, useEffect } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { CityData, POIType } from "@/lib/cities";

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

const POI_COLORS: Record<POIType, string> = {
  station:  "#0ea5e9",
  konbini:  "#10b981",
  izakaya:  "#f97316",
  temple:   "#8b5cf6",
  market:   "#f59e0b",
  landmark: "#ef4444",
};

const POI_ICONS: Record<POIType, string> = {
  station:  "🚉",
  konbini:  "🏪",
  izakaya:  "🍶",
  temple:   "⛩️",
  market:   "🛒",
  landmark: "📍",
};

// ── Tokyo Skytree — custom Three.js layer ─────────────────────────────────────

function createSkytreeLayer(map: ReturnType<MapRef["getMap"]>) {
  // Real Skytree coordinates
  const origin = maplibregl.MercatorCoordinate.fromLngLat(
    { lng: 139.8107, lat: 35.7101 },
    0
  );
  // 1 meter in Mercator units at this latitude
  const mpu = origin.meterInMercatorCoordinateUnits();

  let renderer: THREE.WebGLRenderer;
  let scene:    THREE.Scene;
  let camera:   THREE.Camera;

  return {
    id:            "skytree-model",
    type:          "custom"  as const,
    renderingMode: "3d"      as const,

    onAdd(_map: typeof map, gl: WebGL2RenderingContext) {
      camera = new THREE.Camera();
      scene  = new THREE.Scene();

      // Lighting
      const ambient = new THREE.AmbientLight(0xffeedd, 1.2);
      scene.add(ambient);
      const sun = new THREE.DirectionalLight(0xfff3cc, 2.0);
      sun.position.set(1, 2, 1.5);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xaaccff, 0.6);
      fill.position.set(-1, 0.5, -1);
      scene.add(fill);

      // Load GLB
      new GLTFLoader().load(
        "/models/tokyo_skytree.glb",
        (gltf) => {
          // Scale from model units (meters) → Mercator units
          gltf.scene.scale.setScalar(mpu);
          // Center X/Z and place base at ground level
          // Position must also be in Mercator units (mpu * model meters)
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const c = box.getCenter(new THREE.Vector3());
          gltf.scene.position.set(-c.x, -box.min.y, -c.z);
          scene.add(gltf.scene);
          map.triggerRepaint();
        },
        undefined,
        (err) => console.error("[Skytree] GLB load error:", err)
      );

      renderer = new THREE.WebGLRenderer({
        canvas:    map.getCanvas(),
        context:   gl,
        antialias: true,
      });
      renderer.autoClear = false;
    },

    render(_gl: WebGL2RenderingContext, args: any) {
      // MapLibre v3+: matrix is inside args.defaultProjectionData.mainMatrix
      const projMatrix: number[] =
        args?.defaultProjectionData?.mainMatrix ?? args;

      const transform = new THREE.Matrix4()
        .fromArray(projMatrix)
        .multiply(
          new THREE.Matrix4()
            .makeTranslation(origin.x, origin.y, origin.z ?? 0)
            .scale(new THREE.Vector3(1, -1, 1))
            .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
        );

      camera.projectionMatrix = transform;
      renderer.resetState();
      renderer.render(scene, camera);
      map.triggerRepaint();
    },
  };
}

export default function GameMap3D({
  city,
  activeType,
  onPoiClick,
}: {
  city: CityData;
  activeType: POIType | null;
  onPoiClick: (poiId: string) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const pois = activeType ? city.pois.filter(p => p.type === activeType) : city.pois;

  useEffect(() => () => { mapRef.current?.getMap()?.removeImage?.("water-anim"); }, []);

  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // ── Hide all base labels + icons (bus stops, POI text…) ──
    // ── Hide flat 2D building footprints ──────────────────────
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type === "symbol") {
        try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch {}
      }
      if (layer.type === "fill" && (layer.id as string).includes("building")) {
        try { map.setLayoutProperty(layer.id, "visibility", "none"); } catch {}
      }
    });

    // ── Route styling — asphalte sombre + chemins terracotta ─
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type !== "line") return;
      const id: string = layer.id;
      if (/water/.test(id)) return;

      try {
        if (/casing/.test(id)) {
          // Casing (contour) légèrement plus clair
          if (/motorway|trunk/.test(id))    map.setPaintProperty(id, "line-color", "#14141f");
          else if (/primary/.test(id))      map.setPaintProperty(id, "line-color", "#1e1e30");
          else if (/secondary/.test(id))    map.setPaintProperty(id, "line-color", "#28283a");
          else                              map.setPaintProperty(id, "line-color", "#38384a");
        } else if (/motorway|trunk/.test(id)) {
          map.setPaintProperty(id, "line-color", "#1c1c2e");
        } else if (/primary/.test(id)) {
          map.setPaintProperty(id, "line-color", "#26263a");
        } else if (/secondary/.test(id)) {
          map.setPaintProperty(id, "line-color", "#343448");
        } else if (/tertiary/.test(id)) {
          map.setPaintProperty(id, "line-color", "#424256");
        } else if (/path|footway|pedestrian|steps/.test(id)) {
          map.setPaintProperty(id, "line-color", "#d4956a");
          try { map.setPaintProperty(id, "line-dasharray", [2, 2]); } catch {}
        } else if (/cycleway|cycle/.test(id)) {
          map.setPaintProperty(id, "line-color", "#5cc8b8");
        } else if (/road|street|minor|service/.test(id)) {
          map.setPaintProperty(id, "line-color", "#505062");
        }
      } catch {}
    });

    // ── Chemin de fer — rails + traverses ────────────────────
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type !== "line") return;
      const id: string = layer.id;
      if (!/rail|railway|transit|subway|metro|tram/.test(id)) return;
      try {
        if (/casing|outline/.test(id)) {
          // Ballast (fond gris-pierre)
          map.setPaintProperty(id, "line-color",   "#5a5a6a");
          map.setPaintProperty(id, "line-opacity",  0.9);
        } else if (/transit|subway|metro/.test(id)) {
          // Métro / transit — acier bleuté + tirets traverses
          map.setPaintProperty(id, "line-color",     "#7c8caa");
          map.setPaintProperty(id, "line-width",     2);
          try { map.setPaintProperty(id, "line-dasharray", [4, 2]); } catch {}
        } else if (/tram/.test(id)) {
          // Tramway — cuivre doré
          map.setPaintProperty(id, "line-color",  "#b8942a");
          map.setPaintProperty(id, "line-width",  1.5);
        } else {
          // Rail principal — acier sombre + traverses blanches
          map.setPaintProperty(id, "line-color",  "#3c3c50");
          map.setPaintProperty(id, "line-width",  3);
          try { map.setPaintProperty(id, "line-dasharray", [6, 3]); } catch {}
          map.setPaintProperty(id, "line-opacity", 1);
        }
      } catch {}
    });

    // ── Warm daylight ─────────────────────────────────────────
    map.setLight({
      anchor:    "map" as any,
      color:     "#fff8f0",
      intensity: 0.4,
      position:  [1.5, 135, 45] as any,
    });

    // ── 3D buildings — Japanese palette ───────────────────────
    const labelLayerId = map.getStyle().layers.find(
      l => l.type === "symbol" && (l.layout as any)?.["text-field"]
    )?.id;

    if (!map.getLayer("game-3d-buildings")) {
      map.addLayer(
        {
          id: "game-3d-buildings",
          type: "fill-extrusion",
          source: "openmaptiles",
          "source-layer": "building",
          minzoom: 13,
          filter: [
            "all",
            ["has", "render_height"],
            [">", ["get", "render_height"], 0],
            ["<", ["get", "render_height"], 300],
            ["!", ["within", {
              type: "Polygon",
              coordinates: [[
                [139.798, 35.703],
                [139.823, 35.703],
                [139.823, 35.718],
                [139.798, 35.718],
                [139.798, 35.703],
              ]],
            }]],
          ],
          paint: {
            // crème → pêche → orange doux → bleu ciel → indigo
            "fill-extrusion-color": [
              "interpolate", ["linear"],
              ["coalesce", ["get", "render_height"], 3],
              0,   "#fef3c7",   // crème pâle   — kiosques
              6,   "#fcd9a0",   // pêche        — maisons
              15,  "#f9a26c",   // orange doux  — immeubles bas
              30,  "#7dd3fc",   // bleu ciel    — bureaux
              60,  "#818cf8",   // indigo       — tours
              100, "#c4b5fd",   // lavande      — gratte-ciels
            ],
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], 3],
            "fill-extrusion-base":    ["coalesce", ["get", "render_min_height"], 0],
            "fill-extrusion-opacity": 0.9,
          },
        } as any,
        labelLayerId
      );
    }

    // ── Tokyo Skytree GLB model ───────────────────────────────
    if (!map.getLayer("skytree-model")) {
      map.addLayer(createSkytreeLayer(map) as any);
    }

    // ── Anime water — wave pattern ────────────────────────────
    const waterFillIds: string[] = [];
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type === "fill" && /water/.test(layer.id)) waterFillIds.push(layer.id);
    });

    if (waterFillIds.length > 0 && !map.hasImage("water-anim")) {
      const SZ  = 128;
      const cvs = document.createElement("canvas");
      cvs.width = SZ; cvs.height = SZ;
      const ctx = cvs.getContext("2d")!;

      map.addImage("water-anim", {
        width: SZ,
        height: SZ,
        data: new Uint8Array(SZ * SZ * 4),
        render() {
          const t = performance.now() / 1000;
          ctx.clearRect(0, 0, SZ, SZ);

          // Base blue
          ctx.fillStyle = "#5badec";
          ctx.fillRect(0, 0, SZ, SZ);

          // Small scrolling wave lines
          const spacing = 14;
          const offset  = (t * 10) % spacing;
          ctx.lineWidth = 1.2;

          for (let i = -1; i <= SZ / spacing + 1; i++) {
            const baseY = i * spacing + offset;
            ctx.beginPath();
            for (let x = 0; x <= SZ; x++) {
              // 2 full cycles per tile width → seamless X tiling
              const y = baseY + Math.sin((x / SZ) * Math.PI * 4 + t * 1.8) * 2.5;
              x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = "rgba(255,255,255,0.24)";
            ctx.stroke();
          }

          const d = ctx.getImageData(0, 0, SZ, SZ);
          this.data = new Uint8Array(d.data.buffer);
          map.triggerRepaint();
          return true;
        },
      } as any);

      waterFillIds.forEach(id => {
        try { map.setPaintProperty(id, "fill-pattern", "water-anim"); } catch {}
      });
    }

    // ── Anime grass — swaying blades on green areas ──────────
    const grassFillIds: string[] = [];
    map.getStyle().layers.forEach((layer: any) => {
      if (layer.type === "fill" && /park|grass|garden|wood|forest|nature|recreation/i.test(layer.id))
        grassFillIds.push(layer.id);
    });

    if (grassFillIds.length > 0 && !map.hasImage("grass-anim")) {
      const GSZ   = 32;
      const gcvs  = document.createElement("canvas");
      gcvs.width  = GSZ; gcvs.height = GSZ;
      const gctx  = gcvs.getContext("2d")!;

      // Fixed tuft positions with staggered phases for natural breeze
      const tufts = [
        { x:  4, h: 4, phase: 0.0 },
        { x: 10, h: 3, phase: 1.1 },
        { x: 17, h: 5, phase: 2.2 },
        { x: 23, h: 3, phase: 0.7 },
        { x: 28, h: 4, phase: 1.8 },
      ];

      map.addImage("grass-anim", {
        width: GSZ,
        height: GSZ,
        data: new Uint8Array(GSZ * GSZ * 4),
        render() {
          const t = performance.now() / 1000;
          gctx.clearRect(0, 0, GSZ, GSZ);

          // Base anime park green
          gctx.fillStyle = "#b5d97c";
          gctx.fillRect(0, 0, GSZ, GSZ);

          tufts.forEach(({ x, h, phase }) => {
            // Gentle breeze sway — each tuft independent
            const sway = Math.sin(t * 1.3 + phase) * 1.2;

            // Two blades per tuft
            [[0, 1.0, "rgba(45,110,20,0.85)"], [3, 0.7, "rgba(70,145,30,0.55)"]].forEach(
              ([dx, scale, color]) => {
                const bx = x + (dx as number);
                const bh = h  * (scale as number);
                const sw = sway * (scale as number);
                gctx.beginPath();
                gctx.moveTo(bx, GSZ);
                gctx.quadraticCurveTo(bx + sw * 0.5, GSZ - bh * 0.55, bx + sw, GSZ - bh);
                gctx.strokeStyle = color as string;
                gctx.lineWidth   = 1.0 * (scale as number);
                gctx.lineCap     = "round";
                gctx.stroke();
              }
            );
          });

          const d = gctx.getImageData(0, 0, GSZ, GSZ);
          this.data = new Uint8Array(d.data.buffer);
          map.triggerRepaint();
          return true;
        },
      } as any);

      grassFillIds.forEach(id => {
        try { map.setPaintProperty(id, "fill-pattern", "grass-anim"); } catch {}
      });
    }

    // ── Bearing clamp ±25° autour du bearing initial ─────────
    const BASE_BEARING = -20;
    const MAX_DELTA    =  25;
    map.on("rotate", () => {
      const b = map.getBearing();
      const delta = b - BASE_BEARING;
      if (Math.abs(delta) > MAX_DELTA) {
        map.jumpTo({ bearing: BASE_BEARING + Math.sign(delta) * MAX_DELTA });
      }
    });

    // ── Sky + Fog — cache les tuiles plates à l'horizon ──────
    try {
      if (!map.getLayer("sky")) {
        map.addLayer({
          id:   "sky",
          type: "sky",
          paint: {
            "sky-type":                       "atmosphere",
            "sky-atmosphere-sun":             [0.0, 90.0],
            "sky-atmosphere-sun-intensity":   5,
            "sky-atmosphere-color":           "rgba(210, 228, 255, 1.0)",
            "sky-atmosphere-halo-color":      "rgba(255, 245, 230, 0.8)",
          },
        } as any);
      }
      (map as any).setFog({
        range:           [0.3, 5],
        color:           "#f0e8d8",
        "high-color":    "#c8d8ee",
        "horizon-blend": 0.18,
        "space-color":   "#d4e4f0",
        "star-intensity": 0,
      });
    } catch {}

    // ── Cinematic tilt-in ─────────────────────────────────────
    map.easeTo({
      pitch:    55,
      duration: 1800,
      easing:   (t: number) => 1 - Math.pow(1 - t, 3),
    });
  }, []);

  return (
    <Map
      ref={mapRef}
      mapStyle={STYLE_URL}
      initialViewState={{
        longitude: city.center[1],
        latitude:  city.center[0],
        zoom:      15.2,
        pitch:     0,
        bearing:   -20,
      }}
      minZoom={14}
      maxPitch={58}
      minPitch={35}
      maxBounds={[
        [139.58, 35.62],
        [139.85, 35.75],
      ]}
      style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
      onLoad={handleLoad}
    >
      {pois.map(poi => (
        <Marker
          key={poi.id}
          longitude={poi.lng}
          latitude={poi.lat}
          anchor="bottom"
          onClick={e => { e.originalEvent?.stopPropagation(); onPoiClick(poi.id); }}
        >
          <div
            className="gm3d-poi"
            style={{ "--pc": POI_COLORS[poi.type] } as React.CSSProperties}
          >
            <div className="gm3d-pin">
              <div className="gm3d-pulse" />
              <span className="gm3d-icon">{POI_ICONS[poi.type]}</span>
            </div>
            <div className="gm3d-label">{poi.name}</div>
          </div>
        </Marker>
      ))}
    </Map>
  );
}
