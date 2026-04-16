"use client";

import { useEffect, useRef } from "react";
import Terminal from "./Terminal";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FoothillsModal({ open, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement | null>(null);

  // Esc to close + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Foothills MUD"
    >
      <div
        className="relative flex flex-col overflow-hidden sm:rounded-[12px] shadow-[0_24px_72px_rgba(0,0,0,0.5)] w-full h-[100dvh] sm:w-[min(96vw,1280px)] sm:h-[min(94vh,900px)]"
        style={{
          background: "#0b0b0d",
        }}
      >
        {/* Title bar */}
        <div className="relative flex items-center justify-center px-4 py-3 bg-[#161618] border-b border-[#222]">
          <div className="text-[11px] text-[#8e8e93] font-mono tracking-wide">
            foothills — a classic ASCII MUD
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-[#8e8e93] hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {/* Terminal */}
        <div className="flex-1 min-h-0">
          <Terminal />
        </div>
      </div>
    </div>
  );
}
