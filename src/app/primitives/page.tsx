import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PrimitiveCard from "@/components/primitives/PrimitiveCard";
import { PRIMITIVES } from "@/data/primitives";

export const metadata: Metadata = {
  title: "Primitives — Adam Rotmil",
  description:
    "A growing vocabulary of motion and interaction techniques for the web.",
};

export default function PrimitivesPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <header className="mx-auto max-w-[900px] px-[clamp(1.5rem,4vw,4rem)] pb-12 pt-[clamp(6rem,12vh,9rem)]">
        <nav className="font-sans text-[0.72rem] uppercase tracking-[0.2em] text-text-muted">
          <Link
            href="/#lab"
            className="transition-colors hover:text-text-secondary"
          >
            Lab
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <span className="text-text-secondary">Primitives</span>
        </nav>
        <h1 className="mt-4 font-serif text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] text-text-primary">
          Primitives
        </h1>
        <p className="mt-6 max-w-[60ch] font-sans text-[clamp(1rem,1.2vw,1.125rem)] leading-[1.6] text-text-secondary">
          A growing vocabulary of motion and interaction techniques for the web.
          Each primitive is a reusable building block — mastering the set lets
          you compose premium UI with confidence.
        </p>
        <p className="mt-4 max-w-[60ch] font-sans text-[0.85rem] leading-[1.6] text-text-muted">
          Hover any tile to replay.
        </p>
      </header>

      <section className="mx-auto max-w-[1200px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(5rem,10vh,8rem)]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRIMITIVES.map((p) => (
            <PrimitiveCard key={p.id} primitive={p} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
