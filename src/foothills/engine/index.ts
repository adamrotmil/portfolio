// Public entry for the engine used by the React terminal.
import { World } from "./world";
import type { Entity } from "./world";
import { EventBus } from "./events";
import { buildBrain, type BrainSpec } from "./brains";
import { loadWorld } from "./loader";
import type { Player } from "./player";
import { Commands, describeRoom } from "./commands";
import { GameClock } from "./tick";
import type { Emit, Line } from "./types";
import { seg, L } from "./types";

export type { Line, Segment, Color } from "./types";
export type { Player } from "./player";
export { levelForXp } from "./player";

export interface GameHandle {
  world: World;
  bus: EventBus;
  player: Player;
  commands: Commands;
  clock: GameClock;
  dispatch(line: string): Promise<void>;
  stop(): void;
}

export function startGame(name: string, emit: Emit): GameHandle {
  const { world, brainSpecs } = loadWorld();
  for (const [eid, spec] of Object.entries(brainSpecs)) {
    const ent = world.entities[eid];
    if (ent) ent.brain = buildBrain(spec as BrainSpec);
  }
  const player: Player = {
    id: "player_self",
    name,
    kind: "player",
    room: "narrow_road",
    homeRoom: "narrow_road",
    hp: 20,
    maxHp: 20,
    attack: 3,
    defense: 0,
    xp: 0,
    playerXp: 0,
    gold: 10,
    wielded: null,
    inventory: [],
    dead: false,
    combatTarget: null,
    desc: "That would be you.",
  };
  (world.entities as Record<string, Entity>)[player.id] = player;
  world.addOccupant(player.room, player.id);

  const bus = new EventBus();
  const commands = new Commands({ world, player, bus, emit });

  bus.on("*", (e) => {
    if (e.kind === "ui.clear") return; // terminal handles this directly via command
    if (e.room && e.room !== player.room) return;
    const actor = e.actor ? world.entities[e.actor] : null;
    const actorName = actor?.name ?? (e.actor ?? "");
    switch (e.kind) {
      case "entity.spoke": {
        if (e.actor === player.id) return;
        const text = (e.data?.text as string) ?? "";
        if (e.data?.ambient) {
          emit([seg.whisper(`${actorName} mutters, "${text}"`)]);
        } else {
          const tag = actor?.kind === "npc" ? seg.npc : seg.player;
          emit(L(tag(actorName), ` says, "${text}"`));
        }
        return;
      }
      case "entity.emoted": {
        emit([seg.whisper(`${actorName} ${(e.data?.text as string) ?? ""}.`)]);
        return;
      }
      case "entity.arrived": {
        if (e.actor === player.id || !actor) return;
        const tag =
          actor.kind === "mob" ? seg.mob :
          actor.kind === "npc" ? seg.npc : seg.player;
        emit([seg.muted(""), tag(actorName), seg.muted(" arrives.")]);
        return;
      }
      case "entity.moved": {
        if (e.actor === player.id || !actor) return;
        if (e.room === player.room) {
          const tag =
            actor.kind === "mob" ? seg.mob :
            actor.kind === "npc" ? seg.npc : seg.player;
          const dir = (e.data?.dir as string) ?? "";
          emit([tag(actorName), seg.muted(` leaves ${dir}.`)]);
        }
        return;
      }
      case "combat.engaged":
        if (e.actor !== player.id && e.target === player.id) {
          emit([seg.damage(`${actorName} attacks you!`)]);
        }
        return;
    }
  });

  const clock = new GameClock(world, bus, () => player, emit, 2000);
  clock.start();

  return {
    world,
    bus,
    player,
    commands,
    clock,
    dispatch: (line) => commands.dispatch(line),
    stop: () => clock.stop(),
  };
}

export { describeRoom };
