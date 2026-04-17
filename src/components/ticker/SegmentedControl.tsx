"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COIN_ORDER, COINS, type CoinId } from "@/ticker/coins";

interface Props {
  value: CoinId;
  onChange: (id: CoinId) => void;
  accent: string;
  theme: "light" | "dark";
}

// Animated pill segmented control.  The active background slides between
// segments using Motion's layoutId, which is what makes it feel iOS-y.
export default function SegmentedControl({ value, onChange, accent, theme }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  // Compute the active segment's geometry so we can place the sliding pill.
  useEffect(() => {
    const el = wrapRef.current?.querySelector<HTMLButtonElement>(
      `button[data-coin="${value}"]`,
    );
    if (!el) return;
    const parent = wrapRef.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({ x: r.left - parent.left, w: r.width });
  }, [value]);

  const track = theme === "dark" ? "#1c1c1e" : "#ededed";
  const muted = theme === "dark" ? "#8e8e93" : "#6b6b70";
  const on = "#ffffff";
  const off = theme === "dark" ? "#e5e5ea" : "#1a1a1c";

  return (
    <div
      ref={wrapRef}
      role="tablist"
      aria-label="Select ticker"
      className="relative inline-flex items-center p-1 rounded-full"
      style={{ background: track }}
    >
      {indicator && (
        <motion.div
          aria-hidden
          layout
          initial={false}
          animate={{ x: indicator.x, width: indicator.w }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="absolute top-1 bottom-1 rounded-full"
          style={{ background: accent, zIndex: 0 }}
        />
      )}
      {COIN_ORDER.map((id) => {
        const meta = COINS[id];
        const active = id === value;
        return (
          <button
            key={id}
            data-coin={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className="relative z-10 px-3 py-1 text-[11px] font-semibold rounded-full transition-colors"
            style={{
              color: active ? on : off,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              minWidth: 52,
            }}
          >
            {meta.label}
            {id === "DEMO" && (
              <span
                className="ml-1 text-[9px] font-mono"
                style={{ color: active ? "rgba(255,255,255,0.7)" : muted }}
              >
                · toy
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
