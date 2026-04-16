import type { Brain } from "./base";
import { registerBrain } from "./base";
import type { Entity } from "../world";
import type { EventBus } from "../events";
import type { World } from "../world";

interface Params {
  aggro_after?: number;
}

class HostileMobBrain implements Brain {
  private aggroAfter: number;
  private seenSince: Record<string, number> = {};

  constructor(p: Params) {
    this.aggroAfter = p.aggro_after ?? 1;
  }

  onTick(npc: Entity, world: World, bus: EventBus, tick: number) {
    if (npc.dead) return;
    if (npc.combatTarget) {
      const t = world.entities[npc.combatTarget];
      if (t && t.room === npc.room && !t.dead) return;
      npc.combatTarget = null;
    }
    const ids = Array.from(world.occupants[npc.room] ?? []).filter((i) => i !== npc.id);
    if (!ids.length) return;
    let victim: string | null = null;
    for (const vid of ids) {
      const ent = world.entities[vid];
      if (ent && ent.kind === "player") {
        victim = vid;
        break;
      }
    }
    if (!victim) return;
    if (this.seenSince[victim] === undefined) this.seenSince[victim] = tick;
    if (tick - this.seenSince[victim] >= this.aggroAfter) {
      npc.combatTarget = victim;
      bus.emit({ kind: "combat.engaged", room: npc.room, actor: npc.id, target: victim });
    }
  }
}

registerBrain("hostile_mob", (p) => new HostileMobBrain(p as Params));
