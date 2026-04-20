"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { assetPath } from "@/lib/basePath";
import KranaMix from "@/components/KranaMix";

/**
 * Floating glass-pill nav — Retell AI-style.
 *
 * Rather than sitting flush across the top of the viewport, the nav
 * detaches into a centered pill with a small top offset, a dark
 * translucent fill, backdrop blur, and a subtle white edge light. It
 * works across all our bg contexts (charcoal hero, warm-paper Labs,
 * MICA yellow Contact) because the dark glass reads on every tone.
 *
 * The outer fixed container has pointer-events: none so clicks pass
 * through empty space to content below; the pill itself re-enables
 * pointer-events on its wrapper.
 */

const PILL_BG =
  "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))";
const PILL_BG_BASE = "rgba(16, 17, 20, 0.55)";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const onHome = pathname === "/";
  const sectionHref = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  const links: { label: string; href: string; external?: boolean }[] = [
    { label: "Work", href: sectionHref("work") },
    { label: "Labs", href: sectionHref("lab") },
    { label: "About", href: sectionHref("about") },
    { label: "Resume", href: assetPath("/resume/Adam-Rotmil-Resume.pdf"), external: true },
    { label: "Contact", href: sectionHref("contact") },
  ];

  return (
    <nav
      className="fixed top-[clamp(0.75rem,1.5vh,1.25rem)] inset-x-0 z-50 flex justify-center pointer-events-none px-4"
      aria-label="Main"
    >
      <div
        className="pointer-events-auto flex items-center gap-4 md:gap-5 rounded-full"
        style={{
          background: `${PILL_BG}, ${PILL_BG_BASE}`,
          backdropFilter: "blur(16px) saturate(140%)",
          WebkitBackdropFilter: "blur(16px) saturate(140%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 24px rgba(0,0,0,0.25)",
          padding: "8px 10px 8px 18px",
        }}
      >
        {/* Wordmark */}
        <Link
          href="/"
          className="no-underline flex items-baseline leading-none text-text-primary"
        >
          <KranaMix
            text="ADAM ROTMIL"
            pattern="BAABB ABBAA"
            className="text-[0.95rem] tracking-[-0.01em]"
          />
        </Link>

        {/* Vertical separator */}
        <span
          className="hidden md:inline-block self-stretch"
          style={{
            width: 1,
            background: "rgba(255,255,255,0.12)",
          }}
          aria-hidden="true"
        />

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-5 items-center pr-2">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener"
                className="no-underline font-mono text-[0.72rem] text-text-primary hover:text-text-secondary transition-colors"
              >
                {link.label} ↗
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="no-underline font-mono text-[0.72rem] text-text-primary hover:text-text-secondary transition-colors"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1.5 ml-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
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

      {/* Mobile menu panel — also floating glass, expands below the pill. */}
      {menuOpen && (
        <div
          className="md:hidden pointer-events-auto absolute top-[calc(100%+0.5rem)] flex flex-col gap-3 rounded-[18px] py-4 px-6"
          style={{
            background: `${PILL_BG}, ${PILL_BG_BASE}`,
            backdropFilter: "blur(16px) saturate(140%)",
            WebkitBackdropFilter: "blur(16px) saturate(140%)",
            border: "1px solid rgba(255,255,255,0.14)",
            minWidth: "10rem",
          }}
        >
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener"
                onClick={() => setMenuOpen(false)}
                className="no-underline font-mono text-[0.82rem] text-text-primary hover:text-text-secondary transition-colors"
              >
                {link.label} ↗
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="no-underline font-mono text-[0.82rem] text-text-primary hover:text-text-secondary transition-colors"
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
