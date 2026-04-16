import { DIR_SHORT, normalizeDir } from "./types";

export interface Item {
  id: string;
  name: string;
  desc?: string;
  weight?: number;
  takeable?: boolean;
  value?: number;
  damage?: number;
}

export interface Room {
  id: string;
  name: string;
  desc: string;
  exits: Record<string, string>;
  items: string[];
}

export interface Entity {
  id: string;
  name: string;
  desc?: string;
  kind: "player" | "npc" | "mob";
  room: string;
  homeRoom: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  xp: number;
  inventory: string[];
  brain?: import("./brains/base").Brain;
  dead?: boolean;
  respawnAt?: number;
  combatTarget?: string | null;
}

export class World {
  rooms: Record<string, Room> = {};
  items: Record<string, Item> = {};
  occupants: Record<string, Set<string>> = {};
  entities: Record<string, Entity> = {};

  addOccupant(rid: string, eid: string) {
    (this.occupants[rid] ??= new Set()).add(eid);
  }
  removeOccupant(rid: string, eid: string) {
    this.occupants[rid]?.delete(eid);
  }
  occupantsIn(rid: string): Entity[] {
    return Array.from(this.occupants[rid] ?? [])
      .map((id) => this.entities[id])
      .filter(Boolean);
  }
  getRoom(rid: string): Room {
    return this.rooms[rid];
  }
  pickUpItem(rid: string, iid: string): Item | null {
    const room = this.rooms[rid];
    if (!room) return null;
    const i = room.items.indexOf(iid);
    if (i < 0) return null;
    room.items.splice(i, 1);
    return this.items[iid] ?? null;
  }
  dropItem(rid: string, iid: string) {
    this.rooms[rid].items.push(iid);
  }
}

export { DIR_SHORT, normalizeDir };
