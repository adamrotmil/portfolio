"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COIN_ORDER, COINS, type CoinId } from "@/ticker/coins";
import { palette, TYPE, RADIUS, MOTION } from "./cdsTokens";

interface Props {
  value: CoinId;
  onChange: (id: CoinId) => void;
  accent: string;
  theme: "light" | "dark";
}

// Animated pill segmented control in CDS vocabulary.  The active background
// slides between segments, and the inactive state uses `bgTertiary` — the
// same surface CDS uses for secondary buttons.
export default function SegmentedControl({ value, onChange, accent, theme }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
  const p = palette(theme);

  useEffect(() => {
    const el = wrapRef.current?.querySelector<HTMLButtonElement>(
      `button[data-coin="${value}"]`,
    );
    if (!el) return;
    const parent = wrapRef.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({ x: r.left - parent.left, w: r.width });
  }, [value]);

  return (
    <div
      ref={wrapRef}
      role="tablist"
      aria-label="Select ticker"
      className="relative inline-flex items-center"
      style={{
        background: p.bgTertiary,
        borderRadius: RADIUS.pill,
        padding: 3,
      }}
    >
      {indicator && (
        <motion.div
          aria-hidden
          initial={false}
          animate={{ x: indicator.x, width: indicator.w }}
          transition={MOTION.spring}
          className="absolute"
          style={{
            top: 3,
            bottom: 3,
            background: accent,
            borderRadius: RADIUS.pill,
            zIndex: 0,
          }}
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
            style={{
              ...TYPE.label1,
              position: "relative",
              zIndex: 1,
              padding: "5px 14px",
              borderRadius: RADIUS.pill,
              color: active ? "#FFFFFF" : p.fgPrimary,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              minWidth: 56,
              transition: "color 160ms ease",
            }}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
