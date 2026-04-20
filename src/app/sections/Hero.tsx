import Reveal from "@/components/Reveal";

/**
 * Restrained, Micah-Carroll-style hero: name + two-line positioning on
 * the left, contact + location in mono on the right. No display
 * headline, no tagged inline pills, no company rail. The signal is
 * "here's who I am, the work is the rest of the page."
 */

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto max-w-[1400px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(5rem,10vh,8rem)] pt-[clamp(7rem,14vh,10rem)]"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-16">
        <Reveal>
          <div className="max-w-[560px]">
            <h1 className="font-sans text-[clamp(1.35rem,1.9vw,1.6rem)] font-medium leading-tight tracking-[-0.01em] text-text-primary">
              Adam Rotmil
            </h1>
            <p className="mt-3 font-sans text-[clamp(0.9rem,1vw,1rem)] leading-[1.5] text-text-secondary">
              Senior product designer building AI-native tools at Clarvos.
            </p>
            <p className="mt-1 font-sans text-[clamp(0.9rem,1vw,1rem)] leading-[1.5] text-text-muted">
              Twenty years across health tech, finance, and defense.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="text-left md:text-right">
            <a
              href="mailto:adam.rotmil@gmail.com"
              className="block font-mono text-[0.78rem] text-text-primary no-underline transition-colors hover:text-text-secondary"
            >
              adam.rotmil@gmail.com
            </a>
            <p className="mt-1 font-mono text-[0.78rem] text-text-muted">
              San Francisco, CA
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
