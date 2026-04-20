"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { PROJECTS } from "@/data/projects";
import { assetPath } from "@/lib/basePath";

const PRIORITY_ORDER = ["clarvos", "gator", "respond-ai", "ai-training"];

/**
 * Auto-rotating image sequence for tiles that supply thumbnailSequence.
 * Short crossfade, respects prefers-reduced-motion, shuts off on single-
 * source tiles.
 */
function SequenceImage({
  sources,
  alt,
  scale,
}: {
  sources: string[];
  alt: string;
  scale: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (sources.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % sources.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [sources.length]);

  return (
    <>
      {sources.map((src, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={src}
          src={assetPath(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === index ? 1 : 0,
            transform: `scale(${scale})`,
            transition:
              "opacity 500ms ease-out, transform 500ms cubic-bezier(0.2,0.8,0.2,1)",
          }}
        />
      ))}
    </>
  );
}

function WorkTile({ study }: { study: (typeof PROJECTS)[0] }) {
  const [hovered, setHovered] = useState(false);
  const cardTitle =
    study.slug === "miami" ? "My Wellness Research" : study.title;
  const category = study.thumbnailCategory ?? study.subtitle;
  const scale = hovered ? 1.02 : 1;
  const sources =
    study.thumbnailSequence && study.thumbnailSequence.length > 0
      ? study.thumbnailSequence
      : study.thumbnail
        ? [study.thumbnail]
        : [];
  const dateLabel = study.date ?? "";

  return (
    <Link
      href={`/work/${study.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block no-underline"
    >
      <div
        className="relative w-full overflow-hidden rounded-[4px]"
        style={{
          aspectRatio: "4 / 3",
          background: `linear-gradient(135deg, ${study.color}15, ${study.color}08)`,
        }}
      >
        {study.thumbnailVideo ? (
          <video
            src={assetPath(study.thumbnailVideo)}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: `scale(${scale})` }}
          />
        ) : sources.length > 0 ? (
          <SequenceImage
            sources={sources}
            alt={`${study.title} — ${study.subtitle}`}
            scale={scale}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${study.color}18, ${study.color}08)`,
            }}
          >
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-text-muted/40">
              {cardTitle}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[0.72rem] text-text-muted">
          {dateLabel}
        </span>
        <span className="text-right font-sans text-[0.92rem] font-medium text-text-primary">
          <span>{cardTitle}</span>
          <span className="mx-2 font-normal text-text-muted">|</span>
          <span className="font-normal text-text-secondary">{category}</span>
        </span>
      </div>
    </Link>
  );
}

export default function Work() {
  const orderedProjects = [...PROJECTS].sort((a, b) => {
    const aPriority = PRIORITY_ORDER.indexOf(a.slug);
    const bPriority = PRIORITY_ORDER.indexOf(b.slug);
    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  });

  return (
    <section
      id="work"
      className="mx-auto max-w-[1400px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,7rem)] pt-[clamp(2rem,4vh,4rem)]"
    >
      <Reveal>
        <div className="mb-8 flex items-baseline justify-between">
          <span className="font-mono text-[0.72rem] text-text-muted">
            Recent work
          </span>
          <span className="font-mono text-[0.72rem] text-text-muted">
            {PROJECTS.length} case studies
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
        {orderedProjects.map((study, i) => (
          <Reveal key={study.slug} delay={Math.min(i * 0.04, 0.24)}>
            <WorkTile study={study} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
