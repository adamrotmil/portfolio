"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seed: number;
  /** Blend ratio between cool (silver) and warm (gold) color. 0..1. */
  temp: number;
};

type State = {
  particles: Particle[];
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  burstTime: number;
  w: number;
  h: number;
  /** The material-sample rectangle particles are confined to. */
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
};

const PARTICLE_COUNT = 900;
const BURST_RADIUS = 62;
const BURST_STRENGTH = 1.1;
const HOLD_STRENGTH = 0.75;
const FRICTION = 0.9;
const NOISE_FORCE = 0.05;

/**
 * Teaches: particle systems as a material. A cloud of cheap entities under
 * a shared noise field, each particle additively blended with `lighter`
 * composition, produces a continuous metallic material out of discrete
 * points. Input perturbs the field in two ways: a radial impulse that
 * disperses particles, and a temperature scalar that shifts their color.
 * Re-skin the same loop to render smoke, sand, water, or fabric.
 */
export default function TurbulenceBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const state: State = {
      particles: [],
      pointerX: 0,
      pointerY: 0,
      pointerActive: false,
      burstTime: -Infinity,
      w: 0,
      h: 0,
      boxX: 0,
      boxY: 0,
      boxW: 0,
      boxH: 0,
    };

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      state.w = rect.width;
      state.h = rect.height;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      // setTransform resets any prior scale so resizes don't compound.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const size = Math.min(state.w, state.h) * 0.62;
      state.boxW = size;
      state.boxH = size;
      state.boxX = (state.w - size) / 2;
      state.boxY = (state.h - size) / 2;
    }
    resize();

    // Seed particles uniformly across the material box.
    state.particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: state.boxX + Math.random() * state.boxW,
      y: state.boxY + Math.random() * state.boxH,
      vx: 0,
      vy: 0,
      seed: Math.random() * 1000,
      temp: Math.random() * 0.15,
    }));

    let t = 0;
    let raf = 0;

    function loop() {
      if (!ctx) return;
      t += 0.016;

      ctx.clearRect(0, 0, state.w, state.h);

      // Faint outline of the material-sample rectangle
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      roundRect(
        ctx,
        state.boxX - 4,
        state.boxY - 4,
        state.boxW + 8,
        state.boxH + 8,
        14,
      );
      ctx.stroke();

      const sinceBurst = t - state.burstTime;
      const burstDecay = Math.max(0, 1 - sinceBurst / 0.55);

      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < state.particles.length; i++) {
        const p = state.particles[i];

        // Cheap curl-like noise — two offset sinusoids combine into an
        // angle that varies smoothly across space and time. Good enough
        // for a "material turbulence" feel without a noise library.
        const n =
          Math.sin(p.x * 0.018 + t * 0.45 + p.seed * 0.01) +
          Math.cos(p.y * 0.019 - t * 0.32 + p.seed * 0.013);
        const angle = n * Math.PI;
        p.vx += Math.cos(angle) * NOISE_FORCE;
        p.vy += Math.sin(angle) * NOISE_FORCE;

        // Pointer / burst force — radial push outward from the pointer
        // and a temperature shift that warms the material locally.
        if (state.pointerActive || burstDecay > 0) {
          const dx = p.x - state.pointerX;
          const dy = p.y - state.pointerY;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
          if (d < BURST_RADIUS) {
            const fall = (BURST_RADIUS - d) / BURST_RADIUS;
            const force =
              fall * (state.pointerActive ? HOLD_STRENGTH : burstDecay * BURST_STRENGTH);
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
            if (state.pointerActive) {
              p.temp = Math.min(1, p.temp + fall * 0.08);
            }
          }
        }

        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;

        // Soft walls — bounce back with energy loss.
        const pad = 2;
        if (p.x < state.boxX + pad) {
          p.x = state.boxX + pad;
          p.vx *= -0.4;
        } else if (p.x > state.boxX + state.boxW - pad) {
          p.x = state.boxX + state.boxW - pad;
          p.vx *= -0.4;
        }
        if (p.y < state.boxY + pad) {
          p.y = state.boxY + pad;
          p.vy *= -0.4;
        } else if (p.y > state.boxY + state.boxH - pad) {
          p.y = state.boxY + state.boxH - pad;
          p.vy *= -0.4;
        }

        // Temperature relaxes toward cool over time.
        p.temp *= 0.985;

        // Blend between cool titanium silver and warm gold.
        const r = 178 + (232 - 178) * p.temp;
        const g = 188 + (184 - 188) * p.temp;
        const b = 200 + (128 - 200) * p.temp;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},0.36)`;
        ctx.fillRect(p.x, p.y, 1.3, 1.3);
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function updatePointer(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      state.pointerX = e.clientX - rect.left;
      state.pointerY = e.clientY - rect.top;
    }
    function onPointerMove(e: PointerEvent) {
      updatePointer(e);
    }
    function onPointerDown(e: PointerEvent) {
      updatePointer(e);
      state.pointerActive = true;
      state.burstTime = t;
    }
    function onPointerUp() {
      state.pointerActive = false;
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
      />
      <div className="pointer-events-none absolute bottom-3 left-3 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-white/45">
        Press + drag
      </div>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
