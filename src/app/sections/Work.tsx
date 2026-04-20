"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import KranaMix from "@/components/KranaMix";
import { PROJECTS } from "@/data/projects";
import { assetPath } from "@/lib/basePath";

const PRIORITY_ORDER = ["clarvos", "gator", "respond-ai", "ai-training"];

// Categories applied to case studies for the filter dropdown. A project
// can live in multiple categories if the work spans domains — AI-forward
// Gator sits in both "AI Forward" and could be argued "Medical" via HVAC
// technicians, but cleaner to keep each project in its primary home.
type Category = "AI Forward" | "Financial" | "Medical" | "Defense";
const CATEGORIES: readonly Category[] = [
  "AI Forward",
  "Financial",
  "Medical",
  "Defense",
] as const;

const PROJECT_CATEGORIES: Record<string, Category[]> = {
  clarvos: ["AI Forward"],
  "ai-training": ["AI Forward"],
  gator: ["AI Forward"],
  "respond-ai": ["AI Forward"],
  miami: ["Medical"],
  astrazeneca: ["Medical"],
  "wild-brains": ["Medical"],
  "content-studio": ["Defense"],
  "collab-match": ["Medical"],
  uscis: ["Defense"],
  vulcan: ["Defense"],
  "t-rowe-price": ["Financial"],
  benchling: ["Medical"],
  "goldman-sachs": ["Financial"],
};

const ALL_LABEL = "All Case Studies";

function CaseStudyCard({
  study,
  index,
}: {
  study: (typeof PROJECTS)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const cardTitle =
    study.slug === "miami"
      ? "My Wellness"
      : study.slug === "astrazeneca"
        ? "CARE"
        : study.title;

  // Derive a pastel footer background from each project's brand color.
  // Mixing ~16% of the brand into warm off-white gives a legible light
  // tint that distinguishes each card against the dark page bg while
  // keeping dark text readable inside.
  const cardBg = `color-mix(in srgb, ${study.color} 16%, #f7f4ec)`;
  const titleColor = "#0a0a0a";
  const bodyColor = "rgba(0, 0, 0, 0.62)";
  const borderColor = "rgba(0, 0, 0, 0.18)";

  return (
    <Reveal
      delay={index * 0.08}
      className={`h-full ${study.featured ? "col-span-full" : ""}`}
    >
      <Link
        href={`/work/${study.slug}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="block no-underline rounded-xl overflow-hidden transition-all duration-400 h-full"
        style={{
          background: cardBg,
          // Only set transform when hovered — an unconditional
          // `translateY(0)` would establish a stacking context on
          // every tile and break the Work-header dropdown overlay.
          ...(hovered ? { transform: "translateY(-4px)" } : null),
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

        {/* Content — dark text on the pastel footer bg */}
        <div className="p-6 pb-7">
          <div className="flex justify-between items-baseline mb-3 gap-4">
            <h3
              className="text-[1.35rem] leading-[1.05]"
              style={{ color: titleColor }}
            >
              <KranaMix text={cardTitle} className="uppercase" />
            </h3>
            <span
              className="font-mono text-[0.72rem] hidden sm:inline shrink-0"
              style={{ color: titleColor }}
            >
              {study.subtitle}
            </span>
          </div>
          <p
            className={`font-mono text-[0.82rem] leading-[1.7] mt-5 mb-6 ${study.featured ? "max-w-[84ch]" : "max-w-[54ch]"}`}
            style={{ color: bodyColor }}
          >
            {study.description}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {study.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[0.68rem] px-2 py-1 rounded-[3px]"
                style={{
                  color: titleColor,
                  border: `1px solid ${borderColor}`,
                }}
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

function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label = selected ?? ALL_LABEL;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full font-mono text-[0.72rem] text-text-primary transition-colors hover:text-text-secondary"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)), rgba(16, 17, 20, 0.55)",
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.14)",
          padding: "6px 12px 6px 14px",
        }}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 180ms ease",
            display: "inline-block",
            fontSize: "0.65rem",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-[60] mt-2 min-w-[11.5rem] rounded-[14px] py-1.5"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)), rgba(16, 17, 20, 0.72)",
            backdropFilter: "blur(18px) saturate(140%)",
            WebkitBackdropFilter: "blur(18px) saturate(140%)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.3)",
          }}
        >
          <DropdownItem
            label={ALL_LABEL}
            active={selected === null}
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
          />
          <div
            style={{
              height: 1,
              margin: "4px 10px",
              background: "rgba(255,255,255,0.08)",
            }}
          />
          {CATEGORIES.map((cat) => (
            <DropdownItem
              key={cat}
              label={cat}
              active={selected === cat}
              onClick={() => {
                onSelect(cat);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={active}
      className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left font-mono text-[0.72rem] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
      style={{ color: active ? "#FFCB05" : "var(--color-text-primary)" }}
    >
      <span>{label}</span>
      {active ? <span aria-hidden="true">●</span> : null}
    </button>
  );
}

export default function Work() {
  const [category, setCategory] = useState<Category | null>(null);

  const orderedProjects = [...PROJECTS].sort((a, b) => {
    const aPriority = PRIORITY_ORDER.indexOf(a.slug);
    const bPriority = PRIORITY_ORDER.indexOf(b.slug);

    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  });

  const filteredProjects = category
    ? orderedProjects.filter((p) =>
        PROJECT_CATEGORIES[p.slug]?.includes(category),
      )
    : orderedProjects;

  return (
    <section
      id="work"
      className="px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,7rem)] max-w-[1200px] mx-auto"
    >
      <Reveal>
        {/* No top rule here — Hero's bottom rule sits directly above us.
            position + z so the filter dropdown sits above the tile grid. */}
        <div className="relative z-40 flex justify-between items-center mb-10 pt-[clamp(2rem,4vh,3rem)]">
          <h2 className="font-mono text-[0.72rem] text-text-primary">
            Selected work
          </h2>
          <CategoryFilter selected={category} onSelect={setCategory} />
        </div>
      </Reveal>

      <div className="relative z-0 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {filteredProjects.map((study, i) => (
          <CaseStudyCard key={study.slug} study={study} index={i} />
        ))}
      </div>
    </section>
  );
}
