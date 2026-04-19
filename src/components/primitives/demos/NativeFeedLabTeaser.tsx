"use client";

import { useEffect, useState } from "react";

/**
 * Minimal abstraction of the Native Feed Lab: a wireframe phone outline
 * with stacked gradient "posts" that snap upward on a timed interval.
 * No copy, no iconography — just motion vocabulary matching the rest of
 * the primitive thumbnails. The full interactive demo lives on the
 * detail page; this is a silhouette.
 */

const GRADIENTS = [
  "radial-gradient(circle at 20% 15%, rgba(139,248,255,.85), transparent 30%), radial-gradient(circle at 80% 35%, rgba(110,107,255,.9), transparent 32%), linear-gradient(145deg, #060711, #111827 56%, #060711)",
  "radial-gradient(circle at 28% 18%, rgba(255,223,126,.8), transparent 28%), radial-gradient(circle at 74% 64%, rgba(255,111,145,.88), transparent 34%), linear-gradient(135deg, #110b06, #24131e 58%, #07050a)",
  "radial-gradient(circle at 70% 22%, rgba(156,255,179,.86), transparent 30%), radial-gradient(circle at 24% 70%, rgba(25,211,218,.72), transparent 36%), linear-gradient(135deg, #03120b, #0a1f25 60%, #03060a)",
  "radial-gradient(circle at 45% 18%, rgba(196,168,255,.82), transparent 30%), radial-gradient(circle at 76% 72%, rgba(255,122,200,.74), transparent 36%), linear-gradient(145deg, #0d0718, #1f1433 60%, #05050a)",
  "radial-gradient(circle at 22% 24%, rgba(255,255,255,.7), transparent 26%), radial-gradient(circle at 78% 74%, rgba(154,164,178,.62), transparent 36%), linear-gradient(145deg, #090a0c, #20242c 62%, #050506)",
];

export default function NativeFeedLabTeaser() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % GRADIENTS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="nfl-teaser">
      <div className="nfl-phone" aria-hidden="true">
        <div
          className="nfl-stack"
          style={{ transform: `translate3d(0, ${-index * 100}%, 0)` }}
        >
          {GRADIENTS.map((g, i) => (
            <div key={i} className="nfl-post" style={{ background: g }} />
          ))}
        </div>
      </div>

      <style>{`
        .nfl-teaser {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          padding: clamp(10px, 4%, 20px);
          box-sizing: border-box;
        }

        .nfl-phone {
          position: relative;
          aspect-ratio: 9 / 19;
          height: 92%;
          max-height: 100%;
          max-width: 100%;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
          background: #050507;
        }

        .nfl-stack {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          transition: transform 0.7s cubic-bezier(.2, .8, .2, 1);
          will-change: transform;
        }

        .nfl-post {
          flex: 0 0 100%;
        }

        @media (prefers-reduced-motion: reduce) {
          .nfl-stack { transition: none; }
        }
      `}</style>
    </div>
  );
}
