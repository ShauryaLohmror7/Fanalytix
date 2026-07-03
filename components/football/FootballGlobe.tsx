"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  FlaskConical,
  Globe2,
  Layers,
  LocateFixed,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { geoCentroid, geoArea } from "d3-geo";
import citiesData from "@/lib/data/cities.json";
import { useApp, type GlobeLayers } from "@/lib/appState";

/* ================================================================== */
/* Real geography — Natural Earth, fetched at runtime so the 756KB     */
/* topology never blocks first paint or the intro animation.           */
/* ================================================================== */

const GLOBE_R = 100; // three-globe's fixed radius

interface GeoData {
  countries: object[];
  countryLabels: Array<{ name: string; lat: number; lng: number }>;
}

let geoCache: GeoData | null = null;

async function loadGeo(): Promise<GeoData> {
  if (geoCache) return geoCache;
  const res = await fetch("/geo/countries-50m.json");
  const topo = (await res.json()) as Topology;
  const countries = feature(
    topo,
    (topo as unknown as { objects: { countries: GeometryCollection } }).objects
      .countries,
  ).features.filter(
    (f) => (f.properties as { name?: string } | null)?.name !== "Antarctica",
  );

  // Country labels at true spherical centroids, largest ~50 by area only
  // so small states don't collide at globe scale.
  const countryLabels = countries
    .map((f) => {
      const [lng, lat] = geoCentroid(f as never);
      return {
        name: (f.properties as { name?: string }).name ?? "",
        lat,
        lng,
        area: geoArea(f as never),
      };
    })
    .filter((c) => c.name && Number.isFinite(c.lat))
    .sort((a, b) => b.area - a.area)
    .slice(0, 50)
    .map(({ name, lat, lng }) => ({ name, lat, lng }));

  geoCache = { countries: countries as object[], countryLabels };
  return geoCache;
}

/** Real cities (Natural Earth populated places): top by population,
    capitals slightly favoured. */
const CITY_LABELS = (
  citiesData as Array<{
    name: string;
    lat: number;
    lng: number;
    pop: number;
    capital: boolean;
  }>
)
  .slice()
  .sort((a, b) => b.pop + (b.capital ? 3e6 : 0) - (a.pop + (a.capital ? 3e6 : 0)))
  .slice(0, 48);

/** Animated arcs between football capitals (visual layer, gold/emerald). */
const ARC_ROUTES: Array<[number, number, number, number]> = [
  [19.43, -99.13, 40.71, -74.01], [40.71, -74.01, 51.51, -0.13],
  [51.51, -0.13, 48.86, 2.35], [48.86, 2.35, 41.9, 12.5],
  [-23.55, -46.63, 40.42, -3.7], [-34.6, -58.38, -23.55, -46.63],
  [30.04, 31.24, 6.46, 3.39], [41.01, 28.98, 25.2, 55.27],
  [35.68, 139.69, 37.57, 126.98], [-33.87, 151.21, 1.35, 103.82],
  [19.43, -99.13, 34.05, -118.24], [52.52, 13.41, 41.01, 28.98],
];

/* ================================================================== */
/* Simulated country sentiment (clearly badged in the UI)              */
/* ================================================================== */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Emotion ramp — rose → amber → green (true emotion colors, per user). */
function rampColor(t: number, alpha: number): string {
  const lerp = (a: number[], b: number[], k: number) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const red = [244, 63, 94];
  const amber = [234, 179, 8];
  const green = [74, 222, 128];
  const rgb =
    t < 0.5 ? lerp(red, amber, t * 2) : lerp(amber, green, (t - 0.5) * 2);
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

/* ================================================================== */
/* three-globe inside R3F                                              */
/* ================================================================== */

function WorldGlobe({ layers, geo }: { layers: GlobeLayers; geo: GeoData }) {
  const groupRef = useRef<THREE.Group>(null);

  const globe = useMemo(() => {
    const bucket = Math.floor(Date.now() / (5 * 60 * 1000));
    const sentimentOf = (name: string) =>
      mulberry32(hashString(name) ^ (bucket * 2654435761))();

    const g = new ThreeGlobe()
      .showAtmosphere(true)
      .atmosphereColor("#e8d296")
      .atmosphereAltitude(0.15)
      .showGraticules(true);

    // Lapis sphere under the hexes
    const mat = g.globeMaterial() as THREE.MeshPhongMaterial;
    mat.color = new THREE.Color("#101d4e");
    mat.emissive = new THREE.Color("#0c163b");
    mat.emissiveIntensity = 0.4;
    mat.shininess = 18;
    mat.specular = new THREE.Color("#2a3f85");

    // EXACT country shapes (Natural Earth 50m vector polygons), filled by
    // simulated emotion ramp with fine gold coastline strokes.
    g.polygonsData(geo.countries)
      .polygonCapColor((d: object) => {
        const name =
          (d as { properties?: { name?: string } }).properties?.name ??
          "unknown";
        return rampColor(sentimentOf(name), 0.72);
      })
      .polygonSideColor(() => "rgba(216,180,94,0.10)")
      .polygonStrokeColor(() => "rgba(240,214,138,0.55)")
      .polygonAltitude(0.008);

    // Country + city names (real centroids / real coordinates)
    g.labelsData([
      ...geo.countryLabels.map(({ name, lat, lng }) => ({
        name, lat, lng, isCity: false,
      })),
      ...CITY_LABELS.map(({ name, lat, lng }) => ({
        name, lat, lng, isCity: true,
      })),
    ])
      .labelLat((d) => (d as { lat: number }).lat)
      .labelLng((d) => (d as { lng: number }).lng)
      .labelText((d) => (d as { name: string }).name)
      .labelSize((d) => ((d as { isCity: boolean }).isCity ? 0.75 : 1.15))
      .labelDotRadius((d) => ((d as { isCity: boolean }).isCity ? 0.28 : 0))
      .labelColor((d) =>
        (d as { isCity: boolean }).isCity
          ? "rgba(236,217,164,0.85)"
          : "rgba(244,246,249,0.68)",
      )
      .labelAltitude(0.012)
      .labelResolution(2);

    // Flowing arcs between football capitals
    g.arcsData(
      ARC_ROUTES.map(([startLat, startLng, endLat, endLng], i) => ({
        startLat, startLng, endLat, endLng,
        color: i % 3 === 0 ? "#34d399" : "#d8b45e",
      })),
    )
      .arcColor((d: object) => (d as { color: string }).color)
      .arcAltitude(0.22)
      .arcStroke(0.35)
      .arcDashLength(0.45)
      .arcDashGap(1.6)
      .arcDashAnimateTime(3600);

    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  // Layer visibility without rebuilding the globe
  useEffect(() => {
    globe.polygonsData(layers.countries ? geo.countries : []);
    globe.labelsData(
      layers.labels
        ? [
            ...geo.countryLabels.map(({ name, lat, lng }) => ({ name, lat, lng, isCity: false })),
            ...CITY_LABELS.map(({ name, lat, lng }) => ({ name, lat, lng, isCity: true })),
          ]
        : [],
    );
    globe.arcsData(
      layers.arcs
        ? ARC_ROUTES.map(([startLat, startLng, endLat, endLng], i) => ({
            startLat, startLng, endLat, endLng,
            color: i % 3 === 0 ? "#34d399" : "#d8b45e",
          }))
        : [],
    );
  }, [globe, layers.countries, layers.labels, layers.arcs]);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.035;
  });

  return (
    <group ref={groupRef} rotation={[0.12, -1.2, 0]}>
      <primitive object={globe} />
      {layers.seams && <FootballSeams />}
    </group>
  );
}

/** Ornate gold pedestal beneath the world. */
function GoldPedestal() {
  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8b45e",
        metalness: 0.9,
        roughness: 0.32,
        emissive: "#6b5320",
        emissiveIntensity: 0.25,
      }),
    [],
  );
  const darkGold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8a6d2e",
        metalness: 0.85,
        roughness: 0.45,
      }),
    [],
  );

  return (
    <group position={[0, -GLOBE_R * 1.3, 0]}>
      <mesh material={gold} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_R * 0.5, 2.6, 16, 96]} />
      </mesh>
      <mesh material={darkGold} position={[0, -8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_R * 0.6, 2, 12, 96]} />
      </mesh>
      <mesh material={gold} position={[0, -15, 0]}>
        <cylinderGeometry args={[GLOBE_R * 0.68, GLOBE_R * 0.76, 6, 96]} />
      </mesh>
    </group>
  );
}

/** Signature football seams — truncated icosahedron shell over the earth. */
function FootballSeams() {
  const segments = useMemo(() => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const bases: number[][] = [
      [0, 1, 3 * phi],
      [1, 2 + phi, 2 * phi],
      [phi, 2, 2 * phi + 1],
    ];
    const verts: THREE.Vector3[] = [];
    for (const [a, b, c] of bases) {
      for (const sa of a === 0 ? [1] : [1, -1]) {
        for (const sb of [1, -1]) {
          for (const sc of [1, -1]) {
            const t = [a * sa, b * sb, c * sc];
            verts.push(
              new THREE.Vector3(t[0], t[1], t[2]),
              new THREE.Vector3(t[1], t[2], t[0]),
              new THREE.Vector3(t[2], t[0], t[1]),
            );
          }
        }
      }
    }
    const lines: THREE.Vector3[][] = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        if (Math.abs(verts[i].distanceTo(verts[j]) - 2) < 0.01) {
          const a = verts[i].clone().normalize();
          const b = verts[j].clone().normalize();
          const pts: THREE.Vector3[] = [];
          for (let k = 0; k <= 6; k++) {
            pts.push(
              new THREE.Vector3()
                .copy(a)
                .lerp(b, k / 6)
                .normalize()
                .multiplyScalar(GLOBE_R * 1.045),
            );
          }
          lines.push(pts);
        }
      }
    }
    return lines;
  }, []);

  return (
    <group>
      {segments.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#ecd9a4"
          transparent
          opacity={0.14}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/* ================================================================== */
/* Overlay controls (liquid glass)                                     */
/* ================================================================== */

const LAYER_LABELS: Array<{ key: keyof GlobeLayers; label: string }> = [
  { key: "countries", label: "Country sentiment" },
  { key: "labels", label: "Country & city names" },
  { key: "arcs", label: "Flow arcs" },
  { key: "seams", label: "Football seams" },
];

function SentimentScale() {
  return (
    <div className="pointer-events-none absolute bottom-5 left-5 z-10 hidden flex-col gap-1.5 md:flex">
      <div className="relative w-[200px]">
        <div
          className="h-1 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #f43f5e 0%, #eab308 50%, #4ade80 100%)",
          }}
        />
        <div className="mt-1 flex justify-between text-[9px] font-medium text-ink-faint">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
      </div>
      <div className="text-[9.5px] tracking-wide text-ink-faint/80">
        Drag to rotate · Scroll to zoom
      </div>
    </div>
  );
}

export default function FootballGlobe() {
  const { globeLayers, toggleGlobeLayer } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [geo, setGeo] = useState<GeoData | null>(null);

  // Geography loads after mount so it never blocks paint or the intro.
  useEffect(() => {
    let alive = true;
    loadGeo().then((d) => alive && setGeo(d));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch {
      // Browser denied fullscreen — control remains usable.
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      className="relative h-full w-full overflow-hidden"
    >
      {/* Mode pill */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <button
          onClick={() => setModeOpen((o) => !o)}
          aria-expanded={modeOpen}
          className="liquid-btn flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-ink"
        >
          <Globe2 className="h-4 w-4 text-gold" />
          Global Sentiment
          <span className="flex items-center gap-1 rounded-full border border-warn/30 bg-warn/10 px-1.5 py-px text-[9px] font-bold text-warn">
            <FlaskConical className="h-2.5 w-2.5" />
            SIM
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-ink-faint transition-transform ${modeOpen ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence>
          {modeOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="menu absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-2xl p-1.5"
            >
              <div className="flex items-center justify-between rounded-xl bg-gold/10 px-3 py-2">
                <div>
                  <div className="text-[12px] font-semibold text-ink">
                    Global Sentiment
                  </div>
                  <div className="text-[10px] text-ink-faint">
                    Simulated per-country mood
                  </div>
                </div>
                <Check className="h-4 w-4 text-gold" />
              </div>
              <div className="cursor-not-allowed rounded-xl px-3 py-2 opacity-50">
                <div className="text-[12px] font-medium text-ink-dim">
                  Host Cities
                </div>
                <div className="text-[10px] text-ink-faint">
                  Interactive venue markers arrive in a later phase
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right-side control stack */}
      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <button
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={toggleFullscreen}
          className="liquid-btn flex h-9 w-9 items-center justify-center rounded-xl text-ink-dim hover:text-gold"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <div className="relative">
          <button
            aria-label="Toggle layers"
            aria-expanded={layersOpen}
            title="Layers"
            onClick={() => setLayersOpen((o) => !o)}
            className={`liquid-btn flex h-9 w-9 items-center justify-center rounded-xl ${
              layersOpen ? "text-gold" : "text-ink-dim hover:text-gold"
            }`}
          >
            <Layers className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {layersOpen && (
              <motion.div
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                className="menu absolute right-full top-0 z-20 mr-2 w-52 rounded-2xl p-2"
              >
                <div className="px-2 pb-1 text-[10px] font-bold tracking-[0.14em] text-ink-faint">
                  LAYERS
                </div>
                {LAYER_LABELS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-[12px] text-ink-dim hover:bg-white/5"
                  >
                    {label}
                    <input
                      type="checkbox"
                      checked={globeLayers[key]}
                      onChange={() => toggleGlobeLayer(key)}
                      className="h-3.5 w-3.5 accent-[#d8b45e]"
                    />
                  </label>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          aria-label="Reset view"
          title="Reset view"
          onClick={() => controlsRef.current?.reset()}
          className="liquid-btn flex h-9 w-9 items-center justify-center rounded-xl text-ink-dim hover:text-gold"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 42, 330], fov: 40, near: 1, far: 2000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[300, 350, 250]} intensity={1.5} color="#fdf3d7" />
        <pointLight position={[-350, 100, -200]} intensity={2.4} color="#d8b45e" decay={0} />
        <pointLight position={[0, -260, 120]} intensity={1.2} color="#f0d68a" decay={0} />

        {geo && <WorldGlobe layers={globeLayers} geo={geo} />}
        <GoldPedestal />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={160}
          maxDistance={480}
          autoRotate
          autoRotateSpeed={0.35}
          rotateSpeed={0.55}
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Charting-the-world shimmer while geography streams in */}
      <AnimatePresence>
        {!geo && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-36 w-36 animate-pulse rounded-full border border-gold/30 bg-gold/5 shadow-[0_0_60px_rgba(216,180,94,0.15)]" />
              <span className="font-royal text-[11px] tracking-[0.3em] text-gold/80">
                CHARTING THE WORLD
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SentimentScale />
    </motion.div>
  );
}
