import type { Item } from "../engine/world";

export const ITEMS: Item[] = [
  { id: "rusty_sword",    name: "rusty sword",    desc: "An old iron sword, pitted with rust but still serviceable.", weight: 3, value: 5, damage: 3 },
  { id: "oak_staff",      name: "oak staff",      desc: "A smoothed length of oak, its butt-cap wrapped in dark leather.", weight: 2, value: 8, damage: 2 },
  { id: "iron_dagger",    name: "iron dagger",    desc: "A short blade with a bone grip. Quick in the hand.", weight: 1, value: 12, damage: 4 },
  { id: "healing_herb",   name: "healing herb",   desc: "A small cluster of pale green leaves, faintly fragrant.", weight: 0, value: 3 },
  { id: "brass_key",      name: "brass key",      desc: "A small brass key, warm to the touch.", weight: 0, value: 0 },
  { id: "tarnished_coin", name: "tarnished coin", desc: "An unfamiliar coin stamped with a sunburst.", weight: 0, value: 1 },
  { id: "wool_cloak",     name: "wool cloak",     desc: "A thick wool cloak, the color of damp moss.", weight: 2, value: 6 },
  { id: "leather_pouch",  name: "leather pouch",  desc: "A small pouch stitched from deer hide.", weight: 0, value: 2 },
  { id: "lantern",        name: "brass lantern",  desc: "A hooded brass lantern. It is lit, though the flame is steady.", weight: 2, value: 10 },
  { id: "apple",          name: "red apple",      desc: "A firm red apple, unbruised.", weight: 0, value: 1 },
  { id: "loaf",           name: "loaf of bread",  desc: "Still warm. Smells of the inn's oven.", weight: 1, value: 2 },
  { id: "parchment",      name: "scrap of parchment", desc: "Scribbled: \"The peak keeps its own counsel. Do not go up alone.\"", weight: 0, value: 0 },
  { id: "gravestone",     name: "weathered gravestone", desc: "The name has worn off. Only a date remains: — 1287.", takeable: false },
  { id: "well",           name: "stone well",     desc: "A cobbled well. Its rope hangs frayed and dark.", takeable: false },
  { id: "hearth",         name: "stone hearth",   desc: "A broad stone hearth; embers glow at its back.", takeable: false },
];
