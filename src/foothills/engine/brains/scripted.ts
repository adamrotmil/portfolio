import type { Brain } from "./base";
import { registerBrain } from "./base";
import type { Entity } from "../world";
import type { EventBus } from "../events";
import type { World } from "../world";

interface Params {
  greeting?: string;
  ambient?: string[];
  ambient_every?: number;
  dialogue?: Record<string, string>;
  farewell?: string;
  engage_for?: number;
}

class ScriptedBrain implements Brain {
  private greeting: string;
  private ambient: string[];
  private ambientEvery: number;
  private dialogue: Record<string, string>;
  private farewell: string;
  private engageFor: number;
  private lastAmbient = 0;
  private engagedUntil = 0;
  private lastTick = 0;

  constructor(p: Params) {
    this.greeting = p.greeting ?? "Hello, stranger.";
    this.ambient = p.ambient ?? [];
    this.ambientEvery = p.ambient_every ?? 15;
    this.dialogue = p.dialogue ?? {};
    this.farewell = p.farewell ?? "Mind the road.";
    this.engageFor = p.engage_for ?? 20;
  }

  onTick(npc: Entity, _world: World, bus: EventBus, tick: number) {
    this.lastTick = tick;
    // Pause ambient chatter while engaged.
    if (tick < this.engagedUntil) return;
    if (!this.ambient.length) return;
    if (tick - this.lastAmbient < this.ambientEvery) return;
    if (Math.random() < 0.33) {
      this.lastAmbient = tick;
      const text = this.ambient[Math.floor(Math.random() * this.ambient.length)];
      bus.emit({
        kind: "entity.spoke",
        room: npc.room,
        actor: npc.id,
        data: { text, ambient: true },
      });
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

registerBrain("scripted", (p) => new ScriptedBrain(p as Params));
