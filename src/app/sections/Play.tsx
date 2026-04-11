"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Play() {
  return (
    <section
      id="play"
      className="py-[clamp(4rem,8vh,7rem)] px-[clamp(1.5rem,4vw,4rem)] max-w-[1200px] mx-auto"
    >
      <Reveal>
        <div className="flex justify-between items-baseline mb-8 border-t border-border pt-8">
          <h2 className="font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-text-primary">
            Play
          </h2>
          <span className="font-sans text-[0.8rem] text-text-muted">
            Small joyful side projects
          </span>
        </div>
      </Reveal>

      <Reveal>
        <p className="font-sans text-base text-text-secondary leading-[1.6] max-w-[620px] mb-8">
          Not everything is about career. This one is a tiny pixel-art ice
          cream game I made with my daughter, who is eight. Getting her into
          Claude Code and Codex early!
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <Link
          href="/ice-cream"
          className="block no-underline rounded-[18px] overflow-hidden transition-transform duration-300 hover:-translate-y-1"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 214, 102, 0.22), rgba(255, 105, 180, 0.16) 48%, rgba(125, 211, 252, 0.16))",
            boxShadow: "0 14px 40px rgba(0,0,0,0.22)",
          }}
        >
          <div className="p-[clamp(1.5rem,3vw,2.5rem)] border border-[rgba(255,255,255,0.08)] rounded-[18px]">
            <div className="flex flex-wrap gap-2 mb-5">
              {["Side Project", "Pixel Game", "Built Together"].map((tag) => (
                <span
                  key={tag}
                  className="font-sans text-[0.72rem] text-text-primary px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(10,10,11,0.35)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-8 items-end">
              <div>
                <h3 className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.05] text-text-primary mb-4">
                  Scoop Stack
                </h3>
                <p className="font-sans text-[1rem] leading-[1.7] text-text-secondary max-w-[640px]">
                  A playful browser game about serving ice cream fast, with a
                  cozy retro feel and just enough chaos to make kids laugh.
                </p>
              </div>

              <div className="flex flex-col md:items-end gap-3">
                <span className="font-sans text-[0.78rem] uppercase tracking-[0.08em] text-text-muted">
                  Open the game
                </span>
                <span className="font-serif text-4xl text-text-primary">{"->"}</span>
              </div>
            </div>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}
