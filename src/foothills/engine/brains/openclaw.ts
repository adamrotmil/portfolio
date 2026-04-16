// OpenClaw brain — hook point for an agent-driven NPC.
//
// Subclass and override `decide(view, events)` with an agent call.
// The base + a demo variant are registered so the data file can reference them.
import type { Brain } from "./base";
import { registerBrain } from "./base";
import type { Entity } from "../world";
import type { EventBus, GameEvent } from "../events";
import type { World } from "../world";
import { normalizeDir } from "../types";

export type Intent =
  | { type: "wait" }
  | { type: "say"; text: string }
  | { type: "emote"; text: string }
  | { type: "move"; dir: string }
  | { type: "attack"; target: string }
  | { type: "get"; item: string }
  | { type: "drop"; item: string };

type EntityKind = "player" | "npc" | "mob";

export interface View {
  self: { id: string; name: string; hp: number; max_hp: number; room: string; inventory: string[]; kind: EntityKind };
  room: {
    id: string;
    name: string;
    desc: string;
    exits: Record<string, string>;
    items: string[];
    occupants: { id: string; name: string; kind: EntityKind }[];
  };
  tick: number;
  recent_speech: { speaker: string; text: string }[];
  persona: string;
  goal: string;
}

interface Params {
  act_every?: number;
  persona?: string;
  goal?: string;
}

export class OpenClawBrain implements Brain {
  protected actEvery: number;
  protected persona: string;
  protected goal: string;
  private lastAct = 0;
  private recentSpeech: { speaker: string; text: string }[] = [];

  constructor(p: Params = {}) {
    this.actEvery = p.act_every ?? 5;
    this.persona = p.persona ?? "a quiet wanderer";
    this.goal = p.goal ?? "explore the foothills";
  }

  /** Override this to call your agent. */
  async decide(_view: View, _events: GameEvent[]): Promise<Intent> {
    return { type: "wait" };
  }

  onSpeech(_npc: Entity, speaker: Entity, text: string) {
    this.recentSpeech.push({ speaker: speaker.name, text });
    if (this.recentSpeech.length > 8) this.recentSpeech.shift();
    return `(${this.persona} studies you thoughtfully.)`;
  }

  async onTick(npc: Entity, world: World, bus: EventBus, tick: number) {
    if (tick - this.lastAct < this.actEvery) return;
    this.lastAct = tick;
    const view = this.buildView(npc, world, tick);
    const recent = bus.recent.slice(-8);
    const intent = await this.decide(view, recent);
    if (!intent || intent.type === "wait") return;
    await this.execute(npc, intent, world, bus);
  }

  private buildView(npc: Entity, world: World, tick: number): View {
    const room = world.rooms[npc.room];
    const occ = Array.from(world.occupants[npc.room] ?? [])
      .filter((id) => id !== npc.id)
      .map((id) => {
        const e = world.entities[id];
        return e ? { id: e.id, name: e.name, kind: e.kind } : null;
      })
      .filter((x): x is { id: string; name: string; kind: EntityKind } => !!x);
    return {
      self: {
        id: npc.id,
        name: npc.name,
        hp: npc.hp,
        max_hp: npc.maxHp,
        room: npc.room,
        inventory: [...npc.inventory],
        kind: npc.kind,
      },
      room: {
        id: room?.id ?? npc.room,
        name: room?.name ?? "",
        desc: room?.desc ?? "",
        exits: { ...(room?.exits ?? {}) },
        items: [...(room?.items ?? [])],
        occupants: occ,
      },
      tick,
      recent_speech: [...this.recentSpeech],
      persona: this.persona,
      goal: this.goal,
    };
  }

  private async execute(npc: Entity, intent: Intent, world: World, bus: EventBus) {
    switch (intent.type) {
      case "say":
        if (intent.text?.trim()) {
          bus.emit({ kind: "entity.spoke", room: npc.room, actor: npc.id, data: { text: intent.text.trim() } });
        }
        return;
      case "emote":
        if (intent.text?.trim()) {
          bus.emit({ kind: "entity.emoted", room: npc.room, actor: npc.id, data: { text: intent.text.trim() } });
        }
        return;
      case "move": {
        const dir = normalizeDir(intent.dir ?? "") ?? "";
        const room = world.rooms[npc.room];
        if (room && dir in room.exits) {
          const old = npc.room;
          npc.room = room.exits[dir];
          world.removeOccupant(old, npc.id);
          world.addOccupant(npc.room, npc.id);
          bus.emit({ kind: "entity.moved", room: old, actor: npc.id, data: { dir, to: npc.room } });
          bus.emit({ kind: "entity.arrived", room: npc.room, actor: npc.id, data: { from: old } });
        }
        return;
      }
      case "attack": {
        const target = (intent.target ?? "").toLowerCase();
        for (const eid of world.occupants[npc.room] ?? []) {
          const ent = world.entities[eid];
          if (ent && (ent.id === target || ent.name.toLowerCase() === target)) {
            npc.combatTarget = ent.id;
            bus.emit({ kind: "combat.engaged", room: npc.room, actor: npc.id, target: ent.id });
            break;
          }
        }
        return;
      }
      case "get": {
        const item = world.pickUpItem(npc.room, intent.item);
        if (item) {
          npc.inventory.push(intent.item);
          bus.emit({ kind: "entity.took_item", room: npc.room, actor: npc.id, data: { item: intent.item } });
        }
        return;
      }
      case "drop": {
        const i = npc.inventory.indexOf(intent.item);
        if (i >= 0) {
          npc.inventory.splice(i, 1);
          world.dropItem(npc.room, intent.item);
          bus.emit({ kind: "entity.dropped_item", room: npc.room, actor: npc.id, data: { item: intent.item } });
        }
        return;
      }
    }
  }
}

registerBrain("openclaw", (p) => new OpenClawBrain(p as Params));

// Demo subclass so you can see the seam work without an agent wired up.
class OpenClawDemoBrain extends OpenClawBrain {
  override async decide(view: View): Promise<Intent> {
    const options: Intent[] = [
      { type: "wait" },
      { type: "emote", text: "hums an old tune" },
      { type: "say", text: "the mountains whisper, if you listen" },
    ];
    const exits = Object.keys(view.room.exits);
    if (exits.length && Math.random() < 0.3) {
      options.push({ type: "move", dir: exits[Math.floor(Math.random() * exits.length)] });
    }
    return options[Math.floor(Math.random() * options.length)];
  }
}

registerBrain("openclaw_demo", (p) => new OpenClawDemoBrain(p as Params));
