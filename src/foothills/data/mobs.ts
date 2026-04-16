import type { BrainSpec } from "../engine/brains";

export interface MobTemplate {
  id: string;
  name: string;
  desc: string;
  hp: number;
  attack: number;
  defense: number;
  xp: number;
  drops?: string[];
}

export interface MobSpawn {
  id: string;
  template: string;
  room: string;
  brain: BrainSpec;
}

export const MOB_TEMPLATES: MobTemplate[] = [
  { id: "giant_rat",    name: "giant rat",    desc: "A waist-high rat with yellow teeth and a bald, scabbed tail.", hp: 6,  attack: 2, defense: 0, xp: 5,  drops: ["tarnished_coin"] },
  { id: "goblin",       name: "goblin",       desc: "A small green-skinned creature in ill-fitting leather. It grins at you.", hp: 10, attack: 3, defense: 1, xp: 10, drops: ["iron_dagger"] },
  { id: "cave_bat",     name: "cave bat",     desc: "A leathery, red-eyed bat the size of a dog.", hp: 5,  attack: 2, defense: 0, xp: 4 },
  { id: "tomb_wight",   name: "tomb wight",   desc: "A robed figure, dry as old parchment. Its eyes are empty sockets.", hp: 18, attack: 5, defense: 3, xp: 25, drops: ["brass_key", "healing_herb"] },
  { id: "mountain_wolf",name: "mountain wolf",desc: "A lean grey wolf, its coat matted with frost.", hp: 14, attack: 4, defense: 1, xp: 18 },
];

export const MOB_SPAWNS: MobSpawn[] = [
  { id: "rat_cellar",  template: "giant_rat",     room: "wine_cellar",    brain: { type: "hostile_mob", params: { aggro_after: 1 } } },
  { id: "rat_inn",     template: "giant_rat",     room: "inn_cellar",     brain: { type: "hostile_mob", params: { aggro_after: 1 } } },
  { id: "goblin_hut",  template: "goblin",        room: "hunters_hut",    brain: { type: "hostile_mob", params: { aggro_after: 2 } } },
  { id: "bat_cave",    template: "cave_bat",      room: "hidden_cave",    brain: { type: "hostile_mob", params: { aggro_after: 1 } } },
  { id: "wight_tomb",  template: "tomb_wight",    room: "tomb",           brain: { type: "hostile_mob", params: { aggro_after: 1 } } },
  { id: "wolf_pass",   template: "mountain_wolf", room: "mountain_pass",  brain: { type: "hostile_mob", params: { aggro_after: 1 } } },
];
