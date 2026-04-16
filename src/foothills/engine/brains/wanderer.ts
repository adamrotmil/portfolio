import type { Brain, DialogueReply } from "./base";
import { registerBrain } from "./base";
import type { Entity } from "../world";
import type { EventBus } from "../events";
import type { World } from "../world";

const DEFAULT_LINES = [
  "this way to the inn, friends",
  "damn rats.",
  "anyone got a healing potion?",
  "who's brewing tonight?",
  "off to the peak. wish me luck.",
  "ha! you call that a sword?",
  "brb, innkeeper is calling",
  "cemetery gives me the creeps",
];

interface Params {
  move_every?: number;
  chat_every?: number;
  lines?: string[];
  firstGreeting?: string | string[];
  greeting?: string | string[];
  farewell?: string | string[];
  fallback?: string | string[];
  dialogue?: Record<string, string | string[]>;
  topicsHint?: string;
  engage_for?: number;
}

interface Memory {
  turns: number;
  lastVariant: Record<string, number>;
}

class WandererBrain implements Brain {
  private moveEvery: number;
  private chatEvery: number;
  private lines: string[];
  private firstGreeting: string[];
  private greeting: string[];
  private farewell: string[];
  private fallback: string[];
  private dialogue: Record<string, string[]>;
  private topicsHint?: string;
  private engageFor: number;

  private lastMove = 0;
  private lastChat = 0;
  private engagedUntil = 0;
  private lastTick = 0;
  private memory = new Map<string, Memory>();

  constructor(p: Params) {
    this.moveEvery = p.move_every ?? 6;
    this.chatEvery = p.chat_every ?? 12;
    this.lines = p.lines ?? DEFAULT_LINES;
    this.firstGreeting = toSeq(p.firstGreeting) ?? toSeq(p.greeting) ?? ["Well met, traveler."];
    this.greeting = toSeq(p.greeting) ?? this.firstGreeting;
    this.farewell = toSeq(p.farewell) ?? ["Safe travels."];
    this.fallback = toArr(p.fallback) ?? ["Can't help you there, friend."];
    this.topicsHint = p.topicsHint;
    this.engageFor = p.engage_for ?? 24;
    this.dialogue = {};
    for (const [k, v] of Object.entries(p.dialogue ?? {})) {
      this.dialogue[k] = toArr(v) ?? [];
    }
  }

  onTick(npc: Entity, world: World, bus: EventBus, tick: number) {
    this.lastTick = tick;

    // Engaged in conversation — stay put; occasionally emit an ambient line.
    if (tick < this.engagedUntil) {
      if (tick - this.lastChat >= 4 && Math.random() < 0.18) {
        this.lastChat = tick;
        const text = this.lines[Math.floor(Math.random() * this.lines.length)];
        emitAmbientLine(bus, npc, text);
      }
      return;
    }

    // Wander
    if (tick - this.lastMove >= this.moveEvery && Math.random() < 0.6) {
      this.lastMove = tick;
      const room = world.rooms[npc.room];
      if (room && Object.keys(room.exits).length) {
        const dirs = Object.keys(room.exits);
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const next = room.exits[dir];
        const old = npc.room;
        world.removeOccupant(old, npc.id);
        npc.room = next;
        world.addOccupant(next, npc.id);
        bus.emit({ kind: "entity.moved", room: old, actor: npc.id, data: { dir, to: next } });
        bus.emit({ kind: "entity.arrived", room: next, actor: npc.id, data: { from: old } });
      }
    }

    // Ambient chatter
    if (tick - this.lastChat >= this.chatEvery && Math.random() < 0.4) {
      this.lastChat = tick;
      const text = this.lines[Math.floor(Math.random() * this.lines.length)];
      emitAmbientLine(bus, npc, text);
    }
  }

  onSpeech(_npc: Entity, speaker: Entity, text: string): DialogueReply {
    this.engagedUntil = this.lastTick + this.engageFor;
    const mem = this.getMemory(speaker.id);
    mem.turns++;

    const t = (text ?? "").toLowerCase().trim();

    if (!t) return mem.turns <= 1 ? this.withTopicsHint(this.firstGreeting, mem) : pickSeq(this.greeting);

    if (/^(bye|goodbye|farewell|later|cya|see ya)\b/.test(t)) {
      this.engagedUntil = 0;
      return pickSeq(this.farewell);
    }
    if (/^(topics|what|about|help|huh\??|\?)$/.test(t)) {
      if (this.topicsHint) return this.topicsHint;
    }

    const keys = Object.keys(this.dialogue).sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (t.includes(key.toLowerCase())) {
        return this.pickVariant(mem, key);
      }
    }

    const fb = this.fallback[Math.floor(Math.random() * this.fallback.length)];
    if (this.topicsHint && Math.random() < 0.4) return [fb, this.topicsHint];
    return fb;
  }

  private getMemory(speakerId: string): Memory {
    let m = this.memory.get(speakerId);
    if (!m) {
      m = { turns: 0, lastVariant: {} };
      this.memory.set(speakerId, m);
    }
    return m;
  }

  private pickVariant(mem: Memory, key: string): DialogueReply {
    const variants = this.dialogue[key];
    if (!variants.length) return null;
    if (variants.length === 1) return variants[0];
    const last = mem.lastVariant[key];
    let idx = Math.floor(Math.random() * variants.length);
    if (idx === last) idx = (idx + 1) % variants.length;
    mem.lastVariant[key] = idx;
    return variants[idx];
  }

  private withTopicsHint(seq: string[], _mem: Memory): DialogueReply {
    return this.topicsHint ? [...seq, this.topicsHint] : seq.length === 1 ? seq[0] : [...seq];
  }
}

function toSeq(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? [...v] : [v];
}
function toArr(v: string | string[] | undefined): string[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? [...v] : [v];
}
function pickSeq(seq: string[]): DialogueReply {
  return seq.length === 1 ? seq[0] : [...seq];
}
function emitAmbientLine(bus: EventBus, npc: Entity, text: string) {
  const emote = text.match(/^\*(.+)\*$/);
  if (emote) {
    bus.emit({ kind: "entity.emoted", room: npc.room, actor: npc.id, data: { text: emote[1].trim() } });
  } else {
    bus.emit({ kind: "entity.spoke", room: npc.room, actor: npc.id, data: { text, ambient: true } });
  }
}

registerBrain("wanderer", (p) => new WandererBrain(p as Params));
