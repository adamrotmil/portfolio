export const BIO = [
  "I\u2019ve spent 20 years designing products across healthcare, finance, AI, and defense. I led the interaction design craft for 70 designers at Fjord/Accenture, ran product design for digital oncology R&D at AstraZeneca, and taught graduate students at MICA.",
  "I studied art history, typography at the Basel School of Design, and completed coursework at Harvard. I lived in Japan for five years, where I practiced brush calligraphy and sumi-e painting — disciplines that still shape how I think about composition and restraint.",
  "Now I\u2019m building AI-native products and shipping code. I believe the best designers in the next decade will be the ones who can think in systems, prompt in natural language, and close the gap between vision and implementation.",
];

export const EXPERIENCE = [
  {
    period: "2024 – Present",
    role: "Lead Product Designer",
    company: "Clarvos",
  },
  {
    period: "2023 – 2024",
    role: "Principal Product Designer",
    company: "LegalShield",
  },
  {
    period: "2021 – 2023",
    role: "Design Lead, Digital Health",
    company: "AstraZeneca",
  },
  {
    period: "2019 – 2021",
    role: "Craft Lead, Interaction Design",
    company: "Fjord / Accenture",
  },
  {
    period: "2017 – 2019",
    role: "Senior Manager, UX Design",
    company: "T. Rowe Price",
  },
];

export const TEACHING = {
  role: "Faculty, M.P.S. Design Program",
  institution: "Maryland Institute College of Art",
  period: "2017 – 2020",
  description:
    "I taught a graduate course on product design at America's oldest art college. I developed original course content and taught multiple classes of 20+ students from all backgrounds. Many of my students went on to become design directors, lead designers, and accessibility experts.",
};

export const CREDENTIALS = [
  "Published in Forbes & NYT",
  "MICA Faculty",
  "Basel School of Design",
  "Harvard",
  "Spoke at Product Camp EU",
  "Still Iterating Podcast",
];

export const COMPANY_BADGES = [
  "Fjord / Accenture",
  "AstraZeneca",
  "T. Rowe Price",
  "Goldman Sachs",
  "MICA Faculty",
];

export type LabItem = {
  title: string;
  description: string;
  tech: string;
  url?: string;
  action?: "foothills" | "watchrc" | "ticker" | "table";
  /** Thumbnail image (path under /public).  Every Lab tile gets one —
   *  either a real captured view of the demo (sandboxes) or a
   *  hand-drawn illustrative SVG that communicates the thing the tile
   *  links to (link-outs).  No generic shader placeholders. */
  thumbnail?: string;
};

export const LAB_ITEMS: LabItem[] = [
  {
    title: "Ticker Sandbox",
    description:
      "A real-time crypto chart playground built on Benji Taylor's Liveline — live BTC/ETH/SOL feeds, order book, CVD, and a wild-swings mock market.",
    action: "ticker",
    tech: "Liveline · React · Motion",
    thumbnail: "/images/lab/ticker-sandbox.svg",
  },
  {
    title: "Table",
    description:
      "Live telemetry, tactical feed, and satellite map for NYC restaurants.",
    action: "table",
    tech: "MapLibre GL · NYC DOT · React",
    thumbnail: "/images/lab/table.svg",
  },
  {
    title: "Remote Flight",
    description:
      "A smartwatch remote control for an RC airplane. 8 screens with iOS-native springs.",
    action: "watchrc",
    tech: "React · Motion · iOS UX",
    thumbnail: "/images/lab/remote-flight.svg",
  },
  {
    title: "Foothills",
    description:
      "A classic ASCII MUD in the spirit of MUD1, Essex 1978. 30 rooms, NPCs, combat, and an agent-ready NPC brain seam.",
    action: "foothills",
    tech: "TypeScript · React · game engine",
    thumbnail: "/images/lab/foothills.svg",
  },
  {
    title: "SwiftUI Interaction Lab",
    description:
      "Native iOS and macOS interaction experiments I'm building in public while learning SwiftUI.",
    url: "https://github.com/adamrotmil/swiftui-interaction-lab",
    tech: "SwiftUI · iOS · macOS",
    thumbnail: "/images/lab/swiftui-interaction-lab.svg",
  },
  {
    title: "Client Headlines",
    description:
      "A hybrid AI + mad-libs headline generator for marketing copy. Claude drafts, a template engine fills the blanks.",
    url: "https://adamrotmil.github.io/client-headlines/clients-say.html",
    tech: "Claude API · Cloudflare Workers",
    thumbnail: "/images/lab/client-headlines.svg",
  },
  {
    title: "Know Your Design Trivia",
    description:
      "A trivia game about the history and craft of graphic design — typography, designers, movements, and the details that matter.",
    url: "https://github.com/adamrotmil/know-your-design-trivia",
    tech: "HTML · CSS · JavaScript",
    thumbnail: "/images/lab/design-trivia.svg",
  },
];

export const CONTACT = {
  email: "adam.rotmil@gmail.com",
  calendly:
    "https://calendly.com/adam-rotmil/chat-with-adam-rotmil-30-min",
  social: [
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/adam-rotmil/",
    },
    { label: "GitHub", url: "https://github.com/adamrotmil" },
    { label: "Twitter", url: "https://twitter.com/rotmil_adam" },
    {
      label: "ADPList",
      url: "https://adplist.org/mentors/adam-rotmil",
    },
  ],
};
