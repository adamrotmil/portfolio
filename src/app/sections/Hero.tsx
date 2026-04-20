import Reveal from "@/components/Reveal";
import { COMPANY_BADGES } from "@/data/about";

export default function Hero() {
  return (
    <section
      id="top"
      className="px-[clamp(1.5rem,4vw,4rem)] max-w-[1200px] mx-auto"
    >
      {/* Top rule — sits below the fixed nav, starts the first page band. */}
      <div className="pt-[clamp(5rem,10vh,7rem)]">
        <div className="border-t border-border" />
      </div>

      {/* Content band */}
      <div className="py-[clamp(3rem,7vh,5.5rem)]">
        <Reveal>
          <h1 className="font-serif text-[clamp(2.8rem,6.5vw,5.2rem)] font-normal leading-[1.08] text-text-primary max-w-[820px] tracking-[-0.03em] mb-7">
            I design products where{" "}
            <span className="hero-shimmer">intelligence</span> meets{" "}
            <span className="hero-wave">craft</span>.
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="font-mono text-[0.82rem] leading-[1.6] text-text-primary max-w-[560px] mb-8">
            Building agents that grow brands at Clarvos AI. 20 years designing
            across health tech, finance, and defense.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="font-mono text-[0.7rem] leading-[1.7] text-text-primary whitespace-nowrap overflow-hidden">
            {COMPANY_BADGES.map((name, i) => (
              <span key={name}>
                {i > 0 ? (
                  <span className="mx-2 text-text-muted">/</span>
                ) : null}
                {name}
              </span>
            ))}
          </p>
        </Reveal>
      </div>

      {/* Bottom rule — divides hero from the Work band below. */}
      <div className="border-t border-border" />
    </section>
  );
}
