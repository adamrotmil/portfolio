import type { Brain } from "./base";
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
  greeting?: string;
  dialogue?: Record<string, string>;
  farewell?: string;
  /** Ticks an NPC stays "engaged" (paused + responsive) after being addressed. */
  engage_for?: number;
}

class WandererBrain implements Brain {
  private moveEvery: number;
  private chatEvery: number;
  private lines: string[];
  private lastMove = 0;
  private lastChat = 0;
  private greeting: string;
  private dialogue: Record<string, string>;
  private farewell: string;
  private engageFor: number;
  private engagedUntil = 0;
  private lastTick = 0;

  constructor(p: Params) {
    this.moveEvery = p.move_every ?? 6;
    this.chatEvery = p.chat_every ?? 12;
    this.lines = p.lines ?? DEFAULT_LINES;
    this.greeting = p.greeting ?? "Well met, traveler.";
    this.dialogue = p.dialogue ?? {};
    this.farewell = p.farewell ?? "Safe travels.";
    this.engageFor = p.engage_for ?? 20;
  }

  onTick(npc: Entity, world: World, bus: EventBus, tick: number) {
    this.lastTick = tick;

    // If engaged in conversation, hold position and chime in occasionally.
    if (tick < this.engagedUntil) {
      if (tick - this.lastChat >= 4 && Math.random() < 0.18) {
        this.lastChat = tick;
        const text = this.lines[Math.floor(Math.random() * this.lines.length)];
        bus.emit({ kind: "entity.spoke", room: npc.room, actor: npc.id, data: { text, ambient: true } });
      }
      return;
    }

    // Move
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
      bus.emit({ kind: "entity.spoke", room: npc.room, actor: npc.id, data: { text, ambient: true } });
    }
  }

  onSpeech(_npc: Entity, _speaker: Entity, text: string) {
    this.engagedUntil = this.lastTick + this.engageFor;
    const t = (text ?? "").toLowerCase().trim();
    if (!t) return this.greeting;
    if (t === "bye" || t === "farewell" || t.includes("goodbye")) {
      this.engagedUntil = 0;
      return this.farewell;
    }
    for (const [key, reply] of Object.entries(this.dialogue)) {
      if (t.includes(key.toLowerCase())) return reply;
    }
    return this.greeting;
  }
}

registerBrain("wanderer", (p) => new WandererBrain(p as Params));
