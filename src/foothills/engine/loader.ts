import type { Entity } from "./world";
import { World, normalizeDir } from "./world";
import type { BrainSpec } from "./brains";
import { ITEMS } from "../data/items";
import { ROOMS } from "../data/rooms";
import { MOB_TEMPLATES, MOB_SPAWNS } from "../data/mobs";
import { NPCS } from "../data/npcs";

/** Returns the world plus a map of `entityId -> BrainSpec` so the caller
 *  can build Brain instances (avoids import cycles). */
export function loadWorld(): { world: World; brainSpecs: Record<string, BrainSpec> } {
  const world = new World();

  for (const it of ITEMS) world.items[it.id] = { ...it };

  for (const r of ROOMS) {
    const exits: Record<string, string> = {};
    for (const [d, rid] of Object.entries(r.exits ?? {})) {
      const nd = normalizeDir(d) ?? d;
      exits[nd] = rid;
    }
    world.rooms[r.id] = {
      id: r.id,
      name: r.name,
      desc: r.desc,
      exits,
      items: [...(r.items ?? [])],
    };
  }

  const specs: Record<string, BrainSpec> = {};
  const templates: Record<string, (typeof MOB_TEMPLATES)[number]> = {};
  for (const t of MOB_TEMPLATES) templates[t.id] = t;

  for (const spawn of MOB_SPAWNS) {
    const tpl = templates[spawn.template];
    if (!tpl) continue;
    const ent: Entity = {
      id: spawn.id,
      name: tpl.name,
      desc: tpl.desc,
      kind: "mob",
      room: spawn.room,
      homeRoom: spawn.room,
      hp: tpl.hp,
      maxHp: tpl.hp,
      attack: tpl.attack,
      defense: tpl.defense,
      xp: tpl.xp,
      inventory: [...(tpl.drops ?? [])],
      dead: false,
      combatTarget: null,
    };
    world.entities[ent.id] = ent;
    world.addOccupant(ent.room, ent.id);
    specs[ent.id] = spawn.brain;
  }

  for (const n of NPCS) {
    const ent: Entity = {
      id: n.id,
      name: n.name,
      desc: n.desc,
      kind: "npc",
      room: n.room,
      homeRoom: n.room,
      hp: n.hp,
      maxHp: n.hp,
      attack: n.attack ?? 1,
      defense: n.defense ?? 2,
      xp: 0,
      inventory: [],
      dead: false,
      combatTarget: null,
    };
    world.entities[ent.id] = ent;
    world.addOccupant(ent.room, ent.id);
    specs[ent.id] = n.brain;
  }

  return { world, brainSpecs: specs };
}
