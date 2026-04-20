import Link from "next/link";
import Reveal from "@/components/Reveal";

/**
 * Minimal, conversational hero — name + role on one line, a short first-
 * person paragraph, then tagged inline links to the main sections. No
 * display headline, no company badge rail. The trend has moved toward
 * portfolios that open like a Twitter profile instead of a magazine spread.
 */

function TagLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  const className =
    "inline-flex items-center rounded-[4px] bg-bg-elevated px-2 py-0.5 font-serif italic text-text-primary no-underline transition-colors hover:bg-bg-card";
  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto max-w-[640px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,6rem)] pt-[clamp(8rem,16vh,12rem)]"
    >
      <Reveal>
        <h1 className="font-serif text-[clamp(1.6rem,2.6vw,2rem)] font-normal leading-tight text-text-primary">
          <span className="italic">Adam Rotmil</span>
          <span className="mx-3 text-text-muted">—</span>
          <span className="text-text-secondary">Senior Product Designer</span>
        </h1>
      </Reveal>

      <Reveal delay={0.08}>
        <p className="mt-8 font-serif text-[clamp(1.1rem,1.4vw,1.35rem)] leading-[1.55] text-text-secondary">
          I design AI-native products at Clarvos, now exploring roles in the
          Bay Area. Twenty years across health tech, finance, and defense.
          Taught at MICA, studied typography at Basel, and practiced sumi-e
          in Japan for five years.
        </p>
      </Reveal>

      <Reveal delay={0.16}>
        <p className="mt-6 font-serif text-[clamp(1.1rem,1.4vw,1.35rem)] leading-[1.7] text-text-secondary">
          See my <TagLink href="#work">work</TagLink>, my{" "}
          <TagLink href="/primitives">motion primitives</TagLink> lab, or reach
          me at{" "}
          <TagLink href="mailto:adam.rotmil@gmail.com" external>
            adam.rotmil@gmail.com
          </TagLink>
          .
        </p>
      </Reveal>
    </section>
  );
}
