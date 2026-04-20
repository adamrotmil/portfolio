/**
 * Splits a string into per-letter spans, alternating Krana Fat A
 * (condensed) and Krana Fat B (extended) across the characters. This is
 * the "irregular widths" effect Schick-Toikka designed the pair for —
 * see the Die Zeitschrift der Strasse specimen for the reference usage.
 *
 * Pattern is a string of "A" / "B" characters, cycled through the text.
 * Spaces pass through untouched so word boundaries stay clean.
 *
 * Usage:
 *   <KranaMix text="Adam Rotmil" pattern="ABBAA BABAB" />
 *   <KranaMix text="Selected Work" />  // defaults to alternating A/B
 */

export default function KranaMix({
  text,
  pattern,
  className = "",
}: {
  text: string;
  pattern?: string;
  className?: string;
}) {
  // Strip whitespace from the pattern so a pattern like "ABBAA BABAB"
  // aligns to letters across word boundaries without leaking spaces
  // into the cycle.
  const letters = (pattern ?? "AB").replace(/\s+/g, "");
  let cursor = 0;

  return (
    <span className={className}>
      {Array.from(text).map((ch, i) => {
        if (ch === " ") return <span key={i}>&nbsp;</span>;
        const variant = letters[cursor % letters.length];
        cursor += 1;
        return (
          <span
            key={i}
            className={variant === "B" ? "font-krana-b" : "font-krana-a"}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}
