"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import KranaMix from "@/components/KranaMix";
import { PROJECTS } from "@/data/projects";
import { assetPath } from "@/lib/basePath";

const PRIORITY_ORDER = ["clarvos", "gator", "respond-ai", "ai-training"];

function CaseStudyCard({
  study,
  index,
}: {
  study: (typeof PROJECTS)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const cardTitle =
    study.slug === "miami" ? "My Wellness Research" : study.title;

  return (
    <Reveal
      delay={index * 0.08}
      className={study.featured ? "col-span-full" : ""}
    >
      <Link
        href={`/work/${study.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="block no-underline rounded-xl overflow-hidden transition-all duration-400"
        style={{
          background: "#141415",
          transform: hovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 12px 40px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Project thumbnail */}
        <div
          className="w-full flex items-center justify-center relative overflow-hidden"
          style={{
            height: study.featured ? 420 : 300,
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
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
              style={{
                transform: hovered ? "scale(1.03)" : "scale(1)",
              }}
            />
          ) : study.thumbnail ? (
            <img
              src={assetPath(study.thumbnail)}
              alt={`${study.title} — ${study.subtitle}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
              style={{
                transform: hovered ? "scale(1.03)" : "scale(1)",
              }}
            />
          ) : (
            <>
              <div
                className="absolute inset-0 transition-opacity duration-400"
                style={{
                  background: `linear-gradient(135deg, ${study.color}0a, ${study.color}20)`,
                  opacity: hovered ? 1 : 0.5,
                }}
              />
              <span className="font-sans text-[0.8rem] text-text-muted/30 tracking-[0.05em] uppercase z-10">
                Project Image
              </span>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6 pb-7">
          <div className="flex justify-between items-baseline mb-3 gap-4">
            <h3 className="text-[1.35rem] leading-[1.05] text-text-primary">
              <KranaMix text={cardTitle} className="uppercase" />
            </h3>
            <span className="font-mono text-[0.72rem] text-text-primary hidden sm:inline shrink-0">
              {study.subtitle}
            </span>
          </div>
          <p className="font-sans text-[0.92rem] leading-[1.6] text-text-secondary mb-4">
            {study.description}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {study.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[0.68rem] text-text-primary px-2 py-1 border border-border rounded-[3px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </Reveal>
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
      className="px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,7rem)] max-w-[1200px] mx-auto"
    >
      <Reveal>
        {/* No top rule here — Hero's bottom rule sits directly above us. */}
        <div className="flex justify-between items-baseline mb-10 pt-[clamp(2rem,4vh,3rem)]">
          <h2 className="font-mono text-[0.72rem] text-text-primary">
            Selected work
          </h2>
          <span className="font-mono text-[0.72rem] text-text-primary">
            {PROJECTS.length} case studies
          </span>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orderedProjects.map((study, i) => (
          <CaseStudyCard key={study.slug} study={study} index={i} />
        ))}
      </div>
    </section>
  );
}
