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

type DialogueNode = {
  speaker: "them" | "you";
  text: string;
  choiceA?: { label: string; next: number };
  choiceB?: { label: string; next: number };
  // if no choices, it's the end of the conversation
};

type GamePhase = "menu" | "playing" | "cutscene" | "blackhole" | "pilot" | "street" | "shop" | "chase" | "boss-fight" | "sarahs-world" | "result";

type Asteroid = { id: number; x: number; y: number; vx: number; vy: number; size: number; };
type Laser = { id: number; x: number; y: number; };
type PilotInputs = { left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean };

type BossAttackType = "ice" | "fire" | "slam";

type Minion = { id: number; quote: string; spriteIdx: number };
type ChaseMinion = { id: number; x: number; y: number; vx: number; caught: boolean; spriteIdx: number };

type BossFightPhase = "intro" | "round-start" | "tap" | "player-attack" | "boss-attack" | "won" | "lost";

type BossFightState = {
  phase: BossFightPhase;
  round: number;
  playerHP: number;
  bossHP: number;
  tapCount: number;
  tapTarget: number;
  timeLeft: number;       // ms remaining in current tap round
  roundTime: number;      // total ms for the current tap round (for UI bar)
  attackType: BossAttackType;   // which animation to play on boss-attack
  phaseTick: number;      // ticks within current sub-phase
  bossName: string;
  bossOnAlien: boolean;
  minionCount: number;
  encounterIdx: number;   // 1-based boss encounter # (difficulty)
};

type ShopItem = {
  id: string;        // stable id used as inventory key
  name: string;
  emoji: string;
  price: number;
  description: string;
  slot?: "held" | "decor";  // if present, item is equippable tamagotchi-style
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
};

type Location = "earth" | "alien-planet";

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

const MINION_QUOTES = [
  "your scoops stink!",
  "my grandma scoops faster!",
  "that's not a CIRCLE!",
  "hahaha nice try",
  "pay up or else",
  "coins coins coins",
  "we're TAKING these!",
  "hurry up scooper!",
  "boss! smash him!",
  "give us your gold!",
];

const BOSS_ATTACKS: Record<BossAttackType, { name: string; color: string; text: string }> = {
  "ice":  { name: "ICE BLAST",  color: "#80E0FF", text: "ICE BLAST!" },
  "fire": { name: "FIRE STORM", color: "#FF6040", text: "FIRE STORM!" },
  "slam": { name: "GROUND SLAM", color: "#FFD040", text: "GROUND SLAM!" },
};

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
      { id: "gravity-boots",    name: "Gravity Boots",    emoji: "\u{1F462}", price: 90, description: "Walk on any ceiling. Any. Ceiling." },
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

function generateOrder(level: number): Flavor[] {
  const count = Math.min(1 + Math.floor((level + 1) / 2), 4);
  return Array.from({ length: count }, () => pick(FLAVORS));
}

function generateToppings(level: number): Topping[] {
  if (level < 2) return [];
  if (Math.random() > 0.5) return [];
  const count = Math.min(1 + Math.floor(level / 3), 2);
  const chosen: Topping[] = [];
  const available = [...TOPPINGS];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    chosen.push(available.splice(idx, 1)[0]);
  }
  return chosen;
}

function createCustomer(id: number, level: number): Customer {
  return {
    id,
    name: pick(CUSTOMER_NAMES),
    spriteIdx: Math.floor(Math.random() * TAMA_PALETTES.length),
    order: generateOrder(level),
    toppings: generateToppings(level),
    x: W + 10,
    targetX: 20 + Math.random() * 20,
    state: "walking-in",
    reaction: "",
    waitTicks: 0,
  };
}

function createAlienCustomer(id: number, level: number): Customer {
  const count = Math.min(2 + Math.floor(level / 2), 4);
  return {
    id,
    name: pick(ALIEN_NAMES),
    spriteIdx: Math.floor(Math.random() * ALIEN_PALETTES.length),
    order: Array.from({ length: count }, () => pick(ALIEN_FLAVORS)),
    toppings: Math.random() > 0.4
      ? Array.from(
          { length: Math.min(2, 1 + Math.floor(level / 3)) },
          () => pick(ALIEN_TOPPINGS)
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

// Quick 8-frame hit flash — overlays a colored wash and a shock ring
function drawBossAttackHit(ctx: CanvasRenderingContext2D, tick: number, attack: BossAttackType) {
  const color = BOSS_ATTACKS[attack].color;
  // Tinted full-screen flash
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.max(0, 0.35 - tick * 0.04);
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.globalAlpha = 1;
  // Shock ring expanding from shopkeeper
  const radius = 8 + tick * 4;
  for (let a = 0; a < 48; a++) {
    const angle = (a / 48) * Math.PI * 2;
    const rx = Math.floor(64 + Math.cos(angle) * radius);
    const ry = Math.floor(60 + Math.sin(angle) * radius * 0.8);
    if (rx < 0 || rx >= W || ry < 0 || ry >= H) continue;
    px(ctx, rx, ry, 1, 1, color);
  }
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
) {
  // Backdrop: gradient arena with action lines. Alien planet bosses get a
  // darker purple arena; earth bosses get a red sky.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
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
  }

  // Speed-lines rushing outward during tap phase
  if (state.phase === "tap") {
    for (let i = 0; i < 18; i++) {
      const yy = (i * 7 + tick * 3) % H;
      px(ctx, 2, yy, 6, 1, "#FFE080");
      px(ctx, W - 8, (yy + 20) % H, 6, 1, "#FFE080");
    }
  }

  // HP bars
  drawHealthBar(ctx, 4, 22, 50, state.playerHP, 3, "#20E040", "#FFF");
  drawText(ctx, "YOU", 30, 18, "#FFFFFF", 0.5);
  drawHealthBar(ctx, W - 54, 22, 50, state.bossHP, 3, "#E02040", "#FFF");
  drawText(ctx, state.bossName, W - 28, 18, "#FFFFFF", 0.48);

  // Hero / boss positions — animate toward each other during attacks
  let heroX = 32;
  let bossX = W - 36;
  if (state.phase === "player-attack") {
    const t = state.phaseTick / 50;
    const ease = t < 0.4 ? t / 0.4 : t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    heroX = 32 + Math.floor(ease * 44);
  } else if (state.phase === "boss-attack") {
    const t = state.phaseTick / 50;
    const ease = t < 0.4 ? t / 0.4 : t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    bossX = W - 36 - Math.floor(ease * 44);
  }

  // Minions flanking the boss, with rotating rude quote bubbles
  for (let i = 0; i < state.minionCount; i++) {
    const mx = W - 50 - i * 14;
    drawMinion(ctx, mx, 78, tick + i * 7, i);
    if (state.phase === "tap" || state.phase === "round-start") {
      const q = MINION_QUOTES[(Math.floor(tick / 90) + i) % MINION_QUOTES.length];
      const bw = Math.min(W - 2, q.length * 3 + 8);
      const bx = Math.max(1, Math.min(W - bw - 1, mx - Math.floor(bw / 2)));
      const by = 66;
      for (let dy = 0; dy < 7; dy++) for (let dx = 0; dx < bw; dx++) {
        const edge = dx === 0 || dx === bw - 1 || dy === 0 || dy === 6;
        px(ctx, bx + dx, by + dy, 1, 1, edge ? "#333" : "#FFFDE8");
      }
      drawText(ctx, q, bx + bw / 2, by + 3, "#A02010", 0.35);
    }
  }

  drawHero(ctx, heroX, 74, state.phase === "tap" || state.phase === "player-attack", state.bossOnAlien, null);
  drawBossSprite(ctx, bossX, 70, state.phase === "boss-attack", tick);

  // Impact particles on contact frames
  if ((state.phase === "player-attack" || state.phase === "boss-attack")
      && state.phaseTick >= 20 && state.phaseTick <= 30) {
    const target = state.phase === "player-attack" ? bossX : heroX;
    const ty = state.phase === "player-attack" ? 70 : 74;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = (state.phaseTick - 20) * 1.8 + 4;
      const sx = Math.floor(target + Math.cos(angle) * r);
      const sy = Math.floor(ty + Math.sin(angle) * r);
      if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
        px(ctx, sx, sy, 2, 2, i % 2 ? "#FFE080" : "#FFFFFF");
      }
    }
    drawText(ctx, state.phase === "player-attack" ? "POW!" : "OUCH!", target, ty - 8, "#FFE080", 0.75);
  }

  // Center banner overlay for transition phases
  if (state.phase === "intro") {
    const alpha = Math.min(1, state.phaseTick / 10);
    ctx.globalAlpha = alpha;
    drawText(ctx, "BOSS FIGHT!", W / 2, H / 2 - 4, "#FFFFFF", 1.4);
    drawText(ctx, state.bossName, W / 2, H / 2 + 8, "#FF4040", 0.8);
    ctx.globalAlpha = 1;
  } else if (state.phase === "round-start") {
    drawText(ctx, `ROUND ${state.round}`, W / 2, H / 2 - 2, "#FFFFFF", 1.2);
    drawText(ctx, "GET READY!", W / 2, H / 2 + 10, "#FFE080", 0.6);
  } else if (state.phase === "won") {
    const blink = Math.floor(state.phaseTick / 4) % 2 === 0;
    drawText(ctx, blink ? "VICTORY!" : "YOU WIN!", W / 2, H / 2, "#80FF80", 1.4);
  } else if (state.phase === "lost") {
    drawText(ctx, "DEFEATED...", W / 2, H / 2, "#FF4040", 1.1);
  }
}

// Small segmented HP bar: W wide, rounded rect, shows `hp` of `max` filled blocks
function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, hp: number, max: number,
  fillColor: string, borderColor: string,
) {
  // Frame
  for (let dx = 0; dx < w; dx++) {
    px(ctx, x + dx, y, 1, 1, borderColor);
    px(ctx, x + dx, y + 6, 1, 1, borderColor);
  }
  for (let dy = 0; dy < 7; dy++) {
    px(ctx, x, y + dy, 1, 1, borderColor);
    px(ctx, x + w - 1, y + dy, 1, 1, borderColor);
  }
  // Interior background
  for (let dy = 1; dy < 6; dy++) for (let dx = 1; dx < w - 1; dx++) {
    px(ctx, x + dx, y + dy, 1, 1, "#301010");
  }
  // Segments
  const segW = Math.floor((w - 4) / max);
  for (let s = 0; s < hp; s++) {
    for (let dy = 2; dy < 5; dy++) for (let dx = 0; dx < segW - 1; dx++) {
      px(ctx, x + 2 + s * segW + dx, y + dy, 1, 1, fillColor);
    }
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

function streetWorldWidth(shops: Shop[]): number {
  return STREET_MARGIN * 2 + shops.length * STREET_SHOP_W + (shops.length - 1) * STREET_GAP;
}

function streetCameraX(heroX: number, shops: Shop[]): number {
  const worldW = streetWorldWidth(shops);
  if (worldW <= W) return 0;
  return Math.max(0, Math.min(worldW - W, Math.floor(heroX - W / 2)));
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

  // Scroll hints when camera can scroll further
  const worldW = streetWorldWidth(shops);
  if (cameraX > 0) drawText(ctx, "\u2190", 6, 50, "#FFFFFF", 1.0);
  if (cameraX < worldW - W) drawText(ctx, "\u2192", W - 6, 50, "#FFFFFF", 1.0);

  // Street label
  drawText(ctx, location === "alien-planet" ? "ALIEN STREET" : "MAIN STREET", W / 2, 94, "#FFFFFF", 0.55);
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

  // Display shelves with the 3 items
  shop.items.forEach((item, i) => {
    const tx = 10 + i * 36;
    for (let dy = 0; dy < 8; dy++) {
      for (let dx = 0; dx < 28; dx++) {
        const edge = dx === 0 || dx === 27 || dy === 0 || dy === 7;
        px(ctx, tx + dx, 60 + dy, 1, 1, edge ? "#333" : "#FFF");
      }
    }
    drawText(ctx, `${item.price}G`, tx + 14, 64, shop.accentColor, 0.5);
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

  // Boss state
  const [shakeTick, setShakeTick] = useState(0);
  const lastBossAtRef = useRef(0);
  const pendingBossRef = useRef(false);

  // Boss fight — classic Nintendo tap-to-fill minigame.
  const [bossFight, setBossFight] = useState<BossFightState | null>(null);
  const bossEncounterRef = useRef(0);
  const [bossHitTick, setBossHitTick] = useState(0); // drives the hit flash overlay

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

  // ── Canvas rendering loop ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" && phase !== "cutscene" && phase !== "blackhole" && phase !== "pilot" && phase !== "street" && phase !== "shop" && phase !== "chase" && phase !== "boss-fight" && phase !== "sarahs-world") return;
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
        getShops(location),
        heroX,
        heroDirRef.current !== 0,
        streetNpcs,
        null,
        equippedHeld,
      );
    }

    function drawShop() {
      if (!ctx) return;
      const shop = currentShopId ? shopById(currentShopId) : null;
      if (!shop) return;
      drawShopInterior(ctx, shop, streetTick);
    }

    function drawChase() {
      if (!ctx) return;
      drawChaseScene(ctx, chaseTick, chaseMinions);
    }

    function drawBossFightView() {
      if (!ctx || !bossFight) return;
      drawBossFightScene(ctx, bossFight, bossFight.phaseTick + cutsceneTick);
      if (bossHitTick > 0) {
        drawBossAttackHit(ctx, bossHitTick, bossFight.attackType);
      }
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
  }, [phase, customer, scoopsDone, coneScoops, toppingsDone, toppingsPhase, level, customersServed, goldCoins, totalGold, location, cutsceneType, cutsceneTick, blackholeScene, blackholeTick, pilotTick, pilotHits, pilotLives, streetTick, heroX, streetNpcs, currentShopId, equippedHeld, equippedDecor, bossFight, bossHitTick, chaseMinions, chaseTick, warpActive, warpTick, sarahsWorld]);

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
        const tapTargetRound1 = 18 + (encounterIdx - 1) * 4;
        const roundTimeMs = Math.max(3000, 5000 - (encounterIdx - 1) * 400);
        setBossFight({
          phase: "intro",
          round: 1,
          playerHP: 3,
          bossHP: 3,
          tapCount: 0,
          tapTarget: tapTargetRound1,
          timeLeft: roundTimeMs,
          roundTime: roundTimeMs,
          attackType: "slam",
          phaseTick: 0,
          bossName: bossOnAlien ? "VOID WARLORD" : "FROZEN FURY",
          bossOnAlien,
          minionCount: Math.random() < 0.4 ? 2 : 0,
          encounterIdx,
        });
        setPhase("boss-fight");
        return;
      }
      customerIdRef.current += 1;
      const c = location === "alien-planet"
        ? createAlienCustomer(customerIdRef.current, level)
        : createCustomer(customerIdRef.current, level);
      setScoopsDone(0);
      setConeScoops([]);
      setToppingsDone(0);
      setToppingsPhase(false);
      walkCustomerIn(c);
    }, 800);
    return () => clearTimeout(timer);
  }, [customer, phase, level, walkCustomerIn, location, pendingAlien, customersServed]);

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
    const coinCount = (1 + customer.order.length + customer.toppings.length) * bonusMult;
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
  }, [customer, highScore, score, location, alienEncountered]);

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
    setBossFight(null); setBossHitTick(0); bossEncounterRef.current = 0;
    setSarahsWorld(null);
    setChaseMinions([]); setChaseTick(0);
    chaseResumeRef.current = null;
    setWarpActive(false); setWarpTick(0);
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

  // Boss fight driver — all transitions happen inside the setInterval callback
  // so they stay atomic and don't trip the set-state-in-effect lint.
  useEffect(() => {
    if (phase !== "boss-fight" || !bossFight) return;
    const attackTypes: BossAttackType[] = ["ice", "fire", "slam"];
    const interval = setInterval(() => {
      setBossFight((cur) => {
        if (!cur) return cur;
        const nextTick = cur.phaseTick + 1;
        const elapsedMs = nextTick * 40;
        switch (cur.phase) {
          case "intro": {
            if (nextTick >= 35) return { ...cur, phase: "round-start", phaseTick: 0 };
            return { ...cur, phaseTick: nextTick };
          }
          case "round-start": {
            if (nextTick >= 28) {
              return { ...cur, phase: "tap", phaseTick: 0, tapCount: 0, timeLeft: cur.roundTime };
            }
            return { ...cur, phaseTick: nextTick };
          }
          case "tap": {
            const timeLeft = Math.max(0, cur.roundTime - elapsedMs);
            if (cur.tapCount >= cur.tapTarget) {
              return { ...cur, phase: "player-attack", phaseTick: 0 };
            }
            if (timeLeft <= 0) {
              return { ...cur, phase: "boss-attack", phaseTick: 0, attackType: pick(attackTypes) };
            }
            return { ...cur, phaseTick: nextTick, timeLeft };
          }
          case "player-attack": {
            if (nextTick >= 50) {
              playCoinSound();
              const newBossHP = cur.bossHP - 1;
              if (newBossHP <= 0) return { ...cur, phase: "won", phaseTick: 0, bossHP: 0 };
              const nextRound = cur.round + 1;
              const newTarget = cur.tapTarget + 3;
              const newRoundTime = Math.max(2500, cur.roundTime - 300);
              return {
                ...cur,
                phase: "round-start",
                round: nextRound,
                bossHP: newBossHP,
                phaseTick: 0,
                tapCount: 0,
                tapTarget: newTarget,
                roundTime: newRoundTime,
                timeLeft: newRoundTime,
              };
            }
            return { ...cur, phaseTick: nextTick };
          }
          case "boss-attack": {
            if (nextTick === 10) {
              setBossHitTick(1);
              setShakeTick(12);
              playWrong();
            }
            if (nextTick >= 50) {
              const newPlayerHP = cur.playerHP - 1;
              if (newPlayerHP <= 0) return { ...cur, phase: "lost", phaseTick: 0, playerHP: 0 };
              const nextRound = cur.round + 1;
              const newTarget = cur.tapTarget + 3;
              const newRoundTime = Math.max(2500, cur.roundTime - 300);
              return {
                ...cur,
                phase: "round-start",
                round: nextRound,
                playerHP: newPlayerHP,
                phaseTick: 0,
                tapCount: 0,
                tapTarget: newTarget,
                roundTime: newRoundTime,
                timeLeft: newRoundTime,
              };
            }
            return { ...cur, phaseTick: nextTick };
          }
          case "won": {
            if (nextTick >= 70) {
              const reward = 250 + cur.encounterIdx * 50;
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
              // Boss counts as a served customer for level progression
              setCustomersServed((c) => c + 1);
              pendingBossRef.current = false;
              setPhase("playing");
              return null;
            }
            return { ...cur, phaseTick: nextTick };
          }
          case "lost": {
            if (nextTick >= 70) {
              const penalty = 40 + cur.encounterIdx * 10;
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

  // Boss attack hit-flash decay
  useEffect(() => {
    if (bossHitTick <= 0) return;
    const t = setTimeout(() => setBossHitTick((v) => (v >= 8 ? 0 : v + 1)), 40);
    return () => clearTimeout(t);
  }, [bossHitTick]);

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
            if (reward > 0) {
              playCoinSound();
              setEarthCoins((g) => {
                const n = g + reward;
                window.localStorage.setItem("scoopstack-earth-coins", n.toString());
                return n;
              });
            }
            setPhase("shop");
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
  const handleBossTap = useCallback(() => {
    setBossFight((cur) => {
      if (!cur || cur.phase !== "tap") return cur;
      playBoop();
      return { ...cur, tapCount: cur.tapCount + 1 };
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
  }, [warpActive, cutsceneType]);

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
    const worldW = streetWorldWidth(getShops(loc));
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
  }, []);

  // Door tap: open the fork panel (Ship vs Shops). For first-time use the
  // door is only enabled after the player has visited the alien planet at least once.
  const handleDoorTap = useCallback(() => {
    if (chatActive) return;
    playDing();
    setDoorOfferActive(true);
  }, [chatActive]);

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
    setCutsceneTick(0);
    setPhase("cutscene");
  }, [alienVisited, location]);

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

  const closeDoorOffer = useCallback(() => {
    playBoop();
    setDoorOfferActive(false);
  }, []);

  // ── Street + Shop handlers ─────────────────────────────────────────────
  const persistInventory = useCallback((inv: Record<string, number>) => {
    try { window.localStorage.setItem("scoopstack-inventory", JSON.stringify(inv)); } catch { /* private mode etc. */ }
  }, []);

  const persistEquipped = useCallback((held: string | null, decor: string[]) => {
    try { window.localStorage.setItem("scoopstack-equipped", JSON.stringify({ held, decor })); } catch { /* */ }
  }, []);

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
    setPhase("shop");
  }, []);

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
  }, []);

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
    setPhase("shop");
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
    setShopFlash(`Bought ${item.name}! +1`);
  }, [totalGold, location, persistInventory]);

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
    const worldW = streetWorldWidth(getShops(location));
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
  }, [phase, location]);

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
      const shops = getShops(location);
      const cameraX = streetCameraX(heroX, shops);
      const worldGx = gx + cameraX;
      for (let i = 0; i < shops.length; i++) {
        const bxWorld = STREET_MARGIN + i * (STREET_SHOP_W + STREET_GAP);
        if (worldGx >= bxWorld && worldGx <= bxWorld + STREET_SHOP_W && gy >= 11 && gy <= 76) {
          enterShop(shops[i].id);
          return;
        }
      }
    },
    [chatActive, streetNpcs, location, pickDialogue, enterShop, heroX]
  );

  // Tap handler for the shop interior — route exit door tap, owner chat
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
      // Owner (center)
      if (Math.abs(gx - 64) < 12 && gy > 50 && gy < 78) {
        const shop = currentShopId ? shopById(currentShopId) : null;
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
    [chatActive, currentShopId, exitShop]
  );

  // Canvas tap handler — detect character taps
  const handleCanvasTap = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (chatActive) return; // don't open another chat while one is active
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
    [chatActive, customer, pickDialogue, handleDoorTap]
  );

  const handleChatChoice = useCallback((nextIdx: number) => {
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
  }, []);

  const closeChat = useCallback(() => {
    setChatActive(false);
    setChatTarget(null);
    // If the alien VIP is still there after bye, walk them out
    setCustomer((prev) => prev && prev.isAlienVIP ? { ...prev, state: "walking-out" } : prev);
  }, []);

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
      if (pilotOfferRef.current) return;
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
  }, [phase, cutsceneType]);

  // ── Black hole ambient tick + auto-transitions ────────────────────────
  useEffect(() => {
    if (phase !== "blackhole" || !blackholeScene) return;
    const interval = setInterval(() => {
      setBlackholeTick((t) => {
        const next = t + 1;
        if (blackholeScene === "pull-in" && next >= 110) {
          // 30% chance to get flung to prehistoric Earth instead of the fork
          setBlackholeScene(Math.random() < 0.3 ? "dino-intro" : "fork");
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
  }, [phase, blackholeScene, blackholeReturnTo, blackholeBonus]);

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
            : phase === "chase" ? handleChaseTap
            : handleCanvasTap
          }
          onTouchStart={
            phase === "street" ? handleStreetTap
            : phase === "shop" ? handleShopTap
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
          <p className="text-sm" style={{ color: "#555" }}>tap a shop to enter</p>
          <button onClick={exitStreet}
            className="rounded-lg border-b-4 font-bold py-2 px-3 text-sm"
            style={{ background: "linear-gradient(180deg, #B0FFC8, #50C080)", borderBottomColor: "#208050", color: "#FFF" }}>
            {"\u{1F3E0}"} Go home
          </button>
        </div>
      )}

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
                more cabinets coming soon
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
                      disabled={!affordable}
                      className="flex items-center gap-3 p-2 rounded-lg text-left transition-all active:scale-[0.99] border-b-4"
                      style={{
                        background: affordable ? "linear-gradient(180deg, #FFF, #FFF4B8)" : "linear-gradient(180deg, #EEE, #CCC)",
                        borderBottomColor: affordable ? shop.signColor : "#999",
                        color: "#333",
                        opacity: affordable ? 1 : 0.7,
                      }}>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="flex-1">
                        <strong>{item.name}</strong>
                        <br /><span className="text-xs" style={{ color: "#666" }}>{item.description}</span>
                      </span>
                      <span className="text-right">
                        <span className="font-bold" style={{ color: shop.accentColor }}>{item.price}G</span>
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

      {/* Boss fight overlay — the entire interaction is the big TAP button + thermometer */}
      {phase === "boss-fight" && bossFight && (
        <div className="w-full max-w-lg rounded-2xl p-4 mb-3 border-4"
          style={{
            fontFamily: "monospace",
            background: bossFight.bossOnAlien
              ? "linear-gradient(180deg, #100028, #2A0848)"
              : "linear-gradient(180deg, #2A0808, #4A1010)",
            borderColor: "#FF4040",
            color: "#FFF",
          }}>
          {/* Top row: round + timer */}
          <div className="flex items-center justify-between mb-2 text-sm">
            <span><strong>ROUND {bossFight.round}</strong></span>
            <span style={{ color: "#FFE080" }}>
              {bossFight.phase === "tap"
                ? `${(bossFight.timeLeft / 1000).toFixed(1)}s`
                : bossFight.phase === "round-start"
                  ? "get ready!"
                  : bossFight.phase === "player-attack"
                    ? "HIT!"
                    : bossFight.phase === "boss-attack"
                      ? "incoming!"
                      : bossFight.phase === "won"
                        ? "+" + (250 + bossFight.encounterIdx * 50) + "G"
                        : bossFight.phase === "lost"
                          ? "-" + (40 + bossFight.encounterIdx * 10) + "G"
                          : ""
              }
            </span>
          </div>

          {/* Thermometer / progress bar */}
          <div className="relative h-5 rounded-full border-2 overflow-hidden mb-3"
            style={{ borderColor: "#FFFFFF", background: "#300A14" }}>
            <div className="h-full transition-all duration-50"
              style={{
                width: `${Math.min(100, (bossFight.tapCount / bossFight.tapTarget) * 100)}%`,
                background: "linear-gradient(90deg, #FFE080, #FF4040)",
              }} />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold"
              style={{ color: "#FFFFFF", textShadow: "1px 1px 0 #000" }}>
              {bossFight.tapCount} / {bossFight.tapTarget} taps
            </div>
          </div>

          {/* Time bar */}
          {bossFight.phase === "tap" && (
            <div className="h-2 rounded-full border overflow-hidden mb-3"
              style={{ borderColor: "#FFFFFF", background: "#200", opacity: 0.8 }}>
              <div className="h-full"
                style={{
                  width: `${Math.max(0, (bossFight.timeLeft / bossFight.roundTime) * 100)}%`,
                  background: bossFight.timeLeft < 1500 ? "#FF4040" : "#80E0FF",
                  transition: "width 40ms linear",
                }} />
            </div>
          )}

          {/* The one and only big TAP button */}
          <button onClick={handleBossTap}
            disabled={bossFight.phase !== "tap"}
            onTouchStart={(e) => { e.preventDefault(); handleBossTap(); }}
            className="w-full py-6 rounded-2xl font-bold text-3xl transition-all active:scale-95 border-b-8 select-none"
            style={{
              background: bossFight.phase === "tap"
                ? "radial-gradient(circle at 30% 30%, #FFE080, #FF4040 60%, #A01010)"
                : "linear-gradient(180deg, #555, #222)",
              borderBottomColor: bossFight.phase === "tap" ? "#601010" : "#111",
              color: "#FFF",
              textShadow: "2px 2px 0 #400",
              cursor: bossFight.phase === "tap" ? "pointer" : "default",
              opacity: bossFight.phase === "tap" ? 1 : 0.6,
            }}>
            {bossFight.phase === "tap"
              ? "TAP! TAP! TAP!"
              : bossFight.phase === "intro"
                ? "BOSS FIGHT!"
                : bossFight.phase === "round-start"
                  ? `ROUND ${bossFight.round}`
                  : bossFight.phase === "player-attack"
                    ? "POW!"
                    : bossFight.phase === "boss-attack"
                      ? "OUCH!"
                      : bossFight.phase === "won"
                        ? "VICTORY!"
                        : "DEFEATED..."}
          </button>
        </div>
      )}

      {/* Warp drive button (only during journey cutscenes, not already warping) */}
      {phase === "cutscene" && (cutsceneType === "journey-out" || cutsceneType === "journey-back") && !warpActive && !pilotOfferActive && (
        <div className="w-full max-w-lg flex justify-end mb-2">
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
      {phase !== "blackhole" && phase !== "pilot" && phase !== "street" && phase !== "shop" && phase !== "chase" && phase !== "boss-fight" && phase !== "sarahs-world" && (
      <div className="w-full max-w-lg">
        {!toppingsPhase ? (
          <div className="grid grid-cols-3 gap-2">
            {(location === "alien-planet" ? ALIEN_FLAVORS : FLAVORS).map((f) => {
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
            {(location === "alien-planet" ? ALIEN_TOPPINGS : TOPPINGS).map((t) => {
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
