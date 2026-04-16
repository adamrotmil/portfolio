import type { Entity, World } from "./world";
import type { EventBus } from "./events";
import type { Player } from "./player";
import type { Emit, Line, Segment } from "./types";
import { DIR_SHORT, normalizeDir, seg, L } from "./types";
import { levelForXp } from "./player";

export function describeRoom(world: World, player: Player): Line[] {
  const room = world.getRoom(player.room);
  if (!room) return [[seg.muted("You are nowhere in particular.")]];
  const lines: Line[] = [];
  lines.push([seg.name(room.name)]);
  lines.push([seg.desc(room.desc)]);
  const exits = Object.keys(room.exits).map((d) => DIR_SHORT[d] ?? d).sort().join(", ") || "none";
  lines.push([seg.exits(`Exits: ${exits}`)]);
  if (room.items.length) {
    const parts: Segment[] = [{ text: "You see: " }];
    room.items.forEach((iid, i) => {
      const it = world.items[iid];
      parts.push(seg.item(it?.name ?? iid));
      parts.push({ text: i === room.items.length - 1 ? "." : ", " });
    });
    lines.push(parts);
  }
  const occ = world.occupantsIn(room.id).filter((e) => e.id !== player.id);
  for (const e of occ) {
    if (e.dead) continue;
    const tag = e.kind === "mob" ? seg.mob : e.kind === "npc" ? seg.npc : seg.player;
    lines.push(L(tag(e.name), " is here."));
  }
  return lines;
}

export interface CommandsCtx {
  world: World;
  player: Player;
  bus: EventBus;
  emit: Emit;
}

type Handler = (args: string[]) => void | Promise<void>;

export class Commands {
  private handlers: Record<string, Handler> = {};
  quitRequested = false;
  readonly world: World;
  readonly player: Player;
  readonly bus: EventBus;
  readonly emit: Emit;

  constructor(ctx: CommandsCtx) {
    this.world = ctx.world;
    this.player = ctx.player;
    this.bus = ctx.bus;
    this.emit = ctx.emit;
    this.register();
  }

  private register() {
    const R = this.handlers;
    R["look"] = R["l"] = (a) => this.cmdLook(a);
    R["go"] = (a) => this.cmdMove(a);
    R["inv"] = R["inventory"] = R["i"] = () => this.cmdInv();
    R["get"] = R["take"] = (a) => this.cmdGet(a);
    R["drop"] = (a) => this.cmdDrop(a);
    R["examine"] = R["ex"] = R["exam"] = (a) => this.cmdExamine(a);
    R["attack"] = R["kill"] = R["k"] = (a) => this.cmdAttack(a);
    R["flee"] = () => this.cmdFlee();
    R["say"] = (a) => this.cmdSay(a);
    R["talk"] = (a) => this.cmdTalk(a);
    R["who"] = () => this.cmdWho();
    R["help"] = R["?"] = () => this.cmdHelp();
    R["wield"] = (a) => this.cmdWield(a);
    R["unwield"] = () => this.cmdUnwield();
    R["score"] = R["stat"] = () => this.cmdScore();
    R["quit"] = R["exit"] = () => this.cmdQuit();
    R["clear"] = () => this.cmdClear();
  }

  async dispatch(line: string) {
    const text = line.trim();
    if (!text) return;
    const parts = text.split(/\s+/);
    const verb = parts[0].toLowerCase();
    const args = parts.slice(1);
    // Movement shortcuts
    const dir = normalizeDir(verb);
    if (dir) return this.cmdMove([dir]);
    const fn = this.handlers[verb];
    if (!fn) {
      this.emit([seg.muted("I don't understand that. Try 'help'.")]);
      return;
    }
    await fn(args);
  }

  private cmdLook(args: string[]) {
    if (!args.length) {
      describeRoom(this.world, this.player).forEach((l) => this.emit(l));
      return;
    }
    this.cmdExamine(args);
  }

  private cmdMove(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Go where?")]);
    const dir = normalizeDir(args[0]);
    const room = this.world.getRoom(this.player.room);
    if (!dir || !(dir in room.exits)) return this.emit([seg.muted("You can't go that way.")]);
    const old = this.player.room;
    const next = room.exits[dir];
    this.world.removeOccupant(old, this.player.id);
    this.player.room = next;
    this.world.addOccupant(next, this.player.id);
    this.bus.emit({ kind: "entity.moved", room: old, actor: this.player.id, data: { dir, to: next } });
    this.bus.emit({ kind: "entity.arrived", room: next, actor: this.player.id, data: { from: old } });
    this.player.combatTarget = null;
    describeRoom(this.world, this.player).forEach((l) => this.emit(l));
  }

  private cmdInv() {
    if (!this.player.inventory.length) return this.emit([seg.muted("You are carrying nothing.")]);
    this.emit("You are carrying:");
    for (const iid of this.player.inventory) {
      const it = this.world.items[iid];
      const suffix = this.player.wielded === iid ? " (wielded)" : "";
      this.emit(L("  - ", seg.item(it?.name ?? iid), suffix));
    }
    if (this.player.gold) this.emit([seg.muted(`  (${this.player.gold} gold coins)`)]);
  }

  private cmdGet(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Get what?")]);
    const name = args.join(" ").toLowerCase();
    const room = this.world.getRoom(this.player.room);
    for (const iid of [...room.items]) {
      const it = this.world.items[iid];
      if (it && (it.name.toLowerCase().includes(name) || name === iid)) {
        if (it.takeable === false) return this.emit([seg.muted(`The ${it.name} can't be taken.`)]);
        this.world.pickUpItem(room.id, iid);
        this.player.inventory.push(iid);
        this.emit(L("You pick up the ", seg.item(it.name), "."));
        this.bus.emit({ kind: "entity.took_item", room: room.id, actor: this.player.id, data: { item: iid } });
        return;
      }
    }
    this.emit([seg.muted("You don't see that here.")]);
  }

  private cmdDrop(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Drop what?")]);
    const name = args.join(" ").toLowerCase();
    for (const iid of [...this.player.inventory]) {
      const it = this.world.items[iid];
      if (it && (it.name.toLowerCase().includes(name) || name === iid)) {
        this.player.inventory = this.player.inventory.filter((x) => x !== iid);
        this.world.dropItem(this.player.room, iid);
        if (this.player.wielded === iid) this.player.wielded = null;
        this.emit(L("You drop the ", seg.item(it.name), "."));
        return;
      }
    }
    this.emit([seg.muted("You don't have that.")]);
  }

  private cmdExamine(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Examine what?")]);
    const name = args.join(" ").toLowerCase();
    const room = this.world.getRoom(this.player.room);
    for (const iid of [...room.items, ...this.player.inventory]) {
      const it = this.world.items[iid];
      if (it && (it.name.toLowerCase().includes(name) || name === iid)) {
        this.emit([seg.item(it.name)]);
        this.emit([seg.desc(it.desc ?? "You see nothing special about it.")]);
        return;
      }
    }
    for (const e of this.world.occupantsIn(room.id)) {
      if (e.name.toLowerCase().includes(name) || name === e.id) {
        const tag = e.kind === "mob" ? seg.mob : e.kind === "npc" ? seg.npc : seg.player;
        this.emit([tag(e.name)]);
        if (e.desc) this.emit([seg.desc(e.desc)]);
        this.emit([seg.muted(`hp ${e.hp}/${e.maxHp}`)]);
        return;
      }
    }
    this.emit([seg.muted("You don't see that here.")]);
  }

  private cmdAttack(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Attack what?")]);
    const name = args.join(" ").toLowerCase();
    for (const e of this.world.occupantsIn(this.player.room)) {
      if (e.id === this.player.id || e.dead) continue;
      if (e.name.toLowerCase().includes(name) || name === e.id) {
        if (e.kind === "npc") return this.emit([seg.muted(`${e.name} is peaceful. You wouldn't.`)]);
        this.player.combatTarget = e.id;
        e.combatTarget = this.player.id;
        this.emit([seg.damage(`You lunge at ${e.name}!`)]);
        this.bus.emit({ kind: "combat.engaged", room: this.player.room, actor: this.player.id, target: e.id });
        return;
      }
    }
    this.emit([seg.muted("You don't see that here.")]);
  }

  private cmdFlee() {
    const room = this.world.getRoom(this.player.room);
    const dirs = Object.keys(room.exits);
    if (!dirs.length) return this.emit([seg.muted("There's nowhere to flee to!")]);
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    this.player.combatTarget = null;
    for (const ent of Object.values(this.world.entities)) {
      if (ent.combatTarget === this.player.id) ent.combatTarget = null;
    }
    this.emit([seg.warning(`You flee ${dir}!`)]);
    this.cmdMove([dir]);
  }

  private async cmdSay(args: string[]) {
    const text = args.join(" ").trim();
    if (!text) return this.emit([seg.muted("Say what?")]);
    this.bus.emit({ kind: "entity.spoke", room: this.player.room, actor: this.player.id, data: { text } });
    this.emit(`You say, "${text}"`);
    // Let every NPC in the room respond if they care to.
    for (const e of this.world.occupantsIn(this.player.room)) {
      if (e.kind !== "npc" || !e.brain?.onSpeech) continue;
      const reply = await e.brain.onSpeech(e, this.player, text, this.world, this.bus);
      this.emitNpcReply(e, reply, this.player.id);
    }
  }

  /** Turn an NPC dialogue reply (string | string[]) into a sequence of bus
   *  events — `*emotes*` become `entity.emoted`, everything else is speech.
   *  Embedded `\n` within a string splits that string into multiple lines. */
  private emitNpcReply(
    npc: Entity,
    reply: string | string[] | null | undefined,
    to: string | null,
  ): void {
    if (!reply) return;
    const input = Array.isArray(reply) ? reply : [reply];
    for (const piece of input) {
      if (piece == null) continue;
      for (const raw of String(piece).split("\n")) {
        const line = raw.trim();
        if (!line) continue;
        const emote = line.match(/^\*(.+)\*$/);
        if (emote) {
          this.bus.emit({
            kind: "entity.emoted",
            room: npc.room,
            actor: npc.id,
            data: { text: emote[1].trim() },
          });
        } else {
          this.bus.emit({
            kind: "entity.spoke",
            room: npc.room,
            actor: npc.id,
            data: { text: line, to: to ?? undefined },
          });
        }
      }
    }
  }

  private async cmdTalk(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Talk to whom?")]);
    const targetName = args[0].toLowerCase();
    let rest = args.slice(1);
    if (rest[0]?.toLowerCase() === "about") rest = rest.slice(1);
    const text = rest.join(" ");
    let npc = null;
    for (const e of this.world.occupantsIn(this.player.room)) {
      if (e.kind !== "npc") continue;
      if (e.name.toLowerCase().includes(targetName) || targetName === e.id) {
        npc = e;
        break;
      }
    }
    if (!npc || !npc.brain?.onSpeech) return this.emit([seg.muted("They don't seem interested.")]);
    const reply = await npc.brain.onSpeech(npc, this.player, text, this.world, this.bus);
    this.emitNpcReply(npc, reply, this.player.id);
  }

  private cmdWho() {
    this.emit([seg.system("[Players and folk currently in the world]")]);
    this.emit(L("  - ", seg.player(this.player.name), " (you) — ", this.roomName(this.player.room)));
    const sorted = Object.values(this.world.entities).sort((a, b) => a.name.localeCompare(b.name));
    for (const e of sorted) {
      if (e.kind === "mob" || e.dead || e.id === this.player.id) continue;
      const tag = e.kind === "npc" ? seg.npc : seg.player;
      this.emit(L("  - ", tag(e.name), " — ", this.roomName(e.room)));
    }
  }

  private cmdWield(args: string[]) {
    if (!args.length) return this.emit([seg.muted("Wield what?")]);
    const name = args.join(" ").toLowerCase();
    for (const iid of this.player.inventory) {
      const it = this.world.items[iid];
      if (it && (it.name.toLowerCase().includes(name) || name === iid)) {
        if (!it.damage || it.damage <= 0) return this.emit([seg.muted(`The ${it.name} isn't a weapon.`)]);
        this.player.wielded = iid;
        const base = 2 + levelForXp(this.player.playerXp);
        this.player.attack = base + it.damage;
        this.emit(L("You wield the ", seg.item(it.name), "."));
        return;
      }
    }
    this.emit([seg.muted("You don't have that.")]);
  }

  private cmdUnwield() {
    if (!this.player.wielded) return this.emit([seg.muted("You aren't wielding anything.")]);
    this.player.wielded = null;
    this.player.attack = 2 + levelForXp(this.player.playerXp);
    this.emit("You put your weapon away.");
  }

  private cmdScore() {
    const lvl = levelForXp(this.player.playerXp);
    this.emit(
      L(
        seg.player(this.player.name),
        ` — level ${lvl} — hp ${this.player.hp}/${this.player.maxHp} — xp ${this.player.playerXp} — gold ${this.player.gold}`,
      ),
    );
  }

  private cmdQuit() {
    this.quitRequested = true;
    this.emit([seg.system("Farewell.")]);
  }

  private cmdClear() {
    // Signal to the UI to clear — use a special event; default emits a marker line.
    this.bus.emit({ kind: "ui.clear" });
  }

  private cmdHelp() {
    const rows = [
      "Commands:",
      "  look / l          examine the room",
      "  n s e w u d       move (also: north, south, east, west, up, down)",
      "  go <dir>          same",
      "  inv / i           inventory",
      "  get / drop <it>   pick up / put down",
      "  examine <thing>   inspect",
      "  attack <mob>      begin combat (auto-ticks)",
      "  flee              run a random direction",
      "  wield <item>      equip a weapon",
      "  say <text>        speak aloud",
      "  talk <npc> [about <topic>|<text>]   converse",
      "  who / score       world roster / your stats",
      "  clear / quit / help",
    ];
    rows.forEach((r) => this.emit(r));
  }

  private roomName(rid: string) {
    return this.world.rooms[rid]?.name ?? rid;
  }
}
