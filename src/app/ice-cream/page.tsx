"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Flavor = {
  name: string;
  color: string;
  highlight: string;
  shadow: string;
  emoji: string;
};

type Topping = {
  name: string;
  emoji: string;
  color: string;
};

type GamePhase = "menu" | "playing" | "result";

type Sparkle = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
};

type Customer = {
  id: number;
  name: string;
  skinTone: string;
  skinHighlight: string;
  skinShadow: string;
  shirtColor: string;
  shirtHighlight: string;
  hairColor: string;
  hairHighlight: string;
  hat: boolean;
  hatStyle: number;
  eyeStyle: number;
  mouthStyle: number;
  order: Flavor[];
  toppings: Topping[];
  x: number;
  targetX: number;
  y: number;
  state: "walking-in" | "waiting" | "served" | "walking-out";
  reaction: string;
  patience: number;
  sitting: boolean;
  scale: number;
};

// ── Constants ──────────────────────────────────────────────────────────────────
const FLAVORS: Flavor[] = [
  { name: "Vanilla", color: "#FFF5D6", highlight: "#FFFEF0", shadow: "#E8D5A0", emoji: "🍦" },
  { name: "Chocolate", color: "#5C2E0E", highlight: "#7A4420", shadow: "#3D1A00", emoji: "🍫" },
  { name: "Strawberry", color: "#FF7EA8", highlight: "#FFB0CB", shadow: "#D4567A", emoji: "🍓" },
  { name: "Mint Chip", color: "#8EEDC7", highlight: "#B8FFE0", shadow: "#5CC49A", emoji: "🌿" },
  { name: "Blueberry", color: "#7B8FD4", highlight: "#A5B5F0", shadow: "#4E5FA0", emoji: "🫐" },
  { name: "Mango", color: "#FFB830", highlight: "#FFD470", shadow: "#D48E00", emoji: "🥭" },
];

const CUSTOMER_NAMES = [
  "Timmy", "Sarah", "Marco", "Rose", "DJ Freeze",
  "Lola", "Captain C", "Prof. Swirl", "Tiny Ted", "Big Betty",
  "Mia", "Jake", "Zoe", "Oliver", "Luna",
];

const SKIN_TONES = [
  { base: "#FFDBB4", highlight: "#FFE8CC", shadow: "#E0B890" },
  { base: "#E8B88A", highlight: "#F0CCA4", shadow: "#C89868" },
  { base: "#C68642", highlight: "#D8A060", shadow: "#A06830" },
  { base: "#8D5524", highlight: "#A86E3A", shadow: "#6B3E16" },
  { base: "#6B3E26", highlight: "#845838", shadow: "#4A2810" },
];
const SHIRT_COLORS = [
  { base: "#FF6B6B", highlight: "#FF9B9B" },
  { base: "#4ECDC4", highlight: "#7EEEE5" },
  { base: "#45B7D1", highlight: "#75D7F1" },
  { base: "#96CEB4", highlight: "#B6EED4" },
  { base: "#FFEAA7", highlight: "#FFF5D0" },
  { base: "#DDA0DD", highlight: "#EECCEE" },
  { base: "#FF8C69", highlight: "#FFB499" },
  { base: "#87CEEB", highlight: "#B7EEFF" },
];
const HAIR_COLORS = [
  { base: "#2C1B0E", highlight: "#4A3520" },
  { base: "#5C3317", highlight: "#7A5030" },
  { base: "#8B6914", highlight: "#AA8830" },
  { base: "#D4A017", highlight: "#E8BE40" },
  { base: "#C04000", highlight: "#E06020" },
  { base: "#1A1A2E", highlight: "#303050" },
];

const TOPPINGS: Topping[] = [
  { name: "Sprinkles", emoji: "✨", color: "#FF69B4" },
  { name: "Cherries", emoji: "🍒", color: "#DC143C" },
  { name: "Whipped Cream", emoji: "☁️", color: "#FFFDD0" },
  { name: "Hot Fudge", emoji: "🍫", color: "#3D1C02" },
  { name: "Gummy Bears", emoji: "🐻", color: "#FF6347" },
];

const REACTIONS = {
  happy: ["Yay!", "Thanks!", "Yummy!", "Perfect!", "Love it!"],
  impatient: ["Hurry!", "Um...", "Hello?", "Waiting..."],
};

const COUNTER_Y = 340;
const FLOOR_Y = 460;
const STORE_WIDTH = 500;
const STORE_HEIGHT = 520;

// ── Helpers ────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lighten(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function darken(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amt);
  const g = Math.max(0, ((num >> 8) & 0xff) - amt);
  const b = Math.max(0, (num & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function generateOrder(level: number): Flavor[] {
  const count = Math.min(1 + Math.floor((level + 1) / 2), 6);
  return Array.from({ length: count }, () => pick(FLAVORS));
}

function generateToppings(level: number): Topping[] {
  if (level < 2) return [];
  const chance = Math.min(0.3 + level * 0.1, 0.8);
  if (Math.random() > chance) return [];
  const count = Math.min(1 + Math.floor(level / 3), 3);
  const chosen: Topping[] = [];
  const available = [...TOPPINGS];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    chosen.push(available.splice(idx, 1)[0]);
  }
  return chosen;
}

// ── Sound helpers ─────────────────────────────────────────────────────────────
function playDing() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.type = "sine";
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.type = "sine";
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.5);
  } catch { /* audio not available */ }
}

function playCorrectSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* */ }
}

function playWrongSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* */ }
}

function createMusicContext(): { ctx: AudioContext; stop: () => void } | null {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const notes = [
      523, 587, 659, 698, 784, 698, 659, 587,
      523, 659, 784, 880, 784, 659, 523, 440,
      523, 523, 587, 587, 659, 659, 698, 784,
      880, 784, 698, 659, 587, 523, 440, 523,
    ];
    const noteDuration = 0.22;
    const loopLength = notes.length * noteDuration;
    let stopped = false;

    function scheduleLoop(startTime: number) {
      if (stopped) return;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.type = "triangle";
        const t = startTime + i * noteDuration;
        osc.frequency.setValueAtTime(freq, t);
        noteGain.gain.setValueAtTime(0, t);
        noteGain.gain.linearRampToValueAtTime(0.5, t + 0.02);
        noteGain.gain.linearRampToValueAtTime(0.3, t + noteDuration * 0.5);
        noteGain.gain.linearRampToValueAtTime(0, t + noteDuration * 0.95);
        osc.start(t);
        osc.stop(t + noteDuration);
      });
      setTimeout(() => scheduleLoop(startTime + loopLength), (loopLength - 1) * 1000);
    }

    scheduleLoop(ctx.currentTime + 0.1);

    return {
      ctx,
      stop: () => {
        stopped = true;
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        setTimeout(() => ctx.close(), 600);
      },
    };
  } catch {
    return null;
  }
}

function createCustomer(id: number, level: number): Customer {
  const order = generateOrder(level);
  const toppings = generateToppings(level);
  const skin = pick(SKIN_TONES);
  const shirt = pick(SHIRT_COLORS);
  const hair = pick(HAIR_COLORS);
  return {
    id,
    name: pick(CUSTOMER_NAMES),
    skinTone: skin.base,
    skinHighlight: skin.highlight,
    skinShadow: skin.shadow,
    shirtColor: shirt.base,
    shirtHighlight: shirt.highlight,
    hairColor: hair.base,
    hairHighlight: hair.highlight,
    hat: Math.random() > 0.65,
    hatStyle: Math.floor(Math.random() * 3),
    eyeStyle: Math.floor(Math.random() * 3),
    mouthStyle: Math.floor(Math.random() * 3),
    order,
    toppings,
    x: STORE_WIDTH + 20,
    targetX: 160 + Math.random() * 80,
    y: FLOOR_Y,
    state: "walking-in",
    reaction: "",
    patience: 100,
    sitting: Math.random() > 0.6,
    scale: 0.9 + Math.random() * 0.35,
  };
}


// ── SVG Gradient Definitions ──────────────────────────────────────────────────
function GradientDefs() {
  return (
    <defs>
      {/* Warm ambient light */}
      <radialGradient id="ambientLight" cx="50%" cy="20%" r="80%">
        <stop offset="0%" stopColor="#FFFAF0" stopOpacity="0.3" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>

      {/* Wall gradient */}
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFF8F0" />
        <stop offset="60%" stopColor="#FFF0E0" />
        <stop offset="100%" stopColor="#FFE8D0" />
      </linearGradient>

      {/* Floor gradient */}
      <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F5E6D0" />
        <stop offset="100%" stopColor="#E8D5BC" />
      </linearGradient>

      {/* Counter wood gradient */}
      <linearGradient id="counterWood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D4A050" />
        <stop offset="30%" stopColor="#C08830" />
        <stop offset="70%" stopColor="#B07820" />
        <stop offset="100%" stopColor="#A06810" />
      </linearGradient>

      {/* Counter top shine */}
      <linearGradient id="counterTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E8C070" />
        <stop offset="40%" stopColor="#D4A850" />
        <stop offset="100%" stopColor="#C09030" />
      </linearGradient>

      {/* Glass display gradient */}
      <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(220,240,255,0.4)" />
        <stop offset="50%" stopColor="rgba(200,230,255,0.2)" />
        <stop offset="100%" stopColor="rgba(180,220,255,0.35)" />
      </linearGradient>

      {/* Ice cream scoop gradients for each flavor */}
      {FLAVORS.map((f, i) => (
        <radialGradient key={`scoop${i}`} id={`scoopGrad${i}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={f.highlight} />
          <stop offset="50%" stopColor={f.color} />
          <stop offset="100%" stopColor={f.shadow} />
        </radialGradient>
      ))}

      {/* Cone gradient */}
      <linearGradient id="coneGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E8B860" />
        <stop offset="30%" stopColor="#D4A040" />
        <stop offset="70%" stopColor="#C08830" />
        <stop offset="100%" stopColor="#A07020" />
      </linearGradient>

      {/* Menu board */}
      <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3D2B1A" />
        <stop offset="100%" stopColor="#1A0E06" />
      </linearGradient>

      {/* Shelf wood */}
      <linearGradient id="shelfGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#C89850" />
        <stop offset="100%" stopColor="#A07030" />
      </linearGradient>

      {/* Door gradient */}
      <linearGradient id="doorGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#A07820" />
        <stop offset="50%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#705510" />
      </linearGradient>

      {/* Light glow */}
      <radialGradient id="lightGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFACD" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#FFFACD" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFFACD" stopOpacity="0" />
      </radialGradient>

      {/* Patience bar gradient */}
      <linearGradient id="patienceGreen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#66BB6A" />
        <stop offset="100%" stopColor="#43A047" />
      </linearGradient>
      <linearGradient id="patienceOrange" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#FFB74D" />
        <stop offset="100%" stopColor="#FF9800" />
      </linearGradient>
      <linearGradient id="patienceRed" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#EF5350" />
        <stop offset="100%" stopColor="#D32F2F" />
      </linearGradient>

      {/* Drop shadow filter */}
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#00000030" />
      </filter>
      <filter id="heavyShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="3" stdDeviation="3" floodColor="#00000040" />
      </filter>
      <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Bubble shadow */}
      <filter id="bubbleShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000015" />
      </filter>
    </defs>
  );
}


// ── SVG Components ─────────────────────────────────────────────────────────────

function StoreBackground() {
  return (
    <g>
      {/* Back wall with gradient */}
      <rect x={0} y={0} width={STORE_WIDTH} height={STORE_HEIGHT} fill="url(#wallGrad)" />

      {/* Wallpaper pattern - subtle diamonds */}
      {Array.from({ length: 20 }, (_, i) =>
        Array.from({ length: 10 }, (_, j) => (
          <g key={`wp${i}${j}`}>
            <rect
              x={i * 26 + (j % 2 === 0 ? 0 : 13)}
              y={j * 30 + 5}
              width={8}
              height={8}
              rx={1}
              fill="#FFE4D6"
              opacity={0.25}
              transform={`rotate(45, ${i * 26 + (j % 2 === 0 ? 4 : 17)}, ${j * 30 + 9})`}
            />
          </g>
        ))
      )}

      {/* Ambient lighting overlay */}
      <rect x={0} y={0} width={STORE_WIDTH} height={STORE_HEIGHT} fill="url(#ambientLight)" />

      {/* Hanging pendant lights */}
      {[130, 260, 390].map((lx, i) => (
        <g key={`light${i}`}>
          <line x1={lx} y1={0} x2={lx} y2={20} stroke="#444" strokeWidth={1.5} />
          <rect x={lx - 3} y={15} width={6} height={4} rx={1} fill="#555" />
          {/* Lamp shade */}
          <path d={`M ${lx - 18} 19 Q ${lx} 16 ${lx + 18} 19 L ${lx + 14} 32 Q ${lx} 34 ${lx - 14} 32 Z`}
            fill={i === 1 ? "#E8A060" : "#D4956B"} stroke="#C08050" strokeWidth={0.5} />
          {/* Bulb glow */}
          <ellipse cx={lx} cy={36} rx={30} ry={12} fill="url(#lightGlow)" />
          {/* Inner shade highlight */}
          <path d={`M ${lx - 12} 22 Q ${lx} 20 ${lx + 12} 22 L ${lx + 10} 30 Q ${lx} 31 ${lx - 10} 30 Z`}
            fill="#FFFACD" opacity={0.15} />
        </g>
      ))}

      {/* Wooden shelves with brackets */}
      {[[25, 65, 170], [280, 85, 150]].map(([sx, sy, sw], si) => (
        <g key={`shelf${si}`}>
          <rect x={sx} y={sy} width={sw} height={10} rx={2} fill="url(#shelfGrad)" filter="url(#softShadow)" />
          {/* Shelf brackets */}
          <path d={`M ${sx + 10} ${sy + 10} L ${sx + 10} ${sy + 22} L ${sx + 22} ${sy + 10}`}
            stroke="#A07030" strokeWidth={2} fill="none" />
          <path d={`M ${sx + sw - 10} ${sy + 10} L ${sx + sw - 10} ${sy + 22} L ${sx + sw - 22} ${sy + 10}`}
            stroke="#A07030" strokeWidth={2} fill="none" />

          {/* Decorative jars on shelves */}
          {Array.from({ length: Math.floor(sw / 40) }, (_, ji) => {
            const jx = sx + 15 + ji * 40;
            const flavor = FLAVORS[(si * 3 + ji) % FLAVORS.length];
            return (
              <g key={`jar${si}${ji}`} filter="url(#softShadow)">
                {/* Jar body */}
                <rect x={jx} y={sy - 28} width={22} height={28} rx={5}
                  fill={flavor.color} stroke={flavor.shadow} strokeWidth={1} />
                {/* Jar highlight */}
                <rect x={jx + 3} y={sy - 25} width={6} height={18} rx={3}
                  fill={flavor.highlight} opacity={0.5} />
                {/* Jar lid */}
                <rect x={jx - 1} y={sy - 31} width={24} height={5} rx={2.5}
                  fill="#DDD" stroke="#BBB" strokeWidth={0.5} />
                <rect x={jx + 7} y={sy - 34} width={8} height={4} rx={2}
                  fill="#CCC" stroke="#AAA" strokeWidth={0.5} />
              </g>
            );
          })}
        </g>
      ))}

      {/* Menu board - chalkboard style */}
      <g filter="url(#heavyShadow)">
        <rect x={185} y={35} width={130} height={80} rx={5} fill="url(#boardGrad)" />
        {/* Board frame */}
        <rect x={183} y={33} width={134} height={84} rx={6} fill="none" stroke="#6B4F12" strokeWidth={3} />
        {/* Chalk text */}
        <text x={250} y={58} textAnchor="middle" fill="#FFF" fontSize={14} fontWeight="bold"
          style={{ fontFamily: "var(--font-instrument-serif)" }}>MENU</text>
        <line x1={210} y1={62} x2={290} y2={62} stroke="#FFF" strokeWidth={0.5} opacity={0.4} />
        <text x={250} y={78} textAnchor="middle" fill="#FFD700" fontSize={9}>Single $2 | Double $3</text>
        <text x={250} y={92} textAnchor="middle" fill="#FFD700" fontSize={9}>Toppings +$0.50</text>
        <text x={250} y={106} textAnchor="middle" fill="#FFA" fontSize={7} opacity={0.6}>Fresh Daily!</text>
      </g>

      {/* Display case / counter */}
      <g>
        {/* Counter body */}
        <rect x={0} y={COUNTER_Y - 45} width={STORE_WIDTH} height={60} rx={4}
          fill="url(#counterWood)" stroke="#8B6914" strokeWidth={1.5} />

        {/* Glass display front */}
        <rect x={8} y={COUNTER_Y - 40} width={STORE_WIDTH - 16} height={42} rx={4}
          fill="url(#glassGrad)" stroke="rgba(180,220,255,0.6)" strokeWidth={1} />

        {/* Glass reflection streak */}
        <line x1={15} y1={COUNTER_Y - 38} x2={STORE_WIDTH - 40} y2={COUNTER_Y - 38}
          stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />

        {/* Ice cream tubs in display */}
        {FLAVORS.map((f, i) => {
          const tx = 18 + i * 78;
          return (
            <g key={`tub${i}`}>
              {/* Tub container */}
              <rect x={tx} y={COUNTER_Y - 32} width={62} height={26} rx={8}
                fill="#F5F5F5" stroke="#DDD" strokeWidth={1} />
              {/* Ice cream in tub */}
              <ellipse cx={tx + 31} cy={COUNTER_Y - 30} rx={28} ry={8}
                fill={`url(#scoopGrad${i})`} />
              {/* Scoop marks */}
              <ellipse cx={tx + 20} cy={COUNTER_Y - 32} rx={8} ry={4}
                fill={f.highlight} opacity={0.6} />
              <ellipse cx={tx + 40} cy={COUNTER_Y - 31} rx={7} ry={3.5}
                fill={f.highlight} opacity={0.4} />
              {/* Label */}
              <text x={tx + 31} y={COUNTER_Y - 10} textAnchor="middle" fontSize={7}
                fill="#666" fontWeight="bold">{f.emoji}</text>
            </g>
          );
        })}

        {/* Counter top surface - polished wood */}
        <rect x={0} y={COUNTER_Y + 10} width={STORE_WIDTH} height={10} fill="url(#counterTop)" />
        {/* Shine on counter top */}
        <rect x={0} y={COUNTER_Y + 11} width={STORE_WIDTH} height={2}
          fill="rgba(255,255,255,0.25)" />
      </g>

      {/* Floor with perspective tiles */}
      <rect x={0} y={COUNTER_Y + 20} width={STORE_WIDTH} height={STORE_HEIGHT - COUNTER_Y} fill="url(#floorGrad)" />
      {Array.from({ length: 17 }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => (
          <rect
            key={`tile${i}${j}`}
            x={i * 32}
            y={COUNTER_Y + 20 + j * 30}
            width={32}
            height={30}
            fill={(i + j) % 2 === 0 ? "rgba(139,105,75,0.06)" : "rgba(160,128,96,0.04)"}
            stroke="rgba(180,150,120,0.1)"
            strokeWidth={0.5}
          />
        ))
      )}

      {/* Door on right - detailed */}
      <g filter="url(#softShadow)">
        {/* Door frame */}
        <rect x={STORE_WIDTH - 62} y={COUNTER_Y + 22} width={54} height={STORE_HEIGHT - COUNTER_Y - 24}
          fill="#6B4F12" rx={2} />
        {/* Door panels */}
        <rect x={STORE_WIDTH - 58} y={COUNTER_Y + 26} width={46} height={STORE_HEIGHT - COUNTER_Y - 32}
          fill="url(#doorGrad)" rx={2} />
        {/* Upper panel */}
        <rect x={STORE_WIDTH - 54} y={COUNTER_Y + 32} width={38} height={40}
          fill="none" stroke="#6B4F12" strokeWidth={1.5} rx={2} />
        {/* Lower panel */}
        <rect x={STORE_WIDTH - 54} y={COUNTER_Y + 80} width={38} height={STORE_HEIGHT - COUNTER_Y - 90}
          fill="none" stroke="#6B4F12" strokeWidth={1.5} rx={2} />
        {/* Door window */}
        <rect x={STORE_WIDTH - 50} y={COUNTER_Y + 36} width={30} height={32} rx={2}
          fill="rgba(180,220,255,0.3)" stroke="rgba(150,200,240,0.5)" strokeWidth={1} />
        {/* OPEN sign */}
        <rect x={STORE_WIDTH - 48} y={COUNTER_Y + 42} width={26} height={14} rx={3}
          fill="#D32F2F" />
        <text x={STORE_WIDTH - 35} y={COUNTER_Y + 53} textAnchor="middle" fontSize={8}
          fill="#FFF" fontWeight="bold">OPEN</text>
        {/* Doorknob */}
        <circle cx={STORE_WIDTH - 18} cy={COUNTER_Y + 90} r={4} fill="#FFD700"
          stroke="#DAA520" strokeWidth={1} />
        <circle cx={STORE_WIDTH - 18} cy={COUNTER_Y + 90} r={1.5} fill="#FFF8DC" />
      </g>

      {/* Bell above door */}
      <g>
        <line x1={STORE_WIDTH - 35} y1={COUNTER_Y + 20} x2={STORE_WIDTH - 35} y2={COUNTER_Y + 14} stroke="#888" strokeWidth={0.5} />
        <circle cx={STORE_WIDTH - 35} cy={COUNTER_Y + 12} r={5} fill="#FFD700" stroke="#DAA520" strokeWidth={1} />
        <circle cx={STORE_WIDTH - 35} cy={COUNTER_Y + 12} r={2} fill="#FFF8DC" />
        <line x1={STORE_WIDTH - 35} y1={COUNTER_Y + 15} x2={STORE_WIDTH - 35} y2={COUNTER_Y + 18} stroke="#DAA520" strokeWidth={0.5} />
        <circle cx={STORE_WIDTH - 35} cy={COUNTER_Y + 18} r={1} fill="#DAA520" />
      </g>
    </g>
  );
}


function PersonSprite({
  x, y, skinTone, skinHighlight, skinShadow,
  shirtColor, shirtHighlight, hairColor, hairHighlight,
  hat, hatStyle, eyeStyle, mouthStyle, facing, walking, scale,
}: {
  x: number; y: number;
  skinTone: string; skinHighlight: string; skinShadow: string;
  shirtColor: string; shirtHighlight: string;
  hairColor: string; hairHighlight: string;
  hat: boolean; hatStyle: number; eyeStyle: number; mouthStyle: number;
  facing: "left" | "right"; walking: boolean; scale: number;
}) {
  const dir = facing === "left" ? -1 : 1;
  const legOffset = walking ? Math.sin(Date.now() / 150) * 6 : 0;
  const s = scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${dir * s}, ${s})`} filter="url(#softShadow)">
      {/* Shadow on ground */}
      <ellipse cx={0} cy={38} rx={16} ry={4} fill="rgba(0,0,0,0.12)" />

      {/* Legs with pants */}
      <rect x={-7} y={18} width={7} height={20} rx={3}
        fill="#4A4A6A" transform={`rotate(${legOffset}, -3.5, 18)`} />
      <rect x={2} y={18} width={7} height={20} rx={3}
        fill="#3A3A5A" transform={`rotate(${-legOffset}, 5.5, 18)`} />

      {/* Shoes - more detailed */}
      <ellipse cx={-3.5 + legOffset * 0.4} cy={38} rx={6} ry={3.5} fill="#2A2A2A" />
      <ellipse cx={-3.5 + legOffset * 0.4} cy={37} rx={5.5} ry={2.5} fill="#3A3A3A" />
      <ellipse cx={5.5 - legOffset * 0.4} cy={38} rx={6} ry={3.5} fill="#2A2A2A" />
      <ellipse cx={5.5 - legOffset * 0.4} cy={37} rx={5.5} ry={2.5} fill="#3A3A3A" />

      {/* Body - torso with shirt */}
      <rect x={-11} y={0} width={24} height={22} rx={7} fill={shirtColor} />
      {/* Shirt highlight */}
      <rect x={-6} y={2} width={8} height={16} rx={4} fill={shirtHighlight} opacity={0.4} />
      {/* Collar */}
      <path d={`M -4,-1 Q 1,-3 6,-1`} stroke={shirtHighlight} strokeWidth={1.5} fill="none" />

      {/* Arms */}
      <rect x={-16} y={2} width={7} height={18} rx={4} fill={shirtColor} />
      <rect x={11} y={2} width={7} height={18} rx={4} fill={shirtColor} />
      {/* Arm highlights */}
      <rect x={-14} y={4} width={3} height={12} rx={2} fill={shirtHighlight} opacity={0.3} />

      {/* Hands */}
      <circle cx={-13} cy={20} r={4} fill={skinTone} />
      <circle cx={-13} cy={20} r={2.5} fill={skinHighlight} opacity={0.3} />
      <circle cx={15} cy={20} r={4} fill={skinTone} />

      {/* Head */}
      <ellipse cx={1} cy={-10} rx={13} ry={14} fill={skinTone} />
      {/* Face highlight */}
      <ellipse cx={-2} cy={-14} rx={7} ry={8} fill={skinHighlight} opacity={0.3} />
      {/* Cheek blush */}
      <ellipse cx={-7} cy={-4} rx={3} ry={2} fill="#FFB0B0" opacity={0.25} />
      <ellipse cx={9} cy={-4} rx={3} ry={2} fill="#FFB0B0" opacity={0.25} />

      {/* Ears */}
      <ellipse cx={-12} cy={-8} rx={3} ry={4} fill={skinTone} />
      <ellipse cx={-12} cy={-8} rx={1.5} ry={2.5} fill={skinShadow} opacity={0.3} />
      <ellipse cx={14} cy={-8} rx={3} ry={4} fill={skinTone} />

      {/* Hair - more detailed */}
      <ellipse cx={1} cy={-18} rx={13} ry={8} fill={hairColor} />
      <ellipse cx={-3} cy={-20} rx={8} ry={5} fill={hairHighlight} opacity={0.3} />
      {/* Side hair */}
      <rect x={-14} y={-18} width={5} height={10} rx={2.5} fill={hairColor} />
      <rect x={11} y={-18} width={5} height={10} rx={2.5} fill={hairColor} />

      {/* Hat variations */}
      {hat && hatStyle === 0 && (
        <g>
          {/* Baseball cap */}
          <ellipse cx={1} cy={-22} rx={15} ry={4} fill={shirtColor} />
          <rect x={-12} y={-28} width={26} height={8} rx={4} fill={shirtColor} />
          <rect x={-12} y={-28} width={26} height={3} rx={2} fill={shirtHighlight} opacity={0.4} />
          {/* Brim */}
          <ellipse cx={-6} cy={-22} rx={12} ry={3} fill={shirtColor} />
        </g>
      )}
      {hat && hatStyle === 1 && (
        <g>
          {/* Beanie */}
          <path d={`M -12,-18 Q -13,-30 1,-32 Q 15,-30 14,-18`}
            fill={shirtColor} stroke={shirtHighlight} strokeWidth={0.5} />
          <rect x={-12} y={-20} width={26} height={4} rx={2} fill={darken(shirtColor, 20)} />
          <circle cx={1} cy={-32} r={3} fill={shirtHighlight} />
        </g>
      )}
      {hat && hatStyle === 2 && (
        <g>
          {/* Sun hat */}
          <ellipse cx={1} cy={-22} rx={18} ry={4} fill="#F5DEB3" stroke="#D2B48C" strokeWidth={0.5} />
          <rect x={-8} y={-30} width={18} height={10} rx={5} fill="#F5DEB3" />
          <rect x={-8} y={-30} width={18} height={3} rx={2} fill="#FFE4B5" opacity={0.5} />
          <rect x={-10} y={-22} width={22} height={2} fill="#D2B48C" opacity={0.3} />
        </g>
      )}

      {/* Eyes - variations */}
      {eyeStyle === 0 && (
        <g>
          {/* Round eyes with pupils */}
          <ellipse cx={-4} cy={-8} rx={3} ry={3.5} fill="white" />
          <circle cx={-3.5} cy={-7.5} r={2} fill="#2C1810" />
          <circle cx={-3} cy={-8.5} r={0.8} fill="white" />
          <ellipse cx={7} cy={-8} rx={3} ry={3.5} fill="white" />
          <circle cx={6.5} cy={-7.5} r={2} fill="#2C1810" />
          <circle cx={7} cy={-8.5} r={0.8} fill="white" />
        </g>
      )}
      {eyeStyle === 1 && (
        <g>
          {/* Oval eyes */}
          <ellipse cx={-4} cy={-8} rx={3.5} ry={2.5} fill="white" />
          <ellipse cx={-3.5} cy={-7.5} rx={2} ry={2} fill="#1A5276" />
          <circle cx={-3} cy={-8} r={0.7} fill="white" />
          <ellipse cx={7} cy={-8} rx={3.5} ry={2.5} fill="white" />
          <ellipse cx={6.5} cy={-7.5} rx={2} ry={2} fill="#1A5276" />
          <circle cx={7} cy={-8} r={0.7} fill="white" />
        </g>
      )}
      {eyeStyle === 2 && (
        <g>
          {/* Friendly squint */}
          <ellipse cx={-4} cy={-8} rx={3} ry={2} fill="white" />
          <circle cx={-3.5} cy={-7.5} r={1.8} fill="#4A2810" />
          <circle cx={-3} cy={-8} r={0.6} fill="white" />
          <ellipse cx={7} cy={-8} rx={3} ry={2} fill="white" />
          <circle cx={6.5} cy={-7.5} r={1.8} fill="#4A2810" />
          <circle cx={7} cy={-8} r={0.6} fill="white" />
        </g>
      )}

      {/* Eyebrows */}
      <path d={`M -7,-12 Q -4,-14 -1,-12`} stroke={hairColor} strokeWidth={1.2} fill="none" />
      <path d={`M 4,-12 Q 7,-14 10,-12`} stroke={hairColor} strokeWidth={1.2} fill="none" />

      {/* Nose */}
      <path d={`M 1,-6 Q 3,-4 1,-3`} stroke={skinShadow} strokeWidth={0.8} fill="none" opacity={0.5} />

      {/* Mouth variations */}
      {mouthStyle === 0 && (
        <path d="M -3,-1 Q 1,4 6,-1" stroke="#C0392B" strokeWidth={1.2} fill="none" />
      )}
      {mouthStyle === 1 && (
        <g>
          <path d="M -2,0 Q 1,3 5,0" stroke="#C0392B" strokeWidth={1.2} fill="none" />
          <path d="M -1,0 Q 1,2 4,0" fill="#E74C3C" opacity={0.3} />
        </g>
      )}
      {mouthStyle === 2 && (
        <ellipse cx={1} cy={0} rx={3} ry={2} fill="#C0392B" opacity={0.8} />
      )}
    </g>
  );
}


function SpeechBubble({
  x, y, order, scoopsDone, reaction,
}: {
  x: number; y: number; order: Flavor[]; scoopsDone: number; reaction: string;
}) {
  const bubbleW = Math.max(90, order.length * 32 + 24);
  const bubbleH = reaction ? 36 : 48;
  const bx = Math.max(5, Math.min(x - bubbleW / 2, STORE_WIDTH - bubbleW - 5));
  const by = y - 75;

  return (
    <g filter="url(#bubbleShadow)">
      {/* Bubble with rounded corners */}
      <rect x={bx} y={by} width={bubbleW} height={bubbleH} rx={14}
        fill="white" stroke="#E0E0E0" strokeWidth={1.5} />
      {/* Inner shine */}
      <rect x={bx + 3} y={by + 2} width={bubbleW - 6} height={bubbleH / 2} rx={12}
        fill="rgba(255,255,255,0.6)" />
      {/* Tail */}
      <polygon
        points={`${x - 6},${by + bubbleH - 1} ${x + 6},${by + bubbleH - 1} ${x},${by + bubbleH + 12}`}
        fill="white" stroke="#E0E0E0" strokeWidth={1}
      />
      <line x1={x - 5} y1={by + bubbleH} x2={x + 5} y2={by + bubbleH} stroke="white" strokeWidth={3} />

      {reaction ? (
        <text x={bx + bubbleW / 2} y={by + 24} textAnchor="middle" fontSize={14} fontWeight="bold" fill="#333">
          {reaction}
        </text>
      ) : (
        <>
          {order.map((item, i) => {
            const done = i < scoopsDone;
            const isNext = i === scoopsDone;
            const sx = bx + 18 + i * 32;
            const flavorIdx = FLAVORS.findIndex(f => f.name === item.name);
            return (
              <g key={i} opacity={done ? 0.35 : 1}>
                {/* Scoop circle */}
                <circle cx={sx} cy={by + 20} r={12}
                  fill={`url(#scoopGrad${flavorIdx >= 0 ? flavorIdx : 0})`}
                  stroke={isNext ? "#333" : item.shadow}
                  strokeWidth={isNext ? 2.5 : 1.5} />
                {/* Glossy highlight */}
                <ellipse cx={sx - 3} cy={by + 16} rx={4} ry={3}
                  fill="rgba(255,255,255,0.35)" />
                {done && (
                  <text x={sx} y={by + 24} textAnchor="middle" fontSize={12}
                    fill="#4CAF50" fontWeight="bold">{"✓"}</text>
                )}
                <text x={sx} y={by + 40} textAnchor="middle" fontSize={6} fill="#999">
                  {item.name}
                </text>
              </g>
            );
          })}
        </>
      )}
    </g>
  );
}

function ConeStack({ x, y, scoops }: { x: number; y: number; scoops: Flavor[] }) {
  const coneH = 60;
  const scoopR = 20;

  return (
    <g filter="url(#heavyShadow)">
      {/* Cone with waffle texture */}
      <polygon
        points={`${x - 18},${y} ${x + 18},${y} ${x},${y + coneH}`}
        fill="url(#coneGrad)"
      />
      {/* Waffle pattern - diagonal lines */}
      <clipPath id="coneMask">
        <polygon points={`${x - 18},${y} ${x + 18},${y} ${x},${y + coneH}`} />
      </clipPath>
      <g clipPath="url(#coneMask)" opacity={0.3}>
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`wl${i}`}
            x1={x - 20 + i * 8} y1={y - 5}
            x2={x - 30 + i * 8} y2={y + coneH + 5}
            stroke="#A07020" strokeWidth={1} />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`wr${i}`}
            x1={x + 20 - i * 8} y1={y - 5}
            x2={x + 30 - i * 8} y2={y + coneH + 5}
            stroke="#A07020" strokeWidth={1} />
        ))}
      </g>
      {/* Cone rim */}
      <ellipse cx={x} cy={y} rx={18} ry={4} fill="#D4A040" stroke="#B88830" strokeWidth={1} />

      {/* Scoops - glossy with drip */}
      {scoops.map((scoop, i) => {
        const sy = y - 8 - i * (scoopR * 1.1);
        const flavorIdx = FLAVORS.findIndex(f => f.name === scoop.name);
        return (
          <g key={i}>
            {/* Scoop shadow */}
            <ellipse cx={x} cy={sy + 6} rx={scoopR + 2} ry={7}
              fill="rgba(0,0,0,0.1)" />
            {/* Main scoop - spherical with gradient */}
            <ellipse cx={x} cy={sy} rx={scoopR} ry={scoopR * 0.8}
              fill={`url(#scoopGrad${flavorIdx >= 0 ? flavorIdx : 0})`}
              stroke={scoop.shadow} strokeWidth={1} />
            {/* Glossy highlight */}
            <ellipse cx={x - 6} cy={sy - 5} rx={6} ry={4}
              fill="rgba(255,255,255,0.35)" />
            <ellipse cx={x - 3} cy={sy - 7} rx={3} ry={2}
              fill="rgba(255,255,255,0.5)" />
            {/* Subtle drip */}
            {i === 0 && (
              <path d={`M ${x + 10} ${sy + scoopR * 0.6} Q ${x + 12} ${sy + scoopR * 0.6 + 8} ${x + 10} ${sy + scoopR * 0.6 + 14}`}
                stroke={scoop.color} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.7} />
            )}
          </g>
        );
      })}
    </g>
  );
}

function BackgroundPerson({ seed }: { seed: number }) {
  const [x, setX] = useState(50 + (seed * 73) % 350);
  const dir = useRef(seed % 2 === 0 ? 1 : -1);
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const shirt = SHIRT_COLORS[(seed * 3) % SHIRT_COLORS.length];
  const hair = HAIR_COLORS[(seed * 2) % HAIR_COLORS.length];

  useEffect(() => {
    const interval = setInterval(() => {
      setX((prev) => {
        let next = prev + dir.current * 0.3;
        if (next > STORE_WIDTH - 80) dir.current = -1;
        if (next < 60) dir.current = 1;
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <g opacity={0.5}>
      <PersonSprite
        x={x} y={FLOOR_Y - 5}
        skinTone={skin.base} skinHighlight={skin.highlight} skinShadow={skin.shadow}
        shirtColor={shirt.base} shirtHighlight={shirt.highlight}
        hairColor={hair.base} hairHighlight={hair.highlight}
        hat={seed % 3 === 0} hatStyle={seed % 3} eyeStyle={seed % 3} mouthStyle={seed % 3}
        facing={dir.current > 0 ? "right" : "left"} walking={true} scale={0.7}
      />
    </g>
  );
}

// Sparkle effect component
function SparkleEffect({ sparkles }: { sparkles: Sparkle[] }) {
  return (
    <>
      {sparkles.map((s) => (
        <g key={s.id} opacity={s.opacity}>
          {/* 4-pointed star */}
          <path
            d={`M ${s.x} ${s.y - s.size} L ${s.x + s.size * 0.3} ${s.y} L ${s.x} ${s.y + s.size} L ${s.x - s.size * 0.3} ${s.y} Z`}
            fill={s.color}
          />
          <path
            d={`M ${s.x - s.size} ${s.y} L ${s.x} ${s.y + s.size * 0.3} L ${s.x + s.size} ${s.y} L ${s.x} ${s.y - s.size * 0.3} Z`}
            fill={s.color}
          />
          <circle cx={s.x} cy={s.y} r={s.size * 0.2} fill="white" />
        </g>
      ))}
    </>
  );
}


// ── Main Game ──────────────────────────────────────────────────────────────────
export default function IceCreamGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [customersServed, setCustomersServed] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [scoopsDone, setScoopsDone] = useState(0);
  const [coneScoops, setConeScoops] = useState<Flavor[]>([]);
  const [highScore, setHighScore] = useState(0);
  const [missedCustomers, setMissedCustomers] = useState(0);
  const [animatingScoop, setAnimatingScoop] = useState<Flavor | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [toppingsDone, setToppingsDone] = useState(0);
  const [toppingsPhase, setToppingsPhase] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [shake, setShake] = useState(false);
  const customerIdRef = useRef(0);
  const sparkleIdRef = useRef(0);
  const walkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicRef = useRef<{ ctx: AudioContext; stop: () => void } | null>(null);

  // Spawn sparkles at a position
  const spawnSparkles = useCallback((cx: number, cy: number, color: string) => {
    const newSparkles: Sparkle[] = Array.from({ length: 6 }, () => {
      sparkleIdRef.current += 1;
      return {
        id: sparkleIdRef.current,
        x: cx + (Math.random() - 0.5) * 50,
        y: cy + (Math.random() - 0.5) * 40,
        size: 4 + Math.random() * 6,
        opacity: 0.8 + Math.random() * 0.2,
        color,
      };
    });
    setSparkles((prev) => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.includes(s)));
    }, 600);
  }, []);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("scoopstack-highscore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("scoopstack-highscore", score.toString());
    }
  }, [score, highScore]);

  // Walk customer in (from the door on the right)
  const walkCustomerIn = useCallback((c: Customer) => {
    setCustomer({ ...c });
    playDing();
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);

    walkIntervalRef.current = setInterval(() => {
      setCustomer((prev) => {
        if (!prev || prev.state !== "walking-in") return prev;
        const newX = prev.x - 3;
        if (newX <= prev.targetX) {
          return { ...prev, x: prev.targetX, state: "waiting" };
        }
        return { ...prev, x: newX };
      });
    }, 20);
  }, []);

  // Walk customer out (back out the door on the right)
  const walkCustomerOut = useCallback(() => {
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);

    walkIntervalRef.current = setInterval(() => {
      setCustomer((prev) => {
        if (!prev || prev.state !== "walking-out") return prev;
        const newX = prev.x + 4;
        if (newX > STORE_WIDTH + 60) {
          clearInterval(walkIntervalRef.current!);
          return null;
        }
        return { ...prev, x: newX };
      });
    }, 20);
  }, []);

  // Patience timer
  useEffect(() => {
    if (!customer || customer.state !== "waiting" || phase !== "playing") return;

    const interval = setInterval(() => {
      setCustomer((prev) => {
        if (!prev || prev.state !== "waiting") return prev;
        const newPatience = prev.patience - 0.5;

        if (newPatience <= 30 && newPatience > 29.5) {
          return { ...prev, patience: newPatience, reaction: pick(REACTIONS.impatient) };
        }

        if (newPatience <= 0) {
          setMissedCustomers((m) => m + 1);
          return { ...prev, patience: 0, state: "walking-out", reaction: "😤 Too slow!" };
        }
        return { ...prev, patience: newPatience };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [customer?.state, customer?.id, phase]);

  // Walk out after being served
  useEffect(() => {
    if (customer?.state === "walking-out") {
      walkCustomerOut();
    }
  }, [customer?.state, walkCustomerOut]);

  // Send next customer after current leaves
  useEffect(() => {
    if (phase !== "playing") return;
    if (customer === null) {
      const timer = setTimeout(() => {
        customerIdRef.current += 1;
        const c = createCustomer(customerIdRef.current, level);
        setScoopsDone(0);
        setConeScoops([]);
        setAnimatingScoop(null);
        setToppingsDone(0);
        setToppingsPhase(false);
        walkCustomerIn(c);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [customer, phase, level, walkCustomerIn]);

  // Level up every 3 customers
  useEffect(() => {
    if (customersServed > 0 && customersServed % 3 === 0) {
      setLevel(Math.floor(customersServed / 3) + 1);
    }
  }, [customersServed]);

  // Game over at 3 missed
  useEffect(() => {
    if (missedCustomers >= 3 && phase === "playing") {
      setPhase("result");
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
      if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; setMusicOn(false); }
    }
  }, [missedCustomers, phase]);

  // Complete the order
  const completeOrder = useCallback(() => {
    if (!customer) return;
    const bonus = Math.ceil(customer.patience / 10) * 10;
    const toppingBonus = customer.toppings.length * 25;
    setScore((s) => s + 100 + bonus + toppingBonus);
    setCustomersServed((c) => c + 1);
    spawnSparkles(300, COUNTER_Y - 30, "#FFD700");
    setCustomer((prev) =>
      prev ? { ...prev, reaction: pick(REACTIONS.happy), state: "served" } : prev
    );
    setTimeout(() => {
      setCustomer((prev) => prev ? { ...prev, state: "walking-out" } : prev);
    }, 1200);
  }, [customer, spawnSparkles]);

  // Tap a flavor
  const tapFlavor = useCallback(
    (flavor: Flavor) => {
      if (!customer || customer.state !== "waiting") return;
      if (toppingsPhase) return;
      if (scoopsDone >= customer.order.length) return;

      const expectedFlavor = customer.order[scoopsDone];

      setAnimatingScoop(flavor);
      setTimeout(() => setAnimatingScoop(null), 300);

      if (flavor.name === expectedFlavor.name) {
        playCorrectSound();
        const newScoops = [...coneScoops, flavor];
        setConeScoops(newScoops);
        const newDone = scoopsDone + 1;
        setScoopsDone(newDone);
        spawnSparkles(300, COUNTER_Y - 20 - newScoops.length * 20, flavor.highlight);

        if (newDone === customer.order.length) {
          if (customer.toppings.length > 0) {
            setToppingsPhase(true);
          } else {
            completeOrder();
          }
        }
      } else {
        playWrongSound();
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setCustomer((prev) => prev ? { ...prev, reaction: "Wrong one!" } : prev);
        setTimeout(() => {
          setCustomer((prev) =>
            prev && prev.state === "waiting" ? { ...prev, reaction: "" } : prev
          );
        }, 600);
      }
    },
    [customer, scoopsDone, coneScoops, toppingsPhase, completeOrder, spawnSparkles]
  );

  // Tap a topping
  const tapTopping = useCallback(
    (topping: Topping) => {
      if (!customer || customer.state !== "waiting" || !toppingsPhase) return;
      if (toppingsDone >= customer.toppings.length) return;

      const expected = customer.toppings[toppingsDone];
      if (topping.name === expected.name) {
        playCorrectSound();
        const newDone = toppingsDone + 1;
        setToppingsDone(newDone);
        spawnSparkles(300, COUNTER_Y - 60, topping.color);
        if (newDone === customer.toppings.length) {
          completeOrder();
        }
      } else {
        playWrongSound();
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setCustomer((prev) => prev ? { ...prev, reaction: "Wrong topping!" } : prev);
        setTimeout(() => {
          setCustomer((prev) =>
            prev && prev.state === "waiting" ? { ...prev, reaction: "" } : prev
          );
        }, 600);
      }
    },
    [customer, toppingsPhase, toppingsDone, completeOrder, spawnSparkles]
  );

  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setCustomersServed(0);
    setMissedCustomers(0);
    setCustomer(null);
    setScoopsDone(0);
    setConeScoops([]);
    setToppingsDone(0);
    setToppingsPhase(false);
    setSparkles([]);
    customerIdRef.current = 0;
    setPhase("playing");
    if (musicRef.current) musicRef.current.stop();
    musicRef.current = createMusicContext();
    setMusicOn(true);
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.stop();
      musicRef.current = null;
      setMusicOn(false);
    } else {
      musicRef.current = createMusicContext();
      setMusicOn(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
      if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; }
    };
  }, []);

  const patienceGradient = useMemo(() => {
    if (!customer) return "patienceGreen";
    return customer.patience > 50 ? "patienceGreen" : customer.patience > 25 ? "patienceOrange" : "patienceRed";
  }, [customer?.patience]);


  // ── Menu ─────────────────────────────────────────────────────────────────────
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-pink-50 to-sky-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {FLAVORS.map((f, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                backgroundColor: f.color,
                opacity: 0.12,
                width: 100 + i * 30,
                height: 100 + i * 30,
                left: `${5 + (i * 27) % 75}%`,
                top: `${8 + (i * 19) % 80}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
                filter: "blur(20px)",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center">
          {/* Animated ice cream SVG */}
          <div className="mb-4 flex justify-center">
            <svg width={120} height={160} viewBox="0 0 120 160">
              <defs>
                <radialGradient id="menuScoop1" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#FFB0CB" />
                  <stop offset="100%" stopColor="#D4567A" />
                </radialGradient>
                <radialGradient id="menuScoop2" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#FFFEF0" />
                  <stop offset="100%" stopColor="#E8D5A0" />
                </radialGradient>
                <radialGradient id="menuScoop3" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#B8FFE0" />
                  <stop offset="100%" stopColor="#5CC49A" />
                </radialGradient>
                <linearGradient id="menuCone" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E8B860" />
                  <stop offset="100%" stopColor="#A07020" />
                </linearGradient>
                <filter id="menuShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#00000025" />
                </filter>
              </defs>
              <g filter="url(#menuShadow)">
                <polygon points="40,80 80,80 60,150" fill="url(#menuCone)" />
                {/* Waffle lines */}
                <clipPath id="menuConeMask"><polygon points="40,80 80,80 60,150" /></clipPath>
                <g clipPath="url(#menuConeMask)" opacity={0.25}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <line key={`ml${i}`} x1={30 + i * 10} y1={70} x2={20 + i * 10} y2={155}
                      stroke="#A07020" strokeWidth={1.5} />
                  ))}
                  {Array.from({ length: 6 }, (_, i) => (
                    <line key={`mr${i}`} x1={90 - i * 10} y1={70} x2={100 - i * 10} y2={155}
                      stroke="#A07020" strokeWidth={1.5} />
                  ))}
                </g>
                <ellipse cx={60} cy={80} rx={22} ry={5} fill="#D4A040" />
                {/* Scoops */}
                <ellipse cx={60} cy={72} rx={22} ry={16} fill="url(#menuScoop1)" stroke="#D4567A" strokeWidth={1} />
                <ellipse cx={54} cy={66} rx={7} ry={5} fill="rgba(255,255,255,0.3)" />
                <ellipse cx={60} cy={50} rx={20} ry={15} fill="url(#menuScoop2)" stroke="#E8D5A0" strokeWidth={1} />
                <ellipse cx={54} cy={44} rx={6} ry={4} fill="rgba(255,255,255,0.4)" />
                <ellipse cx={60} cy={30} rx={18} ry={14} fill="url(#menuScoop3)" stroke="#5CC49A" strokeWidth={1} />
                <ellipse cx={54} cy={24} rx={5} ry={3.5} fill="rgba(255,255,255,0.35)" />
                {/* Cherry on top */}
                <circle cx={60} cy={14} r={6} fill="#DC143C" />
                <circle cx={58} cy={12} r={2} fill="rgba(255,255,255,0.4)" />
                <path d="M 60,14 Q 62,4 68,2" stroke="#2E7D32" strokeWidth={1.5} fill="none" />
                <ellipse cx={68} cy={2} rx={3} ry={2} fill="#43A047" />
              </g>
            </svg>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-instrument-serif)",
              background: "linear-gradient(135deg, #D2691E, #FF6B6B, #D2691E)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "none",
            }}
          >
            Scoop Shop
          </h1>
          <p className="text-lg text-gray-500 mb-8 tracking-wide">Serve customers, stack scoops!</p>

          <button
            onClick={startGame}
            className="text-white font-bold text-xl px-12 py-5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 mb-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #FF6B9D, #C44569)",
              boxShadow: "0 6px 20px rgba(196,69,105,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            <span className="relative z-10">Open Shop</span>
          </button>

          <button
            onClick={() => setShowTutorial(!showTutorial)}
            className="block mx-auto text-gray-400 hover:text-gray-600 text-sm mt-3 transition-colors"
          >
            How to Play
          </button>

          {showTutorial && (
            <div className="mt-4 bg-white/95 backdrop-blur-lg rounded-2xl p-6 text-left max-w-xs mx-auto shadow-xl border border-white/50">
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span> Customers walk in through the door</li>
                <li className="flex items-start gap-2"><span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span> Read their order and tap the right flavors</li>
                <li className="flex items-start gap-2"><span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span> Scoops stack on the cone - add toppings too!</li>
                <li className="flex items-start gap-2"><span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span> Serve before they lose patience!</li>
                <li className="flex items-start gap-2"><span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span> 3 missed customers = game over</li>
              </ol>
            </div>
          )}

          {highScore > 0 && (
            <div className="mt-6 bg-white/60 backdrop-blur rounded-full px-5 py-2 inline-block">
              <span className="text-gray-400 text-sm">🏆 High Score: </span>
              <span className="text-amber-600 font-bold">{highScore}</span>
            </div>
          )}
        </div>
      </div>
    );
  }


  // ── Result ───────────────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-100 via-pink-50 to-sky-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/50 text-center max-w-sm">
          <div className="text-6xl mb-4">🍦</div>
          <h2
            className="text-4xl font-bold text-gray-800 mb-4"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            Shop Closed!
          </h2>

          <div className="bg-gradient-to-r from-pink-50 to-amber-50 rounded-2xl p-4 mb-4">
            <div className="text-3xl font-bold text-gray-800 mb-1">{score}</div>
            <div className="text-sm text-gray-500 uppercase tracking-wider">Final Score</div>
          </div>

          <div className="flex justify-center gap-6 mb-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{customersServed}</div>
              <div className="text-xs text-gray-400">Served</div>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="text-xl font-bold text-gray-800">{level}</div>
              <div className="text-xs text-gray-400">Level</div>
            </div>
          </div>

          {score >= highScore && score > 0 && (
            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-full px-4 py-2 mb-4 inline-block">
              <span className="text-amber-600 font-bold text-sm">⭐ New High Score!</span>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full text-white font-bold text-lg px-8 py-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FF6B9D, #C44569)",
              boxShadow: "0 6px 20px rgba(196,69,105,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }


  // ── Playing ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-pink-50 flex flex-col items-center p-3 select-none">
      {/* HUD - Candy Crush style */}
      <div className="w-full max-w-lg flex justify-between items-center mb-2 gap-2">
        <div className="bg-white/95 backdrop-blur-lg rounded-xl px-3 py-1.5 shadow-md border border-white/50">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Level</div>
          <div className="text-sm font-bold text-gray-800">{level}</div>
        </div>
        <div className="bg-white/95 backdrop-blur-lg rounded-xl px-4 py-1.5 shadow-md border border-white/50">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider text-center">Score</div>
          <div className="text-lg font-bold bg-gradient-to-r from-pink-500 to-amber-500 bg-clip-text text-transparent">{score}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMusic}
            className="bg-white/95 backdrop-blur-lg rounded-xl px-2.5 py-2 shadow-md text-sm border border-white/50 hover:bg-white transition-colors"
          >
            {musicOn ? "🔊" : "🔇"}
          </button>
          <div className="bg-white/95 backdrop-blur-lg rounded-xl px-3 py-2 shadow-md text-sm border border-white/50">
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={`inline-block transition-all ${i < 3 - missedCustomers ? "scale-100" : "scale-75 opacity-30"}`}>
                {i < 3 - missedCustomers ? "❤️" : "🖤"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Store Scene */}
      <div
        className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-3 border border-gray-100 transition-transform ${shake ? "animate-shake" : ""}`}
        style={{ width: STORE_WIDTH, maxWidth: "100%" }}
      >
        <svg width={STORE_WIDTH} height={STORE_HEIGHT} viewBox={`0 0 ${STORE_WIDTH} ${STORE_HEIGHT}`}
          style={{ display: "block" }}>
          <GradientDefs />
          <StoreBackground />

          {/* Background people */}
          <BackgroundPerson seed={1} />
          <BackgroundPerson seed={4} />

          {/* Active customer */}
          {customer && (
            <>
              <PersonSprite
                x={customer.x}
                y={customer.sitting && customer.state === "waiting" ? customer.y - 6 : customer.y - 10}
                skinTone={customer.skinTone}
                skinHighlight={customer.skinHighlight}
                skinShadow={customer.skinShadow}
                shirtColor={customer.shirtColor}
                shirtHighlight={customer.shirtHighlight}
                hairColor={customer.hairColor}
                hairHighlight={customer.hairHighlight}
                hat={customer.hat}
                hatStyle={customer.hatStyle}
                eyeStyle={customer.eyeStyle}
                mouthStyle={customer.mouthStyle}
                facing={customer.state === "walking-out" ? "right" : "left"}
                walking={customer.state === "walking-in" || customer.state === "walking-out"}
                scale={customer.scale}
              />

              {/* Stool if sitting */}
              {customer.sitting && customer.state === "waiting" && (
                <g>
                  {/* Stool seat */}
                  <ellipse cx={customer.x} cy={customer.y + 24} rx={14} ry={4} fill="#C08830" stroke="#A07020" strokeWidth={1} />
                  {/* Stool cushion */}
                  <ellipse cx={customer.x} cy={customer.y + 22} rx={13} ry={3.5} fill="#D32F2F" stroke="#B71C1C" strokeWidth={0.5} />
                  <ellipse cx={customer.x - 3} cy={customer.y + 21} rx={5} ry={2} fill="rgba(255,255,255,0.15)" />
                  {/* Stool legs */}
                  <line x1={customer.x - 8} y1={customer.y + 26} x2={customer.x - 10} y2={customer.y + 40} stroke="#A07020" strokeWidth={2.5} />
                  <line x1={customer.x + 8} y1={customer.y + 26} x2={customer.x + 10} y2={customer.y + 40} stroke="#A07020" strokeWidth={2.5} />
                  <line x1={customer.x} y1={customer.y + 26} x2={customer.x} y2={customer.y + 40} stroke="#A07020" strokeWidth={2} />
                  {/* Foot rest */}
                  <line x1={customer.x - 7} y1={customer.y + 34} x2={customer.x + 7} y2={customer.y + 34} stroke="#A07020" strokeWidth={1.5} />
                </g>
              )}

              {/* Speech bubble with order */}
              {(customer.state === "waiting" || customer.state === "served") && (
                <SpeechBubble
                  x={customer.x}
                  y={customer.y - 50}
                  order={customer.order}
                  scoopsDone={scoopsDone}
                  reaction={customer.reaction}
                />
              )}

              {/* Patience bar - polished */}
              {customer.state === "waiting" && (
                <g>
                  <rect x={customer.x - 22} y={customer.y - 55} width={44} height={6} rx={3}
                    fill="#E0E0E0" stroke="#CCC" strokeWidth={0.5} />
                  <rect
                    x={customer.x - 22} y={customer.y - 55}
                    width={Math.max(0, customer.patience * 0.44)}
                    height={6} rx={3}
                    fill={`url(#${patienceGradient})`}
                  />
                  {/* Shine on bar */}
                  <rect
                    x={customer.x - 22} y={customer.y - 55}
                    width={Math.max(0, customer.patience * 0.44)}
                    height={2} rx={1}
                    fill="rgba(255,255,255,0.3)"
                  />
                </g>
              )}

              {/* Customer name tag */}
              {customer.state === "waiting" && (
                <g>
                  <rect x={customer.x - 22} y={customer.y - 63} width={44} height={10} rx={5}
                    fill="rgba(0,0,0,0.6)" />
                  <text x={customer.x} y={customer.y - 55.5} textAnchor="middle" fontSize={7}
                    fill="white" fontWeight="bold">{customer.name}</text>
                </g>
              )}
            </>
          )}

          {/* Cone being built (on counter) */}
          {customer && (customer.state === "waiting" || customer.state === "served") && (
            <ConeStack x={370} y={COUNTER_Y - 5} scoops={coneScoops} />
          )}

          {/* Scoop animation */}
          {animatingScoop && (
            <g>
              <ellipse
                cx={370}
                cy={COUNTER_Y - 20 - coneScoops.length * 20}
                rx={18}
                ry={13}
                fill={animatingScoop.color}
                opacity={0.7}
              >
                <animate attributeName="cy" from={COUNTER_Y - 80} to={COUNTER_Y - 20 - coneScoops.length * 20} dur="0.2s" />
                <animate attributeName="opacity" from="0.9" to="0.7" dur="0.2s" />
                <animate attributeName="rx" from="12" to="18" dur="0.2s" />
                <animate attributeName="ry" from="12" to="13" dur="0.2s" />
              </ellipse>
            </g>
          )}

          {/* Sparkle effects */}
          <SparkleEffect sparkles={sparkles} />
        </svg>
      </div>

      {/* Large Order Display */}
      {customer && customer.state === "waiting" && (
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-4 mb-3 border border-white/50">
          <div className="text-center mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">
              {customer.name}&apos;s Order
            </span>
          </div>

          {/* Scoops display */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {customer.order.map((item, i) => {
              const done = i < scoopsDone;
              const isNext = !toppingsPhase && i === scoopsDone;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-base font-bold transition-all duration-200 ${isNext ? "ring-2 ring-gray-800 ring-offset-2 scale-110" : ""}`}
                  style={{
                    background: done
                      ? `linear-gradient(135deg, ${item.color}88, ${item.shadow}66)`
                      : `linear-gradient(135deg, ${item.highlight}, ${item.color})`,
                    opacity: done ? 0.45 : 1,
                    color: item.name === "Chocolate" || item.name === "Blueberry" ? "white" : "#333",
                    boxShadow: isNext ? `0 4px 12px ${item.shadow}60` : `0 2px 4px rgba(0,0,0,0.08)`,
                  }}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.name}</span>
                  {done && <span className="text-green-500 ml-0.5 text-lg">{"✓"}</span>}
                </div>
              );
            })}
          </div>

          {/* Toppings display */}
          {customer.toppings.length > 0 && (
            <>
              <div className="flex items-center justify-center gap-2 my-2">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Toppings</span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {customer.toppings.map((t, i) => {
                  const done = i < toppingsDone;
                  const isNext = toppingsPhase && i === toppingsDone;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-base font-bold transition-all duration-200 ${isNext ? "ring-2 ring-gray-800 ring-offset-2 scale-110" : ""}`}
                      style={{
                        backgroundColor: done ? "#e8e8e8" : `${t.color}25`,
                        border: `2px solid ${done ? "#ccc" : t.color}40`,
                        opacity: done ? 0.45 : 1,
                        boxShadow: isNext ? `0 4px 12px ${t.color}40` : undefined,
                      }}
                    >
                      <span className="text-lg">{t.emoji}</span>
                      <span>{t.name}</span>
                      {done && <span className="text-green-500 ml-0.5 text-lg">{"✓"}</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Current instruction - big and clear */}
          <div className="text-center mt-3 bg-gradient-to-r from-gray-50 to-gray-50 rounded-xl py-2">
            {!toppingsPhase && scoopsDone < customer.order.length ? (
              <p className="text-xl font-bold text-gray-700">
                {"👇"} Tap{" "}
                <span
                  className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${customer.order[scoopsDone]?.highlight}, ${customer.order[scoopsDone]?.color})`,
                    color: customer.order[scoopsDone]?.name === "Chocolate" || customer.order[scoopsDone]?.name === "Blueberry" ? "white" : "#333",
                  }}
                >
                  {customer.order[scoopsDone]?.emoji} {customer.order[scoopsDone]?.name}
                </span>
                <span className="text-gray-400 text-sm ml-2">({scoopsDone + 1}/{customer.order.length})</span>
              </p>
            ) : toppingsPhase && toppingsDone < customer.toppings.length ? (
              <p className="text-xl font-bold text-gray-700">
                {"👇"} Add{" "}
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-gray-100">
                  {customer.toppings[toppingsDone]?.emoji} {customer.toppings[toppingsDone]?.name}
                </span>
                <span className="text-gray-400 text-sm ml-2">({toppingsDone + 1}/{customer.toppings.length})</span>
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Flavor / Topping buttons - glossy Candy Crush style */}
      <div className="w-full max-w-lg">
        {!toppingsPhase ? (
          <div className="grid grid-cols-3 gap-2.5">
            {FLAVORS.map((f) => {
              const isNext =
                customer?.state === "waiting" &&
                !toppingsPhase &&
                scoopsDone < (customer?.order.length || 0) &&
                customer?.order[scoopsDone]?.name === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => tapFlavor(f)}
                  className={`py-4 px-3 rounded-2xl text-sm font-bold transition-all active:scale-90 border-b-4 relative overflow-hidden ${isNext ? "scale-105 animate-pulse" : ""}`}
                  style={{
                    background: `linear-gradient(180deg, ${f.highlight} 0%, ${f.color} 60%, ${f.shadow} 100%)`,
                    borderBottomColor: f.shadow,
                    borderTopColor: f.highlight,
                    borderTopWidth: 1,
                    color: f.name === "Chocolate" || f.name === "Blueberry" ? "white" : "#444",
                    boxShadow: isNext
                      ? `0 4px 20px ${f.shadow}80, 0 0 0 3px #333`
                      : `0 3px 8px ${f.shadow}40`,
                  }}
                >
                  {/* Glossy shine overlay */}
                  <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl" />
                  <span className="relative z-10">
                    <span className="text-lg block mb-0.5">{f.emoji}</span>
                    {f.name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {TOPPINGS.map((t) => {
              const isNext =
                customer?.state === "waiting" &&
                toppingsPhase &&
                toppingsDone < (customer?.toppings.length || 0) &&
                customer?.toppings[toppingsDone]?.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => tapTopping(t)}
                  className={`py-4 px-4 rounded-2xl text-sm font-bold transition-all active:scale-90 border-b-4 relative overflow-hidden ${isNext ? "scale-105 animate-pulse" : ""}`}
                  style={{
                    background: `linear-gradient(180deg, ${lighten(t.color, 120)} 0%, ${lighten(t.color, 80)} 60%, ${lighten(t.color, 40)} 100%)`,
                    borderBottomColor: t.color,
                    color: "#444",
                    boxShadow: isNext
                      ? `0 4px 20px ${t.color}60, 0 0 0 3px #333`
                      : `0 3px 8px rgba(0,0,0,0.1)`,
                  }}
                >
                  <span className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl" />
                  <span className="relative z-10">
                    <span className="text-lg block mb-0.5">{t.emoji}</span>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Shake animation style */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-4px); }
          30%, 70% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
