"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { assetPath } from "@/lib/basePath";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // On the homepage, bare fragments (#work) scroll in place. On any other
  // route, those fragments point at elements that don't exist — so we
  // route home with the fragment (/#work) to load the section target.
  const onHome = pathname === "/";
  const sectionHref = (id: string) => (onHome ? `#${id}` : `/#${id}`);
  const resumeHref = assetPath("/resume/Adam-Rotmil-Resume.pdf");

  const links: { label: string; href: string; external?: boolean }[] = [
    { label: "Work", href: sectionHref("work") },
    { label: "Labs", href: sectionHref("lab") },
    { label: "About", href: sectionHref("about") },
    { label: "Resume", href: resumeHref, external: true },
    { label: "Contact", href: sectionHref("contact") },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-[clamp(1.5rem,4vw,4rem)]"
      style={{
        background: scrolled ? "rgba(255,255,255,0.82)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(0,0,0,0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-[1400px] mx-auto flex justify-between items-center h-16">
        <Link href="/" className="no-underline flex items-baseline gap-1.5">
          <span className="font-sans text-[0.88rem] font-medium text-text-primary">
            Adam Rotmil
          </span>
        </Link>

        {/* Desktop nav — mono, uppercase, tracked. Reads as tool chrome. */}
        <div className="hidden md:flex gap-7 items-center">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener"
                className="no-underline font-mono text-[0.7rem] uppercase tracking-[0.12em] text-text-muted hover:text-text-primary transition-colors"
              >
                {link.label} ↗
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="no-underline font-mono text-[0.7rem] uppercase tracking-[0.12em] text-text-muted hover:text-text-primary transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-px bg-text-primary transition-transform"
            style={{
              transform: menuOpen ? "rotate(45deg) translateY(4px)" : "none",
            }}
          />
          <span
            className="block w-5 h-px bg-text-primary transition-opacity"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-px bg-text-primary transition-transform"
            style={{
              transform: menuOpen ? "rotate(-45deg) translateY(-4px)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden pb-6 flex flex-col gap-3">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener"
                onClick={() => setMenuOpen(false)}
                className="no-underline font-mono text-[0.78rem] uppercase tracking-[0.12em] text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label} ↗
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="no-underline font-mono text-[0.78rem] uppercase tracking-[0.12em] text-text-secondary hover:text-text-primary transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      )}
    </nav>
  );
}
