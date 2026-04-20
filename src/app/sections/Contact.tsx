import Reveal from "@/components/Reveal";
import KranaMix from "@/components/KranaMix";
import { CONTACT } from "@/data/about";

export default function Contact() {
  return (
    <section
      id="contact"
      className="py-[clamp(4rem,8vh,7rem)] px-[clamp(1.5rem,4vw,4rem)] max-w-[1200px] mx-auto"
    >
      <Reveal>
        <div className="border-t border-border pt-10 text-center">
          {/* Joyful, playfully European — Krana Fat A/B mixed across
              every letter, scaled big, centered. The three-word phrase
              gets a different cadence per word so the widths vary
              visibly within each. */}
          <h2 className="mb-6 text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.95] text-text-primary">
            <KranaMix
              text={"LET\u2019S BUILD SOMETHING"}
              pattern="BAABB ABBAA BABAABBAA"
            />
          </h2>
          <p className="font-mono text-[0.82rem] text-text-primary mb-10 leading-[1.6]">
            Available for product design, AI/UX consulting, and design
            engineering roles.
          </p>

          <div className="flex justify-center gap-4 flex-wrap mb-10">
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-mono text-[0.78rem] text-bg-primary bg-text-primary no-underline px-6 py-3 rounded-[4px] hover:bg-text-secondary transition-colors"
            >
              Email Me
            </a>
            <a
              href={CONTACT.calendly}
              target="_blank"
              rel="noopener"
              className="font-mono text-[0.78rem] text-text-primary no-underline px-6 py-3 rounded-[4px] border border-border hover:border-text-muted transition-colors"
            >
              Book a Chat
            </a>
          </div>

          <div className="flex justify-center gap-8">
            {CONTACT.social.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener"
                className="font-mono text-[0.72rem] text-text-primary no-underline hover:text-text-secondary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
