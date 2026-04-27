"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Flavor = {
  name: string;
  colors: [string, string, string]; // light, mid, dark
  emoji: string;
};

type Topping = {
  name: string;
  emoji: string;
};

type SpaceDestinationId =
  | "alien-planet"
  | "earth"
  | "moon-dairy"
  | "asteroid-bazaar"
  | "comet-carnival"
  | "black-hole-cafe"
  | "cone-constellation"
  | "star-nursery"
  | "dino-timeline";

type CharacterId =
  | "scoopy"
  | "zorp"
  | "zarixa"
  | "ren"
  | "glitch"
  | "tina"
  | "blorp"
  | "xarnix"
  | "milo"
  | "luma"
  | "tock"
  | "veev"
  | "first-scoop"
  | "alive-shop";

type QuestId =
  | "penpal-tina-blorp"
  | "ren-glitch-rivalry"
  | "zorp-scoopy-origin"
  | "alive-shop";

type UnlockFlags = Record<string, boolean>;

type DialogueEffect =
  | { type: "give-coins"; amount: number; location?: Location }
  | { type: "set-flag"; flag: string; value: boolean }
  | { type: "start-quest"; questId: QuestId }
  | { type: "advance-quest"; questId: QuestId }
  | { type: "unlock-shop"; shopId: string }
  | { type: "unlock-destination"; destinationId: SpaceDestinationId }
  | { type: "change-affinity"; characterId: CharacterId; amount: number };

type DialogueChoice = {
  label: string;
  next: number;
  effects?: DialogueEffect[];
};

type DialogueNode = {
  speaker: "them" | "you";
  text: string;
  choiceA?: DialogueChoice;
  choiceB?: DialogueChoice;
  effects?: DialogueEffect[];
  // if no choices, it's the end of the conversation
};

type GamePhase =
  | "menu"
  | "playing"
  | "cutscene"
  | "blackhole"
  | "pilot"
  | "street"
  | "shop"
  | "chase"
  | "boss-fight"
  | "sarahs-world"
  | "arcade-room"
  | "meteor-meltdown"
  | "slime-simon"
  | "moon-maze"
  | "ufo-claw"
  | "pixel-rift"
  | "alien-underground"
  | "space-map"
  | "space-destination"
  | "ship-interior"
  | "alive-shop-event"
  | "result";

type Asteroid = { id: number; x: number; y: number; vx: number; vy: number; size: number; };
type Laser = { id: number; x: number; y: number; };
type PilotInputs = { left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean };

type Minion = { id: number; quote: string; spriteIdx: number };
type ChaseMinion = { id: number; x: number; y: number; vx: number; caught: boolean; spriteIdx: number };

type BossFightPhase = "intro" | "simon-show" | "simon-play" | "simon-fail" | "chase-tap" | "caught" | "escaped";

type BossFightState = {
  phase: BossFightPhase;
  phaseTick: number;        // ticks inside the current sub-phase
  order: string[];          // flavor names in the order the boss demands them
  showIdx: number;          // index currently being pulsed during simon-show
  playIdx: number;          // next index the player must tap
  chaseProgress: number;    // taps collected in chase-tap
  chaseTarget: number;      // taps needed to catch the boss
  chaseTimeLeft: number;    // ms remaining in chase-tap
  chaseTotalTime: number;   // total chase-tap time (for UI bar)
  bossName: string;
  bossOnAlien: boolean;
  encounterIdx: number;     // 1-based boss encounter # (difficulty)
  orderMoney: number;       // the unpaid bill, added to the reward on capture
};

type ArcadeMeteor = {
  id: number;
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
};

type MeteorMeltdownState = {
  score: number;
  timeLeft: number;
  lives: number;
  meteors: ArcadeMeteor[];
  nextId: number;
  phase: "play" | "done";
  message: string;
};

type SlimeSimonState = {
  sequence: number[];
  showIdx: number;
  playIdx: number;
  round: number;
  score: number;
  phase: "show" | "play" | "done";
  flashIdx: number | null;
  message: string;
};

type MoonMazeEnemy = {
  x: number;
  y: number;
  dir: "h" | "v";
  step: -1 | 1;
};

type MoonMazeState = {
  player: { x: number; y: number };
  enemies: MoonMazeEnemy[];
  exit: { x: number; y: number };
  moves: number;
  phase: "play" | "won" | "lost";
  message: string;
};

type UfoClawPrizeId = "tiny-ufo-plush" | "glitch-token" | "space-jelly-sample" | "arcade-crown";

type UfoClawPrize = {
  id: UfoClawPrizeId;
  name: string;
  emoji: string;
  rarity: "common" | "uncommon" | "rare";
};

type UfoClawState = {
  prize: UfoClawPrize;
  prizeX: number;
  prizeDir: -1 | 1;
  clawX: number;
  clawY: number;
  phase: "aim" | "drop" | "done";
  won: boolean;
  message: string;
};

type PixelRiftState = {
  score: number;
  timeLeft: number;
  targetLane: number;
  phase: "play" | "done";
  message: string;
};

type ShipRoomMessage = {
  title: string;
  body: string;
};

type ShopItem = {
  id: string;        // stable id used as inventory key
  name: string;
  emoji: string;
  price: number;
  description: string;
  slot?: "held" | "decor";  // if present, item is equippable tamagotchi-style
  effect?: ShopItemEffect;
};

type ShopItemEffect =
  | { type: "tip-bonus"; chance: number; amount: number }
  | { type: "visual-weather"; weather: "rain" | "snow" | "rainbow" }
  | { type: "unlock-flavor"; flavorId: string }
  | { type: "unlock-topping"; toppingId: string }
  | { type: "unlock-destination"; destinationId: SpaceDestinationId }
  | { type: "set-flag"; flag: string; value: boolean }
  | { type: "give-glow-shards"; amount: number };

type ShopUnlock = {
  served?: number;
  itemId?: string;
  flag?: string;
};

type Shop = {
  id: string;
  name: string;
  ownerName: string;
  signColor: string;       // awning / sign
  wallColor: string;
  accentColor: string;
  location: Location;
  items: ShopItem[];
  greeting: string;        // short blurb when opened
  type?: "retail" | "casino" | "arcade";
  unlock?: ShopUnlock;
};

type Location = "earth" | "alien-planet";

type CharacterMemory = {
  timesTalked: number;
  affinity: number;
  lastChoice?: string;
  flags: Record<string, boolean>;
};

type CharacterMemoryMap = Partial<Record<CharacterId, CharacterMemory>>;

type QuestState = {
  id: QuestId;
  step: number;
  complete: boolean;
};

type QuestMap = Partial<Record<QuestId, QuestState>>;

type ArcadeGameId =
  | "sarahs-world"
  | "meteor-meltdown"
  | "slime-simon"
  | "moon-maze"
  | "ufo-claw"
  | "pixel-rift";

type ArcadeCabinet = {
  id: ArcadeGameId;
  name: string;
  subtitle: string;
  x: number;
  colors: {
    body: string;
    screen: string;
    accent: string;
  };
  emoji: string;
  unlocked?: boolean;
  unlockFlag?: string;
  highScoreKey: ArcadeGameId;
};

type SpaceDestination = {
  id: SpaceDestinationId;
  name: string;
  emoji: string;
  x: number;
  y: number;
  unlocked: boolean;
  unlockFlag?: string;
  description: string;
  travelRisk: "none" | "asteroids" | "blackhole" | "weird";
};

type ShipRoomId = "cockpit" | "galley" | "cargo" | "engine" | "crew-pod";

type ShipRoom = {
  id: ShipRoomId;
  name: string;
  exits: {
    left?: ShipRoomId;
    right?: ShipRoomId;
    door?: ShipRoomId;
  };
};

type ShipRoomStory = {
  hint: string;
  inspect: ShipRoomMessage;
};

type AliveShopStep =
  | "awakening"
  | "street-chase"
  | "ship-stowaway"
  | "underground-hideout"
  | "heart-talk"
  | "resolved";

type AliveShopState = {
  started: boolean;
  step: AliveShopStep;
  affinity: number;
  completed: boolean;
};

type CutsceneType =
  | "alien-arrival"      // saucer flies in, beam drops alien at earth shop
  | "beam-up"            // shopkeeper beamed up into saucer (earth -> space)
  | "journey-out"        // flying through space toward alien planet
  | "landing-alien"      // saucer lands on alien planet, deposits shopkeeper
  | "earth-departure"    // shopkeeper beamed up from alien planet
  | "journey-back"       // flying back through space toward earth
  | "landing-earth";     // saucer lands on earth, deposits shopkeeper

type BlackholeScene =
  | "pull-in"            // saucer spaghettified into spiral, auto
  | "fork"               // 3 doors: mirrors / clockwork / library
  | "mirrors"            // future-self dialogue
  | "clockwork"          // time clocks dialogue
  | "library"            // infinite library dialogue
  | "exit"               // exit portal prompt
  | "burst-out"          // white-hole burst, auto -> landing
  | "dino-intro"         // stepped off saucer into prehistoric Earth
  | "dino-encounter"     // choice-driven battle scene
  | "dino-monolith";     // monolith prompt -> burst-out

type Customer = {
  id: number;
  name: string;
  spriteIdx: number;
  order: Flavor[];
  toppings: Topping[];
  x: number;
  targetX: number;
  state: "walking-in" | "waiting" | "served" | "walking-out";
  reaction: string;
  waitTicks: number;
  isAlienVIP?: boolean;  // the special alien that arrives via saucer
  isAlien?: boolean;     // regular alien customer on alien planet
  isBoss?: boolean;      // boss encounter — complex order, hits back on mistakes
  bossHearts?: number;   // lives remaining during a boss fight
  minions?: Minion[];    // trashy sidekicks flanking the boss
};

const STORAGE_KEYS = {
  quests: "scoopstack-quests",
  characterMemory: "scoopstack-character-memory",
  unlockFlags: "scoopstack-unlock-flags",
  arcadeHighScores: "scoopstack-arcade-highscores",
  underground: "scoopstack-underground",
  spaceDestinations: "scoopstack-space-destinations",
  shipState: "scoopstack-ship-state",
  aliveShop: "scoopstack-alive-shop",
  mobileShop: "scoopstack-mobile-shop",
} as const;

const DEFAULT_ALIVE_SHOP_STATE: AliveShopState = {
  started: false,
  step: "awakening",
  affinity: 0,
  completed: false,
};

const SHIP_ROOMS: Record<ShipRoomId, ShipRoom> = {
  cockpit: { id: "cockpit", name: "Cockpit", exits: { right: "galley" } },
  galley: { id: "galley", name: "Scoop Lab", exits: { left: "cockpit", right: "cargo" } },
  cargo: { id: "cargo", name: "Cargo Hold", exits: { left: "galley", right: "engine" } },
  engine: { id: "engine", name: "Engine Room", exits: { left: "cargo", right: "crew-pod" } },
  "crew-pod": { id: "crew-pod", name: "Crew Pod", exits: { left: "engine" } },
};

const SHIP_ROOM_DETAILS: Record<ShipRoomId, ShipRoomStory> = {
  cockpit: {
    hint: "Nav glass, star windows, and Zarixa's glowing route console.",
    inspect: { title: "Nav Glass", body: "Stars mark every promised stop." },
  },
  galley: {
    hint: "A tiny scoop lab for ship snacks and experimental flavors.",
    inspect: { title: "Scoop Lab", body: "Fusion scoops are chilling." },
  },
  cargo: {
    hint: "Crates, postcards, spare cones, and suspiciously sleepy boxes.",
    inspect: { title: "Cargo Hold", body: "Spare cones rattle softly." },
  },
  engine: {
    hint: "The warp syrup pump hums under a shielded glass core.",
    inspect: { title: "Engine Core", body: "Warp syrup pump hums." },
  },
  "crew-pod": {
    hint: "Zarixa's bunk, a moon blanket, and a very quiet star radio.",
    inspect: { title: "Crew Pod", body: "Zarixa saved you a bunk." },
  },
};

const ALIEN_ARCADE_CABINETS: ArcadeCabinet[] = [
  {
    id: "sarahs-world",
    name: "Sarah's World",
    subtitle: "Build Sarah's house and shoo Julia.",
    x: 80,
    colors: { body: "#4B2A8A", screen: "#9EEBFF", accent: "#FFD86B" },
    emoji: "\u{1F3E0}",
    unlocked: true,
    highScoreKey: "sarahs-world",
  },
  {
    id: "meteor-meltdown",
    name: "Meteor Meltdown",
    subtitle: "Zap falling meteors before they land.",
    x: 190,
    colors: { body: "#882244", screen: "#120020", accent: "#FF8050" },
    emoji: "\u2604\uFE0F",
    unlocked: true,
    highScoreKey: "meteor-meltdown",
  },
  {
    id: "slime-simon",
    name: "Slime Simon",
    subtitle: "Repeat the glowing slime pattern.",
    x: 300,
    colors: { body: "#146B4A", screen: "#B7FF9A", accent: "#78F060" },
    emoji: "\u{1F9EA}",
    unlocked: true,
    highScoreKey: "slime-simon",
  },
  {
    id: "moon-maze",
    name: "Moon Maze",
    subtitle: "Guide a tiny ship through moon slime corridors.",
    x: 410,
    colors: { body: "#263A68", screen: "#DDEBFF", accent: "#A8C8FF" },
    emoji: "\u{1F319}",
    unlocked: true,
    highScoreKey: "moon-maze",
  },
  {
    id: "ufo-claw",
    name: "UFO Claw",
    subtitle: "Drop the claw when the prize drifts under it.",
    x: 520,
    colors: { body: "#4A2A20", screen: "#FFE8A8", accent: "#FFD86B" },
    emoji: "\u{1F6F8}",
    unlocked: true,
    highScoreKey: "ufo-claw",
  },
  {
    id: "pixel-rift",
    name: "Pixel Rift",
    subtitle: "A cabinet that dreams about another arcade.",
    x: 630,
    colors: { body: "#301050", screen: "#FF70F0", accent: "#70FFE0" },
    emoji: "\u{1F300}",
    unlockFlag: "pixel-rift-unlocked",
    highScoreKey: "pixel-rift",
  },
];

const MOON_MAZE_SIZE = 8;
const MOON_MAZE_CELL = 10;
const MOON_MAZE_ORIGIN = { x: 24, y: 18 };
const MOON_MAZE_START = { x: 0, y: 0 };
const MOON_MAZE_EXIT = { x: 7, y: 7 };
const MOON_MAZE_MAP = [
  "........",
  ".##.##..",
  "...#....",
  "##...##.",
  "...#....",
  ".#.###..",
  ".#......",
  "...##...",
] as const;
const MOON_MAZE_ENEMIES: MoonMazeEnemy[] = [
  { x: 5, y: 2, dir: "h", step: 1 },
  { x: 6, y: 5, dir: "v", step: 1 },
];

const UFO_CLAW_PRIZES: UfoClawPrize[] = [
  { id: "tiny-ufo-plush", name: "Tiny UFO Plush", emoji: "\u{1F6F8}", rarity: "common" },
  { id: "glitch-token", name: "Glitch Token", emoji: "\u{1FA99}", rarity: "common" },
  { id: "space-jelly-sample", name: "Space Jelly Sample", emoji: "\u{1FAD9}", rarity: "uncommon" },
  { id: "arcade-crown", name: "Arcade Crown", emoji: "\u{1F451}", rarity: "rare" },
];

const PIXEL_RIFT_LANES = [
  { label: "REN", color: "#80C0FF", accent: "#2050A0" },
  { label: "DREAM", color: "#FF70F0", accent: "#8A2078" },
  { label: "GLITCH", color: "#70FFE0", accent: "#148878" },
] as const;

const SLIME_SIMON_PADS = [
  { name: "berry", x: 32, y: 48, color: "#FF70A6", accent: "#A82050" },
  { name: "mint", x: 96, y: 48, color: "#70F0A0", accent: "#148A50" },
  { name: "lemon", x: 32, y: 78, color: "#FFE060", accent: "#B08010" },
  { name: "blue", x: 96, y: 78, color: "#70C8FF", accent: "#2060A0" },
] as const;

const SPACE_DESTINATIONS: SpaceDestination[] = [
  {
    id: "earth",
    name: "Earth",
    emoji: "\u{1F30E}",
    x: 22,
    y: 72,
    unlocked: true,
    description: "Home of Scoop Shop, soft sidewalks, and familiar faces.",
    travelRisk: "none",
  },
  {
    id: "alien-planet",
    name: "Alien Planet",
    emoji: "\u{1FA90}",
    x: 64,
    y: 42,
    unlocked: true,
    description: "Three suns, weird scoops, and Zorp's glowing counter.",
    travelRisk: "asteroids",
  },
  {
    id: "moon-dairy",
    name: "Moon Dairy",
    emoji: "\u{1F319}",
    x: 38,
    y: 24,
    unlocked: false,
    unlockFlag: "destination-moon-dairy",
    description: "Low gravity scoops and moon milk in little silver jars.",
    travelRisk: "none",
  },
  {
    id: "asteroid-bazaar",
    name: "Asteroid Bazaar",
    emoji: "\u2604\uFE0F",
    x: 90,
    y: 24,
    unlocked: false,
    unlockFlag: "destination-asteroid-bazaar",
    description: "Markets bolted to drifting rocks.",
    travelRisk: "asteroids",
  },
  {
    id: "black-hole-cafe",
    name: "Black Hole Cafe",
    emoji: "\u{1F311}",
    x: 104,
    y: 78,
    unlocked: false,
    unlockFlag: "destination-black-hole-cafe",
    description: "The espresso never arrives, but the conversation does.",
    travelRisk: "blackhole",
  },
  {
    id: "cone-constellation",
    name: "Cone Constellation",
    emoji: "\u2728",
    x: 68,
    y: 88,
    unlocked: false,
    unlockFlag: "destination-cone-constellation",
    description: "A star pattern shaped suspiciously like dessert.",
    travelRisk: "weird",
  },
  {
    id: "comet-carnival",
    name: "Comet Carnival",
    emoji: "\u{1F3AA}",
    x: 18,
    y: 34,
    unlocked: false,
    unlockFlag: "destination-comet-carnival",
    description: "A carnival braided through a glittering comet tail.",
    travelRisk: "asteroids",
  },
  {
    id: "star-nursery",
    name: "Star Nursery",
    emoji: "\u{1F31F}",
    x: 112,
    y: 48,
    unlocked: false,
    unlockFlag: "destination-star-nursery",
    description: "Baby stars sleep in silver cradles and tiny blankets.",
    travelRisk: "none",
  },
  {
    id: "dino-timeline",
    name: "Dino Timeline",
    emoji: "\u{1F996}",
    x: 42,
    y: 92,
    unlocked: false,
    unlockFlag: "destination-dino-timeline",
    description: "A repeatable prehistoric detour with fossil rewards.",
    travelRisk: "weird",
  },
];

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode; the game should keep running.
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────
const FLAVORS: Flavor[] = [
  { name: "Vanilla",    colors: ["#FFF8DC", "#F5E6B8", "#D4C090"], emoji: "\u{1F366}" },
  { name: "Chocolate",  colors: ["#8B5E3C", "#5C2E0E", "#3D1A00"], emoji: "\u{1F36B}" },
  { name: "Strawberry", colors: ["#FFB0CB", "#FF7EA8", "#D4567A"], emoji: "\u{1F353}" },
  { name: "Mint",       colors: ["#B8FFE0", "#8EEDC7", "#5CC49A"], emoji: "\u{1F33F}" },
  { name: "Blueberry",  colors: ["#A5B5F0", "#7B8FD4", "#4E5FA0"], emoji: "\u{1FAD0}" },
  { name: "Mango",      colors: ["#FFD470", "#FFB830", "#D48E00"], emoji: "\u{1F96D}" },
];

const TOPPINGS: Topping[] = [
  { name: "Sprinkles",     emoji: "\u2728" },
  { name: "Cherry",        emoji: "\u{1F352}" },
  { name: "Whipped Cream", emoji: "\u2601\uFE0F" },
  { name: "Hot Fudge",     emoji: "\u{1F36B}" },
  { name: "Gummy Bears",   emoji: "\u{1F43B}" },
];

const EARTH_UNLOCKABLE_FLAVORS: Record<string, Flavor> = {
  pistachio: {
    name: "Pistachio",
    colors: ["#D8F0B0", "#A8C878", "#6C9048"],
    emoji: "\u{1F95C}",
  },
  cookieDough: {
    name: "Cookie Dough",
    colors: ["#E8C898", "#C09060", "#704830"],
    emoji: "\u{1F36A}",
  },
  mythicVanilla: {
    name: "Mythic Vanilla",
    colors: ["#FFFBE8", "#F6D878", "#C28A28"],
    emoji: "\u2728",
  },
};

const UNDERGROUND_FLAVORS: Record<string, Flavor> = {
  magmaCream: {
    name: "Magma Cream",
    colors: ["#FFC060", "#FF6040", "#803010"],
    emoji: "\u{1F30B}",
  },
  crystalMint: {
    name: "Crystal Mint",
    colors: ["#D0FFFF", "#80E0E0", "#309090"],
    emoji: "\u{1F48E}",
  },
};

const EARTH_UNLOCKABLE_TOPPINGS: Record<string, Topping> = {
  stellarSprinkles: { name: "Stellar Sprinkles", emoji: "\u{1F308}" },
};

const CUSTOMER_NAMES = [
  "Timmy", "Sarah", "Marco", "Rose", "Lola",
  "Jake", "Zoe", "Oliver", "Luna", "Mia",
];

const NUDGES = ["...", "~", "hmm", "\u266A", "\u2764\uFE0F", "!", "yay~"];
const HAPPY_REACTIONS = ["YAY!", "\u2764\uFE0F", "TYSM!", "WOW!", "\u2728"];

// ── Alien Content ────────────────────────────────────────────────────────────
const ALIEN_FLAVORS: Flavor[] = [
  { name: "Cosmic Swirl", colors: ["#D4B0FF", "#A070E0", "#6B40B0"], emoji: "\u{1F300}" },
  { name: "Void",         colors: ["#606090", "#303060", "#101030"], emoji: "\u{1F311}" },
  { name: "Stardust",     colors: ["#FFF8B0", "#FFD060", "#C09030"], emoji: "\u2B50" },
  { name: "Plasma",       colors: ["#FFB0E8", "#FF50C0", "#B02080"], emoji: "\u{1F525}" },
  { name: "Nebula",       colors: ["#B0F0FF", "#50C0FF", "#2070B0"], emoji: "\u{1F30C}" },
  { name: "Slime",        colors: ["#C0FFB0", "#60E060", "#208020"], emoji: "\u{1F9EA}" },
];

const ALIEN_TOPPINGS: Topping[] = [
  { name: "Star Chips",   emoji: "\u2B50" },
  { name: "Glow Worms",   emoji: "\u{1FAB1}" },
  { name: "Moon Beans",   emoji: "\u{1FAD8}" },
  { name: "Cosmic Dust",  emoji: "\u2728" },
  { name: "Space Jelly",  emoji: "\u{1F47D}" },
];

const ALIEN_UNLOCKABLE_TOPPINGS: Record<string, Topping> = {
  glowWormsDeluxe: { name: "Glow Worms Deluxe", emoji: "\u{1FAB1}" },
  glowShards: { name: "Glow Shards", emoji: "\u{1F48E}" },
  fossilCrunch: { name: "Fossil Crunch", emoji: "\u{1F9B4}" },
};

const ALIEN_NAMES = [
  "Zog", "Blorp", "Xarnix", "Tuvok", "Vex",
  "Quark", "Zylax", "Ploop", "Mog", "Nebula",
];

// Alien sprite palettes — greens, purples, teals, pinks (otherworldly)
const ALIEN_PALETTES = [
  { body: "#88EE88", accent: "#4CBF4C", eyes: "#1A1A2E", tentacle: "#4CBF4C", eyeCount: 3 }, // classic green
  { body: "#C080FF", accent: "#8040C0", eyes: "#FFF", tentacle: "#8040C0", eyeCount: 2 },    // purple
  { body: "#60E0D0", accent: "#30A090", eyes: "#1A1A2E", tentacle: "#30A090", eyeCount: 4 }, // teal
  { body: "#FF90C0", accent: "#C04080", eyes: "#1A1A2E", tentacle: "#C04080", eyeCount: 3 }, // pink
  { body: "#FFB040", accent: "#C07010", eyes: "#1A1A2E", tentacle: "#C07010", eyeCount: 2 }, // orange
  { body: "#90B0FF", accent: "#5070D0", eyes: "#1A1A2E", tentacle: "#5070D0", eyeCount: 3 }, // blue
];

// Alien customer dialogues (4 trees)
const ALIEN_CUSTOMER_DIALOGUES: DialogueNode[][] = [
  // Conversation 0 — homesick
  [
    { speaker: "them", text: "BLORP! Hello Earth-being!", choiceA: { label: "Hi! Welcome!", next: 1 }, choiceB: { label: "Blorp to you too!", next: 2 } },
    { speaker: "them", text: "Your scoops are legendary on six galaxies! I traveled far!", choiceA: { label: "Six?! Whoa!", next: 3 }, choiceB: { label: "Aw thanks~", next: 3 } },
    { speaker: "them", text: "You SPEAK the old tongue! My ancestors weep with joy!", choiceA: { label: "They... do?", next: 3 }, choiceB: { label: "I learn fast!", next: 3 } },
    { speaker: "them", text: "Now scoop me a Cosmic Swirl! My antennae tingle with anticipation! \u2728" },
  ],
  // Conversation 1 — Earth food
  [
    { speaker: "them", text: "On my planet, dessert is BREATHED, not eaten. Fascinating!", choiceA: { label: "Breathed?!", next: 1 }, choiceB: { label: "How does that work?", next: 2 } },
    { speaker: "them", text: "Yes! You inhale joy-mist! But your SOLID dessert... *revolutionary*", choiceA: { label: "Glad you like it!", next: 3 }, choiceB: { label: "Solids rule!", next: 3 } },
    { speaker: "them", text: "Through the nose-gill! You Earth folks lack nose-gills. A shame.", choiceA: { label: "We have noses!", next: 3 }, choiceB: { label: "Very tragic~", next: 3 } },
    { speaker: "them", text: "One scoop, PLEASE. I must document this for my species!" },
  ],
  // Conversation 2 — gossip
  [
    { speaker: "them", text: "Did you hear? Zog's cousin opened a black hole cafe last cycle!", choiceA: { label: "No way!", next: 1 }, choiceB: { label: "Black hole cafe?!", next: 2 } },
    { speaker: "them", text: "BIG drama. The espresso never comes out. Light cannot escape.", choiceA: { label: "That's unfortunate", next: 3 }, choiceB: { label: "Bad business model~", next: 3 } },
    { speaker: "them", text: "You order a coffee, it never arrives. Or does it? We may never know.", choiceA: { label: "Existential!", next: 3 }, choiceB: { label: "Physics joke!", next: 3 } },
    { speaker: "them", text: "Anyway. I'll take TWO scoops. Life is short. Event horizons are forever." },
  ],
  // Conversation 3 — tentacle trouble
  [
    { speaker: "them", text: "I cannot hold a cone. I have too many tentacles. Help!", choiceA: { label: "I'll hold it for you!", next: 1 }, choiceB: { label: "Maybe a bowl?", next: 2 } },
    { speaker: "them", text: "You are a KIND Earth-being. I will write a song about you.", choiceA: { label: "\u{1F97A} Thanks!", next: 3 }, choiceB: { label: "Play it for me sometime!", next: 3 } },
    { speaker: "them", text: "A BOWL! Genius! Earth technology never ceases to amaze me!", choiceA: { label: "We try!", next: 3 }, choiceB: { label: "Glad to help!", next: 3 } },
    { speaker: "them", text: "Now scoop generously! I can hold seven scoops! Seven! \u{1F300}" },
  ],
];

// Zorp (alien shopkeeper) dialogues
const ZORP_DIALOGUES: DialogueNode[][] = [
  // Conversation 0 — welcome
  [
    { speaker: "them", text: "Welcome to GALAXY SCOOPS, partner! You are doing splendidly!", choiceA: { label: "Thanks Zorp!", next: 1 }, choiceB: { label: "This place is wild!", next: 2 } },
    { speaker: "them", text: "You have the gift! Our customers FLOAT away in joy every time!", choiceA: { label: "Literally float?", next: 3 }, choiceB: { label: "That's the dream!", next: 3 } },
    { speaker: "them", text: "WILD! Yes! Three suns, two moons, infinite flavors. My favorite place.", choiceA: { label: "Three suns?!", next: 3 }, choiceB: { label: "Infinite is a lot", next: 3 } },
    { speaker: "them", text: "Now! The cosmos awaits its scoops! To work, partner! \u2728" },
  ],
  // Conversation 1 — Scoopy's cousin
  [
    { speaker: "them", text: "Did Scoopy send you? He is my second-cousin! We were cones together!", choiceA: { label: "You know Scoopy?!", next: 1 }, choiceB: { label: "Cones together?", next: 2 } },
    { speaker: "them", text: "Of course! We all descend from the Original Magic Cone. Long story.", choiceA: { label: "Please tell!", next: 3 }, choiceB: { label: "Cosmic lineage!", next: 3 } },
    { speaker: "them", text: "Before we were blobs we were CONES. Nobody talks about it but... yes.", choiceA: { label: "Mind blown", next: 3 }, choiceB: { label: "That's beautiful", next: 3 } },
    { speaker: "them", text: "Scoopy chose Earth. I chose the stars. Both paths are good paths! \u{1F30C}" },
  ],
  // Conversation 2 — the door home
  [
    { speaker: "them", text: "Tired of green already? The door behind you always goes home!", choiceA: { label: "Just click it?", next: 1 }, choiceB: { label: "I'm staying!", next: 2 } },
    { speaker: "them", text: "One tap and the saucer takes you straight back to Earth! No fee!", choiceA: { label: "Cool to know!", next: 3 }, choiceB: { label: "Great return policy", next: 3 } },
    { speaker: "them", text: "THAT'S the spirit! The galaxy needs good scoopers like you!", choiceA: { label: "Happy to help!", next: 3 }, choiceB: { label: "\u2728 galaxy scooper \u2728", next: 3 } },
    { speaker: "them", text: "Your coins work on BOTH planets. Universal currency! Handy!" },
  ],
];

// The special alien VIP offer dialogue (after being served at earth).
// Flow: alien is surprised that scoops aren't her cosmic flavors, tastes them, loves them,
// then invites the player to her planet.
// choiceA.next === 100 => ACCEPT (trigger cutscene)
// choiceB.next === 200 => DECLINE (alien walks out)
const ALIEN_OFFER_DIALOGUE: DialogueNode[] = [
  { speaker: "them", text: "Hmm! These are not my usual COSMIC flavors... What ARE these??", choiceA: { label: "Earth classics!", next: 1 }, choiceB: { label: "Try them, trust me!", next: 1 } },
  { speaker: "them", text: "*nibbles cautiously with all tentacles* ...oh. OH. \u2728", choiceA: { label: "Good, right?", next: 2 }, choiceB: { label: "\uD83D\uDE0B", next: 2 } },
  { speaker: "them", text: "EARTH-BEING! This is the most DIVINE dessert in 12 galaxies!", choiceA: { label: "Glad you like it!", next: 3 }, choiceB: { label: "Told you!", next: 3 } },
  { speaker: "them", text: "My people MUST taste these! Come to my planet — scoop for the stars!", choiceA: { label: "Tell me more!", next: 4 }, choiceB: { label: "A journey?!", next: 4 } },
  { speaker: "them", text: "My saucer is parked outside. One beam. Two galaxies. Infinite scoops!", choiceA: { label: "LET'S GO! \u{1F680}", next: 100 }, choiceB: { label: "Stay on Earth", next: 200 } },
];

// Shown after the player declines the alien's invitation
const ALIEN_BYE_DIALOGUE: DialogueNode[] = [
  { speaker: "them", text: "Understood. Earth is your home. I will visit again someday! \u{1F44B}" },
];

// ── Shops ────────────────────────────────────────────────────────────────────
const EARTH_SHOPS: Shop[] = [
  {
    id: "sprinkle-hut",
    name: "Sprinkle Hut",
    ownerName: "Tina",
    signColor: "#FFB0CB",
    wallColor: "#FFF5D6",
    accentColor: "#D4567A",
    location: "earth",
    greeting: "Sprinkles! Jimmies! Sparkles! You name it, I've got it shiny!",
    items: [
      { id: "rainbow-sprinkles", name: "Rainbow Sprinkles", emoji: "\u{1F308}", price: 15, description: "Adds color to any scoop." },
      { id: "golden-cherry",     name: "Golden Cherry",     emoji: "\u{1F352}", price: 40, description: "Rare cherry. Wins a smile." },
      { id: "unicorn-horn",      name: "Unicorn Horn",      emoji: "\u{1F984}", price: 120, description: "Mythical topping. Grants a tiny luck bonus." },
    ],
  },
  {
    id: "cone-shack",
    name: "Cone Shack",
    ownerName: "Marco",
    signColor: "#E0A050",
    wallColor: "#FFE8C0",
    accentColor: "#8B5A20",
    location: "earth",
    greeting: "Fresh cones! Pressed this morning. Or pressed by the ORIGINAL MAGIC CONE, if you believe the stories.",
    items: [
      { id: "waffle-cone",  name: "Waffle Cone",  emoji: "\u{1F366}", price: 10, description: "Classic crunch." },
      { id: "sugar-cone",   name: "Sugar Cone",   emoji: "\u{1F36E}", price: 20, description: "Sweet and sturdy." },
      { id: "magic-cone",   name: "Magic Cone",   emoji: "\u2728",    price: 200, description: "Glows faintly. Rumored to transform blobs." },
    ],
  },
  {
    id: "scooper-gear",
    name: "Scooper Gear",
    ownerName: "Kiko",
    signColor: "#80C8FF",
    wallColor: "#E0F0FF",
    accentColor: "#2060A0",
    location: "earth",
    greeting: "Best scoopers in the business! A good tool is half the scoop.",
    items: [
      { id: "silver-scooper", name: "Silver Scooper", emoji: "\u{1F944}", price: 60, description: "Keeps scoops round." },
      { id: "gold-scooper",   name: "Gold Scooper",   emoji: "\u{1F3C6}", price: 180, description: "Shinier. Fancier." },
      { id: "time-scooper",   name: "Time Scooper",   emoji: "\u23F3",    price: 300, description: "Scoops yesterday's ice cream. Confusing but delicious." },
    ],
  },
  {
    id: "page-turner",
    name: "Page Turner",
    ownerName: "Nora",
    signColor: "#C8A878",
    wallColor: "#FFF0D8",
    accentColor: "#6B4020",
    location: "earth",
    greeting: "Books! Affordable wisdom by the page. Tap BUY, then EQUIP to hold one.",
    items: [
      { id: "picture-book", name: "Picture Book", emoji: "\u{1F4D7}", price: 5,  description: "A cute story. Hold while you scoop.", slot: "held" },
      { id: "recipe-book",  name: "Recipe Book",  emoji: "\u{1F4D9}", price: 10, description: "Secrets of the scoop.", slot: "held" },
      { id: "spell-book",   name: "Spell Book",   emoji: "\u{1F4D6}", price: 15, description: "Whispers flavor ideas.", slot: "held" },
    ],
  },
  {
    id: "toy-box",
    name: "Toy Box",
    ownerName: "Pip",
    signColor: "#FFB0E0",
    wallColor: "#FFE0F0",
    accentColor: "#A03080",
    location: "earth",
    greeting: "Toys! Pick something to carry around. Good vibes only.",
    items: [
      { id: "bouncy-ball", name: "Bouncy Ball", emoji: "\u26BE",     price: 5,  description: "Bounces high. Fits in one tentacle.", slot: "held" },
      { id: "teddy-bear",  name: "Teddy Bear",  emoji: "\u{1F9F8}",  price: 8,  description: "Soft, loyal, quiet.", slot: "held" },
      { id: "balloon",     name: "Balloon",     emoji: "\u{1F388}",  price: 6,  description: "Red balloon. Tugs upward.", slot: "held" },
    ],
  },
  {
    id: "trinkets",
    name: "Trinkets",
    ownerName: "Lulu",
    signColor: "#A0E0C0",
    wallColor: "#E8FFF0",
    accentColor: "#208060",
    location: "earth",
    greeting: "Decorate your shop! Equip a decoration and it'll show up inside.",
    items: [
      { id: "potted-plant",  name: "Potted Plant",  emoji: "\u{1FAB4}", price: 15, description: "A happy little plant for the counter.", slot: "decor" },
      { id: "wall-poster",   name: "Wall Poster",   emoji: "\u{1F5BC}\uFE0F", price: 10, description: "Adds mood to a bare wall.", slot: "decor" },
      { id: "cozy-rug",      name: "Cozy Rug",      emoji: "\u{1FAA9}", price: 20, description: "Softens the floor.", slot: "decor" },
    ],
  },
  {
    id: "flavor-lab",
    name: "Flavor Lab",
    ownerName: "Dr. Momo",
    signColor: "#A8C878",
    wallColor: "#E8F8D8",
    accentColor: "#4F7A34",
    location: "earth",
    greeting: "Science says every new flavor needs one brave scooper and several tiny beakers.",
    items: [
      { id: "recipe-pistachio", name: "Recipe Card: Pistachio", emoji: "\u{1F95C}", price: 80, description: "Unlocks Pistachio for future orders.", effect: { type: "unlock-flavor", flavorId: "pistachio" } },
      { id: "recipe-cookie-dough", name: "Recipe Card: Cookie Dough", emoji: "\u{1F36A}", price: 120, description: "Unlocks Cookie Dough for future orders.", effect: { type: "unlock-flavor", flavorId: "cookie-dough" } },
      { id: "tiny-beaker", name: "Tiny Beaker", emoji: "\u{1F9EA}", price: 30, description: "Bubbles gently in your shop.", slot: "decor", effect: { type: "set-flag", flag: "decor-tiny-beaker", value: true } },
      { id: "lab-goggles", name: "Lab Goggles", emoji: "\u{1F97D}", price: 45, description: "Makes you look extremely ready for scoop science.", slot: "held" },
    ],
  },
  {
    id: "scoop-mail",
    name: "Scoop Mail",
    ownerName: "Milo",
    signColor: "#E05050",
    wallColor: "#FFF0E8",
    accentColor: "#9B2030",
    location: "earth",
    greeting: "Letters, stamps, postcards, and one envelope that hums when aliens are nearby.",
    items: [
      { id: "stamp-book", name: "Stamp Book", emoji: "\u{1F4D5}", price: 25, description: "A pocket full of tiny destinations.", slot: "held", effect: { type: "set-flag", flag: "mail-dialogue-unlocked", value: true } },
      { id: "tiny-mailbox", name: "Tiny Mailbox", emoji: "\u{1F4EB}", price: 35, description: "A mailbox for very small good news.", slot: "decor" },
      { id: "galactic-postcard", name: "Galactic Postcard", emoji: "\u{1F4EE}", price: 60, description: "Starts the Tina and Blorp pen-pal thread.", effect: { type: "set-flag", flag: "penpal-postcard-bought", value: true } },
    ],
  },
  {
    id: "weather-window",
    name: "Weather Window",
    ownerName: "Mei",
    signColor: "#80C8FF",
    wallColor: "#E8F7FF",
    accentColor: "#2F6F9F",
    location: "earth",
    greeting: "Weather in jars! Open gently. One thundercloud got dramatic last week.",
    items: [
      { id: "rain-jar", name: "Rain Jar", emoji: "\u{1F327}\uFE0F", price: 70, description: "Stores a polite drizzle.", slot: "decor", effect: { type: "visual-weather", weather: "rain" } },
      { id: "sun-charm", name: "Sun Charm", emoji: "\u2600\uFE0F", price: 90, description: "Customers sometimes tip an extra coin.", slot: "held", effect: { type: "tip-bonus", chance: 0.1, amount: 1 } },
      { id: "snow-globe", name: "Snow Globe", emoji: "\u{1F30C}", price: 120, description: "Tiny drifting snow for cozy days.", slot: "decor", effect: { type: "visual-weather", weather: "snow" } },
      { id: "rainbow-forecast", name: "Rainbow Forecast", emoji: "\u{1F308}", price: 200, description: "Predicts delight. Also unlocks Stellar Sprinkles early.", slot: "decor", effect: { type: "unlock-topping", toppingId: "stellar-sprinkles" } },
    ],
  },
  {
    id: "night-market",
    name: "Night Market",
    ownerName: "Nix",
    signColor: "#FFD060",
    wallColor: "#201020",
    accentColor: "#E0A040",
    location: "earth",
    greeting: "Everything here is mysterious, discounted, or mildly enchanted.",
    unlock: { served: 15 },
    items: [
      { id: "mystery-ticket", name: "Mystery Ticket", emoji: "\u{1F39F}\uFE0F", price: 25, description: "A tiny chance machine in paper form.", effect: { type: "set-flag", flag: "mystery-ticket-owned", value: true } },
      { id: "lucky-lantern", name: "Lucky Lantern", emoji: "\u{1F3EE}", price: 80, description: "Keeps the Night Market lit.", slot: "decor", effect: { type: "set-flag", flag: "night-market-permanent", value: true } },
      { id: "fortune-spoon", name: "Fortune Spoon", emoji: "\u{1F944}", price: 120, description: "Sometimes whispers what comes next.", slot: "held", effect: { type: "set-flag", flag: "fortune-spoon-owned", value: true } },
    ],
  },
  {
    id: "cherry-slots",
    name: "Cherry Slots",
    ownerName: "Vince",
    signColor: "#FFC040",
    wallColor: "#2A1A20",
    accentColor: "#E02040",
    location: "earth",
    greeting: "1G a spin! Match three cherries for a payout. House keeps your coin if you miss. Feeling lucky?",
    items: [],
    type: "casino",
  },
  {
    id: "pixel-arcade",
    name: "Pixel Arcade",
    ownerName: "Ren",
    signColor: "#80C0FF",
    wallColor: "#1A0E30",
    accentColor: "#FFE080",
    location: "earth",
    greeting: "Welcome to the arcade! Pick a cabinet and play. Beat the game for big coins!",
    items: [],
    type: "arcade",
  },
];

const ALIEN_SHOPS: Shop[] = [
  {
    id: "galactic-goods",
    name: "Galactic Goods",
    ownerName: "Blorp",
    signColor: "#80E0B0",
    wallColor: "#B0FFD0",
    accentColor: "#208050",
    location: "alien-planet",
    greeting: "Wares from SIX galaxies! Don't ask about returns on the rhombus items.",
    items: [
      { id: "antenna-extender", name: "Antenna Extender", emoji: "\u{1F4E1}", price: 25, description: "For those who want to hear more." },
      { id: "gravity-boots",    name: "Gravity Boots",    emoji: "\u{1F462}", price: 90, description: "Walk on any ceiling. Any. Ceiling.", slot: "held", effect: { type: "set-flag", flag: "alien-ladder", value: true } },
      { id: "pocket-nebula",    name: "Pocket Nebula",    emoji: "\u{1F30C}", price: 250, description: "Tiny personal nebula. Keep in a cool place." },
    ],
  },
  {
    id: "void-scoops",
    name: "Void Scoops",
    ownerName: "Xarnix",
    signColor: "#C080FF",
    wallColor: "#2A1A4A",
    accentColor: "#FFD0FF",
    location: "alien-planet",
    greeting: "We sell what you cannot find. Prices are in coins and also in regret.",
    items: [
      { id: "void-sprinkles",  name: "Void Sprinkles", emoji: "\u2B50",    price: 30, description: "Tiny cold dots. Absorb sound when you lick them." },
      { id: "time-cone",       name: "Time Cone",      emoji: "\u23F3",    price: 160, description: "Melts into yesterday." },
      { id: "singularity-dip", name: "Singularity Dip", emoji: "\u{1F30C}", price: 420, description: "Dip your scoop. Briefly become infinite." },
    ],
  },
  {
    id: "alien-arcade",
    name: "Glitch Galaxy Arcade",
    ownerName: "Glitch",
    signColor: "#FF70F0",
    wallColor: "#120030",
    accentColor: "#70FFE0",
    location: "alien-planet",
    greeting: "Every cabinet is slightly haunted. That's normal.",
    items: [],
    type: "arcade",
  },
  {
    id: "gravity-tailor",
    name: "Gravity Tailor",
    ownerName: "Veev",
    signColor: "#A0E0FF",
    wallColor: "#203050",
    accentColor: "#F0D080",
    location: "alien-planet",
    greeting: "Try these boots. If you fall upward, they fit.",
    items: [
      { id: "gravity-boots", name: "Gravity Boots", emoji: "\u{1F462}", price: 90, description: "Unlocks the ladder under the alien street.", slot: "held", effect: { type: "set-flag", flag: "alien-ladder", value: true } },
      { id: "ceiling-cape", name: "Ceiling Cape", emoji: "\u{1F9E3}", price: 70, description: "Drapes downward no matter which way gravity points.", slot: "held" },
      { id: "anti-hat", name: "Anti-Hat", emoji: "\u{1F3A9}", price: 55, description: "Floats six thoughts above your head.", slot: "held" },
      { id: "pocket-gravity", name: "Pocket Gravity", emoji: "\u{1F300}", price: 180, description: "Unlocks Moon Dairy on the ship map.", effect: { type: "unlock-destination", destinationId: "moon-dairy" } },
    ],
  },
  {
    id: "memory-aquarium",
    name: "Memory Aquarium",
    ownerName: "Luma",
    signColor: "#70FFE0",
    wallColor: "#102A3A",
    accentColor: "#B8FFF0",
    location: "alien-planet",
    greeting: "The fish remember everything. Some of them remember tomorrow by mistake.",
    items: [
      { id: "memory-pearl", name: "Memory Pearl", emoji: "\u{1F9AA}", price: 100, description: "Named characters remember you more clearly.", slot: "held", effect: { type: "set-flag", flag: "memory-pearl-owned", value: true } },
      { id: "echo-fish", name: "Echo Fish", emoji: "\u{1F420}", price: 140, description: "Past choices bubble up in your shop.", slot: "decor", effect: { type: "set-flag", flag: "echo-fish-owned", value: true } },
      { id: "forget-me-not-filter", name: "Forget-Me-Not Filter", emoji: "\u{1F9FD}", price: 60, description: "Resets one awkward conversation in spirit, if not yet in code.", effect: { type: "set-flag", flag: "memory-filter-owned", value: true } },
    ],
  },
  {
    id: "chrono-garage",
    name: "Chrono Garage",
    ownerName: "Tock",
    signColor: "#FFD040",
    wallColor: "#181830",
    accentColor: "#80E0FF",
    location: "alien-planet",
    greeting: "Ship repairs while you wait. Time repairs while you don't.",
    items: [
      { id: "star-map-fragment", name: "Star Map Fragment", emoji: "\u{1F5FA}\uFE0F", price: 150, description: "Unlocks Asteroid Bazaar.", effect: { type: "unlock-destination", destinationId: "asteroid-bazaar" } },
      { id: "wormhole-compass", name: "Wormhole Compass", emoji: "\u{1F9ED}", price: 250, description: "Unlocks Black Hole Cafe.", slot: "held", effect: { type: "unlock-destination", destinationId: "black-hole-cafe" } },
      { id: "engine-sticker", name: "Engine Sticker", emoji: "\u{1F3F7}\uFE0F", price: 30, description: "Makes the ship engine feel appreciated.", slot: "decor", effect: { type: "set-flag", flag: "engine-sticker-owned", value: true } },
      { id: "time-wrench", name: "Time Wrench", emoji: "\u{1F527}", price: 300, description: "A future ship upgrade. Also unlocks Dino Timeline.", slot: "held", effect: { type: "unlock-destination", destinationId: "dino-timeline" } },
    ],
  },
  {
    id: "orbit-spins",
    name: "Orbit Spins",
    ownerName: "Zork",
    signColor: "#80E0FF",
    wallColor: "#100030",
    accentColor: "#FFD040",
    location: "alien-planet",
    greeting: "Galactic slots, earthling! Match three UFOs or cosmic objects for riches. House has the edge. Bet carefully.",
    items: [],
    type: "casino",
  },
];

// ── Slot machine symbols + payouts ───────────────────────────────────────────
// House edge: 5 symbols, uniform weights -> P(3-of-a-kind) = 4%. Avg payout
// 23.6G -> expected return 0.944G/spin against a 1G bet = ~5.6% house edge.
const SLOT_SYMBOLS_EARTH = ["\u{1F352}", "\u{1F34B}", "\u{1F514}", "7\uFE0F\u20E3", "\u2B50"];
const SLOT_PAYOUTS_EARTH: Record<string, number> = {
  "\u{1F352}": 5,   // cherry
  "\u{1F34B}": 8,   // lemon
  "\u{1F514}": 15,  // bell
  "7\uFE0F\u20E3": 30, // seven
  "\u2B50": 60,     // star
};
const SLOT_SYMBOLS_ALIEN = ["\u{1F6F8}", "\u{1F319}", "\u{1FA90}", "\u2604\uFE0F", "\u{1F30C}"];
const SLOT_PAYOUTS_ALIEN: Record<string, number> = {
  "\u{1F6F8}": 5,       // ufo
  "\u{1F319}": 8,       // crescent moon
  "\u{1FA90}": 15,      // ringed planet
  "\u2604\uFE0F": 30,   // comet
  "\u{1F30C}": 60,      // nebula
};

function getShops(location: Location): Shop[] {
  return location === "alien-planet" ? ALIEN_SHOPS : EARTH_SHOPS;
}

function shopById(id: string): Shop | undefined {
  return [...EARTH_SHOPS, ...ALIEN_SHOPS].find((s) => s.id === id);
}

function isShopUnlocked(
  shop: Shop,
  args: { customersServed: number; inventory: Record<string, number>; unlockFlags: UnlockFlags }
): boolean {
  if (!shop.unlock) return true;
  if (shop.unlock.served != null && args.customersServed < shop.unlock.served) return false;
  if (shop.unlock.itemId && !args.inventory[shop.unlock.itemId]) return false;
  if (shop.unlock.flag && !args.unlockFlags[shop.unlock.flag]) return false;
  return true;
}

function getVisibleShops(
  location: Location,
  args: { customersServed: number; inventory: Record<string, number>; unlockFlags: UnlockFlags }
): Shop[] {
  return getShops(location).filter((shop) => isShopUnlocked(shop, args));
}

function getAvailableEarthFlavors(inventory: Record<string, number>, unlockFlags: UnlockFlags): Flavor[] {
  return [
    ...FLAVORS,
    ...(inventory["recipe-pistachio"] || unlockFlags["flavor-pistachio"] ? [EARTH_UNLOCKABLE_FLAVORS.pistachio] : []),
    ...(inventory["recipe-cookie-dough"] || unlockFlags["flavor-cookie-dough"] ? [EARTH_UNLOCKABLE_FLAVORS.cookieDough] : []),
    ...(unlockFlags["flavor-mythic-vanilla"] ? [EARTH_UNLOCKABLE_FLAVORS.mythicVanilla] : []),
  ];
}

function getAvailableAlienFlavors(inventory: Record<string, number>, unlockFlags: UnlockFlags): Flavor[] {
  return [
    ...ALIEN_FLAVORS,
    ...(inventory["magma-recipe"] || unlockFlags["flavor-magma-cream"] ? [UNDERGROUND_FLAVORS.magmaCream] : []),
    ...(inventory["crystal-mint-recipe"] || unlockFlags["flavor-crystal-mint"] ? [UNDERGROUND_FLAVORS.crystalMint] : []),
  ];
}

function getAvailableToppings(
  location: Location,
  inventory: Record<string, number>,
  unlockFlags: UnlockFlags
): Topping[] {
  if (location === "alien-planet") {
    return [
      ...ALIEN_TOPPINGS,
      ...(unlockFlags["topping-glow-worms-deluxe"] ? [ALIEN_UNLOCKABLE_TOPPINGS.glowWormsDeluxe] : []),
      ...(unlockFlags["topping-glow-shards"] ? [ALIEN_UNLOCKABLE_TOPPINGS.glowShards] : []),
      ...(unlockFlags["topping-fossil-crunch"] ? [ALIEN_UNLOCKABLE_TOPPINGS.fossilCrunch] : []),
    ];
  }
  return [
    ...TOPPINGS,
    ...(inventory["stellar-sprinkles"] || unlockFlags["topping-stellar-sprinkles"] ? [EARTH_UNLOCKABLE_TOPPINGS.stellarSprinkles] : []),
  ];
}

function getDestinationUnlockFlag(destinationId: SpaceDestinationId): string {
  return `destination-${destinationId}`;
}

// ── Dialogue Trees ───────────────────────────────────────────────────────────
const CUSTOMER_DIALOGUES: DialogueNode[][] = [
  // Conversation 0 – about favorite flavor
  [
    { speaker: "them", text: "Hey! I come here every day~", choiceA: { label: "Welcome back!", next: 1 }, choiceB: { label: "Every day?!", next: 2 } },
    { speaker: "them", text: "You always remember my order! You're the best scooper ever!", choiceA: { label: "Aw thanks!", next: 3 }, choiceB: { label: "I try my best~", next: 3 } },
    { speaker: "them", text: "Yeah! I can't resist... ice cream is my whole personality now", choiceA: { label: "Same honestly", next: 3 }, choiceB: { label: "That's valid", next: 3 } },
    { speaker: "them", text: "Okay okay, lemme get my usual! See ya! \u2764\uFE0F" },
  ],
  // Conversation 1 – weather
  [
    { speaker: "them", text: "Perfect ice cream weather today, right?", choiceA: { label: "It's always ice cream weather!", next: 1 }, choiceB: { label: "A bit chilly actually...", next: 2 } },
    { speaker: "them", text: "SO true! Hot days, cold days... every day is scoop day!", choiceA: { label: "You get it!", next: 3 }, choiceB: { label: "A true fan~", next: 3 } },
    { speaker: "them", text: "Chilly?! That means the ice cream won't melt as fast! Big brain!", choiceA: { label: "Genius logic!", next: 3 }, choiceB: { label: "Haha fair point", next: 3 } },
    { speaker: "them", text: "Alright, scoop me up something amazing! \u2728" },
  ],
  // Conversation 2 – compliment the shop
  [
    { speaker: "them", text: "This shop is SO cute! Love the vibes~", choiceA: { label: "Thanks! We try!", next: 1 }, choiceB: { label: "You're cute too!", next: 2 } },
    { speaker: "them", text: "The little polka dots on the wall? *chef's kiss*", choiceA: { label: "Scoopy picked those!", next: 3 }, choiceB: { label: "They're hand-painted!", next: 3 } },
    { speaker: "them", text: "Oh stop it~ \u2764\uFE0F You're making me blush more than the strawberry ice cream!", choiceA: { label: "Hehe~", next: 3 }, choiceB: { label: "\u2764\uFE0F", next: 3 } },
    { speaker: "them", text: "Okay now I'm definitely getting an extra scoop! Treat yourself, right?" },
  ],
  // Conversation 3 – secret menu
  [
    { speaker: "them", text: "Psst... is there a secret menu?", choiceA: { label: "Maybe... \uD83E\uDD2B", next: 1 }, choiceB: { label: "Everything's on display!", next: 2 } },
    { speaker: "them", text: "I KNEW IT! What's on it?? Tell me tell me!", choiceA: { label: "Triple mango stack", next: 3 }, choiceB: { label: "The Scoopy Special", next: 3 } },
    { speaker: "them", text: "Hmm... but what if I asked REALLY nicely? Pretty please? \uD83E\uDD7A", choiceA: { label: "Well... okay fine", next: 3 }, choiceB: { label: "You're too cute to refuse", next: 3 } },
    { speaker: "them", text: "YESSS! I'm telling all my friends about this place! \uD83C\uDF89" },
  ],
  // Conversation 4 – existential ice cream
  [
    { speaker: "them", text: "Do you ever wonder if the ice cream is happy being eaten?", choiceA: { label: "That's... deep", next: 1 }, choiceB: { label: "It was born for this!", next: 2 } },
    { speaker: "them", text: "Like... it fulfills its purpose, right? We ALL need purpose!", choiceA: { label: "Whoa \uD83E\uDD2F", next: 3 }, choiceB: { label: "Philosopher blob~", next: 3 } },
    { speaker: "them", text: "Exactly! Every scoop finds its cone. It's destiny!", choiceA: { label: "Poetic!", next: 3 }, choiceB: { label: "You should write a book", next: 3 } },
    { speaker: "them", text: "Anyway... I'll have two scoops of destiny please! \u2728" },
  ],
];

const SCOOPY_DIALOGUES: DialogueNode[][] = [
  // Conversation 0 – welcome
  [
    { speaker: "them", text: "Hey there, partner! How's scooping going?", choiceA: { label: "Great, boss!", next: 1 }, choiceB: { label: "My arm is tired~", next: 2 } },
    { speaker: "them", text: "That's the spirit! Keep those scoops round and tall!", choiceA: { label: "You got it!", next: 3 }, choiceB: { label: "Round AND tall?!", next: 3 } },
    { speaker: "them", text: "Ha! Take a little break if you need. I'll cover for ya~ ...just kidding I'm a blob, I can't hold a scooper", choiceA: { label: "Hahaha!", next: 3 }, choiceB: { label: "You have tiny arms!", next: 3 } },
    { speaker: "them", text: "Now get back out there! Those customers won't scoop themselves! \uD83D\uDCAA" },
  ],
  // Conversation 1 – origin story
  [
    { speaker: "them", text: "Wanna hear how I started this shop?", choiceA: { label: "Tell me!", next: 1 }, choiceB: { label: "Were you always a blob?", next: 2 } },
    { speaker: "them", text: "I found a magic ice cream cone in the park. One lick and POOF — I became Scoopy!", choiceA: { label: "No way!", next: 3 }, choiceB: { label: "That's amazing!", next: 3 } },
    { speaker: "them", text: "Rude! I've ALWAYS been a blob! A CUTE blob, thank you very much!", choiceA: { label: "The cutest!", next: 3 }, choiceB: { label: "Sorry Scoopy!", next: 3 } },
    { speaker: "them", text: "And now I run the best ice cream shop in town! Life is sweet~ \uD83C\uDF66" },
  ],
  // Conversation 2 – business tips
  [
    { speaker: "them", text: "Pro tip: always smile when you scoop! Customers love it!", choiceA: { label: "I'm always smiling!", next: 1 }, choiceB: { label: "Does it affect flavor?", next: 2 } },
    { speaker: "them", text: "I can tell! You've got that natural scooper energy~", choiceA: { label: "Learned from you!", next: 3 }, choiceB: { label: "\u2728 scooper energy \u2728", next: 3 } },
    { speaker: "them", text: "ABSOLUTELY! Happy scoops taste 47% better! That's science! ...probably.", choiceA: { label: "Sounds legit!", next: 3 }, choiceB: { label: "I believe you", next: 3 } },
    { speaker: "them", text: "Now go spread that scooper joy! The customers are waiting! \u2B50" },
  ],
  // Conversation 3 – Scoopy's dream
  [
    { speaker: "them", text: "One day I wanna open shops ALL over the world!", choiceA: { label: "Global Scoopy empire!", next: 1 }, choiceB: { label: "That's ambitious!", next: 2 } },
    { speaker: "them", text: "Scoopy's Scoop Shop: Paris, Tokyo, Mars! Why not?!", choiceA: { label: "Mars ice cream?!", next: 3 }, choiceB: { label: "I'd visit them all!", next: 3 } },
    { speaker: "them", text: "Dream big, scoop bigger! That's the Scoopy way~", choiceA: { label: "Words to live by!", next: 3 }, choiceB: { label: "You inspire me!", next: 3 } },
    { speaker: "them", text: "And you'll be my #1 scooper at every location! Deal? \uD83E\uDD1D" },
  ],
];

const PX = 4; // pixel scale
const W = 128; // game viewport width in "pixels"
const H = 112; // game viewport height in "pixels"
const CANVAS_W = W * PX; // 512
const CANVAS_H = H * PX; // 448

// Tamagotchi-style blob palettes (body color, accent, eye color)
const TAMA_PALETTES = [
  { body: "#FFE066", accent: "#FFD700", eyes: "#1A1A2E" },  // Yellow Mametchi-style
  { body: "#87CEEB", accent: "#5BB5E0", eyes: "#1A1A2E" },  // Blue
  { body: "#FFB0CB", accent: "#FF85A2", eyes: "#1A1A2E" },  // Pink
  { body: "#B8FFE0", accent: "#8EEDC7", eyes: "#1A1A2E" },  // Mint green
  { body: "#FFD4A0", accent: "#FFB870", eyes: "#2C1B0E" },  // Orange
  { body: "#DDA0DD", accent: "#CC80CC", eyes: "#1A1A2E" },  // Purple
  { body: "#FFFFFF", accent: "#E0E0E0", eyes: "#333" },      // White
  { body: "#FF8C69", accent: "#FF6B4A", eyes: "#1A1A2E" },  // Coral
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrder(level: number, flavors: Flavor[] = FLAVORS): Flavor[] {
  const count = Math.min(1 + Math.floor((level + 1) / 2), 4);
  return Array.from({ length: count }, () => pick(flavors));
}

function generateToppings(level: number, toppings: Topping[] = TOPPINGS): Topping[] {
  if (level < 2) return [];
  if (Math.random() > 0.5) return [];
  const count = Math.min(1 + Math.floor(level / 3), 2);
  const chosen: Topping[] = [];
  const available = [...toppings];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    chosen.push(available.splice(idx, 1)[0]);
  }
  return chosen;
}

function createCustomer(
  id: number,
  level: number,
  flavors: Flavor[] = FLAVORS,
  toppings: Topping[] = TOPPINGS
): Customer {
  return {
    id,
    name: pick(CUSTOMER_NAMES),
    spriteIdx: Math.floor(Math.random() * TAMA_PALETTES.length),
    order: generateOrder(level, flavors),
    toppings: generateToppings(level, toppings),
    x: W + 10,
    targetX: 20 + Math.random() * 20,
    state: "walking-in",
    reaction: "",
    waitTicks: 0,
  };
}

function createAlienCustomer(
  id: number,
  level: number,
  flavors: Flavor[] = ALIEN_FLAVORS,
  toppings: Topping[] = ALIEN_TOPPINGS
): Customer {
  const count = Math.min(2 + Math.floor(level / 2), 4);
  return {
    id,
    name: pick(ALIEN_NAMES),
    spriteIdx: Math.floor(Math.random() * ALIEN_PALETTES.length),
    order: Array.from({ length: count }, () => pick(flavors)),
    toppings: Math.random() > 0.4
      ? Array.from(
          { length: Math.min(2, 1 + Math.floor(level / 3)) },
          () => pick(toppings)
        )
      : [],
    x: W + 10,
    targetX: 20 + Math.random() * 20,
    state: "walking-in",
    reaction: "",
    waitTicks: 0,
    isAlien: true,
  };
}

// Alien VIP — visits Earth shop, so orders EARTH flavors (but a harder/longer order).
// After being served, she reveals she actually meant cosmic flavors — but earth scoops are amazing!
function createAlienVIP(id: number): Customer {
  const flavors = Array.from({ length: 4 }, () => pick(FLAVORS));
  const toppings = [pick(TOPPINGS), pick(TOPPINGS)];
  return {
    id,
    name: "ZARIXA",
    spriteIdx: 1, // purple alien — special
    order: flavors,
    toppings,
    x: 30, // materialized at counter spot
    targetX: 30,
    state: "waiting",
    reaction: "",
    waitTicks: 0,
    isAlienVIP: true,
  };
}

// Boss customer — complex order, 3 hearts. Wrong taps cost a heart and coins.
// ── Sound helpers (shared AudioContext for mobile compatibility) ──────────────
// Mobile browsers require AudioContext to be created/resumed during a user gesture.
// We create ONE shared context on first interaction and reuse it for all sounds.
let sharedAudioCtx: AudioContext | null = null;
let audioReady = false;

function getAudioCtx(): AudioContext | null {
  if (!audioReady) return null;
  return sharedAudioCtx;
}

// Must be called from a user gesture handler (click/tap). Awaits resume() so
// subsequent getAudioCtx() calls return a fully-running context.
async function initAudio(): Promise<void> {
  try {
    // iOS 16.4+: opt into the "playback" audio session so Web Audio is NOT
    // silenced by the ringer/silent switch on the built-in speaker. Without
    // this, audio only plays via external routes (headphones, Bluetooth,
    // CarPlay) because the default ambient session honours the mute switch.
    const nav = navigator as unknown as { audioSession?: { type?: string } };
    if (nav.audioSession) {
      try { nav.audioSession.type = "playback"; } catch { /* older iOS */ }
    }

    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (sharedAudioCtx.state === "suspended") {
      await sharedAudioCtx.resume();
    }
    audioReady = true;
  } catch { /* browser blocked audio */ }
}

function playDing() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.type = "sine"; osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.type = "sine"; osc2.start(ctx.currentTime + 0.1); osc2.stop(ctx.currentTime + 0.5);
  } catch { /* */ }
}

function playBoop() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "square"; osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12);
  } catch { /* */ }
}

function playWrong() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "square"; osc.frequency.setValueAtTime(180, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch { /* */ }
}

function playCoinSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    // Coin collect jingle - rising arpeggio
    const notes = [880, 1108, 1318, 1760];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "square";
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t); osc.stop(t + 0.15);
    });
  } catch { /* */ }
}

type MusicMode = "earth-shop" | "alien-shop" | "space" | "casino" | "boss" | "dino";

const MUSIC_TRACKS: Record<MusicMode, { notes: number[]; dur: number; wave: OscillatorType; vol: number }> = {
  "earth-shop": {
    notes: [
      523, 587, 659, 698, 784, 698, 659, 587,
      523, 659, 784, 880, 784, 659, 523, 440,
      523, 523, 587, 587, 659, 659, 698, 784,
      880, 784, 698, 659, 587, 523, 440, 523,
    ],
    dur: 0.22, wave: "square", vol: 0.06,
  },
  "alien-shop": {
    notes: [
      392, 466, 554, 587, 659, 554, 466, 392,
      330, 392, 466, 587, 698, 587, 466, 392,
      349, 415, 494, 554, 622, 554, 494, 415,
      330, 392, 466, 554, 622, 554, 466, 392,
    ],
    dur: 0.26, wave: "triangle", vol: 0.05,
  },
  "space": {
    notes: [
      220, 0, 277, 0, 330, 0, 392, 0,
      440, 0, 392, 0, 330, 0, 277, 0,
      220, 0, 247, 0, 294, 0, 370, 0,
      440, 0, 370, 0, 294, 0, 247, 0,
    ],
    dur: 0.3, wave: "sine", vol: 0.05,
  },
  "casino": {
    notes: [
      659, 659, 784, 659, 523, 659, 784, 880,
      784, 659, 523, 440, 523, 659, 784, 880,
      988, 880, 784, 659, 784, 880, 988, 784,
      659, 523, 440, 523, 659, 784, 659, 523,
    ],
    dur: 0.18, wave: "square", vol: 0.055,
  },
  "boss": {
    notes: [
      147, 147, 175, 165, 147, 175, 220, 196,
      147, 147, 175, 165, 147, 196, 220, 247,
      165, 165, 196, 185, 165, 196, 247, 220,
      165, 165, 196, 185, 165, 220, 247, 294,
    ],
    dur: 0.2, wave: "sawtooth", vol: 0.05,
  },
  "dino": {
    notes: [
      110, 0, 147, 165, 110, 0, 147, 165,
      131, 0, 165, 196, 131, 0, 165, 196,
      165, 147, 131, 110, 165, 147, 131, 110,
      110, 110, 131, 131, 147, 147, 110, 82,
    ],
    dur: 0.24, wave: "sawtooth", vol: 0.05,
  },
};

// Starts a looped track of the given mode. Returns a stop() handle that
// smoothly fades out the master gain.
function createMusicContext(mode: MusicMode = "earth-shop"): { stop: () => void } | null {
  const audioCtx = getAudioCtx();
  if (!audioCtx) return null;
  const ctx = audioCtx;
  try {
    const cfg = MUSIC_TRACKS[mode];
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(cfg.vol, ctx.currentTime);
    masterGain.connect(ctx.destination);
    const loopLen = cfg.notes.length * cfg.dur;
    let stopped = false;
    function scheduleLoop(t: number) {
      if (stopped) return;
      cfg.notes.forEach((freq, i) => {
        if (freq <= 0) return; // rest
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.type = cfg.wave;
        const nt = t + i * cfg.dur;
        osc.frequency.setValueAtTime(freq, nt);
        g.gain.setValueAtTime(0, nt);
        g.gain.linearRampToValueAtTime(0.4, nt + 0.02);
        g.gain.linearRampToValueAtTime(0.2, nt + cfg.dur * 0.5);
        g.gain.linearRampToValueAtTime(0, nt + cfg.dur * 0.95);
        osc.start(nt); osc.stop(nt + cfg.dur);
      });
      setTimeout(() => scheduleLoop(t + loopLen), (loopLen - 1) * 1000);
    }
    scheduleLoop(ctx.currentTime + 0.1);
    return {
      stop: () => { stopped = true; masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); },
    };
  } catch { return null; }
}


// ── Pixel Art Drawing Helpers ─────────────────────────────────────────────────
// All drawing uses a "virtual pixel" grid. 1 virtual pixel = PX screen pixels.
// This gives us that chunky Tamagotchi look.

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x * PX, y * PX, w * PX, h * PX);
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number = 1) {
  ctx.fillStyle = color;
  ctx.font = `bold ${size * 5 * PX}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x * PX, y * PX);
}

// ── Pixel Art Sprites ─────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D) {
  // Sky / wall - bright pastel with polka dots like Tamagotchi
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < 70) {
        // Wall area - pastel yellow with polka dots
        const isPolka = (x % 10 < 2 && y % 10 < 2);
        px(ctx, x, y, 1, 1, isPolka ? "#FFD36E" : "#FFF4B8");
      } else if (y < 74) {
        // Counter top
        px(ctx, x, y, 1, 1, y === 70 ? "#E8A040" : y === 71 ? "#D49030" : y === 72 ? "#C08020" : "#B07018");
      } else {
        // Floor - pink/green stripes like Tamagotchi
        const stripe = Math.floor(y / 4) % 2;
        px(ctx, x, y, 1, 1, stripe ? "#FFD6E8" : "#C8F7C5");
      }
    }
  }

  // Awning at top - striped pink/white like ice cream shop
  for (let x = 0; x < W; x++) {
    const stripe = Math.floor(x / 6) % 2;
    for (let y = 0; y < 8; y++) {
      px(ctx, x, y, 1, 1, stripe ? "#FF9EBA" : "#FFFFFF");
    }
    // Awning scallop edge
    if (Math.floor(x / 3) % 2 === 0) {
      px(ctx, x, 8, 1, 1, "#FF9EBA");
    }
  }

  // Ice cream tubs on counter (display case)
  const tubY = 63;
  FLAVORS.forEach((f, i) => {
    const tx = 8 + i * 20;
    // Tub container
    for (let dy = 0; dy < 6; dy++) {
      for (let dx = 0; dx < 14; dx++) {
        px(ctx, tx + dx, tubY + dy, 1, 1, "#FFFFFF");
      }
    }
    // Ice cream in tub
    for (let dx = 1; dx < 13; dx++) {
      px(ctx, tx + dx, tubY, 1, 1, f.colors[0]);
      px(ctx, tx + dx, tubY + 1, 1, 1, f.colors[1]);
      px(ctx, tx + dx, tubY + 2, 1, 1, f.colors[1]);
    }
    // Tub border
    for (let dx = 0; dx < 14; dx++) {
      px(ctx, tx + dx, tubY - 1, 1, 1, "#DDD");
      px(ctx, tx + dx, tubY + 6, 1, 1, "#DDD");
    }
  });

  // Door on right side
  const dx = W - 18;
  for (let dy = 20; dy < 70; dy++) {
    for (let ddx = 0; ddx < 14; ddx++) {
      const isBorder = ddx === 0 || ddx === 13 || dy === 20;
      px(ctx, dx + ddx, dy, 1, 1, isBorder ? "#A07020" : "#C09040");
    }
  }
  // Door window
  for (let dy = 24; dy < 38; dy++) {
    for (let ddx = 3; ddx < 11; ddx++) {
      px(ctx, dx + ddx, dy, 1, 1, "#87CEEB");
    }
  }
  // Door handle
  px(ctx, dx + 3, 50, 2, 2, "#FFD700");

  // "OPEN" sign on door
  drawText(ctx, "OPEN", dx + 7, 42, "#FF4444", 0.6);

  // Bell above door
  px(ctx, dx + 7, 17, 2, 2, "#FFD700");
  px(ctx, dx + 7, 19, 1, 1, "#DAA520");
}

function drawCustomerSprite(ctx: CanvasRenderingContext2D, x: number, y: number, paletteIdx: number, walking: boolean) {
  const pal = TAMA_PALETTES[paletteIdx % TAMA_PALETTES.length];
  const bobY = walking ? Math.floor(Math.sin(Date.now() / 200) * 1.5) : 0;
  const legAnim = walking ? Math.floor(Math.sin(Date.now() / 150) * 1) : 0;

  // Shadow on ground
  px(ctx, x - 5, y + 12, 11, 2, "rgba(0,0,0,0.08)");

  // Tiny feet/legs (Tamagotchi style - very small)
  px(ctx, x - 3, y + 10 + bobY + legAnim, 2, 3, pal.accent);
  px(ctx, x + 2, y + 10 + bobY - legAnim, 2, 3, pal.accent);

  // Round blob body (big oval - the main Tamagotchi shape)
  for (let dy = -10; dy <= 9; dy++) {
    // Ellipse: wider in middle, narrower at top/bottom
    const progress = (dy + 10) / 19;
    const halfW = Math.round(7 * Math.sin(progress * Math.PI));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const isOuterEdge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy + bobY, 1, 1, isOuterEdge ? pal.accent : pal.body);
    }
  }

  // Body highlight (light reflection on upper left)
  for (let dy = -7; dy <= -3; dy++) {
    px(ctx, x - 3, y + dy + bobY, 2, 1, lightenColor(pal.body, 40));
  }

  // Tiny arms (stubby Tamagotchi limbs)
  px(ctx, x - 7, y + 1 + bobY, 2, 2, pal.accent);
  px(ctx, x + 6, y + 1 + bobY, 2, 2, pal.accent);

  // Eyes - big and round (Tamagotchi signature)
  // Left eye
  px(ctx, x - 3, y - 3 + bobY, 3, 3, pal.eyes);
  px(ctx, x - 3, y - 3 + bobY, 1, 1, "#FFF"); // shine
  // Right eye
  px(ctx, x + 2, y - 3 + bobY, 3, 3, pal.eyes);
  px(ctx, x + 2, y - 3 + bobY, 1, 1, "#FFF"); // shine

  // Mouth - small happy curve
  px(ctx, x - 1, y + 2 + bobY, 3, 1, "#E06060");
  px(ctx, x - 2, y + 1 + bobY, 1, 1, "#E06060");
  px(ctx, x + 3, y + 1 + bobY, 1, 1, "#E06060");

  // Cheek blush
  px(ctx, x - 6, y + bobY, 2, 2, "#FFB0B0");
  px(ctx, x + 5, y + bobY, 2, 2, "#FFB0B0");
}

// Boss — larger, darker palette with horns + glowing eyes. Still readable
// at pixel scale so it slots into the existing scene.
function drawBossSprite(ctx: CanvasRenderingContext2D, x: number, y: number, walking: boolean, tick: number) {
  const pal = { body: "#A0202A", accent: "#5E1014", eyes: "#FFE040" };
  const bobY = walking ? Math.floor(Math.sin(Date.now() / 200) * 2) : 0;
  const legAnim = walking ? Math.floor(Math.sin(Date.now() / 150)) : 0;
  // Bigger shadow
  px(ctx, x - 7, y + 14, 15, 2, "rgba(0,0,0,0.3)");
  // Feet
  px(ctx, x - 4, y + 11 + bobY + legAnim, 3, 3, pal.accent);
  px(ctx, x + 2, y + 11 + bobY - legAnim, 3, 3, pal.accent);
  // Body — bigger ellipse
  for (let dy = -12; dy <= 10; dy++) {
    const progress = (dy + 12) / 22;
    const halfW = Math.round(9 * Math.sin(progress * Math.PI));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const edge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy + bobY, 1, 1, edge ? pal.accent : pal.body);
    }
  }
  // Smoldering highlight stripe
  for (let dy = -9; dy <= -4; dy++) {
    px(ctx, x - 4, y + dy + bobY, 2, 1, "#E04040");
  }
  // Arms (with claws)
  px(ctx, x - 9, y + 1 + bobY, 2, 3, pal.accent);
  px(ctx, x - 10, y + 4 + bobY, 1, 1, "#FFF");
  px(ctx, x + 8, y + 1 + bobY, 2, 3, pal.accent);
  px(ctx, x + 10, y + 4 + bobY, 1, 1, "#FFF");
  // Glowing eyes — pulse
  const glow = (Math.floor(tick / 8) % 2) ? 1 : 0;
  px(ctx, x - 4, y - 4 + bobY, 3, 3, pal.eyes);
  px(ctx, x - 4, y - 4 + bobY, 1, 1, glow ? "#FFFFFF" : "#FFE040");
  px(ctx, x + 2, y - 4 + bobY, 3, 3, pal.eyes);
  px(ctx, x + 2, y - 4 + bobY, 1, 1, glow ? "#FFFFFF" : "#FFE040");
  // Sinister mouth with fangs
  px(ctx, x - 2, y + 2 + bobY, 5, 1, "#200");
  px(ctx, x - 2, y + 3 + bobY, 1, 1, "#FFFFFF");
  px(ctx, x + 2, y + 3 + bobY, 1, 1, "#FFFFFF");
  // Horns
  px(ctx, x - 6, y - 10 + bobY, 2, 3, pal.accent);
  px(ctx, x - 6, y - 11 + bobY, 1, 1, pal.accent);
  px(ctx, x + 5, y - 10 + bobY, 2, 3, pal.accent);
  px(ctx, x + 6, y - 11 + bobY, 1, 1, pal.accent);
  // Flame tufts between horns
  const flame = Math.floor(Math.sin(tick / 4) * 1);
  px(ctx, x - 1, y - 10 + flame + bobY, 3, 2, "#FFB020");
  px(ctx, x, y - 12 + flame + bobY, 1, 1, "#FFE060");
}

// Mini boss — smaller sinister blob, draws alongside the main boss
function drawMinion(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, spriteIdx: number) {
  const pal = { body: "#803035", accent: "#401014", eyes: "#FFE040" };
  const bob = Math.floor(Math.sin((tick + spriteIdx * 9) / 12) * 1);
  px(ctx, x - 3, y + 8, 7, 2, "rgba(0,0,0,0.25)");
  // tiny body
  for (let dy = -6; dy <= 5; dy++) {
    const p = (dy + 6) / 11;
    const halfW = Math.round(4 * Math.sin(p * Math.PI));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const edge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy + bob, 1, 1, edge ? pal.accent : pal.body);
    }
  }
  // horns
  px(ctx, x - 3, y - 6 + bob, 1, 2, pal.accent);
  px(ctx, x + 3, y - 6 + bob, 1, 2, pal.accent);
  // eyes
  px(ctx, x - 2, y - 2 + bob, 2, 2, pal.eyes);
  px(ctx, x + 1, y - 2 + bob, 2, 2, pal.eyes);
  // grin
  px(ctx, x - 1, y + 2 + bob, 3, 1, "#200");
  px(ctx, x - 1, y + 3 + bob, 1, 1, "#FFF");
  px(ctx, x + 1, y + 3 + bob, 1, 1, "#FFF");
}

// Horizontal chase scene — city road scrolls left, police car chases fleeing minions
function drawChaseScene(ctx: CanvasRenderingContext2D, tick: number, minions: ChaseMinion[]) {
  // Sky
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c;
      if (y < 20) c = "#0E2540";
      else if (y < 40) c = "#3060A0";
      else if (y < 56) c = "#80C0D0";
      else if (y < 72) c = "#4A4A4A";
      else c = (Math.floor(x / 4) + Math.floor(y / 2)) % 6 === 0 ? "#606060" : "#3A3A3A";
      px(ctx, x, y, 1, 1, c);
    }
  }
  // Buildings silhouettes scrolling
  for (let i = 0; i < 8; i++) {
    const bx = ((i * 22 - Math.floor(tick * 1.5)) % (W + 30) + W + 30) % (W + 30) - 20;
    const bh = 20 + (i * 7) % 18;
    for (let dy = 0; dy < bh; dy++) for (let dx = 0; dx < 18; dx++) {
      const edge = dx === 0 || dx === 17 || dy === 0;
      if (bx + dx >= 0 && bx + dx < W) {
        px(ctx, bx + dx, 56 - dy, 1, 1, edge ? "#101822" : "#1A2636");
      }
    }
    // Lit windows
    for (let wy = 4; wy < bh - 2; wy += 4) for (let wx = 3; wx < 15; wx += 4) {
      if (bx + wx >= 0 && bx + wx < W && ((i + wy + wx) % 3 !== 0)) {
        px(ctx, bx + wx, 56 - wy, 2, 2, "#FFE080");
      }
    }
  }
  // Road markings scrolling
  for (let i = 0; i < 12; i++) {
    const mx = ((i * 14 - Math.floor(tick * 3)) % (W + 14) + W + 14) % (W + 14) - 8;
    px(ctx, mx, 78, 6, 1, "#FFE040");
  }
  // Minions running
  minions.forEach((m) => {
    if (m.caught) {
      // caught marker — tiny CAUGHT tag
      drawText(ctx, "ARRESTED!", Math.floor(m.x), Math.floor(m.y) - 10, "#FF4040", 0.5);
      return;
    }
    drawMinion(ctx, Math.floor(m.x), Math.floor(m.y), tick + m.id * 4, m.spriteIdx);
  });
  // Police car on the left
  drawPoliceCar(ctx, 16 + Math.floor(Math.sin(tick / 8) * 1), 74, tick);
  drawText(ctx, "TAP THE MINIONS!", W / 2, 12, "#FF4040", 0.75);
}

function drawPoliceCar(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  // Body
  for (let dy = 0; dy < 8; dy++) for (let dx = 0; dx < 20; dx++) {
    const edge = dx === 0 || dx === 19 || dy === 0 || dy === 7;
    const bottomHalf = dy >= 4;
    px(ctx, x + dx, y + dy, 1, 1, edge ? "#101010" : bottomHalf ? "#1030A0" : "#FFFFFF");
  }
  // Windows
  for (let dy = 2; dy < 4; dy++) for (let dx = 4; dx < 16; dx++) {
    px(ctx, x + dx, y + dy, 1, 1, "#80C0E0");
  }
  // Siren lights (alternating)
  const red = Math.floor(tick / 4) % 2 === 0;
  px(ctx, x + 5, y - 2, 4, 2, red ? "#FF4040" : "#300");
  px(ctx, x + 11, y - 2, 4, 2, red ? "#300" : "#4060FF");
  // Wheels
  px(ctx, x + 2, y + 7, 4, 3, "#101010");
  px(ctx, x + 14, y + 7, 4, 3, "#101010");
  px(ctx, x + 3, y + 8, 1, 1, "#808080");
  px(ctx, x + 15, y + 8, 1, 1, "#808080");
}

// Warp starfield — stars stretch into streaks along travel direction
function drawWarpStars(ctx: CanvasRenderingContext2D, tick: number) {
  // Base dark space
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      px(ctx, x, y, 1, 1, "#040014");
    }
  }
  // Center highlight glow
  const cx = W / 2;
  const cy = H / 2;
  for (let r = 6; r < 30; r++) {
    const a = Math.max(0, (30 - r) / 30) * 0.3;
    if (Math.random() > 0.85) continue;
    const angle = Math.random() * Math.PI * 2;
    const rx = Math.floor(cx + Math.cos(angle) * r);
    const ry = Math.floor(cy + Math.sin(angle) * r);
    ctx.fillStyle = `rgba(180,200,255,${a})`;
    ctx.fillRect(rx * PX, ry * PX, PX, PX);
  }
  // Streaks flowing from center out
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const speed = 3 + (i % 5);
    const r = ((tick * speed + i * 9) % 70);
    const startR = r;
    const endR = r + 8 + Math.floor(tick / 4) % 8;
    const steps = Math.max(1, endR - startR);
    for (let s = 0; s < steps; s++) {
      const rr = startR + s;
      const sx = Math.floor(cx + Math.cos(angle) * rr);
      const sy = Math.floor(cy + Math.sin(angle) * rr * 0.85);
      if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
      const brightness = 40 + (s / steps) * 215;
      ctx.fillStyle = `rgb(${brightness},${brightness},255)`;
      ctx.fillRect(sx * PX, sy * PX, PX, PX);
    }
  }
  // Saucer in the center, slightly vibrating
  const jx = Math.floor(Math.sin(tick / 2) * 1);
  drawFlyingSaucer(ctx, 64 + jx, 56 + jx, tick);
  drawText(ctx, "WARP DRIVE", W / 2, 14, "#80E0FF", 0.85);
}

// Boss-fight arena — hero on left, boss on right, HP bars up top, banner
// during intro/round-start/won/lost. `animOffset` slides hero or boss toward
// the other during attack sequences.
function drawBossFightScene(
  ctx: CanvasRenderingContext2D,
  state: BossFightState,
  tick: number,
  flavorColor: (name: string) => string,
) {
  // Backdrop: arena for simon/intro/fail; horizontal scrolling street for chase/escape; jail cell for caught.
  const isChase = state.phase === "chase-tap" || state.phase === "escaped";
  const isJail = state.phase === "caught";

  if (isChase) {
    // Night street — similar to the chase scene
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let c;
      if (y < 20) c = "#0E2540";
      else if (y < 40) c = "#3060A0";
      else if (y < 56) c = "#80C0D0";
      else if (y < 72) c = "#4A4A4A";
      else c = (Math.floor(x / 4) + Math.floor(y / 2)) % 6 === 0 ? "#606060" : "#3A3A3A";
      px(ctx, x, y, 1, 1, c);
    }
    // Parallax building silhouettes
    for (let i = 0; i < 8; i++) {
      const bx = ((i * 22 - Math.floor(tick * 1.8)) % (W + 30) + W + 30) % (W + 30) - 20;
      const bh = 20 + (i * 7) % 18;
      for (let dy = 0; dy < bh; dy++) for (let dx = 0; dx < 18; dx++) {
        const edge = dx === 0 || dx === 17 || dy === 0;
        if (bx + dx >= 0 && bx + dx < W) {
          px(ctx, bx + dx, 56 - dy, 1, 1, edge ? "#101822" : "#1A2636");
        }
      }
      for (let wy = 4; wy < bh - 2; wy += 4) for (let wx = 3; wx < 15; wx += 4) {
        if (bx + wx >= 0 && bx + wx < W && ((i + wy + wx) % 3 !== 0)) {
          px(ctx, bx + wx, 56 - wy, 2, 2, "#FFE080");
        }
      }
    }
    // Road stripes
    for (let i = 0; i < 12; i++) {
      const mx = ((i * 14 - Math.floor(tick * 3.5)) % (W + 14) + W + 14) % (W + 14) - 8;
      px(ctx, mx, 78, 6, 1, "#FFE040");
    }
    // Relative positions: as chaseProgress / chaseTarget rises, hero closes on boss.
    const closeness = state.phase === "chase-tap"
      ? Math.min(1, state.chaseProgress / state.chaseTarget)
      : 0;
    const bossX = state.phase === "escaped"
      ? Math.min(W + 20, 70 + state.phaseTick * 2)
      : W - 20;
    const heroX = state.phase === "escaped"
      ? 28
      : 10 + Math.floor(closeness * (bossX - 42));
    drawBossSprite(ctx, bossX, 68, true, tick);
    // Money bag in the boss's hand
    drawGoldCoin(ctx, bossX - 10, 68, 3);
    drawHero(ctx, heroX, 74, true, state.bossOnAlien, null);
    // Dust trail
    for (let i = 0; i < 4; i++) {
      const dx = heroX - 8 - i * 3;
      px(ctx, dx, 86 + (i % 2), 2, 1, "rgba(255,255,255,0.4)");
    }
    if (state.phase === "escaped") {
      drawText(ctx, "ESCAPED!", W / 2, H / 2, "#FFAA40", 1.1);
    } else {
      drawText(ctx, "CATCH HIM!", W / 2, 12, "#FFE080", 0.85);
    }
    return;
  }

  if (isJail) {
    // Jail cell backdrop
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const c = y < 72 ? "#3A2A40" : (Math.floor(x / 4) + Math.floor(y / 2)) % 2 ? "#2A1E30" : "#201626";
      px(ctx, x, y, 1, 1, c);
    }
    // Cell bars (vertical)
    for (let i = 0; i < 5; i++) {
      const bx = 52 + i * 8;
      for (let y = 16; y < 80; y++) {
        px(ctx, bx, y, 2, 1, "#AAAACC");
      }
    }
    // Top and bottom rail
    for (let x = 48; x < 96; x++) {
      px(ctx, x, 16, 1, 2, "#AAAACC");
      px(ctx, x, 78, 1, 2, "#AAAACC");
    }
    // Sad boss behind bars
    drawBossSprite(ctx, 72, 70, false, tick);
    // Hero outside with coins
    drawHero(ctx, 24, 74, false, state.bossOnAlien, null);
    for (let i = 0; i < 3; i++) {
      drawGoldCoin(ctx, 18 + i * 7, 60 - (i % 2) * 4, 2);
    }
    // Blink banner
    const blink = Math.floor(state.phaseTick / 4) % 2 === 0;
    drawText(ctx, blink ? "BOSS JAILED!" : "GOTCHA!", W / 2, 12, "#80FF80", 0.95);
    drawText(ctx, `+${state.orderMoney + 100}G`, W / 2, H - 10, "#FFE080", 0.75);
    return;
  }

  // Simon-phase arena
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c;
    if (state.bossOnAlien) {
      if (y < 24) c = "#160030";
      else if (y < 56) c = "#2E0848";
      else if (y < 76) c = "#40104A";
      else c = (Math.floor(x / 6) + Math.floor(y / 2)) % 2 ? "#1A0828" : "#0E0420";
    } else {
      if (y < 24) c = "#3A0010";
      else if (y < 56) c = "#7A1020";
      else if (y < 76) c = "#A04030";
      else c = (Math.floor(x / 6) + Math.floor(y / 2)) % 2 ? "#301010" : "#1E0808";
    }
    px(ctx, x, y, 1, 1, c);
  }

  // Order dots at top: one per flavor in the sequence
  const orderLen = state.order.length;
  const dotW = 10;
  const gap = 2;
  const totalW = orderLen * dotW + (orderLen - 1) * gap;
  const ox = Math.floor((W - totalW) / 2);
  const oy = 20;
  for (let i = 0; i < orderLen; i++) {
    const bx = ox + i * (dotW + gap);
    const color = flavorColor(state.order[i]);
    // Which dot is "active":
    // - simon-show: the one currently being pulsed
    // - simon-play: all done ones are solid green-bordered, current one pulses, future ones gray
    let showActive = false;
    let done = false;
    if (state.phase === "simon-show") {
      showActive = i === state.showIdx;
    } else if (state.phase === "simon-play") {
      done = i < state.playIdx;
      showActive = i === state.playIdx;
    }
    for (let dy = 0; dy < dotW; dy++) for (let dx = 0; dx < dotW; dx++) {
      const d = Math.sqrt((dx - dotW / 2) ** 2 + (dy - dotW / 2) ** 2);
      if (d > dotW / 2) continue;
      const edge = d > dotW / 2 - 1;
      let c = edge ? "#FFFFFF" : color;
      if (!showActive && !done && state.phase === "simon-show") c = edge ? "#333" : "#20202A";
      if (showActive && state.phase === "simon-show") {
        const pulse = Math.floor(tick / 2) % 2 === 0;
        c = edge ? "#FFFFFF" : pulse ? "#FFFFFF" : color;
      }
      if (done) {
        c = edge ? "#20A050" : color;
      }
      px(ctx, bx + dx, oy + dy, 1, 1, c);
    }
  }
  drawText(ctx, state.phase === "simon-show" ? "WATCH THE ORDER" : "REPEAT!", W / 2, 14, "#FFFFFF", 0.6);

  // Combatants
  const heroX = 32;
  const bossX = W - 36;
  drawHero(ctx, heroX, 74, false, state.bossOnAlien, null);
  drawBossSprite(ctx, bossX, 70, false, tick);
  // Thought bubble tail from boss toward dots during show
  if (state.phase === "simon-show") {
    px(ctx, bossX - 2, 62, 2, 2, "#FFFDE8");
    px(ctx, bossX - 6, 56, 2, 2, "#FFFDE8");
  }

  // Phase banners
  if (state.phase === "intro") {
    const alpha = Math.min(1, state.phaseTick / 10);
    ctx.globalAlpha = alpha;
    drawText(ctx, "BOSS!", W / 2, H / 2 - 4, "#FFFFFF", 1.5);
    drawText(ctx, state.bossName, W / 2, H / 2 + 10, "#FF4040", 0.8);
    ctx.globalAlpha = 1;
  } else if (state.phase === "simon-fail") {
    drawText(ctx, "WRONG ORDER!", W / 2, H / 2 - 4, "#FF4040", 1.1);
    drawText(ctx, "boss stomps off...", W / 2, H / 2 + 10, "#FFAA80", 0.5);
  }
}

// ── Sarah's World (meta-game) drawing ───────────────────────────────────────

// Pixel Sarah — the real player. Dark hair to shoulders, light tee, daisy-dot
// leggings, sitting/kneeling on the rug.
function drawPixelSarah(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const bob = Math.floor(Math.sin(tick / 30) * 1);
  // Shadow
  px(ctx, x - 6, y + 10, 13, 2, "rgba(0,0,0,0.15)");
  // Legs (kneeling: short daisy leggings)
  for (let dy = 6; dy < 10; dy++) for (let dx = -5; dx <= 5; dx++) {
    const edge = dx === -5 || dx === 5 || dy === 9;
    // Daisy specks
    const speck = (dx + dy * 3) % 5 === 0;
    px(ctx, x + dx, y + dy, 1, 1, edge ? "#1E2A2E" : speck ? "#FFFFFF" : "#36424A");
  }
  // Torso (gray tee with a print)
  for (let dy = -2; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) {
    const edge = Math.abs(dx) === 5 || dy === -2 || dy === 5;
    px(ctx, x + dx, y + dy + bob, 1, 1, edge ? "#A0A8B0" : "#D8DCE0");
  }
  // T-shirt print (tiny pastel glyph)
  px(ctx, x - 1, y + 1 + bob, 3, 2, "#FF9EBA");
  px(ctx, x, y + 3 + bob, 1, 1, "#80E0FF");
  // Arms
  px(ctx, x - 7, y - 1 + bob, 2, 4, "#E8C0A0");
  px(ctx, x + 6, y - 1 + bob, 2, 4, "#E8C0A0");
  // Neck
  px(ctx, x - 1, y - 3 + bob, 3, 1, "#E8C0A0");
  // Head
  for (let dy = -10; dy <= -3; dy++) for (let dx = -4; dx <= 4; dx++) {
    const edge = Math.abs(dx) === 4 || dy === -10 || dy === -3;
    px(ctx, x + dx, y + dy + bob, 1, 1, edge ? "#B88060" : "#E8C0A0");
  }
  // Long dark hair framing the face
  for (let dy = -10; dy <= -2; dy++) for (let dx = -5; dx <= 5; dx++) {
    const onFace = dy >= -8 && dy <= -5 && Math.abs(dx) <= 3;
    if (onFace) continue;
    if (Math.abs(dx) === 5 || Math.abs(dx) === 4 || dy === -10) {
      px(ctx, x + dx, y + dy + bob, 1, 1, "#2A1A10");
    }
  }
  // Bangs
  for (let dx = -3; dx <= 3; dx++) {
    px(ctx, x + dx, y - 9 + bob, 1, 1, "#2A1A10");
  }
  // Eyes
  px(ctx, x - 2, y - 7 + bob, 1, 1, "#1A1A2E");
  px(ctx, x + 2, y - 7 + bob, 1, 1, "#1A1A2E");
  // Mouth
  px(ctx, x - 1, y - 5 + bob, 3, 1, "#D04060");
}

// Pixel Julia — baby sister crawling on all fours. Small head, cream body,
// polka-dot bib.
function drawPixelJulia(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, moving: boolean) {
  const bob = moving ? Math.floor(Math.sin(tick / 6) * 1) : 0;
  // Shadow
  px(ctx, x - 6, y + 8, 13, 2, "rgba(0,0,0,0.18)");
  // Body (cream/beige crawling pose — horizontal oval)
  for (let dy = 1; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
    const edge = Math.abs(dx) === 6 || dy === 1 || dy === 6;
    px(ctx, x + dx, y + dy + bob, 1, 1, edge ? "#C89A70" : "#E8C8A0");
  }
  // Polka-dot bib in front
  for (let dx = -3; dx <= 3; dx++) {
    px(ctx, x + dx, y + bob, 1, 1, "#FFFFFF");
    px(ctx, x + dx, y + 1 + bob, 1, 1, "#FFFFFF");
  }
  px(ctx, x - 2, y + 1 + bob, 1, 1, "#80C8FF");
  px(ctx, x + 1, y + bob, 1, 1, "#80C8FF");
  px(ctx, x + 2, y + 2 + bob, 1, 1, "#80C8FF");
  // Arms/legs (crawling)
  const legSwing = moving ? Math.floor(Math.sin(tick / 5) * 2) : 0;
  px(ctx, x - 5, y + 6 + bob, 2, 3, "#C89A70");
  px(ctx, x + 4, y + 6 + bob, 2, 3, "#C89A70");
  px(ctx, x - 7 + legSwing, y + 3 + bob, 2, 3, "#C89A70");
  px(ctx, x + 6 - legSwing, y + 3 + bob, 2, 3, "#C89A70");
  // Head (peeking forward)
  for (let dy = -4; dy <= 1; dy++) for (let dx = -3; dx <= 3; dx++) {
    const edge = Math.abs(dx) === 3 || dy === -4;
    px(ctx, x + dx, y + dy + bob, 1, 1, edge ? "#B88060" : "#E8C0A0");
  }
  // Hair (short dark tuft)
  for (let dx = -2; dx <= 2; dx++) px(ctx, x + dx, y - 4 + bob, 1, 1, "#2A1A10");
  px(ctx, x, y - 5 + bob, 1, 1, "#2A1A10");
  // Eyes
  px(ctx, x - 1, y - 2 + bob, 1, 1, "#1A1A2E");
  px(ctx, x + 1, y - 2 + bob, 1, 1, "#1A1A2E");
  // Drooly grin
  px(ctx, x, y + bob, 1, 1, "#D04060");
}

// Stacked magnet tiles — rotating through translucent colors
function drawTileStack(ctx: CanvasRenderingContext2D, cx: number, floorY: number, count: number) {
  const tileColors = ["#80E0FF", "#FFB0E8", "#80FFA0", "#FFE080", "#B080FF", "#FF9080"];
  const tileW = 14;
  const tileH = 6;
  for (let i = 0; i < count; i++) {
    const ty = floorY - (i + 1) * tileH;
    const color = tileColors[i % tileColors.length];
    // Tile body with translucent diagonal pattern
    for (let dy = 0; dy < tileH; dy++) for (let dx = 0; dx < tileW; dx++) {
      const edge = dx === 0 || dx === tileW - 1 || dy === 0 || dy === tileH - 1;
      const diag = (dx + dy) % 2 === 0;
      px(ctx, cx - tileW / 2 + dx, ty + dy, 1, 1, edge ? "#101010" : diag ? color : lightenColor(color, -20));
    }
  }
}

// Playroom backdrop: wall + shelf + rug. No characters.
function drawSarahsWorldBackdrop(ctx: CanvasRenderingContext2D) {
  // Wall
  for (let y = 0; y < 40; y++) for (let x = 0; x < W; x++) {
    px(ctx, x, y, 1, 1, y < 8 ? "#E8D0B0" : "#F0E0C0");
  }
  // Shelves (wooden cubby)
  for (let y = 12; y < 40; y++) for (let x = 0; x < W; x++) {
    const inShelf = y < 38 && x > 8 && x < W - 8;
    if (!inShelf) continue;
    // Cubby outlines
    const cubby = Math.floor((x - 8) / 18) % 2;
    const cubbyEdge = ((x - 8) % 18) === 0 || ((x - 8) % 18) === 17 || y === 12 || y === 37;
    px(ctx, x, y, 1, 1, cubbyEdge ? "#8A6A3A" : cubby ? "#D4B080" : "#C0A070");
  }
  // Tiny toys in the cubbies
  px(ctx, 16, 28, 4, 6, "#FF80A0"); // pink toy
  px(ctx, 38, 26, 3, 8, "#FFD040"); // yellow toy
  px(ctx, 58, 30, 4, 4, "#80E0FF"); // blue block
  px(ctx, 78, 27, 3, 7, "#80FF80"); // green toy
  px(ctx, 100, 28, 4, 6, "#FF6060"); // red truck body
  px(ctx, 100, 34, 1, 1, "#000"); px(ctx, 103, 34, 1, 1, "#000");

  // Rug on the floor with floral motif
  for (let y = 40; y < H; y++) for (let x = 0; x < W; x++) {
    const leaf = ((x + y) % 8 === 0) && ((x * 3 + y) % 11 === 0);
    px(ctx, x, y, 1, 1, leaf ? "#E0C0A0" : "#FAF0D8");
  }
  // Rug border
  for (let x = 0; x < W; x++) {
    px(ctx, x, 40, 1, 1, "#C09878");
    px(ctx, x, 41, 1, 1, "#A07848");
  }
}

function drawSarahsWorldScene(
  ctx: CanvasRenderingContext2D,
  tick: number,
  tileCount: number,
  juliaX: number,
  juliaMoving: boolean,
  shooCooldown: number,
  timeLeftMs: number,
  target: number,
) {
  drawSarahsWorldBackdrop(ctx);
  // Tile stack in the middle
  const floorY = H - 14;
  drawTileStack(ctx, 64, floorY, tileCount);
  // Sarah on the right
  drawPixelSarah(ctx, 104, H - 16, tick);
  // Julia on the left, crawling toward the tower
  drawPixelJulia(ctx, Math.floor(juliaX), H - 14, tick, juliaMoving);

  // Timer bar up top
  const barW = 60;
  const barX = Math.floor((W - barW) / 2);
  for (let dx = 0; dx < barW; dx++) for (let dy = 0; dy < 4; dy++) {
    const edge = dx === 0 || dx === barW - 1 || dy === 0 || dy === 3;
    px(ctx, barX + dx, 4 + dy, 1, 1, edge ? "#333" : "#FFFDE8");
  }
  const fill = Math.max(0, Math.min(barW - 2, Math.floor((timeLeftMs / 45000) * (barW - 2))));
  for (let dx = 0; dx < fill; dx++) for (let dy = 1; dy < 3; dy++) {
    px(ctx, barX + 1 + dx, 4 + dy, 1, 1, timeLeftMs < 10000 ? "#FF4040" : "#50C080");
  }
  // Tile goal counter
  drawText(ctx, `${tileCount}/${target}`, 16, 6, "#333", 0.6);
  drawText(ctx, "SARAH'S WORLD", W / 2, 12, "#D04060", 0.7);
  // Shoo cooldown indicator
  if (shooCooldown > 0) {
    drawText(ctx, "wait...", W - 16, 6, "#888", 0.5);
  }
  // Warning when Julia is close
  if (juliaX > 46) {
    const blink = Math.floor(tick / 4) % 2;
    if (blink) drawText(ctx, "LOOK OUT!", W / 2, H - 4, "#FF4040", 0.55);
  }
}

function drawShopkeeper(ctx: CanvasRenderingContext2D, x: number, y: number, heldItemId: string | null = null) {
  const pal = { body: "#90EE90", accent: "#6BC56B", eyes: "#1A1A2E" }; // green shopkeeper

  // Body behind counter (only upper half visible)
  for (let dy = -14; dy <= 0; dy++) {
    const progress = (dy + 14) / 14;
    const halfW = Math.round(6 * Math.sin(progress * Math.PI * 0.7 + 0.3));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const isOuterEdge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy, 1, 1, isOuterEdge ? pal.accent : pal.body);
    }
  }

  // Highlight
  for (let dy = -12; dy <= -9; dy++) {
    px(ctx, x - 3, y + dy, 2, 1, lightenColor(pal.body, 40));
  }

  // Eyes
  px(ctx, x - 3, y - 9, 3, 3, pal.eyes);
  px(ctx, x - 3, y - 9, 1, 1, "#FFF");
  px(ctx, x + 2, y - 9, 3, 3, pal.eyes);
  px(ctx, x + 2, y - 9, 1, 1, "#FFF");

  // Happy mouth
  px(ctx, x - 1, y - 4, 3, 1, "#E06060");
  px(ctx, x - 2, y - 5, 1, 1, "#E06060");
  px(ctx, x + 3, y - 5, 1, 1, "#E06060");

  // Blush
  px(ctx, x - 5, y - 6, 2, 2, "#FFB0B0");
  px(ctx, x + 4, y - 6, 2, 2, "#FFB0B0");

  // Little chef hat
  for (let dx = -4; dx <= 4; dx++) {
    px(ctx, x + dx, y - 15, 1, 1, "#FFFFFF");
    px(ctx, x + dx, y - 16, 1, 1, "#FFFFFF");
  }
  for (let dx = -3; dx <= 3; dx++) {
    px(ctx, x + dx, y - 17, 1, 1, "#FFFFFF");
    px(ctx, x + dx, y - 18, 1, 1, "#FFFFFF");
  }
  // Hat band
  for (let dx = -4; dx <= 4; dx++) {
    px(ctx, x + dx, y - 15, 1, 1, "#FF69B4");
  }

  // Name tag on counter
  const tagW = 22;
  const tagX = x - Math.floor(tagW / 2);
  const tagY = y + 1;
  for (let dx = 0; dx < tagW; dx++) {
    for (let dy = 0; dy < 6; dy++) {
      const isBorder = dy === 0 || dy === 5 || dx === 0 || dx === tagW - 1;
      px(ctx, tagX + dx, tagY + dy, 1, 1, isBorder ? "#333" : "#FFF");
    }
  }
  drawText(ctx, "SCOOPY", x, tagY + 3, "#FF69B4", 0.4);

  // Held item resting on the counter in front of Scoopy
  drawHeldItemIcon(ctx, heldItemId, x + 9, y - 3);
}

function lightenColor(hex: string, amt: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + amt);
  const g = Math.min(255, ((num >> 8) & 0xff) + amt);
  const b = Math.min(255, (num & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function drawCone(ctx: CanvasRenderingContext2D, x: number, y: number, scoops: Flavor[], toppings: Topping[], toppingsDone: number) {
  // Waffle cone
  const coneTop = y;
  for (let dy = 0; dy <= 16; dy++) {
    const halfW = Math.max(1, Math.floor(6 - dy * 0.3));
    for (let dx = -halfW; dx <= halfW; dx++) {
      const isWaffle = (dx + dy) % 3 === 0;
      px(ctx, x + dx, coneTop + dy, 1, 1, isWaffle ? "#C08830" : "#D4A040");
    }
  }

  // Scoops
  scoops.forEach((scoop, i) => {
    const sy = coneTop - 3 - i * 6;
    for (let dy = -3; dy <= 2; dy++) {
      const halfW = dy <= -2 ? 3 : dy <= 0 ? 5 : 4;
      for (let dx = -halfW; dx <= halfW; dx++) {
        const shade = (dy < -1) ? scoop.colors[0] : (dy < 1) ? scoop.colors[1] : scoop.colors[2];
        px(ctx, x + dx, sy + dy, 1, 1, shade);
      }
    }
    // Highlight pixel
    px(ctx, x - 2, sy - 2, 1, 1, "#FFFFFF");
  });

  // Toppings visible on top scoop
  if (scoops.length > 0) {
    const topY = coneTop - 3 - (scoops.length - 1) * 6;
    for (let ti = 0; ti < toppingsDone; ti++) {
      const topping = toppings[ti];
      if (!topping) continue;
      if (topping.name === "Sprinkles") {
        // Colorful dots
        const sprinkleColors = ["#FF0000", "#00FF00", "#FFFF00", "#FF69B4", "#00BFFF"];
        for (let si = 0; si < 5; si++) {
          const sx = x - 3 + (si * 2);
          const sy2 = topY - 4 + (si % 2);
          px(ctx, sx, sy2, 1, 1, sprinkleColors[si]);
        }
      } else if (topping.name === "Cherry") {
        // Red cherry on top
        px(ctx, x - 1, topY - 5, 3, 3, "#DC143C");
        px(ctx, x, topY - 6, 1, 1, "#228B22"); // stem
        px(ctx, x, topY - 5, 1, 1, "#FF6B6B"); // highlight
      } else if (topping.name === "Whipped Cream") {
        // White dollop
        for (let dx = -3; dx <= 3; dx++) {
          px(ctx, x + dx, topY - 5, 1, 1, "#FFFDF0");
          if (Math.abs(dx) < 3) px(ctx, x + dx, topY - 6, 1, 1, "#FFFFFF");
        }
        px(ctx, x, topY - 7, 1, 1, "#FFFFFF");
      } else if (topping.name === "Hot Fudge") {
        // Dark drizzle lines
        for (let dx = -4; dx <= 4; dx++) {
          px(ctx, x + dx, topY - 4, 1, 1, "#3D1C02");
          if (dx % 2 === 0) px(ctx, x + dx, topY - 3, 1, 1, "#3D1C02");
        }
      } else if (topping.name === "Gummy Bears") {
        // Small colored bears
        const bearColors = ["#FF0000", "#FFD700", "#00CC00"];
        bearColors.forEach((bc, bi) => {
          const bx = x - 3 + bi * 3;
          px(ctx, bx, topY - 5, 2, 2, bc);
          px(ctx, bx, topY - 6, 1, 1, bc); // ears
          px(ctx, bx + 1, topY - 6, 1, 1, bc);
        });
      }
    }
  }
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, cx: number, cy: number, order: Flavor[], scoopsDone: number, toppings: Topping[], toppingsDone: number, toppingsPhase: boolean, reaction: string) {
  if (reaction) {
    // Big round Tamagotchi-style reaction bubble
    const bw = Math.max(28, reaction.length * 5 + 12);
    const bh = 16;
    const bx = Math.max(1, Math.min(cx - Math.floor(bw / 2), W - bw - 1));
    const by = cy - 20;

    // Rounded bubble with thick border (Tamagotchi style)
    for (let dy = 0; dy < bh; dy++) {
      for (let dx = 0; dx < bw; dx++) {
        // Round corners
        const cornerDist = Math.min(
          Math.sqrt(dx * dx + dy * dy),
          Math.sqrt((bw - 1 - dx) ** 2 + dy * dy),
          Math.sqrt(dx * dx + (bh - 1 - dy) ** 2),
          Math.sqrt((bw - 1 - dx) ** 2 + (bh - 1 - dy) ** 2)
        );
        if (cornerDist < 2.5) continue;
        const isBorder = dy <= 1 || dy >= bh - 2 || dx <= 1 || dx >= bw - 2;
        px(ctx, bx + dx, by + dy, 1, 1, isBorder ? "#333" : "#FFFDE8");
      }
    }
    // Rounded tail
    px(ctx, cx - 1, by + bh, 4, 2, "#333");
    px(ctx, cx, by + bh + 2, 2, 1, "#333");
    px(ctx, cx, by + bh, 2, 2, "#FFFDE8");
    drawText(ctx, reaction, bx + bw / 2, by + bh / 2, "#FF69B4", 0.7);
    return;
  }

  // Large Tamagotchi-style order bubble with scoop circles
  const itemCount = order.length + (toppings.length > 0 ? toppings.length + 1 : 0);
  const bw = Math.max(30, itemCount * 9 + 10);
  const bh = 18;
  const bx = Math.max(1, Math.min(cx - Math.floor(bw / 2), W - bw - 1));
  const by = cy - 24;

  // Rounded bubble background (thick border, warm white fill)
  for (let dy = 0; dy < bh; dy++) {
    for (let dx = 0; dx < bw; dx++) {
      const cornerDist = Math.min(
        Math.sqrt(dx * dx + dy * dy),
        Math.sqrt((bw - 1 - dx) ** 2 + dy * dy),
        Math.sqrt(dx * dx + (bh - 1 - dy) ** 2),
        Math.sqrt((bw - 1 - dx) ** 2 + (bh - 1 - dy) ** 2)
      );
      if (cornerDist < 3) continue;
      const isBorder = dy <= 1 || dy >= bh - 2 || dx <= 1 || dx >= bw - 2;
      px(ctx, bx + dx, by + dy, 1, 1, isBorder ? "#333" : "#FFFDE8");
    }
  }
  // Rounded tail pointing down
  px(ctx, cx - 1, by + bh, 4, 2, "#333");
  px(ctx, cx, by + bh + 2, 2, 1, "#333");
  px(ctx, cx, by + bh, 2, 2, "#FFFDE8");

  // Draw scoop circles in bubble (bigger, 5x5)
  order.forEach((item, i) => {
    const done = i < scoopsDone;
    const isNext = !toppingsPhase && i === scoopsDone;
    const ix = bx + 6 + i * 9;
    const iy = by + 5;

    // Scoop dot (5x5 pixel circle)
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        const dist = Math.abs(dx - 2) + Math.abs(dy - 2);
        if (dist <= 3) {
          px(ctx, ix + dx, iy + dy, 1, 1, done ? "#CCC" : item.colors[1]);
        }
      }
    }
    if (done) {
      // Checkmark
      px(ctx, ix + 1, iy + 2, 1, 1, "#4CAF50");
      px(ctx, ix + 2, iy + 3, 1, 1, "#4CAF50");
      px(ctx, ix + 3, iy + 2, 1, 1, "#4CAF50");
      px(ctx, ix + 4, iy + 1, 1, 1, "#4CAF50");
    }
    if (isNext) {
      const blink = Math.floor(Date.now() / 300) % 2;
      if (blink) {
        // Blinking highlight border
        for (let dx = -1; dx <= 5; dx++) {
          px(ctx, ix + dx, iy - 1, 1, 1, "#FF69B4");
          px(ctx, ix + dx, iy + 5, 1, 1, "#FF69B4");
        }
        for (let dy = 0; dy < 5; dy++) {
          px(ctx, ix - 1, iy + dy, 1, 1, "#FF69B4");
          px(ctx, ix + 5, iy + dy, 1, 1, "#FF69B4");
        }
      }
    }
  });

  // Topping indicators
  if (toppings.length > 0) {
    const tx = bx + 6 + order.length * 9;
    const ty = by + 4;
    // Separator
    px(ctx, tx - 2, ty, 1, 8, "#DDD");
    px(ctx, tx - 3, ty, 1, 8, "#EEE");

    toppings.forEach((_, ti) => {
      const done = ti < toppingsDone;
      const isNext = toppingsPhase && ti === toppingsDone;
      const tix = tx + 1 + ti * 7;
      // Star shape for toppings
      px(ctx, tix + 1, ty + 1, 3, 3, done ? "#4CAF50" : isNext ? "#FF69B4" : "#DDD");
      px(ctx, tix + 2, ty, 1, 1, done ? "#4CAF50" : isNext ? "#FF69B4" : "#DDD");
      px(ctx, tix + 2, ty + 4, 1, 1, done ? "#4CAF50" : isNext ? "#FF69B4" : "#DDD");
      px(ctx, tix, ty + 2, 1, 1, done ? "#4CAF50" : isNext ? "#FF69B4" : "#DDD");
      px(ctx, tix + 4, ty + 2, 1, 1, done ? "#4CAF50" : isNext ? "#FF69B4" : "#DDD");
      if (isNext) {
        const blink = Math.floor(Date.now() / 300) % 2;
        if (blink) {
          for (let dx = -1; dx <= 5; dx++) {
            px(ctx, tix + dx, ty - 1, 1, 1, "#FF69B4");
            px(ctx, tix + dx, ty + 5, 1, 1, "#FF69B4");
          }
        }
      }
    });
  }
}

// ── Alien Scene Drawing ──────────────────────────────────────────────────────

function drawAlienPlanetBackground(ctx: CanvasRenderingContext2D, tick: number) {
  // Teal/green gradient sky with stars
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < 70) {
        // Sky: deep teal at top fading to lighter green
        const t = y / 70;
        if (t < 0.35) {
          px(ctx, x, y, 1, 1, "#0E2A3A");
        } else if (t < 0.65) {
          px(ctx, x, y, 1, 1, "#1E4A5A");
        } else {
          px(ctx, x, y, 1, 1, "#2E6A5A");
        }
      } else if (y < 74) {
        // Counter top - purple/green metallic
        px(ctx, x, y, 1, 1, y === 70 ? "#60C090" : y === 71 ? "#40A080" : y === 72 ? "#308070" : "#205060");
      } else {
        // Alien floor - green/purple checker
        const check = (Math.floor(x / 6) + Math.floor(y / 4)) % 2;
        px(ctx, x, y, 1, 1, check ? "#70C080" : "#506050");
      }
    }
  }

  // Twinkling stars
  for (let i = 0; i < 22; i++) {
    const sx = (i * 13) % W;
    const sy = (i * 7) % 55;
    const twinkle = (Math.floor(tick / 20) + i) % 3 === 0;
    if (twinkle) px(ctx, sx, sy, 1, 1, "#FFFFFF");
  }

  // Two alien moons
  // Big moon (left)
  for (let dy = -7; dy <= 7; dy++) {
    for (let dx = -7; dx <= 7; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 7) {
        const edge = d > 6;
        px(ctx, 22 + dx, 18 + dy, 1, 1, edge ? "#8040A0" : "#B070C0");
      }
    }
  }
  // moon crater
  px(ctx, 20, 16, 2, 2, "#8040A0");
  px(ctx, 25, 20, 2, 1, "#8040A0");

  // Small moon (upper-right)
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 4) {
        const edge = d > 3;
        px(ctx, 98 + dx, 14 + dy, 1, 1, edge ? "#C08040" : "#FFB060");
      }
    }
  }

  // Alien plants on floor
  const plantXs = [6, 40, 62, 120];
  plantXs.forEach((px0, pi) => {
    const bobF = Math.floor(Math.sin((tick + pi * 30) / 25) * 1);
    // stem
    px(ctx, px0, 74 + bobF, 1, 4, "#4CBF4C");
    // bulb
    px(ctx, px0 - 1, 73 + bobF, 3, 2, pi % 2 ? "#FF70C0" : "#70D0FF");
    px(ctx, px0, 72 + bobF, 1, 1, pi % 2 ? "#FFB0E0" : "#B0E8FF");
  });

  // Striped alien awning at top (green/purple)
  for (let x = 0; x < W; x++) {
    const stripe = Math.floor(x / 6) % 2;
    for (let y = 0; y < 8; y++) {
      px(ctx, x, y, 1, 1, stripe ? "#6BC56B" : "#9040C0");
    }
    if (Math.floor(x / 3) % 2 === 0) {
      px(ctx, x, 8, 1, 1, "#6BC56B");
    }
  }

  // Alien ice cream tubs on counter
  const tubY = 63;
  ALIEN_FLAVORS.forEach((f, i) => {
    const tx = 8 + i * 20;
    // Tub container (darker for alien tech look)
    for (let dy = 0; dy < 6; dy++) {
      for (let dx = 0; dx < 14; dx++) {
        px(ctx, tx + dx, tubY + dy, 1, 1, "#D0D8E0");
      }
    }
    // Ice cream in tub
    for (let dx = 1; dx < 13; dx++) {
      px(ctx, tx + dx, tubY, 1, 1, f.colors[0]);
      px(ctx, tx + dx, tubY + 1, 1, 1, f.colors[1]);
      px(ctx, tx + dx, tubY + 2, 1, 1, f.colors[1]);
    }
    for (let dx = 0; dx < 14; dx++) {
      px(ctx, tx + dx, tubY - 1, 1, 1, "#90A0B0");
      px(ctx, tx + dx, tubY + 6, 1, 1, "#90A0B0");
    }
  });

  // Door on right side (alien tech door — glowing)
  const dx0 = W - 18;
  for (let dy = 20; dy < 70; dy++) {
    for (let ddx = 0; ddx < 14; ddx++) {
      const isBorder = ddx === 0 || ddx === 13 || dy === 20;
      px(ctx, dx0 + ddx, dy, 1, 1, isBorder ? "#40E0A0" : "#206050");
    }
  }
  // Door window — swirling portal
  const portalPhase = Math.floor(tick / 6) % 3;
  for (let dy = 24; dy < 38; dy++) {
    for (let ddx = 3; ddx < 11; ddx++) {
      const d = Math.abs(dy - 31) + Math.abs(ddx - 7);
      const color = (d + portalPhase) % 3 === 0 ? "#80FFD0" : "#40B090";
      px(ctx, dx0 + ddx, dy, 1, 1, color);
    }
  }
  // Handle
  px(ctx, dx0 + 3, 50, 2, 2, "#C0FFE0");
  // "EXIT" sign
  drawText(ctx, "EXIT", dx0 + 7, 42, "#FFFF80", 0.6);
  // Blinking bell
  const blinkOn = Math.floor(tick / 8) % 2 === 0;
  px(ctx, dx0 + 7, 17, 2, 2, blinkOn ? "#FFFF80" : "#C0C040");
  px(ctx, dx0 + 7, 19, 1, 1, "#C0C040");
}

function drawAlienShopkeeper(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) {
  const pal = { body: "#C080FF", accent: "#8040C0", eyes: "#FFF" };
  const wobble = Math.floor(Math.sin(tick / 30) * 1);

  // Body
  for (let dy = -14; dy <= 0; dy++) {
    const progress = (dy + 14) / 14;
    const halfW = Math.round(6 * Math.sin(progress * Math.PI * 0.7 + 0.3));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const isOuterEdge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy + wobble, 1, 1, isOuterEdge ? pal.accent : pal.body);
    }
  }

  // Highlight
  for (let dy = -12; dy <= -9; dy++) {
    px(ctx, x - 3, y + dy + wobble, 2, 1, lightenColor(pal.body, 40));
  }

  // 3 eyes
  px(ctx, x - 4, y - 9 + wobble, 2, 2, pal.eyes);
  px(ctx, x - 4, y - 9 + wobble, 1, 1, "#1A1A2E");
  px(ctx, x + 3, y - 9 + wobble, 2, 2, pal.eyes);
  px(ctx, x + 3, y - 9 + wobble, 1, 1, "#1A1A2E");
  px(ctx, x, y - 11 + wobble, 2, 2, pal.eyes);
  px(ctx, x, y - 11 + wobble, 1, 1, "#1A1A2E");

  // Mouth
  px(ctx, x - 1, y - 4 + wobble, 3, 1, "#6010A0");
  px(ctx, x - 2, y - 5 + wobble, 1, 1, "#6010A0");
  px(ctx, x + 3, y - 5 + wobble, 1, 1, "#6010A0");

  // Antennae
  px(ctx, x - 4, y - 17 + wobble, 1, 3, pal.accent);
  px(ctx, x + 4, y - 17 + wobble, 1, 3, pal.accent);
  px(ctx, x - 5, y - 18 + wobble, 2, 2, "#FF80E0");
  px(ctx, x + 4, y - 18 + wobble, 2, 2, "#80E0FF");

  // Chef hat
  for (let dx = -4; dx <= 4; dx++) {
    px(ctx, x + dx, y - 15 + wobble, 1, 1, "#E0D0FF");
  }
  for (let dx = -3; dx <= 3; dx++) {
    px(ctx, x + dx, y - 16 + wobble, 1, 1, "#FFFFFF");
  }
  // Hat band
  for (let dx = -4; dx <= 4; dx++) {
    px(ctx, x + dx, y - 15 + wobble, 1, 1, "#40C080");
  }

  // Name tag
  const tagW = 22;
  const tagX = x - Math.floor(tagW / 2);
  const tagY = y + 1;
  for (let dx = 0; dx < tagW; dx++) {
    for (let dy = 0; dy < 6; dy++) {
      const isBorder = dy === 0 || dy === 5 || dx === 0 || dx === tagW - 1;
      px(ctx, tagX + dx, tagY + dy, 1, 1, isBorder ? "#333" : "#FFF");
    }
  }
  drawText(ctx, "ZORP", x, tagY + 3, "#8040C0", 0.4);
}

function drawAlienSprite(ctx: CanvasRenderingContext2D, x: number, y: number, paletteIdx: number, walking: boolean) {
  const pal = ALIEN_PALETTES[paletteIdx % ALIEN_PALETTES.length];
  const bobY = walking ? Math.floor(Math.sin(Date.now() / 200) * 1.5) : 0;
  const tentacleAnim = Math.floor(Math.sin(Date.now() / 180) * 2);

  // Shadow
  px(ctx, x - 5, y + 12, 11, 2, "rgba(0,0,0,0.12)");

  // Tentacle legs (3 wiggly ones)
  for (let t = -1; t <= 1; t++) {
    const tx = x + t * 3;
    const ty = y + 9 + bobY;
    px(ctx, tx, ty, 2, 2, pal.tentacle);
    px(ctx, tx + (t === 0 ? 0 : t) + tentacleAnim, ty + 2, 2, 2, pal.tentacle);
  }

  // Round blob body
  for (let dy = -10; dy <= 9; dy++) {
    const progress = (dy + 10) / 19;
    const halfW = Math.round(7 * Math.sin(progress * Math.PI));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const isOuterEdge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy + bobY, 1, 1, isOuterEdge ? pal.accent : pal.body);
    }
  }

  // Body highlight
  for (let dy = -7; dy <= -3; dy++) {
    px(ctx, x - 3, y + dy + bobY, 2, 1, lightenColor(pal.body, 40));
  }

  // Tentacle arms (wavy)
  px(ctx, x - 7, y + 1 + bobY + tentacleAnim, 2, 2, pal.tentacle);
  px(ctx, x - 8, y + 3 + bobY + tentacleAnim, 2, 2, pal.tentacle);
  px(ctx, x + 6, y + 1 + bobY - tentacleAnim, 2, 2, pal.tentacle);
  px(ctx, x + 7, y + 3 + bobY - tentacleAnim, 2, 2, pal.tentacle);

  // Eyes — varies by eyeCount
  const eyeShine = "#FFF";
  if (pal.eyeCount === 2) {
    px(ctx, x - 3, y - 3 + bobY, 3, 3, pal.eyes);
    px(ctx, x - 3, y - 3 + bobY, 1, 1, eyeShine);
    px(ctx, x + 2, y - 3 + bobY, 3, 3, pal.eyes);
    px(ctx, x + 2, y - 3 + bobY, 1, 1, eyeShine);
  } else if (pal.eyeCount === 3) {
    px(ctx, x - 4, y - 2 + bobY, 2, 2, pal.eyes);
    px(ctx, x - 4, y - 2 + bobY, 1, 1, eyeShine);
    px(ctx, x + 3, y - 2 + bobY, 2, 2, pal.eyes);
    px(ctx, x + 3, y - 2 + bobY, 1, 1, eyeShine);
    px(ctx, x, y - 4 + bobY, 2, 2, pal.eyes);
    px(ctx, x, y - 4 + bobY, 1, 1, eyeShine);
  } else { // 4 eyes
    px(ctx, x - 5, y - 3 + bobY, 2, 2, pal.eyes);
    px(ctx, x - 5, y - 3 + bobY, 1, 1, eyeShine);
    px(ctx, x - 2, y - 3 + bobY, 2, 2, pal.eyes);
    px(ctx, x - 2, y - 3 + bobY, 1, 1, eyeShine);
    px(ctx, x + 1, y - 3 + bobY, 2, 2, pal.eyes);
    px(ctx, x + 1, y - 3 + bobY, 1, 1, eyeShine);
    px(ctx, x + 4, y - 3 + bobY, 2, 2, pal.eyes);
    px(ctx, x + 4, y - 3 + bobY, 1, 1, eyeShine);
  }

  // Mouth (wavy)
  px(ctx, x - 1, y + 2 + bobY, 3, 1, "#50A050");
  px(ctx, x - 2, y + 3 + bobY, 1, 1, "#50A050");
  px(ctx, x + 3, y + 3 + bobY, 1, 1, "#50A050");

  // Antennae
  px(ctx, x - 3, y - 9 + bobY, 1, 3, pal.accent);
  px(ctx, x + 3, y - 9 + bobY, 1, 3, pal.accent);
  px(ctx, x - 4, y - 10 + bobY, 2, 2, "#FFE080");
  px(ctx, x + 3, y - 10 + bobY, 2, 2, "#FFE080");

  // Cheek spots
  px(ctx, x - 6, y + bobY, 2, 2, lightenColor(pal.body, -15));
  px(ctx, x + 5, y + bobY, 2, 2, lightenColor(pal.body, -15));
}

function drawFlyingSaucer(ctx: CanvasRenderingContext2D, cx: number, cy: number, tick: number) {
  // Dome (top)
  for (let dy = -6; dy <= 0; dy++) {
    const halfW = Math.round(6 * Math.sin(((dy + 6) / 6) * Math.PI * 0.5));
    for (let dx = -halfW; dx <= halfW; dx++) {
      const isEdge = Math.abs(dx) === halfW;
      px(ctx, cx + dx, cy + dy, 1, 1, isEdge ? "#5070A0" : "#80B0E0");
    }
  }
  // Dome shine
  px(ctx, cx - 3, cy - 4, 2, 1, "#D0E8FF");
  px(ctx, cx - 2, cy - 5, 1, 1, "#FFFFFF");

  // Disc (mid, wider)
  for (let dx = -12; dx <= 12; dx++) {
    const absX = Math.abs(dx);
    const topY = cy + (absX > 8 ? 1 : 0);
    px(ctx, cx + dx, topY, 1, 1, "#B0B0C0");
    px(ctx, cx + dx, topY + 1, 1, 1, "#808090");
    px(ctx, cx + dx, topY + 2, 1, 1, "#606070");
  }
  // Disc edges
  px(ctx, cx - 13, cy + 1, 1, 2, "#808090");
  px(ctx, cx + 13, cy + 1, 1, 2, "#808090");

  // Blinking lights under disc
  const lightPhase = Math.floor(tick / 4) % 4;
  const lightColors = ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF"];
  for (let i = 0; i < 5; i++) {
    const lx = cx - 8 + i * 4;
    const on = (lightPhase + i) % 4 === 0;
    px(ctx, lx, cy + 3, 2, 1, on ? lightColors[i % 4] : "#404040");
  }
}

function drawBeam(ctx: CanvasRenderingContext2D, cx: number, yTop: number, yBot: number, tick: number) {
  const halfW = 5;
  for (let y = yTop; y <= yBot; y++) {
    for (let dx = -halfW; dx <= halfW; dx++) {
      const shimmer = ((y + tick) % 3) === (Math.abs(dx) % 3);
      const edge = Math.abs(dx) >= halfW - 1;
      if (edge) {
        px(ctx, cx + dx, y, 1, 1, shimmer ? "#E0FFE0" : "#80FFA0");
      } else {
        px(ctx, cx + dx, y, 1, 1, shimmer ? "#FFFFFF" : "#C0FFC0");
      }
    }
  }
  // Sparkles inside
  for (let i = 0; i < 4; i++) {
    const sx = cx - 3 + ((tick + i * 5) % 7);
    const sy = yTop + ((tick * 2 + i * 11) % (yBot - yTop));
    px(ctx, sx, sy, 1, 1, "#FFFFFF");
  }
}

function drawSpaceScene(ctx: CanvasRenderingContext2D, tick: number, direction: "out" | "back") {
  // Black space
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      px(ctx, x, y, 1, 1, "#080018");
    }
  }
  // Scrolling star field (parallax, 3 layers)
  for (let i = 0; i < 60; i++) {
    const layer = i % 3;
    const speed = (layer + 1) * 0.8;
    const baseX = (i * 17) % W;
    const offset = direction === "out" ? tick * speed : -tick * speed;
    const sx = ((baseX - offset) % W + W) % W;
    const sy = (i * 7) % H;
    const color = layer === 0 ? "#FFFFFF" : layer === 1 ? "#AAAACC" : "#6666AA";
    px(ctx, Math.floor(sx), sy, 1, 1, color);
  }
  // Passing planets (every ~80 ticks)
  const planets = [
    { offset: 0, color: "#FF8040", size: 8 },
    { offset: 100, color: "#40FFA0", size: 6 },
    { offset: 200, color: "#A060FF", size: 10 },
  ];
  planets.forEach((pl) => {
    const progress = ((tick + pl.offset) % 300) / 300; // 0 -> 1
    const px0 = direction === "out"
      ? Math.floor(W + pl.size - progress * (W + pl.size * 2))
      : Math.floor(-pl.size + progress * (W + pl.size * 2));
    const py0 = 30 + Math.floor(Math.sin(progress * Math.PI) * 8);
    for (let dy = -pl.size; dy <= pl.size; dy++) {
      for (let dx = -pl.size; dx <= pl.size; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= pl.size) {
          const edge = d > pl.size - 1.5;
          const shade = edge ? "#000000" : pl.color;
          if (px0 + dx >= 0 && px0 + dx < W && py0 + dy >= 0 && py0 + dy < H) {
            px(ctx, px0 + dx, py0 + dy, 1, 1, shade);
          }
        }
      }
    }
  });
}

// ── Item icons + home-shop decor ─────────────────────────────────────────────

// Draws a small pixel-art icon for a held item; x,y is the top-left-ish corner.
function drawHeldItemIcon(ctx: CanvasRenderingContext2D, itemId: string | null, x: number, y: number) {
  if (!itemId) return;
  switch (itemId) {
    case "picture-book":
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 6; dx++) {
        const c = dx === 0 ? "#1A5A1A" : dx === 5 ? "#228822" : dy === 0 || dy === 4 ? "#C0E0C0" : "#FFFFFF";
        px(ctx, x + dx, y + dy, 1, 1, c);
      }
      break;
    case "recipe-book":
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 6; dx++) {
        const c = dx === 0 ? "#805020" : dx === 5 ? "#A06830" : dy === 0 || dy === 4 ? "#FFC080" : "#FFE8C0";
        px(ctx, x + dx, y + dy, 1, 1, c);
      }
      break;
    case "spell-book":
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 6; dx++) {
        const c = dx === 0 ? "#401040" : dx === 5 ? "#602060" : dy === 0 || dy === 4 ? "#B080B0" : "#FFD0FF";
        px(ctx, x + dx, y + dy, 1, 1, c);
      }
      px(ctx, x + 2, y + 2, 1, 1, "#FFD700");
      break;
    case "bouncy-ball":
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 2.2) px(ctx, x + dx, y + dy, 1, 1, "#FF4040");
      }
      px(ctx, x - 1, y - 1, 1, 1, "#FFB0B0");
      break;
    case "teddy-bear":
      px(ctx, x - 2, y, 5, 4, "#8B5E3C");
      px(ctx, x - 2, y - 2, 2, 2, "#8B5E3C");
      px(ctx, x + 1, y - 2, 2, 2, "#8B5E3C");
      px(ctx, x - 1, y + 1, 1, 1, "#1A1A2E");
      px(ctx, x + 1, y + 1, 1, 1, "#1A1A2E");
      px(ctx, x, y + 3, 1, 1, "#1A1A2E");
      break;
    case "balloon":
      for (let dy = -4; dy <= 0; dy++) for (let dx = -2; dx <= 2; dx++) {
        const d = Math.sqrt(dx * dx + (dy + 1.5) ** 2);
        if (d <= 2.4) px(ctx, x + dx, y + dy, 1, 1, "#FF4040");
      }
      px(ctx, x, y + 1, 1, 3, "#AAAAAA");
      px(ctx, x - 1, y - 3, 1, 1, "#FFB0B0");
      break;
    default:
      px(ctx, x - 2, y - 2, 5, 5, "#FFE080");
      px(ctx, x - 1, y - 1, 3, 3, "#80E0FF");
      px(ctx, x, y, 1, 1, "#FF70F0");
      break;
  }
}

// Places equipped decor inside the home shop backdrop (called after drawBackground).
function drawHomeDecor(ctx: CanvasRenderingContext2D, decorIds: string[], tick: number) {
  decorIds.forEach((id) => {
    if (id === "potted-plant") {
      const bx = 108, by = 64;
      // Pot
      for (let dy = 0; dy < 5; dy++) for (let dx = 0; dx < 8; dx++) {
        const edge = dx === 0 || dx === 7;
        px(ctx, bx + dx, by + 3 + dy, 1, 1, edge ? "#602010" : "#A05020");
      }
      px(ctx, bx, by + 2, 8, 1, "#4A1808");
      // Leaves
      const sway = Math.floor(Math.sin(tick / 18) * 1);
      for (let dy = -6; dy <= 1; dy++) for (let dx = -1; dx <= 8; dx++) {
        const r = Math.abs(dx - 3.5) / 2 + Math.abs(dy + 3) / 2;
        if (r < 2.8) px(ctx, bx + dx + sway, by + dy, 1, 1, "#50C060");
      }
      px(ctx, bx + 3 + sway, by - 5, 1, 1, "#A0FFB0");
    } else if (id === "wall-poster") {
      const px0 = 34, py0 = 18;
      for (let dy = 0; dy < 10; dy++) for (let dx = 0; dx < 9; dx++) {
        const edge = dx === 0 || dx === 8 || dy === 0 || dy === 9;
        px(ctx, px0 + dx, py0 + dy, 1, 1, edge ? "#502818" : "#FFE8B0");
      }
      // tiny heart motif
      px(ctx, px0 + 3, py0 + 3, 2, 2, "#FF69B4");
      px(ctx, px0 + 5, py0 + 3, 2, 2, "#FF69B4");
      px(ctx, px0 + 4, py0 + 5, 1, 1, "#FF69B4");
      px(ctx, px0 + 3, py0 + 6, 3, 1, "#FF4488");
    } else if (id === "cozy-rug") {
      const rx = 42, ry = 100;
      for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 44; dx++) {
        const stripe = Math.floor(dx / 5) % 2;
        const edge = dy === 0 || dy === 5 || dx === 0 || dx === 43;
        px(ctx, rx + dx, ry + dy, 1, 1, edge ? "#803050" : stripe ? "#FFB0CB" : "#FFFDE8");
      }
      // tassels
      for (let i = 0; i < 8; i++) {
        px(ctx, rx - 2 + i, ry + 6, 1, 2, "#D4567A");
        px(ctx, rx + 44 - 8 + i, ry + 6, 1, 2, "#D4567A");
      }
    } else if (id === "tiny-beaker") {
      const bx = 104, by = 62;
      px(ctx, bx, by, 8, 1, "#203040");
      px(ctx, bx + 1, by + 1, 6, 7, "#B8F8FF");
      px(ctx, bx + 2, by + 4, 4, 3, "#80E0B0");
      const bubbleY = by - 2 + Math.floor(Math.sin(tick / 10) * 1);
      px(ctx, bx + 2, bubbleY, 1, 1, "#E8FFFF");
      px(ctx, bx + 5, bubbleY - 3, 1, 1, "#E8FFFF");
    } else if (id === "tiny-mailbox") {
      const mx = 106, my = 63;
      px(ctx, mx, my, 9, 6, "#D84040");
      px(ctx, mx + 1, my + 1, 7, 2, "#FF9090");
      px(ctx, mx + 4, my + 6, 1, 5, "#604020");
      px(ctx, mx + 8, my - 1, 2, 1, "#FFE080");
    } else if (id === "rain-jar" || id === "snow-globe" || id === "rainbow-forecast") {
      const gx = 106, gy = 63;
      px(ctx, gx, gy + 5, 10, 2, "#604020");
      for (let dy = 0; dy < 6; dy++) for (let dx = 1; dx < 9; dx++) {
        const color = id === "rain-jar" ? "#80C8FF" : id === "snow-globe" ? "#E8FFFF" : dx < 4 ? "#FF80A0" : dx < 6 ? "#FFE080" : "#80E0A0";
        px(ctx, gx + dx, gy + dy, 1, 1, color);
      }
    } else if (id === "lucky-lantern") {
      const lx = 108, ly = 25;
      px(ctx, lx, ly, 6, 1, "#FFD060");
      px(ctx, lx + 1, ly + 1, 4, 6, "#FF7040");
      px(ctx, lx + 2, ly + 2, 2, 4, Math.floor(tick / 12) % 2 ? "#FFE080" : "#FFD040");
    }
  });
}

// ── Street + Shop Drawing ────────────────────────────────────────────────────

// Hero (player character) — full-body standing/walking figure
function drawHero(ctx: CanvasRenderingContext2D, x: number, y: number, walking: boolean, alien: boolean, heldItemId: string | null = null) {
  const pal = alien
    ? { body: "#C080FF", accent: "#8040C0", eyes: "#FFF" }
    : { body: "#90EE90", accent: "#6BC56B", eyes: "#1A1A2E" };
  const bob = walking ? Math.floor(Math.sin(Date.now() / 180) * 1.2) : 0;
  const legAnim = walking ? Math.floor(Math.sin(Date.now() / 150) * 1) : 0;
  // Shadow
  px(ctx, x - 5, y + 14, 11, 2, "rgba(0,0,0,0.18)");
  // Feet
  px(ctx, x - 3, y + 10 + bob + legAnim, 2, 3, pal.accent);
  px(ctx, x + 2, y + 10 + bob - legAnim, 2, 3, pal.accent);
  // Body
  for (let dy = -10; dy <= 9; dy++) {
    const progress = (dy + 10) / 19;
    const halfW = Math.round(7 * Math.sin(progress * Math.PI));
    if (halfW <= 0) continue;
    for (let dx = -halfW; dx <= halfW; dx++) {
      const edge = Math.abs(dx) === halfW;
      px(ctx, x + dx, y + dy + bob, 1, 1, edge ? pal.accent : pal.body);
    }
  }
  // Highlight
  for (let dy = -7; dy <= -3; dy++) {
    px(ctx, x - 3, y + dy + bob, 2, 1, lightenColor(pal.body, 40));
  }
  // Arms
  px(ctx, x - 7, y + 1 + bob, 2, 2, pal.accent);
  px(ctx, x + 6, y + 1 + bob, 2, 2, pal.accent);
  // Eyes
  px(ctx, x - 3, y - 3 + bob, 3, 3, pal.eyes);
  px(ctx, x - 3, y - 3 + bob, 1, 1, "#FFF");
  px(ctx, x + 2, y - 3 + bob, 3, 3, pal.eyes);
  px(ctx, x + 2, y - 3 + bob, 1, 1, "#FFF");
  // Mouth + blush
  px(ctx, x - 1, y + 2 + bob, 3, 1, "#E06060");
  px(ctx, x - 6, y + bob, 2, 2, "#FFB0B0");
  px(ctx, x + 5, y + bob, 2, 2, "#FFB0B0");
  // Chef hat w/ pink band
  for (let dx = -4; dx <= 4; dx++) {
    px(ctx, x + dx, y - 14 + bob, 1, 1, "#FFFFFF");
  }
  for (let dx = -3; dx <= 3; dx++) {
    px(ctx, x + dx, y - 16 + bob, 1, 1, "#FFFFFF");
    px(ctx, x + dx, y - 15 + bob, 1, 1, "#FFFFFF");
  }
  for (let dx = -4; dx <= 4; dx++) {
    px(ctx, x + dx, y - 13 + bob, 1, 1, "#FF69B4");
  }
  // Held item tucked under right arm
  drawHeldItemIcon(ctx, heldItemId, x + 8, y + 2 + bob);
}

// Storefront building — draws awning + wall + door + sign at x..x+w
function drawShopFront(ctx: CanvasRenderingContext2D, shop: Shop, bx: number, bw: number, tick: number, highlighted: boolean) {
  const baseY = 76;
  const roofY = 16;
  // Wall
  for (let dy = roofY; dy < baseY; dy++) {
    for (let dx = 0; dx < bw; dx++) {
      const edge = dx === 0 || dx === bw - 1 || dy === roofY;
      px(ctx, bx + dx, dy, 1, 1, edge ? shop.accentColor : shop.wallColor);
    }
  }
  // Awning (stripes)
  for (let dx = 0; dx < bw; dx++) {
    const stripe = Math.floor(dx / 3) % 2;
    for (let dy = 0; dy < 5; dy++) {
      px(ctx, bx + dx, roofY - 5 + dy, 1, 1, stripe ? "#FFFFFF" : shop.signColor);
    }
  }
  // Sign board
  const sgnW = bw - 4;
  const sgnX = bx + 2;
  const sgnY = roofY - 11;
  for (let dx = 0; dx < sgnW; dx++) {
    for (let dy = 0; dy < 6; dy++) {
      const edge = dx === 0 || dx === sgnW - 1 || dy === 0 || dy === 5;
      px(ctx, sgnX + dx, sgnY + dy, 1, 1, edge ? "#333" : "#FFFDE8");
    }
  }
  // Short label on sign (trimmed to fit)
  const short = shop.name.split(" ")[0].toUpperCase().slice(0, 8);
  drawText(ctx, short, bx + Math.floor(bw / 2), sgnY + 3, shop.accentColor, 0.4);
  // Door (center, 8 wide, 18 tall)
  const doorW = 8;
  const doorX = bx + Math.floor((bw - doorW) / 2);
  const doorY = baseY - 20;
  for (let dy = 0; dy < 20; dy++) {
    for (let dx = 0; dx < doorW; dx++) {
      const edge = dx === 0 || dx === doorW - 1 || dy === 0;
      px(ctx, doorX + dx, doorY + dy, 1, 1, edge ? "#5A3A10" : "#A07030");
    }
  }
  // Door handle
  px(ctx, doorX + 2, doorY + 10, 1, 1, "#FFD700");
  // Window above door
  const winY = roofY + 3;
  const winW = Math.min(bw - 6, 10);
  const winX = bx + Math.floor((bw - winW) / 2);
  for (let dy = 0; dy < 6; dy++) {
    for (let dx = 0; dx < winW; dx++) {
      const edge = dx === 0 || dx === winW - 1 || dy === 0 || dy === 5;
      px(ctx, winX + dx, winY + dy, 1, 1, edge ? "#6A4A20" : "#87CEEB");
    }
  }
  // Highlight outline when selected
  if (highlighted) {
    const pulse = Math.floor(tick / 4) % 2;
    const hl = pulse ? "#FFE080" : "#FF80C0";
    for (let dx = -1; dx <= bw; dx++) {
      px(ctx, bx + dx, roofY - 6, 1, 1, hl);
      px(ctx, bx + dx, baseY, 1, 1, hl);
    }
    for (let dy = -1; dy <= baseY - roofY + 6; dy++) {
      px(ctx, bx - 1, roofY - 6 + dy, 1, 1, hl);
      px(ctx, bx + bw, roofY - 6 + dy, 1, 1, hl);
    }
  }
}

// Building layout constants so tap handlers and rendering stay in sync
const STREET_SHOP_W = 28;
const STREET_GAP = 4;
const STREET_MARGIN = 2;
const ARCADE_ROOM_W = 720;
const UNDERGROUND_W = 360;
const SHOP_ITEM_SLOT_W = 52;
const SHOP_ITEM_SLOT_H = 9;
const UNDERGROUND_CRYSTALS = [
  { id: 1, x: 54, y: 77, color: "#70FFE0" },
  { id: 2, x: 112, y: 66, color: "#B7FF9A" },
  { id: 3, x: 178, y: 80, color: "#FF70F0" },
  { id: 4, x: 246, y: 62, color: "#FFD86B" },
  { id: 5, x: 314, y: 76, color: "#A8C8FF" },
] as const;

function streetWorldWidth(shops: Shop[]): number {
  return STREET_MARGIN * 2 + shops.length * STREET_SHOP_W + (shops.length - 1) * STREET_GAP;
}

function streetCameraX(heroX: number, shops: Shop[]): number {
  const worldW = streetWorldWidth(shops);
  if (worldW <= W) return 0;
  return Math.max(0, Math.min(worldW - W, Math.floor(heroX - W / 2)));
}

function moonMazeBlocked(x: number, y: number): boolean {
  return x < 0 || y < 0 || x >= MOON_MAZE_SIZE || y >= MOON_MAZE_SIZE || MOON_MAZE_MAP[y][x] === "#";
}

function alienLadderWorldX(shops: Shop[]): number {
  return Math.max(38, streetWorldWidth(shops) - 18);
}

function shopItemDisplaySlot(index: number): { x: number; y: number; w: number; h: number } {
  return {
    x: 8 + (index % 2) * 60,
    y: 51 + Math.floor(index / 2) * 10,
    w: SHOP_ITEM_SLOT_W,
    h: SHOP_ITEM_SLOT_H,
  };
}

// Draws street backdrop with a scrolling camera when the world is wider than the viewport
function drawStreetScene(
  ctx: CanvasRenderingContext2D,
  tick: number,
  location: Location,
  shops: Shop[],
  heroX: number,
  walking: boolean,
  npcs: { x: number; spriteIdx: number; alien: boolean }[],
  highlightId: string | null,
  heldItemId: string | null,
  showAlienLadder = false,
) {
  const cameraX = streetCameraX(heroX, shops);
  // Sky
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let color;
      if (location === "alien-planet") {
        color = y < 16 ? "#0E2A3A" : y < 76 ? "#1E4A5A" : y < 80 ? "#505060" : (Math.floor(x / 6) + Math.floor(y / 4)) % 2 ? "#70C080" : "#506050";
      } else {
        color = y < 16 ? "#A0D8F0" : y < 76 ? "#CFECF8" : y < 80 ? "#606060" : (Math.floor(x / 6) + Math.floor(y / 4)) % 2 ? "#A0A0A0" : "#808080";
      }
      px(ctx, x, y, 1, 1, color);
    }
  }
  // Clouds / stars depending on location
  if (location === "alien-planet") {
    for (let i = 0; i < 20; i++) {
      const sx = (i * 13 + Math.floor(tick / 4)) % W;
      const sy = (i * 5) % 14;
      if ((Math.floor(tick / 20) + i) % 3 === 0) px(ctx, sx, sy, 1, 1, "#FFFFFF");
    }
    // Twin moons
    for (let dy = -5; dy <= 5; dy++) {
      for (let dx = -5; dx <= 5; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= 5) px(ctx, 16 + dx, 10 + dy, 1, 1, d > 4 ? "#8040A0" : "#B070C0");
        if (d <= 3) px(ctx, 112 + dx, 8 + dy, 1, 1, d > 2 ? "#C08040" : "#FFB060");
      }
    }
  } else {
    // Clouds
    const cloudXs = [10 + ((tick / 12) % 140) - 20, 70 + ((tick / 8) % 140) - 40];
    cloudXs.forEach((cxRaw) => {
      const cx = Math.floor(cxRaw);
      for (let dx = -6; dx <= 6; dx++) {
        for (let dy = -2; dy <= 1; dy++) {
          if (Math.abs(dx) + Math.abs(dy) < 7) px(ctx, cx + dx, 6 + dy, 1, 1, "#FFFFFF");
        }
      }
    });
  }

  // Buildings (world coords, shifted by camera)
  shops.forEach((shop, i) => {
    const bxWorld = STREET_MARGIN + i * (STREET_SHOP_W + STREET_GAP);
    const bx = bxWorld - cameraX;
    if (bx + STREET_SHOP_W < -4 || bx > W + 4) return; // off-screen cull
    drawShopFront(ctx, shop, bx, STREET_SHOP_W, tick, highlightId === shop.id);
  });

  // NPCs on sidewalk (world coords)
  npcs.forEach((n) => {
    const nx = Math.floor(n.x - cameraX);
    if (nx < -8 || nx > W + 8) return;
    if (n.alien) drawAlienSprite(ctx, nx, 82, n.spriteIdx, true);
    else         drawCustomerSprite(ctx, nx, 82, n.spriteIdx, true);
  });

  // Hero on sidewalk
  drawHero(ctx, Math.floor(heroX - cameraX), 82, walking, false, heldItemId);

  if (location === "alien-planet" && showAlienLadder) {
    const lx = Math.floor(alienLadderWorldX(shops) - cameraX);
    if (lx > -12 && lx < W + 12) {
      for (let dy = 0; dy < 23; dy++) {
        px(ctx, lx - 4, 76 + dy, 1, 1, "#FFD86B");
        px(ctx, lx + 4, 76 + dy, 1, 1, "#FFD86B");
        if (dy % 4 === 0) px(ctx, lx - 4, 76 + dy, 9, 1, "#70FFE0");
      }
      px(ctx, lx - 8, 72, 17, 4, "#24104A");
      drawText(ctx, "DOWN", lx, 70, "#FFD86B", 0.42);
    }
  }

  // Scroll hints when camera can scroll further
  const worldW = streetWorldWidth(shops);
  if (cameraX > 0) drawText(ctx, "\u2190", 6, 50, "#FFFFFF", 1.0);
  if (cameraX < worldW - W) drawText(ctx, "\u2192", W - 6, 50, "#FFFFFF", 1.0);

  // Street label
  drawText(ctx, location === "alien-planet" ? "ALIEN STREET" : "MAIN STREET", W / 2, 94, "#FFFFFF", 0.55);
}

function arcadeCameraX(heroX: number): number {
  return Math.max(0, Math.min(ARCADE_ROOM_W - W, Math.floor(heroX - W / 2)));
}

function drawArcadeCabinet(ctx: CanvasRenderingContext2D, cabinet: ArcadeCabinet, x: number, tick: number, selected: boolean) {
  const body = selected ? cabinet.colors.accent : cabinet.colors.body;
  const blink = Math.floor(tick / 12) % 2 === 0;
  for (let dy = 0; dy < 42; dy++) {
    for (let dx = 0; dx < 22; dx++) {
      const edge = dx === 0 || dx === 21 || dy === 0 || dy === 41;
      const marquee = dy < 6 && (dx + Math.floor(tick / 8)) % 4 < 2;
      const color = edge ? cabinet.colors.accent : marquee ? "#FFF0A0" : body;
      px(ctx, x + dx, 40 + dy, 1, 1, color);
    }
  }
  // screen
  for (let dy = 0; dy < 13; dy++) {
    for (let dx = 0; dx < 16; dx++) {
      const edge = dx === 0 || dx === 15 || dy === 0 || dy === 12;
      px(ctx, x + 3 + dx, 49 + dy, 1, 1, edge ? "#101020" : cabinet.colors.screen);
    }
  }
  px(ctx, x + 8, 67, 2, 2, blink ? "#FF70F0" : "#FFD86B");
  px(ctx, x + 13, 67, 2, 2, "#70FFE0");
  drawText(ctx, cabinet.name.split(" ")[0].toUpperCase().slice(0, 7), x + 11, 36, cabinet.colors.accent, 0.42);
}

function drawArcadeRoomScene(
  ctx: CanvasRenderingContext2D,
  tick: number,
  heroX: number,
  walking: boolean,
  previewId: ArcadeGameId | null
) {
  const cameraX = arcadeCameraX(heroX);
  // Deep neon room shell
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const checker = (Math.floor((x + cameraX) / 8) + Math.floor(y / 8)) % 2;
      const color = y < 18 ? "#120030" : y < 84 ? (checker ? "#1B0A3A" : "#24104A") : (checker ? "#31204A" : "#1A1630");
      px(ctx, x, y, 1, 1, color);
    }
  }
  // Neon ceiling rail and stars
  px(ctx, 0, 18, W, 2, "#70FFE0");
  px(ctx, 0, 84, W, 2, "#FF70F0");
  for (let i = 0; i < 22; i++) {
    const sx = (i * 23 - Math.floor(cameraX / 2) + Math.floor(tick / 3)) % W;
    const sy = 5 + (i * 7) % 28;
    px(ctx, sx, sy, 1, 1, i % 2 ? "#FFD86B" : "#70FFE0");
  }

  ALIEN_ARCADE_CABINETS.forEach((cabinet) => {
    const x = Math.floor(cabinet.x - cameraX);
    if (x < -28 || x > W + 8) return;
    const selected = previewId === cabinet.id || Math.abs(heroX - cabinet.x) < 20;
    drawArcadeCabinet(ctx, cabinet, x, tick, selected);
  });

  // Glitch, the floating host
  const hostX = Math.floor(36 - cameraX);
  if (hostX > -12 && hostX < W + 12) {
    drawAlienSprite(ctx, hostX, 78, 2, false);
    drawText(ctx, "GLITCH", hostX, 92, "#70FFE0", 0.42);
  }

  drawHero(ctx, Math.floor(heroX - cameraX), 88, walking, true, null);
  if (cameraX > 0) drawText(ctx, "\u2190", 6, 56, "#FFFFFF", 1.0);
  if (cameraX < ARCADE_ROOM_W - W) drawText(ctx, "\u2192", W - 6, 56, "#FFFFFF", 1.0);
  drawText(ctx, "GLITCH GALAXY ARCADE", W / 2, 102, "#FFD86B", 0.55);
}

function drawMeteorMeltdownScene(ctx: CanvasRenderingContext2D, tick: number, game: MeteorMeltdownState | null) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const band = Math.floor((y + tick) / 8) % 2;
      px(ctx, x, y, 1, 1, y < 86 ? (band ? "#140824" : "#201040") : "#382048");
    }
  }
  for (let i = 0; i < 26; i++) {
    const sx = (i * 17 + tick) % W;
    const sy = 4 + (i * 11) % 50;
    px(ctx, sx, sy, 1, 1, i % 3 ? "#FFE080" : "#70FFE0");
  }

  px(ctx, 0, 86, W, 2, "#FF8050");
  for (let x = 0; x < W; x++) {
    const check = (Math.floor(x / 6) + Math.floor(tick / 6)) % 2;
    px(ctx, x, 88, 1, H - 88, check ? "#3A2038" : "#241428");
  }

  // Laser cannon
  const cannonX = W / 2;
  px(ctx, cannonX - 10, 94, 20, 5, "#70FFE0");
  px(ctx, cannonX - 4, 87, 8, 8, "#FFD86B");
  px(ctx, cannonX - 2, 84, 4, 4, "#FF70F0");

  game?.meteors.forEach((m) => {
    const flame = Math.floor(tick / 4) % 2;
    for (let dy = -m.size; dy <= m.size; dy++) {
      for (let dx = -m.size; dx <= m.size; dx++) {
        if (dx * dx + dy * dy <= m.size * m.size) {
          const edge = Math.abs(dx) + Math.abs(dy) > m.size;
          px(ctx, Math.floor(m.x + dx), Math.floor(m.y + dy), 1, 1, edge ? "#FFE080" : m.color);
        }
      }
    }
    px(ctx, Math.floor(m.x - 1), Math.floor(m.y - m.size - 2 - flame), 3, 2, "#FFB040");
  });

  if (game) {
    drawText(ctx, `METEORS ${game.score}`, 28, 8, "#FFE080", 0.55);
    drawText(ctx, `${Math.ceil(game.timeLeft / 1000)}s`, W / 2, 8, "#70FFE0", 0.55);
    drawText(ctx, `LIVES ${game.lives}`, W - 26, 8, "#FFB0CB", 0.55);
    if (game.phase === "done") {
      drawText(ctx, game.message, W / 2, H / 2 - 4, "#FFD86B", 0.75);
      drawText(ctx, "RESULTS BELOW", W / 2, H / 2 + 8, "#70FFE0", 0.5);
    } else {
      drawText(ctx, "TAP METEORS", W / 2, 102, "#FFFFFF", 0.52);
    }
  }
}

function drawSlimeSimonScene(ctx: CanvasRenderingContext2D, tick: number, game: SlimeSimonState | null) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const glow = (Math.floor(x / 10) + Math.floor(y / 8) + Math.floor(tick / 12)) % 2;
      px(ctx, x, y, 1, 1, y < 22 ? "#102818" : glow ? "#183820" : "#102018");
    }
  }
  px(ctx, 0, 22, W, 2, "#78F060");
  px(ctx, 0, 96, W, 2, "#B7FF9A");
  drawText(ctx, "SLIME SIMON", W / 2, 10, "#B7FF9A", 0.75);
  drawText(ctx, game ? `ROUND ${game.round}  SCORE ${game.score}` : "READY", W / 2, 18, "#FFE080", 0.45);

  SLIME_SIMON_PADS.forEach((pad, i) => {
    const lit = game?.flashIdx === i;
    const radius = lit ? 15 : 13;
    const bob = Math.floor(Math.sin((tick + i * 5) / 7) * 1);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const dist = (dx * dx) / 1.4 + dy * dy;
        if (dist <= radius * radius) {
          const edge = dist > (radius - 2) * (radius - 2);
          px(ctx, pad.x + dx, pad.y + dy + bob, 1, 1, lit ? "#FFFFFF" : edge ? pad.accent : pad.color);
        }
      }
    }
    px(ctx, pad.x - 4, pad.y - 3 + bob, 3, 3, "#102018");
    px(ctx, pad.x + 2, pad.y - 3 + bob, 3, 3, "#102018");
    px(ctx, pad.x - 2, pad.y + 4 + bob, 5, 1, pad.accent);
    drawText(ctx, `${i + 1}`, pad.x, pad.y + 18, "#FFFFFF", 0.48);
  });

  if (game) {
    const color = game.phase === "done" ? "#FFD86B" : game.phase === "play" ? "#FFFFFF" : "#B7FF9A";
    drawText(ctx, game.message, W / 2, 104, color, 0.55);
  }
}

function drawMoonMazeScene(ctx: CanvasRenderingContext2D, tick: number, game: MoonMazeState | null) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const crater = (Math.floor(x / 9) + Math.floor((y + tick / 3) / 9)) % 2;
      px(ctx, x, y, 1, 1, y < 12 ? "#071024" : crater ? "#172648" : "#20345E");
    }
  }
  for (let i = 0; i < 22; i++) {
    const sx = (i * 19 + Math.floor(tick / 2)) % W;
    const sy = 3 + (i * 7) % 28;
    px(ctx, sx, sy, 1, 1, i % 2 ? "#E8F0FF" : "#A8C8FF");
  }
  drawText(ctx, "MOON MAZE", W / 2, 10, "#DDEBFF", 0.55);

  for (let gy = 0; gy < MOON_MAZE_SIZE; gy++) {
    for (let gx = 0; gx < MOON_MAZE_SIZE; gx++) {
      const x = MOON_MAZE_ORIGIN.x + gx * MOON_MAZE_CELL;
      const y = MOON_MAZE_ORIGIN.y + gy * MOON_MAZE_CELL;
      const wall = MOON_MAZE_MAP[gy][gx] === "#";
      px(ctx, x, y, MOON_MAZE_CELL - 1, MOON_MAZE_CELL - 1, wall ? "#A8C8FF" : "#101A34");
      if (!wall && (gx + gy + Math.floor(tick / 12)) % 5 === 0) px(ctx, x + 4, y + 4, 2, 2, "#FFD86B");
    }
  }

  const exit = game?.exit ?? MOON_MAZE_EXIT;
  const ex = MOON_MAZE_ORIGIN.x + exit.x * MOON_MAZE_CELL;
  const ey = MOON_MAZE_ORIGIN.y + exit.y * MOON_MAZE_CELL;
  px(ctx, ex + 2, ey + 2, 6, 6, "#70FFE0");
  drawText(ctx, "EXIT", ex + 5, ey + 13, "#70FFE0", 0.32);

  game?.enemies.forEach((enemy, idx) => {
    const x = MOON_MAZE_ORIGIN.x + enemy.x * MOON_MAZE_CELL + 5;
    const y = MOON_MAZE_ORIGIN.y + enemy.y * MOON_MAZE_CELL + 5;
    px(ctx, x - 3, y - 2, 7, 5, idx % 2 ? "#FF70F0" : "#B7FF9A");
    px(ctx, x - 1, y - 4 + (tick % 8 < 4 ? 0 : 1), 3, 2, "#FFFFFF");
  });

  if (game) {
    const px0 = MOON_MAZE_ORIGIN.x + game.player.x * MOON_MAZE_CELL + 5;
    const py0 = MOON_MAZE_ORIGIN.y + game.player.y * MOON_MAZE_CELL + 5;
    px(ctx, px0 - 3, py0 - 2, 7, 5, "#FFD86B");
    px(ctx, px0 - 1, py0 - 5, 3, 3, "#70FFE0");
    drawText(ctx, `${game.moves} MOVES`, 24, 104, "#FFD86B", 0.45);
    drawText(ctx, game.message, W / 2, 104, game.phase === "lost" ? "#FF70A6" : "#DDEBFF", 0.45);
  }
}

function drawUfoClawScene(ctx: CanvasRenderingContext2D, tick: number, game: UfoClawState | null) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const color = y < 20 ? "#120824" : y < 82 ? "#24104A" : "#3A2030";
      px(ctx, x, y, 1, 1, color);
    }
  }
  drawText(ctx, "UFO CLAW", W / 2, 10, "#FFD86B", 0.6);
  px(ctx, 12, 24, W - 24, 56, "#100820");
  px(ctx, 14, 26, W - 28, 52, "#1E1538");
  px(ctx, 18, 80, W - 36, 8, "#FFD86B");
  px(ctx, 46, 18, 36, 4, "#70FFE0");

  if (game) {
    const prizeX = Math.floor(game.prizeX);
    const bob = Math.floor(Math.sin(tick / 6) * 2);
    px(ctx, prizeX - 7, 62 + bob, 14, 8, game.prize.rarity === "rare" ? "#FFD86B" : game.prize.rarity === "uncommon" ? "#70FFE0" : "#FFB0CB");
    drawText(ctx, game.prize.emoji, prizeX, 67 + bob, "#FFFFFF", 0.52);
    const clawX = Math.floor(game.clawX);
    const clawY = Math.floor(game.clawY);
    px(ctx, clawX, 22, 1, Math.max(0, clawY - 22), "#DDEBFF");
    px(ctx, clawX - 6, clawY, 13, 2, "#DDEBFF");
    px(ctx, clawX - 6, clawY + 2, 2, 8, "#DDEBFF");
    px(ctx, clawX + 5, clawY + 2, 2, 8, "#DDEBFF");
    drawText(ctx, game.message, W / 2, 102, game.won ? "#B7FF9A" : "#FFFFFF", 0.45);
  }
}

function drawPixelRiftScene(ctx: CanvasRenderingContext2D, tick: number, game: PixelRiftState | null) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const glitch = (Math.floor((x + tick) / 7) + Math.floor(y / 5)) % 3;
      px(ctx, x, y, 1, 1, glitch === 0 ? "#120030" : glitch === 1 ? "#24104A" : "#081C28");
    }
  }
  drawText(ctx, "PIXEL RIFT", W / 2, 10, "#70FFE0", 0.6);
  PIXEL_RIFT_LANES.forEach((lane, idx) => {
    const x = 18 + idx * 36;
    const active = game?.phase === "play" && game.targetLane === idx;
    px(ctx, x, 32, 28, 42, active ? lane.color : "#140820");
    px(ctx, x + 2, 34, 24, 38, active ? "#FFF0FF" : lane.accent);
    for (let i = 0; i < 8; i++) {
      const bitX = x + 5 + ((i * 7 + tick) % 18);
      const bitY = 38 + ((i * 11 + tick * (idx + 1)) % 28);
      px(ctx, bitX, bitY, 2, 2, active ? lane.accent : lane.color);
    }
    drawText(ctx, lane.label, x + 14, 83, active ? "#FFD86B" : lane.color, 0.36);
  });
  if (game) {
    drawText(ctx, `SCORE ${game.score}`, 28, 101, "#FFD86B", 0.45);
    drawText(ctx, `${Math.ceil(game.timeLeft / 1000)}s`, W - 20, 101, "#70FFE0", 0.45);
    drawText(ctx, game.message, W / 2, 20, game.phase === "done" ? "#FFD86B" : "#FFFFFF", 0.45);
  }
}

function undergroundCameraX(heroX: number): number {
  return Math.max(0, Math.min(UNDERGROUND_W - W, Math.floor(heroX - W / 2)));
}

function drawAlienUndergroundScene(
  ctx: CanvasRenderingContext2D,
  tick: number,
  heroX: number,
  walking: boolean,
  collectedCrystalIds: number[],
  shardCount: number,
) {
  const cameraX = undergroundCameraX(heroX);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const worldX = x + cameraX;
      const strata = Math.floor((worldX + y * 2) / 12) % 3;
      const color = y < 18 ? "#120820" : strata === 0 ? "#1B1838" : strata === 1 ? "#142C34" : "#24143A";
      px(ctx, x, y, 1, 1, color);
    }
  }
  px(ctx, 0, 18, W, 2, "#70FFE0");
  px(ctx, 0, 88, W, 2, "#B7FF9A");

  // Ladder back to the surface
  const ladderX = Math.floor(18 - cameraX);
  if (ladderX > -10 && ladderX < W + 10) {
    for (let dy = 0; dy < 66; dy++) {
      px(ctx, ladderX - 4, 22 + dy, 1, 1, "#FFD86B");
      px(ctx, ladderX + 4, 22 + dy, 1, 1, "#FFD86B");
      if (dy % 5 === 0) px(ctx, ladderX - 4, 22 + dy, 9, 1, "#70FFE0");
    }
    drawText(ctx, "UP", ladderX, 14, "#FFD86B", 0.55);
  }

  // Mushrooms and crystal clusters
  for (let i = 0; i < 18; i++) {
    const mx = Math.floor(i * 23 + 28 - cameraX);
    const my = 92 - (i % 3) * 4;
    if (mx < -8 || mx > W + 8) continue;
    px(ctx, mx - 1, my - 5, 2, 6, "#C8F7C5");
    px(ctx, mx - 4, my - 8, 8, 4, i % 2 ? "#FF70F0" : "#70FFE0");
    px(ctx, mx - 2, my - 9, 4, 1, "#FFFFFF");
  }

  UNDERGROUND_CRYSTALS.forEach((crystal) => {
    if (collectedCrystalIds.includes(crystal.id)) return;
    const cx = Math.floor(crystal.x - cameraX);
    if (cx < -10 || cx > W + 10) return;
    const pulse = Math.floor(Math.sin((tick + crystal.id * 7) / 6) * 1);
    for (let dy = -7; dy <= 7; dy++) {
      const half = Math.max(1, 5 - Math.floor(Math.abs(dy) / 2));
      for (let dx = -half; dx <= half; dx++) {
        const edge = Math.abs(dx) === half;
        px(ctx, cx + dx, crystal.y + dy + pulse, 1, 1, edge ? "#FFFFFF" : crystal.color);
      }
    }
  });

  drawAlienSprite(ctx, Math.floor(heroX - cameraX), 84, 1, walking);
  if (cameraX > 0) drawText(ctx, "\u2190", 6, 50, "#FFFFFF", 1.0);
  if (cameraX < UNDERGROUND_W - W) drawText(ctx, "\u2192", W - 6, 50, "#FFFFFF", 1.0);
  drawText(ctx, `GLOW CAVERN  ${shardCount}`, W / 2, 104, "#B7FF9A", 0.55);
}

function drawShipInteriorScene(ctx: CanvasRenderingContext2D, tick: number, room: ShipRoom, message: ShipRoomMessage | null) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const rib = Math.floor((x + tick / 4) / 10) % 2;
      const color = y < 18 ? "#081830" : y < 88 ? (rib ? "#142C48" : "#102038") : "#1C1C30";
      px(ctx, x, y, 1, 1, color);
    }
  }
  px(ctx, 0, 18, W, 2, "#80C0FF");
  px(ctx, 0, 88, W, 2, "#FFD86B");
  drawText(ctx, room.name.toUpperCase(), W / 2, 10, "#FFD86B", 0.7);

  // Windows
  for (let i = 0; i < 3; i++) {
    const wx = 20 + i * 36;
    for (let dy = 0; dy < 15; dy++) {
      for (let dx = 0; dx < 22; dx++) {
        const edge = dx === 0 || dx === 21 || dy === 0 || dy === 14;
        const star = !edge && ((dx * 3 + dy * 5 + tick + i) % 17 === 0);
        px(ctx, wx + dx, 28 + dy, 1, 1, edge ? "#80C0FF" : star ? "#FFFFFF" : "#080018");
      }
    }
  }

  if (room.id === "cockpit") {
    px(ctx, 48, 58, 32, 14, "#203860");
    px(ctx, 52, 60, 24, 8, "#70FFE0");
    drawText(ctx, "MAP", 64, 64, "#102038", 0.55);
    px(ctx, 86, 57, 14, 10, "#203860");
    px(ctx, 90, 60, 6, 4, tick % 20 < 10 ? "#FFD86B" : "#FF70F0");
  } else if (room.id === "galley") {
    drawCone(ctx, 64, 68, [FLAVORS[0], FLAVORS[3]], [], 0);
    px(ctx, 86, 58, 26, 12, "#203860");
    drawText(ctx, "MIX", 99, 64, "#70FFE0", 0.45);
  } else if (room.id === "cargo") {
    for (let i = 0; i < 4; i++) {
      px(ctx, 32 + i * 16, 62, 12, 12, i % 2 ? "#A8C8FF" : "#FFD86B");
      px(ctx, 32 + i * 16, 62, 12, 1, "#FFFFFF");
    }
  } else if (room.id === "engine") {
    const pulse = Math.floor(tick / 5) % 2;
    px(ctx, 52, 48, 24, 28, "#303050");
    px(ctx, 58, 54, 12, 16, pulse ? "#FF70F0" : "#70FFE0");
  } else {
    drawAlienSprite(ctx, 64, 70, 4, false);
    drawText(ctx, "Zzz", 82, 52, "#B8E0FF", 0.55);
  }

  drawHero(ctx, 20, 82, false, false, null);
  drawFlyingSaucer(ctx, 110, 86, tick);
  if (message) {
    for (let dx = 0; dx < 96; dx++) {
      for (let dy = 0; dy < 14; dy++) {
        const edge = dx === 0 || dx === 95 || dy === 0 || dy === 13;
        px(ctx, 16 + dx, 92 + dy, 1, 1, edge ? "#80C0FF" : "#081020");
      }
    }
    drawText(ctx, message.title.toUpperCase().slice(0, 16), W / 2, 96, "#FFD86B", 0.45);
    drawText(ctx, message.body.toUpperCase().slice(0, 28), W / 2, 102, "#F8F8FF", 0.38);
  }
}

function drawSpaceMapScene(ctx: CanvasRenderingContext2D, tick: number, selectedId: SpaceDestinationId | null, unlockFlags: UnlockFlags) {
  drawSpaceScene(ctx, tick, "out");
  drawText(ctx, "SPACE MAP", W / 2, 10, "#FFE080", 0.8);
  SPACE_DESTINATIONS.forEach((dest) => {
    const unlocked = dest.unlocked || !dest.unlockFlag || unlockFlags[dest.unlockFlag];
    const selected = selectedId === dest.id;
    const pulse = selected ? Math.floor(Math.sin(tick / 5) * 1) : 0;
    const color = unlocked ? (selected ? "#FFFFFF" : "#80E0FF") : "#606080";
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy <= 16) px(ctx, dest.x + dx, dest.y + dy + pulse, 1, 1, color);
      }
    }
    if (!unlocked) drawText(ctx, "x", dest.x, dest.y + pulse, "#202030", 0.45);
  });
  drawText(ctx, "TAP A DOT", W / 2, 104, "#FFFFFF", 0.5);
}

// Shop interior — draws owner behind counter and shop-themed backdrop
function drawShopInterior(ctx: CanvasRenderingContext2D, shop: Shop, tick: number) {
  // Wall
  for (let y = 0; y < 70; y++) {
    for (let x = 0; x < W; x++) {
      const stripe = Math.floor(y / 10) % 2;
      px(ctx, x, y, 1, 1, stripe ? shop.wallColor : lightenColor(shop.wallColor, -15));
    }
  }
  // Awning
  for (let x = 0; x < W; x++) {
    const stripe = Math.floor(x / 5) % 2;
    for (let y = 0; y < 6; y++) {
      px(ctx, x, y, 1, 1, stripe ? "#FFFFFF" : shop.signColor);
    }
  }
  // Sign
  drawText(ctx, shop.name.toUpperCase(), W / 2, 13, shop.accentColor, 0.75);

  // Counter
  for (let x = 0; x < W; x++) {
    px(ctx, x, 70, 1, 1, shop.accentColor);
    px(ctx, x, 71, 1, 1, lightenColor(shop.accentColor, -20));
    px(ctx, x, 72, 1, 1, lightenColor(shop.accentColor, -40));
  }

  // Display shelves. The same slots are used by canvas tap handling.
  shop.items.forEach((item, i) => {
    const slot = shopItemDisplaySlot(i);
    for (let dy = 0; dy < slot.h; dy++) {
      for (let dx = 0; dx < slot.w; dx++) {
        const edge = dx === 0 || dx === slot.w - 1 || dy === 0 || dy === slot.h - 1;
        px(ctx, slot.x + dx, slot.y + dy, 1, 1, edge ? "#333" : "#FFF");
      }
    }
    const shortName = item.name.split(" ")[0].toUpperCase().slice(0, 8);
    drawText(ctx, shortName, slot.x + slot.w / 2, slot.y + 3, shop.accentColor, 0.38);
    drawText(ctx, `${item.price}G`, slot.x + slot.w / 2, slot.y + 7, "#333", 0.38);
  });

  // Floor
  for (let y = 73; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const check = (Math.floor(x / 6) + Math.floor(y / 4)) % 2;
      px(ctx, x, y, 1, 1, check ? "#D0D0D0" : "#B8B8B8");
    }
  }

  // Owner sprite (alien or human customer-style)
  if (shop.location === "alien-planet") {
    drawAlienSprite(ctx, 64, 60, 2, false);
  } else {
    drawCustomerSprite(ctx, 64, 60, 4, false);
  }

  // Bouncing "!" above owner when idle
  const bounce = Math.floor(Math.sin(tick / 8) * 2);
  drawText(ctx, "\u2728", 64, 44 + bounce, shop.accentColor, 0.7);

  // Door back to street on the right
  const dx0 = W - 18;
  for (let dy = 20; dy < 70; dy++) {
    for (let ddx = 0; ddx < 14; ddx++) {
      const isBorder = ddx === 0 || ddx === 13 || dy === 20;
      px(ctx, dx0 + ddx, dy, 1, 1, isBorder ? "#5A3A10" : "#A07030");
    }
  }
  drawText(ctx, "EXIT", dx0 + 7, 42, "#FFFF80", 0.55);
  px(ctx, dx0 + 3, 50, 2, 2, "#FFD700");
}

// ── Pilot Minigame Drawing ───────────────────────────────────────────────────

function drawPilotSaucer(ctx: CanvasRenderingContext2D, cx: number, cy: number, tick: number, invulnerable: boolean) {
  // Flash effect during invuln
  if (invulnerable && Math.floor(tick / 3) % 2 === 0) {
    ctx.globalAlpha = 0.4;
  }
  // Thruster flames below
  const flameLen = 2 + (tick % 4);
  for (let i = 0; i < 3; i++) {
    const fx = cx - 4 + i * 4;
    for (let fy = 0; fy < flameLen; fy++) {
      const color = fy < flameLen - 1 ? "#FFE080" : "#FF8040";
      px(ctx, fx, cy + 3 + fy, 1, 1, color);
    }
  }
  drawFlyingSaucer(ctx, cx, cy, tick);
  ctx.globalAlpha = 1;
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  const { x, y, size } = a;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  // Jagged rock shape
  for (let dy = -size; dy <= size; dy++) {
    for (let dx = -size; dx <= size; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= size) {
        const jitter = ((cx + dy) * 7 + (cy + dx) * 13) % 4;
        const r = d + jitter * 0.4;
        if (r > size) continue;
        const edge = r > size - 1.5;
        const crater = ((cx + dx) * 5 + (cy + dy) * 9) % 11 === 0 && d < size - 2;
        px(ctx, cx + dx, cy + dy, 1, 1,
          edge ? "#403020" : crater ? "#20180E" : "#70503A");
      }
    }
  }
  // Highlight
  px(ctx, cx - Math.floor(size / 2), cy - Math.floor(size / 2), 1, 1, "#A07050");
}

function drawLaser(ctx: CanvasRenderingContext2D, l: Laser) {
  const x = Math.floor(l.x);
  const y = Math.floor(l.y);
  px(ctx, x, y, 1, 5, "#FFFFFF");
  px(ctx, x - 1, y + 1, 1, 3, "#80FF80");
  px(ctx, x + 1, y + 1, 1, 3, "#80FF80");
  px(ctx, x, y, 1, 1, "#FFFF80");
}

function drawPilotScene(ctx: CanvasRenderingContext2D, ship: {x:number; y:number}, asteroids: Asteroid[], lasers: Laser[], tick: number, invuln: boolean, hits: number, lives: number) {
  drawSpaceScene(ctx, tick, "out");
  asteroids.forEach((a) => drawAsteroid(ctx, a));
  lasers.forEach((l) => drawLaser(ctx, l));
  drawPilotSaucer(ctx, ship.x, ship.y, tick, invuln);

  // HUD strip at top
  drawText(ctx, `HITS ${hits}`, 24, 12, "#FFFFFF", 0.6);
  // Lives as small hearts on the right
  for (let i = 0; i < lives; i++) {
    const lx = W - 18 + i * 5;
    px(ctx, lx, 10, 2, 2, "#FF4444");
    px(ctx, lx + 2, 10, 2, 2, "#FF4444");
    px(ctx, lx + 1, 12, 2, 2, "#FF4444");
  }
}

// ── Black Hole Drawing ───────────────────────────────────────────────────────

// Fills entire canvas with swirling spiral gravity wells
function drawBlackHoleInterior(ctx: CanvasRenderingContext2D, tick: number, intensity: number) {
  // base void
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      px(ctx, x, y, 1, 1, "#050010");
    }
  }
  // Concentric spiral arcs
  const cx = W / 2;
  const cy = H / 2;
  const palette = ["#1A0033", "#3A0055", "#6020A0", "#A050E0", "#E080FF", "#FFD0FF"];
  for (let r = 2; r < 90; r += 1) {
    const circumference = Math.max(6, Math.floor(r * 2 * Math.PI));
    for (let i = 0; i < circumference; i++) {
      const angle = (i / circumference) * Math.PI * 2 + tick / 30 + r / 8;
      const x0 = cx + Math.cos(angle) * r;
      const y0 = cy + Math.sin(angle) * r * 0.85;
      if (x0 < 0 || x0 >= W || y0 < 0 || y0 >= H) continue;
      // spiral stripe pattern
      const stripe = Math.floor((angle * 6 + tick / 5) % palette.length);
      if (stripe >= 0 && Math.random() > 0.3 - intensity * 0.1) {
        px(ctx, Math.floor(x0), Math.floor(y0), 1, 1, palette[Math.max(0, Math.min(palette.length - 1, stripe))]);
      }
    }
  }
  // Central singularity (darkest)
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 6) px(ctx, cx + dx, cy + dy, 1, 1, d > 5 ? "#20003A" : "#000000");
    }
  }
}

function drawBlackHolePullIn(ctx: CanvasRenderingContext2D, tick: number) {
  // Progressive pull: space with growing spiral, saucer stretching inward
  const progress = Math.min(1, tick / 100); // 0..1
  // Base: scrolling stars
  drawSpaceScene(ctx, tick, "out");
  // Overlay: growing dark spiral
  const cx = W / 2;
  const cy = H / 2;
  const maxR = 10 + progress * 80;
  for (let r = 1; r < maxR; r += 1) {
    const circ = Math.max(6, Math.floor(r * 2 * Math.PI));
    for (let i = 0; i < circ; i++) {
      const angle = (i / circ) * Math.PI * 2 + tick / 10 + r / 5;
      const x0 = Math.floor(cx + Math.cos(angle) * r);
      const y0 = Math.floor(cy + Math.sin(angle) * r * 0.85);
      if (x0 < 0 || x0 >= W || y0 < 0 || y0 >= H) continue;
      const alpha = Math.min(1, progress * 1.5 + (maxR - r) / maxR);
      if (Math.random() < alpha * 0.6) {
        const c = r < 10 ? "#000000" : r < 30 ? "#1A0033" : "#6020A0";
        px(ctx, x0, y0, 1, 1, c);
      }
    }
  }
  // Saucer being stretched toward center
  const saucerX = Math.floor(cx + Math.cos(tick / 8) * (30 - progress * 28));
  const saucerY = Math.floor(cy + Math.sin(tick / 8) * (20 - progress * 18));
  const stretch = 1 - progress;
  if (stretch > 0.1) {
    drawFlyingSaucer(ctx, saucerX, saucerY, tick);
  }
  // Warning text
  if (tick < 30) {
    drawText(ctx, "BLACK HOLE!", W / 2, 20, "#FF4040", 1.0);
  } else if (tick < 70) {
    drawText(ctx, "PULLED IN!", W / 2, 20, "#FF80FF", 0.9);
  }
}

function drawDimensionFork(ctx: CanvasRenderingContext2D, tick: number) {
  drawBlackHoleInterior(ctx, tick, 0.4);
  // Three glowing doorways
  const doorDefs = [
    { x: 22, color: "#80D0FF", label: "MIRRORS" },
    { x: 64, color: "#FFD060", label: "CLOCKS" },
    { x: 106, color: "#80FFA0", label: "BOOKS" },
  ];
  doorDefs.forEach((d, i) => {
    const glow = Math.floor(Math.sin(tick / 10 + i) * 1) + 1;
    // Door frame
    for (let dy = 0; dy < 40; dy++) {
      for (let dx = -8 - glow; dx <= 8 + glow; dx++) {
        const edge = Math.abs(dx) >= 8 + glow - 1 || dy <= 1 || dy >= 38;
        if (edge) {
          px(ctx, d.x + dx, 40 + dy, 1, 1, d.color);
        } else if (Math.abs(dx) >= 8) {
          // side pillar
          px(ctx, d.x + dx, 40 + dy, 1, 1, "#202050");
        } else {
          // inside of doorway: shimmer
          const shimmer = ((dy + Math.floor(tick / 3)) + Math.abs(dx)) % 5;
          px(ctx, d.x + dx, 40 + dy, 1, 1,
            shimmer === 0 ? d.color : shimmer === 1 ? "#FFFFFF" : "#101030");
        }
      }
    }
    // Label below
    drawText(ctx, d.label, d.x, 88, d.color, 0.6);
  });
  drawText(ctx, "CHOOSE A DOOR", W / 2, 14, "#FFFFFF", 0.8);
}

function drawMirrorYou(ctx: CanvasRenderingContext2D, tick: number) {
  drawBlackHoleInterior(ctx, tick, 0.25);
  // Left: present-you (Scoopy)
  drawShopkeeper(ctx, 32, 72);
  // Right: future-you (shimmering duplicate, flipped via slight offset)
  const flicker = Math.floor(Math.sin(tick / 4) * 2);
  ctx.globalAlpha = 0.85;
  drawShopkeeper(ctx, 96, 72);
  ctx.globalAlpha = 1;
  // Crown/halo on future self
  for (let dx = -5; dx <= 5; dx++) {
    px(ctx, 96 + dx, 52 + flicker, 1, 1, "#FFD700");
  }
  px(ctx, 93, 50 + flicker, 2, 2, "#FFD700");
  px(ctx, 99, 50 + flicker, 2, 2, "#FFD700");
  // Shimmer particles between them
  for (let i = 0; i < 8; i++) {
    const px0 = 40 + ((tick * 2 + i * 8) % 48);
    const py0 = 50 + Math.floor(Math.sin((tick + i * 5) / 6) * 6);
    px(ctx, px0, py0, 1, 1, i % 2 ? "#FFFFFF" : "#FFD0FF");
  }
  drawText(ctx, "HALL OF MIRRORS", W / 2, 14, "#FFD0FF", 0.7);
}

function drawClockNebula(ctx: CanvasRenderingContext2D, tick: number) {
  drawBlackHoleInterior(ctx, tick, 0.3);
  // Multiple floating clocks
  const clocks = [
    { cx: 30, cy: 42, r: 8, speed: -1 },
    { cx: 96, cy: 36, r: 6, speed: -2 },
    { cx: 64, cy: 68, r: 10, speed: -1.5 },
    { cx: 22, cy: 75, r: 5, speed: 1 },
    { cx: 108, cy: 72, r: 5, speed: 2 },
  ];
  clocks.forEach((c, i) => {
    // Face
    for (let dy = -c.r; dy <= c.r; dy++) {
      for (let dx = -c.r; dx <= c.r; dx++) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= c.r) {
          const edge = d > c.r - 1;
          px(ctx, c.cx + dx, c.cy + dy, 1, 1, edge ? "#C0A040" : i === 2 ? "#FFF5D6" : "#E8DCB0");
        }
      }
    }
    // Hour/minute hand ticking BACKWARDS
    const hour = -((tick * c.speed) / 40) + i;
    const hx = Math.cos(hour) * (c.r - 2);
    const hy = Math.sin(hour) * (c.r - 2);
    px(ctx, c.cx, c.cy, 1, 1, "#000");
    for (let s = 1; s <= c.r - 2; s++) {
      px(ctx, Math.floor(c.cx + (hx * s) / (c.r - 2)), Math.floor(c.cy + (hy * s) / (c.r - 2)), 1, 1, "#200");
    }
    const min = -((tick * c.speed) / 15) + i;
    const mx = Math.cos(min) * (c.r - 1);
    const my = Math.sin(min) * (c.r - 1);
    for (let s = 1; s <= c.r - 1; s++) {
      px(ctx, Math.floor(c.cx + (mx * s) / (c.r - 1)), Math.floor(c.cy + (my * s) / (c.r - 1)), 1, 1, "#400");
    }
    // Glow on "special" clock (index 2)
    if (i === 2) {
      for (let dy = -c.r - 2; dy <= c.r + 2; dy++) {
        for (let dx = -c.r - 2; dx <= c.r + 2; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > c.r && d < c.r + 2 && ((tick + dx) % 3 === 0)) {
            px(ctx, c.cx + dx, c.cy + dy, 1, 1, "#FFFF80");
          }
        }
      }
    }
  });
  drawText(ctx, "CLOCK NEBULA", W / 2, 14, "#FFE880", 0.7);
}

function drawInfiniteLibrary(ctx: CanvasRenderingContext2D, tick: number) {
  drawBlackHoleInterior(ctx, tick, 0.2);
  // Receding stacks of books - perspective lines
  for (let depth = 0; depth < 7; depth++) {
    const y0 = 25 + depth * 8;
    const shrink = depth * 2;
    const color = depth === 3 ? "#FFD060" : depth % 2 ? "#80A0FF" : "#FF80A0";
    for (let x = shrink; x < W - shrink; x++) {
      // shelf line
      px(ctx, x, y0 + 6, 1, 1, "#604020");
      // books on shelf
      if (x % 4 < 3) {
        for (let dy = 0; dy < 5; dy++) {
          px(ctx, x, y0 + dy, 1, 1, color);
        }
      }
    }
  }
  // Floating open book in center
  const bookY = 50 + Math.floor(Math.sin(tick / 10) * 2);
  for (let dy = 0; dy < 10; dy++) {
    for (let dx = -10; dx <= 10; dx++) {
      const color = Math.abs(dx) < 1 ? "#604020" : dx < 0 ? "#FFF5D6" : "#FFF0C0";
      px(ctx, 64 + dx, bookY + dy, 1, 1, color);
    }
  }
  // Text lines on pages
  for (let ly = 0; ly < 3; ly++) {
    for (let lx = -8; lx <= -2; lx++) {
      if (lx % 2 === 0) px(ctx, 64 + lx, bookY + 2 + ly * 3, 1, 1, "#404040");
    }
    for (let lx = 2; lx <= 8; lx++) {
      if (lx % 2 === 0) px(ctx, 64 + lx, bookY + 2 + ly * 3, 1, 1, "#404040");
    }
  }
  drawText(ctx, "INFINITE LIBRARY", W / 2, 14, "#FFE0C0", 0.7);
}

function drawExitPortal(ctx: CanvasRenderingContext2D, tick: number) {
  drawBlackHoleInterior(ctx, tick, 0.4);
  // White hole bloom in center
  const cx = W / 2;
  const cy = H / 2 + 4;
  const pulse = Math.sin(tick / 6) * 3 + 20;
  for (let r = 0; r < pulse + 8; r += 1) {
    const circ = Math.max(6, Math.floor(r * 2 * Math.PI));
    for (let i = 0; i < circ; i++) {
      const angle = (i / circ) * Math.PI * 2;
      const x0 = Math.floor(cx + Math.cos(angle) * r);
      const y0 = Math.floor(cy + Math.sin(angle) * r * 0.9);
      if (x0 < 0 || x0 >= W || y0 < 0 || y0 >= H) continue;
      let c = "#FFFFFF";
      if (r > pulse) c = "#FFFFE0";
      if (r > pulse + 3) c = "#FFE080";
      if (r > pulse + 6) continue;
      if (Math.random() < 0.7) px(ctx, x0, y0, 1, 1, c);
    }
  }
  drawText(ctx, "THE WAY OUT", W / 2, 14, "#FFFFFF", 0.85);
  drawText(ctx, "dive in?", W / 2, H - 12, "#FFFFE0", 0.7);
}

// Prehistoric Earth backdrop — orange sky, volcanic silhouette, jungle ground
function drawDinoBackdrop(ctx: CanvasRenderingContext2D, tick: number) {
  // Sky — orange/red gradient with sun
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (y < 14) {
        px(ctx, x, y, 1, 1, "#5A1820");
      } else if (y < 30) {
        px(ctx, x, y, 1, 1, "#A03020");
      } else if (y < 56) {
        px(ctx, x, y, 1, 1, "#E06020");
      } else if (y < 70) {
        px(ctx, x, y, 1, 1, "#B08030");
      } else {
        const stripe = (Math.floor(x / 5) + Math.floor(y / 3)) % 2;
        px(ctx, x, y, 1, 1, stripe ? "#4A6018" : "#2E3E10");
      }
    }
  }
  // Distant sun (large, bleary)
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= 5) px(ctx, 100 + dx, 28 + dy, 1, 1, d > 4 ? "#FFD060" : "#FFFFA0");
    }
  }
  // Volcano silhouette
  for (let x = 10; x < 50; x++) {
    const h = Math.max(0, 18 - Math.abs(x - 30));
    for (let y = 0; y < h; y++) {
      px(ctx, x, 56 - y, 1, 1, y < 3 ? "#FF8030" : "#2A1008");
    }
  }
  // Ash plume
  for (let i = 0; i < 6; i++) {
    const ax = 30 + Math.floor(Math.sin((tick + i * 4) / 8) * 3);
    const ay = 34 - i * 2;
    px(ctx, ax, ay, 2, 2, i < 3 ? "#604030" : "#404040");
  }
  // Palm trees
  [18, 78, 112].forEach((tx, i) => {
    // Trunk
    for (let dy = 0; dy < 14; dy++) px(ctx, tx, 70 - dy, 1, 1, "#4A2810");
    px(ctx, tx + 1, 64, 1, 1, "#4A2810");
    // Fronds
    const sway = Math.floor(Math.sin((tick + i * 10) / 14) * 1);
    for (let a = 0; a < 5; a++) {
      const fx = tx + Math.floor(Math.cos(a) * 4) + sway;
      const fy = 58 + Math.floor(Math.sin(a) * 2);
      px(ctx, fx, fy, 2, 2, "#2E8030");
      px(ctx, fx - 1, fy + 1, 4, 1, "#2E8030");
    }
  });
  // Low grass / fern tufts on ground
  for (let i = 0; i < 14; i++) {
    const gx = (i * 11 + Math.floor(tick / 10)) % W;
    const gy = 75 + (i % 3);
    px(ctx, gx, gy, 1, 1, "#5E8020");
    px(ctx, gx + 1, gy - 1, 1, 1, "#5E8020");
  }
}

// Cute-scary pixel T-Rex facing the hero
function drawDinoTRex(ctx: CanvasRenderingContext2D, cx: number, cy: number, tick: number) {
  const bob = Math.floor(Math.sin(tick / 10) * 1);
  const pal = { body: "#3E7020", accent: "#1E3810", belly: "#BBD080", eye: "#FFE040" };
  // Tail
  for (let dx = -18; dx <= -8; dx++) {
    const w = Math.max(1, 4 - Math.abs(dx + 13));
    for (let dy = -w; dy <= w; dy++) px(ctx, cx + dx, cy + dy + bob, 1, 1, pal.body);
  }
  // Body
  for (let dy = -6; dy <= 6; dy++) {
    const progress = (dy + 6) / 12;
    const halfW = Math.round(7 * Math.sin(progress * Math.PI));
    for (let dx = -halfW; dx <= halfW; dx++) {
      const edge = Math.abs(dx) === halfW;
      const belly = dy > 0 && Math.abs(dx) < halfW - 2;
      px(ctx, cx + dx, cy + dy + bob, 1, 1, edge ? pal.accent : belly ? pal.belly : pal.body);
    }
  }
  // Head (forward-facing, slightly left)
  for (let dy = -4; dy <= 3; dy++) {
    for (let dx = 4; dx <= 13; dx++) {
      const halfH = 4 - Math.abs(dx - 8) / 2;
      if (Math.abs(dy) <= halfH) {
        const edge = Math.abs(dy) === Math.floor(halfH);
        px(ctx, cx + dx, cy + dy + bob, 1, 1, edge ? pal.accent : pal.body);
      }
    }
  }
  // Jaw teeth
  for (let dx = 8; dx <= 12; dx++) {
    if (dx % 2 === 0) px(ctx, cx + dx, cy + 3 + bob, 1, 1, "#FFFFFF");
  }
  // Eye
  px(ctx, cx + 9, cy - 2 + bob, 2, 2, pal.eye);
  px(ctx, cx + 9, cy - 2 + bob, 1, 1, "#000");
  // Tiny arms
  px(ctx, cx + 3, cy + 1 + bob, 2, 3, pal.accent);
  px(ctx, cx + 3, cy + 4 + bob, 1, 1, "#FFFFFF");
  // Legs
  px(ctx, cx - 3, cy + 6 + bob, 3, 5, pal.body);
  px(ctx, cx + 1, cy + 6 + bob, 3, 5, pal.body);
  // Ground shadow
  px(ctx, cx - 12, cy + 12, 22, 2, "rgba(0,0,0,0.25)");
}

// Obsidian monolith, tall and humming
function drawMonolith(ctx: CanvasRenderingContext2D, cx: number, cy: number, tick: number) {
  // Base
  for (let dy = 0; dy < 40; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const edge = Math.abs(dx) === 5 || dy === 0 || dy === 39;
      px(ctx, cx + dx, cy + dy, 1, 1, edge ? "#080010" : "#101028");
    }
  }
  // Etched glyph
  const glyphPulse = Math.floor(tick / 8) % 4;
  const glyphY = cy + 18;
  if (glyphPulse === 0) {
    px(ctx, cx - 1, glyphY, 3, 1, "#80FFE0");
    px(ctx, cx, glyphY - 2, 1, 5, "#80FFE0");
  } else if (glyphPulse === 1) {
    for (let i = -2; i <= 2; i++) px(ctx, cx + i, glyphY + Math.abs(i) - 2, 1, 1, "#80E0FF");
  } else if (glyphPulse === 2) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) === 2) px(ctx, cx + dx, glyphY + dy, 1, 1, "#FFE080");
    }
  }
  // Glow outline
  for (let dy = 0; dy < 40; dy++) {
    if ((dy + tick) % 5 === 0) {
      px(ctx, cx - 6, cy + dy, 1, 1, "#6080FF");
      px(ctx, cx + 6, cy + dy, 1, 1, "#6080FF");
    }
  }
  // Floating particles
  for (let i = 0; i < 5; i++) {
    const px0 = cx + Math.floor(Math.sin((tick + i * 6) / 6) * 8);
    const py0 = cy + ((tick + i * 11) % 44) - 2;
    px(ctx, px0, py0, 1, 1, "#FFFFFF");
  }
}

function drawDinoIntro(ctx: CanvasRenderingContext2D, tick: number) {
  drawDinoBackdrop(ctx, tick);
  // Hero on the left looking right
  drawHero(ctx, 30, 82, false, false, null);
  // Distant T-Rex
  drawDinoTRex(ctx, 96, 70, tick);
  drawText(ctx, "PREHISTORIC EARTH", W / 2, 13, "#FFE080", 0.7);
}

function drawDinoEncounter(ctx: CanvasRenderingContext2D, tick: number) {
  drawDinoBackdrop(ctx, tick);
  drawHero(ctx, 26, 82, true, false, null);
  drawDinoTRex(ctx, 80, 72, tick);
  // Second dino, smaller (raptor-ish), closer
  drawDinoTRex(ctx, 108, 76, tick + 40);
  drawText(ctx, "ENCOUNTER", W / 2, 13, "#FF8040", 0.75);
}

function drawDinoMonolithScene(ctx: CanvasRenderingContext2D, tick: number) {
  drawDinoBackdrop(ctx, tick);
  drawHero(ctx, 40, 82, false, false, null);
  drawMonolith(ctx, 90, 42, tick);
  drawText(ctx, "MONOLITH", W / 2, 13, "#80E0FF", 0.75);
}

function drawBurstOut(ctx: CanvasRenderingContext2D, tick: number) {
  // White flash giving way to space
  if (tick < 25) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        px(ctx, x, y, 1, 1, "#FFFFFF");
      }
    }
    if (tick > 12) {
      // Iris opens: reveal space in center
      const cx = W / 2;
      const cy = H / 2;
      const r = (tick - 12) * 5;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= r && cx + dx >= 0 && cx + dx < W && cy + dy >= 0 && cy + dy < H) {
            px(ctx, cx + dx, cy + dy, 1, 1, "#080018");
          }
        }
      }
    }
    // Saucer bursting forward
    if (tick > 8) {
      drawFlyingSaucer(ctx, W / 2, H / 2, tick);
    }
  } else {
    drawSpaceScene(ctx, tick, "out");
    // Saucer zooms to foreground then off
    const sx = 64 + Math.floor(Math.sin(tick / 8) * 4);
    const sy = 56;
    drawFlyingSaucer(ctx, sx, sy, tick);
    drawText(ctx, "WE MADE IT!", W / 2, 20, "#80FF80", 0.85);
  }
}

// Gold coin drawing helper
function drawGoldCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  // Outer ring
  for (let dy = -size; dy <= size; dy++) {
    for (let dx = -size; dx <= size; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= size) {
        const isEdge = dist > size - 1.5;
        px(ctx, cx + dx, cy + dy, 1, 1, isEdge ? "#B8860B" : "#FFD700");
      }
    }
  }
  // Shine
  px(ctx, cx - 1, cy - 1, 1, 1, "#FFED80");
  // Dollar sign or G in center
  drawText(ctx, "G", cx + 0.5, cy + 0.5, "#B8860B", 0.35);
}


// ── Main Game ──────────────────────────────────────────────────────────────────
export default function IceCreamGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [customersServed, setCustomersServed] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [scoopsDone, setScoopsDone] = useState(0);
  const [coneScoops, setConeScoops] = useState<Flavor[]>([]);
  const [highScore, setHighScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem("scoopstack-highscore");
    const parsed = saved ? Number.parseInt(saved, 10) : 0;
    return Number.isNaN(parsed) ? 0 : parsed;
  });
  const [toppingsDone, setToppingsDone] = useState(0);
  const [toppingsPhase, setToppingsPhase] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const customerIdRef = useRef(0);
  const walkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicRef = useRef<{ stop: () => void } | null>(null);
  const animFrameRef = useRef<number>(0);
  const [goldCoins, setGoldCoins] = useState<{ x: number; y: number; age: number }[]>([]);

  // Chat/dialogue state
  const [chatActive, setChatActive] = useState(false);
  const [chatTarget, setChatTarget] = useState<"customer" | "scoopy" | null>(null);
  const [chatDialogue, setChatDialogue] = useState<DialogueNode[]>([]);
  const [chatNodeIdx, setChatNodeIdx] = useState(0);
  const chatHistoryRef = useRef<{ customer: number[]; scoopy: number[] }>({ customer: [], scoopy: [] });

  // Alien/Location state
  const [location, setLocation] = useState<Location>("earth");
  const [selectedSpaceDestination, setSelectedSpaceDestination] = useState<SpaceDestinationId | null>(null);
  const [spaceMapMessage, setSpaceMapMessage] = useState<string | null>(null);
  const [cutsceneType, setCutsceneType] = useState<CutsceneType | null>(null);
  const [cutsceneTick, setCutsceneTick] = useState(0);
  const [pendingAlien, setPendingAlien] = useState(false);
  const [alienEncountered, setAlienEncountered] = useState(false);
  const [alienVisited, setAlienVisited] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("scoopstack-alien-visited") === "1";
  });
  const earthCustomersServedRef = useRef(0);
  const [alienCoins, setAlienCoins] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem("scoopstack-alien-coins");
    const n = saved ? Number.parseInt(saved, 10) : 0;
    return Number.isNaN(n) ? 0 : n;
  });
  const [earthCoins, setEarthCoins] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem("scoopstack-earth-coins");
    const n = saved ? Number.parseInt(saved, 10) : 0;
    return Number.isNaN(n) ? 0 : n;
  });

  // Black hole detour state
  const [blackholeScene, setBlackholeScene] = useState<BlackholeScene | null>(null);
  const [blackholeTick, setBlackholeTick] = useState(0);
  const [blackholeReturnTo, setBlackholeReturnTo] = useState<"alien" | "earth">("alien");
  const [blackholeBonus, setBlackholeBonus] = useState(0);
  const [blackholeMessage, setBlackholeMessage] = useState<string | null>(null);

  // Street / shop state
  const [doorOfferActive, setDoorOfferActive] = useState(false);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [shopTab, setShopTab] = useState<"buy" | "inventory">("buy");
  const [shopFlash, setShopFlash] = useState<string | null>(null);
  const [heroX, setHeroX] = useState(30);
  const heroDirRef = useRef<-1 | 0 | 1>(0);
  const [streetTick, setStreetTick] = useState(0);
  const [streetNpcs, setStreetNpcs] = useState<{ id: number; x: number; spriteIdx: number; alien: boolean; dir: -1 | 1 }[]>([]);
  const [inventory, setInventory] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem("scoopstack-inventory");
      return saved ? (JSON.parse(saved) as Record<string, number>) : {};
    } catch { return {}; }
  });
  const [unlockFlags, setUnlockFlags] = useState<UnlockFlags>(() =>
    loadJson<UnlockFlags>(STORAGE_KEYS.unlockFlags, {})
  );
  const [quests, setQuests] = useState<QuestMap>(() =>
    loadJson<QuestMap>(STORAGE_KEYS.quests, {})
  );
  const [characterMemory, setCharacterMemory] = useState<CharacterMemoryMap>(() =>
    loadJson<CharacterMemoryMap>(STORAGE_KEYS.characterMemory, {})
  );
  const [arcadeHighScores, setArcadeHighScores] = useState<Partial<Record<ArcadeGameId, number>>>(() =>
    loadJson<Partial<Record<ArcadeGameId, number>>>(STORAGE_KEYS.arcadeHighScores, {})
  );
  const [glowShards, setGlowShards] = useState(() =>
    loadJson<{ glowShards: number }>(STORAGE_KEYS.underground, { glowShards: 0 }).glowShards
  );
  const [undergroundX, setUndergroundX] = useState(26);
  const undergroundDirRef = useRef<-1 | 0 | 1>(0);
  const [collectedUndergroundCrystals, setCollectedUndergroundCrystals] = useState<number[]>([]);
  const [shipRoom, setShipRoom] = useState<ShipRoomId>(() =>
    loadJson<{ room: ShipRoomId }>(STORAGE_KEYS.shipState, { room: "cockpit" }).room
  );
  const [shipRoomMessage, setShipRoomMessage] = useState<ShipRoomMessage | null>(null);
  const [shipInteriorReturn, setShipInteriorReturn] = useState<"playing" | "cutscene">("playing");
  const [aliveShopState, setAliveShopState] = useState<AliveShopState>(() =>
    loadJson<AliveShopState>(STORAGE_KEYS.aliveShop, DEFAULT_ALIVE_SHOP_STATE)
  );
  // Equipped items, tamagotchi-style
  const [equippedHeld, setEquippedHeld] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = window.localStorage.getItem("scoopstack-equipped");
      if (!saved) return null;
      const parsed = JSON.parse(saved) as { held?: string | null; decor?: string[] };
      return parsed.held ?? null;
    } catch { return null; }
  });
  const [equippedDecor, setEquippedDecor] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("scoopstack-equipped");
      if (!saved) return [];
      const parsed = JSON.parse(saved) as { held?: string | null; decor?: string[] };
      return parsed.decor ?? [];
    } catch { return []; }
  });

  // Slot machine state (casino shops)
  const [slotReels, setSlotReels] = useState<[string, string, string]>(["\u{1F352}", "\u{1F34B}", "\u{1F514}"]);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const slotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Alien Arcade room state
  const [arcadeRoomX, setArcadeRoomX] = useState(28);
  const arcadeDirRef = useRef<-1 | 0 | 1>(0);
  const [arcadeCabinetPreview, setArcadeCabinetPreview] = useState<ArcadeGameId | null>(null);
  const [meteorMeltdown, setMeteorMeltdown] = useState<MeteorMeltdownState | null>(null);
  const [slimeSimon, setSlimeSimon] = useState<SlimeSimonState | null>(null);
  const [moonMaze, setMoonMaze] = useState<MoonMazeState | null>(null);
  const [ufoClaw, setUfoClaw] = useState<UfoClawState | null>(null);
  const [pixelRift, setPixelRift] = useState<PixelRiftState | null>(null);

  // Boss state
  const [shakeTick, setShakeTick] = useState(0);
  const lastBossAtRef = useRef(0);
  const pendingBossRef = useRef(false);

  // Boss fight — Simon-says order then chase-tap.
  const [bossFight, setBossFight] = useState<BossFightState | null>(null);
  const bossEncounterRef = useRef(0);

  // Chase phase state (post-minion-escape)
  const [chaseMinions, setChaseMinions] = useState<ChaseMinion[]>([]);
  const [chaseTick, setChaseTick] = useState(0);
  const chaseResumeRef = useRef<"playing" | null>(null);

  // Warp drive (journey cutscenes)
  const [warpActive, setWarpActive] = useState(false);
  const [warpTick, setWarpTick] = useState(0);

  // Sarah's World (meta-game in the arcade)
  const [sarahsWorld, setSarahsWorld] = useState<{
    tick: number;
    tileCount: number;
    juliaX: number;
    juliaMoving: boolean;
    shooCooldown: number;
    timeLeft: number;      // ms
    target: number;
    phase: "play" | "won" | "lost";
    phaseTick: number;
  } | null>(null);
  const sarahsWorldReturnRef = useRef<"shop" | "arcade-room">("shop");

  // Pilot minigame state — most of the gameplay uses refs to avoid excessive
  // re-renders; `pilotTick` state drives the canvas to repaint and the UI to update.
  const [pilotOfferActive, setPilotOfferActive] = useState(false);
  const [pilotTick, setPilotTick] = useState(0);
  const [pilotHits, setPilotHits] = useState(0);
  const [pilotLives, setPilotLives] = useState(3);
  const [pilotReturnTo, setPilotReturnTo] = useState<"alien" | "earth">("alien");
  const pilotOfferRef = useRef(false);
  const pilotResumeTickRef = useRef(0);
  const pilotShipRef = useRef({ x: 64, y: 90 });
  const pilotAsteroidsRef = useRef<Asteroid[]>([]);
  const pilotLasersRef = useRef<Laser[]>([]);
  const pilotInvulnRef = useRef(0); // ticks remaining of invulnerability
  const pilotInputsRef = useRef<PilotInputs>({ left: false, right: false, up: false, down: false, fire: false });
  const pilotLastFireRef = useRef(0);
  const pilotIdRef = useRef(0);
  const pilotBonusRef = useRef(0);

  const level = Math.floor(customersServed / 3) + 1;
  const totalGold = earthCoins + alienCoins;
  const availableEarthFlavors = useMemo(
    () => getAvailableEarthFlavors(inventory, unlockFlags),
    [inventory, unlockFlags]
  );
  const availableAlienFlavors = useMemo(
    () => getAvailableAlienFlavors(inventory, unlockFlags),
    [inventory, unlockFlags]
  );
  const currentFlavorPool = location === "alien-planet" ? availableAlienFlavors : availableEarthFlavors;
  const currentToppingPool = useMemo(
    () => getAvailableToppings(location, inventory, unlockFlags),
    [location, inventory, unlockFlags]
  );
  const visibleShops = useCallback(
    (loc: Location) => getVisibleShops(loc, { customersServed, inventory, unlockFlags }),
    [customersServed, inventory, unlockFlags]
  );
  const alienLadderUnlocked = useMemo(
    () => Boolean(inventory["gravity-boots"] || unlockFlags["alien-ladder"] || customersServed >= 18),
    [customersServed, inventory, unlockFlags]
  );

  useEffect(() => saveJson(STORAGE_KEYS.unlockFlags, unlockFlags), [unlockFlags]);
  useEffect(() => saveJson(STORAGE_KEYS.quests, quests), [quests]);
  useEffect(() => saveJson(STORAGE_KEYS.characterMemory, characterMemory), [characterMemory]);
  useEffect(() => saveJson(STORAGE_KEYS.arcadeHighScores, arcadeHighScores), [arcadeHighScores]);
  useEffect(() => saveJson(STORAGE_KEYS.underground, { glowShards }), [glowShards]);
  useEffect(() => saveJson(STORAGE_KEYS.shipState, { room: shipRoom }), [shipRoom]);
  useEffect(() => saveJson(STORAGE_KEYS.aliveShop, aliveShopState), [aliveShopState]);

  const setFlag = useCallback((flag: string, value = true) => {
    setUnlockFlags((prev) => ({ ...prev, [flag]: value }));
  }, []);

  // ── Canvas rendering loop ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" && phase !== "cutscene" && phase !== "blackhole" && phase !== "pilot" && phase !== "street" && phase !== "shop" && phase !== "arcade-room" && phase !== "meteor-meltdown" && phase !== "slime-simon" && phase !== "moon-maze" && phase !== "ufo-claw" && phase !== "pixel-rift" && phase !== "alien-underground" && phase !== "ship-interior" && phase !== "space-map" && phase !== "space-destination" && phase !== "chase" && phase !== "boss-fight" && phase !== "sarahs-world") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const themePrimary = location === "alien-planet" ? "#40E0A0" : "#FF69B4";
    const themeCoin = "#FFD700";

    function drawHud() {
      if (!ctx) return;
      drawText(ctx, `LV.${level}`, 16, 13, themePrimary, 0.65);
      drawGoldCoin(ctx, 52, 12, 2);
      drawText(ctx, `${totalGold}`, 62, 13, themeCoin, 0.65);

      // Decorative hearts on the HUD
      const heartX = 105;
      for (let i = 0; i < 3; i++) {
        px(ctx, heartX + i * 6, 10, 2, 2, "#FF4444");
        px(ctx, heartX + i * 6 + 2, 10, 2, 2, "#FF4444");
        px(ctx, heartX + i * 6 + 1, 12, 2, 2, "#FF4444");
      }
    }

    function drawShopScene() {
      if (!ctx) return;
      const t = cutsceneTick;
      if (location === "alien-planet") {
        drawAlienPlanetBackground(ctx, t);
        drawHomeDecor(ctx, equippedDecor, t);
        drawAlienShopkeeper(ctx, 64, 70, t);
      } else {
        drawBackground(ctx);
        drawHomeDecor(ctx, equippedDecor, t);
        drawShopkeeper(ctx, 64, 70, equippedHeld);
      }

      const cust = customer;
      if (cust) {
        if (cust.isAlien || cust.isAlienVIP) {
          drawAlienSprite(
            ctx,
            Math.round(cust.x),
            76,
            cust.spriteIdx,
            cust.state === "walking-in" || cust.state === "walking-out"
          );
        } else {
          drawCustomerSprite(
            ctx,
            Math.round(cust.x),
            76,
            cust.spriteIdx,
            cust.state === "walking-in" || cust.state === "walking-out"
          );
        }

        if (cust.state === "waiting" || cust.state === "served") {
          drawSpeechBubble(
            ctx,
            Math.round(cust.x),
            38,
            cust.order,
            scoopsDone,
            cust.toppings,
            toppingsDone,
            toppingsPhase,
            cust.reaction,
          );
          const nameW = cust.name.length * 3 + 6;
          const nx = Math.round(cust.x) - Math.floor(nameW / 2);
          const ny = 90;
          for (let dx = 0; dx < nameW; dx++) {
            for (let dy = 0; dy < 6; dy++) {
              const isBorder = dy === 0 || dy === 5 || dx === 0 || dx === nameW - 1;
              px(ctx, nx + dx, ny + dy, 1, 1, isBorder ? "#333" : "#FFFDE8");
            }
          }
          drawText(ctx, cust.name, Math.round(cust.x) + 1, ny + 3, themePrimary, 0.4);
        }
      }

      if (cust && (cust.state === "waiting" || cust.state === "served")) {
        drawCone(ctx, 100, 52, coneScoops, cust.toppings, toppingsDone);
      }

      goldCoins.forEach((coin) => {
        const floatY = coin.y - coin.age * 0.3;
        const alpha = Math.max(0, 1 - coin.age / 60);
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          drawGoldCoin(ctx, coin.x, Math.round(floatY), 3);
          ctx.globalAlpha = 1;
        }
      });
    }

    function drawCutscene() {
      if (!ctx) return;
      const t = cutsceneTick;
      if (cutsceneType === "alien-arrival") {
        // Earth shop, saucer descends from top, drops alien via beam near x=30
        drawBackground(ctx);
        drawShopkeeper(ctx, 64, 70);
        const beamX = 30;
        // Saucer fly-in: from right edge, decelerates over beam spot
        const saucerX = Math.max(beamX, Math.floor(W + 20 - t * 1.4));
        const saucerY = 22;
        drawFlyingSaucer(ctx, saucerX, saucerY, t);
        // Once saucer reaches beam spot, beam drops
        if (t > 40 && t < 90) {
          drawBeam(ctx, beamX, saucerY + 4, Math.min(80, saucerY + 4 + (t - 40) * 2), t);
        }
        // Alien materializes around t=60
        if (t > 60) {
          const appear = Math.min(1, (t - 60) / 20);
          ctx.globalAlpha = appear;
          drawAlienSprite(ctx, beamX, 76, 1, false);
          ctx.globalAlpha = 1;
        }
        if (t < 100) {
          const txtY = 50 + Math.floor(Math.sin(t / 8) * 2);
          drawText(ctx, "ALIEN!!!", 64, txtY, "#FF69B4", 0.9);
        }
      } else if (cutsceneType === "beam-up" || cutsceneType === "earth-departure") {
        // Beam up from earth or alien planet
        if (cutsceneType === "beam-up") {
          drawBackground(ctx);
          drawShopkeeper(ctx, 64, 70);
        } else {
          drawAlienPlanetBackground(ctx, t);
          drawAlienShopkeeper(ctx, 64, 70, t);
        }
        // Saucer descends to hover
        const saucerY = Math.min(22, 0 + t * 0.4);
        drawFlyingSaucer(ctx, 64, Math.floor(saucerY), t);
        // Beam active
        if (t > 10) {
          drawBeam(ctx, 64, Math.floor(saucerY) + 4, 80, t);
        }
        // Shopkeeper rises into beam
        if (t > 30) {
          const rise = Math.min(50, (t - 30) * 1.2);
          const sy = 70 - rise;
          ctx.globalAlpha = Math.max(0, 1 - (t - 30) / 60);
          if (cutsceneType === "beam-up") {
            drawShopkeeper(ctx, 64, Math.floor(sy));
          } else {
            drawAlienShopkeeper(ctx, 64, Math.floor(sy), t);
          }
          ctx.globalAlpha = 1;
        }
      } else if (cutsceneType === "journey-out" || cutsceneType === "journey-back") {
        const dir = cutsceneType === "journey-out" ? "out" : "back";
        drawSpaceScene(ctx, t, dir);
        // Saucer in center, subtle bob
        const sx = 64 + Math.floor(Math.sin(t / 10) * 3);
        const sy = 50 + Math.floor(Math.sin(t / 15) * 3);
        drawFlyingSaucer(ctx, sx, sy, t);
        // Journey banner
        drawText(ctx, dir === "out" ? "TO THE STARS!" : "HEADING HOME!", 64, 14, "#FFFFFF", 0.85);
      } else if (cutsceneType === "landing-alien" || cutsceneType === "landing-earth") {
        if (cutsceneType === "landing-alien") {
          drawAlienPlanetBackground(ctx, t);
        } else {
          drawBackground(ctx);
        }
        // Saucer descends from top
        const saucerY = Math.min(22, -10 + t * 0.5);
        drawFlyingSaucer(ctx, 64, Math.floor(saucerY), t);
        // Beam down
        if (t > 30) {
          drawBeam(ctx, 64, Math.floor(saucerY) + 4, Math.min(70, Math.floor(saucerY) + 4 + (t - 30) * 1.5), t);
        }
        // Shopkeeper materializes at counter
        if (t > 55) {
          const appear = Math.min(1, (t - 55) / 25);
          ctx.globalAlpha = appear;
          if (cutsceneType === "landing-alien") {
            drawShopkeeper(ctx, 64, 70);
          } else {
            drawShopkeeper(ctx, 64, 70);
          }
          ctx.globalAlpha = 1;
        }
      }
    }

    function drawBlackhole() {
      if (!ctx) return;
      const t = blackholeTick;
      switch (blackholeScene) {
        case "pull-in":         drawBlackHolePullIn(ctx, t); break;
        case "fork":            drawDimensionFork(ctx, t); break;
        case "mirrors":         drawMirrorYou(ctx, t); break;
        case "clockwork":       drawClockNebula(ctx, t); break;
        case "library":         drawInfiniteLibrary(ctx, t); break;
        case "exit":            drawExitPortal(ctx, t); break;
        case "burst-out":       drawBurstOut(ctx, t); break;
        case "dino-intro":      drawDinoIntro(ctx, t); break;
        case "dino-encounter":  drawDinoEncounter(ctx, t); break;
        case "dino-monolith":   drawDinoMonolithScene(ctx, t); break;
      }
    }

    function drawPilot() {
      if (!ctx) return;
      drawPilotScene(
        ctx,
        pilotShipRef.current,
        pilotAsteroidsRef.current,
        pilotLasersRef.current,
        pilotTick,
        pilotInvulnRef.current > 0,
        pilotHits,
        pilotLives,
      );
    }

    function drawStreet() {
      if (!ctx) return;
      drawStreetScene(
        ctx,
        streetTick,
        location,
        visibleShops(location),
        heroX,
        heroDirRef.current !== 0,
        streetNpcs,
        null,
        equippedHeld,
        alienLadderUnlocked,
      );
    }

    function drawAlienUnderground() {
      if (!ctx) return;
      drawAlienUndergroundScene(ctx, streetTick, undergroundX, undergroundDirRef.current !== 0, collectedUndergroundCrystals, glowShards);
    }

    function drawShipInterior() {
      if (!ctx) return;
      drawShipInteriorScene(ctx, streetTick, SHIP_ROOMS[shipRoom], shipRoomMessage);
    }

    function drawSpaceMap() {
      if (!ctx) return;
      drawSpaceMapScene(ctx, streetTick, selectedSpaceDestination, unlockFlags);
    }

    function drawShop() {
      if (!ctx) return;
      const shop = currentShopId ? shopById(currentShopId) : null;
      if (!shop) return;
      drawShopInterior(ctx, shop, streetTick);
    }

    function drawArcadeRoom() {
      if (!ctx) return;
      drawArcadeRoomScene(ctx, streetTick, arcadeRoomX, arcadeDirRef.current !== 0, arcadeCabinetPreview);
    }

    function drawMeteorMeltdown() {
      if (!ctx) return;
      drawMeteorMeltdownScene(ctx, streetTick, meteorMeltdown);
    }

    function drawSlimeSimon() {
      if (!ctx) return;
      drawSlimeSimonScene(ctx, streetTick, slimeSimon);
    }

    function drawMoonMaze() {
      if (!ctx) return;
      drawMoonMazeScene(ctx, streetTick, moonMaze);
    }

    function drawUfoClaw() {
      if (!ctx) return;
      drawUfoClawScene(ctx, streetTick, ufoClaw);
    }

    function drawPixelRift() {
      if (!ctx) return;
      drawPixelRiftScene(ctx, streetTick, pixelRift);
    }

    function drawChase() {
      if (!ctx) return;
      drawChaseScene(ctx, chaseTick, chaseMinions);
    }

    function drawBossFightView() {
      if (!ctx || !bossFight) return;
      const pool = bossFight.bossOnAlien ? availableAlienFlavors : availableEarthFlavors;
      const flavorColor = (name: string) => {
        const f = pool.find((ff) => ff.name === name);
        return f ? f.colors[1] : "#CCCCCC";
      };
      drawBossFightScene(ctx, bossFight, bossFight.phaseTick + cutsceneTick, flavorColor);
    }

    function drawSarahsWorldView() {
      if (!ctx || !sarahsWorld) return;
      drawSarahsWorldScene(
        ctx,
        sarahsWorld.tick,
        sarahsWorld.tileCount,
        sarahsWorld.juliaX,
        sarahsWorld.juliaMoving && sarahsWorld.phase === "play",
        sarahsWorld.shooCooldown,
        sarahsWorld.timeLeft,
        sarahsWorld.target,
      );
      if (sarahsWorld.phase === "won") {
        drawText(ctx, "YOU BUILT THE HOUSE!", W / 2, H / 2 - 4, "#20A050", 0.9);
        drawText(ctx, "+150G", W / 2, H / 2 + 8, "#C08010", 0.7);
      } else if (sarahsWorld.phase === "lost") {
        drawText(ctx, "TIME'S UP!", W / 2, H / 2 - 4, "#D04060", 0.9);
        if (sarahsWorld.tileCount > 0) {
          drawText(ctx, `+${sarahsWorld.tileCount * 5}G`, W / 2, H / 2 + 8, "#C08010", 0.6);
        }
      }
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      if (phase === "cutscene") {
        drawCutscene();
        // Warp overlay takes over during warp
        if (warpActive) drawWarpStars(ctx, warpTick);
      } else if (phase === "blackhole") {
        drawBlackhole();
      } else if (phase === "pilot") {
        drawPilot();
      } else if (phase === "street") {
        drawStreet();
      } else if (phase === "shop") {
        drawShop();
      } else if (phase === "arcade-room") {
        drawArcadeRoom();
      } else if (phase === "meteor-meltdown") {
        drawMeteorMeltdown();
      } else if (phase === "slime-simon") {
        drawSlimeSimon();
      } else if (phase === "moon-maze") {
        drawMoonMaze();
      } else if (phase === "ufo-claw") {
        drawUfoClaw();
      } else if (phase === "pixel-rift") {
        drawPixelRift();
      } else if (phase === "alien-underground") {
        drawAlienUnderground();
      } else if (phase === "ship-interior") {
        drawShipInterior();
      } else if (phase === "space-map") {
        drawSpaceMap();
      } else if (phase === "space-destination") {
        drawSpaceMap();
      } else if (phase === "chase") {
        drawChase();
      } else if (phase === "boss-fight") {
        drawBossFightView();
      } else if (phase === "sarahs-world") {
        drawSarahsWorldView();
      } else {
        drawShopScene();
      }
      if (phase !== "pilot" && phase !== "boss-fight" && phase !== "sarahs-world") drawHud();
      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, customer, scoopsDone, coneScoops, toppingsDone, toppingsPhase, level, customersServed, goldCoins, totalGold, location, cutsceneType, cutsceneTick, blackholeScene, blackholeTick, pilotTick, pilotHits, pilotLives, streetTick, heroX, streetNpcs, currentShopId, equippedHeld, equippedDecor, bossFight, chaseMinions, chaseTick, warpActive, warpTick, sarahsWorld, visibleShops, availableAlienFlavors, availableEarthFlavors, arcadeRoomX, arcadeCabinetPreview, meteorMeltdown, slimeSimon, moonMaze, ufoClaw, pixelRift, alienLadderUnlocked, undergroundX, collectedUndergroundCrystals, glowShards, shipRoom, shipRoomMessage, selectedSpaceDestination, unlockFlags]);

  // Walk customer in
  const walkCustomerIn = useCallback((c: Customer) => {
    setCustomer({ ...c });
    playDing();
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    walkIntervalRef.current = setInterval(() => {
      setCustomer((prev) => {
        if (!prev || prev.state !== "walking-in") return prev;
        const newX = prev.x - 1;
        if (newX <= prev.targetX) return { ...prev, x: prev.targetX, state: "waiting" };
        return { ...prev, x: newX };
      });
    }, 30);
  }, []);

  // Walk customer out
  const walkCustomerOut = useCallback(() => {
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    walkIntervalRef.current = setInterval(() => {
      setCustomer((prev) => {
        if (!prev || prev.state !== "walking-out") return prev;
        const newX = prev.x + 1.5;
        if (newX > W + 20) { clearInterval(walkIntervalRef.current!); return null; }
        return { ...prev, x: newX };
      });
    }, 30);
  }, []);

  // Gentle nudges (no timer - customers never leave)
  useEffect(() => {
    if (customer?.state !== "waiting" || phase !== "playing") return;
    const interval = setInterval(() => {
      setCustomer((prev) => {
        if (!prev || prev.state !== "waiting") return prev;
        const newTicks = prev.waitTicks + 1;
        // Every ~5 seconds, show a gentle nudge
        if (newTicks % 50 === 0 && !prev.reaction) {
          return { ...prev, waitTicks: newTicks, reaction: pick(NUDGES) };
        }
        // Clear nudge after 2 seconds
        if (prev.reaction && newTicks % 50 === 20) {
          return { ...prev, waitTicks: newTicks, reaction: "" };
        }
        return { ...prev, waitTicks: newTicks };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [customer?.state, customer?.id, phase]);

  // Walk out after served
  useEffect(() => {
    if (customer?.state === "walking-out") walkCustomerOut();
  }, [customer?.state, walkCustomerOut]);

  // Send next customer (or trigger alien arrival when pending)
  useEffect(() => {
    if (phase !== "playing") return;
    if (customer !== null) return;
    if (location === "earth" && pendingAlien) {
      const timer = setTimeout(() => {
        setPendingAlien(false);
        setScoopsDone(0);
        setConeScoops([]);
        setToppingsDone(0);
        setToppingsPhase(false);
        setCutsceneType("alien-arrival");
        setCutsceneTick(0);
        setPhase("cutscene");
      }, 300);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      // Boss every 7 served customers (at the home shop). Instead of walking a
      // customer in, we snap into the standalone boss-fight phase.
      const bossDue = customersServed > 0
        && customersServed % 7 === 0
        && customersServed > lastBossAtRef.current;
      if (bossDue) {
        lastBossAtRef.current = customersServed;
        pendingBossRef.current = true;
        bossEncounterRef.current += 1;
        const encounterIdx = bossEncounterRef.current;
        const bossOnAlien = location === "alien-planet";
        const orderLen = Math.min(6, 4 + (encounterIdx - 1));
        const pool = bossOnAlien ? availableAlienFlavors : availableEarthFlavors;
        const order = Array.from({ length: orderLen }, () => pick(pool).name);
        const chaseTotalTime = Math.max(3000, 5500 - (encounterIdx - 1) * 400);
        setBossFight({
          phase: "intro",
          phaseTick: 0,
          order,
          showIdx: 0,
          playIdx: 0,
          chaseProgress: 0,
          chaseTarget: 20 + (encounterIdx - 1) * 3,
          chaseTimeLeft: chaseTotalTime,
          chaseTotalTime,
          bossName: bossOnAlien ? "VOID WARLORD" : "FROZEN FURY",
          bossOnAlien,
          encounterIdx,
          orderMoney: 100 + encounterIdx * 50,
        });
        setPhase("boss-fight");
        return;
      }
      customerIdRef.current += 1;
      const c = location === "alien-planet"
        ? createAlienCustomer(customerIdRef.current, level, availableAlienFlavors, currentToppingPool)
        : createCustomer(customerIdRef.current, level, availableEarthFlavors, currentToppingPool);
      setScoopsDone(0);
      setConeScoops([]);
      setToppingsDone(0);
      setToppingsPhase(false);
      walkCustomerIn(c);
    }, 800);
    return () => clearTimeout(timer);
  }, [customer, phase, level, walkCustomerIn, location, pendingAlien, customersServed, availableAlienFlavors, availableEarthFlavors, currentToppingPool]);

  // Level up every 3 customers
  // Gold coin animation aging
  useEffect(() => {
    if (goldCoins.length === 0) return;
    const interval = setInterval(() => {
      setGoldCoins((prev) => {
        const updated = prev.map((c) => ({ ...c, age: c.age + 1 })).filter((c) => c.age < 60);
        return updated;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [goldCoins.length]);

  // Complete order
  const completeOrder = useCallback(() => {
    if (!customer) return;
    const isVIP = !!customer.isAlienVIP;
    const bonusMult = isVIP ? 3 : 1;
    let coinCount = (1 + customer.order.length + customer.toppings.length) * bonusMult;
    if ((inventory["sun-charm"] || unlockFlags["tip-bonus-1"]) && Math.random() < 0.1) {
      coinCount += 1;
    }
    const pointsEarned = (100 + customer.toppings.length * 25) * bonusMult;
    const nextScore = score + pointsEarned;
    setScore(nextScore);
    if (nextScore > highScore) {
      setHighScore(nextScore);
      window.localStorage.setItem("scoopstack-highscore", nextScore.toString());
    }
    if (location === "alien-planet") {
      setAlienCoins((g) => {
        const n = g + coinCount;
        window.localStorage.setItem("scoopstack-alien-coins", n.toString());
        return n;
      });
    } else {
      setEarthCoins((g) => {
        const n = g + coinCount;
        window.localStorage.setItem("scoopstack-earth-coins", n.toString());
        return n;
      });
    }
    setCustomersServed((c) => c + 1);
    if (location === "earth" && !isVIP) {
      earthCustomersServedRef.current += 1;
      if (earthCustomersServedRef.current >= 5 && !alienEncountered) {
        setPendingAlien(true);
        setAlienEncountered(true);
      }
    }
    playCoinSound();

    // Spawn floating gold coins around the customer
    const newCoins = Array.from({ length: coinCount }, (_, i) => ({
      x: Math.round(customer.x) - 5 + (i % 8) * 6,
      y: 70 - Math.floor(i / 8) * 6,
      age: 0,
    }));
    setGoldCoins((prev) => [...prev, ...newCoins]);

    setCustomer((prev) => prev ? { ...prev, reaction: `+${coinCount}G!`, state: "served" } : prev);
    setTimeout(() => {
      setCustomer((prev) => prev ? { ...prev, reaction: pick(HAPPY_REACTIONS) } : prev);
    }, 600);
    // VIP alien: trigger offer dialogue instead of walking out
    if (isVIP) {
      setTimeout(() => {
        setChatTarget("customer");
        setChatDialogue(ALIEN_OFFER_DIALOGUE);
        setChatNodeIdx(0);
        setChatActive(true);
      }, 1400);
    } else {
      setTimeout(() => {
        setCustomer((prev) => prev ? { ...prev, state: "walking-out" } : prev);
      }, 1400);
    }
  }, [customer, highScore, score, location, alienEncountered, inventory, unlockFlags]);

  // Tap a flavor
  const tapFlavor = useCallback(
    (flavor: Flavor) => {
      if (!customer || customer.state !== "waiting" || toppingsPhase) return;
      if (scoopsDone >= customer.order.length) return;

      const expected = customer.order[scoopsDone];
      if (flavor.name === expected.name) {
        playBoop();
        const newScoops = [...coneScoops, flavor];
        setConeScoops(newScoops);
        const newDone = scoopsDone + 1;
        setScoopsDone(newDone);
        if (newDone === customer.order.length) {
          if (customer.toppings.length > 0) {
            setToppingsPhase(true);
          } else {
            completeOrder();
          }
        }
      } else {
        playWrong();
        setCustomer((prev) => prev ? { ...prev, reaction: "Nope!" } : prev);
        setTimeout(() => {
          setCustomer((prev) => prev && prev.state === "waiting" ? { ...prev, reaction: "" } : prev);
        }, 600);
      }
    },
    [customer, scoopsDone, coneScoops, toppingsPhase, completeOrder]
  );

  // Tap a topping
  const tapTopping = useCallback(
    (topping: Topping) => {
      if (!customer || customer.state !== "waiting" || !toppingsPhase) return;
      if (toppingsDone >= customer.toppings.length) return;
      const expected = customer.toppings[toppingsDone];
      if (topping.name === expected.name) {
        playBoop();
        const newDone = toppingsDone + 1;
        setToppingsDone(newDone);
        if (newDone === customer.toppings.length) completeOrder();
      } else {
        playWrong();
        setCustomer((prev) => prev ? { ...prev, reaction: "Nope!" } : prev);
        setTimeout(() => {
          setCustomer((prev) => prev && prev.state === "waiting" ? { ...prev, reaction: "" } : prev);
        }, 600);
      }
    },
    [customer, toppingsPhase, toppingsDone, completeOrder]
  );

  const startGame = useCallback(async () => {
    // Initialize shared audio context on user gesture (critical for mobile)
    await initAudio();
    setScore(0); setCustomersServed(0); earthCustomersServedRef.current = 0; setCustomer(null);
    setScoopsDone(0); setConeScoops([]); setToppingsDone(0); setToppingsPhase(false);
    setGoldCoins([]);
    setLocation("earth");
    setCutsceneType(null); setCutsceneTick(0);
    setBlackholeScene(null); setBlackholeTick(0); setBlackholeBonus(0); setBlackholeMessage(null);
    setPilotOfferActive(false); pilotOfferRef.current = false;
    setPilotTick(0); setPilotHits(0); setPilotLives(3);
    pilotAsteroidsRef.current = []; pilotLasersRef.current = [];
    pilotInputsRef.current = { left: false, right: false, up: false, down: false, fire: false };
    pilotBonusRef.current = 0; pilotInvulnRef.current = 0;
    setDoorOfferActive(false);
    setCurrentShopId(null); setShopTab("buy"); setShopFlash(null);
    setHeroX(30); heroDirRef.current = 0; setStreetTick(0); setStreetNpcs([]);
    setSlotReels(["\u{1F352}", "\u{1F34B}", "\u{1F514}"]); setSlotSpinning(false); setSlotMessage(null);
    if (slotIntervalRef.current) { clearInterval(slotIntervalRef.current); slotIntervalRef.current = null; }
    setShakeTick(0);
    lastBossAtRef.current = 0;
    pendingBossRef.current = false;
    setBossFight(null); bossEncounterRef.current = 0;
    setSarahsWorld(null);
    setChaseMinions([]); setChaseTick(0);
    chaseResumeRef.current = null;
    setWarpActive(false); setWarpTick(0);
    setShipRoom("cockpit");
    setShipRoomMessage(null);
    setShipInteriorReturn("playing");
    setAliveShopState((state) => state);
    setPendingAlien(false);
    setAlienEncountered(false);
    setChatActive(false); setChatTarget(null);
    chatHistoryRef.current = { customer: [], scoopy: [] };
    customerIdRef.current = 0; setPhase("playing");
    if (musicRef.current) musicRef.current.stop();
    musicRef.current = createMusicContext();
    setMusicOn(true);
  }, []);

  // Derive music mode from current context (no state — avoids cascade).
  const musicMode: MusicMode = useMemo(() => {
    if (phase === "boss-fight") return "boss";
    if (phase === "blackhole" && (blackholeScene === "dino-intro" || blackholeScene === "dino-encounter" || blackholeScene === "dino-monolith")) return "dino";
    if (phase === "blackhole") return "space";
    if (phase === "cutscene" || phase === "pilot") return "space";
    if (phase === "shop" && currentShopId) {
      const s = shopById(currentShopId);
      if (s?.type === "casino") return "casino";
      return location === "alien-planet" ? "alien-shop" : "earth-shop";
    }
    if (location === "alien-planet") return "alien-shop";
    return "earth-shop";
  }, [phase, location, currentShopId, blackholeScene]);

  const toggleMusic = useCallback(() => {
    if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; setMusicOn(false); }
    else { musicRef.current = createMusicContext(musicMode); setMusicOn(true); }
  }, [musicMode]);

  // When mode changes and music is on, swap the track.
  useEffect(() => {
    if (!musicOn) return;
    if (musicRef.current) { musicRef.current.stop(); }
    musicRef.current = createMusicContext(musicMode);
  }, [musicMode, musicOn]);

  // Screen-shake tick-down during boss strikes
  useEffect(() => {
    if (shakeTick <= 0) return;
    const t = setTimeout(() => setShakeTick((s) => Math.max(0, s - 1)), 40);
    return () => clearTimeout(t);
  }, [shakeTick]);

  // Boss fight driver — Simon order -> chase -> caught/escaped. All transitions
  // happen inside the setInterval callback to stay atomic.
  useEffect(() => {
    if (phase !== "boss-fight" || !bossFight) return;
    const interval = setInterval(() => {
      setBossFight((cur) => {
        if (!cur) return cur;
        const nextTick = cur.phaseTick + 1;
        switch (cur.phase) {
          case "intro": {
            if (nextTick >= 35) return { ...cur, phase: "simon-show", phaseTick: 0, showIdx: 0 };
            return { ...cur, phaseTick: nextTick };
          }
          case "simon-show": {
            // Each flavor is pulsed for 12 ticks on + 6 ticks off (~0.72s total).
            const step = 18;
            const advance = Math.floor(nextTick / step);
            const showIdx = advance;
            if (showIdx >= cur.order.length) {
              return { ...cur, phase: "simon-play", phaseTick: 0, showIdx: 0, playIdx: 0 };
            }
            // Ding on each new flavor pulse
            if (nextTick % step === 1) playBoop();
            return { ...cur, phaseTick: nextTick, showIdx };
          }
          case "simon-play": {
            // Player-driven; ticker just counts up for UI animation
            return { ...cur, phaseTick: nextTick };
          }
          case "simon-fail": {
            if (nextTick >= 60) {
              const penalty = 20;
              if (cur.bossOnAlien) {
                setAlienCoins((g) => {
                  const n = Math.max(0, g - penalty);
                  window.localStorage.setItem("scoopstack-alien-coins", n.toString());
                  return n;
                });
              } else {
                setEarthCoins((g) => {
                  const n = Math.max(0, g - penalty);
                  window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                  return n;
                });
              }
              pendingBossRef.current = false;
              setPhase("playing");
              return null;
            }
            return { ...cur, phaseTick: nextTick };
          }
          case "chase-tap": {
            const timeLeft = Math.max(0, cur.chaseTimeLeft - 40);
            if (cur.chaseProgress >= cur.chaseTarget) {
              return { ...cur, phase: "caught", phaseTick: 0, chaseTimeLeft: timeLeft };
            }
            if (timeLeft <= 0) {
              return { ...cur, phase: "escaped", phaseTick: 0, chaseTimeLeft: 0 };
            }
            return { ...cur, phaseTick: nextTick, chaseTimeLeft: timeLeft };
          }
          case "caught": {
            if (nextTick >= 70) {
              const reward = cur.orderMoney + 100; // unpaid bill + bounty
              playCoinSound();
              if (cur.bossOnAlien) {
                setAlienCoins((g) => {
                  const n = g + reward;
                  window.localStorage.setItem("scoopstack-alien-coins", n.toString());
                  return n;
                });
              } else {
                setEarthCoins((g) => {
                  const n = g + reward;
                  window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                  return n;
                });
              }
              setCustomersServed((c) => c + 1);
              pendingBossRef.current = false;
              setPhase("playing");
              return null;
            }
            return { ...cur, phaseTick: nextTick };
          }
          case "escaped": {
            if (nextTick >= 70) {
              const penalty = 40;
              if (cur.bossOnAlien) {
                setAlienCoins((g) => {
                  const n = Math.max(0, g - penalty);
                  window.localStorage.setItem("scoopstack-alien-coins", n.toString());
                  return n;
                });
              } else {
                setEarthCoins((g) => {
                  const n = Math.max(0, g - penalty);
                  window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                  return n;
                });
              }
              pendingBossRef.current = false;
              setPhase("playing");
              return null;
            }
            return { ...cur, phaseTick: nextTick };
          }
        }
      });
    }, 40);
    return () => clearInterval(interval);
  }, [phase, bossFight]);

  // Sarah's World driver — Julia advances, timer ticks, win/lose transitions.
  useEffect(() => {
    if (phase !== "sarahs-world" || !sarahsWorld) return;
    const interval = setInterval(() => {
      setSarahsWorld((cur) => {
        if (!cur) return cur;
        if (cur.phase !== "play") {
          const nextPhaseTick = cur.phaseTick + 1;
          if (nextPhaseTick >= 60) {
            // Credit reward / small participation bonus, then return to arcade panel
            const reward = cur.phase === "won"
              ? 150
              : Math.max(0, cur.tileCount * 5);
            setArcadeHighScores((prev) => {
              const best = prev["sarahs-world"] ?? 0;
              return cur.tileCount > best ? { ...prev, "sarahs-world": cur.tileCount } : prev;
            });
            if (reward > 0) {
              playCoinSound();
              setEarthCoins((g) => {
                const n = g + reward;
                window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                return n;
              });
            }
            setPhase(sarahsWorldReturnRef.current);
            return null;
          }
          return { ...cur, phaseTick: nextPhaseTick };
        }
        const tick = cur.tick + 1;
        const shooCooldown = Math.max(0, cur.shooCooldown - 40);
        // Julia advances ~12 px/s toward the tower
        let juliaX = cur.juliaX + 0.48;
        let tileCount = cur.tileCount;
        // Julia reaches the tower base around x=56 — knocks down 3 tiles and resets
        if (juliaX >= 56) {
          juliaX = 16;
          tileCount = Math.max(0, tileCount - 3);
          playWrong();
        }
        const timeLeft = Math.max(0, cur.timeLeft - 40);
        // Win / lose transitions
        if (tileCount >= cur.target) {
          playCoinSound();
          return { ...cur, tick, tileCount, juliaX, shooCooldown, timeLeft, phase: "won", phaseTick: 0 };
        }
        if (timeLeft <= 0) {
          return { ...cur, tick, tileCount, juliaX, shooCooldown, timeLeft, phase: "lost", phaseTick: 0 };
        }
        return { ...cur, tick, tileCount, juliaX, shooCooldown, timeLeft };
      });
    }, 40);
    return () => clearInterval(interval);
  }, [phase, sarahsWorld]);

  // Player tap during a boss fight — only counts during the "tap" phase.
  // During simon-play, each flavor tap must match order[playIdx].
  // Correct = advance; if that was the last one, serve + chase. Wrong = simon-fail.
  const handleSimonFlavor = useCallback((flavorName: string) => {
    setBossFight((cur) => {
      if (!cur || cur.phase !== "simon-play") return cur;
      if (flavorName === cur.order[cur.playIdx]) {
        playBoop();
        const nextIdx = cur.playIdx + 1;
        if (nextIdx >= cur.order.length) {
          // Order complete -> boss bolts; snap into chase-tap
          playCoinSound();
          return {
            ...cur,
            phase: "chase-tap",
            phaseTick: 0,
            chaseProgress: 0,
            chaseTimeLeft: cur.chaseTotalTime,
            playIdx: nextIdx,
          };
        }
        return { ...cur, playIdx: nextIdx };
      }
      playWrong();
      setShakeTick(10);
      return { ...cur, phase: "simon-fail", phaseTick: 0 };
    });
  }, []);

  // Player mashes the CHASE button — advance the progress bar by one tap.
  const handleBossTap = useCallback(() => {
    setBossFight((cur) => {
      if (!cur || cur.phase !== "chase-tap") return cur;
      playBoop();
      return { ...cur, chaseProgress: cur.chaseProgress + 1 };
    });
  }, []);

  // Chase driver — move minions and check end condition (all caught or timer
  // expires) from inside the setInterval callback (not in effect body).
  useEffect(() => {
    if (phase !== "chase") return;
    const interval = setInterval(() => {
      setChaseTick((t) => t + 1);
      setChaseMinions((prev) => {
        const moved = prev.map((m) => {
          if (m.caught) return m;
          let nx = m.x + m.vx;
          if (nx > W + 10) nx = -10;
          return { ...m, x: nx };
        });
        const allCaught = moved.length > 0 && moved.every((m) => m.caught);
        // Read the latest tick via a setter callback to avoid stale closure
        setChaseTick((t) => {
          const timerExpired = t >= 300;
          if (allCaught || timerExpired) {
            const caughtCount = moved.filter((m) => m.caught).length;
            const reward = caughtCount * 25;
            if (reward > 0) {
              playCoinSound();
              if (location === "alien-planet") {
                setAlienCoins((g) => {
                  const n = g + reward;
                  window.localStorage.setItem("scoopstack-alien-coins", n.toString());
                  return n;
                });
              } else {
                setEarthCoins((g) => {
                  const n = g + reward;
                  window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                  return n;
                });
              }
            }
            clearInterval(interval);
            setChaseMinions([]);
            
            chaseResumeRef.current = null;
            setPhase("playing");
            return 0;
          }
          return t;
        });
        return moved;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [phase, location]);

  // Chase canvas tap handler — catch a minion
  const handleChaseTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      setChaseMinions((prev) => {
        let caughtAny = false;
        const next = prev.map((m) => {
          if (m.caught) return m;
          if (Math.abs(m.x - gx) < 7 && Math.abs(m.y - gy) < 10) {
            caughtAny = true;
            return { ...m, caught: true };
          }
          return m;
        });
        if (caughtAny) playCoinSound();
        return next;
      });
    },
    []
  );

  // Warp drive — triggered from the UI during a journey cutscene.
  const handleWarp = useCallback(() => {
    if (phase !== "cutscene") return;
    if (cutsceneType !== "journey-out" && cutsceneType !== "journey-back") return;
    if (warpActive) return;
    playDing();
    setWarpActive(true);
    setWarpTick(0);
  }, [phase, cutsceneType, warpActive]);

  // Warp animation driver — stretched-star animation then transitions to landing
  // (with a 25% chance to detour into the dinosaur timeline instead).
  useEffect(() => {
    if (!warpActive) return;
    const interval = setInterval(() => {
      setWarpTick((t) => {
        const next = t + 1;
        if (next >= 80) {
          // End warp
          setWarpActive(false);
          const isOut = cutsceneType === "journey-out";
          if (Math.random() < 0.25) {
            // surprise! dinosaur timeline detour
            setFlag(getDestinationUnlockFlag("dino-timeline"));
            setBlackholeReturnTo(isOut ? "alien" : "earth");
            setBlackholeBonus(0);
            setBlackholeMessage(null);
            setCutsceneType(null);
            setBlackholeScene("dino-intro");
            setBlackholeTick(0);
            setPhase("blackhole");
          } else {
            setCutsceneType(isOut ? "landing-alien" : "landing-earth");
            setCutsceneTick(0);
          }
          return 0;
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [warpActive, cutsceneType, setFlag]);

  // Pick a dialogue that hasn't been seen recently
  const pickDialogue = useCallback((target: "customer" | "scoopy") => {
    const pool = target === "scoopy"
      ? (location === "alien-planet" ? ZORP_DIALOGUES : SCOOPY_DIALOGUES)
      : (location === "alien-planet" ? ALIEN_CUSTOMER_DIALOGUES : CUSTOMER_DIALOGUES);
    const seen = chatHistoryRef.current[target];
    const unseen = pool.map((_, i) => i).filter((i) => !seen.includes(i));
    const idx = unseen.length > 0 ? pick(unseen) : Math.floor(Math.random() * pool.length);
    chatHistoryRef.current[target] = [...seen, idx].slice(-3);
    return pool[idx];
  }, [location]);

  // Spawn a handful of ambient passersby on the street (world coords)
  const seedStreetNpcs = useCallback((loc: Location) => {
    const worldW = streetWorldWidth(visibleShops(loc));
    const list: { id: number; x: number; spriteIdx: number; alien: boolean; dir: -1 | 1 }[] = [];
    const count = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        x: 16 + Math.random() * (worldW - 32),
        spriteIdx: Math.floor(Math.random() * 6),
        alien: loc === "alien-planet",
        dir: Math.random() > 0.5 ? 1 : -1,
      });
    }
    setStreetNpcs(list);
  }, [visibleShops]);

  // Door tap: open the fork panel (Ship vs Shops). For first-time use the
  // door is only enabled after the player has visited the alien planet at least once.
  const handleDoorTap = useCallback(() => {
    if (phase !== "playing") return;
    if (chatActive) return;
    playDing();
    setDoorOfferActive(true);
  }, [chatActive, phase]);

  // Fork action: take the ship (the existing bi-directional cutscene)
  const chooseShipFromDoor = useCallback(() => {
    if (!alienVisited) return; // can't take the ship until we've been shown the way
    playDing();
    setDoorOfferActive(false);
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    setCustomer(null);
    setScoopsDone(0); setConeScoops([]); setToppingsDone(0); setToppingsPhase(false);
    if (location === "earth") {
      setCutsceneType("beam-up");
    } else {
      setCutsceneType("earth-departure");
    }
    setShipInteriorReturn("playing");
    setShipRoomMessage(null);
    setCutsceneTick(0);
    setPhase("cutscene");
  }, [alienVisited, location]);

  const exploreShipDuringJourney = useCallback(() => {
    if (phase !== "cutscene") return;
    if (cutsceneType !== "journey-out" && cutsceneType !== "journey-back") return;
    playDing();
    setShipInteriorReturn("cutscene");
    setShipRoom("cockpit");
    setSelectedSpaceDestination(cutsceneType === "journey-out" ? "alien-planet" : "earth");
    setSpaceMapMessage(null);
    setShipRoomMessage({ title: "Cockpit", body: "The flight path glows." });
    setPhase("ship-interior");
  }, [phase, cutsceneType]);

  // Fork action: walk to shops (enter street phase for the current planet)
  const chooseShopsFromDoor = useCallback(() => {
    playDing();
    setDoorOfferActive(false);
    if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
    setCustomer(null);
    setScoopsDone(0); setConeScoops([]); setToppingsDone(0); setToppingsPhase(false);
    setHeroX(30);
    seedStreetNpcs(location);
    setStreetTick(0);
    setPhase("street");
  }, [location, seedStreetNpcs]);

  const exitShipInterior = useCallback(() => {
    playBoop();
    setShipRoomMessage(null);
    if (
      shipInteriorReturn === "cutscene" &&
      (cutsceneType === "journey-out" || cutsceneType === "journey-back")
    ) {
      setPhase("cutscene");
      return;
    }
    setShipInteriorReturn("playing");
    setPhase("playing");
  }, [cutsceneType, shipInteriorReturn]);

  const openSpaceMap = useCallback(() => {
    playDing();
    const destination =
      cutsceneType === "journey-out" ? "alien-planet" :
      cutsceneType === "journey-back" ? "earth" :
      location;
    setSelectedSpaceDestination(destination);
    setSpaceMapMessage(null);
    setShipRoomMessage(null);
    setPhase("space-map");
  }, [cutsceneType, location]);

  const moveShipRoom = useCallback((dir: "left" | "right") => {
    const next = SHIP_ROOMS[shipRoom].exits[dir];
    if (!next) {
      playWrong();
      return;
    }
    playBoop();
    setShipRoom(next);
    setShipRoomMessage(SHIP_ROOM_DETAILS[next].inspect);
  }, [shipRoom]);

  const isDestinationUnlocked = useCallback(
    (dest: SpaceDestination) => {
      if (dest.id === "comet-carnival" && customersServed >= 25) return true;
      return dest.unlocked || !dest.unlockFlag || unlockFlags[dest.unlockFlag];
    },
    [customersServed, unlockFlags]
  );

  const travelToDestination = useCallback((dest: SpaceDestination) => {
    setSelectedSpaceDestination(dest.id);
    setShipRoomMessage(null);
    if (!isDestinationUnlocked(dest)) {
      playWrong();
      setSpaceMapMessage(`${dest.name} is still locked.`);
      return;
    }
    playDing();
    setSpaceMapMessage(null);
    const journeyTarget =
      cutsceneType === "journey-out" ? "alien-planet" :
      cutsceneType === "journey-back" ? "earth" :
      null;
    if (shipInteriorReturn === "cutscene" && journeyTarget && dest.id === journeyTarget) {
      setPhase("cutscene");
      return;
    }
    if (shipInteriorReturn === "cutscene" && journeyTarget && (dest.id === "earth" || dest.id === "alien-planet")) {
      setSpaceMapMessage(`Finish this flight to ${journeyTarget === "earth" ? "Earth" : "Alien Planet"} first.`);
      return;
    }
    if (dest.id === "earth") {
      if (location === "earth") {
        setPhase("playing");
        return;
      }
      setCutsceneType("earth-departure");
      setCutsceneTick(0);
      setPhase("cutscene");
      return;
    }
    if (dest.id === "alien-planet") {
      if (location === "alien-planet") {
        setPhase("playing");
        return;
      }
      setCutsceneType("beam-up");
      setCutsceneTick(0);
      setPhase("cutscene");
      return;
    }
    if (dest.id === "dino-timeline") {
      setFlag(getDestinationUnlockFlag("dino-timeline"));
      setBlackholeReturnTo(location === "alien-planet" ? "alien" : "earth");
      setBlackholeBonus(0);
      setBlackholeMessage(null);
      setBlackholeScene("dino-intro");
      setBlackholeTick(0);
      setCutsceneType(null);
      setPhase("blackhole");
      return;
    }
    setPhase("space-destination");
    setSpaceMapMessage(`${dest.name}: ${dest.description}`);
  }, [cutsceneType, isDestinationUnlocked, location, setFlag, shipInteriorReturn]);

  const closeDoorOffer = useCallback(() => {
    playBoop();
    setDoorOfferActive(false);
  }, []);

  // ── Street + Shop handlers ─────────────────────────────────────────────
  const persistInventory = useCallback((inv: Record<string, number>) => {
    try { window.localStorage.setItem("scoopstack-inventory", JSON.stringify(inv)); } catch { /* private mode etc. */ }
  }, []);

  const awardCoins = useCallback((amount: number, rewardLocation: Location = location) => {
    if (amount <= 0) return;
    if (rewardLocation === "alien-planet") {
      setAlienCoins((g) => {
        const n = g + amount;
        window.localStorage.setItem("scoopstack-alien-coins", n.toString());
        return n;
      });
    } else {
      setEarthCoins((g) => {
        const n = g + amount;
        window.localStorage.setItem("scoopstack-earth-coins", n.toString());
        return n;
      });
    }
  }, [location]);

  const grantInventoryItem = useCallback((itemId: string) => {
    setInventory((inv) => {
      const next = { ...inv, [itemId]: (inv[itemId] || 0) + 1 };
      persistInventory(next);
      return next;
    });
  }, [persistInventory]);

  const persistEquipped = useCallback((held: string | null, decor: string[]) => {
    try { window.localStorage.setItem("scoopstack-equipped", JSON.stringify({ held, decor })); } catch { /* */ }
  }, []);

  const startQuest = useCallback((id: QuestId) => {
    setQuests((prev) => prev[id] ? prev : { ...prev, [id]: { id, step: 0, complete: false } });
  }, []);

  const advanceQuest = useCallback((id: QuestId, stepIncrement = 1) => {
    setQuests((prev) => {
      const old = prev[id] ?? { id, step: 0, complete: false };
      return { ...prev, [id]: { ...old, step: old.step + stepIncrement } };
    });
  }, []);

  const bumpCharacterTalked = useCallback((characterId: CharacterId, lastChoice?: string) => {
    setCharacterMemory((prev) => {
      const old = prev[characterId] ?? { timesTalked: 0, affinity: 0, flags: {} };
      return {
        ...prev,
        [characterId]: {
          ...old,
          timesTalked: old.timesTalked + 1,
          lastChoice: lastChoice ?? old.lastChoice,
        },
      };
    });
  }, []);

  const applyDialogueEffects = useCallback((effects?: DialogueEffect[]) => {
    if (!effects) return;
    effects.forEach((effect) => {
      switch (effect.type) {
        case "set-flag":
          setFlag(effect.flag, effect.value);
          break;
        case "start-quest":
          startQuest(effect.questId);
          break;
        case "advance-quest":
          advanceQuest(effect.questId);
          break;
        case "unlock-destination":
          setFlag(getDestinationUnlockFlag(effect.destinationId));
          break;
        case "change-affinity":
          setCharacterMemory((prev) => {
            const old = prev[effect.characterId] ?? { timesTalked: 0, affinity: 0, flags: {} };
            return {
              ...prev,
              [effect.characterId]: { ...old, affinity: old.affinity + effect.amount },
            };
          });
          break;
        case "give-coins":
          if (effect.location === "alien-planet") {
            setAlienCoins((g) => {
              const n = g + effect.amount;
              window.localStorage.setItem("scoopstack-alien-coins", n.toString());
              return n;
            });
          } else {
            setEarthCoins((g) => {
              const n = g + effect.amount;
              window.localStorage.setItem("scoopstack-earth-coins", n.toString());
              return n;
            });
          }
          break;
        case "unlock-shop":
          setFlag(`shop-${effect.shopId}`);
          break;
      }
    });
  }, [advanceQuest, setFlag, startQuest]);

  const applyShopItemEffect = useCallback((effect?: ShopItemEffect) => {
    if (!effect) return;
    switch (effect.type) {
      case "set-flag":
        setFlag(effect.flag, effect.value);
        break;
      case "unlock-destination":
        setFlag(getDestinationUnlockFlag(effect.destinationId));
        break;
      case "unlock-flavor":
        setFlag(`flavor-${effect.flavorId}`);
        break;
      case "unlock-topping":
        setFlag(`topping-${effect.toppingId}`);
        break;
      case "visual-weather":
        setFlag(`weather-${effect.weather}`);
        break;
      case "give-glow-shards":
        setGlowShards((n) => n + effect.amount);
        break;
      case "tip-bonus":
        setFlag(`tip-bonus-${effect.amount}`);
        break;
    }
  }, [setFlag]);

  const toggleEquip = useCallback((item: ShopItem) => {
    if (!item.slot) return;
    playBoop();
    if (item.slot === "held") {
      const next = equippedHeld === item.id ? null : item.id;
      setEquippedHeld(next);
      persistEquipped(next, equippedDecor);
    } else if (item.slot === "decor") {
      const already = equippedDecor.includes(item.id);
      const next = already ? equippedDecor.filter((d) => d !== item.id) : [...equippedDecor, item.id];
      setEquippedDecor(next);
      persistEquipped(equippedHeld, next);
    }
  }, [equippedHeld, equippedDecor, persistEquipped]);

  // Enter a shop from the street
  const enterShop = useCallback((shopId: string) => {
    playDing();
    setCurrentShopId(shopId);
    setShopTab("buy");
    setShopFlash(null);
    setSlotMessage(null);
    setSlotSpinning(false);
    if (slotIntervalRef.current) { clearInterval(slotIntervalRef.current); slotIntervalRef.current = null; }
    if (shopId === "alien-arcade") {
      const shouldWakePixelRift = Boolean(unlockFlags["played-sarahs-world"]) && !unlockFlags["pixel-rift-unlocked"];
      setArcadeRoomX(42);
      arcadeDirRef.current = 0;
      setArcadeCabinetPreview(null);
      if (shouldWakePixelRift) {
        startQuest("ren-glitch-rivalry");
        advanceQuest("ren-glitch-rivalry");
        setFlag("pixel-rift-unlocked");
        setShopFlash("Ren's dream cabinet flickers awake: Pixel Rift!");
      } else if (!unlockFlags["played-sarahs-world"] && !unlockFlags["pixel-rift-unlocked"]) {
        setShopFlash("One cabinet is dreaming about Ren's Pixel Arcade.");
      }
      setPhase("arcade-room");
      return;
    }
    setPhase("shop");
  }, [advanceQuest, setFlag, startQuest, unlockFlags]);

  // Exit shop back to the street
  const exitShop = useCallback(() => {
    playBoop();
    setCurrentShopId(null);
    setShopFlash(null);
    setSlotMessage(null);
    setSlotSpinning(false);
    if (slotIntervalRef.current) { clearInterval(slotIntervalRef.current); slotIntervalRef.current = null; }
    setPhase("street");
  }, []);

  // Arcade: start Sarah's World
  const startSarahsWorld = useCallback(() => {
    playDing();
    sarahsWorldReturnRef.current = phase === "arcade-room" ? "arcade-room" : "shop";
    if (currentShopId === "pixel-arcade" || location === "earth") {
      setFlag("played-sarahs-world");
      startQuest("ren-glitch-rivalry");
    }
    setSarahsWorld({
      tick: 0,
      tileCount: 0,
      juliaX: 22,
      juliaMoving: true,
      shooCooldown: 0,
      timeLeft: 45000,
      target: 10,
      phase: "play",
      phaseTick: 0,
    });
    setPhase("sarahs-world");
  }, [currentShopId, location, phase, setFlag, startQuest]);

  // Sarah's World: stack a tile
  const handleStackTile = useCallback(() => {
    setSarahsWorld((cur) => {
      if (!cur || cur.phase !== "play") return cur;
      playBoop();
      return { ...cur, tileCount: cur.tileCount + 1 };
    });
  }, []);

  // Sarah's World: shoo Julia back (short cooldown)
  const handleShooJulia = useCallback(() => {
    setSarahsWorld((cur) => {
      if (!cur || cur.phase !== "play" || cur.shooCooldown > 0) return cur;
      playBoop();
      return { ...cur, juliaX: Math.max(12, cur.juliaX - 24), shooCooldown: 1200 };
    });
  }, []);

  // Exit Sarah's World back to the arcade panel (shop)
  const exitSarahsWorld = useCallback(() => {
    playBoop();
    setSarahsWorld(null);
    setPhase(sarahsWorldReturnRef.current);
  }, []);

  // Casino: pull the lever
  const handleSpin = useCallback(() => {
    const shop = currentShopId ? shopById(currentShopId) : null;
    if (!shop || shop.type !== "casino") return;
    if (slotSpinning) return;
    if (totalGold < 1) {
      playWrong();
      setSlotMessage("need at least 1G to spin!");
      return;
    }
    // Deduct the 1G bet up-front (from current-planet pot first, then spill)
    if (location === "alien-planet") {
      setAlienCoins((g) => {
        if (g > 0) {
          const n = g - 1;
          window.localStorage.setItem("scoopstack-alien-coins", n.toString());
          return n;
        }
        setEarthCoins((e) => {
          const n = Math.max(0, e - 1);
          window.localStorage.setItem("scoopstack-earth-coins", n.toString());
          return n;
        });
        return g;
      });
    } else {
      setEarthCoins((g) => {
        if (g > 0) {
          const n = g - 1;
          window.localStorage.setItem("scoopstack-earth-coins", n.toString());
          return n;
        }
        setAlienCoins((a) => {
          const n = Math.max(0, a - 1);
          window.localStorage.setItem("scoopstack-alien-coins", n.toString());
          return n;
        });
        return g;
      });
    }
    setSlotSpinning(true);
    setSlotMessage(null);
    playBoop();

    const symbols = shop.location === "alien-planet" ? SLOT_SYMBOLS_ALIEN : SLOT_SYMBOLS_EARTH;
    const payouts = shop.location === "alien-planet" ? SLOT_PAYOUTS_ALIEN : SLOT_PAYOUTS_EARTH;

    // Fast reel animation — three reels stop staggered
    let ticks = 0;
    const stopAt: [number, number, number] = [18, 26, 34]; // stop frames per reel
    slotIntervalRef.current = setInterval(() => {
      ticks += 1;
      setSlotReels(([r0, r1, r2]) => [
        ticks < stopAt[0] ? symbols[Math.floor(Math.random() * symbols.length)] : r0,
        ticks < stopAt[1] ? symbols[Math.floor(Math.random() * symbols.length)] : r1,
        ticks < stopAt[2] ? symbols[Math.floor(Math.random() * symbols.length)] : r2,
      ]);
      if (ticks >= stopAt[2]) {
        if (slotIntervalRef.current) { clearInterval(slotIntervalRef.current); slotIntervalRef.current = null; }
        // Final fair roll — use the frozen reels as-is (already random)
        setSlotReels(([a, b, c]) => {
          if (a === b && b === c) {
            const payout = payouts[a] ?? 5;
            if (shop.location === "alien-planet") {
              setAlienCoins((g) => {
                const n = g + payout;
                window.localStorage.setItem("scoopstack-alien-coins", n.toString());
                return n;
              });
            } else {
              setEarthCoins((g) => {
                const n = g + payout;
                window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                return n;
              });
            }
            setSlotMessage(`JACKPOT! Three ${a}! +${payout}G`);
            playCoinSound();
          } else {
            setSlotMessage("no match. -1G");
            playWrong();
          }
          return [a, b, c];
        });
        setSlotSpinning(false);
      }
    }, 55);
  }, [currentShopId, slotSpinning, totalGold, location]);

  // Exit street back to home (re-enter own scoop shop)
  const exitStreet = useCallback(() => {
    playBoop();
    setStreetNpcs([]);
    setPhase("playing");
  }, []);

  // Buy an item: deduct coins, add to inventory
  const buyItem = useCallback((item: ShopItem) => {
    const have = totalGold;
    if (have < item.price) {
      playWrong();
      setShopFlash(`need ${item.price - have} more G!`);
      return;
    }
    playCoinSound();
    // Prefer deducting from current-location coins first, then the other pot
    if (location === "alien-planet") {
      setAlienCoins((g) => {
        const fromAlien = Math.min(g, item.price);
        const rest = item.price - fromAlien;
        if (rest > 0) {
          setEarthCoins((e) => {
            const n = Math.max(0, e - rest);
            window.localStorage.setItem("scoopstack-earth-coins", n.toString());
            return n;
          });
        }
        const n = g - fromAlien;
        window.localStorage.setItem("scoopstack-alien-coins", n.toString());
        return n;
      });
    } else {
      setEarthCoins((g) => {
        const fromEarth = Math.min(g, item.price);
        const rest = item.price - fromEarth;
        if (rest > 0) {
          setAlienCoins((a) => {
            const n = Math.max(0, a - rest);
            window.localStorage.setItem("scoopstack-alien-coins", n.toString());
            return n;
          });
        }
        const n = g - fromEarth;
        window.localStorage.setItem("scoopstack-earth-coins", n.toString());
        return n;
      });
    }
    setInventory((inv) => {
      const next = { ...inv, [item.id]: (inv[item.id] || 0) + 1 };
      persistInventory(next);
      return next;
    });
    applyShopItemEffect(item.effect);
    if (item.id === "galactic-postcard") startQuest("penpal-tina-blorp");
    setShopFlash(item.effect ? `Bought ${item.name}! New discovery unlocked.` : `Bought ${item.name}! +1`);
  }, [totalGold, location, persistInventory, applyShopItemEffect, startQuest]);

  // Return an item: refund coins to the shop's planet, remove from inventory
  const returnItem = useCallback((item: ShopItem) => {
    if (!inventory[item.id] || inventory[item.id] <= 0) return;
    playCoinSound();
    if (location === "alien-planet") {
      setAlienCoins((g) => {
        const n = g + item.price;
        window.localStorage.setItem("scoopstack-alien-coins", n.toString());
        return n;
      });
    } else {
      setEarthCoins((g) => {
        const n = g + item.price;
        window.localStorage.setItem("scoopstack-earth-coins", n.toString());
        return n;
      });
    }
    setInventory((inv) => {
      const n = (inv[item.id] || 0) - 1;
      const copy = { ...inv };
      if (n <= 0) delete copy[item.id];
      else copy[item.id] = n;
      persistInventory(copy);
      // If we just sold our only copy of an equipped item, unequip it
      if ((copy[item.id] || 0) === 0) {
        if (equippedHeld === item.id) {
          setEquippedHeld(null);
          persistEquipped(null, equippedDecor);
        }
        if (equippedDecor.includes(item.id)) {
          const nextDecor = equippedDecor.filter((d) => d !== item.id);
          setEquippedDecor(nextDecor);
          persistEquipped(equippedHeld === item.id ? null : equippedHeld, nextDecor);
        }
      }
      return copy;
    });
    setShopFlash(`Returned ${item.name}. +${item.price}G`);
  }, [inventory, location, persistInventory, equippedHeld, equippedDecor, persistEquipped]);

  // Hero walk buttons (handled via held-down d-pad buttons)
  // The street tick drives ambient NPC movement and hero walking animation.
  useEffect(() => {
    if (phase !== "street") return;
    const worldW = streetWorldWidth(visibleShops(location));
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      if (heroDirRef.current !== 0) {
        setHeroX((x) => Math.max(8, Math.min(worldW - 8, x + heroDirRef.current * 1.2)));
      }
      setStreetNpcs((prev) => prev.map((n) => {
        let nx = n.x + n.dir * 0.4;
        let dir = n.dir;
        if (nx < 8) { nx = 8; dir = 1 as const; }
        if (nx > worldW - 8) { nx = worldW - 8; dir = -1 as const; }
        return { ...n, x: nx, dir };
      }));
    }, 40);
    return () => clearInterval(interval);
  }, [phase, location, visibleShops]);

  // Tap handler for the street canvas — route to the correct shop or NPC
  const handleStreetTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (chatActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;

      // NPC tap (sprite drawn around y=82, width ~14)
      if (gy > 70 && gy < 96) {
        for (const n of streetNpcs) {
          if (Math.abs(gx - n.x) < 8) {
            playBoop();
            setChatTarget("customer");
            setChatDialogue(pickDialogue("customer"));
            setChatNodeIdx(0);
            setChatActive(true);
            return;
          }
        }
      }

      // Convert tap to world coords (account for camera scroll)
      const shops = visibleShops(location);
      const cameraX = streetCameraX(heroX, shops);
      const worldGx = gx + cameraX;
      if (location === "alien-planet" && alienLadderUnlocked && gy >= 70 && gy <= 102) {
        const ladderX = alienLadderWorldX(shops);
        if (Math.abs(worldGx - ladderX) <= 12) {
          playDing();
          setUndergroundX(26);
          undergroundDirRef.current = 0;
          setCollectedUndergroundCrystals([]);
          setPhase("alien-underground");
          return;
        }
      }
      for (let i = 0; i < shops.length; i++) {
        const bxWorld = STREET_MARGIN + i * (STREET_SHOP_W + STREET_GAP);
        if (worldGx >= bxWorld && worldGx <= bxWorld + STREET_SHOP_W && gy >= 11 && gy <= 76) {
          enterShop(shops[i].id);
          return;
        }
      }
    },
    [chatActive, streetNpcs, location, pickDialogue, enterShop, heroX, visibleShops, alienLadderUnlocked]
  );

  useEffect(() => {
    if (phase !== "alien-underground") return;
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      if (undergroundDirRef.current !== 0) {
        setUndergroundX((x) => Math.max(12, Math.min(UNDERGROUND_W - 12, x + undergroundDirRef.current * 1.25)));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [phase]);

  const exitAlienUnderground = useCallback(() => {
    playBoop();
    undergroundDirRef.current = 0;
    setPhase("street");
  }, []);

  useEffect(() => {
    if (phase !== "alien-underground") return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") undergroundDirRef.current = -1;
      if (e.key === "ArrowRight") undergroundDirRef.current = 1;
      if (e.key === "Escape") exitAlienUnderground();
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" && undergroundDirRef.current === -1) || (e.key === "ArrowRight" && undergroundDirRef.current === 1)) {
        undergroundDirRef.current = 0;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      undergroundDirRef.current = 0;
    };
  }, [phase, exitAlienUnderground]);

  const collectUndergroundCrystal = useCallback((crystalId: number) => {
    setCollectedUndergroundCrystals((prev) => {
      if (prev.includes(crystalId)) return prev;
      playCoinSound();
      setGlowShards((count) => count + 1);
      return [...prev, crystalId];
    });
  }, []);

  const handleUndergroundTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      const cameraX = undergroundCameraX(undergroundX);
      const worldGx = gx + cameraX;

      if (worldGx <= 34 && gy >= 20 && gy <= 90) {
        exitAlienUnderground();
        return;
      }

      const crystal = UNDERGROUND_CRYSTALS.find((c) =>
        !collectedUndergroundCrystals.includes(c.id) &&
        Math.abs(worldGx - c.x) <= 12 &&
        Math.abs(gy - c.y) <= 14
      );
      if (crystal) collectUndergroundCrystal(crystal.id);
    },
    [undergroundX, collectedUndergroundCrystals, collectUndergroundCrystal, exitAlienUnderground]
  );

  // Alien Arcade room movement
  useEffect(() => {
    if (phase !== "arcade-room") return;
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      if (arcadeDirRef.current !== 0) {
        setArcadeRoomX((x) => Math.max(14, Math.min(ARCADE_ROOM_W - 14, x + arcadeDirRef.current * 1.4)));
      }
    }, 40);
    return () => clearInterval(interval);
  }, [phase]);

  const exitArcadeRoom = useCallback(() => {
    playBoop();
    setArcadeCabinetPreview(null);
    arcadeDirRef.current = 0;
    setCurrentShopId(null);
    setPhase("street");
  }, []);

  useEffect(() => {
    if (phase !== "arcade-room") return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") arcadeDirRef.current = -1;
      if (e.key === "ArrowRight") arcadeDirRef.current = 1;
      if (e.key === "Escape") exitArcadeRoom();
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" && arcadeDirRef.current === -1) || (e.key === "ArrowRight" && arcadeDirRef.current === 1)) {
        arcadeDirRef.current = 0;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      arcadeDirRef.current = 0;
    };
  }, [phase, exitArcadeRoom]);

  const recordArcadeScore = useCallback((gameId: ArcadeGameId, scoreValue: number) => {
    setArcadeHighScores((prev) => {
      const best = prev[gameId] ?? 0;
      return scoreValue > best ? { ...prev, [gameId]: scoreValue } : prev;
    });
  }, []);

  const startMeteorMeltdown = useCallback(() => {
    playDing();
    setShopFlash(null);
    setArcadeCabinetPreview(null);
    setSlimeSimon(null);
    setMeteorMeltdown({
      score: 0,
      timeLeft: 30000,
      lives: 3,
      meteors: [],
      nextId: 1,
      phase: "play",
      message: "Zap the falling meteors.",
    });
    setPhase("meteor-meltdown");
  }, []);

  const startSlimeSimon = useCallback(() => {
    playDing();
    setShopFlash(null);
    setArcadeCabinetPreview(null);
    setMeteorMeltdown(null);
    setSlimeSimon({
      sequence: [Math.floor(Math.random() * SLIME_SIMON_PADS.length)],
      showIdx: 0,
      playIdx: 0,
      round: 1,
      score: 0,
      phase: "show",
      flashIdx: null,
      message: "Watch the slime pattern.",
    });
    setPhase("slime-simon");
  }, []);

  const startMoonMaze = useCallback(() => {
    playDing();
    setShopFlash(null);
    setArcadeCabinetPreview(null);
    setMeteorMeltdown(null);
    setSlimeSimon(null);
    setUfoClaw(null);
    setPixelRift(null);
    setMoonMaze({
      player: { ...MOON_MAZE_START },
      enemies: MOON_MAZE_ENEMIES.map((enemy) => ({ ...enemy })),
      exit: { ...MOON_MAZE_EXIT },
      moves: 0,
      phase: "play",
      message: "Reach the glowing exit.",
    });
    setPhase("moon-maze");
  }, []);

  const pickUfoPrize = useCallback((): UfoClawPrize => {
    const roll = Math.random();
    if (roll > 0.9) return UFO_CLAW_PRIZES[3];
    if (roll > 0.68) return UFO_CLAW_PRIZES[2];
    return UFO_CLAW_PRIZES[Math.floor(Math.random() * 2)];
  }, []);

  const startUfoClaw = useCallback(() => {
    playDing();
    setShopFlash(null);
    setArcadeCabinetPreview(null);
    setMeteorMeltdown(null);
    setSlimeSimon(null);
    setMoonMaze(null);
    setPixelRift(null);
    setUfoClaw({
      prize: pickUfoPrize(),
      prizeX: 24 + Math.random() * 80,
      prizeDir: Math.random() > 0.5 ? 1 : -1,
      clawX: W / 2,
      clawY: 24,
      phase: "aim",
      won: false,
      message: "Time the drop.",
    });
    setPhase("ufo-claw");
  }, [pickUfoPrize]);

  const startPixelRift = useCallback(() => {
    playDing();
    setShopFlash(null);
    setArcadeCabinetPreview(null);
    setMeteorMeltdown(null);
    setSlimeSimon(null);
    setMoonMaze(null);
    setUfoClaw(null);
    setPixelRift({
      score: 0,
      timeLeft: 20000,
      targetLane: Math.floor(Math.random() * PIXEL_RIFT_LANES.length),
      phase: "play",
      message: "Tap the glowing dream lane.",
    });
    setPhase("pixel-rift");
  }, []);

  const exitArcadeGame = useCallback(() => {
    playBoop();
    setMeteorMeltdown(null);
    setSlimeSimon(null);
    setMoonMaze(null);
    setUfoClaw(null);
    setPixelRift(null);
    setArcadeCabinetPreview(null);
    setPhase("arcade-room");
  }, []);

  const playArcadeCabinet = useCallback((gameId: ArcadeGameId) => {
    const cabinet = ALIEN_ARCADE_CABINETS.find((c) => c.id === gameId);
    if (cabinet?.unlockFlag && !unlockFlags[cabinet.unlockFlag]) {
      playWrong();
      setShopFlash("That cabinet is still dreaming.");
      return;
    }
    if (gameId === "sarahs-world") {
      setArcadeCabinetPreview(null);
      startSarahsWorld();
      return;
    }
    if (gameId === "meteor-meltdown") {
      startMeteorMeltdown();
      return;
    }
    if (gameId === "slime-simon") {
      startSlimeSimon();
      return;
    }
    if (gameId === "moon-maze") {
      startMoonMaze();
      return;
    }
    if (gameId === "ufo-claw") {
      startUfoClaw();
      return;
    }
    if (gameId === "pixel-rift") {
      startPixelRift();
    }
  }, [startSarahsWorld, startMeteorMeltdown, startSlimeSimon, startMoonMaze, startUfoClaw, startPixelRift, unlockFlags]);

  useEffect(() => {
    if (phase !== "meteor-meltdown" || meteorMeltdown?.phase !== "play") return;
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      setMeteorMeltdown((cur) => {
        if (!cur || cur.phase !== "play") return cur;
        const timeLeft = Math.max(0, cur.timeLeft - 80);
        let lives = cur.lives;
        let nextId = cur.nextId;
        let meteors = cur.meteors
          .map((m) => ({ ...m, y: m.y + m.vy }))
          .filter((m) => {
            const landed = m.y + m.size >= 87;
            if (landed) lives -= 1;
            return !landed;
          });

        const spawnChance = Math.min(0.44, 0.18 + cur.score * 0.003);
        if (Math.random() < spawnChance) {
          const size = 3 + Math.floor(Math.random() * 3);
          meteors = [
            ...meteors,
            {
              id: nextId,
              x: 8 + Math.random() * (W - 16),
              y: -6,
              vy: 0.8 + Math.random() * 1.2 + cur.score * 0.004,
              size,
              color: ["#FF8050", "#FFB040", "#D85070"][nextId % 3],
            },
          ];
          nextId += 1;
        }

        if (lives <= 0 || timeLeft <= 0) {
          const reward = Math.floor(cur.score / 10);
          if (reward > 0) {
            awardCoins(reward, "alien-planet");
            playCoinSound();
          }
          if (cur.score >= 200) {
            setFlag("star-chip-cabinet-sticker");
          }
          return {
            ...cur,
            timeLeft,
            lives: Math.max(0, lives),
            meteors,
            nextId,
            phase: "done",
            message: reward > 0 ? `Score ${cur.score}  +${reward}G` : `Score ${cur.score}`,
          };
        }

        return { ...cur, timeLeft, lives, meteors, nextId };
      });
    }, 80);
    return () => clearInterval(interval);
  }, [awardCoins, phase, meteorMeltdown?.phase, setFlag]);

  useEffect(() => {
    if (phase !== "slime-simon") return;
    const interval = setInterval(() => setStreetTick((t) => t + 1), 80);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "slime-simon" || !slimeSimon || slimeSimon.phase !== "show") return;
    const timeout = setTimeout(() => {
      setSlimeSimon((cur) => {
        if (!cur || cur.phase !== "show") return cur;
        if (cur.showIdx >= cur.sequence.length) {
          return { ...cur, phase: "play", playIdx: 0, flashIdx: null, message: "Your turn. Repeat it!" };
        }
        return {
          ...cur,
          flashIdx: cur.sequence[cur.showIdx],
          showIdx: cur.showIdx + 1,
          message: "Watch the slime pattern.",
        };
      });
    }, slimeSimon.showIdx === 0 && slimeSimon.flashIdx === null ? 350 : 650);
    return () => clearTimeout(timeout);
  }, [phase, slimeSimon]);

  useEffect(() => {
    if (phase !== "slime-simon" || slimeSimon?.phase !== "play" || slimeSimon.flashIdx === null) return;
    const timeout = setTimeout(() => {
      setSlimeSimon((cur) => cur && cur.phase === "play" ? { ...cur, flashIdx: null } : cur);
    }, 180);
    return () => clearTimeout(timeout);
  }, [phase, slimeSimon?.phase, slimeSimon?.flashIdx]);

  const handleMeteorMeltdownTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      playBoop();
      setMeteorMeltdown((cur) => {
        if (!cur || cur.phase !== "play") return cur;
        let hit: ArcadeMeteor | null = null;
        for (let i = cur.meteors.length - 1; i >= 0; i--) {
          const m = cur.meteors[i];
          const dx = gx - m.x;
          const dy = gy - m.y;
          if (dx * dx + dy * dy <= (m.size + 6) * (m.size + 6)) {
            hit = m;
            break;
          }
        }
        if (!hit) return cur;
        const points = Math.max(5, 18 - hit.size * 2);
        const nextScore = cur.score + points;
        recordArcadeScore("meteor-meltdown", nextScore);
        return {
          ...cur,
          score: nextScore,
          meteors: cur.meteors.filter((m) => m.id !== hit?.id),
          message: `+${points}`,
        };
      });
    },
    [recordArcadeScore]
  );

  const handleSlimeSimonPad = useCallback((padIdx: number) => {
    setSlimeSimon((cur) => {
      if (!cur || cur.phase !== "play") return cur;
      const expected = cur.sequence[cur.playIdx];
      if (padIdx !== expected) {
        playWrong();
        return {
          ...cur,
          phase: "done",
          flashIdx: padIdx,
          message: `Oops. Score ${cur.score}`,
        };
      }

      const nextPlayIdx = cur.playIdx + 1;
      if (nextPlayIdx >= cur.sequence.length) {
        playCoinSound();
        const nextScore = cur.score + 1;
        awardCoins(20, "alien-planet");
        if (nextScore >= 5) {
          setFlag("topping-glow-worms-deluxe");
        }
        recordArcadeScore("slime-simon", nextScore);
        return {
          sequence: [...cur.sequence, Math.floor(Math.random() * SLIME_SIMON_PADS.length)],
          showIdx: 0,
          playIdx: 0,
          round: cur.round + 1,
          score: nextScore,
          phase: "show",
          flashIdx: padIdx,
          message: "Nice! Watch the next one.",
        };
      }

      playBoop();
      return {
        ...cur,
        playIdx: nextPlayIdx,
        flashIdx: padIdx,
        message: `${cur.sequence.length - nextPlayIdx} more`,
      };
    });
  }, [awardCoins, recordArcadeScore, setFlag]);

  const handleSlimeSimonCanvasTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      const padIdx = SLIME_SIMON_PADS.findIndex((pad) => Math.abs(gx - pad.x) <= 19 && Math.abs(gy - pad.y) <= 17);
      if (padIdx >= 0) handleSlimeSimonPad(padIdx);
    },
    [handleSlimeSimonPad]
  );

  const moveMoonMaze = useCallback((dx: number, dy: number) => {
    setMoonMaze((cur) => {
      if (!cur || cur.phase !== "play") return cur;
      const nx = cur.player.x + dx;
      const ny = cur.player.y + dy;
      if (moonMazeBlocked(nx, ny)) {
        playWrong();
        return { ...cur, message: "Moon wall bonk." };
      }
      const moves = cur.moves + 1;
      const hitEnemy = cur.enemies.some((enemy) => enemy.x === nx && enemy.y === ny);
      if (hitEnemy) {
        playWrong();
        return { ...cur, player: { x: nx, y: ny }, moves, phase: "lost", message: "Moon slime tagged you." };
      }
      if (nx === cur.exit.x && ny === cur.exit.y) {
        playCoinSound();
        awardCoins(80, "alien-planet");
        const scoreValue = Math.max(1, 100 - moves);
        recordArcadeScore("moon-maze", scoreValue);
        if (moves < 30 && !inventory["moon-maze-trophy"]) {
          grantInventoryItem("moon-maze-trophy");
          setFlag("moon-maze-trophy");
        }
        return {
          ...cur,
          player: { x: nx, y: ny },
          moves,
          phase: "won",
          message: moves < 30 ? "Clear! Trophy won. +80G" : "Clear! +80G",
        };
      }
      playBoop();
      return { ...cur, player: { x: nx, y: ny }, moves, message: "Keep gliding." };
    });
  }, [awardCoins, grantInventoryItem, inventory, recordArcadeScore, setFlag]);

  useEffect(() => {
    if (phase !== "moon-maze" || moonMaze?.phase !== "play") return;
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      setMoonMaze((cur) => {
        if (!cur || cur.phase !== "play") return cur;
        const enemies = cur.enemies.map((enemy) => {
          const nx = enemy.x + (enemy.dir === "h" ? enemy.step : 0);
          const ny = enemy.y + (enemy.dir === "v" ? enemy.step : 0);
          if (moonMazeBlocked(nx, ny)) return { ...enemy, step: (enemy.step * -1) as -1 | 1 };
          return { ...enemy, x: nx, y: ny };
        });
        if (enemies.some((enemy) => enemy.x === cur.player.x && enemy.y === cur.player.y)) {
          playWrong();
          return { ...cur, enemies, phase: "lost", message: "Moon slime caught you." };
        }
        return { ...cur, enemies };
      });
    }, 560);
    return () => clearInterval(interval);
  }, [phase, moonMaze?.phase]);

  const handleMoonMazeTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!moonMaze || moonMaze.phase !== "play") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      const cellX = Math.floor((gx - MOON_MAZE_ORIGIN.x) / MOON_MAZE_CELL);
      const cellY = Math.floor((gy - MOON_MAZE_ORIGIN.y) / MOON_MAZE_CELL);
      const dx = cellX - moonMaze.player.x;
      const dy = cellY - moonMaze.player.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) moveMoonMaze(dx, dy);
    },
    [moonMaze, moveMoonMaze]
  );

  const dropUfoClaw = useCallback(() => {
    setUfoClaw((cur) => {
      if (!cur || cur.phase !== "aim") return cur;
      playBoop();
      return { ...cur, phase: "drop", clawX: W / 2, clawY: 24, message: "Claw dropping!" };
    });
  }, []);

  const ufoClawPhase = ufoClaw?.phase;

  useEffect(() => {
    if (phase !== "ufo-claw" || !ufoClawPhase || ufoClawPhase === "done") return;
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      setUfoClaw((cur) => {
        if (!cur || cur.phase === "done") return cur;
        if (cur.phase === "aim") {
          let prizeX = cur.prizeX + cur.prizeDir * 1.8;
          let prizeDir = cur.prizeDir;
          if (prizeX < 22 || prizeX > W - 22) {
            prizeDir = (prizeDir * -1) as -1 | 1;
            prizeX = Math.max(22, Math.min(W - 22, prizeX));
          }
          return { ...cur, prizeX, prizeDir };
        }
        const clawY = cur.clawY + 5;
        if (clawY < 62) return { ...cur, clawY };
        const won = Math.abs(cur.clawX - cur.prizeX) <= 9;
        if (won) {
          playCoinSound();
          grantInventoryItem(cur.prize.id);
          recordArcadeScore("ufo-claw", (arcadeHighScores["ufo-claw"] ?? 0) + 1);
          if (cur.prize.id === "glitch-token") setFlag("glitch-token-won");
          if (cur.prize.id === "arcade-crown") setFlag("arcade-crown");
        } else {
          playWrong();
        }
        return {
          ...cur,
          clawY,
          phase: "done",
          won,
          message: won ? `Won ${cur.prize.name}!` : "So close. Try again.",
        };
      });
    }, 60);
    return () => clearInterval(interval);
  }, [arcadeHighScores, grantInventoryItem, phase, recordArcadeScore, setFlag, ufoClawPhase]);

  const handleUfoClawTap = useCallback(() => {
    dropUfoClaw();
  }, [dropUfoClaw]);

  const completePixelRift = useCallback((reason: string) => {
    setPixelRift((cur) => {
      if (!cur || cur.phase !== "play") return cur;
      const best = arcadeHighScores["pixel-rift"] ?? 0;
      const isNewBest = cur.score > best;
      if (isNewBest) {
        const reward = Math.max(20, Math.floor(cur.score / 2));
        awardCoins(reward, "alien-planet");
        recordArcadeScore("pixel-rift", cur.score);
        setFlag("pixel-rift-cleared");
        playCoinSound();
        return { ...cur, phase: "done", timeLeft: Math.max(0, cur.timeLeft), message: `${reason} New best! +${reward}G` };
      }
      playWrong();
      return { ...cur, phase: "done", timeLeft: Math.max(0, cur.timeLeft), message: `${reason} Score ${cur.score}` };
    });
  }, [arcadeHighScores, awardCoins, recordArcadeScore, setFlag]);

  useEffect(() => {
    if (phase !== "pixel-rift" || pixelRift?.phase !== "play") return;
    const interval = setInterval(() => {
      setStreetTick((t) => t + 1);
      setPixelRift((cur) => {
        if (!cur || cur.phase !== "play") return cur;
        const timeLeft = Math.max(0, cur.timeLeft - 120);
        if (timeLeft <= 0) {
          const best = arcadeHighScores["pixel-rift"] ?? 0;
          const isNewBest = cur.score > best;
          if (isNewBest) {
            const reward = Math.max(20, Math.floor(cur.score / 2));
            awardCoins(reward, "alien-planet");
            recordArcadeScore("pixel-rift", cur.score);
            setFlag("pixel-rift-cleared");
            playCoinSound();
            return { ...cur, timeLeft, phase: "done", message: `Time! New best +${reward}G` };
          }
          return { ...cur, timeLeft, phase: "done", message: `Time! Score ${cur.score}` };
        }
        return { ...cur, timeLeft };
      });
    }, 120);
    return () => clearInterval(interval);
  }, [arcadeHighScores, awardCoins, phase, pixelRift?.phase, recordArcadeScore, setFlag]);

  const handlePixelRiftLane = useCallback((laneIdx: number) => {
    setPixelRift((cur) => {
      if (!cur || cur.phase !== "play") return cur;
      if (laneIdx !== cur.targetLane) {
        setTimeout(() => completePixelRift("Wrong lane."), 0);
        return { ...cur, message: "Wrong lane!" };
      }
      playBoop();
      const nextScore = cur.score + 10;
      let targetLane = Math.floor(Math.random() * PIXEL_RIFT_LANES.length);
      if (targetLane === cur.targetLane) targetLane = (targetLane + 1) % PIXEL_RIFT_LANES.length;
      return {
        ...cur,
        score: nextScore,
        targetLane,
        message: nextScore % 50 === 0 ? "Rift combo!" : "Good signal.",
      };
    });
  }, [completePixelRift]);

  const handlePixelRiftTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!pixelRift || pixelRift.phase !== "play") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      const laneIdx = PIXEL_RIFT_LANES.findIndex((_, idx) => {
        const x = 18 + idx * 36;
        return gx >= x && gx <= x + 28 && gy >= 32 && gy <= 74;
      });
      if (laneIdx >= 0) handlePixelRiftLane(laneIdx);
    },
    [handlePixelRiftLane, pixelRift]
  );

  const handleArcadeRoomTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      const cameraX = arcadeCameraX(arcadeRoomX);
      const worldGx = gx + cameraX;
      if (gy >= 34 && gy <= 84) {
        const cabinet = ALIEN_ARCADE_CABINETS.find((c) => Math.abs(c.x + 11 - worldGx) <= 18);
        if (cabinet) {
          const unlocked = cabinet.unlocked || !cabinet.unlockFlag || unlockFlags[cabinet.unlockFlag];
          playBoop();
          setArcadeCabinetPreview(unlocked ? cabinet.id : null);
          setShopFlash(unlocked ? null : cabinet.id === "pixel-rift" ? "Pixel Rift is waiting for Ren's dream signal." : "That cabinet is still asleep.");
        }
      }
    },
    [arcadeRoomX, unlockFlags]
  );

  // Tap handler for the shop interior — route exit door tap, item slots, owner chat
  const handleShopTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (chatActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      // Exit door at right side
      if (gx >= W - 18 && gx <= W - 2 && gy >= 20 && gy <= 70) {
        exitShop();
        return;
      }
      const shop = currentShopId ? shopById(currentShopId) : null;
      if (shop && shop.type !== "casino" && shop.type !== "arcade") {
        const item = shop.items.find((_, i) => {
          const slot = shopItemDisplaySlot(i);
          return gx >= slot.x && gx <= slot.x + slot.w && gy >= slot.y && gy <= slot.y + slot.h;
        });
        if (item) {
          buyItem(item);
          return;
        }
      }
      // Owner (center)
      if (Math.abs(gx - 64) < 12 && gy > 50 && gy < 78) {
        if (shop) {
          playBoop();
          setChatTarget("customer");
          setChatDialogue([
            { speaker: "them", text: `${shop.ownerName}: ${shop.greeting}`, choiceA: { label: "Cool!", next: 1 }, choiceB: { label: "Any specials?", next: 1 } },
            { speaker: "them", text: "Tap an item on the counter to buy. Swap to INVENTORY to return anything." },
          ]);
          setChatNodeIdx(0);
          setChatActive(true);
        }
      }
    },
    [buyItem, chatActive, currentShopId, exitShop]
  );

  const handleShipInteriorTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (chatActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;

      const showMessage = (message: ShipRoomMessage) => {
        playBoop();
        setShipRoomMessage(message);
      };

      if (gy >= 27 && gy <= 44) {
        const body =
          cutsceneType === "journey-out" ? "Alien suns glitter ahead." :
          cutsceneType === "journey-back" ? "Earth shines like blue sherbet." :
          location === "alien-planet" ? "Three suns blink outside." :
          "Home lights twinkle below.";
        showMessage({ title: "Window", body });
        return;
      }

      if (shipRoom === "cockpit") {
        if (gx >= 48 && gx <= 80 && gy >= 56 && gy <= 74) {
          openSpaceMap();
          return;
        }
        if (gx >= 84 && gx <= 103 && gy >= 55 && gy <= 70) {
          showMessage({ title: "Nav Beacon", body: "The next jump is tuned." });
          return;
        }
      } else if (shipRoom === "galley") {
        if (gx >= 50 && gx <= 76 && gy >= 52 && gy <= 80) {
          showMessage({ title: "Ship Snack", body: "A Milky Way scoop chills." });
          return;
        }
        if (gx >= 84 && gx <= 114 && gy >= 56 && gy <= 72) {
          showMessage({ title: "Mixer", body: "It hums: vanilla plus starlight." });
          return;
        }
      } else if (shipRoom === "cargo") {
        if (gx >= 30 && gx <= 98 && gy >= 58 && gy <= 78) {
          const crateLines = [
            "This crate is full of yesterday.",
            "Postcards rattle inside.",
            "A tiny shop may be sleeping.",
          ];
          showMessage({ title: "Mysterious Crate", body: pick(crateLines) });
          return;
        }
      } else if (shipRoom === "engine") {
        if (gx >= 48 && gx <= 80 && gy >= 45 && gy <= 80) {
          const body = inventory["engine-sticker"] ? "Your sticker makes it brave." : "It wants an engine sticker.";
          showMessage({ title: "Engine Core", body });
          return;
        }
      } else if (shipRoom === "crew-pod") {
        if (gx >= 50 && gx <= 82 && gy >= 50 && gy <= 84) {
          setFlag(getDestinationUnlockFlag("star-nursery"));
          showMessage({ title: "Zarixa", body: "She hums a star lullaby." });
          return;
        }
      }

      showMessage(SHIP_ROOM_DETAILS[shipRoom].inspect);
    },
    [chatActive, cutsceneType, inventory, location, openSpaceMap, setFlag, shipRoom]
  );

  const handleSpaceMapTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (chatActive) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
      else                { clientX = e.clientX; clientY = e.clientY; }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;
      const dest = SPACE_DESTINATIONS.find((d) => Math.hypot(gx - d.x, gy - d.y) <= 9);
      if (dest) travelToDestination(dest);
    },
    [chatActive, travelToDestination]
  );

  // Canvas tap handler — detect character taps
  const handleCanvasTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (chatActive) return; // don't open another chat while one is active
      if (phase !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const gx = (clientX - rect.left) * scaleX;
      const gy = (clientY - rect.top) * scaleY;

      // Door: drawn at x = W - 18 .. W - 4, y = 20 .. 70. Tap to open fork (ship/shops).
      if (gx >= W - 18 && gx <= W - 2 && gy >= 20 && gy <= 70) {
        handleDoorTap();
        return;
      }

      // Check shopkeeper (drawn at x=64, y=70, body extends ~14px up)
      if (Math.abs(gx - 64) < 12 && gy > 50 && gy < 78) {
        playBoop();
        setChatTarget("scoopy");
        setChatDialogue(pickDialogue("scoopy"));
        setChatNodeIdx(0);
        setChatActive(true);
        return;
      }

      // Check customer (if waiting/served)
      if (customer && (customer.state === "waiting" || customer.state === "served")) {
        const cx = Math.round(customer.x);
        if (Math.abs(gx - cx) < 14 && gy > 58 && gy < 100) {
          playBoop();
          setChatTarget("customer");
          // Alien VIP after-service uses offer dialogue via completeOrder; casual taps use alien-customer pool
          if (customer.isAlienVIP) {
            setChatDialogue(ALIEN_CUSTOMER_DIALOGUES[0]);
          } else {
            setChatDialogue(pickDialogue("customer"));
          }
          setChatNodeIdx(0);
          setChatActive(true);
        }
      }
    },
    [chatActive, customer, phase, pickDialogue, handleDoorTap]
  );

  const handleChatChoice = useCallback((nextIdx: number) => {
    const node = chatDialogue[chatNodeIdx];
    const choice =
      node?.choiceA?.next === nextIdx ? node.choiceA :
      node?.choiceB?.next === nextIdx ? node.choiceB :
      undefined;
    applyDialogueEffects(choice?.effects);
    if (chatTarget === "scoopy") bumpCharacterTalked(location === "alien-planet" ? "zorp" : "scoopy", choice?.label);
    playBoop();
    if (nextIdx === 100) {
      // ACCEPT → beam-up cutscene (earth -> alien)
      setChatActive(false);
      setChatTarget(null);
      setCutsceneType("beam-up");
      setCutsceneTick(0);
      setPhase("cutscene");
      return;
    }
    if (nextIdx === 200) {
      // DECLINE → bye message then walk out
      setChatDialogue(ALIEN_BYE_DIALOGUE);
      setChatNodeIdx(0);
      return;
    }
    setChatNodeIdx(nextIdx);
  }, [applyDialogueEffects, bumpCharacterTalked, chatDialogue, chatNodeIdx, chatTarget, location]);

  const closeChat = useCallback(() => {
    applyDialogueEffects(chatDialogue[chatNodeIdx]?.effects);
    if (chatTarget === "scoopy") bumpCharacterTalked(location === "alien-planet" ? "zorp" : "scoopy");
    setChatActive(false);
    setChatTarget(null);
    // If the alien VIP is still there after bye, walk them out
    setCustomer((prev) => prev && prev.isAlienVIP ? { ...prev, state: "walking-out" } : prev);
  }, [applyDialogueEffects, bumpCharacterTalked, chatDialogue, chatNodeIdx, chatTarget, location]);

  // ── Cutscene driver ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "cutscene" || !cutsceneType) return;
    const tickMs = 40;
    // Duration thresholds per cutscene (in ticks)
    const endAt: Record<CutsceneType, number> = {
      "alien-arrival": 110,
      "beam-up": 100,
      "earth-departure": 100,
      "journey-out": 150,
      "journey-back": 150,
      "landing-alien": 100,
      "landing-earth": 100,
    };
    // Mid-journey tick where we roll the 50% black hole chance
    const blackholeRollTick = 60;
    const pilotOfferTick = 28;
    let blackholeRolled = false;
    let pilotOffered = false;
    const interval = setInterval(() => {
      // Pause tick advancement while an interactive offer is open
      if (pilotOfferRef.current || warpActive) return;
      setCutsceneTick((t) => {
        const next = t + 1;
        // Pilot offer (first time during any journey)
        if (!pilotOffered &&
            (cutsceneType === "journey-out" || cutsceneType === "journey-back") &&
            next === pilotOfferTick) {
          pilotOffered = true;
          pilotOfferRef.current = true;
          setPilotReturnTo(cutsceneType === "journey-out" ? "alien" : "earth");
          setPilotOfferActive(true);
          return t; // freeze tick here; decline resumes, accept moves to pilot phase
        }
        // 50% black hole intercept mid-journey
        if (!blackholeRolled &&
            (cutsceneType === "journey-out" || cutsceneType === "journey-back") &&
            next === blackholeRollTick &&
            Math.random() < 0.5) {
          blackholeRolled = true;
          clearInterval(interval);
          setBlackholeReturnTo(cutsceneType === "journey-out" ? "alien" : "earth");
          setBlackholeBonus(0);
          setBlackholeMessage(null);
          setCutsceneType(null);
          setBlackholeScene("pull-in");
          setBlackholeTick(0);
          setPhase("blackhole");
          return 0;
        }
        if (next >= endAt[cutsceneType]) {
          clearInterval(interval);
          if (cutsceneType === "alien-arrival") {
            customerIdRef.current += 1;
            setCustomer(createAlienVIP(customerIdRef.current));
            setCutsceneType(null);
            setPhase("playing");
          } else if (cutsceneType === "beam-up") {
            setCutsceneType("journey-out");
            return 0;
          } else if (cutsceneType === "earth-departure") {
            setCutsceneType("journey-back");
            return 0;
          } else if (cutsceneType === "journey-out") {
            setCutsceneType("landing-alien");
            return 0;
          } else if (cutsceneType === "journey-back") {
            setCutsceneType("landing-earth");
            return 0;
          } else if (cutsceneType === "landing-alien") {
            setLocation("alien-planet");
            setCutsceneType(null);
            setPhase("playing");
            setAlienVisited(true);
            window.localStorage.setItem("scoopstack-alien-visited", "1");
            setCustomer(null);
          } else if (cutsceneType === "landing-earth") {
            setLocation("earth");
            setCutsceneType(null);
            setPhase("playing");
            setCustomer(null);
          }
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [phase, cutsceneType, warpActive]);

  // ── Black hole ambient tick + auto-transitions ────────────────────────
  useEffect(() => {
    if (phase !== "blackhole" || !blackholeScene) return;
    const interval = setInterval(() => {
      setBlackholeTick((t) => {
        const next = t + 1;
        if (blackholeScene === "pull-in" && next >= 110) {
          // 30% chance to get flung to prehistoric Earth instead of the fork
          const nextScene: BlackholeScene = Math.random() < 0.3 ? "dino-intro" : "fork";
          if (nextScene === "dino-intro") setFlag(getDestinationUnlockFlag("dino-timeline"));
          setBlackholeScene(nextScene);
          return 0;
        }
        if (blackholeScene === "burst-out" && next >= 80) {
          clearInterval(interval);
          // Credit bonus coins to destination, then hand off to landing cutscene
          if (blackholeReturnTo === "alien") {
            setAlienCoins((g) => {
              const n = g + blackholeBonus;
              window.localStorage.setItem("scoopstack-alien-coins", n.toString());
              return n;
            });
            setCutsceneType("landing-alien");
          } else {
            setEarthCoins((g) => {
              const n = g + blackholeBonus;
              window.localStorage.setItem("scoopstack-earth-coins", n.toString());
              return n;
            });
            setCutsceneType("landing-earth");
          }
          setBlackholeScene(null);
          setCutsceneTick(0);
          setPhase("cutscene");
          return 0;
        }
        return next;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [phase, blackholeScene, blackholeReturnTo, blackholeBonus, setFlag]);

  // Pilot offer accepted: init minigame state and switch phase
  const acceptPilotOffer = useCallback(() => {
    playDing();
    pilotOfferRef.current = false;
    setPilotOfferActive(false);
    pilotResumeTickRef.current = cutsceneTick;
    pilotShipRef.current = { x: 64, y: 90 };
    pilotAsteroidsRef.current = [];
    pilotLasersRef.current = [];
    pilotInvulnRef.current = 0;
    pilotInputsRef.current = { left: false, right: false, up: false, down: false, fire: false };
    pilotLastFireRef.current = 0;
    pilotBonusRef.current = 0;
    setPilotTick(0);
    setPilotHits(0);
    setPilotLives(3);
    setPhase("pilot");
  }, [cutsceneTick]);

  const declinePilotOffer = useCallback(() => {
    playBoop();
    pilotOfferRef.current = false;
    setPilotOfferActive(false);
    // tick advancement resumes automatically on next interval fire
  }, []);

  // ── Pilot game loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "pilot") return;
    const tickMs = 40;
    const gameDuration = 450; // ~18s
    const interval = setInterval(() => {
      setPilotTick((t) => {
        const next = t + 1;
        const ship = pilotShipRef.current;
        const inputs = pilotInputsRef.current;

        // Move ship
        const speed = 1.6;
        if (inputs.left) ship.x = Math.max(6, ship.x - speed);
        if (inputs.right) ship.x = Math.min(W - 6, ship.x + speed);
        if (inputs.up) ship.y = Math.max(30, ship.y - speed);
        if (inputs.down) ship.y = Math.min(H - 6, ship.y + speed);

        // Fire laser (rate-limited)
        if (inputs.fire && next - pilotLastFireRef.current >= 6) {
          pilotLastFireRef.current = next;
          pilotIdRef.current += 1;
          pilotLasersRef.current.push({ id: pilotIdRef.current, x: ship.x, y: ship.y - 6 });
          playBoop();
        }

        // Spawn asteroids (rate accelerates over time)
        const spawnRate = Math.max(10, 28 - Math.floor(next / 30));
        if (next % spawnRate === 0) {
          pilotIdRef.current += 1;
          pilotAsteroidsRef.current.push({
            id: pilotIdRef.current,
            x: 8 + Math.random() * (W - 16),
            y: -6,
            vx: (Math.random() - 0.5) * 0.4,
            vy: 0.6 + Math.random() * 1.2,
            size: 3 + Math.floor(Math.random() * 4),
          });
        }

        // Advance lasers (upward)
        pilotLasersRef.current = pilotLasersRef.current
          .map((l) => ({ ...l, y: l.y - 3 }))
          .filter((l) => l.y > 12);

        // Advance asteroids
        pilotAsteroidsRef.current = pilotAsteroidsRef.current
          .map((a) => ({ ...a, x: a.x + a.vx, y: a.y + a.vy }))
          .filter((a) => a.y < H + 8 && a.x > -10 && a.x < W + 10);

        // Laser vs asteroid collisions
        const survivingAsteroids: Asteroid[] = [];
        const survivingLasers: Laser[] = [];
        const hitLaserIds = new Set<number>();
        for (const a of pilotAsteroidsRef.current) {
          let hit = false;
          for (const l of pilotLasersRef.current) {
            if (hitLaserIds.has(l.id)) continue;
            const dx = a.x - l.x;
            const dy = a.y - l.y;
            if (Math.sqrt(dx * dx + dy * dy) <= a.size + 1) {
              hit = true;
              hitLaserIds.add(l.id);
              pilotBonusRef.current += 10 + a.size * 2;
              setPilotHits((h) => h + 1);
              break;
            }
          }
          if (!hit) survivingAsteroids.push(a);
        }
        for (const l of pilotLasersRef.current) {
          if (!hitLaserIds.has(l.id)) survivingLasers.push(l);
        }
        pilotAsteroidsRef.current = survivingAsteroids;
        pilotLasersRef.current = survivingLasers;
        if (hitLaserIds.size > 0) playCoinSound();

        // Asteroid vs ship
        if (pilotInvulnRef.current > 0) {
          pilotInvulnRef.current -= 1;
        } else {
          for (const a of pilotAsteroidsRef.current) {
            const dx = a.x - ship.x;
            const dy = a.y - ship.y;
            if (Math.sqrt(dx * dx + dy * dy) <= a.size + 4) {
              pilotInvulnRef.current = 30;
              playWrong();
              setPilotLives((lv) => Math.max(0, lv - 1));
              break;
            }
          }
        }

        // End on duration; the lives-out end path is handled by a separate effect
        const shouldEnd = next >= gameDuration;
        return shouldEnd ? 0 : next;
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [phase]);

  // End pilot game when lives depleted or tick loops (ended in setter)
  useEffect(() => {
    if (phase !== "pilot") return;
    if (pilotLives > 0 && pilotTick < 449) return;
    // Credit bonus coins, return to cutscene at saved tick
    const bonus = pilotBonusRef.current;
    if (pilotReturnTo === "alien") {
      setAlienCoins((g) => {
        const n = g + bonus;
        window.localStorage.setItem("scoopstack-alien-coins", n.toString());
        return n;
      });
      setCutsceneType("journey-out");
    } else {
      setEarthCoins((g) => {
        const n = g + bonus;
        window.localStorage.setItem("scoopstack-earth-coins", n.toString());
        return n;
      });
      setCutsceneType("journey-back");
    }
    // Resume journey just past the offer tick so the journey continues toward landing
    setCutsceneTick(Math.max(pilotResumeTickRef.current, 29));
    setPhase("cutscene");
  }, [phase, pilotLives, pilotTick, pilotReturnTo]);

  // Keyboard controls during pilot phase
  useEffect(() => {
    if (phase !== "pilot") return;
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") pilotInputsRef.current.left = true;
      if (e.key === "ArrowRight") pilotInputsRef.current.right = true;
      if (e.key === "ArrowUp") pilotInputsRef.current.up = true;
      if (e.key === "ArrowDown") pilotInputsRef.current.down = true;
      if (e.key === " " || e.key === "Spacebar") pilotInputsRef.current.fire = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") pilotInputsRef.current.left = false;
      if (e.key === "ArrowRight") pilotInputsRef.current.right = false;
      if (e.key === "ArrowUp") pilotInputsRef.current.up = false;
      if (e.key === "ArrowDown") pilotInputsRef.current.down = false;
      if (e.key === " " || e.key === "Spacebar") pilotInputsRef.current.fire = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [phase]);

  // Choose a door in the dimension fork
  const handleBlackholeDoor = useCallback((door: BlackholeScene) => {
    playBoop();
    setBlackholeScene(door);
    setBlackholeTick(0);
    setBlackholeMessage(null);
  }, []);

  // Scene-specific choice handler: label, reward coin count, follow-up message
  const handleBlackholeChoice = useCallback((coins: number, msg: string) => {
    playCoinSound();
    setBlackholeBonus((b) => b + coins);
    setBlackholeMessage(msg);
  }, []);

  const handleBlackholeExit = useCallback(() => {
    playBoop();
    setBlackholeScene("exit");
    setBlackholeTick(0);
    setBlackholeMessage(null);
  }, []);

  const handleBlackholeDive = useCallback(() => {
    playDing();
    setBlackholeScene("burst-out");
    setBlackholeTick(0);
  }, []);

  // Dino timeline choices. Each adjusts the coin bonus (can be negative for
  // risky choices) then advances to the next scene.
  const handleDinoChoice = useCallback((bonus: number, msg: string, next: BlackholeScene) => {
    if (bonus > 0) { playCoinSound(); setBlackholeBonus((b) => b + bonus); }
    else if (bonus < 0) {
      playWrong();
      setBlackholeBonus((b) => Math.max(0, b + bonus));
      setShakeTick(10);
    } else {
      playBoop();
    }
    setBlackholeMessage(msg);
    // Advance after a short beat so the player can read the outcome
    setTimeout(() => {
      setBlackholeMessage(null);
      setBlackholeScene(next);
      setBlackholeTick(0);
    }, 1200);
  }, []);

  const handleMonolithTouch = useCallback(() => {
    playDing();
    setBlackholeMessage(null);
    setBlackholeScene("burst-out");
    setBlackholeTick(0);
  }, []);

  useEffect(() => {
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
      if (slotIntervalRef.current) clearInterval(slotIntervalRef.current);
      if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; }
    };
  }, []);


  // ── Menu Screen ─────────────────────────────────────────────────────────
  if (phase === "menu") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #FFF4B8 0%, #FFD6E8 50%, #C8F7C5 100%)" }}>
        {/* Polka dot overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, #FFD36E 2px, transparent 2px)",
            backgroundSize: "24px 24px",
          }} />

        <div className="relative z-10 text-center">
          {/* Pixel art ice cream icon using CSS pixels */}
          <div className="mx-auto mb-4 flex justify-center">
            <div style={{
              width: 64, height: 96,
              imageRendering: "pixelated",
              background: `
                linear-gradient(to bottom,
                  transparent 0px, transparent 8px,
                  #FFB0CB 8px, #FFB0CB 32px,
                  #FFF5D6 32px, #FFF5D6 48px,
                  #8EEDC7 48px, #8EEDC7 64px,
                  #D4A040 64px, #D4A040 96px
                )
              `,
              borderRadius: "32px 32px 8px 8px",
              border: "4px solid #333",
            }} />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-2"
            style={{
              fontFamily: "monospace",
              color: "#FF69B4",
              textShadow: "3px 3px 0 #FFD6E8, -1px -1px 0 #D4567A",
              letterSpacing: "2px",
            }}>
            SCOOP SHOP
          </h1>
          <p className="text-lg mb-8" style={{ color: "#C44569", fontFamily: "monospace" }}>
            ~ serve scoops, make friends ~
          </p>

          <button onClick={startGame}
            className="font-bold text-xl px-10 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 border-b-4"
            style={{
              fontFamily: "monospace",
              background: "linear-gradient(180deg, #FF9EBA, #FF69B4)",
              borderColor: "#D4567A",
              color: "#FFF",
              boxShadow: "0 4px 0 #C44569, 0 6px 12px rgba(196,69,105,0.3)",
              textShadow: "1px 1px 0 #D4567A",
            }}>
            OPEN SHOP!
          </button>

          <button onClick={() => setShowTutorial(!showTutorial)}
            className="block mx-auto mt-4 text-sm transition-colors"
            style={{ color: "#C44569", fontFamily: "monospace" }}>
            [ how to play ]
          </button>

          {showTutorial && (
            <div className="mt-4 rounded-xl p-5 text-left max-w-xs mx-auto border-2"
              style={{ background: "#FFF", borderColor: "#FFD6E8", fontFamily: "monospace" }}>
              <div className="space-y-2 text-sm" style={{ color: "#666" }}>
                <p>✨ Customers walk in</p>
                <p>🍦 Read their order bubble</p>
                <p>👇 Tap the right flavors</p>
                <p>🍒 Add toppings too!</p>
                <p>🎉 No rush - take your time!</p>
              </div>
            </div>
          )}

          {highScore > 0 && (
            <p className="mt-6 text-sm" style={{ color: "#C44569", fontFamily: "monospace" }}>
              🏆 best: {highScore}pts
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Result Screen ───────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "linear-gradient(180deg, #FFF4B8 0%, #FFD6E8 50%, #C8F7C5 100%)" }}>
        <div className="rounded-2xl p-8 text-center max-w-sm border-4"
          style={{ background: "#FFF", borderColor: "#FF69B4", fontFamily: "monospace" }}>
          <div className="text-5xl mb-3">🍦</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#FF69B4" }}>
            CLOSED!
          </h2>
          <div className="rounded-xl p-4 mb-4" style={{ background: "#FFF4B8" }}>
            <div className="text-3xl font-bold" style={{ color: "#FF69B4" }}>{score}</div>
            <div className="text-xs" style={{ color: "#C44569" }}>POINTS</div>
          </div>
          <div className="flex justify-center gap-6 mb-4 text-sm" style={{ color: "#666" }}>
            <div><div className="text-xl font-bold" style={{ color: "#FF69B4" }}>{customersServed}</div>served</div>
            <div><div className="text-xl font-bold" style={{ color: "#FF69B4" }}>{level}</div>level</div>
          </div>
          {score >= highScore && score > 0 && (
            <p className="mb-4 font-bold" style={{ color: "#FFD700" }}>⭐ NEW BEST! ⭐</p>
          )}
          <button onClick={startGame}
            className="w-full font-bold text-lg px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95 border-b-4"
            style={{
              background: "linear-gradient(180deg, #FF9EBA, #FF69B4)",
              borderColor: "#D4567A", color: "#FFF",
              boxShadow: "0 4px 0 #C44569",
            }}>
            PLAY AGAIN
          </button>
        </div>
      </div>
    );
  }

  // ── Playing Screen ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center p-3 select-none"
      style={{ background: "linear-gradient(180deg, #FFF4B8 0%, #FFD6E8 50%, #C8F7C5 100%)" }}>

      {/* Music toggle */}
      <div className="w-full max-w-lg flex justify-end mb-1">
        <button onClick={toggleMusic}
          className="rounded-lg px-3 py-1 text-xs border-2 transition-colors"
          style={{
            fontFamily: "monospace",
            background: "#FFF",
            borderColor: "#FFD6E8",
            color: "#FF69B4",
          }}>
          {musicOn ? "🔊 music" : "🔇 music"}
        </button>
      </div>

      {/* Game Canvas */}
      <div className="rounded-2xl overflow-hidden border-4 mb-3"
        style={{
          borderColor: "#FF69B4",
          boxShadow: "0 6px 0 #C44569, 0 8px 20px rgba(196,69,105,0.2)",
          width: CANVAS_W,
          maxWidth: "100%",
          transform: shakeTick > 0
            ? `translate(${(shakeTick % 2 === 0 ? -1 : 1) * (shakeTick * 0.7)}px, ${((shakeTick * 3) % 2 === 0 ? -1 : 1) * (shakeTick * 0.4)}px)`
            : "none",
        }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={
            phase === "street" ? handleStreetTap
            : phase === "shop" ? handleShopTap
            : phase === "arcade-room" ? handleArcadeRoomTap
            : phase === "meteor-meltdown" ? handleMeteorMeltdownTap
            : phase === "slime-simon" ? handleSlimeSimonCanvasTap
            : phase === "moon-maze" ? handleMoonMazeTap
            : phase === "ufo-claw" ? handleUfoClawTap
            : phase === "pixel-rift" ? handlePixelRiftTap
            : phase === "alien-underground" ? handleUndergroundTap
            : phase === "ship-interior" ? handleShipInteriorTap
            : phase === "space-map" || phase === "space-destination" ? handleSpaceMapTap
            : phase === "chase" ? handleChaseTap
            : handleCanvasTap
          }
          onTouchStart={
            phase === "street" ? handleStreetTap
            : phase === "shop" ? handleShopTap
            : phase === "arcade-room" ? handleArcadeRoomTap
            : phase === "meteor-meltdown" ? handleMeteorMeltdownTap
            : phase === "slime-simon" ? handleSlimeSimonCanvasTap
            : phase === "moon-maze" ? handleMoonMazeTap
            : phase === "ufo-claw" ? handleUfoClawTap
            : phase === "pixel-rift" ? handlePixelRiftTap
            : phase === "alien-underground" ? handleUndergroundTap
            : phase === "ship-interior" ? handleShipInteriorTap
            : phase === "space-map" || phase === "space-destination" ? handleSpaceMapTap
            : phase === "chase" ? handleChaseTap
            : handleCanvasTap
          }
          style={{
            width: "100%",
            height: "auto",
            imageRendering: "pixelated",
            display: "block",
            cursor: "pointer",
          }}
        />
      </div>

      {/* Chat overlay */}
      {chatActive && chatDialogue.length > 0 && (
        <div className="w-full max-w-lg mb-3 animate-in"
          style={{ fontFamily: "monospace" }}>
          {/* Speaker name */}
          <div className="flex items-center gap-2 mb-1 px-1">
            <div className="rounded-full px-3 py-1 text-xs font-bold border-2"
              style={{
                background: chatTarget === "scoopy" ? "#90EE90" : "#FFE066",
                borderColor: chatTarget === "scoopy" ? "#6BC56B" : "#FFD700",
                color: "#333",
              }}>
              {chatTarget === "scoopy" ? "SCOOPY" : customer?.name?.toUpperCase() || "???"}
            </div>
          </div>

          {/* Speech bubble */}
          <div className="relative rounded-2xl p-5 border-4"
            style={{
              background: "#FFFDE8",
              borderColor: "#333",
              boxShadow: "4px 4px 0 #333",
              minHeight: 80,
            }}>
            {/* Tamagotchi-style dots in corners */}
            <div className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ background: "#FFD6E8" }} />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "#C8F7C5" }} />
            <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full" style={{ background: "#B8E0FF" }} />
            <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full" style={{ background: "#FFE066" }} />

            {/* Dialogue text */}
            <p className="text-lg font-bold text-center leading-relaxed mb-4"
              style={{ color: "#333" }}>
              {chatDialogue[chatNodeIdx]?.text}
            </p>

            {/* A/B choices or close button */}
            {chatDialogue[chatNodeIdx]?.choiceA && chatDialogue[chatNodeIdx]?.choiceB ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleChatChoice(chatDialogue[chatNodeIdx].choiceA!.next)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 border-b-4 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(180deg, #FFB0CB, #FF85A2)",
                    borderBottomColor: "#D4567A",
                    color: "#FFF",
                    boxShadow: "0 3px 0 #C44569",
                    textShadow: "1px 1px 0 #D4567A",
                  }}>
                  A: {chatDialogue[chatNodeIdx].choiceA!.label}
                </button>
                <button
                  onClick={() => handleChatChoice(chatDialogue[chatNodeIdx].choiceB!.next)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 border-b-4 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(180deg, #B8E0FF, #87CEEB)",
                    borderBottomColor: "#5BB5E0",
                    color: "#333",
                    boxShadow: "0 3px 0 #4A9BC4",
                    textShadow: "1px 1px 0 rgba(255,255,255,0.5)",
                  }}>
                  B: {chatDialogue[chatNodeIdx].choiceB!.label}
                </button>
              </div>
            ) : (
              <button
                onClick={closeChat}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 border-b-4 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(180deg, #C8F7C5, #8EEDC7)",
                  borderBottomColor: "#5CC49A",
                  color: "#333",
                  boxShadow: "0 3px 0 #4AA882",
                }}>
                Bye bye! {"\u{1F44B}"}
              </button>
            )}
          </div>

          {/* Bubble tail */}
          <div className="flex justify-center">
            <div style={{
              width: 0, height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "12px solid #333",
            }} />
          </div>
        </div>
      )}

      {/* Door fork (ship vs shops) */}
      {doorOfferActive && (
        <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4 text-center"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #FFF, #FFF4B8)",
            borderColor: "#FF9EBA",
            color: "#333",
          }}>
          <p className="font-bold mb-3">Where to?</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={chooseShopsFromDoor}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: "linear-gradient(180deg, #B0FFC8, #50C080)",
                borderBottomColor: "#208050", color: "#FFF",
              }}>
              {"\u{1F6CD}\uFE0F"} Walk to shops
            </button>
            <button onClick={chooseShipFromDoor}
              disabled={!alienVisited}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: alienVisited
                  ? "linear-gradient(180deg, #B8E0FF, #5070D0)"
                  : "linear-gradient(180deg, #DDD, #999)",
                borderBottomColor: alienVisited ? "#2060A0" : "#666",
                color: "#FFF",
                opacity: alienVisited ? 1 : 0.6,
              }}>
              {"\u{1F6F8}"} Take the ship
            </button>
          </div>
          {!alienVisited && (
            <p className="text-xs mb-2" style={{ color: "#888" }}>
              The ship option unlocks after your first alien visit.
            </p>
          )}
          <button onClick={closeDoorOffer}
            className="text-sm underline mt-1" style={{ color: "#C44569" }}>
            never mind, stay inside
          </button>
        </div>
      )}

      {/* Ship interior controls */}
      {phase === "ship-interior" && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4 select-none"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #102038, #081020)",
            borderColor: "#80C0FF",
            color: "#F0F8FF",
            boxShadow: "0 0 18px rgba(128,192,255,0.35)",
          }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <strong style={{ color: "#FFD86B" }}>{SHIP_ROOMS[shipRoom].name}</strong>
              <div className="text-xs" style={{ color: "#B8E0FF" }}>
                {SHIP_ROOM_DETAILS[shipRoom].hint}
              </div>
            </div>
            <div className="text-xs" style={{ color: "#80C0FF" }}>
              orbit: {location === "alien-planet" ? "alien planet" : "earth"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => moveShipRoom("left")}
              disabled={!SHIP_ROOMS[shipRoom].exits.left}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: SHIP_ROOMS[shipRoom].exits.left ? "linear-gradient(180deg, #B8E0FF, #5070D0)" : "linear-gradient(180deg, #555, #333)",
                borderBottomColor: SHIP_ROOMS[shipRoom].exits.left ? "#2060A0" : "#111",
                color: "#FFF",
                opacity: SHIP_ROOMS[shipRoom].exits.left ? 1 : 0.5,
              }}>
              &larr; room
            </button>
            <button onClick={() => moveShipRoom("right")}
              disabled={!SHIP_ROOMS[shipRoom].exits.right}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: SHIP_ROOMS[shipRoom].exits.right ? "linear-gradient(180deg, #B8E0FF, #5070D0)" : "linear-gradient(180deg, #555, #333)",
                borderBottomColor: SHIP_ROOMS[shipRoom].exits.right ? "#2060A0" : "#111",
                color: "#FFF",
                opacity: SHIP_ROOMS[shipRoom].exits.right ? 1 : 0.5,
              }}>
              room &rarr;
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={openSpaceMap}
              disabled={shipRoom !== "cockpit"}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: shipRoom === "cockpit" ? "linear-gradient(180deg, #70FFE0, #208088)" : "linear-gradient(180deg, #555, #333)",
                borderBottomColor: shipRoom === "cockpit" ? "#075858" : "#111",
                color: shipRoom === "cockpit" ? "#06122A" : "#AAA",
                opacity: shipRoom === "cockpit" ? 1 : 0.6,
              }}>
              open map
            </button>
            <button onClick={exitShipInterior}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{ background: "linear-gradient(180deg, #FFD86B, #D88020)", borderBottomColor: "#805010", color: "#201020" }}>
              {shipInteriorReturn === "cutscene" ? "back to flight" : "back to shop"}
            </button>
          </div>
        </div>
      )}

      {/* Space map controls */}
      {(phase === "space-map" || phase === "space-destination") && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #080018, #101030)",
            borderColor: "#FFE080",
            color: "#F8F8FF",
            boxShadow: "0 0 18px rgba(255,224,128,0.3)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <strong style={{ color: "#FFE080" }}>Space Map</strong>
            <button onClick={() => setPhase("ship-interior")}
              className="text-sm underline" style={{ color: "#80C0FF" }}>
              back to cockpit
            </button>
          </div>
          {spaceMapMessage && (
            <p className="text-xs text-center mb-2 rounded py-1"
              style={{ color: "#FFE080", background: "#201040" }}>
              {spaceMapMessage}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {SPACE_DESTINATIONS.map((dest) => {
              const unlocked = isDestinationUnlocked(dest);
              const selected = selectedSpaceDestination === dest.id;
              return (
                <button key={dest.id}
                  onClick={() => travelToDestination(dest)}
                  className="p-2 rounded-xl text-left transition-all active:scale-95 border-b-4"
                  style={{
                    background: unlocked
                      ? selected ? "linear-gradient(180deg, #FFF, #B8E0FF)" : "linear-gradient(180deg, #203860, #102040)"
                      : "linear-gradient(180deg, #333344, #202030)",
                    borderBottomColor: unlocked ? "#80C0FF" : "#111",
                    color: unlocked ? selected ? "#102038" : "#F8F8FF" : "#888",
                  }}>
                  <span className="text-lg mr-1" style={{ fontFamily: "sans-serif" }}>{dest.emoji}</span>
                  <strong>{dest.name}</strong>
                  <br /><span className="text-[10px]">{unlocked ? dest.description : "locked"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Street controls: left / right / enter-home */}
      {phase === "street" && (
        <div className="w-full max-w-lg flex items-center justify-between gap-2 mb-3 select-none"
          style={{ fontFamily: "monospace" }}>
          <div className="flex gap-2">
            <button
              onTouchStart={(e) => { e.preventDefault(); heroDirRef.current = -1; }}
              onTouchEnd={(e) => { e.preventDefault(); heroDirRef.current = 0; }}
              onMouseDown={() => { heroDirRef.current = -1; }}
              onMouseUp={() => { heroDirRef.current = 0; }}
              onMouseLeave={() => { heroDirRef.current = 0; }}
              className="rounded-lg border-b-4 text-2xl font-bold py-2 px-5"
              style={{ background: "linear-gradient(180deg,#FFF,#FFD6E8)", borderBottomColor: "#FF9EBA", color: "#C44569" }}
              aria-label="Walk left">&larr;</button>
            <button
              onTouchStart={(e) => { e.preventDefault(); heroDirRef.current = 1; }}
              onTouchEnd={(e) => { e.preventDefault(); heroDirRef.current = 0; }}
              onMouseDown={() => { heroDirRef.current = 1; }}
              onMouseUp={() => { heroDirRef.current = 0; }}
              onMouseLeave={() => { heroDirRef.current = 0; }}
              className="rounded-lg border-b-4 text-2xl font-bold py-2 px-5"
              style={{ background: "linear-gradient(180deg,#FFF,#FFD6E8)", borderBottomColor: "#FF9EBA", color: "#C44569" }}
              aria-label="Walk right">&rarr;</button>
          </div>
          <p className="text-sm" style={{ color: "#555" }}>
            tap a shop{location === "alien-planet" && alienLadderUnlocked ? " or ladder" : ""} to enter
          </p>
          <button onClick={exitStreet}
            className="rounded-lg border-b-4 font-bold py-2 px-3 text-sm"
            style={{ background: "linear-gradient(180deg, #B0FFC8, #50C080)", borderBottomColor: "#208050", color: "#FFF" }}>
            {"\u{1F3E0}"} Go home
          </button>
        </div>
      )}

      {/* Alien underground controls */}
      {phase === "alien-underground" && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4 select-none"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #102818, #081420)",
            borderColor: "#B7FF9A",
            color: "#EFFFF0",
            boxShadow: "0 0 18px rgba(183,255,154,0.35)",
          }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <strong style={{ color: "#B7FF9A" }}>Glow Cavern</strong>
              <div className="text-xs" style={{ color: "#A8C8FF" }}>
                tap crystals to collect glow shards
              </div>
            </div>
            <div className="text-sm font-bold" style={{ color: "#FFD86B" }}>
              {glowShards} shards
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setUndergroundX((x) => Math.max(12, x - 24))}
                onTouchStart={(e) => { e.preventDefault(); undergroundDirRef.current = -1; }}
                onTouchEnd={(e) => { e.preventDefault(); undergroundDirRef.current = 0; }}
                onTouchCancel={(e) => { e.preventDefault(); undergroundDirRef.current = 0; }}
                onMouseDown={() => { undergroundDirRef.current = -1; }}
                onMouseUp={() => { undergroundDirRef.current = 0; }}
                onMouseLeave={() => { undergroundDirRef.current = 0; }}
                className="rounded-lg border-b-4 text-2xl font-bold py-2 px-5"
                style={{ background: "linear-gradient(180deg,#B7FF9A,#40A050)", borderBottomColor: "#145020", color: "#102018" }}
                aria-label="Walk left">&larr;</button>
              <button
                onClick={() => setUndergroundX((x) => Math.min(UNDERGROUND_W - 12, x + 24))}
                onTouchStart={(e) => { e.preventDefault(); undergroundDirRef.current = 1; }}
                onTouchEnd={(e) => { e.preventDefault(); undergroundDirRef.current = 0; }}
                onTouchCancel={(e) => { e.preventDefault(); undergroundDirRef.current = 0; }}
                onMouseDown={() => { undergroundDirRef.current = 1; }}
                onMouseUp={() => { undergroundDirRef.current = 0; }}
                onMouseLeave={() => { undergroundDirRef.current = 0; }}
                className="rounded-lg border-b-4 text-2xl font-bold py-2 px-5"
                style={{ background: "linear-gradient(180deg,#70C8FF,#2060A0)", borderBottomColor: "#103060", color: "#FFF" }}
                aria-label="Walk right">&rarr;</button>
            </div>
            <button onClick={exitAlienUnderground}
              className="rounded-lg border-b-4 font-bold py-2 px-3 text-sm"
              style={{ background: "linear-gradient(180deg, #FFD86B, #D88020)", borderBottomColor: "#805010", color: "#201020" }}>
              back up
            </button>
          </div>
        </div>
      )}

      {/* Alien Arcade room controls */}
      {phase === "arcade-room" && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4 select-none"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #160C32, #080418)",
            borderColor: "#70FFE0",
            color: "#E8FFFF",
            boxShadow: "0 0 18px rgba(112,255,224,0.35)",
          }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <strong style={{ color: "#FFD86B" }}>Glitch Galaxy Arcade</strong>
              <div className="text-xs" style={{ color: "#B8A8FF" }}>
                tap a cabinet to inspect it
              </div>
            </div>
            <div className="text-sm font-bold" style={{ color: "#70FFE0" }}>
              {totalGold}G
            </div>
          </div>

          {shopFlash && (
            <p className="text-xs text-center mb-2 rounded py-1"
              style={{ color: "#FFD86B", background: "#24104A" }}>
              {shopFlash}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setArcadeRoomX((x) => Math.max(14, x - 28))}
                onTouchStart={(e) => { e.preventDefault(); arcadeDirRef.current = -1; }}
                onTouchEnd={(e) => { e.preventDefault(); arcadeDirRef.current = 0; }}
                onTouchCancel={(e) => { e.preventDefault(); arcadeDirRef.current = 0; }}
                onMouseDown={() => { arcadeDirRef.current = -1; }}
                onMouseUp={() => { arcadeDirRef.current = 0; }}
                onMouseLeave={() => { arcadeDirRef.current = 0; }}
                className="rounded-lg border-b-4 text-2xl font-bold py-2 px-5"
                style={{ background: "linear-gradient(180deg,#2FFFE0,#138A88)", borderBottomColor: "#075858", color: "#06122A" }}
                aria-label="Walk left">&larr;</button>
              <button
                onClick={() => setArcadeRoomX((x) => Math.min(ARCADE_ROOM_W - 14, x + 28))}
                onTouchStart={(e) => { e.preventDefault(); arcadeDirRef.current = 1; }}
                onTouchEnd={(e) => { e.preventDefault(); arcadeDirRef.current = 0; }}
                onTouchCancel={(e) => { e.preventDefault(); arcadeDirRef.current = 0; }}
                onMouseDown={() => { arcadeDirRef.current = 1; }}
                onMouseUp={() => { arcadeDirRef.current = 0; }}
                onMouseLeave={() => { arcadeDirRef.current = 0; }}
                className="rounded-lg border-b-4 text-2xl font-bold py-2 px-5"
                style={{ background: "linear-gradient(180deg,#FF80D8,#9830A8)", borderBottomColor: "#5C166C", color: "#FFF" }}
                aria-label="Walk right">&rarr;</button>
            </div>
            <button onClick={exitArcadeRoom}
              className="rounded-lg border-b-4 font-bold py-2 px-3 text-sm"
              style={{ background: "linear-gradient(180deg, #FFD86B, #D88020)", borderBottomColor: "#805010", color: "#201020" }}>
              back to street
            </button>
          </div>
        </div>
      )}

      {/* Alien Arcade cabinet preview */}
      {phase === "arcade-room" && arcadeCabinetPreview && (() => {
        const cabinet = ALIEN_ARCADE_CABINETS.find((c) => c.id === arcadeCabinetPreview);
        if (!cabinet) return null;
        const best = arcadeHighScores[cabinet.highScoreKey] ?? 0;
        return (
          <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4"
            style={{
              fontFamily: "monospace",
              background: "linear-gradient(180deg, #24104A, #100820)",
              borderColor: cabinet.colors.accent,
              color: "#E8FFFF",
              boxShadow: `0 0 20px ${cabinet.colors.accent}`,
            }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl" style={{ fontFamily: "sans-serif" }}>{cabinet.emoji}</div>
              <div className="flex-1">
                <strong style={{ color: cabinet.colors.accent }}>{cabinet.name}</strong>
                <p className="text-xs mt-1" style={{ color: "#C0C0FF" }}>{cabinet.subtitle}</p>
              </div>
              <div className="text-right text-xs" style={{ color: "#FFD86B" }}>
                best<br /><span className="text-base font-bold">{best}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => playArcadeCabinet(cabinet.id)}
                className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{
                  background: "linear-gradient(180deg, #FFB0CB, #D04060)",
                  borderBottomColor: "#801040",
                  color: "#FFF",
                  textShadow: "1px 1px 0 #400020",
                }}>
                play
              </button>
              <button onClick={() => setArcadeCabinetPreview(null)}
                className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{
                  background: "linear-gradient(180deg, #FFF, #B8A8FF)",
                  borderBottomColor: "#6A4AC0",
                  color: "#201020",
                }}>
                keep walking
              </button>
            </div>
          </div>
        );
      })()}

      {/* Arcade panel — pick a game */}
      {phase === "shop" && currentShopId && (() => {
        const shop = shopById(currentShopId);
        if (!shop || shop.type !== "arcade") return null;
        return (
          <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4"
            style={{
              fontFamily: "monospace",
              background: "linear-gradient(180deg, #1A0E30, #120820)",
              borderColor: shop.signColor,
              color: shop.accentColor,
              boxShadow: `0 0 20px ${shop.signColor}`,
            }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <strong style={{ color: shop.signColor }}>{shop.name}</strong>
                <span className="ml-2 text-xs" style={{ color: "#C0C0FF" }}>
                  host: {shop.ownerName}
                </span>
              </div>
              <div className="text-sm font-bold" style={{ color: shop.accentColor }}>
                {totalGold}G
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: "#C0C0FF" }}>
              Pick a cabinet, scooper!
            </p>
            {shop.location === "alien-planet" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ALIEN_ARCADE_CABINETS.map((cabinet) => {
                  const unlocked = cabinet.unlocked || !cabinet.unlockFlag || unlockFlags[cabinet.unlockFlag];
                  return (
                    <div key={cabinet.id} className="rounded-lg p-2 border-2"
                      style={{
                        background: cabinet.colors.body,
                        borderColor: cabinet.colors.accent,
                        color: unlocked ? "#FFF" : "#A0A0B8",
                      }}>
                      <div className="text-lg">{cabinet.emoji}</div>
                      <div className="text-xs font-bold">{cabinet.name}</div>
                      <div className="text-[10px]" style={{ color: unlocked ? "#D8FFFF" : "#888" }}>
                        {unlocked ? "cabinet warming up" : "locked"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={startSarahsWorld}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 border-b-4 mb-3"
              style={{
                background: "linear-gradient(180deg, #FFB0CB, #D04060)",
                borderBottomColor: "#801040", color: "#FFF",
                textShadow: "1px 1px 0 #400020",
              }}>
              {"\u{1F3AE}"} SARAH&apos;S WORLD
              <br />
              <span className="text-xs font-normal" style={{ opacity: 0.85 }}>
                stack the magnet tiles before baby Julia knocks them over
              </span>
            </button>
            <div className="flex justify-between items-center">
              <button onClick={exitShop}
                className="text-sm underline" style={{ color: shop.signColor }}>
                {"\u2190"} back to street
              </button>
              <span className="text-xs" style={{ color: "#C0C0FF" }}>
                cabinet dreams online
              </span>
            </div>
          </div>
        );
      })()}

      {/* Sarah's World controls */}
      {phase === "sarahs-world" && sarahsWorld && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #FFF4E0, #FFD6E8)",
            borderColor: "#D04060",
            color: "#333",
          }}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <strong style={{ color: "#D04060" }}>{"\u{1F3AE}"} Sarah&apos;s World</strong>
            </div>
            <div className="text-sm font-bold" style={{ color: "#C08010" }}>
              {totalGold}G &middot; tiles {sarahsWorld.tileCount}/{sarahsWorld.target} &middot; {(sarahsWorld.timeLeft / 1000).toFixed(1)}s
            </div>
          </div>
          {sarahsWorld.phase === "play" ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleStackTile}
                onTouchStart={(e) => { e.preventDefault(); handleStackTile(); }}
                className="py-6 rounded-xl font-bold text-xl transition-all active:scale-95 border-b-4"
                style={{
                  background: "linear-gradient(180deg, #80E0FF, #4060C0)",
                  borderBottomColor: "#103060", color: "#FFF",
                  textShadow: "1px 1px 0 #102040",
                }}>
                {"\u{1F9F1}"} STACK!
              </button>
              <button onClick={handleShooJulia}
                onTouchStart={(e) => { e.preventDefault(); handleShooJulia(); }}
                disabled={sarahsWorld.shooCooldown > 0}
                className="py-6 rounded-xl font-bold text-xl transition-all active:scale-95 border-b-4"
                style={{
                  background: sarahsWorld.shooCooldown > 0
                    ? "linear-gradient(180deg, #888, #555)"
                    : "linear-gradient(180deg, #FFD080, #FF6040)",
                  borderBottomColor: sarahsWorld.shooCooldown > 0 ? "#222" : "#801010",
                  color: "#FFF",
                  opacity: sarahsWorld.shooCooldown > 0 ? 0.6 : 1,
                  cursor: sarahsWorld.shooCooldown > 0 ? "wait" : "pointer",
                  textShadow: "1px 1px 0 #400",
                }}>
                {"\u{1F6D1}"} SHOO!
                {sarahsWorld.shooCooldown > 0 && (
                  <><br/><span className="text-xs font-normal">{(sarahsWorld.shooCooldown / 1000).toFixed(1)}s</span></>
                )}
              </button>
            </div>
          ) : (
            <button onClick={exitSarahsWorld}
              className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: "linear-gradient(180deg, #B0FFC8, #50C080)",
                borderBottomColor: "#208050", color: "#FFF",
              }}>
              back to the arcade {"\u2190"}
            </button>
          )}
        </div>
      )}

      {/* Meteor Meltdown controls */}
      {phase === "meteor-meltdown" && meteorMeltdown && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #201040, #100820)",
            borderColor: "#FF8050",
            color: "#FFF",
            boxShadow: "0 0 18px rgba(255,128,80,0.35)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <strong style={{ color: "#FFB040" }}>Meteor Meltdown</strong>
            <span className="text-xs" style={{ color: "#70FFE0" }}>
              best {arcadeHighScores["meteor-meltdown"] ?? 0}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm mb-3">
            <div className="rounded-lg py-2" style={{ background: "#2A184A" }}>
              <strong>{meteorMeltdown.score}</strong><br /><span className="text-xs">score</span>
            </div>
            <div className="rounded-lg py-2" style={{ background: "#2A184A" }}>
              <strong>{Math.ceil(meteorMeltdown.timeLeft / 1000)}s</strong><br /><span className="text-xs">time</span>
            </div>
            <div className="rounded-lg py-2" style={{ background: "#2A184A" }}>
              <strong>{meteorMeltdown.lives}</strong><br /><span className="text-xs">lives</span>
            </div>
          </div>
          {meteorMeltdown.phase === "done" ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startMeteorMeltdown}
                className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{ background: "linear-gradient(180deg, #FFB040, #D85030)", borderBottomColor: "#7A2010", color: "#FFF" }}>
                retry
              </button>
              <button onClick={exitArcadeGame}
                className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{ background: "linear-gradient(180deg, #70FFE0, #208088)", borderBottomColor: "#075858", color: "#06122A" }}>
                back to arcade
              </button>
            </div>
          ) : (
            <button onClick={exitArcadeGame}
              className="w-full py-2 rounded-xl font-bold transition-all active:scale-95 border-b-4 text-sm"
              style={{ background: "linear-gradient(180deg, #FFF, #B8A8FF)", borderBottomColor: "#6A4AC0", color: "#201020" }}>
              quit to arcade
            </button>
          )}
        </div>
      )}

      {/* Slime Simon controls */}
      {phase === "slime-simon" && slimeSimon && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #102818, #08140C)",
            borderColor: "#78F060",
            color: "#EFFFF0",
            boxShadow: "0 0 18px rgba(120,240,96,0.35)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <strong style={{ color: "#B7FF9A" }}>Slime Simon</strong>
            <span className="text-xs" style={{ color: "#FFE080" }}>
              best {arcadeHighScores["slime-simon"] ?? 0}
            </span>
          </div>
          <p className="text-xs text-center mb-2" style={{ color: "#D8FFD0" }}>
            {slimeSimon.message}
          </p>
          {slimeSimon.phase === "done" ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startSlimeSimon}
                className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{ background: "linear-gradient(180deg, #B7FF9A, #40A050)", borderBottomColor: "#145020", color: "#102018" }}>
                retry
              </button>
              <button onClick={exitArcadeGame}
                className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{ background: "linear-gradient(180deg, #FFF, #B8A8FF)", borderBottomColor: "#6A4AC0", color: "#201020" }}>
                back to arcade
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {SLIME_SIMON_PADS.map((pad, idx) => (
                  <button key={pad.name}
                    onClick={() => handleSlimeSimonPad(idx)}
                    disabled={slimeSimon.phase !== "play"}
                    className="py-4 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{
                      background: slimeSimon.flashIdx === idx
                        ? "linear-gradient(180deg, #FFF, #F8FFE8)"
                        : `linear-gradient(180deg, ${pad.color}, ${pad.accent})`,
                      borderBottomColor: pad.accent,
                      color: idx === 2 ? "#201800" : "#FFF",
                      opacity: slimeSimon.phase === "play" ? 1 : 0.75,
                    }}>
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button onClick={exitArcadeGame}
                className="w-full py-2 rounded-xl font-bold transition-all active:scale-95 border-b-4 text-sm"
                style={{ background: "linear-gradient(180deg, #FFF, #B8A8FF)", borderBottomColor: "#6A4AC0", color: "#201020" }}>
                quit to arcade
              </button>
            </>
          )}
        </div>
      )}

      {/* Moon Maze controls */}
      {phase === "moon-maze" && moonMaze && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #172648, #081020)",
            borderColor: "#A8C8FF",
            color: "#E8F0FF",
            boxShadow: "0 0 18px rgba(168,200,255,0.35)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <strong style={{ color: "#DDEBFF" }}>Moon Maze</strong>
            <span className="text-xs" style={{ color: "#FFD86B" }}>
              best {arcadeHighScores["moon-maze"] ?? 0}
            </span>
          </div>
          <p className="text-xs text-center mb-2" style={{ color: "#C8D8FF" }}>
            {moonMaze.message}
          </p>
          {moonMaze.phase === "play" ? (
            <>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div />
                <button onClick={() => moveMoonMaze(0, -1)}
                  className="py-3 rounded-xl font-bold border-b-4"
                  style={{ background: "linear-gradient(180deg,#DDEBFF,#7088D0)", borderBottomColor: "#304A88", color: "#06122A" }}>
                  up
                </button>
                <div />
                <button onClick={() => moveMoonMaze(-1, 0)}
                  className="py-3 rounded-xl font-bold border-b-4"
                  style={{ background: "linear-gradient(180deg,#A8C8FF,#4058A0)", borderBottomColor: "#203070", color: "#FFF" }}>
                  left
                </button>
                <button onClick={() => moveMoonMaze(0, 1)}
                  className="py-3 rounded-xl font-bold border-b-4"
                  style={{ background: "linear-gradient(180deg,#FFD86B,#D88020)", borderBottomColor: "#805010", color: "#201020" }}>
                  down
                </button>
                <button onClick={() => moveMoonMaze(1, 0)}
                  className="py-3 rounded-xl font-bold border-b-4"
                  style={{ background: "linear-gradient(180deg,#A8C8FF,#4058A0)", borderBottomColor: "#203070", color: "#FFF" }}>
                  right
                </button>
              </div>
              <button onClick={exitArcadeGame}
                className="w-full py-2 rounded-xl font-bold border-b-4 text-sm"
                style={{ background: "linear-gradient(180deg, #FFF, #B8A8FF)", borderBottomColor: "#6A4AC0", color: "#201020" }}>
                quit to arcade
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startMoonMaze}
                className="py-3 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg,#DDEBFF,#7088D0)", borderBottomColor: "#304A88", color: "#06122A" }}>
                retry
              </button>
              <button onClick={exitArcadeGame}
                className="py-3 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg, #70FFE0, #208088)", borderBottomColor: "#075858", color: "#06122A" }}>
                back to arcade
              </button>
            </div>
          )}
        </div>
      )}

      {/* UFO Claw controls */}
      {phase === "ufo-claw" && ufoClaw && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #24104A, #100820)",
            borderColor: "#FFD86B",
            color: "#FFF7C8",
            boxShadow: "0 0 18px rgba(255,216,107,0.35)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <strong style={{ color: "#FFD86B" }}>UFO Claw</strong>
            <span className="text-xs" style={{ color: "#70FFE0" }}>
              wins {arcadeHighScores["ufo-claw"] ?? 0}
            </span>
          </div>
          <p className="text-xs text-center mb-2" style={{ color: "#FFF0A8" }}>
            Prize: {ufoClaw.prize.emoji} {ufoClaw.prize.name}
          </p>
          {ufoClaw.phase === "done" ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startUfoClaw}
                className="py-3 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg,#FFD86B,#D88020)", borderBottomColor: "#805010", color: "#201020" }}>
                retry
              </button>
              <button onClick={exitArcadeGame}
                className="py-3 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg, #70FFE0, #208088)", borderBottomColor: "#075858", color: "#06122A" }}>
                back to arcade
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={dropUfoClaw}
                disabled={ufoClaw.phase !== "aim"}
                className="py-4 rounded-xl font-bold border-b-4"
                style={{
                  background: ufoClaw.phase === "aim"
                    ? "linear-gradient(180deg,#FFD86B,#D88020)"
                    : "linear-gradient(180deg,#888,#555)",
                  borderBottomColor: ufoClaw.phase === "aim" ? "#805010" : "#222",
                  color: ufoClaw.phase === "aim" ? "#201020" : "#DDD",
                }}>
                drop claw
              </button>
              <button onClick={exitArcadeGame}
                className="py-4 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg, #FFF, #B8A8FF)", borderBottomColor: "#6A4AC0", color: "#201020" }}>
                quit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pixel Rift controls */}
      {phase === "pixel-rift" && pixelRift && (
        <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #1A0E30, #071824)",
            borderColor: "#70FFE0",
            color: "#E8FFFF",
            boxShadow: "0 0 18px rgba(112,255,224,0.35)",
          }}>
          <div className="flex items-center justify-between mb-2">
            <strong style={{ color: "#70FFE0" }}>Pixel Rift</strong>
            <span className="text-xs" style={{ color: "#FFD86B" }}>
              best {arcadeHighScores["pixel-rift"] ?? 0}
            </span>
          </div>
          <p className="text-xs text-center mb-2" style={{ color: "#C0C0FF" }}>
            {pixelRift.message}
          </p>
          {pixelRift.phase === "done" ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startPixelRift}
                className="py-3 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg,#FF70F0,#8A2078)", borderBottomColor: "#481040", color: "#FFF" }}>
                retry
              </button>
              <button onClick={exitArcadeGame}
                className="py-3 rounded-xl font-bold border-b-4"
                style={{ background: "linear-gradient(180deg, #70FFE0, #208088)", borderBottomColor: "#075858", color: "#06122A" }}>
                back to arcade
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {PIXEL_RIFT_LANES.map((lane, idx) => (
                  <button key={lane.label}
                    onClick={() => handlePixelRiftLane(idx)}
                    className="py-4 rounded-xl font-bold border-b-4"
                    style={{
                      background: pixelRift.targetLane === idx
                        ? `linear-gradient(180deg,#FFF,${lane.color})`
                        : `linear-gradient(180deg,${lane.color},${lane.accent})`,
                      borderBottomColor: lane.accent,
                      color: pixelRift.targetLane === idx ? "#201020" : "#FFF",
                    }}>
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button onClick={exitArcadeGame}
                className="w-full py-2 rounded-xl font-bold border-b-4 text-sm"
                style={{ background: "linear-gradient(180deg, #FFF, #B8A8FF)", borderBottomColor: "#6A4AC0", color: "#201020" }}>
                quit to arcade
              </button>
            </>
          )}
        </div>
      )}

      {/* Casino panel (slot machine) */}
      {phase === "shop" && currentShopId && (() => {
        const shop = shopById(currentShopId);
        if (!shop || shop.type !== "casino") return null;
        const payouts = shop.location === "alien-planet" ? SLOT_PAYOUTS_ALIEN : SLOT_PAYOUTS_EARTH;
        const symbols = shop.location === "alien-planet" ? SLOT_SYMBOLS_ALIEN : SLOT_SYMBOLS_EARTH;
        return (
          <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4"
            style={{
              fontFamily: "monospace",
              background: "linear-gradient(180deg, #2A1A20, #1A1020)",
              borderColor: shop.accentColor,
              color: "#FFE080",
              boxShadow: `0 0 20px ${shop.signColor}`,
            }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <strong style={{ color: shop.signColor }}>{shop.name}</strong>
                <span className="ml-2 text-xs" style={{ color: "#C08040" }}>
                  host: {shop.ownerName}
                </span>
              </div>
              <div className="text-sm font-bold" style={{ color: "#FFE080" }}>
                {totalGold}G
              </div>
            </div>

            {/* Reels */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {slotReels.map((sym, i) => (
                <div key={i}
                  className="aspect-square rounded-lg flex items-center justify-center text-5xl sm:text-6xl border-b-4 border-t-2"
                  style={{
                    background: "linear-gradient(180deg, #FFFDE8, #FFE080)",
                    borderBottomColor: shop.accentColor,
                    borderTopColor: "#FFF",
                    color: "#333",
                    fontFamily: "sans-serif",
                    animation: slotSpinning ? "none" : undefined,
                  }}>
                  {sym}
                </div>
              ))}
            </div>

            {/* Spin button */}
            <button onClick={handleSpin} disabled={slotSpinning || totalGold < 1}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 border-b-4 mb-2"
              style={{
                background: (slotSpinning || totalGold < 1)
                  ? "linear-gradient(180deg, #888, #555)"
                  : "linear-gradient(180deg, #FFD060, #E02040)",
                borderBottomColor: (slotSpinning || totalGold < 1) ? "#333" : "#801010",
                color: "#FFF",
                textShadow: "1px 1px 0 #400",
                opacity: (slotSpinning || totalGold < 1) ? 0.7 : 1,
                cursor: slotSpinning ? "wait" : "pointer",
              }}>
              {slotSpinning ? "SPINNING..." : totalGold < 1 ? "NOT ENOUGH COINS" : "SPIN (1G)"}
            </button>

            {slotMessage && (
              <p className="text-center py-2 rounded mb-2 font-bold"
                style={{
                  background: slotMessage.startsWith("JACKPOT") ? "#FFE080" : "#3A1020",
                  color: slotMessage.startsWith("JACKPOT") ? "#A02010" : "#FFB080",
                }}>
                {slotMessage}
              </p>
            )}

            <details className="text-xs mb-2" style={{ color: "#C08040" }}>
              <summary className="cursor-pointer">payouts</summary>
              <ul className="mt-1 space-y-0.5">
                {symbols.map((s) => (
                  <li key={s}>{s}{s}{s} &rarr; +{payouts[s]}G</li>
                ))}
              </ul>
            </details>

            <div className="flex justify-between items-center mt-2">
              <button onClick={exitShop}
                className="text-sm underline" style={{ color: shop.signColor }}>
                {"\u2190"} back to street
              </button>
              <span className="text-xs" style={{ color: "#C08040" }}>
                house has the edge
              </span>
            </div>
          </div>
        );
      })()}

      {/* Shop panel: buy / inventory tabs */}
      {phase === "shop" && currentShopId && (() => {
        const shop = shopById(currentShopId);
        if (!shop || shop.type === "casino" || shop.type === "arcade") return null;
        const owned = Object.entries(inventory).filter(([, n]) => n > 0);
        return (
          <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
            style={{
              fontFamily: "monospace",
              background: "#FFF",
              borderColor: shop.accentColor,
              color: "#333",
            }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <strong style={{ color: shop.accentColor }}>{shop.name}</strong>
                <span className="ml-2 text-xs" style={{ color: "#888" }}>
                  owner: {shop.ownerName}
                </span>
              </div>
              <div className="text-sm font-bold" style={{ color: "#C08010" }}>
                {totalGold}G
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-2">
              <button onClick={() => setShopTab("buy")}
                className="flex-1 py-1 rounded text-sm font-bold border-b-2"
                style={{
                  background: shopTab === "buy" ? shop.signColor : "#EEE",
                  borderBottomColor: shop.accentColor,
                  color: shopTab === "buy" ? "#FFF" : "#666",
                }}>BUY</button>
              <button onClick={() => setShopTab("inventory")}
                className="flex-1 py-1 rounded text-sm font-bold border-b-2"
                style={{
                  background: shopTab === "inventory" ? shop.signColor : "#EEE",
                  borderBottomColor: shop.accentColor,
                  color: shopTab === "inventory" ? "#FFF" : "#666",
                }}>INVENTORY</button>
            </div>

            {shopFlash && (
              <p className="text-xs text-center mb-2 rounded bg-yellow-50 py-1"
                style={{ color: "#666", background: "#FFFDE8" }}>
                {shopFlash}
              </p>
            )}

            {shopTab === "buy" && (
              <div className="grid grid-cols-1 gap-2">
                {shop.items.map((item) => {
                  const affordable = totalGold >= item.price;
                  const owningCount = inventory[item.id] || 0;
                  return (
                    <button key={item.id} onClick={() => buyItem(item)}
                      aria-disabled={!affordable}
                      className="flex items-center gap-3 p-2 rounded-lg text-left transition-all active:scale-[0.99] border-b-4"
                      style={{
                        background: affordable ? "linear-gradient(180deg, #FFF, #FFF4B8)" : "linear-gradient(180deg, #EEE, #CCC)",
                        borderBottomColor: affordable ? shop.signColor : "#999",
                        color: "#333",
                        opacity: affordable ? 1 : 0.8,
                      }}>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="flex-1">
                        <strong>{item.name}</strong>
                        <br /><span className="text-xs" style={{ color: "#666" }}>{item.description}</span>
                      </span>
                      <span className="text-right min-w-[72px]">
                        <span className="font-bold" style={{ color: shop.accentColor }}>{item.price}G</span>
                        <br /><span className="text-xs" style={{ color: affordable ? shop.accentColor : "#A04040" }}>
                          {affordable ? "BUY" : `need ${item.price - totalGold}G`}
                        </span>
                        {owningCount > 0 && (
                          <><br /><span className="text-xs" style={{ color: "#888" }}>x{owningCount} owned</span></>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {shopTab === "inventory" && (
              <div>
                {owned.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "#888" }}>
                    No items yet. Buy something in BUY tab!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {owned.map(([id, n]) => {
                      const item = shop.items.find((i) => i.id === id)
                        ?? [...EARTH_SHOPS, ...ALIEN_SHOPS].flatMap((s) => s.items).find((i) => i.id === id);
                      if (!item) return null;
                      const canReturn = !!shop.items.find((i) => i.id === id);
                      const isEquipped = item.slot === "held"
                        ? equippedHeld === item.id
                        : item.slot === "decor"
                          ? equippedDecor.includes(item.id)
                          : false;
                      return (
                        <div key={id} className="flex items-center gap-3 p-2 rounded-lg border-b-4"
                          style={{
                            background: isEquipped ? "linear-gradient(180deg, #FFFDE8, #FFE080)" : "linear-gradient(180deg, #FFF, #F0F0F0)",
                            borderBottomColor: shop.signColor, color: "#333",
                          }}>
                          <span className="text-2xl">{item.emoji}</span>
                          <span className="flex-1">
                            <strong>{item.name}</strong>
                            {isEquipped && <span className="ml-1 text-xs" style={{ color: "#C08010" }}>(equipped)</span>}
                            <br /><span className="text-xs" style={{ color: "#666" }}>x{n} owned</span>
                          </span>
                          <div className="flex flex-col gap-1 items-end">
                            {item.slot && (
                              <button onClick={() => toggleEquip(item)}
                                className="rounded-lg border-b-4 font-bold py-1 px-2 text-xs"
                                style={{
                                  background: isEquipped
                                    ? "linear-gradient(180deg, #FFE080, #E0A040)"
                                    : "linear-gradient(180deg, #E0F0FF, #80C0FF)",
                                  borderBottomColor: isEquipped ? "#806020" : "#2060A0",
                                  color: "#333",
                                }}>
                                {isEquipped ? "unequip" : item.slot === "held" ? "hold" : "place"}
                              </button>
                            )}
                            {canReturn ? (
                              <button onClick={() => returnItem(item)}
                                className="rounded-lg border-b-4 font-bold py-1 px-2 text-xs"
                                style={{ background: "linear-gradient(180deg, #FFF, #FFD6E8)", borderBottomColor: "#FF9EBA", color: "#C44569" }}>
                                return +{item.price}G
                              </button>
                            ) : (
                              <span className="text-xs" style={{ color: "#888" }}>not sold here</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center mt-3">
              <button onClick={exitShop}
                className="text-sm underline" style={{ color: shop.accentColor }}>
                {"\u2190"} back to street
              </button>
              <span className="text-xs" style={{ color: "#888" }}>
                tap owner on canvas to chat
              </span>
            </div>
          </div>
        );
      })()}

      {/* Boss fight overlay — Simon order flavors then chase-tap button */}
      {phase === "boss-fight" && bossFight && (() => {
        const pool = bossFight.bossOnAlien ? availableAlienFlavors : availableEarthFlavors;
        return (
          <div className="w-full max-w-lg rounded-2xl p-3 mb-3 border-4"
            style={{
              fontFamily: "monospace",
              background: bossFight.bossOnAlien
                ? "linear-gradient(180deg, #100028, #2A0848)"
                : "linear-gradient(180deg, #2A0808, #4A1010)",
              borderColor: "#FF4040",
              color: "#FFF",
            }}>
            <div className="flex items-center justify-between mb-2 text-sm">
              <strong style={{ color: "#FFE080" }}>{bossFight.bossName}</strong>
              <span style={{ color: "#FFE080" }}>
                {bossFight.phase === "intro" && "..."}
                {bossFight.phase === "simon-show" && "WATCH"}
                {bossFight.phase === "simon-play" && `${bossFight.playIdx} / ${bossFight.order.length}`}
                {bossFight.phase === "simon-fail" && "WRONG!"}
                {bossFight.phase === "chase-tap" && `${(bossFight.chaseTimeLeft / 1000).toFixed(1)}s`}
                {bossFight.phase === "caught" && "+" + (bossFight.orderMoney + 100) + "G"}
                {bossFight.phase === "escaped" && "-40G"}
              </span>
            </div>

            {/* Simon play — flavor grid (only input during simon-play) */}
            {(bossFight.phase === "simon-show" || bossFight.phase === "simon-play") && (
              <>
                <p className="text-center text-sm mb-2" style={{ color: "#FFE080" }}>
                  {bossFight.phase === "simon-show"
                    ? "\"GIVE ME...\" — memorize the order!"
                    : "repeat the order in order"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {pool.map((f) => {
                    const disabled = bossFight.phase !== "simon-play";
                    const darkLabel = ["Chocolate", "Blueberry", "Void", "Cosmic Swirl"].includes(f.name);
                    return (
                      <button key={f.name}
                        onClick={() => handleSimonFlavor(f.name)}
                        disabled={disabled}
                        className="py-3 px-2 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                        style={{
                          fontFamily: "monospace",
                          fontSize: "14px",
                          background: `linear-gradient(180deg, ${f.colors[0]}, ${f.colors[1]})`,
                          borderBottomColor: f.colors[2],
                          color: darkLabel ? "#FFF" : "#444",
                          opacity: disabled ? 0.7 : 1,
                          cursor: disabled ? "default" : "pointer",
                        }}>
                        <span className="text-lg block">{f.emoji}</span>
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Chase-tap — big button + progress bar + timer */}
            {bossFight.phase === "chase-tap" && (
              <>
                <p className="text-center text-sm mb-2" style={{ color: "#FFE080" }}>
                  he ran off without paying! TAP FAST to catch him!
                </p>
                <div className="relative h-5 rounded-full border-2 overflow-hidden mb-2"
                  style={{ borderColor: "#FFFFFF", background: "#300A14" }}>
                  <div className="h-full"
                    style={{
                      width: `${Math.min(100, (bossFight.chaseProgress / bossFight.chaseTarget) * 100)}%`,
                      background: "linear-gradient(90deg, #FFE080, #FF4040)",
                      transition: "width 40ms linear",
                    }} />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold"
                    style={{ color: "#FFFFFF", textShadow: "1px 1px 0 #000" }}>
                    {bossFight.chaseProgress} / {bossFight.chaseTarget}
                  </div>
                </div>
                <div className="h-2 rounded-full border overflow-hidden mb-3"
                  style={{ borderColor: "#FFFFFF", background: "#200", opacity: 0.8 }}>
                  <div className="h-full"
                    style={{
                      width: `${Math.max(0, (bossFight.chaseTimeLeft / bossFight.chaseTotalTime) * 100)}%`,
                      background: bossFight.chaseTimeLeft < 1200 ? "#FF4040" : "#80E0FF",
                      transition: "width 40ms linear",
                    }} />
                </div>
                <button onClick={handleBossTap}
                  onTouchStart={(e) => { e.preventDefault(); handleBossTap(); }}
                  className="w-full py-6 rounded-2xl font-bold text-3xl transition-all active:scale-95 border-b-8 select-none"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, #FFE080, #FF4040 60%, #A01010)",
                    borderBottomColor: "#601010",
                    color: "#FFF",
                    textShadow: "2px 2px 0 #400",
                  }}>
                  CHASE! TAP! TAP!
                </button>
              </>
            )}

            {/* Static banners for intro / simon-fail / caught / escaped */}
            {(bossFight.phase === "intro" || bossFight.phase === "simon-fail"
              || bossFight.phase === "caught" || bossFight.phase === "escaped") && (
              <div className="py-6 text-center font-bold text-xl"
                style={{
                  color: bossFight.phase === "caught" ? "#80FF80"
                    : bossFight.phase === "escaped" ? "#FFAA40"
                    : bossFight.phase === "simon-fail" ? "#FF4040"
                    : "#FFE080",
                }}>
                {bossFight.phase === "intro" && "BOSS INCOMING..."}
                {bossFight.phase === "simon-fail" && "WRONG ORDER!"}
                {bossFight.phase === "caught" && `GOTCHA! +${bossFight.orderMoney + 100}G`}
                {bossFight.phase === "escaped" && "BOSS ESCAPED!"}
              </div>
            )}
          </div>
        );
      })()}

      {/* Warp drive button (only during journey cutscenes, not already warping) */}
      {phase === "cutscene" && (cutsceneType === "journey-out" || cutsceneType === "journey-back") && !warpActive && !pilotOfferActive && (
        <div className="w-full max-w-lg flex justify-end gap-2 mb-2">
          <button onClick={exploreShipDuringJourney}
            className="rounded-xl border-b-4 font-bold py-2 px-4 text-sm"
            style={{
              fontFamily: "monospace",
              background: "linear-gradient(180deg, #70FFE0, #208088)",
              borderBottomColor: "#075858",
              color: "#06122A",
            }}>
            {"\u{1F6F8}"} EXPLORE SHIP
          </button>
          <button onClick={handleWarp}
            className="rounded-xl border-b-4 font-bold py-2 px-4 text-sm"
            style={{
              fontFamily: "monospace",
              background: "linear-gradient(180deg, #80E0FF, #4060C0)",
              borderBottomColor: "#103060", color: "#FFF",
              textShadow: "1px 1px 0 #102040",
            }}>
            {"\u26A1"} WARP DRIVE
          </button>
        </div>
      )}

      {/* Chase phase HUD */}
      {phase === "chase" && (
        <div className="w-full max-w-lg rounded-xl p-3 mb-3 text-center border-2"
          style={{ fontFamily: "monospace", background: "#FFF", borderColor: "#FF4040", color: "#333" }}>
          <p className="font-bold text-base">
            CHASE! {chaseMinions.filter((m) => m.caught).length}/{chaseMinions.length} arrested
            <span className="ml-3" style={{ color: "#888" }}>
              {Math.max(0, 12 - Math.floor(chaseTick / 25))}s
            </span>
          </p>
          <p className="text-xs" style={{ color: "#666" }}>
            tap each fleeing minion to arrest. reward: 25G each.
          </p>
        </div>
      )}

      {/* Pilot offer overlay (mid-journey) */}
      {pilotOfferActive && (
        <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4 text-center"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #102040, #204080)",
            borderColor: "#80C0FF",
            color: "#F0F8FF",
            boxShadow: "0 0 20px rgba(128, 192, 255, 0.5)",
          }}>
          <p className="text-lg font-bold mb-2" style={{ color: "#FFE080" }}>
            ZARIXA
          </p>
          <p className="mb-3 leading-relaxed">
            &ldquo;My tentacles get tired. Wanna take the controls and blast a few asteroids?&rdquo;
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={acceptPilotOffer}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: "linear-gradient(180deg, #FFE080, #E0A040)",
                borderBottomColor: "#806020", color: "#333",
              }}>
              LET ME DRIVE!
            </button>
            <button onClick={declinePilotOffer}
              className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
              style={{
                background: "linear-gradient(180deg, #B8E0FF, #6090C0)",
                borderBottomColor: "#2060A0", color: "#FFF",
              }}>
              You drive
            </button>
          </div>
        </div>
      )}

      {/* Pilot controls (on-screen d-pad + fire) */}
      {phase === "pilot" && (
        <div className="w-full max-w-lg flex items-center justify-between gap-3 mb-3 select-none"
          style={{ fontFamily: "monospace" }}>
          {/* D-pad */}
          <div className="grid grid-cols-3 grid-rows-3 gap-1" style={{ width: 160, height: 160 }}>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); pilotInputsRef.current.up = true; }}
              onTouchEnd={(e) => { e.preventDefault(); pilotInputsRef.current.up = false; }}
              onMouseDown={() => { pilotInputsRef.current.up = true; }}
              onMouseUp={() => { pilotInputsRef.current.up = false; }}
              onMouseLeave={() => { pilotInputsRef.current.up = false; }}
              className="rounded-lg border-b-4 text-2xl font-bold"
              style={{ background: "linear-gradient(180deg,#E0E0E0,#A0A0A0)", borderBottomColor: "#606060", color: "#222" }}
              aria-label="Up">&uarr;</button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); pilotInputsRef.current.left = true; }}
              onTouchEnd={(e) => { e.preventDefault(); pilotInputsRef.current.left = false; }}
              onMouseDown={() => { pilotInputsRef.current.left = true; }}
              onMouseUp={() => { pilotInputsRef.current.left = false; }}
              onMouseLeave={() => { pilotInputsRef.current.left = false; }}
              className="rounded-lg border-b-4 text-2xl font-bold"
              style={{ background: "linear-gradient(180deg,#E0E0E0,#A0A0A0)", borderBottomColor: "#606060", color: "#222" }}
              aria-label="Left">&larr;</button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); pilotInputsRef.current.right = true; }}
              onTouchEnd={(e) => { e.preventDefault(); pilotInputsRef.current.right = false; }}
              onMouseDown={() => { pilotInputsRef.current.right = true; }}
              onMouseUp={() => { pilotInputsRef.current.right = false; }}
              onMouseLeave={() => { pilotInputsRef.current.right = false; }}
              className="rounded-lg border-b-4 text-2xl font-bold"
              style={{ background: "linear-gradient(180deg,#E0E0E0,#A0A0A0)", borderBottomColor: "#606060", color: "#222" }}
              aria-label="Right">&rarr;</button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); pilotInputsRef.current.down = true; }}
              onTouchEnd={(e) => { e.preventDefault(); pilotInputsRef.current.down = false; }}
              onMouseDown={() => { pilotInputsRef.current.down = true; }}
              onMouseUp={() => { pilotInputsRef.current.down = false; }}
              onMouseLeave={() => { pilotInputsRef.current.down = false; }}
              className="rounded-lg border-b-4 text-2xl font-bold"
              style={{ background: "linear-gradient(180deg,#E0E0E0,#A0A0A0)", borderBottomColor: "#606060", color: "#222" }}
              aria-label="Down">&darr;</button>
            <div />
          </div>

          {/* Score + Fire */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs text-center" style={{ color: "#C44569" }}>
              hits: <strong>{pilotHits}</strong>
              <br />
              <span style={{ color: "#FF4444" }}>{"\u2665".repeat(pilotLives)}{"\u2661".repeat(3 - pilotLives)}</span>
            </div>
            <button
              onTouchStart={(e) => { e.preventDefault(); pilotInputsRef.current.fire = true; }}
              onTouchEnd={(e) => { e.preventDefault(); pilotInputsRef.current.fire = false; }}
              onMouseDown={() => { pilotInputsRef.current.fire = true; }}
              onMouseUp={() => { pilotInputsRef.current.fire = false; }}
              onMouseLeave={() => { pilotInputsRef.current.fire = false; }}
              className="rounded-full border-b-4 font-bold text-lg"
              style={{
                width: 110, height: 110,
                background: "radial-gradient(circle at 30% 30%, #FFC0C0, #FF4040)",
                borderBottomColor: "#A02020", color: "#FFF",
                textShadow: "1px 1px 0 #802020",
              }}
              aria-label="Fire">FIRE {"\u{1F525}"}</button>
          </div>
        </div>
      )}

      {/* Black hole interactive overlay */}
      {phase === "blackhole" && (
        <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4 text-center"
          style={{
            fontFamily: "monospace",
            background: "linear-gradient(180deg, #100028, #200048)",
            borderColor: "#A050E0",
            color: "#FFF0FF",
            boxShadow: "0 0 24px rgba(160, 80, 224, 0.6)",
          }}>
          {blackholeScene === "pull-in" && (
            <p className="text-lg font-bold" style={{ color: "#FF80FF", letterSpacing: 2 }}>
              SPACE-TIME BENDING...
            </p>
          )}

          {blackholeScene === "fork" && (
            <>
              <p className="mb-3 leading-relaxed" style={{ color: "#FFF0FF" }}>
                Three doorways bloom in the dark. Each whispers something different.
                Which do you enter?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => handleBlackholeDoor("mirrors")}
                  className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                  style={{
                    background: "linear-gradient(180deg, #B0E0FF, #5090E0)",
                    borderBottomColor: "#2060A0", color: "#FFF",
                  }}>
                  MIRRORS
                </button>
                <button onClick={() => handleBlackholeDoor("clockwork")}
                  className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                  style={{
                    background: "linear-gradient(180deg, #FFE080, #C0A040)",
                    borderBottomColor: "#806020", color: "#333",
                  }}>
                  CLOCKS
                </button>
                <button onClick={() => handleBlackholeDoor("library")}
                  className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                  style={{
                    background: "linear-gradient(180deg, #B0FFC8, #50C080)",
                    borderBottomColor: "#208050", color: "#FFF",
                  }}>
                  BOOKS
                </button>
              </div>
            </>
          )}

          {blackholeScene === "mirrors" && (
            <>
              <p className="mb-3 leading-relaxed">
                {blackholeMessage ?? (
                  <>A shimmering version of you stands opposite.<br />
                    <em>&ldquo;I&rsquo;m you — from twelve years ahead. The scoop shop does&hellip; WELL.&rdquo;</em>
                  </>
                )}
              </p>
              {!blackholeMessage ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleBlackholeChoice(50, "Future-you whispers: 47 branches. MARS too. You cry a little.")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FFB0CB, #FF85A2)", borderBottomColor: "#D4567A", color: "#FFF" }}>
                    A: Tell me more!
                  </button>
                  <button onClick={() => handleBlackholeChoice(35, "Future-you grins: 'You taught me. I just got the press.'")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #B8E0FF, #87CEEB)", borderBottomColor: "#5BB5E0", color: "#333" }}>
                    B: Can you scoop faster?
                  </button>
                </div>
              ) : (
                <button onClick={handleBlackholeExit}
                  className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                  style={{ background: "linear-gradient(180deg, #D0B0FF, #A050E0)", borderBottomColor: "#6020A0", color: "#FFF" }}>
                  Keep going... (+{blackholeBonus}G)
                </button>
              )}
            </>
          )}

          {blackholeScene === "clockwork" && (
            <>
              <p className="mb-3 leading-relaxed">
                {blackholeMessage ?? (
                  <>Clocks float in every direction, ticking <em>backwards</em>.
                    One of them glows.</>
                )}
              </p>
              {!blackholeMessage ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleBlackholeChoice(60, "Time loops. You witness the shop's very first scoop — and leave a tip for past-you.")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FFF080, #FFB830)", borderBottomColor: "#C07010", color: "#333" }}>
                    A: Touch the glowing clock
                  </button>
                  <button onClick={() => handleBlackholeChoice(30, "A brass gear drifts past, wrapped in ribbon. It purrs like a cat.")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #C0C0C0, #808080)", borderBottomColor: "#404040", color: "#FFF" }}>
                    B: Leave it alone
                  </button>
                </div>
              ) : (
                <button onClick={handleBlackholeExit}
                  className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                  style={{ background: "linear-gradient(180deg, #FFE080, #C0A040)", borderBottomColor: "#806020", color: "#333" }}>
                  Drift onward... (+{blackholeBonus}G)
                </button>
              )}
            </>
          )}

          {blackholeScene === "library" && (
            <>
              <p className="mb-3 leading-relaxed">
                {blackholeMessage ?? (
                  <>An endless library. A recipe book lies open to a page that hasn&rsquo;t
                    been written yet.</>
                )}
              </p>
              {!blackholeMessage ? (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleBlackholeChoice(55, "You read the Original Magic Cone recipe. Your antennae grow. You didn't have antennae.")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #B0FFC8, #50C080)", borderBottomColor: "#208050", color: "#FFF" }}>
                    A: Read the page
                  </button>
                  <button onClick={() => handleBlackholeChoice(40, "You write your own recipe. Scoopers a thousand years from now will taste it.")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FFE0B0, #E0A050)", borderBottomColor: "#805020", color: "#FFF" }}>
                    B: Write on it
                  </button>
                </div>
              ) : (
                <button onClick={handleBlackholeExit}
                  className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                  style={{ background: "linear-gradient(180deg, #B0FFC8, #50C080)", borderBottomColor: "#208050", color: "#FFF" }}>
                  Step back from the shelves... (+{blackholeBonus}G)
                </button>
              )}
            </>
          )}

          {blackholeScene === "exit" && (
            <>
              <p className="mb-3 leading-relaxed">
                A white hole blooms ahead. The way out. You carry <strong>+{blackholeBonus}G</strong> of time-coins.
              </p>
              <button onClick={handleBlackholeDive}
                className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{ background: "linear-gradient(180deg, #FFFFFF, #FFE080)", borderBottomColor: "#C09020", color: "#333" }}>
                DIVE IN! {"\u{1F300}"}
              </button>
            </>
          )}

          {blackholeScene === "burst-out" && (
            <p className="text-lg font-bold" style={{ color: "#80FFA0", letterSpacing: 2 }}>
              BURSTING BACK TO OUR UNIVERSE...
            </p>
          )}

          {blackholeScene === "dino-intro" && (
            <>
              <p className="mb-3 leading-relaxed">
                {blackholeMessage ?? (
                  <>You stagger off a saucer-shaped crater. The air is <em>hot</em>. A volcano smolders in the distance. Something large is roaring.</>
                )}
              </p>
              {!blackholeMessage && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => handleDinoChoice(0, "You sprint for cover. A fern tickles your antenna.", "dino-encounter")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FFE080, #C0A040)", borderBottomColor: "#806020", color: "#333" }}>
                    RUN
                  </button>
                  <button onClick={() => handleDinoChoice(0, "You grab a rock. Primitive, but it'll do.", "dino-encounter")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FF9060, #C04020)", borderBottomColor: "#601010", color: "#FFF" }}>
                    FIGHT
                  </button>
                  <button onClick={() => handleDinoChoice(0, "You crouch behind the fern. They'll never see you. Probably.", "dino-encounter")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #80E080, #408040)", borderBottomColor: "#204020", color: "#FFF" }}>
                    HIDE
                  </button>
                </div>
              )}
            </>
          )}

          {blackholeScene === "dino-encounter" && (
            <>
              <p className="mb-3 leading-relaxed">
                {blackholeMessage ?? (
                  <>A T-REX stomps closer. It sniffs. Its eye is the size of a scoop. It looks <em>hungry</em>.</>
                )}
              </p>
              {!blackholeMessage && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button onClick={() => handleDinoChoice(40, "You throw a cold scoop. It sticks to his forehead. He blinks. Confused. You slip away. +40G", "dino-monolith")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #B0E0FF, #5070D0)", borderBottomColor: "#2060A0", color: "#FFF" }}>
                    THROW SCOOP
                  </button>
                  <button onClick={() => handleDinoChoice(-15, "You grab his tiny arm. He notices. You flee. Bruises: yes. -15G, but still alive.", "dino-monolith")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FF9060, #C04020)", borderBottomColor: "#601010", color: "#FFF" }}>
                    GRAB TAIL
                  </button>
                  <button onClick={() => handleDinoChoice(25, "You sprinkle sprinkles as a trail. He follows them. A small victory. +25G", "dino-monolith")}
                    className="py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                    style={{ background: "linear-gradient(180deg, #FFB0E8, #C070B0)", borderBottomColor: "#603060", color: "#FFF" }}>
                    SPRINKLE TRAIL
                  </button>
                </div>
              )}
            </>
          )}

          {blackholeScene === "dino-monolith" && (
            <>
              <p className="mb-3 leading-relaxed">
                A smooth black <strong>MONOLITH</strong> hums in a clearing. Glyphs pulse across its face.
                It knows your ship. It knows your timeline.
              </p>
              <p className="mb-3 text-sm" style={{ color: "#C0E0FF" }}>
                You carry <strong>+{blackholeBonus}G</strong> in time-coins.
              </p>
              <button onClick={handleMonolithTouch}
                className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 border-b-4"
                style={{ background: "linear-gradient(180deg, #80E0FF, #4060B0)", borderBottomColor: "#103060", color: "#FFF" }}>
                TOUCH THE MONOLITH {"\u{1F300}"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Order instruction - big readable text below canvas */}
      {phase === "playing" && customer && customer.state === "waiting" && (
        <div className="w-full max-w-lg rounded-xl p-3 mb-3 text-center border-2"
          style={{ background: "#FFF", borderColor: "#FFD6E8", fontFamily: "monospace" }}>
          {!toppingsPhase && scoopsDone < customer.order.length ? (
            <p className="text-xl font-bold" style={{ color: "#333" }}>
              tap{" "}
              <span className="inline-block px-3 py-1 rounded-lg"
                style={{
                  background: customer.order[scoopsDone]?.colors[1],
                  color: customer.order[scoopsDone]?.name === "Chocolate" || customer.order[scoopsDone]?.name === "Blueberry" ? "#FFF" : "#333",
                }}>
                {customer.order[scoopsDone]?.emoji} {customer.order[scoopsDone]?.name}
              </span>
              <span className="text-sm ml-2" style={{ color: "#AAA" }}>
                ({scoopsDone + 1}/{customer.order.length})
              </span>
            </p>
          ) : toppingsPhase && toppingsDone < customer.toppings.length ? (
            <p className="text-xl font-bold" style={{ color: "#333" }}>
              add{" "}
              <span className="inline-block px-3 py-1 rounded-lg" style={{ background: "#FFD6E8" }}>
                {customer.toppings[toppingsDone]?.emoji} {customer.toppings[toppingsDone]?.name}
              </span>
            </p>
          ) : null}
        </div>
      )}

      {/* Flavor / Topping buttons - pixel-style (menu swaps with location) */}
      {phase !== "blackhole" && phase !== "pilot" && phase !== "street" && phase !== "shop" && phase !== "arcade-room" && phase !== "meteor-meltdown" && phase !== "slime-simon" && phase !== "moon-maze" && phase !== "ufo-claw" && phase !== "pixel-rift" && phase !== "alien-underground" && phase !== "ship-interior" && phase !== "space-map" && phase !== "space-destination" && phase !== "chase" && phase !== "boss-fight" && phase !== "sarahs-world" && (
      <div className="w-full max-w-lg">
        {!toppingsPhase ? (
          <div className="grid grid-cols-3 gap-2">
            {currentFlavorPool.map((f) => {
              const isNext =
                customer?.state === "waiting" &&
                !toppingsPhase &&
                scoopsDone < (customer?.order.length || 0) &&
                customer?.order[scoopsDone]?.name === f.name;
              const darkLabel = f.name === "Chocolate" || f.name === "Blueberry" || f.name === "Void" || f.name === "Cosmic Swirl";
              return (
                <button key={f.name} onClick={() => tapFlavor(f)}
                  className={`py-3 px-2 rounded-xl font-bold transition-all active:scale-90 border-b-4 ${isNext ? "scale-105" : ""}`}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    background: `linear-gradient(180deg, ${f.colors[0]}, ${f.colors[1]})`,
                    borderBottomColor: f.colors[2],
                    color: darkLabel ? "#FFF" : "#444",
                    boxShadow: isNext
                      ? `0 0 0 3px #FF69B4, 0 4px 0 ${f.colors[2]}`
                      : `0 3px 0 ${f.colors[2]}`,
                  }}>
                  <span className="text-lg block">{f.emoji}</span>
                  {f.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {currentToppingPool.map((t) => {
              const isNext =
                customer?.state === "waiting" &&
                toppingsPhase &&
                toppingsDone < (customer?.toppings.length || 0) &&
                customer?.toppings[toppingsDone]?.name === t.name;
              return (
                <button key={t.name} onClick={() => tapTopping(t)}
                  className={`py-3 px-3 rounded-xl font-bold transition-all active:scale-90 border-b-4 ${isNext ? "scale-105" : ""}`}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    background: location === "alien-planet"
                      ? "linear-gradient(180deg, #C0FFE0, #80E0B0)"
                      : "linear-gradient(180deg, #FFF, #FFD6E8)",
                    borderBottomColor: location === "alien-planet" ? "#40A080" : "#FF9EBA",
                    color: "#444",
                    boxShadow: isNext
                      ? `0 0 0 3px #FF69B4, 0 4px 0 ${location === "alien-planet" ? "#40A080" : "#FF9EBA"}`
                      : `0 3px 0 ${location === "alien-planet" ? "#40A080" : "#FF9EBA"}`,
                  }}>
                  <span className="text-lg block">{t.emoji}</span>
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
