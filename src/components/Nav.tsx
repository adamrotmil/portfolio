"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { assetPath } from "@/lib/basePath";
import KranaMix from "@/components/KranaMix";

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

  const links = [
    { label: "Work", href: sectionHref("work") },
    { label: "Labs", href: sectionHref("lab") },
    { label: "About", href: sectionHref("about") },
    { label: "Contact", href: sectionHref("contact") },
  ];

  const resumeHref = assetPath("/resume/Adam-Rotmil-Resume.pdf");

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-[clamp(1.5rem,4vw,4rem)]"
      style={{
        background: scrolled ? "rgba(10,10,11,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-[1200px] mx-auto flex justify-between items-center h-16">
        <Link
          href="/"
          className="no-underline flex items-baseline gap-1.5 leading-none text-text-primary"
        >
          <KranaMix
            text="ADAM ROTMIL"
            pattern="BAABB ABBAA"
            className="text-[1.05rem] tracking-[-0.01em]"
          />
        </Link>

        {/* Desktop nav — small mono syntax, Schick-Toikka style. */}
        <div className="hidden md:flex gap-6 items-center">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="no-underline font-mono text-[0.72rem] text-text-primary hover:text-text-secondary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={resumeHref}
            target="_blank"
            rel="noopener"
            className="no-underline font-mono text-[0.72rem] text-text-primary hover:text-text-secondary transition-colors"
          >
            Resume ↗
          </a>
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
              transform: menuOpen
                ? "rotate(45deg) translateY(4px)"
                : "none",
            }}
          />
          <span
            className="block w-5 h-px bg-text-primary transition-opacity"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-px bg-text-primary transition-transform"
            style={{
              transform: menuOpen
                ? "rotate(-45deg) translateY(-4px)"
                : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden pb-6 flex flex-col gap-3">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="no-underline font-mono text-[0.82rem] text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={resumeHref}
            target="_blank"
            rel="noopener"
            onClick={() => setMenuOpen(false)}
            className="no-underline font-mono text-[0.82rem] text-text-secondary hover:text-text-primary transition-colors"
          >
            Resume ↗
          </a>
        </div>
      )}
    </nav>
  );
}
