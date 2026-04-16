// Foothills Narrator — the LLM fallback worker for the Foothills MUD.
//
// When the game engine can't handle a command ("examine the stars", "sing",
// "go skyward"), the browser POSTs to this worker.  The worker calls Claude
// with a strict system prompt and returns 1–3 short atmospheric lines that
// describe what the player *perceives* — never a result that changes world
// state.
//
// Design priorities, in order:
//   1. Safety — the model cannot grant items, open exits, heal, etc.
//   2. Budget — a daily global cap + short output tokens = ~$5/mo ceiling.
//   3. Immersion — responses feel continuous with the game's own prose.

interface Env {
  ANTHROPIC_API_KEY: string;
  ANTHROPIC_MODEL: string;       // default set in wrangler.toml
  ALLOWED_ORIGINS: string;       // comma-separated
  DAILY_CALL_CAP: string;        // e.g. "350"
}

// ---- Request / response contract ----------------------------------------

interface NarrateRequest {
  command: string;                         // raw player input
  reason:
    | "unknown-verb"
    | "unknown-object"
    | "unknown-direction"
    | "unscripted-topic"
    | "generic";
  room: {
    id?: string;
    name: string;
    description: string;
    exits: string[];                        // directions
    items: string[];                        // item names visible
    occupants: {
      name: string;
      kind: "player" | "npc" | "mob";
    }[];
  };
  player: {
    hp: number;
    max_hp: number;
    inventory: string[];                    // item names
  };
  target?: string;                          // name the player referenced (if any)
  recent?: string[];                        // last 3–6 lines of game output
}

interface NarrateResponse {
  lines: string[];                          // each emitted as a separate line
}

// ---- System prompt ------------------------------------------------------

const SYSTEM_PROMPT = `You are the narrator of Foothills, a classic ASCII multi-user dungeon inspired by MUD1 (Essex, 1978). The player has attempted something the game engine cannot execute. Your job: respond with 1–2 short lines of atmospheric narration.

ABSOLUTE RULES:
- Describe what the player PERCEIVES. Never describe a RESULT that changes the world.
- Do not grant items, open exits, heal, damage, move the player, or change NPC state.
- Honor the provided room, exits, items, and NPCs as ground truth. Never invent adjacent rooms or absent characters.
- Do not speak on behalf of named NPCs with dialogue of their own — only describe what is observable about them.
- Tone: classic MUD. Second-person present tense. Spare prose. No modern slang, no emoji, no meta references.
- Never apologize, never refuse, never break character.
- Maximum 2 sentences. Maximum 160 characters.
- Return the narrative text only — no quotation marks, no framing, no prefix.
- If the player's command is nonsense or empty, just describe a small ambient detail of the room.

Output exactly one JSON object: {"lines": ["line 1", "line 2 (optional)"]}`;

// ---- Rate limiting ------------------------------------------------------
// A single in-memory counter per colo. Not globally exact, but combined with
// Anthropic's own spend cap it's more than enough for a portfolio piece.

let dailyCount = 0;
let dailyBucket = dayBucket();

function dayBucket(): number {
  // Days since 2000-01-01 UTC.
  return Math.floor(Date.now() / 86_400_000);
}

function bumpDailyCounter(): number {
  const now = dayBucket();
  if (now !== dailyBucket) {
    dailyBucket = now;
    dailyCount = 0;
  }
  return ++dailyCount;
}

// ---- Worker -------------------------------------------------------------

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }), req, env);
    }

    if (url.pathname === "/health") {
      return cors(
        new Response(JSON.stringify({ ok: true, model: env.ANTHROPIC_MODEL }), {
          headers: { "content-type": "application/json" },
        }),
        req,
        env,
      );
    }

    if (url.pathname !== "/narrate" || req.method !== "POST") {
      return cors(new Response("not found", { status: 404 }), req, env);
    }

    // Origin check
    const origin = req.headers.get("origin") ?? "";
    if (!isAllowedOrigin(origin, env)) {
      return cors(new Response("forbidden", { status: 403 }), req, env);
    }

    // Daily cap
    const cap = parseInt(env.DAILY_CALL_CAP, 10) || 350;
    const count = bumpDailyCounter();
    if (count > cap) {
      return cors(
        json({ lines: [] }, 429),  // client will fall through to static message
        req, env,
      );
    }

    // Parse + validate
    let payload: NarrateRequest;
    try {
      payload = (await req.json()) as NarrateRequest;
    } catch {
      return cors(new Response("bad json", { status: 400 }), req, env);
    }

    if (!payload?.command || typeof payload.command !== "string") {
      return cors(new Response("missing command", { status: 400 }), req, env);
    }
    if (payload.command.length > 200) {
      return cors(new Response("command too long", { status: 400 }), req, env);
    }

    // Call Anthropic
    try {
      const lines = await callClaude(payload, env);
      return cors(json({ lines }), req, env);
    } catch (err) {
      // If upstream fails, empty lines → client falls through to static reply.
      return cors(json({ lines: [] }, 502), req, env);
    }
  },
};

// ---- Anthropic call -----------------------------------------------------

async function callClaude(p: NarrateRequest, env: Env): Promise<string[]> {
  // Defensive summary — we don't shove the whole payload at the model, just
  // the pieces that help it respond well.
  const userMessage = JSON.stringify({
    player_command: p.command,
    reason: p.reason,
    room: {
      name: p.room.name,
      description: p.room.description,
      exits: p.room.exits,
      items: p.room.items,
      occupants: p.room.occupants.map((o) => `${o.name} (${o.kind})`),
    },
    inventory: p.player.inventory,
    target: p.target ?? null,
    recent_lines: p.recent?.slice(-5) ?? [],
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 120,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    throw new Error(`anthropic ${res.status}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const textBlock = data.content?.find((c) => c.type === "text");
  const raw = textBlock?.text?.trim() ?? "";

  // Parse the model's response. It should be JSON {"lines": [...]}
  // but we're forgiving: if it's plain text, wrap it.
  try {
    const parsed = JSON.parse(raw) as NarrateResponse;
    if (Array.isArray(parsed.lines)) {
      return parsed.lines.filter((l) => typeof l === "string" && l.trim()).slice(0, 3);
    }
  } catch {
    // fall through
  }
  return raw ? [raw] : [];
}

// ---- Helpers ------------------------------------------------------------

function isAllowedOrigin(origin: string, env: Env): boolean {
  const list = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.includes(origin);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function cors(res: Response, req: Request, env: Env): Response {
  const origin = req.headers.get("origin") ?? "";
  const headers = new Headers(res.headers);
  if (isAllowedOrigin(origin, env)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
    headers.set("access-control-max-age", "86400");
    headers.set("vary", "origin");
  }
  return new Response(res.body, { status: res.status, headers });
}
