import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SightLab from "@/components/vision/SightLab";

export const metadata: Metadata = {
  title: "Sight — Adam Rotmil",
  description:
    "Live object detection running entirely in the browser, with motion-designed boxes.",
};

const NOTES = [
  {
    heading: "The stack",
    body: "MediaPipe's ObjectDetector running EfficientDet-Lite0 — a 7MB model — entirely in the browser via WebAssembly with GPU delegation. There is no server: the video stream never leaves the device, nothing is recorded, and the page works offline once loaded. Perception as a client-side primitive.",
  },
  {
    heading: "The motion rule",
    body: "The model produces detections at whatever rate the hardware manages — roughly 10–30 Hz. Boxes drawn at that rate look like a debug view: snapping, flickering, disposable. Here every box is a persistent tracked object whose position, size, and opacity are eased toward the latest detection each display frame — the same exponential ease used across the Primitives kit. Detection rate and display rate are decoupled; the seam disappears.",
  },
  {
    heading: "Tracking",
    body: "Detections are matched to existing tracks greedily by class and intersection-over-union. Matched boxes glide; unmatched tracks fade out rather than vanish; new objects are born slightly small at their target and settle in. Confidence is displayed, not hidden — the chip shows the model's score, and the highest-confidence object carries the single yellow accent.",
  },
];

export default function VisionPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="mx-auto max-w-[1100px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,6rem)] pt-[clamp(6rem,12vh,9rem)]">
        <nav className="font-mono text-[0.72rem] text-text-muted">
          <Link
            href="/#lab"
            className="transition-colors hover:text-text-secondary"
          >
            Lab
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <span className="text-text-secondary">Sight</span>
        </nav>

        <header className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] text-text-primary">
            Sight
          </h1>
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-text-muted">
            Perception
          </span>
        </header>

        <p className="mt-6 max-w-[58ch] font-sans text-[clamp(1rem,1.15vw,1.125rem)] leading-[1.55] text-text-secondary">
          Live object detection, running entirely in your browser — with boxes
          that move like product, not like a debug view.
        </p>

        <section
          className="relative mt-12 w-full overflow-hidden rounded-[20px] border border-border"
          style={{ height: "clamp(480px, 72vh, 780px)" }}
        >
          <SightLab />
        </section>

        <section className="mt-16 grid gap-10 md:grid-cols-3">
          {NOTES.map((note) => (
            <div key={note.heading} className="border-t border-border pt-6">
              <h2 className="font-serif text-[1.3rem] leading-tight text-text-primary">
                {note.heading}
              </h2>
              <p className="mt-3 font-sans text-[0.92rem] leading-[1.65] text-text-secondary">
                {note.body}
              </p>
            </div>
          ))}
        </section>
      </div>

      <Footer />
    </div>
  );
}
