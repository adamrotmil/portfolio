"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Primitive } from "@/data/primitives";

export default function PrimitiveCard({
  primitive,
}: {
  primitive: Primitive;
}) {
  const { title, tag, description, why, Component, DetailComponent, id } =
    primitive;
  const hasDetail = Boolean(DetailComponent);
  const [replayKey, setReplayKey] = useState(0);
  const ref = useRef<HTMLElement>(null);

  // Auto-play on first scroll into view — each primitive renders its demo
  // when it actually becomes visible, so cards never animate off-screen.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const inner = (
    <>
      {/* Live demo stage */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "16 / 10",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), #0c0c0e",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {visible ? <Component key={replayKey} /> : null}
      </div>

      {/* Text block */}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-serif text-[1.25rem] leading-tight text-text-primary">
            {title}
          </h3>
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 font-sans text-[0.65rem] uppercase tracking-[0.12em] text-text-muted">
            {tag}
          </span>
        </div>
        <p className="font-sans text-[0.9rem] leading-[1.55] text-text-secondary">
          {description}
        </p>
        <p className="font-sans text-[0.8rem] leading-[1.55] text-text-muted">
          {why}
        </p>
        {hasDetail ? (
          <span className="mt-1 font-sans text-[0.72rem] uppercase tracking-[0.14em] text-text-muted transition-colors group-hover:text-text-secondary">
            Open lab →
          </span>
        ) : null}
      </div>
    </>
  );

  const baseClass =
    "group flex flex-col overflow-hidden rounded-[14px] border border-border bg-bg-card transition-colors";
  const interactiveClass = hasDetail
    ? " cursor-pointer hover:border-border-strong"
    : "";

  if (hasDetail) {
    return (
      <Link
        ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
        href={`/primitives/${id}`}
        className={`${baseClass}${interactiveClass}`}
        onMouseEnter={() => setReplayKey((k) => k + 1)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <article
      ref={ref}
      className={baseClass}
      onMouseEnter={() => setReplayKey((k) => k + 1)}
    >
      {inner}
    </article>
  );
}
