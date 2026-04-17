"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { LAB_ITEMS } from "@/data/about";
import { assetPath } from "@/lib/basePath";
import FoothillsModal from "@/components/foothills/FoothillsModal";
import RemoteFlightModal from "@/components/watchrc/RemoteFlightModal";
import TickerSandboxModal from "@/components/ticker/TickerSandboxModal";

export default function Lab() {
  const [foothillsOpen, setFoothillsOpen] = useState(false);
  const [watchrcOpen, setWatchrcOpen] = useState(false);
  const [tickerOpen, setTickerOpen] = useState(false);

  return (
    <section
      id="lab"
      className="py-[clamp(4rem,8vh,7rem)] px-[clamp(1.5rem,4vw,4rem)] max-w-[1200px] mx-auto"
    >
      <Reveal>
        <div className="flex justify-between items-baseline mb-8 border-t border-border pt-8">
          <h2 className="font-serif text-[clamp(1.8rem,3vw,2.4rem)] font-normal text-text-primary">
            Lab
          </h2>
          <a
            href="https://github.com/adamrotmil"
            target="_blank"
            rel="noopener"
            className="font-sans text-[0.8rem] text-text-muted no-underline hover:text-text-primary transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </Reveal>

      <Reveal>
        <p className="font-sans text-base text-text-secondary leading-[1.6] max-w-[520px] mb-8">
          Experiments in code, design, and AI. Small tools, native interaction
          studies, and interactive pieces I build in public while learning new
          platforms.
        </p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {LAB_ITEMS.map((item, i) => {
          const clickable = Boolean(item.url || item.action);
          return (
            <Reveal key={i} delay={i * 0.08}>
              <div
                className="group overflow-hidden rounded-[12px] flex flex-col transition-transform duration-300 cursor-default"
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
                  } else if (item.url) {
                    window.open(item.url, "_blank");
                  }
                }}
              >
                {/* Thumbnail — real captured screens rendered as SVG so they
                    scale cleanly at any card width. Placeholder tile for
                    items that don't have one yet. */}
                <div
                  className="relative w-full overflow-hidden"
                  style={{
                    aspectRatio: "4 / 3",
                    background: item.thumbnail
                      ? "#0A0B0D"
                      : clickable
                        ? "#e5e5e5"
                        : "#1e1e1f",
                    borderBottom: clickable
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {item.thumbnail ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={assetPath(item.thumbnail)}
                      alt=""
                      className="w-full h-full block object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
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

                {/* Text block */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h4
                      className="font-serif text-[1.15rem] font-normal mb-1.5 leading-tight"
                      style={{
                        color: clickable ? "#1a1a1a" : "var(--color-text-muted)",
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      className="font-sans text-[0.85rem] leading-[1.5]"
                      style={{
                        color: clickable
                          ? "rgba(0,0,0,0.55)"
                          : "var(--color-text-muted)",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <p
                    className="font-sans text-[0.7rem]"
                    style={{
                      color: clickable
                        ? "rgba(0,0,0,0.35)"
                        : "var(--color-text-muted)",
                      letterSpacing: 0.2,
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
    </section>
  );
}
