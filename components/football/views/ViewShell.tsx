"use client";

import { motion } from "framer-motion";

/** Shared full-width view wrapper with broadcast header styling. */
export default function ViewShell({
  title,
  subtitle,
  badge,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="panel flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-6 py-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-royal text-[15px] font-bold tracking-[0.16em] text-gold-sheen">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 text-[11.5px] text-ink-dim">{subtitle}</p>
            )}
          </div>
          {badge}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
    </motion.section>
  );
}

/** Consistent honest placeholder for capabilities shipping in a later phase. */
export function PhaseNote({ text }: { text: string }) {
  return (
    <div className="mx-6 my-4 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-3 text-[12px] leading-relaxed text-ink-dim">
      {text}
    </div>
  );
}

export function SimulatedBadge() {
  return (
    <span className="flex items-center gap-1 rounded-full border border-warn/25 bg-warn/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-warn">
      SIMULATED
    </span>
  );
}
