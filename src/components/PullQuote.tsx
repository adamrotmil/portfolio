import Reveal from "./Reveal";

/**
 * Pull-out quote within a case study. Saol Display at a generous size,
 * no italic (we never licensed the italic cuts). A 2px top rule in
 * MICA yellow accents the block; a hairline border closes the bottom.
 */
export default function PullQuote({
  children,
  color = "#FFCB05",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Reveal>
      <blockquote
        className="font-serif text-[clamp(1.4rem,2.8vw,2rem)] font-normal leading-[1.38] text-text-primary max-w-[660px] my-12 py-8 border-b border-border"
        style={{ borderTop: `2px solid ${color}` }}
      >
        {children}
      </blockquote>
    </Reveal>
  );
}
