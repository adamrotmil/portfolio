"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Reveal from "@/components/Reveal";
import { LAB_ITEMS } from "@/data/about";
import { assetPath } from "@/lib/basePath";
import FoothillsModal from "@/components/foothills/FoothillsModal";
import RemoteFlightModal from "@/components/watchrc/RemoteFlightModal";
import TickerSandboxModal from "@/components/ticker/TickerSandboxModal";
import TableModal from "@/components/table/TableModal";
import SvgMorph from "@/components/primitives/demos/SvgMorph";
import KranaMix from "@/components/KranaMix";

export default function Lab() {
  const router = useRouter();
  const [foothillsOpen, setFoothillsOpen] = useState(false);
  const [watchrcOpen, setWatchrcOpen] = useState(false);
  const [tickerOpen, setTickerOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);

  return (
    // Full-viewport warm off-white band. Labs lives as a "light room"
    // inside the otherwise dark page, signalling a shift in context
    // from case studies → experiments. The base color #f7f4ec matches
    // the paper tone the Work cards' pastel footers mix toward, so
    // the transition reads as walking from dark hall into a warmer
    // lit space rather than a hard palette break.
    <section
      id="lab"
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
              Labs
            </h2>
            <a
              href="https://github.com/adamrotmil"
              target="_blank"
              rel="noopener"
              className="font-mono text-[0.72rem] no-underline transition-colors"
              style={{ color: "#0a0a0a" }}
            >
              GitHub ↗
            </a>
          </div>
        </Reveal>

        <Reveal>
          <p
            className="font-mono text-[0.82rem] leading-[1.7] max-w-[66%] mb-8"
            style={{ color: "#0a0a0a" }}
          >
            Experiments in code, design, and AI. Small tools, native interaction
            studies, and interactive pieces I build in public while learning
            new platforms.
          </p>
        </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {LAB_ITEMS.map((item, i) => {
          const clickable = Boolean(item.url || item.action || item.href);
          return (
            <Reveal key={i} delay={i * 0.08} className="h-full">
              <div
                className="group h-full overflow-hidden rounded-[12px] flex flex-col transition-transform duration-300 cursor-default"
                style={{
                  background: clickable ? "#f5f5f5" : "#141415",
                  cursor: clickable ? "pointer" : "default",
                  border: clickable ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.04)",
                }}
                onMouseEnter={(e) => {
                  if (clickable)
                    e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onClick={() => {
                  if (item.action === "foothills") {
                    setFoothillsOpen(true);
                  } else if (item.action === "watchrc") {
                    setWatchrcOpen(true);
                  } else if (item.action === "ticker") {
                    setTickerOpen(true);
                  } else if (item.action === "table") {
                    setTableOpen(true);
                  } else if (item.href) {
                    router.push(item.href);
                  } else if (item.url) {
                    window.open(item.url, "_blank");
                  }
                }}
              >
                {/* Thumbnail.  4:3 lockup on every card — real captured
                    views for the sandboxes, gradient+glyph compositions
                    for the link-out tiles, or a live animated component
                    for motion primitives.  All SVG/CSS so they stay crisp. */}
                <div
                  className="relative w-full overflow-hidden shrink-0"
                  style={{
                    aspectRatio: "4 / 3",
                    background:
                      item.liveThumbnail || item.thumbnail
                        ? "#0A0B0D"
                        : clickable
                          ? "#e5e5e5"
                          : "#1e1e1f",
                    borderBottom: clickable
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {item.liveThumbnail === "primitives" ? (
                    <SvgMorph />
                  ) : item.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={assetPath(item.thumbnail)}
                      alt=""
                      className="w-full h-full block object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-sans text-[0.7rem]"
                      style={{
                        color: clickable ? "rgba(0,0,0,0.25)" : "var(--color-text-muted)",
                      }}
                    >
                      {item.title}
                    </div>
                  )}
                </div>

                {/* Text block — min-height keeps every card the same tall,
                    while line-clamp-3 caps the description so longer copy
                    doesn't stretch any one tile. */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h4
                      className="text-[1.05rem] leading-[1.05] mb-2"
                      style={{
                        color: clickable ? "#1a1a1a" : "#f5f5f5",
                      }}
                    >
                      <KranaMix text={item.title} className="uppercase" />
                    </h4>
                    <p
                      className="font-mono text-[0.78rem] leading-[1.7] max-w-[40ch] mt-4 mb-5"
                      style={{
                        color: clickable
                          ? "rgba(0,0,0,0.62)"
                          : "var(--color-text-muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <p
                    className="font-mono text-[0.68rem]"
                    style={{
                      color: clickable ? "#1a1a1a" : "#f5f5f5",
                    }}
                  >
                    {item.tech}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
        </div>
      </div>

      <FoothillsModal
        open={foothillsOpen}
        onClose={() => setFoothillsOpen(false)}
      />
      <RemoteFlightModal
        open={watchrcOpen}
        onClose={() => setWatchrcOpen(false)}
      />
      <TickerSandboxModal
        open={tickerOpen}
        onClose={() => setTickerOpen(false)}
      />
      <TableModal open={tableOpen} onClose={() => setTableOpen(false)} />
    </section>
  );
}
