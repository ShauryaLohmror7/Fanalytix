"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * One-time cinematic intro: concentric light-wave shader (tinted to the
 * FanalytiX gold/emerald/ice palette) behind the wordmark, then a fade
 * into the app. Plays once per session; click or key skips it.
 */
export default function IntroShader({ onDone }: { onDone: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  // Auto-finish after the beat; any interaction skips early.
  useEffect(() => {
    const finish = () => setLeaving(true);
    const timer = setTimeout(finish, 2800);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;

    // Ring-wave field, remapped from raw RGB onto brand colors:
    // gold / emerald / ice, over the dusk navy base.
    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time*0.05;
        float lineWidth = 0.002;

        vec3 ch = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            ch[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
          }
        }

        vec3 gold    = vec3(0.847, 0.706, 0.369);
        vec3 emerald = vec3(0.204, 0.827, 0.600);
        vec3 ice     = vec3(0.557, 0.702, 0.918);
        vec3 base    = vec3(0.039, 0.071, 0.188);

        vec3 color = base
          + ch.x * gold
          + ch.y * emerald * 0.55
          + ch.z * ice * 0.45;

        // Filmic-ish soft clip so hot rings glow instead of blowing out
        color = 1.0 - exp(-color * 1.15);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const camera = new THREE.Camera();
    camera.position.z = 1;

    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const onResize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.resolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
    };
    onResize();
    window.addEventListener("resize", onResize);

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animationId);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.04 : 1 }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      onAnimationComplete={() => leaving && onDone()}
      className="fixed inset-0 z-[200] cursor-pointer"
      aria-label="FanalytiX intro — click to skip"
    >
      <div ref={containerRef} className="h-full w-full overflow-hidden bg-[#0e1522]" />

      {/* Wordmark over the waves */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "0.6em", y: 8 }}
          animate={{ opacity: 1, letterSpacing: "0.3em", y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
          className="font-royal text-[clamp(28px,4.5vw,52px)] font-bold text-ink drop-shadow-[0_2px_24px_rgba(216,180,94,0.35)]"
        >
          Fanalyti<span className="text-gold-sheen">X</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-3 text-[11px] font-medium uppercase tracking-[0.5em] text-ink-dim"
        >
          Event Intelligence
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.8, delay: 2.2 }}
          className="absolute bottom-10 text-[10px] uppercase tracking-[0.3em] text-ink-faint"
        >
          Click to enter
        </motion.div>
      </div>
    </motion.div>
  );
}
