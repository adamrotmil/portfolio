import Reveal from "@/components/Reveal";
import KranaMix from "@/components/KranaMix";
import { CONTACT } from "@/data/about";

// Homage to MICA — the Contact CTA lives in a full-bleed bright yellow
// band with black type, mirroring their "Applying to MICA / Apply Now"
// treatment. Adam is MICA faculty, so the color reads as biographical,
// not arbitrary.
const MICA_YELLOW = "#FFCB05";

export default function Contact() {
  return (
    <section
      id="contact"
      className="w-full"
      style={{ background: MICA_YELLOW, color: "#0a0a0a" }}
    >
      <div className="py-[clamp(5rem,10vh,8rem)] px-[clamp(1.5rem,4vw,4rem)] max-w-[1200px] mx-auto">
        <Reveal>
          <div className="text-center">
            <h2
              className="mb-16 text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.92]"
              style={{ color: "#0a0a0a" }}
            >
              {/* Split into three KranaMix calls so we can wrap just the
                  middle word in .wave-black for the callback to the hero
                  "craft" motif. On mobile the headline shortens to
                  "LET'S BUILD." so it still lands in a single comfortable
                  line without crowding the buttons. */}
              <KranaMix text={"LET\u2019S"} pattern="BAABB" />{" "}
              <span className="wave-black">
                <KranaMix text="BUILD" pattern="ABBAA" />
              </span>
              <span className="sm:hidden">.</span>
              <span className="hidden sm:inline">
                {" "}
                <KranaMix text="SOMETHING" pattern="BABAABBAA" />
              </span>
            </h2>
            <p
              className="mb-10 font-mono text-[0.85rem] leading-[1.6] max-w-[56ch] mx-auto"
              style={{ color: "rgba(0,0,0,0.75)" }}
            >
              Available for product design, AI/UX consulting, and design
              engineering roles.
            </p>

            <div className="flex justify-center gap-4 flex-wrap mb-10">
              <a
                href={`mailto:${CONTACT.email}`}
                className="font-mono text-[0.78rem] no-underline px-6 py-3 rounded-[4px] transition-opacity hover:opacity-80"
                style={{ color: MICA_YELLOW, background: "#0a0a0a" }}
              >
                Email Me
              </a>
              <a
                href={CONTACT.calendly}
                target="_blank"
                rel="noopener"
                className="font-mono text-[0.78rem] no-underline px-6 py-3 rounded-[4px] transition-colors"
                style={{
                  color: "#0a0a0a",
                  border: "1px solid rgba(0,0,0,0.45)",
                  background: "transparent",
                }}
              >
                Book a Chat
              </a>
            </div>

            <div className="flex justify-center gap-8 flex-wrap">
              {CONTACT.social.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener"
                  className="font-mono text-[0.72rem] no-underline transition-opacity hover:opacity-60"
                  style={{ color: "#0a0a0a" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
