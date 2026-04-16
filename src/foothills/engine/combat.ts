import type { Entity } from "./world";
import type { World } from "./world";
import type { EventBus } from "./events";
import type { Player } from "./player";
import type { Emit } from "./types";
import { seg } from "./types";

function roll(base: number): number {
  return Math.max(1, base + Math.floor(Math.random() * 4) - 1);
}

function swing(attacker: Entity, defender: Entity): { dmg: number; killed: boolean } {
  const dmg = roll(attacker.attack - Math.floor(defender.defense / 2));
  defender.hp -= dmg;
  return { dmg, killed: defender.hp <= 0 };
}

export function resolveCombatTick(world: World, bus: EventBus, player: Player, emit: Emit, tick: number) {
  // Player attacks their target
  const targetId = player.combatTarget;
  if (targetId) {
    const target = world.entities[targetId];
    if (!target || target.dead || target.room !== player.room) {
      player.combatTarget = null;
    } else {
      const { dmg, killed } = swing(player, target);
      emit([seg.damage("You hit "), seg.mob(target.name), seg.damage(` for ${dmg} damage.`)]);
      bus.emit({ kind: "combat.hit", room: player.room, actor: player.id, target: target.id, data: { dmg } });
      if (killed) {
        target.dead = true;
        world.removeOccupant(target.room, target.id);
        target.respawnAt = tick + 20;
        emit([seg.mob(target.name), { text: " " }, seg.damage("falls dead.")]);
        if (target.xp) {
          player.playerXp += target.xp;
          emit([seg.heal(`+${target.xp} XP.`)]);
        }
        for (const iid of target.inventory) world.dropItem(target.room, iid);
        target.inventory = [];
        bus.emit({ kind: "entity.died", room: target.room, actor: player.id, target: target.id });
        player.combatTarget = null;
      }
    }
  }
  // Mobs attacking the player
  for (const ent of Object.values(world.entities)) {
    if (ent.dead || ent.kind !== "mob") continue;
    if (ent.room !== player.room) continue;
    if (ent.combatTarget !== player.id) continue;
    const { dmg, killed } = swing(ent, player);
    emit([seg.mob(ent.name), { text: " " }, seg.damage(`hits you for ${dmg}.`)]);
    bus.emit({ kind: "combat.hit", room: player.room, actor: ent.id, target: player.id, data: { dmg } });
    if (killed) {
      emit([seg.warning("You collapse.  The world goes dark...")]);
      player.hp = player.maxHp;
      world.removeOccupant(player.room, player.id);
      player.room = player.homeRoom || player.room;
      world.addOccupant(player.room, player.id);
      ent.combatTarget = null;
      player.combatTarget = null;
      emit([seg.warning("You wake up on the narrow road, dazed but alive.")]);
      bus.emit({ kind: "player.respawned", room: player.room, actor: player.id });
      return;
    }
  }
}
