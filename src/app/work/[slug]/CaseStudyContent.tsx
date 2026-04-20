"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, ProjectSection } from "@/data/projects";
import { assetPath } from "@/lib/basePath";
import Nav from "@/components/Nav";
import ProgressBar from "@/components/ProgressBar";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import PullQuote from "@/components/PullQuote";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Counter from "@/components/Counter";
import PhoneFrame from "@/components/PhoneFrame";
import BrowserFrame from "@/components/BrowserFrame";
import KranaMix from "@/components/KranaMix";

/**
 * Case study content — extended design language from the homepage:
 *
 * - Saol Display for hero title + section headings (no italic)
 * - Saol Text body copy at text-text-primary (brighter than before)
 * - Monospace for structural labels: breadcrumbs, meta rows, tags,
 *   section kickers
 * - Krana Fat A/B mix for NEXT project title (callback to homepage
 *   Work tile titles)
 * - MICA yellow #FFCB05 as the single accent: pull-quote rule,
 *   hover/hover-inflected affordances, progress bar tint
 * - Basel hairline rules between sections
 * - The charcoal page bg carries through; the outcome section lifts
 *   to bg-card for gentle shift in "room"
 */

const YELLOW = "#FFCB05";

function RenderSection({ section }: { section: ProjectSection }) {
  switch (section.type) {
    case "text":
      return (
        <section className="max-w-[740px] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[clamp(2rem,4vh,3rem)]">
          {section.sectionNumber && section.sectionLabel && (
            <SectionLabel
              number={section.sectionNumber}
              title={section.sectionLabel}
            />
          )}
          {section.heading && (
            <Reveal>
              <h2 className="font-serif text-[clamp(1.7rem,3vw,2.3rem)] font-normal leading-[1.2] text-text-primary mb-6">
                {section.heading}
              </h2>
            </Reveal>
          )}
          {section.body?.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className="font-sans text-[1.02rem] leading-[1.72] text-text-primary mb-5">
                {p}
              </p>
            </Reveal>
          ))}
        </section>
      );

    case "quote":
      return (
        <div className="max-w-[740px] mx-auto px-[clamp(1.5rem,4vw,4rem)]">
          <PullQuote>{section.quote}</PullQuote>
        </div>
      );

    case "stats":
      return (
        <section className="bg-bg-card py-[clamp(3rem,6vh,5rem)] px-[clamp(1.5rem,4vw,4rem)] border-y border-border">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {section.stats?.map((s, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <p className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] text-text-primary font-normal leading-none mb-3 tabular-nums">
                    <Counter value={s.number} suffix={s.suffix} />
                  </p>
                  <p className="font-mono text-[0.72rem] text-text-secondary leading-[1.4]">
                    {s.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      );

    case "images":
      if (!section.images) return null;

      if (section.layout === "phone-gallery") {
        return (
          <section className="bg-bg-card py-[clamp(3rem,8vh,5rem)] px-[clamp(1.5rem,4vw,4rem)]">
            <div className="max-w-[960px] mx-auto flex flex-col items-center gap-[clamp(2rem,4vw,3rem)] sm:flex-row sm:justify-center sm:items-start">
              {section.images.map((img, i) => (
                <Reveal key={i} delay={i * 0.12}>
                  <div className="w-[240px] sm:flex-1 sm:min-w-0 sm:max-w-[280px] sm:w-auto">
                    <PhoneFrame src={img.src!} alt={img.label} />
                  </div>
                </Reveal>
              ))}
            </div>
          </section>
        );
      }

      if (section.layout === "desktop-showcase") {
        return (
          <section className="bg-bg-card py-[clamp(3rem,8vh,5rem)] px-[clamp(1.5rem,4vw,4rem)]">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-[clamp(1.5rem,3vw,2.5rem)]">
              {section.images.length === 1 && (
                <Reveal>
                  <BrowserFrame
                    src={section.images[0].src!}
                    alt={section.images[0].label}
                  />
                </Reveal>
              )}
              {section.images.length === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.5rem,3vw,2.5rem)]">
                  {section.images.map((img, i) => (
                    <Reveal key={i} delay={i * 0.12}>
                      <BrowserFrame src={img.src!} alt={img.label} />
                    </Reveal>
                  ))}
                </div>
              )}
              {section.images.length >= 3 && (
                <>
                  <Reveal>
                    <BrowserFrame
                      src={section.images[0].src!}
                      alt={section.images[0].label}
                    />
                  </Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.5rem,3vw,2.5rem)]">
                    {section.images.slice(1).map((img, i) => (
                      <Reveal key={i} delay={(i + 1) * 0.1}>
                        <BrowserFrame src={img.src!} alt={img.label} />
                      </Reveal>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      }

      if (section.layout === "photo-grid") {
        return (
          <section className="bg-bg-card py-[clamp(3rem,8vh,5rem)] px-[clamp(1.5rem,4vw,4rem)]">
            <div className="max-w-[1200px] mx-auto flex flex-col gap-[clamp(1.5rem,3vw,2.5rem)]">
              {section.images.length === 1 && (
                <Reveal>
                  <ImagePlaceholder
                    height={section.images[0].height || 480}
                    label={section.images[0].label}
                    src={section.images[0].src}
                    objectPosition={section.images[0].objectPosition}
                  />
                </Reveal>
              )}
              {section.images.length === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.5rem,3vw,2.5rem)]">
                  {section.images.map((img, i) => (
                    <Reveal key={i} delay={i * 0.12}>
                      <ImagePlaceholder
                        height={img.height || 360}
                        label={img.label}
                        src={img.src}
                        objectPosition={img.objectPosition}
                      />
                    </Reveal>
                  ))}
                </div>
              )}
              {section.images.length >= 3 && (
                <>
                  <Reveal>
                    <ImagePlaceholder
                      height={section.images[0].height || 480}
                      label={section.images[0].label}
                      src={section.images[0].src}
                      objectPosition={section.images[0].objectPosition}
                    />
                  </Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(1.5rem,3vw,2.5rem)]">
                    {section.images.slice(1).map((img, i) => (
                      <Reveal key={i} delay={(i + 1) * 0.1}>
                        <ImagePlaceholder
                          height={img.height || 360}
                          label={img.label}
                          src={img.src}
                          objectPosition={img.objectPosition}
                        />
                      </Reveal>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      }

      // Default grid layout
      const imgs = section.images;
      return (
        <div className="max-w-[1200px] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-4">
          {imgs.length === 1 && (
            <Reveal>
              <ImagePlaceholder
                height={imgs[0].height || 480}
                label={imgs[0].label}
                dark={imgs[0].dark}
                src={imgs[0].src}
                objectPosition={imgs[0].objectPosition}
              />
            </Reveal>
          )}
          {imgs.length === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {imgs.map((img, i) => (
                <Reveal key={i} delay={i * 0.1}>
                  <ImagePlaceholder
                    height={img.height || 360}
                    label={img.label}
                    dark={img.dark}
                    src={img.src}
                    objectPosition={img.objectPosition}
                  />
                </Reveal>
              ))}
            </div>
          )}
          {imgs.length === 3 && (
            <>
              <Reveal>
                <ImagePlaceholder
                  height={imgs[0].height || 520}
                  label={imgs[0].label}
                  dark={imgs[0].dark}
                  src={imgs[0].src}
                  objectPosition={imgs[0].objectPosition}
                />
              </Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {imgs.slice(1).map((img, i) => (
                  <Reveal key={i} delay={(i + 1) * 0.1}>
                    <ImagePlaceholder
                      height={img.height || 360}
                      label={img.label}
                      dark={img.dark}
                      src={img.src}
                      objectPosition={img.objectPosition}
                    />
                  </Reveal>
                ))}
              </div>
            </>
          )}
          {imgs.length === 4 && (
            <>
              <Reveal>
                <ImagePlaceholder
                  height={imgs[0].height || 540}
                  label={imgs[0].label}
                  dark={imgs[0].dark}
                  src={imgs[0].src}
                  objectPosition={imgs[0].objectPosition}
                />
              </Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                {imgs.slice(1).map((img, i) => (
                  <Reveal key={i} delay={(i + 1) * 0.08}>
                    <ImagePlaceholder
                      height={img.height || 280}
                      label={img.label}
                      dark={img.dark}
                      src={img.src}
                      objectPosition={img.objectPosition}
                    />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      );

    case "image-text":
      return (
        <section className="max-w-[1200px] mx-auto px-[clamp(1.5rem,4vw,4rem)] py-[clamp(2rem,4vh,3rem)]">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(2rem,4vw,4rem)] items-center"
            style={{
              direction: section.imagePosition === "left" ? "ltr" : "rtl",
            }}
          >
            <Reveal>
              <div style={{ direction: "ltr" }}>
                <ImagePlaceholder
                  height={section.images?.[0]?.height || 480}
                  label={section.images?.[0]?.label || "Project Image"}
                  src={section.images?.[0]?.src}
                  objectPosition={section.images?.[0]?.objectPosition}
                />
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div style={{ direction: "ltr" }}>
                {section.sectionNumber && section.sectionLabel && (
                  <SectionLabel
                    number={section.sectionNumber}
                    title={section.sectionLabel}
                  />
                )}
                {section.heading && (
                  <h2 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] font-normal leading-[1.2] text-text-primary mb-5">
                    {section.heading}
                  </h2>
                )}
                {section.body?.map((p, i) => (
                  <p
                    key={i}
                    className="font-sans text-[1.02rem] leading-[1.72] text-text-primary mb-5"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      );

    case "video": {
      const isControlled = section.videoControls ?? false;

      if (section.layout === "phone-gallery") {
        return (
          <section className="bg-bg-card py-[clamp(3rem,8vh,5rem)] px-[clamp(1.5rem,4vw,4rem)]">
            <div className="max-w-[1200px] mx-auto flex justify-center">
              <Reveal>
                <video
                  src={assetPath(section.videoSrc || "")}
                  autoPlay={!isControlled}
                  loop={!isControlled}
                  muted={!isControlled}
                  controls={isControlled}
                  poster={section.videoPoster ? assetPath(section.videoPoster) : undefined}
                  playsInline
                  preload="metadata"
                  className="h-auto block max-h-[80vh] rounded-[12px]"
                  style={{ minHeight: "200px" }}
                />
              </Reveal>
            </div>
          </section>
        );
      }
      if (section.layout === "desktop-showcase") {
        return (
          <section className="bg-bg-card py-[clamp(3rem,8vh,5rem)] px-[clamp(1.5rem,4vw,4rem)]">
            <div className="max-w-[1200px] mx-auto">
              <Reveal>
                <div className="bg-bg-elevated rounded-[12px] shadow-[0_16px_48px_rgba(0,0,0,0.35)] overflow-hidden border border-border">
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="flex gap-[6px]">
                      <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
                      <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
                      <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="rounded-md px-4 py-1 text-[11px] font-mono max-w-[260px] truncate text-center" style={{ background: "rgba(0,0,0,0.35)", color: "rgba(255,255,255,0.55)" }}>
                        {section.videoLabel || "Video"}
                      </div>
                    </div>
                    <div className="w-[54px]" />
                  </div>
                  <video
                    src={assetPath(section.videoSrc || "")}
                    autoPlay={!isControlled}
                    loop={!isControlled}
                    muted={!isControlled}
                    controls={isControlled}
                    poster={section.videoPoster ? assetPath(section.videoPoster) : undefined}
                    playsInline
                    preload="metadata"
                    className="w-full h-auto block"
                  />
                </div>
              </Reveal>
            </div>
          </section>
        );
      }
      return (
        <section className="bg-bg-card">
          <div className="max-w-[1200px] mx-auto" style={{ aspectRatio: "16/9" }}>
            <Reveal>
              <video
                src={assetPath(section.videoSrc || "")}
                autoPlay={!isControlled}
                loop={!isControlled}
                muted={!isControlled}
                controls={isControlled}
                poster={section.videoPoster ? assetPath(section.videoPoster) : undefined}
                playsInline
                preload="metadata"
                className="w-full h-auto block"
              />
            </Reveal>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}

function NextProject({ next }: { next: Project["nextProject"] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/work/${next.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block no-underline py-[clamp(4rem,8vh,6rem)] px-[clamp(1.5rem,4vw,4rem)] transition-colors duration-400"
      style={{
        background: hovered ? "var(--color-bg-card)" : "transparent",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-8">
        <div>
          <p className="font-mono text-[0.72rem] text-text-primary mb-4">
            Next project
          </p>
          <h3
            className="text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1.02] text-text-primary transition-opacity duration-300"
            style={{ opacity: hovered ? 0.75 : 1 }}
          >
            <KranaMix text={next.title} className="uppercase" />
          </h3>
          <p className="font-mono text-[0.76rem] text-text-secondary mt-3">
            {next.subtitle}
          </p>
        </div>
        <span
          className="font-serif text-[clamp(2.4rem,4vw,3.2rem)] transition-all duration-400"
          style={{
            transform: hovered ? "translateX(8px)" : "translateX(0)",
            color: hovered ? YELLOW : "var(--color-text-muted)",
          }}
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </Link>
  );
}

export default function CaseStudyContent({ project }: { project: Project }) {
  return (
    <div className="min-h-screen">
      <ProgressBar color={YELLOW} />
      <Nav />

      {/* Hero */}
      <section className="pt-[clamp(7rem,14vh,10rem)]">
        <div className="max-w-[1200px] mx-auto px-[clamp(1.5rem,4vw,4rem)]">
          {/* Breadcrumb */}
          <Reveal>
            <nav className="font-mono text-[0.72rem] text-text-muted mb-10">
              <Link
                href="/#work"
                className="transition-colors hover:text-text-primary"
              >
                Work
              </Link>
              <span className="mx-2 opacity-60">/</span>
              <span className="text-text-secondary">{project.title}</span>
            </nav>
          </Reveal>

          {/* Basel rule */}
          <div className="border-t border-border" />

          <div className="pt-10 pb-12">
            {/* Tags */}
            <Reveal delay={0.04}>
              <div className="flex gap-1.5 flex-wrap mb-8">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[0.68rem] text-text-primary px-2 py-1 border border-border rounded-[3px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="font-serif text-[clamp(2.8rem,6.5vw,5.2rem)] font-normal leading-[1.04] tracking-[-0.03em] text-text-primary mb-8 max-w-[900px]">
                {project.title}
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="font-sans text-[clamp(1.05rem,1.35vw,1.22rem)] leading-[1.55] text-text-primary max-w-[640px] mb-12">
                {project.description}
              </p>
            </Reveal>

            {/* Meta grid */}
            <Reveal delay={0.2}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-border">
                {project.meta.map((item) => (
                  <div key={item.label}>
                    <p className="font-mono text-[0.68rem] text-text-muted mb-2">
                      {item.label}
                    </p>
                    <p className="font-mono text-[0.85rem] text-text-primary leading-[1.4]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Hero image */}
        <Reveal delay={0.26}>
          <div className="max-w-[1200px] mx-auto mt-6 px-[clamp(1.5rem,4vw,4rem)]">
            <ImagePlaceholder
              height={560}
              label={`${project.title} — Hero Shot`}
              dark
              src={project.heroImage}
              objectPosition={project.heroObjectPosition}
            />
          </div>
        </Reveal>
      </section>

      {/* Content sections */}
      <div className="py-[clamp(2rem,4vh,4rem)]">
        {project.sections.map((section, i) => (
          <RenderSection key={i} section={section} />
        ))}
      </div>

      {/* Outcome */}
      <section className="bg-bg-card border-y border-border py-[clamp(4rem,10vh,7rem)] px-[clamp(1.5rem,4vw,4rem)]">
        <div className="max-w-[740px] mx-auto">
          <SectionLabel number="✦" title="Outcome" />
          <Reveal>
            <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.6rem)] font-normal leading-[1.2] text-text-primary mb-6">
              {project.outcome.heading}
            </h2>
          </Reveal>
          {project.outcome.body.map((p, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <p className="font-sans text-[1.02rem] leading-[1.72] text-text-primary mb-5">
                {p}
              </p>
            </Reveal>
          ))}

          <Reveal delay={0.2}>
            <div className="flex gap-8 flex-wrap pt-8 border-t border-border mt-10">
              {[
                {
                  label: "My contribution",
                  items: project.outcome.contributions,
                },
                {
                  label:
                    project.slug === "gator" ? "Deliverables" : "Collaborators",
                  items: project.outcome.collaborators,
                },
                { label: "Tools", items: project.outcome.tools },
              ].map((col, i) => (
                <div key={i} className="flex-1 min-w-[180px]">
                  <p className="font-mono text-[0.68rem] text-text-muted mb-3">
                    {col.label}
                  </p>
                  {col.items.map((item, j) => (
                    <p
                      key={j}
                      className="font-mono text-[0.78rem] text-text-primary leading-[1.75]"
                    >
                      {item}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <NextProject next={project.nextProject} />
    </div>
  );
}
