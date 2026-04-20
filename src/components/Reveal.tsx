"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// rootMargin pre-triggers the reveal well before the element enters the
// viewport, so by the time the user scrolls to it the fade has already
// finished. Threshold stays low because rootMargin is doing the work.
const REVEAL_ROOT_MARGIN = "240px 0px";
const REVEAL_THRESHOLD = 0.01;

export function useReveal(threshold = REVEAL_THRESHOLD) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Users who have reduced motion get instant visibility — no staged
    // fade at all.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin: REVEAL_ROOT_MARGIN },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible] as const;
}

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        // When settled, transform: "none" instead of translateY(0) so
        // we don't create a stacking context on every Reveal wrapper —
        // the Work-header dropdown relies on being able to stack above
        // the tile grid.
        transform: visible ? "none" : "translateY(14px)",
        transition: `opacity 0.45s cubic-bezier(0.2,0.8,0.2,1) ${delay}s, transform 0.45s cubic-bezier(0.2,0.8,0.2,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
