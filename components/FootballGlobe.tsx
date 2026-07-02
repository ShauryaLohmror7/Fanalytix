"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { ChevronDown, Globe2, Layers, LocateFixed, Maximize2 } from "lucide-react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* ================================================================== */
/* Geometry + color helpers                                            */
/* ================================================================== */

const GLOBE_R = 2;

/** Sentiment ramp: 0 → red, 0.5 → yellow, 1 → green (panel palette). */
function sentimentColor(t: number): THREE.Color {
  const red = new THREE.Color("#e11d48");
  const yellow = new THREE.Color("#eab308");
  const green = new THREE.Color("#4ade80");
  return t < 0.5
    ? red.clone().lerp(yellow, t * 2)
    : yellow.clone().lerp(green, (t - 0.5) * 2);
}

/** Smooth pseudo-noise regional sentiment field over lat/lon. */
function regionSentiment(latDeg: number, lonDeg: number): number {
  const la = (latDeg * Math.PI) / 180;
  const lo = (lonDeg * Math.PI) / 180;
  const v =
    Math.sin(lo * 1.4 + 0.8) * 0.5 +
    Math.sin(la * 2.1 - lo * 0.7) * 0.3 +
    Math.sin((la + lo) * 3.2) * 0.2;
  return THREE.MathUtils.clamp(0.5 + v * 0.9, 0, 1);
}

function latLonToVec3(latDeg: number, lonDeg: number, r: number): THREE.Vector3 {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return new THREE.Vector3(
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.sin(lat),
    -r * Math.cos(lat) * Math.sin(lon),
  );
}

/**
 * Continents approximated as lat/lon ellipses — enough fidelity for a
 * dotted-map read at this resolution, with a noisy edge for organic shape.
 */
const LANDMASSES: Array<[lat: number, lon: number, ry: number, rx: number]> = [
  [55, -100, 22, 32], // North America
  [68, -152, 8, 12], // Alaska
  [74, -41, 8, 14], // Greenland
  [17, -92, 8, 10], // Central America
  [-14, -59, 24, 17], // South America
  [4, 19, 28, 17], // Africa
  [31, 37, 8, 12], // Middle East
  [52, 22, 12, 24], // Europe
  [62, 95, 20, 42], // North Asia / Siberia
  [32, 100, 14, 18], // China
  [20, 77, 12, 9], // India
  [-2, 113, 7, 16], // SE Asia / Indonesia
  [-25, 134, 10, 15], // Australia
  [36, 138, 6, 5], // Japan
  [-40, 175, 4, 3], // New Zealand
];

function isLand(lat: number, lon: number): boolean {
  for (const [cy, cx, ry, rx] of LANDMASSES) {
    let dx = lon - cx;
    if (dx > 180) dx -= 360;
    if (dx < -180) dx += 360;
    const dy = lat - cy;
    const d = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    // Deterministic edge noise so coastlines aren't perfect ellipses.
    const wobble = 0.22 * Math.sin(lat * 0.9 + lon * 0.6) + 0.14 * Math.sin(lon * 1.7);
    if (d < 1 + wobble) return true;
  }
  return false;
}

/* ================================================================== */
/* Scene pieces                                                        */
/* ================================================================== */

/** Dotted world map, vertex-colored by the regional sentiment field. */
function SentimentDots() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    for (let lat = -62; lat <= 78; lat += 2.2) {
      // Constant surface density: fewer dots per ring near the poles.
      const step = 2.2 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
      for (let lon = -180; lon < 180; lon += step) {
        if (!isLand(lat, lon)) continue;
        const p = latLonToVec3(lat, lon, GLOBE_R * 1.012);
        positions.push(p.x, p.y, p.z);
        const c = sentimentColor(regionSentiment(lat, lon));
        colors.push(c.r, c.g, c.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * True truncated-icosahedron (classic football) seam lines, slerped onto
 * the sphere surface.
 */
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
            // Even (cyclic) permutations only → the 60 vertices.
            verts.push(
              new THREE.Vector3(t[0], t[1], t[2]),
              new THREE.Vector3(t[1], t[2], t[0]),
              new THREE.Vector3(t[2], t[0], t[1]),
            );
          }
        }
      }
    }
    // Edges connect vertex pairs at the minimal distance (edge length 2).
    const lines: THREE.Vector3[][] = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        if (Math.abs(verts[i].distanceTo(verts[j]) - 2) < 0.01) {
          // Slerp-subdivide so the seam hugs the sphere.
          const a = verts[i].clone().normalize();
          const b = verts[j].clone().normalize();
          const pts: THREE.Vector3[] = [];
          for (let k = 0; k <= 6; k++) {
            const q = new THREE.Vector3()
              .copy(a)
              .lerp(b, k / 6)
              .normalize()
              .multiplyScalar(GLOBE_R * 1.004);
            pts.push(q);
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
          color="#9fe8bb"
          transparent
          opacity={0.28}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/** Glowing great-circle arcs between random land hotspots. */
function ConnectionArcs() {
  const arcs = useMemo(() => {
    const hotspots: THREE.Vector3[] = [];
    const spots: Array<[number, number]> = [
      [45, -75], [19, -99], [-23, -46], [51, 0], [48, 2],
      [6, 3], [30, 31], [19, 72], [35, 139], [-33, 151], [40, -3], [52, 13],
    ];
    for (const [lat, lon] of spots) hotspots.push(latLonToVec3(lat, lon, GLOBE_R));

    const list: { points: THREE.Vector3[]; color: string }[] = [];
    for (let i = 0; i < 9; i++) {
      const a = hotspots[(i * 5) % hotspots.length];
      const b = hotspots[(i * 7 + 3) % hotspots.length];
      const mid = a.clone().add(b).normalize().multiplyScalar(GLOBE_R * 1.45);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      list.push({
        points: curve.getPoints(40),
        color: i % 3 === 0 ? "#e11d48" : i % 3 === 1 ? "#eab308" : "#4ade80",
      });
    }
    return list;
  }, []);

  return (
    <group>
      {arcs.map((arc, i) => (
        <Line
          key={i}
          points={arc.points}
          color={arc.color}
          transparent
          opacity={0.35}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/** Slow particle halo + tilted orbital rings around the ball. */
function OrbitHalo() {
  const group = useRef<THREE.Group>(null);

  const particles = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    for (let i = 0; i < 380; i++) {
      const r = GLOBE_R * (1.25 + Math.random() * 0.75);
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 2;
      const ring = Math.sqrt(1 - y * y);
      positions.push(r * ring * Math.cos(theta), r * y * 0.85, r * ring * Math.sin(theta));
      const c = sentimentColor(Math.random());
      colors.push(c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  const rings = useMemo(() => {
    const mk = (tiltX: number, tiltZ: number, r: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 90; i++) {
        const t = (i / 90) * Math.PI * 2;
        const p = new THREE.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r);
        p.applyEuler(new THREE.Euler(tiltX, 0, tiltZ));
        pts.push(p);
      }
      return pts;
    };
    return [
      mk(1.15, 0.2, GLOBE_R * 1.42),
      mk(-0.9, 0.5, GLOBE_R * 1.58),
      mk(0.35, -1.1, GLOBE_R * 1.72),
    ];
  }, []);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={group}>
      <points geometry={particles}>
        <pointsMaterial
          size={0.035}
          vertexColors
          transparent
          opacity={0.75}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {rings.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#4ade80"
          transparent
          opacity={0.1}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/** Dark glass pedestal with a glowing pitch-circle under the ball. */
function GlassStage() {
  return (
    <group position={[0, -GLOBE_R - 0.75, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color="#03130b" transparent opacity={0.85} />
      </mesh>
      {[2.15, 2.55, 3.1].map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01 + i * 0.002, 0]}>
          <ringGeometry args={[r - 0.02, r, 96]} />
          <meshBasicMaterial
            color={i === 0 ? "#4ade80" : "#155e3b"}
            transparent
            opacity={i === 0 ? 0.5 : 0.3}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[3.35, 3.42, 0.55, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#0c2418"
          transparent
          opacity={0.25}
          roughness={0.15}
          metalness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function BallCore() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.06;
  });

  return (
    // Start with the Atlantic/Europe/Africa face toward the camera.
    <group ref={group} rotation={[0, -1.9, 0]}>
      {/* Dark ball body */}
      <mesh>
        <sphereGeometry args={[GLOBE_R * 0.985, 64, 64]} />
        <meshPhongMaterial
          color="#04100a"
          emissive="#05190f"
          emissiveIntensity={0.4}
          shininess={12}
          specular={new THREE.Color("#12331f")}
        />
      </mesh>
      <SentimentDots />
      <FootballSeams />
      <ConnectionArcs />
    </group>
  );
}

function Atmosphere() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[GLOBE_R * 1.09, 48, 48]} />
        <meshBasicMaterial
          color="#2fae63"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[GLOBE_R * 1.25, 48, 48]} />
        <meshBasicMaterial
          color="#166534"
          transparent
          opacity={0.035}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/* ================================================================== */
/* CSS overlays (stadium lights, controls, sentiment scale)            */
/* ================================================================== */

function StadiumLights({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute top-[9%] hidden md:block ${
        side === "left" ? "left-[4%] -rotate-6" : "right-[4%] rotate-6"
      }`}
    >
      <div className="grid grid-cols-4 gap-1.5 rounded-md border border-white/10 bg-black/60 p-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="h-2 w-3 rounded-[2px] bg-slate-100"
            style={{
              boxShadow:
                "0 0 6px rgba(255,255,255,0.9), 0 0 18px rgba(190,242,255,0.5)",
              opacity: 0.9,
            }}
          />
        ))}
      </div>
      <div
        className="absolute left-1/2 top-full h-40 w-56 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at top, rgba(190,242,255,0.14), transparent 65%)",
        }}
      />
    </div>
  );
}

function SentimentScale() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2">
      <div className="relative w-[min(520px,70%)]">
        <div
          className="h-1.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #e11d48 0%, #eab308 50%, #4ade80 100%)",
            boxShadow: "0 0 14px rgba(74,222,128,0.25)",
          }}
        />
        {/* Ball marker at neutral */}
        <span className="absolute -top-[7px] left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border border-white/40 bg-black text-[10px] shadow-[0_0_10px_rgba(255,255,255,0.4)]">
          ⚽
        </span>
        <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400">
          <span>Very Negative</span>
          <span>Neutral</span>
          <span>Very Positive</span>
        </div>
      </div>
      <div className="text-[10.5px] tracking-wide text-slate-500">
        Drag to rotate&ensp;·&ensp;Scroll to zoom
      </div>
    </div>
  );
}

/* ================================================================== */
/* Main export                                                         */
/* ================================================================== */

export default function FootballGlobe() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.25 }}
      className="relative h-full w-full overflow-hidden"
    >
      {/* Crowd / stadium ambience behind the canvas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 55% at 50% 42%, rgba(20,60,40,0.35), transparent 70%)," +
            "radial-gradient(ellipse 40% 25% at 12% 12%, rgba(120,180,255,0.07), transparent 70%)," +
            "radial-gradient(ellipse 40% 25% at 88% 12%, rgba(120,180,255,0.07), transparent 70%)",
        }}
      />
      <StadiumLights side="left" />
      <StadiumLights side="right" />

      {/* Top pill */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <button className="glass-chip pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-semibold text-slate-100 transition-colors hover:border-neon-green/40">
          <Globe2 className="h-4 w-4 text-neon-green" />
          Global Sentiment
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
      <button
        aria-label="Fullscreen"
        className="glass-chip absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-neon-green"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      {/* Side controls */}
      <div className="absolute bottom-20 left-4 z-10 flex flex-col gap-2">
        <button
          aria-label="Layers"
          className="glass-chip flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-neon-green"
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute bottom-20 right-4 z-10">
        <button
          aria-label="Reset view"
          className="glass-chip flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-neon-green"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      <Canvas
        camera={{ position: [0, 0.7, 9.4], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[6, 8, 4]} intensity={0.9} color="#eafff2" />
        <pointLight position={[-8, 3, -4]} intensity={10} color="#16a34a" />
        <pointLight position={[8, -2, 4]} intensity={7} color="#be123c" />

        <BallCore />
        <Atmosphere />
        <OrbitHalo />
        <GlassStage />

        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={13}
          autoRotate
          autoRotateSpeed={0.4}
          rotateSpeed={0.6}
          dampingFactor={0.08}
        />
      </Canvas>

      <SentimentScale />
    </motion.div>
  );
}
