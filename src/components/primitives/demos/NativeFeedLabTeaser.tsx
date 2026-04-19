"use client";

import { useEffect, useState } from "react";

/**
 * A compressed preview of the Native Feed Lab for the 16:10 tile. Cycles
 * through each post's gradient + title every few seconds so the tile reads
 * as "a live mobile feed primitive" without trying to expose the full
 * gesture surface, which only makes sense at phone scale. The real,
 * full-size interactive component lives on /primitives/native-feed-lab.
 */

const POSTS = [
  {
    eyebrow: "FOR YOU",
    title: "Edge-to-edge feed physics",
    accent: "#8bf8ff",
    gradient:
      "radial-gradient(circle at 20% 15%, rgba(139,248,255,.85), transparent 28%), radial-gradient(circle at 80% 35%, rgba(110,107,255,.9), transparent 30%), linear-gradient(145deg, #060711, #111827 56%, #060711)",
  },
  {
    eyebrow: "LIVE MODULE",
    title: "Twitter card, video shell",
    accent: "#ffdf7e",
    gradient:
      "radial-gradient(circle at 28% 18%, rgba(255,223,126,.8), transparent 26%), radial-gradient(circle at 74% 64%, rgba(255,111,145,.88), transparent 32%), linear-gradient(135deg, #110b06, #24131e 58%, #07050a)",
  },
  {
    eyebrow: "PERFORMANCE",
    title: "React out of the frame loop",
    accent: "#9cffb3",
    gradient:
      "radial-gradient(circle at 70% 22%, rgba(156,255,179,.86), transparent 29%), radial-gradient(circle at 24% 70%, rgba(25,211,218,.72), transparent 34%), linear-gradient(135deg, #03120b, #0a1f25 60%, #03060a)",
  },
  {
    eyebrow: "SOCIAL SURFACE",
    title: "Micro-feedback sells it",
    accent: "#c4a8ff",
    gradient:
      "radial-gradient(circle at 45% 18%, rgba(196,168,255,.82), transparent 28%), radial-gradient(circle at 76% 72%, rgba(255,122,200,.74), transparent 34%), linear-gradient(145deg, #0d0718, #1f1433 60%, #05050a)",
  },
];

export default function NativeFeedLabTeaser() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % POSTS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const post = POSTS[index];

  return (
    <div className="native-teaser">
      <div className="teaser-phone">
        <div
          key={index}
          className="teaser-card"
          style={{
            background: post.gradient,
            ["--accent" as string]: post.accent,
          }}
        >
          <span className="teaser-eyebrow">{post.eyebrow}</span>
          <span className="teaser-title">{post.title}</span>
        </div>
        <div className="teaser-dots" aria-hidden="true">
          {POSTS.map((_, i) => (
            <span
              key={i}
              className={i === index ? "is-active" : ""}
              style={
                i === index
                  ? ({ ["--accent" as string]: post.accent } as React.CSSProperties)
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      <div className="teaser-copy">
        <span className="teaser-kicker">Native feed shell</span>
        <span className="teaser-meta">Snap pager · canvas burst · sheet</span>
        <span className="teaser-cta">Open lab →</span>
      </div>

      <style>{`
        .native-teaser {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: clamp(14px, 3%, 24px);
          padding: clamp(12px, 4%, 20px);
          box-sizing: border-box;
          color: white;
        }

        .teaser-phone {
          position: relative;
          aspect-ratio: 9 / 19;
          height: 88%;
          border-radius: 18px;
          background: #030305;
          box-shadow: 0 20px 48px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.12);
          overflow: hidden;
          isolation: isolate;
        }

        .teaser-card {
          position: absolute;
          inset: 0;
          display: grid;
          align-content: end;
          gap: 6px;
          padding: 12px 10px 26px;
          animation: teaser-fade 0.55s cubic-bezier(.2, .8, .2, 1);
        }

        .teaser-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, transparent, rgba(255,255,255,.14), transparent),
            repeating-linear-gradient(115deg, rgba(255,255,255,.1) 0 1px, transparent 1px 9px);
          mix-blend-mode: screen;
          opacity: .5;
          pointer-events: none;
          animation: teaser-shimmer 5.4s ease-in-out infinite alternate;
        }

        .teaser-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.62) 0%, transparent 40%, transparent 80%, rgba(255,255,255,.06) 100%);
          pointer-events: none;
        }

        .teaser-eyebrow {
          position: relative;
          z-index: 2;
          color: rgba(255,255,255,.65);
          font-size: 8px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
          text-shadow: 0 1px 4px rgba(0,0,0,.6);
        }

        .teaser-title {
          position: relative;
          z-index: 2;
          font-size: clamp(11px, 1.2vw, 13px);
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 8px rgba(0,0,0,.7);
          max-width: 14ch;
        }

        .teaser-dots {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 8px;
          z-index: 3;
          display: flex;
          justify-content: center;
          gap: 4px;
        }

        .teaser-dots span {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.38);
          transition: width .35s cubic-bezier(.2,.8,.2,1), background .35s ease;
        }

        .teaser-dots span.is-active {
          width: 14px;
          background: var(--accent, #fff);
        }

        .teaser-copy {
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .teaser-kicker {
          font-size: clamp(12px, 1.1vw, 14px);
          font-weight: 600;
          color: rgba(255,255,255,.92);
          letter-spacing: -0.01em;
        }

        .teaser-meta {
          font-size: clamp(10px, 0.95vw, 12px);
          color: rgba(255,255,255,.5);
          line-height: 1.4;
        }

        .teaser-cta {
          margin-top: 6px;
          font-size: clamp(10px, 0.9vw, 11px);
          font-weight: 700;
          color: rgba(255,255,255,.75);
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        @keyframes teaser-fade {
          from { opacity: 0; transform: translate3d(0, 8px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }

        @keyframes teaser-shimmer {
          from { transform: translate3d(-4%, -2%, 0) rotate(-4deg); }
          to { transform: translate3d(4%, 3%, 0) rotate(-1deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .teaser-card { animation: none; }
          .teaser-card::before { animation: none; }
        }
      `}</style>
    </div>
  );
}
