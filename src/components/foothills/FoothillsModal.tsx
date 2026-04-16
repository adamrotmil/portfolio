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
        className="relative flex flex-col overflow-hidden rounded-[12px] shadow-[0_24px_72px_rgba(0,0,0,0.5)]"
        style={{
          width: "min(96vw, 1280px)",
          height: "min(94vh, 900px)",
          background: "#0b0b0d",
        }}
      >
        {/* Title bar (macOS-style, matches BrowserFrame vocabulary) */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161618] border-b border-[#222]">
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-[12px] h-[12px] rounded-full bg-[#ff5f57] hover:brightness-110 transition-[filter]"
          />
          <div className="w-[12px] h-[12px] rounded-full bg-[#febc2e]" />
          <div className="w-[12px] h-[12px] rounded-full bg-[#28c840]" />
          <div className="flex-1 flex justify-center">
            <div className="text-[11px] text-[#8e8e93] font-mono tracking-wide">
              foothills — a classic ASCII MUD
            </div>
          </div>
          <div className="w-[54px]" />
        </div>
        {/* Terminal */}
        <div className="flex-1 min-h-0">
          <Terminal />
        </div>
      </div>
    </div>
  );
}
