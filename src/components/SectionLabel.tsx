import Reveal from "./Reveal";

/**
 * Section-kicker used at the top of a case study chapter: a small
 * monospaced index number, a hairline, then a small sentence-case
 * section title. Matches the rest of the site's mono-label system.
 */
export default function SectionLabel({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <Reveal>
      <div className="flex items-center gap-3 mb-8 font-mono text-[0.72rem] text-text-primary">
        <span className="tabular-nums">{number}</span>
        <div className="h-px w-8 bg-border-strong" />
        <span>{title}</span>
      </div>
    </Reveal>
  );
}
