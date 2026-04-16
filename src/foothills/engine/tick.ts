import type { World } from "./world";
import type { EventBus } from "./events";
import type { Player } from "./player";
import type { Emit } from "./types";
import { resolveCombatTick } from "./combat";

export class GameClock {
  world: World;
  bus: EventBus;
  getPlayer: () => Player;
  emit: Emit;
  tickMs: number;
  tickCount = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(world: World, bus: EventBus, getPlayer: () => Player, emit: Emit, tickMs = 2000) {
    this.world = world;
    this.bus = bus;
    this.getPlayer = getPlayer;
    this.emit = emit;
    this.tickMs = tickMs;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    this.tickCount++;
    try {
      // respawn
      for (const ent of Object.values(this.world.entities)) {
        if (ent.dead && ent.respawnAt && this.tickCount >= ent.respawnAt) {
          ent.dead = false;
          ent.hp = ent.maxHp;
          this.world.addOccupant(ent.homeRoom, ent.id);
          ent.room = ent.homeRoom;
          this.bus.emit({ kind: "entity.respawned", room: ent.room, actor: ent.id });
        }
      }
      // brains
      for (const ent of Object.values(this.world.entities)) {
        if (ent.dead || !ent.brain) continue;
        try {
          await ent.brain.onTick(ent, this.world, this.bus, this.tickCount);
        } catch {
          // swallow — a brain shouldn't crash the clock
        }
      }
      // combat
      resolveCombatTick(this.world, this.bus, this.getPlayer(), this.emit, this.tickCount);
    } catch {
      // keep the clock alive
    }
  }
}
