"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";

export default function Play() {
  return (
    // Extends the warm off-white band from Labs — Play continues the
    // "light room" of experiments/side projects before the page returns
    // to dark for About.
    <section
      id="play"
      className="w-full"
      style={{ background: "#f7f4ec", color: "#0a0a0a" }}
    >
      <div className="py-[clamp(4rem,8vh,7rem)] px-[clamp(1.5rem,4vw,4rem)] max-w-[1200px] mx-auto">
        <Reveal>
          <div
            className="flex justify-between items-baseline mb-8 pt-6"
            style={{ borderTop: "1px solid rgba(0,0,0,0.22)" }}
          >
            <h2 className="font-mono text-[0.72rem]" style={{ color: "#0a0a0a" }}>
              Play
            </h2>
            <span className="font-mono text-[0.72rem]" style={{ color: "#0a0a0a" }}>
              Small joyful side projects
            </span>
          </div>
        </Reveal>

        <Reveal>
          <p
            className="font-sans text-base leading-[1.6] max-w-[620px] mb-8"
            style={{ color: "rgba(0,0,0,0.65)" }}
          >
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
                "linear-gradient(135deg, rgba(255, 214, 102, 0.55), rgba(255, 105, 180, 0.45) 48%, rgba(125, 211, 252, 0.48))",
              boxShadow: "0 14px 40px rgba(0,0,0,0.12)",
            }}
          >
            <div
              className="p-[clamp(1.5rem,3vw,2.5rem)] rounded-[18px]"
              style={{ border: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="flex flex-wrap gap-2 mb-5">
                {["Side Project", "Pixel Game", "Built Together"].map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[0.7rem] px-3 py-1.5 rounded-full"
                    style={{
                      color: "#0a0a0a",
                      background: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(0,0,0,0.14)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr] gap-8 items-end">
                <div>
                  <h3
                    className="font-serif text-[clamp(2rem,4vw,3rem)] leading-[1.05] mb-4"
                    style={{ color: "#0a0a0a" }}
                  >
                    Scoop Stack
                  </h3>
                  <p
                    className="font-mono text-[0.85rem] leading-[1.7] max-w-[56ch]"
                    style={{ color: "rgba(0,0,0,0.7)" }}
                  >
                    A playful browser game about serving ice cream fast, with a
                    cozy retro feel and just enough chaos to make kids laugh.
                  </p>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                  <span
                    className="font-mono text-[0.72rem]"
                    style={{ color: "rgba(0,0,0,0.55)" }}
                  >
                    Open the game
                  </span>
                  <span className="flex items-center gap-3" style={{ color: "#0a0a0a" }}>
                    <span className="font-mono text-sm md:text-base">¯\_(ツ)_/¯</span>
                    <span className="font-serif text-4xl">⟶</span>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
