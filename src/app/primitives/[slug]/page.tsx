import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PRIMITIVES } from "@/data/primitives";

export function generateStaticParams() {
  return PRIMITIVES.filter((p) => p.DetailComponent).map((p) => ({
    slug: p.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const primitive = PRIMITIVES.find((p) => p.id === slug);
  if (!primitive) return {};
  return {
    title: `${primitive.title} — Primitives — Adam Rotmil`,
    description: primitive.description,
  };
}

export default async function PrimitiveDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const primitive = PRIMITIVES.find((p) => p.id === slug);
  if (!primitive || !primitive.DetailComponent) notFound();

  const Detail = primitive.DetailComponent;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Nav />

      <div className="mx-auto max-w-[1100px] px-[clamp(1.5rem,4vw,4rem)] pb-[clamp(4rem,8vh,6rem)] pt-[clamp(6rem,12vh,9rem)]">
        <nav className="font-sans text-[0.72rem] uppercase tracking-[0.2em] text-text-muted">
          <Link
            href="/#lab"
            className="transition-colors hover:text-text-secondary"
          >
            Lab
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <Link
            href="/primitives"
            className="transition-colors hover:text-text-secondary"
          >
            Primitives
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <span className="text-text-secondary">{primitive.title}</span>
        </nav>

        <header className="mt-6 flex flex-wrap items-center gap-4">
          <h1 className="font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] text-text-primary">
            {primitive.title}
          </h1>
          <span className="inline-flex items-center rounded-full border border-border px-3 py-1 font-sans text-[0.7rem] uppercase tracking-[0.14em] text-text-muted">
            {primitive.tag}
          </span>
        </header>

        <p className="mt-6 max-w-[58ch] font-sans text-[clamp(1rem,1.15vw,1.125rem)] leading-[1.55] text-text-secondary">
          {primitive.description}
        </p>

        <section
          className="relative mt-12 flex w-full items-center justify-center overflow-hidden rounded-[20px] border border-border"
          style={{
            height: "clamp(540px, 82vh, 840px)",
            background:
              "radial-gradient(circle at 18% 12%, rgba(90, 98, 255, .18), transparent 34%), radial-gradient(circle at 82% 82%, rgba(255, 45, 85, .14), transparent 36%), #090a0f",
          }}
        >
          <Detail />
        </section>

        <section className="mt-16 grid gap-10 md:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
          <div>
            <div className="font-sans text-[0.7rem] uppercase tracking-[0.22em] text-text-muted">
              Why it matters
            </div>
            <p className="mt-4 font-sans text-[0.95rem] leading-[1.65] text-text-secondary">
              {primitive.why}
            </p>
          </div>

          {primitive.notes && primitive.notes.length > 0 ? (
            <div className="flex flex-col gap-8">
              {primitive.notes.map((note) => (
                <div
                  key={note.heading}
                  className="border-t border-border pt-6 first:border-t-0 first:pt-0"
                >
                  <h2 className="font-serif text-[1.4rem] leading-tight text-text-primary">
                    {note.heading}
                  </h2>
                  <p className="mt-3 font-sans text-[0.95rem] leading-[1.65] text-text-secondary">
                    {note.body}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      <Footer />
    </div>
  );
}
