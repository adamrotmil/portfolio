"use client";

import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { assetPath } from "@/lib/basePath";

type LightboxItem = {
  src: string;
  alt: string;
};

type LightboxContextValue = {
  openLightbox: (item: LightboxItem) => void;
};

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function PresentationLightboxProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [item, setItem] = useState<LightboxItem | null>(null);
  const minimizeButtonRef = useRef<HTMLButtonElement | null>(null);

  const closeLightbox = useCallback(() => {
    setItem(null);
  }, []);

  const value = useMemo<LightboxContextValue>(
    () => ({
      openLightbox: (nextItem) => setItem(nextItem),
    }),
    [],
  );

  useEffect(() => {
    if (!item) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    minimizeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeLightbox, item]);

  return (
    <LightboxContext.Provider value={value}>
      {children}
      {item && (
        <div
          aria-label="Expanded portfolio image"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex min-h-screen flex-col bg-[rgba(8,8,10,0.94)] backdrop-blur-md"
          onClick={closeLightbox}
          role="dialog"
        >
          <button
            ref={minimizeButtonRef}
            aria-label="Minimize expanded image"
            className="absolute right-[clamp(1rem,3vw,2rem)] top-[clamp(1rem,3vw,2rem)] z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white shadow-[0_12px_34px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-200 hover:border-[#FFCB05]/70 hover:bg-black/70 hover:text-[#FFCB05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCB05] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            onClick={(event) => {
              event.stopPropagation();
              closeLightbox();
            }}
            type="button"
          >
            <MinimizeIcon />
          </button>

          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-[clamp(1rem,4vw,4rem)] py-[clamp(4.5rem,8vh,6rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={item.alt}
              className="max-h-[calc(100dvh-9.5rem)] max-w-full rounded-[10px] border border-white/15 bg-[#111113] object-contain shadow-[0_28px_90px_rgba(0,0,0,0.62)] sm:max-h-[82vh]"
              decoding="async"
              loading="eager"
              src={assetPath(item.src)}
            />
            <p className="max-w-[min(92vw,920px)] text-center font-mono text-[0.72rem] leading-[1.45] text-white/60">
              {item.alt}
            </p>
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  );
}

export function LightboxExpandButton({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const lightbox = useContext(LightboxContext);

  if (!src || !lightbox) return null;

  const lightboxSrc = src;
  const openLightbox = lightbox.openLightbox;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    openLightbox({ src: lightboxSrc, alt });
  }

  return (
    <button
      aria-label={`Expand ${alt}`}
      className={`absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur-md transition-all duration-200 hover:border-[#FFCB05]/70 hover:bg-black/70 hover:text-[#FFCB05] hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCB05] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
      onClick={handleClick}
      type="button"
    >
      <ExpandIcon />
    </button>
  );
}

function ExpandIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      <path d="M8 4H4v4" />
      <path d="M4 4l6.25 6.25" />
      <path d="M16 4h4v4" />
      <path d="M20 4l-6.25 6.25" />
      <path d="M4 16v4h4" />
      <path d="M4 20l6.25-6.25" />
      <path d="M20 16v4h-4" />
      <path d="M20 20l-6.25-6.25" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M5 16h3v3h2v-5H5v2Zm3-8H5v2h5V5H8v3Zm6 11h2v-3h3v-2h-5v5Zm2-11V5h-2v5h5V8h-3Z" />
    </svg>
  );
}
