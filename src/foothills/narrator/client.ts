import type { NarrateRequest, NarrateResponse } from "./contract";
import { NARRATOR_TIMEOUT_MS, NARRATOR_URL } from "./config";

// In-memory ring of recent narrator output, used to give the model
// continuity. Populated by the engine each time the narrator speaks.
const recentRing: string[] = [];
const RECENT_MAX = 6;

export function rememberNarrationLine(text: string): void {
  recentRing.push(text);
  if (recentRing.length > RECENT_MAX) recentRing.shift();
}

export function recentNarration(): string[] {
  return [...recentRing];
}

/** Whether the narrator is configured at all. */
export function narratorEnabled(): boolean {
  return Boolean(NARRATOR_URL);
}

/**
 * Call the narrator and return its `lines`, or `null` if the narrator is
 * disabled, the request times out, the Worker errors, or it returns no
 * content. Callers should fall through to a static message on `null`.
 */
export async function askNarrator(req: NarrateRequest): Promise<string[] | null> {
  if (!NARRATOR_URL) return null;

  // Mock mode — useful for local development without a deployed Worker.
  // Enable by setting NARRATOR_URL = "mock:" in config.ts.
  if (NARRATOR_URL === "mock:") {
    return mockResponse(req);
  }

  const ctl = new AbortController();
  const timer = window.setTimeout(() => ctl.abort(), NARRATOR_TIMEOUT_MS);
  try {
    const res = await fetch(NARRATOR_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal: ctl.signal,
    });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as NarrateResponse;
    if (!Array.isArray(data.lines)) return null;
    const cleaned = data.lines
      .map((l) => (typeof l === "string" ? l.trim() : ""))
      .filter((l) => l.length > 0)
      .slice(0, 3);
    return cleaned.length ? cleaned : null;
  } catch {
    window.clearTimeout(timer);
    return null;
  }
}

// ---- Mock responses for offline development --------------------------

function mockResponse(req: NarrateRequest): string[] {
  const c = req.command.toLowerCase().trim();
  const roomName = req.room.name;

  // A handful of canned responses, chosen by rough keyword so dev output
  // has some variety without a real model.
  const templates: { match: (s: string) => boolean; lines: string[] }[] = [
    {
      match: (s) => /\b(sing|hum|whistle)\b/.test(s),
      lines: [
        "You hum a few bars under your breath. The walls catch the sound and give it back, smaller.",
      ],
    },
    {
      match: (s) => /\b(pray|kneel|worship)\b/.test(s),
      lines: ["You bow your head a moment. The road is quiet. The stones do not answer."],
    },
    {
      match: (s) => /\b(dance|jump|spin)\b/.test(s),
      lines: [
        "You step, then catch yourself. The floor of " + roomName.toLowerCase() + " is uneven; better to walk than to dance.",
      ],
    },
    {
      match: (s) => /\b(smell|sniff|taste)\b/.test(s),
      lines: [
        "You breathe in. Old wood, damp stone, the faint pepper of dried herbs.",
      ],
    },
    {
      match: (s) => /\b(listen|hear)\b/.test(s),
      lines: [
        "You hold still. The silence here has its own weight — wind, far off, and nothing nearer.",
      ],
    },
    {
      match: (s) => /\b(look|stare)\b.*(sky|ceiling|up)\b/.test(s),
      lines: ["You look up. Whatever's there is not for you tonight."],
    },
    {
      match: (s) => /\b(sit|rest|lie)\b/.test(s),
      lines: ["You ease down a moment. The road hasn't ended, but it has paused."],
    },
  ];

  for (const t of templates) {
    if (t.match(c)) return t.lines;
  }

  // Default: neutral atmospheric ack
  return [`You try to ${c || "do something"}, but nothing in ${roomName} yields to the attempt.`];
}
