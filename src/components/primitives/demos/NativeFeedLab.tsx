"use client";

import React, {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Teaches: how to get a native-feel mobile surface on the web.
 * React owns state at interaction boundaries (active index, liked, sheet).
 * An on-demand requestAnimationFrame loop owns continuous motion — spring
 * pager, rubber-band bounds, velocity flings — and sleeps when settled.
 * Cards move with transform/opacity/filter only; layout properties are
 * avoided during gestures. A canvas layer handles the reaction burst so
 * React never re-renders per particle. The same shell can host any
 * content: video, cards, WebGL — the primitive is the pager + chrome.
 */

type FeedPost = {
  id: number;
  eyebrow: string;
  author: string;
  handle: string;
  title: string;
  body: string;
  accent: string;
  secondary: string;
  stat: string;
  comments: string;
  shares: string;
  gradient: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
};

const FEED_POSTS: FeedPost[] = [
  {
    id: 0,
    eyebrow: "FOR YOU",
    author: "Motion Lab",
    handle: "@native_web",
    title: "Edge-to-edge feed physics",
    body: "Drag vertically, fling fast, tap the reaction rail, then open the bottom sheet. Everything critical moves with transforms, not layout.",
    accent: "#8bf8ff",
    secondary: "#6e6bff",
    stat: "24.8K",
    comments: "431",
    shares: "1.2K",
    gradient:
      "radial-gradient(circle at 20% 15%, rgba(139,248,255,.85), transparent 28%), radial-gradient(circle at 80% 35%, rgba(110,107,255,.9), transparent 30%), linear-gradient(145deg, #060711, #111827 56%, #060711)",
  },
  {
    id: 1,
    eyebrow: "LIVE MODULE",
    author: "Signal Stack",
    handle: "@craft_systems",
    title: "A Twitter-like card inside a video shell",
    body: "The content reads like a post, but behaves like a native mobile surface: rubber-banding, velocity thresholds, gesture capture, and spring settle.",
    accent: "#ffdf7e",
    secondary: "#ff6f91",
    stat: "8.7K",
    comments: "118",
    shares: "624",
    gradient:
      "radial-gradient(circle at 28% 18%, rgba(255,223,126,.8), transparent 26%), radial-gradient(circle at 74% 64%, rgba(255,111,145,.88), transparent 32%), linear-gradient(135deg, #110b06, #24131e 58%, #07050a)",
  },
  {
    id: 2,
    eyebrow: "PERFORMANCE",
    author: "Render Budget",
    handle: "@sixty_fps",
    title: "Keep React out of the frame loop",
    body: "React handles state at interaction boundaries. requestAnimationFrame drives the spring, velocity, particles, and compositing layers imperatively.",
    accent: "#9cffb3",
    secondary: "#19d3da",
    stat: "15.1K",
    comments: "302",
    shares: "909",
    gradient:
      "radial-gradient(circle at 70% 22%, rgba(156,255,179,.86), transparent 29%), radial-gradient(circle at 24% 70%, rgba(25,211,218,.72), transparent 34%), linear-gradient(135deg, #03120b, #0a1f25 60%, #03060a)",
  },
  {
    id: 3,
    eyebrow: "SOCIAL SURFACE",
    author: "Tactile UI",
    handle: "@haptics_without_haptics",
    title: "Micro-feedback sells the illusion",
    body: "The like burst, sheet lift, tab compression, and card scale are tiny. Together they make a browser feel much closer to a native app.",
    accent: "#c4a8ff",
    secondary: "#ff7ac8",
    stat: "32.6K",
    comments: "788",
    shares: "2.1K",
    gradient:
      "radial-gradient(circle at 45% 18%, rgba(196,168,255,.82), transparent 28%), radial-gradient(circle at 76% 72%, rgba(255,122,200,.74), transparent 34%), linear-gradient(145deg, #0d0718, #1f1433 60%, #05050a)",
  },
  {
    id: 4,
    eyebrow: "PRIMITIVE",
    author: "Adam Experiments",
    handle: "@portfolio_lab",
    title: "Composable native-feel shell",
    body: "Swap the content for video, cards, experiments, or prototypes. The primitive is the same: pager physics + layered chrome + cheap visual feedback.",
    accent: "#ffffff",
    secondary: "#9aa4b2",
    stat: "11.9K",
    comments: "205",
    shares: "740",
    gradient:
      "radial-gradient(circle at 22% 24%, rgba(255,255,255,.8), transparent 25%), radial-gradient(circle at 78% 74%, rgba(154,164,178,.7), transparent 35%), linear-gradient(145deg, #090a0c, #20242c 62%, #050506)",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rubberBand = (distance: number, dimension: number) => {
  const constant = 0.55;
  const abs = Math.abs(distance);
  return (
    Math.sign(distance) *
    ((constant * abs * dimension) / (dimension + constant * abs))
  );
};

export default function NativeFeedLab() {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pullRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<() => void>(() => {
    rafRef.current = null;
  });
  const particleRafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const reducedMotionRef = useRef(false);
  const activeRef = useRef(0);
  const lastAnnouncedIndexRef = useRef(0);
  const motionRef = useRef({
    height: 1,
    position: 0,
    target: 0,
    velocity: 0,
    dragging: false,
    startY: 0,
    startPosition: 0,
    lastY: 0,
    lastT: 0,
    pointerId: -1,
    pullProgress: 0,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  activeRef.current = activeIndex;

  const visiblePosts = useMemo(() => {
    return FEED_POSTS.filter((post) => Math.abs(post.id - activeIndex) <= 2);
  }, [activeIndex]);

  const setCardRef = useCallback((id: number) => {
    return (node: HTMLDivElement | null) => {
      if (node) cardRefs.current.set(id, node);
      else cardRefs.current.delete(id);
    };
  }, []);

  const updatePullIndicator = useCallback((progress: number) => {
    const node = pullRef.current;
    if (!node) return;
    const eased = clamp(progress, 0, 1);
    node.style.opacity = String(eased);
    node.style.transform = `translate3d(-50%, ${lerp(-22, 18, eased)}px, 0) scale(${lerp(0.86, 1, eased)})`;
    node.dataset.ready = eased > 0.82 ? "true" : "false";
  }, []);

  const applyCardTransforms = useCallback(() => {
    const { height, position } = motionRef.current;
    const safeHeight = Math.max(1, height);

    cardRefs.current.forEach((node, id) => {
      const y = id * safeHeight + position;
      const normalized = y / safeHeight;
      const abs = Math.abs(normalized);
      const scale = 1 - Math.min(abs * 0.045, 0.1);
      const opacity = clamp(1 - abs * 0.58, 0, 1);
      const blur = Math.min(abs * 5, 10);
      const lift = normalized < 0 ? -8 : 8;

      node.style.transform = `translate3d(0, ${y + lift * Math.min(abs, 1)}px, 0) scale(${scale})`;
      node.style.opacity = String(opacity);
      node.style.filter = `blur(${blur}px)`;
      node.style.pointerEvents = abs < 0.72 ? "auto" : "none";
    });
  }, []);

  const ensureFrameLoop = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(tickRef.current);
    }
  }, []);

  const settleTo = useCallback(
    (nextIndex: number) => {
      const index = clamp(nextIndex, 0, FEED_POSTS.length - 1);
      const motion = motionRef.current;
      activeRef.current = index;
      motion.target = -index * motion.height;
      motion.pullProgress = 0;
      updatePullIndicator(0);
      setActiveIndex(index);
      ensureFrameLoop();

      if (reducedMotionRef.current) {
        motion.position = motion.target;
        motion.velocity = 0;
        applyCardTransforms();
      }
    },
    [applyCardTransforms, ensureFrameLoop, updatePullIndicator],
  );

  const tick = useCallback(() => {
    const motion = motionRef.current;

    if (!motion.dragging && !reducedMotionRef.current) {
      const delta = motion.target - motion.position;
      const minPosition = -(FEED_POSTS.length - 1) * motion.height;
      // Only the "you're past the end of the feed" state gets the bouncy
      // spring. Regular post-to-post snaps ease in monotonically — no
      // overshoot, so transitions read as precise swipes, not springs.
      const pastBounds =
        motion.position > 0.5 || motion.position < minPosition - 0.5;

      if (pastBounds) {
        motion.velocity += delta * 0.12;
        motion.velocity *= 0.82;
        motion.position += motion.velocity;
      } else {
        motion.position += delta * 0.22;
        motion.velocity = 0;
      }

      if (Math.abs(delta) < 0.18 && Math.abs(motion.velocity) < 0.18) {
        motion.position = motion.target;
        motion.velocity = 0;
      }

      const nearest = clamp(
        Math.round(-motion.position / motion.height),
        0,
        FEED_POSTS.length - 1,
      );
      if (
        nearest !== lastAnnouncedIndexRef.current &&
        Math.abs(delta) < motion.height * 0.45
      ) {
        lastAnnouncedIndexRef.current = nearest;
      }
    }

    applyCardTransforms();

    const settled =
      !motion.dragging &&
      Math.abs(motion.target - motion.position) < 0.2 &&
      Math.abs(motion.velocity) < 0.2;

    if (settled) {
      rafRef.current = null;
      return;
    }

    rafRef.current = window.requestAnimationFrame(tick);
  }, [applyCardTransforms]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const height = viewportRef.current?.clientHeight || 1;
      const motion = motionRef.current;
      motion.height = height;
      motion.target = -activeRef.current * height;
      if (!motion.dragging) motion.position = motion.target;
      applyCardTransforms();
    };

    resize();
    const observer = new ResizeObserver(resize);
    if (viewportRef.current) observer.observe(viewportRef.current);

    ensureFrameLoop();
    return () => {
      observer.disconnect();
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      if (particleRafRef.current !== null)
        window.cancelAnimationFrame(particleRafRef.current);
      rafRef.current = null;
      particleRafRef.current = null;
    };
  }, [applyCardTransforms, ensureFrameLoop, tick]);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = shell.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    ctx.clearRect(0, 0, width, height);
    const particles = particlesRef.current;

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= 1;
      p.vy += 0.08;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;

      const alpha = clamp(p.life / p.maxLife, 0, 1);
      const radius = p.size * dpr * (0.7 + alpha * 0.7);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue}, 100%, ${64 + alpha * 18}%, ${alpha})`;
      ctx.arc(p.x * dpr, p.y * dpr, radius, 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) particles.splice(i, 1);
    }

    if (particles.length > 0) {
      particleRafRef.current = window.requestAnimationFrame(drawParticles);
    } else {
      particleRafRef.current = null;
    }
  }, []);

  const emitBurst = useCallback(
    (clientX: number, clientY: number) => {
      const shell = shellRef.current;
      if (!shell) return;
      const rect = shell.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const particles = particlesRef.current;

      for (let i = 0; i < 34; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.6 + Math.random() * 4.8;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.4,
          life: 28 + Math.random() * 20,
          maxLife: 48,
          size: 1.6 + Math.random() * 3.2,
          hue: Math.random() > 0.5 ? 350 : 198,
        });
      }

      if (!particleRafRef.current) {
        particleRafRef.current = window.requestAnimationFrame(drawParticles);
      }
    },
    [drawParticles],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (sheetOpen) return;
    const motion = motionRef.current;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea")) return;

    viewportRef.current?.setPointerCapture(event.pointerId);
    motion.dragging = true;
    motion.pointerId = event.pointerId;
    motion.startY = event.clientY;
    motion.startPosition = motion.position;
    motion.lastY = event.clientY;
    motion.lastT = performance.now();
    motion.velocity = 0;
    ensureFrameLoop();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;
    if (!motion.dragging || motion.pointerId !== event.pointerId) return;

    const now = performance.now();
    const dy = event.clientY - motion.startY;
    let nextPosition = motion.startPosition + dy;
    const maxPosition = 0;
    const minPosition = -(FEED_POSTS.length - 1) * motion.height;

    if (nextPosition > maxPosition) {
      nextPosition =
        maxPosition + rubberBand(nextPosition - maxPosition, motion.height);
    } else if (nextPosition < minPosition) {
      nextPosition =
        minPosition + rubberBand(nextPosition - minPosition, motion.height);
    }

    const frameVelocity =
      (event.clientY - motion.lastY) / Math.max(1, now - motion.lastT);
    motion.velocity = frameVelocity * 16.67;
    motion.position = nextPosition;
    motion.lastY = event.clientY;
    motion.lastT = now;

    if (activeRef.current === 0 && nextPosition > 0) {
      const progress = clamp(nextPosition / 128, 0, 1);
      motion.pullProgress = progress;
      updatePullIndicator(progress);
    } else {
      motion.pullProgress = 0;
      updatePullIndicator(0);
    }

    applyCardTransforms();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;
    if (!motion.dragging || motion.pointerId !== event.pointerId) return;

    motion.dragging = false;
    if (viewportRef.current?.hasPointerCapture(event.pointerId)) {
      viewportRef.current.releasePointerCapture(event.pointerId);
    }

    const dy = event.clientY - motion.startY;
    const velocity = motion.velocity;
    let nextIndex = activeRef.current;

    if (motion.pullProgress > 0.78) {
      setRefreshing(true);
      window.setTimeout(() => setRefreshing(false), 760);
      nextIndex = 0;
    } else if (dy < -72 || velocity < -7) {
      nextIndex += 1;
    } else if (dy > 72 || velocity > 7) {
      nextIndex -= 1;
    } else {
      nextIndex = Math.round(-motion.position / motion.height);
    }

    settleTo(nextIndex);
  };

  const handleLike = (
    event: React.MouseEvent<HTMLButtonElement>,
    id: number,
  ) => {
    event.stopPropagation();
    setLiked((current) => ({ ...current, [id]: !current[id] }));
    emitBurst(event.clientX, event.clientY);
  };

  const handleOpenSheet = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSheetOpen(true);
  };

  const jumpTo = (index: number) => {
    setSheetOpen(false);
    settleTo(index);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      settleTo(activeRef.current + 1);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      settleTo(activeRef.current - 1);
    }
    if (event.key === "Escape") setSheetOpen(false);
  };

  const activePost = FEED_POSTS[activeIndex];

  return (
    <section
      className="native-feed-lab"
      aria-label="Native-feel mobile feed interaction demo"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={
        { ["--active-accent" as string]: activePost.accent } as CSSProperties
      }
    >
      <div className="native-phone" ref={shellRef}>
        <canvas className="burst-canvas" ref={canvasRef} aria-hidden="true" />

        <div className="status-bar" aria-hidden="true">
          <span>9:41</span>
          <span className="status-glyphs">▰▰▰ 5G ◖</span>
        </div>

        <header className="top-chrome">
          <div>
            <span className="mode-label">Pulse</span>
            <strong>For You</strong>
          </div>
          <button
            className="glass-button"
            type="button"
            aria-label="Search experiments"
          >
            ⌕
          </button>
        </header>

        <div
          className="feed-viewport"
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="pull-indicator" ref={pullRef}>
            <span>{refreshing ? "Refreshing" : "Pull"}</span>
          </div>

          {visiblePosts.map((post) => {
            const isLiked = Boolean(liked[post.id]);
            return (
              <article
                key={post.id}
                ref={setCardRef(post.id)}
                className="feed-card"
                style={
                  {
                    "--accent": post.accent,
                    "--secondary": post.secondary,
                    "--card-gradient": post.gradient,
                  } as CSSProperties
                }
                aria-label={`${post.author}: ${post.title}`}
              >
                <div className="moving-material" aria-hidden="true" />
                <div className="scanline" aria-hidden="true" />

                <div className="post-copy">
                  <span className="eyebrow">{post.eyebrow}</span>
                  <h3>{post.title}</h3>
                  <p>{post.body}</p>
                  <div className="author-row">
                    <span className="avatar">{post.author.slice(0, 1)}</span>
                    <div>
                      <strong>{post.author}</strong>
                      <span>{post.handle}</span>
                    </div>
                  </div>
                </div>

                <aside className="reaction-rail" aria-label="Post actions">
                  <button
                    type="button"
                    className={`rail-button ${isLiked ? "is-liked" : ""}`}
                    onClick={(event) => handleLike(event, post.id)}
                    aria-pressed={isLiked}
                    aria-label="Like"
                  >
                    <span>♥</span>
                    <small>{isLiked ? "1" : post.stat}</small>
                  </button>
                  <button
                    type="button"
                    className="rail-button"
                    onClick={handleOpenSheet}
                    aria-label="Open comments"
                  >
                    <span>◌</span>
                    <small>{post.comments}</small>
                  </button>
                  <button
                    type="button"
                    className="rail-button"
                    aria-label="Share"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span>↗</span>
                    <small>{post.shares}</small>
                  </button>
                </aside>

                <div className="caption-pill">
                  <span className="live-dot" />
                  <span>GPU layers · spring pager · canvas burst</span>
                </div>
              </article>
            );
          })}
        </div>

        <nav className="bottom-tabs" aria-label="Experiment sections">
          {FEED_POSTS.map((post, index) => (
            <button
              key={post.id}
              type="button"
              className={index === activeIndex ? "is-active" : ""}
              onClick={() => jumpTo(index)}
              aria-label={`Go to ${post.title}`}
            >
              <span />
            </button>
          ))}
        </nav>

        <div
          className={`comment-sheet ${sheetOpen ? "is-open" : ""}`}
          aria-hidden={!sheetOpen}
        >
          <div className="sheet-handle" />
          <div className="sheet-header">
            <div>
              <span className="mode-label">Comments</span>
              <strong>{activePost.comments} reactions</strong>
            </div>
            <button
              type="button"
              className="glass-button"
              onClick={() => setSheetOpen(false)}
              aria-label="Close comments"
            >
              ×
            </button>
          </div>
          <div className="comment-stack">
            <p>
              <strong>Mia</strong> This is the exact direction: native shell,
              web payload.
            </p>
            <p>
              <strong>Kenji</strong> The drag threshold feels heavy in a good
              way.
            </p>
            <p>
              <strong>Lab note</strong> Try swapping a real video or WebGL
              canvas into the card.
            </p>
          </div>
          <div className="composer">
            <span>Message</span>
            <button type="button">Post</button>
          </div>
        </div>
      </div>

      <style>{`
        .native-feed-lab {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: white;
          outline: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          padding: 14px;
          box-sizing: border-box;
        }

        .native-phone {
          position: relative;
          /* Keep the phone at a natural handset aspect, centered in the card
             with dark framing around it. Cap both dimensions so it never
             stretches past real-device proportions, even in a tall card. */
          aspect-ratio: 9 / 19;
          height: 100%;
          max-height: 760px;
          width: auto;
          max-width: min(100%, 390px);
          overflow: hidden;
          border-radius: 36px;
          background: #030305;
          box-shadow: 0 30px 90px rgba(0,0,0,.42), inset 0 0 0 1px rgba(255,255,255,.12);
          isolation: isolate;
          contain: layout paint size;
          container-type: inline-size;
        }

        .native-phone::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 30;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.18), inset 0 -32px 80px rgba(0,0,0,.62);
        }

        .burst-canvas {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;
        }

        .status-bar,
        .top-chrome,
        .bottom-tabs {
          position: absolute;
          left: 0;
          right: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: none;
        }

        .status-bar {
          top: 0;
          height: 10cqi;
          min-height: 28px;
          max-height: 44px;
          padding: 0 7cqi;
          font-size: clamp(10px, 3.3cqi, 13px);
          font-weight: 700;
          letter-spacing: .02em;
        }

        .status-glyphs {
          font-size: clamp(9px, 3cqi, 12px);
          opacity: .9;
        }

        .top-chrome {
          top: 10cqi;
          padding: 10px 5cqi 8px;
          background: linear-gradient(to bottom, rgba(0,0,0,.72), rgba(0,0,0,0));
        }

        .top-chrome > div,
        .sheet-header > div {
          display: grid;
          gap: 2px;
        }

        .mode-label,
        .eyebrow {
          color: rgba(255,255,255,.58);
          font-size: clamp(9px, 2.6cqi, 10px);
          font-weight: 800;
          letter-spacing: .16em;
          text-transform: uppercase;
        }

        .top-chrome strong,
        .sheet-header strong {
          font-size: clamp(16px, 5cqi, 20px);
          line-height: 1;
        }

        .glass-button {
          width: clamp(32px, 10cqi, 38px);
          height: clamp(32px, 10cqi, 38px);
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
          color: white;
          font-size: clamp(18px, 6cqi, 22px);
          display: grid;
          place-items: center;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          pointer-events: auto;
          transition: transform .16s ease, background .16s ease;
        }

        .glass-button:active {
          transform: scale(.9);
          background: rgba(255,255,255,.2);
        }

        .feed-viewport {
          position: absolute;
          inset: 0;
          z-index: 10;
          overflow: hidden;
          touch-action: none;
          cursor: grab;
          contain: layout paint;
        }

        .feed-viewport:active {
          cursor: grabbing;
        }

        .pull-indicator {
          position: absolute;
          top: 16cqi;
          left: 50%;
          z-index: 42;
          width: clamp(52px, 16cqi, 62px);
          height: clamp(24px, 7.2cqi, 28px);
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255,255,255,.16);
          color: rgba(255,255,255,.84);
          font-size: clamp(10px, 2.8cqi, 11px);
          font-weight: 800;
          opacity: 0;
          transform: translate3d(-50%, -22px, 0) scale(.86);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          will-change: transform, opacity;
          pointer-events: none;
        }

        .pull-indicator[data-ready="true"] {
          background: color-mix(in srgb, var(--active-accent) 36%, rgba(255,255,255,.16));
        }

        .feed-card {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: var(--card-gradient);
          transform-origin: center;
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          contain: layout paint;
        }

        .feed-card::before {
          content: "";
          position: absolute;
          inset: -30%;
          background:
            radial-gradient(circle at 45% 45%, rgba(255,255,255,.18), transparent 18%),
            conic-gradient(from 0deg, transparent, rgba(255,255,255,.16), transparent, var(--accent), transparent);
          opacity: .72;
          filter: blur(22px);
          animation: materialSpin 8s linear infinite;
          transform: translateZ(0);
          will-change: transform;
        }

        .moving-material {
          position: absolute;
          inset: 18% -18% 24%;
          background:
            linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent),
            repeating-linear-gradient(115deg, rgba(255,255,255,.14) 0 1px, transparent 1px 10px);
          mix-blend-mode: screen;
          opacity: .62;
          filter: blur(.3px);
          transform: rotate(-8deg) translateZ(0);
          animation: shimmerTrack 5.4s ease-in-out infinite alternate;
          will-change: transform;
        }

        .scanline {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(255,255,255,.06), transparent 18%, transparent 82%, rgba(0,0,0,.62));
          pointer-events: none;
        }

        .post-copy {
          position: absolute;
          left: 5cqi;
          right: 22cqi;
          bottom: 26cqi;
          z-index: 3;
          display: grid;
          gap: 3cqi;
          text-shadow: 0 2px 20px rgba(0,0,0,.68);
        }

        .post-copy h3 {
          margin: 0;
          max-width: 10ch;
          font-size: clamp(22px, 9.5cqi, 44px);
          line-height: .92;
          letter-spacing: -.05em;
        }

        .post-copy p {
          margin: 0;
          color: rgba(255,255,255,.78);
          font-size: clamp(11px, 3.4cqi, 13px);
          line-height: 1.35;
        }

        .author-row {
          display: flex;
          gap: 2.6cqi;
          align-items: center;
        }

        .avatar {
          width: clamp(26px, 8.8cqi, 34px);
          height: clamp(26px, 8.8cqi, 34px);
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255,255,255,.26), rgba(255,255,255,.08));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.18);
          font-weight: 900;
          font-size: clamp(11px, 3.6cqi, 14px);
        }

        .author-row div {
          display: grid;
          gap: 1px;
        }

        .author-row strong {
          font-size: clamp(11px, 3.4cqi, 13px);
        }

        .author-row span:last-child {
          color: rgba(255,255,255,.58);
          font-size: clamp(10px, 3.1cqi, 12px);
        }

        .reaction-rail {
          position: absolute;
          right: 3.8cqi;
          bottom: 26cqi;
          z-index: 4;
          display: grid;
          gap: 3.6cqi;
        }

        .rail-button {
          width: clamp(46px, 14.4cqi, 56px);
          display: grid;
          justify-items: center;
          gap: 4px;
          padding: 0;
          border: 0;
          color: white;
          background: transparent;
          text-shadow: 0 2px 18px rgba(0,0,0,.72);
          transition: transform .16s cubic-bezier(.2, .9, .2, 1.25);
          pointer-events: auto;
        }

        .rail-button span {
          width: clamp(40px, 12.4cqi, 48px);
          height: clamp(40px, 12.4cqi, 48px);
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255,255,255,.13);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.14);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          font-size: clamp(18px, 6.2cqi, 24px);
          transition: background .18s ease, transform .18s ease;
        }

        .rail-button small {
          color: rgba(255,255,255,.82);
          font-size: clamp(9px, 2.9cqi, 11px);
          font-weight: 800;
        }

        .rail-button:active {
          transform: scale(.88);
        }

        .rail-button.is-liked span {
          color: white;
          background: color-mix(in srgb, #ff2d55 72%, rgba(255,255,255,.15));
          transform: scale(1.08);
        }

        .caption-pill {
          position: absolute;
          left: 5cqi;
          right: 5cqi;
          bottom: 18cqi;
          z-index: 4;
          height: clamp(24px, 7.6cqi, 30px);
          display: flex;
          align-items: center;
          gap: 2cqi;
          padding: 0 3cqi;
          border-radius: 999px;
          color: rgba(255,255,255,.72);
          background: rgba(0,0,0,.34);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.1);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          font-size: clamp(9px, 2.9cqi, 11px);
          font-weight: 700;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: var(--accent);
          box-shadow: 0 0 18px var(--accent);
        }

        .bottom-tabs {
          bottom: 0;
          height: 16cqi;
          min-height: 44px;
          max-height: 66px;
          padding: 0 16cqi;
          justify-content: center;
          gap: 3.6cqi;
          background: linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,0));
        }

        .bottom-tabs button {
          width: 30px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          pointer-events: auto;
        }

        .bottom-tabs span {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(255,255,255,.42);
          transition: width .24s cubic-bezier(.2,.8,.2,1), background .24s ease, transform .18s ease;
        }

        .bottom-tabs button.is-active span {
          width: 24px;
          background: var(--active-accent);
          box-shadow: 0 0 20px color-mix(in srgb, var(--active-accent) 60%, transparent);
        }

        .bottom-tabs button:active span {
          transform: scale(.76);
        }

        .comment-sheet {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 45;
          height: 62%;
          min-height: 260px;
          padding: 10px 5cqi 18px;
          border-radius: 30px 30px 0 0;
          background: rgba(12,13,18,.88);
          box-shadow: 0 -20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.14);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          transform: translate3d(0, 105%, 0);
          transition: transform .42s cubic-bezier(.18, .92, .18, 1);
          will-change: transform;
        }

        .comment-sheet.is-open {
          transform: translate3d(0, 0, 0);
        }

        .sheet-handle {
          width: 44px;
          height: 5px;
          margin: 0 auto 16px;
          border-radius: 999px;
          background: rgba(255,255,255,.22);
        }

        .sheet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .comment-stack {
          display: grid;
          gap: 8px;
        }

        .comment-stack p {
          margin: 0;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(255,255,255,.08);
          color: rgba(255,255,255,.78);
          font-size: clamp(11px, 3.2cqi, 13px);
          line-height: 1.35;
        }

        .comment-stack strong {
          color: white;
        }

        .composer {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 6px 0 16px;
          border-radius: 999px;
          color: rgba(255,255,255,.48);
          background: rgba(255,255,255,.1);
          font-size: clamp(11px, 3.2cqi, 13px);
        }

        .composer button {
          height: 30px;
          padding: 0 14px;
          border: 0;
          border-radius: 999px;
          color: #050505;
          background: white;
          font-weight: 900;
          font-size: clamp(11px, 3.2cqi, 13px);
        }

        @keyframes materialSpin {
          from { transform: rotate(0deg) scale(1.08); }
          to { transform: rotate(360deg) scale(1.08); }
        }

        @keyframes shimmerTrack {
          from { transform: rotate(-8deg) translate3d(-8%, -4%, 0) scale(1.04); }
          to { transform: rotate(-4deg) translate3d(8%, 5%, 0) scale(1.12); }
        }

        @media (prefers-reduced-motion: reduce) {
          .feed-card::before,
          .moving-material {
            animation: none;
          }

          .comment-sheet,
          .rail-button,
          .glass-button,
          .bottom-tabs span {
            transition-duration: .01ms;
          }
        }
      `}</style>
    </section>
  );
}
