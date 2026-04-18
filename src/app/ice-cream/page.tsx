"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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

type GamePhase = "menu" | "playing" | "cutscene" | "blackhole" | "result";

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
  | "burst-out";         // white-hole burst, auto -> landing

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

function createMusicContext(): { stop: () => void } | null {
  const audioCtx = getAudioCtx();
  if (!audioCtx) return null;
  const ctx = audioCtx;
  try {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    masterGain.connect(ctx.destination);
    const notes = [
      523, 587, 659, 698, 784, 698, 659, 587,
      523, 659, 784, 880, 784, 659, 523, 440,
      523, 523, 587, 587, 659, 659, 698, 784,
      880, 784, 698, 659, 587, 523, 440, 523,
    ];
    const dur = 0.22;
    const loopLen = notes.length * dur;
    let stopped = false;
    function scheduleLoop(t: number) {
      if (stopped) return;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.connect(g); g.connect(masterGain);
        osc.type = "square";
        const nt = t + i * dur;
        osc.frequency.setValueAtTime(freq, nt);
        g.gain.setValueAtTime(0, nt);
        g.gain.linearRampToValueAtTime(0.4, nt + 0.02);
        g.gain.linearRampToValueAtTime(0.2, nt + dur * 0.5);
        g.gain.linearRampToValueAtTime(0, nt + dur * 0.95);
        osc.start(nt); osc.stop(nt + dur);
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

function drawShopkeeper(ctx: CanvasRenderingContext2D, x: number, y: number) {
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

  const level = Math.floor(customersServed / 3) + 1;
  const totalGold = earthCoins + alienCoins;

  // ── Canvas rendering loop ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "playing" && phase !== "cutscene" && phase !== "blackhole") return;
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
        drawAlienShopkeeper(ctx, 64, 70, t);
      } else {
        drawBackground(ctx);
        drawShopkeeper(ctx, 64, 70);
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
        case "pull-in":     drawBlackHolePullIn(ctx, t); break;
        case "fork":        drawDimensionFork(ctx, t); break;
        case "mirrors":     drawMirrorYou(ctx, t); break;
        case "clockwork":   drawClockNebula(ctx, t); break;
        case "library":     drawInfiniteLibrary(ctx, t); break;
        case "exit":        drawExitPortal(ctx, t); break;
        case "burst-out":   drawBurstOut(ctx, t); break;
      }
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      if (phase === "cutscene") {
        drawCutscene();
      } else if (phase === "blackhole") {
        drawBlackhole();
      } else {
        drawShopScene();
      }
      drawHud();
      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [phase, customer, scoopsDone, coneScoops, toppingsDone, toppingsPhase, level, customersServed, goldCoins, totalGold, location, cutsceneType, cutsceneTick, blackholeScene, blackholeTick]);

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
  }, [customer, phase, level, walkCustomerIn, location, pendingAlien]);

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
    const coinCount = (1 + customer.order.length + customer.toppings.length) * (isVIP ? 3 : 1);
    const pointsEarned = (100 + customer.toppings.length * 25) * (isVIP ? 3 : 1);
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
    setPendingAlien(false);
    setAlienEncountered(false);
    setChatActive(false); setChatTarget(null);
    chatHistoryRef.current = { customer: [], scoopy: [] };
    customerIdRef.current = 0; setPhase("playing");
    if (musicRef.current) musicRef.current.stop();
    musicRef.current = createMusicContext();
    setMusicOn(true);
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; setMusicOn(false); }
    else { musicRef.current = createMusicContext(); setMusicOn(true); }
  }, []);

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

  // Door tap → travel between shops (bidirectional)
  const handleDoorTap = useCallback(() => {
    if (!alienVisited) return; // only enabled after first alien trip
    if (chatActive) return;
    playDing();
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
  }, [alienVisited, chatActive, location]);

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

      // Door: drawn at x = W - 18 .. W - 4, y = 20 .. 70. Tap to travel (once alien has been visited).
      if (alienVisited && gx >= W - 18 && gx <= W - 2 && gy >= 20 && gy <= 70) {
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
    [chatActive, customer, pickDialogue, alienVisited, handleDoorTap]
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
    let blackholeRolled = false;
    const interval = setInterval(() => {
      setCutsceneTick((t) => {
        const next = t + 1;
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
          setBlackholeScene("fork");
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

  useEffect(() => {
    return () => {
      if (walkIntervalRef.current) clearInterval(walkIntervalRef.current);
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
        }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasTap}
          onTouchStart={handleCanvasTap}
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
      {phase !== "blackhole" && (
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
