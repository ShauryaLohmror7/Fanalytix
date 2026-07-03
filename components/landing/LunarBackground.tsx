"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * The portal background — adapted from 21st.dev's "Lunar Gravity" scene,
 * rebuilt for FanalytiX: a golden orb (with a whisper of football seams)
 * whose particle ring assembles itself out of the sphere on arrival.
 * No external textures or HDRs: everything is procedural, so the portal
 * paints instantly and works offline.
 */

const RADIUS = 2;

type RingState = "hidden" | "animating" | "visible";

/* ------------------------------ orb ------------------------------ */

function seamLines(scale: number): THREE.Vector3[][] {
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
        for (let k = 0; k <= 5; k++) {
          pts.push(
            new THREE.Vector3().copy(a).lerp(b, k / 5).normalize().multiplyScalar(scale),
          );
        }
        lines.push(pts);
      }
    }
  }
  return lines;
}

function GoldenOrb({ onIgnite }: { onIgnite: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  const seams = useMemo(() => seamLines(RADIUS * 1.006), []);

  useFrame((_, delta) => {
    if (meshRef.current)
      meshRef.current.rotation.y += Math.min(delta, 0.05) * 0.06;
  });

  return (
    <group
      ref={meshRef}
      onClick={onIgnite}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial
          color="#b9913f"
          metalness={0.88}
          roughness={0.34}
          emissive="#33260c"
          emissiveIntensity={0.6}
        />
      </mesh>
      {seams.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#f7e5b0"
          transparent
          opacity={0.16}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/* --------------------------- particle ring --------------------------- */

const PARTICLES = 45000;

const [ringPositions, ringColors, ringRandoms] = (() => {
  const pos = new Float32Array(PARTICLES * 3);
  const col = new Float32Array(PARTICLES * 3);
  const rnd = new Float32Array(PARTICLES);

  for (let i = 0; i < PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rDist = Math.pow(Math.random(), 1.5);
    const radius = 2.3 + rDist * 2.3;
    const thickness = 0.38 - rDist * 0.18;
    const ySpread = Math.random() + Math.random() + Math.random() - 1.5;

    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = ySpread * thickness;
    pos[i * 3 + 2] = Math.sin(angle) * radius;

    const intensity = 1.0 - rDist;

    // FanalytiX palette: warm dust, gold sparks, emerald whispers
    const t = Math.random();
    let r: number, g: number, b: number;
    if (t < 0.78) {
      r = 0.3; g = 0.26; b = 0.2;
    } else if (t < 0.94) {
      r = 0.85; g = 0.68; b = 0.3;
    } else {
      r = 0.14; g = 0.55; b = 0.38;
    }
    const sparkle = Math.random() > 0.95 ? 2.4 : 1.0;
    col[i * 3] = r * intensity * sparkle;
    col[i * 3 + 1] = g * intensity * sparkle;
    col[i * 3 + 2] = b * intensity * sparkle;
    rnd[i] = Math.random();
  }
  return [pos, col, rnd];
})();

function ParticleRing({ ringState }: { ringState: RingState }) {
  const pointsRef = useRef<THREE.Points>(null);
  const uniforms = useRef({
    uProgress: { value: 0 },
    time: { value: 0 },
  });

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (pointsRef.current) pointsRef.current.rotation.y -= delta * 0.02;
    uniforms.current.time.value = state.clock.elapsedTime;

    if (ringState === "animating") {
      uniforms.current.uProgress.value = Math.min(
        1,
        uniforms.current.uProgress.value + delta * 0.35,
      );
    } else if (ringState === "visible") {
      uniforms.current.uProgress.value = 1;
    }
  });

  // The 21st.dev morph: particles rise off the orb's surface, swirl, and
  // settle into the ring as uProgress sweeps around the circumference.
  const onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uProgress = uniforms.current.uProgress;
    shader.uniforms.time = uniforms.current.time;

    shader.vertexShader = `
      uniform float uProgress;
      uniform float time;
      attribute float aRandom;
      varying float vProgress;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `
      vec3 transformed = vec3(position);

      float angle = atan(transformed.x, transformed.z);
      float normalizedAngle = abs(angle) / 3.14159265359;
      float spawnThreshold = 1.0 - normalizedAngle;

      float progressValue = (uProgress * 1.4) - spawnThreshold;
      float particleProgress = smoothstep(0.0, 0.4, progressValue);
      vProgress = particleProgress;

      transformed.y += sin(angle * 10.0 + time) * 0.05 * aRandom;

      float swirl = (1.0 - particleProgress) * 4.0;
      float s = sin(swirl);
      float c = cos(swirl);
      transformed.xz = mat2(c, -s, s, c) * transformed.xz;

      transformed.y += (1.0 - particleProgress) * (transformed.y >= 0.0 ? 1.0 : -1.0);

      vec3 orbSurface = normalize(transformed) * 2.1;
      transformed = mix(orbSurface, transformed, particleProgress);
      `,
    );

    shader.fragmentShader = `
      varying float vProgress;
      ${shader.fragmentShader}
    `.replace(
      `#include <color_fragment>`,
      `
      #include <color_fragment>
      diffuseColor.a *= vProgress;
      `,
    );
  };

  return (
    <points ref={pointsRef} rotation={[-Math.PI / 2.2, 0, 0.08]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[ringPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[ringColors, 3]} />
        <bufferAttribute attach="attributes-aRandom" args={[ringRandoms, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.009}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        onBeforeCompile={onBeforeCompile}
      />
    </points>
  );
}

/* ------------------------- drifting gold shards ------------------------- */

const SHARDS = 34;

function GoldShards({ ringState }: { ringState: RingState }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scaleRef = useRef(0);

  const shards = useMemo(
    () =>
      Array.from({ length: SHARDS }).map(() => ({
        angle: Math.random() * Math.PI * 2,
        baseRadius: 2.9 + Math.random() * 1.9,
        radialAmplitude: 0.4 + Math.random() * 1.2,
        radialSpeed: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        zOffset: (Math.random() - 0.5) * 0.7,
        speed: (0.04 + Math.random() * 0.08) * (Math.random() > 0.5 ? 1 : -1),
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        rz: Math.random() * Math.PI,
        rsx: (Math.random() - 0.5) * 0.05,
        rsy: (Math.random() - 0.5) * 0.05,
        rsz: (Math.random() - 0.5) * 0.05,
        scale: 0.02 + Math.pow(Math.random(), 4) * 0.14,
      })),
    [],
  );

  useFrame((_, rawDelta) => {
    if (!meshRef.current) return;
    // Clamp delta: huge frame gaps (background tabs) must never overshoot
    // the lerp or fling the shards.
    const delta = Math.min(rawDelta, 0.05);
    const target = ringState === "hidden" ? 0 : 1;
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      target,
      Math.min(1, delta * 2),
    );
    if (scaleRef.current < 0.01) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;

    shards.forEach((sh, i) => {
      sh.angle += sh.speed * delta;
      sh.phase += sh.radialSpeed * delta;
      let radius = sh.baseRadius + Math.sin(sh.phase) * sh.radialAmplitude;
      if (radius < 2.2) radius = 2.2 + (2.2 - radius) * 0.8;

      sh.rx += sh.rsx;
      sh.ry += sh.rsy;
      sh.rz += sh.rsz;

      dummy.position.set(
        Math.cos(sh.angle) * radius,
        Math.sin(sh.angle) * radius * 0.12 + sh.zOffset,
        Math.sin(sh.angle) * radius,
      );
      dummy.rotation.set(sh.rx, sh.ry, sh.rz);
      dummy.scale.setScalar(sh.scale * scaleRef.current);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SHARDS]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#c9a24e"
        metalness={0.85}
        roughness={0.4}
        emissive="#241a08"
        emissiveIntensity={0.5}
      />
    </instancedMesh>
  );
}

/* ------------------------------ export ------------------------------ */

export default function LunarBackground() {
  const [ringState, setRingState] = useState<RingState>("hidden");

  // The ring assembles itself shortly after arrival — the entrance beat.
  useEffect(() => {
    const t = setTimeout(() => setRingState("animating"), 700);
    return () => clearTimeout(t);
  }, []);

  // Deterministic star field.
  const stars = useMemo(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: 110 }).map(() => ({
      x: rand() * 100,
      y: rand() * 100,
      size: 0.5 + rand() * 1.4,
      opacity: 0.12 + rand() * 0.45,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#070b1c]" aria-hidden>
      {/* Deep space vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 70% at 50% 34%, #101c42 0%, #0a1330 48%, #060a1a 100%)",
        }}
      />

      {/* Stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#f3eeda]"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {/* The golden world and its forming ring */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 2.6, 12.5], fov: 45 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.25} />
          <directionalLight position={[8, 5, 5]} intensity={2} color="#fff2d0" />
          <directionalLight position={[-6, -3, -5]} intensity={0.3} color="#4a6ae2" />
          <pointLight position={[0, -4, 6]} intensity={4} color="#d8b45e" decay={0} />

          {/* The orb crowns the page; the question lives beneath it */}
          <group rotation={[Math.PI / 9, 0, 0]} position={[0, 2.55, 0]}>
            <GoldenOrb
              onIgnite={() =>
                setRingState((s) => (s === "hidden" ? "animating" : s))
              }
            />
            <ParticleRing ringState={ringState} />
            <GoldShards ringState={ringState} />
          </group>
        </Canvas>
      </div>

      {/* Horizon glow under the content */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38vh]"
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 50% 118%, rgba(216,180,94,0.14), transparent 65%)",
        }}
      />
    </div>
  );
}
