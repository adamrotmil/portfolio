import type { Brain, DialogueReply } from "./base";
import { registerBrain } from "./base";
import type { Entity } from "../world";
import type { EventBus } from "../events";
import type { World } from "../world";

// A single dialogue entry can be a lone line, or an array of lines emitted in
// order (for mixing emotes with speech in one "turn").  A topic's value can be
// either one such entry OR multiple variants (picked randomly, avoiding
// consecutive repeats).
//
// Conventions:
//   dialogue["rats"] = "One liner."              → single variant, single line
//   dialogue["rats"] = ["Variant A.", "Variant B."] → two variants (chooses one)
//   Embed `\n` to split a variant into multiple emitted lines.
//   Wrap a line in `*...*` to render it as an emote (Branfin wipes a glass.).
interface Params {
  firstGreeting?: string | string[];
  greeting?: string | string[];
  farewell?: string | string[];
  fallback?: string | string[];
  ambient?: string[];
  ambient_every?: number;
  dialogue?: Record<string, string | string[]>;
  topicsHint?: string;
  engage_for?: number;
}

interface Memory {
  turns: number;
  topics: Set<string>;
  lastVariant: Record<string, number>;
}

class ScriptedBrain implements Brain {
  private firstGreeting: string[];
  private greeting: string[];
  private farewell: string[];
  private fallback: string[];
  private ambient: string[];
  private ambientEvery: number;
  private dialogue: Record<string, string[]>;
  private topicsHint?: string;
  private engageFor: number;

  private lastAmbient = 0;
  private engagedUntil = 0;
  private lastTick = 0;
  private memory = new Map<string, Memory>();

  constructor(p: Params) {
    this.firstGreeting = toSeq(p.firstGreeting) ?? toSeq(p.greeting) ?? ["Hello, stranger."];
    this.greeting = toSeq(p.greeting) ?? this.firstGreeting;
    this.farewell = toSeq(p.farewell) ?? ["Mind the road."];
    this.fallback = toVariants(p.fallback) ?? ["I don't know much about that."];
    this.ambient = p.ambient ?? [];
    this.ambientEvery = p.ambient_every ?? 15;
    this.topicsHint = p.topicsHint;
    this.engageFor = p.engage_for ?? 20;
    this.dialogue = {};
    for (const [k, v] of Object.entries(p.dialogue ?? {})) {
      this.dialogue[k] = toVariants(v) ?? [];
    }
  }

  onTick(npc: Entity, _world: World, bus: EventBus, tick: number) {
    this.lastTick = tick;
    // Pause ambient chatter while engaged in conversation.
    if (tick < this.engagedUntil) return;
    if (!this.ambient.length) return;
    if (tick - this.lastAmbient < this.ambientEvery) return;
    if (Math.random() < 0.33) {
      this.lastAmbient = tick;
      const text = this.ambient[Math.floor(Math.random() * this.ambient.length)];
      // Ambient emotes (wrapped in *...*) go out as emotes; everything else
      // is spoken under their breath (ambient: true → rendered as whisper).
      const emote = text.match(/^\*(.+)\*$/);
      if (emote) {
        bus.emit({
          kind: "entity.emoted",
          room: npc.room,
          actor: npc.id,
          data: { text: emote[1].trim() },
        });
      } else {
        bus.emit({
          kind: "entity.spoke",
          room: npc.room,
          actor: npc.id,
          data: { text, ambient: true },
        });
      }
    }
  }

  onSpeech(_npc: Entity, speaker: Entity, text: string): DialogueReply {
    this.engagedUntil = this.lastTick + this.engageFor;
    const mem = this.getMemory(speaker.id);
    mem.turns++;

    const t = (text ?? "").toLowerCase().trim();

    // No explicit text → greeting (first-time vs. returning)
    if (!t) return this.pickGreeting(mem);

    // Farewell releases engagement
    if (/^(bye|goodbye|farewell|later|cya|see ya)\b/.test(t)) {
      this.engagedUntil = 0;
      return pickOne(this.farewell);
    }

    // "topics" / "what" / "about" / "help" → list known topics
    if (/^(topics|what|about|help|huh\??|\?)$/.test(t)) {
      if (this.topicsHint) return this.topicsHint;
    }

    // Longest-keyword-first match so "tomb wight" beats "tomb"
    const keys = Object.keys(this.dialogue).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (t.includes(key.toLowerCase())) {
        return this.pickVariant(mem, key);
      }
    }

    // Fallback — with a gentle topic nudge on repeat
    const fb = pickOne(this.fallback);
    if (this.topicsHint && mem.turns > 1 && Math.random() < 0.5) {
      return [fb, this.topicsHint];
    }
    return fb;
  }

  private getMemory(speakerId: string): Memory {
    let m = this.memory.get(speakerId);
    if (!m) {
      m = { turns: 0, topics: new Set(), lastVariant: {} };
      this.memory.set(speakerId, m);
    }
    return m;
  }

  private pickGreeting(mem: Memory): DialogueReply {
    const seq = mem.turns <= 1 ? this.firstGreeting : this.greeting;
    // First-time: optionally append the topics hint as its own line
    if (mem.turns <= 1 && this.topicsHint) {
      return [...seq, this.topicsHint];
    }
    return seq.length === 1 ? seq[0] : [...seq];
  }

  private pickVariant(mem: Memory, key: string): DialogueReply {
    mem.topics.add(key);
    const variants = this.dialogue[key];
    if (!variants.length) return null;
    if (variants.length === 1) return variants[0];
    const last = mem.lastVariant[key];
    let idx = Math.floor(Math.random() * variants.length);
    if (idx === last) idx = (idx + 1) % variants.length;
    mem.lastVariant[key] = idx;
    return variants[idx];
  }
}

// ---- helpers ----------------------------------------------------------

/** A `sequence` value — represents ONE reply that may span multiple lines
 *  (emitted in order).  `string` stays a single line; `string[]` stays a
 *  sequence. */
function toSeq(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? [...v] : [v];
}

/** A `variants` value — represents MANY possible replies, one chosen at a
 *  time.  `string` becomes a single-variant list; `string[]` becomes the
 *  list as-is.  If a variant needs multiple lines, embed `\n`. */
function toVariants(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? [...v] : [v];
}

function pickOne(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

registerBrain("scripted", (p) => new ScriptedBrain(p as Params));
