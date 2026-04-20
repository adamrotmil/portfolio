"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { PROJECTS } from "@/data/projects";
import { assetPath } from "@/lib/basePath";

const PRIORITY_ORDER = ["clarvos", "gator", "respond-ai", "ai-training"];

/**
 * Auto-rotating image sequence with a short crossfade. The tile owns
 * the rotation interval, pauses when reduced motion is preferred, and
 * simply renders a single <img> when only one image is supplied.
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
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out"
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

function WorkTile({
  study,
  aspect,
}: {
  study: (typeof PROJECTS)[0];
  aspect: string;
}) {
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

  return (
    <Link
      href={`/work/${study.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="mb-8 block break-inside-avoid no-underline"
    >
      <div
        className="relative w-full overflow-hidden rounded-[10px]"
        style={{
          aspectRatio: aspect,
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
            <span className="font-sans text-[0.72rem] uppercase tracking-[0.14em] text-text-muted/40">
              {cardTitle}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-4 px-0.5">
        <h3 className="font-serif text-[1.15rem] font-normal leading-tight text-text-primary">
          {cardTitle}
        </h3>
        <span className="font-sans text-[0.78rem] text-text-muted">
          {category}
        </span>
      </div>
    </Link>
  );
}

// Aspect ratios chosen to give the mason layout visual rhythm — some
// wide landscape, some squarer, so CSS multi-column produces natural
// offsets between the two columns. The map is keyed by slug so it's
// easy to tune per-project as we iterate.
const TILE_ASPECTS: Record<string, string> = {
  clarvos: "16 / 11",
  gator: "4 / 5",
  "respond-ai": "16 / 11",
  "ai-training": "4 / 5",
  miami: "16 / 11",
  astrazeneca: "4 / 5",
  "wild-brains": "16 / 11",
  "content-studio": "4 / 5",
  "collab-match": "16 / 11",
  uscis: "4 / 5",
};

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
      className="mx-auto max-w-[1200px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,7rem)] pt-[clamp(3rem,6vh,5rem)]"
    >
      <Reveal>
        <div className="mb-12 flex items-baseline justify-between">
          <h2 className="font-serif text-[clamp(1rem,1.2vw,1.1rem)] font-normal uppercase tracking-[0.18em] text-text-muted">
            Work
          </h2>
          <span className="font-sans text-[0.78rem] text-text-muted">
            {PROJECTS.length} case studies
          </span>
        </div>
      </Reveal>

      <div
        className="md:columns-2 md:gap-8"
        style={{ columnFill: "balance" }}
      >
        {orderedProjects.map((study, i) => (
          <Reveal key={study.slug} delay={Math.min(i * 0.04, 0.24)}>
            <WorkTile
              study={study}
              aspect={TILE_ASPECTS[study.slug] ?? "4 / 3"}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
