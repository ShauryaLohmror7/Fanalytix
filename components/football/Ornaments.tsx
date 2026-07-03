"use client";

import { useState } from "react";

/**
 * Hand-drawn gold ornaments for the Royal Gold identity.
 * GoldStatue prefers a photoreal PNG at /ornaments/statue-{side}.png when
 * one exists (drop files into public/ornaments/), and falls back to the
 * built-in engraved-SVG football monument otherwise.
 */

/** Jeweled divider: ─────◆───── */
export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-gold/70" />
      <span className="rotate-45 rounded-[1px] border border-gold-bright/70 bg-gradient-to-br from-gold-bright to-gold-deep p-[3px] shadow-[0_0_6px_rgba(216,180,94,0.6)]" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/50 to-gold/70" />
    </div>
  );
}

/** Small ✦ flourish used around headings. */
export function GoldSpark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-gold/80 ${className}`} aria-hidden>
      ✦
    </span>
  );
}

/** Engraved golden football monument on an ornate plinth (pure SVG). */
function MonumentSvg({ flip }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 420"
      className="h-full w-auto"
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <defs>
        <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d68a" />
          <stop offset="0.45" stopColor="#d8b45e" />
          <stop offset="1" stopColor="#8a6d2e" />
        </linearGradient>
        <linearGradient id="goldBall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7ac" />
          <stop offset="0.5" stopColor="#d8b45e" />
          <stop offset="1" stopColor="#7c6128" />
        </linearGradient>
        <radialGradient id="ballShine" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="rgba(255,248,220,0.9)" />
          <stop offset="0.35" stopColor="rgba(255,248,220,0.15)" />
          <stop offset="1" stopColor="rgba(255,248,220,0)" />
        </radialGradient>
      </defs>

      {/* Laurel arcs */}
      <g stroke="url(#goldV)" strokeWidth="2.5" fill="none" opacity="0.85">
        <path d="M38 150 Q18 100 52 58" />
        <path d="M162 150 Q182 100 148 58" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <path
              d={`M${40 - i * 1.5} ${142 - i * 18} q-14 -4 -18 -16 q14 -2 18 16`}
              fill="url(#goldV)"
              stroke="none"
            />
            <path
              d={`M${160 + i * 1.5} ${142 - i * 18} q14 -4 18 -16 q-14 -2 -18 16`}
              fill="url(#goldV)"
              stroke="none"
            />
          </g>
        ))}
      </g>

      {/* Golden football */}
      <circle cx="100" cy="110" r="58" fill="url(#goldBall)" />
      <circle cx="100" cy="110" r="58" fill="url(#ballShine)" />
      <g fill="#7c6128" opacity="0.85">
        {/* centre pentagon + partial neighbours = football read */}
        <polygon points="100,86 122,102 114,128 86,128 78,102" />
        <polygon points="100,55 114,64 110,80 90,80 86,64" opacity="0.55" />
        <polygon points="145,95 156,110 148,126 132,120 133,102" opacity="0.5" />
        <polygon points="55,95 67,102 68,120 52,126 44,110" opacity="0.5" />
        <polygon points="80,150 96,142 112,150 106,164 86,164" opacity="0.45" />
      </g>
      <circle
        cx="100"
        cy="110"
        r="58"
        fill="none"
        stroke="#5e4a1e"
        strokeWidth="1.5"
        opacity="0.7"
      />

      {/* Column */}
      <rect x="82" y="176" width="36" height="16" rx="3" fill="url(#goldV)" />
      <rect x="70" y="192" width="60" height="10" rx="2" fill="url(#goldV)" />
      <rect x="78" y="202" width="44" height="120" fill="url(#goldV)" />
      {/* fluting */}
      {[86, 94, 102, 110].map((x) => (
        <rect key={x} x={x} y="206" width="2.5" height="112" fill="#8a6d2e" opacity="0.5" />
      ))}
      <rect x="70" y="322" width="60" height="12" rx="2" fill="url(#goldV)" />
      <rect x="58" y="334" width="84" height="14" rx="3" fill="url(#goldV)" />
      {/* plinth gem */}
      <rect
        x="94"
        y="337"
        width="12"
        height="8"
        rx="1.5"
        fill="#1f3573"
        stroke="#f0d68a"
        strokeWidth="1"
      />
      <rect x="46" y="348" width="108" height="18" rx="3" fill="url(#goldV)" />
      <rect x="38" y="366" width="124" height="10" rx="2" fill="#8a6d2e" />

      {/* base glow */}
      <ellipse cx="100" cy="392" rx="78" ry="10" fill="rgba(216,180,94,0.14)" />
    </svg>
  );
}

/**
 * Edge statue. Drop a transparent PNG at public/ornaments/statue-left.png
 * (and statue-right.png) to replace the SVG monument automatically.
 */
export function GoldStatue({ side }: { side: "left" | "right" }) {
  const [usePng, setUsePng] = useState(true);
  return (
    <div
      className={`pointer-events-none absolute bottom-16 z-0 hidden h-[36vh] max-h-[380px] opacity-70 drop-shadow-[0_10px_30px_rgba(4,8,24,0.7)] 2xl:block ${
        side === "left" ? "left-0" : "right-0"
      }`}
      aria-hidden
    >
      {usePng ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/ornaments/statue-${side}.png`}
          alt=""
          className="h-full w-auto object-contain"
          onError={() => setUsePng(false)}
        />
      ) : (
        <MonumentSvg flip={side === "right"} />
      )}
    </div>
  );
}
